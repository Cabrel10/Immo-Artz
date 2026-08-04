<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatalogPassword;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Gestion des paiements (Mobile Money simulé / pluggable).
 *
 * Architecture : la classe expose une API "neutre" :
 *   - initiate() : crée un Payment en pending et déclenche un appel au provider (ou simulateur)
 *   - webhook() : reçu du provider — marque le paiement comme complété
 *   - status() : permet au front de polling
 *   - claim() : si paiement OK, l'utilisateur récupère son mot de passe catalogue
 *
 * En mode "sandbox" (PAYMENT_DRIVER=fake), la confirmation est automatique
 * après quelques secondes (signal stocké en cache). Idéal pour les démos & tests.
 *
 * Adaptateurs futurs (à implémenter en dev) : MTN MoMo, Orange Money, Notch Pay,
 * Campay, Flutterwave, CinetPay.
 */
class PaymentController extends Controller
{
    /**
     * Tarif catalogue (en XAF). Override possible via env CATALOG_PRICE.
     */
    private function catalogPrice(): int
    {
        return (int) config('immo.catalog_price', env('CATALOG_PRICE', 2000));
    }

    /**
     * Driver actif : 'fake' (sandbox), 'campay', 'notchpay', 'mtn', 'orange'...
     */
    private function driver(): string
    {
        return (string) env('PAYMENT_DRIVER', 'fake');
    }

