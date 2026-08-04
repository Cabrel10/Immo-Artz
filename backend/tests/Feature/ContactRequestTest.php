<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ContactRequestTest extends TestCase
{
    use RefreshDatabase;

    private function setupPropertyWithAgent(): Property
    {
        $agent = User::create([
            'first_name' => 'A', 'last_name' => 'g',
            'email' => 'agentcontact@immo.cm', 'password' => Hash::make('x'),
            'role' => 'agent', 'status' => 'active',
        ]);
        return Property::create([
            'agent_id' => $agent->id,
            'title' => 'P', 'description' => 'D', 'type' => 'villa',
            'standing' => 'standard', 'transaction_type' => 'sale',
            'price' => 100, 'area' => 50,
            'images' => ['url'], 'address' => 'a', 'city' => 'c', 'quartier' => 'q',
            'status' => 'published', 'published_at' => now(),
        ]);
    }

    public function test_visitor_can_submit_contact_request(): void
    {
        $p = $this->setupPropertyWithAgent();

        $this->postJson("/api/v1/properties/{$p->id}/contact", [
            'name' => 'Visitor',
            'email' => 'visitor@example.com',
            'phone' => '+237699000000',
            'message' => 'Je suis intéressé par ce bien, pouvez-vous me rappeler ?',
        ])->assertStatus(201)
          ->assertJsonPath('success', true);

        $this->assertDatabaseHas('contact_requests', [
            'property_id' => $p->id,
            'name' => 'Visitor',
        ]);
    }

    public function test_contact_request_validation(): void
    {
        $p = $this->setupPropertyWithAgent();

        // Missing required fields
        $this->postJson("/api/v1/properties/{$p->id}/contact", [])
            ->assertStatus(422);

        // Message too short
        $this->postJson("/api/v1/properties/{$p->id}/contact", [
            'name' => 'V',
            'email' => 'v@e.com',
            'message' => 'Short',
        ])->assertStatus(422);
    }

    public function test_rate_limited_after_3_requests(): void
    {
        $p = $this->setupPropertyWithAgent();

        $payload = [
            'name' => 'V',
            'email' => 'v@e.com',
            'message' => 'Bonjour, je suis intéressé par ce bien immobilier.',
        ];

        // Time is frozen by TestCase::setUp() at 2026-06-03 12:00:00 UTC
        // so all 3 requests have the same created_at — no drift possible.
        for ($i = 0; $i < 3; $i++) {
            $this->postJson("/api/v1/properties/{$p->id}/contact", $payload)
                ->assertStatus(201);
        }
        // 4th request from same IP within 1 hour window → 429
        $this->postJson("/api/v1/properties/{$p->id}/contact", $payload)
            ->assertStatus(429);
    }

    public function test_rate_limit_resets_after_one_hour(): void
    {
        $p = $this->setupPropertyWithAgent();

        $payload = [
            'name' => 'V',
            'email' => 'v@e.com',
            'message' => 'Bonjour, je suis intéressé par ce bien immobilier.',
        ];

        // Make 3 requests at T=0
        for ($i = 0; $i < 3; $i++) {
            $this->postJson("/api/v1/properties/{$p->id}/contact", $payload)
                ->assertStatus(201);
        }
        // 4th at T=0 → blocked
        $this->postJson("/api/v1/properties/{$p->id}/contact", $payload)
            ->assertStatus(429);

        // Advance time by 61 minutes → rate limit window expired
        Carbon::setTestNow(now()->addMinutes(61));
        $this->postJson("/api/v1/properties/{$p->id}/contact", $payload)
            ->assertStatus(201);
    }

    public function test_contact_for_nonexistent_property_returns_404(): void
    {
        $this->postJson('/api/v1/properties/99999/contact', [
            'name' => 'V',
            'email' => 'v@e.com',
            'message' => 'Bonjour, je suis intéressé par ce bien immobilier.',
        ])->assertStatus(404);
    }
}
