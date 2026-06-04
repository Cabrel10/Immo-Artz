<?php

namespace Tests\Feature;

use App\Models\CatalogPassword;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_initiate_catalog_payment_sandbox(): void
    {
        CatalogPassword::createNew();

        $response = $this->postJson('/api/v1/payments/catalog', [
            'phone' => '+237699000000',
            'provider' => 'mtn',
            'email' => 'buyer@example.com',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sandbox', true)
            ->assertJsonStructure(['data' => ['transaction_id', 'amount', 'currency', 'poll_url']]);

        $txId = $response->json('data.transaction_id');
        $this->assertDatabaseHas('payments', ['transaction_id' => $txId, 'status' => 'pending']);
    }

    public function test_sandbox_force_completion_and_claim(): void
    {
        CatalogPassword::createNew();

        $init = $this->postJson('/api/v1/payments/catalog', [
            'phone' => '+237699000000',
            'provider' => 'orange',
        ])->assertStatus(201);

        $txId = $init->json('data.transaction_id');

        // Force completion (sandbox endpoint)
        $this->postJson("/api/v1/payments/sandbox/{$txId}/complete")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        // Claim the catalog password
        $claim = $this->getJson("/api/v1/payments/{$txId}/claim-catalog");
        $claim->assertStatus(200)
            ->assertJsonStructure(['data' => ['password', 'valid_until']]);

        $this->assertNotEmpty($claim->json('data.password'));
    }

    public function test_claim_fails_before_completion(): void
    {
        CatalogPassword::createNew();

        $init = $this->postJson('/api/v1/payments/catalog', [
            'phone' => '+237699000000',
            'provider' => 'mtn',
        ])->assertStatus(201);

        $txId = $init->json('data.transaction_id');
        $this->getJson("/api/v1/payments/{$txId}/claim-catalog")->assertStatus(402);
    }

    public function test_invalid_phone_rejected(): void
    {
        CatalogPassword::createNew();
        $this->postJson('/api/v1/payments/catalog', [
            'phone' => '12345',
            'provider' => 'mtn',
        ])->assertStatus(422);
    }

    public function test_sandbox_auto_complete_after_5_seconds(): void
    {
        CatalogPassword::createNew();

        $init = $this->postJson('/api/v1/payments/catalog', [
            'phone' => '+237699000000',
            'provider' => 'mtn',
        ])->assertStatus(201);

        $txId = $init->json('data.transaction_id');

        // At T=0 the payment should still be pending when polling
        $this->getJson("/api/v1/payments/{$txId}/status")
            ->assertJsonPath('data.status', 'pending');

        // Advance time by 6 seconds → auto-completion kicks in
        Carbon::setTestNow(now()->addSeconds(6));
        $this->getJson("/api/v1/payments/{$txId}/status")
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.is_completed', true);
    }

    public function test_payment_status_for_nonexistent_transaction(): void
    {
        $this->getJson('/api/v1/payments/FAKE-TX-123/status')
            ->assertStatus(404);
    }

    public function test_invalid_provider_rejected(): void
    {
        CatalogPassword::createNew();
        $this->postJson('/api/v1/payments/catalog', [
            'phone' => '+237699000000',
            'provider' => 'bitcoin', // not in: mtn, orange
        ])->assertStatus(422);
    }

    public function test_webhook_completes_payment(): void
    {
        CatalogPassword::createNew();

        $init = $this->postJson('/api/v1/payments/catalog', [
            'phone' => '+237699000000',
            'provider' => 'mtn',
        ])->assertStatus(201);

        $txId = $init->json('data.transaction_id');

        // Simulate webhook
        $this->postJson('/api/v1/payments/webhook', [
            'transaction_id' => $txId,
            'status' => 'completed',
            'provider_transaction_id' => 'PROVIDER-TX-ABC',
        ])->assertStatus(200)
          ->assertJsonPath('success', true);

        $this->assertDatabaseHas('payments', [
            'transaction_id' => $txId,
            'status' => 'completed',
        ]);
    }
}