    /**
     * Initier un paiement pour acheter l'accès au catalogue.
     *
     * Endpoint public : pas besoin d'être connecté pour acheter (le visiteur cible).
     */
    public function initiateCatalogPayment(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => ['required', 'string', 'regex:/^(?:\+?237)?6[0-9]{8}$/'],
            'provider' => ['required', 'string', 'in:mtn,orange'],
            'email' => ['nullable', 'email', 'max:160'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user(); // peut être null
        $amount = $this->catalogPrice();
        $txId = Payment::generateTransactionId();

        // On lie le paiement au mot de passe ACTIF en cours (ou à créer)
        $catalogPwd = CatalogPassword::getCurrentValid() ?? CatalogPassword::createNew();

        $payment = Payment::create([
            'user_id' => $user?->id,
            'transaction_id' => $txId,
            'type' => 'catalog_access',
            'payable_type' => CatalogPassword::class,
            'payable_id' => $catalogPwd->id,
            'amount' => $amount,
            'currency' => 'XAF',
            'status' => 'pending',
            'payment_method' => $request->provider === 'mtn' ? 'MTN Mobile Money' : 'Orange Money',
            'payment_provider' => $this->driver(),
            'metadata' => [
                'phone' => $this->normalizePhone($request->phone),
                'email' => $request->email,
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ],
        ]);

        // Lancer le paiement chez le provider (ou simulateur)
        $providerResponse = $this->dispatchProvider($payment);

        return response()->json([
            'success' => true,
            'message' => 'Paiement initié. Confirmez sur votre téléphone.',
            'data' => [
                'transaction_id' => $payment->transaction_id,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'provider' => $payment->payment_method,
                'instructions' => $providerResponse['instructions'] ?? null,
                'sandbox' => $this->driver() === 'fake',
                'poll_url' => url('/api/v1/payments/' . $payment->transaction_id . '/status'),
            ],
        ], 201);
    }

    /**
     * Statut d'un paiement (polling depuis le front).
     */
    public function status(Request $request, string $transactionId): JsonResponse
    {
        $payment = Payment::where('transaction_id', $transactionId)->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction introuvable.',
            ], 404);
        }

        // En sandbox/fake : auto-completion après 5 secondes
        if ($this->driver() === 'fake' && $payment->status === 'pending') {
            $createdAgo = now()->diffInSeconds($payment->created_at, absolute: true);
            if ($createdAgo >= 5) {
                $payment->markAsCompleted('FAKE-' . Str::upper(Str::random(10)));
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_id' => $payment->transaction_id,
                'status' => $payment->status,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'is_completed' => $payment->status === 'completed',
            ],
        ]);
    }

    /**
     * Récupérer le mot de passe du catalogue après paiement réussi.
     */
    public function claimCatalog(Request $request, string $transactionId): JsonResponse
    {
        $payment = Payment::where('transaction_id', $transactionId)
            ->where('type', 'catalog_access')
            ->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction introuvable.',
            ], 404);
        }

        if ($payment->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Paiement non confirmé.',
                'data' => ['status' => $payment->status],
            ], 402);
        }

        // Récupérer le mot de passe actif lié (ou actuel)
        $pwd = CatalogPassword::find($payment->payable_id);
        if (!$pwd || !$pwd->is_valid) {
            $pwd = CatalogPassword::getCurrentValid() ?? CatalogPassword::createNew();
        }

        return response()->json([
            'success' => true,
            'message' => 'Voici votre mot de passe catalogue.',
            'data' => [
                'password' => $pwd->password,
                'valid_until' => $pwd->valid_until->toIso8601String(),
                'time_remaining' => $pwd->time_remaining ?? null,
            ],
        ]);
    }

    /**
     * Webhook générique provider (signature à vérifier selon le driver).
     * Format attendu : { transaction_id, status, provider_transaction_id?, signature? }
     */
    public function webhook(Request $request): JsonResponse
    {
        // Signature simple via secret partagé (à durcir par provider en dev)
        $expected = env('PAYMENT_WEBHOOK_SECRET');
        $signature = $request->header('X-Webhook-Signature') ?? $request->input('signature');
        if ($expected && $expected !== $signature) {
            Log::warning('Webhook paiement rejeté (signature invalide)', [
                'ip' => $request->ip(),
                'provider' => $request->input('provider'),
            ]);
            return response()->json(['success' => false, 'message' => 'Signature invalide.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'transaction_id' => ['required', 'string'],
            'status' => ['required', 'in:completed,failed'],
            'provider_transaction_id' => ['nullable', 'string'],
            'reason' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Payload invalide.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payment = Payment::where('transaction_id', $request->transaction_id)->first();
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Paiement introuvable.'], 404);
        }

        if ($request->status === 'completed') {
            $payment->markAsCompleted($request->provider_transaction_id);
        } else {
            $payment->markAsFailed($request->reason);
        }

        return response()->json(['success' => true, 'message' => 'Webhook traité.']);
    }

    /**
     * Sandbox endpoint : force la complétion d'un paiement (uniquement en mode fake).
     */
    public function sandboxComplete(Request $request, string $transactionId): JsonResponse
    {
        if ($this->driver() !== 'fake') {
            return response()->json([
                'success' => false,
                'message' => 'Endpoint sandbox uniquement disponible en mode fake.',
            ], 403);
        }

        $payment = Payment::where('transaction_id', $transactionId)->first();
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Paiement introuvable.'], 404);
        }

        $payment->markAsCompleted('FAKE-FORCED-' . Str::upper(Str::random(8)));

        return response()->json([
            'success' => true,
            'message' => 'Paiement forcé en COMPLETED (sandbox).',
            'data' => ['status' => $payment->fresh()->status],
        ]);
    }

    // ==================== INTERNES ====================

    /**
     * Dispatcher : appelle le provider approprié.
     */
    private function dispatchProvider(Payment $payment): array
    {
        $driver = $this->driver();
        return match ($driver) {
            'fake' => $this->fakeProvider($payment),
            // 'campay' => $this->campayProvider($payment),
            // 'notchpay' => $this->notchPayProvider($payment),
            default => $this->fakeProvider($payment),
        };
    }

    /**
     * Provider fake (pour développement/tests) : auto-confirme après 5 secondes.
     */
    private function fakeProvider(Payment $payment): array
    {
        Cache::put('payment_' . $payment->transaction_id . '_init', now()->toIso8601String(), 600);

        return [
            'instructions' => [
                'fr' => 'Mode sandbox : votre paiement sera automatiquement confirmé dans 5 secondes.',
                'sandbox_force_url' => url('/api/v1/payments/sandbox/' . $payment->transaction_id . '/complete'),
            ],
        ];
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($digits, '237')) {
            return '+' . $digits;
        }
        if (strlen($digits) === 9 && str_starts_with($digits, '6')) {
            return '+237' . $digits;
        }
        return '+' . $digits;
    }
}
