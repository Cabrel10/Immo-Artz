<?php

namespace Tests\Feature;

use App\Models\CatalogPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        // Forcer la complétion (sandbox)
        $this->postJson("/api/v1/payments/sandbox/{$txId}/complete")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');

        // Récupérer le mot de passe
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
}
