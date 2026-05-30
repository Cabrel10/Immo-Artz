<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ContactRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitor_can_submit_contact_request(): void
    {
        $agent = User::create([
            'first_name' => 'A', 'last_name' => 'g',
            'email' => 'a@immo.cm', 'password' => Hash::make('x'),
            'role' => 'agent', 'status' => 'active',
        ]);
        $p = Property::create([
            'agent_id' => $agent->id,
            'title' => 'P', 'description' => 'D', 'type' => 'villa',
            'standing' => 'standard', 'transaction_type' => 'sale',
            'price' => 100, 'area' => 50,
            'images' => ['url'], 'address' => 'a', 'city' => 'c', 'quartier' => 'q',
            'status' => 'published', 'published_at' => now(),
        ]);

        $this->postJson("/api/v1/properties/{$p->id}/contact", [
            'name' => 'Visitor',
            'email' => 'visitor@example.com',
            'phone' => '+237699000000',
            'message' => 'Je suis intéressé par ce bien, pouvez-vous me rappeler ?',
        ])->assertStatus(201)
          ->assertJsonPath('success', true);

        $this->assertDatabaseHas('contact_requests', ['property_id' => $p->id, 'name' => 'Visitor']);
    }

    public function test_rate_limited_after_3_requests(): void
    {
        $agent = User::create([
            'first_name' => 'A', 'last_name' => 'g',
            'email' => 'a2@immo.cm', 'password' => Hash::make('x'),
            'role' => 'agent', 'status' => 'active',
        ]);
        $p = Property::create([
            'agent_id' => $agent->id,
            'title' => 'P', 'description' => 'D', 'type' => 'villa',
            'standing' => 'standard', 'transaction_type' => 'sale',
            'price' => 100, 'area' => 50,
            'images' => ['url'], 'address' => 'a', 'city' => 'c', 'quartier' => 'q',
            'status' => 'published', 'published_at' => now(),
        ]);

        $payload = [
            'name' => 'V', 'email' => 'v@e.com',
            'message' => 'Bonjour, je suis intéressé par ce bien immobilier.',
        ];

        for ($i = 0; $i < 3; $i++) {
            $this->postJson("/api/v1/properties/{$p->id}/contact", $payload)->assertStatus(201);
        }
        $this->postJson("/api/v1/properties/{$p->id}/contact", $payload)->assertStatus(429);
    }
}
