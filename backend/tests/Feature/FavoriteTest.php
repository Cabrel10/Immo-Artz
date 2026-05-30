<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FavoriteTest extends TestCase
{
    use RefreshDatabase;

    private function setupVisitorAndProperty(): array
    {
        $agent = User::create([
            'first_name' => 'A', 'last_name' => 'g',
            'email' => 'a@immo.cm', 'password' => Hash::make('x'),
            'role' => 'agent', 'status' => 'active',
        ]);
        $visitor = User::create([
            'first_name' => 'V', 'last_name' => 'v',
            'email' => 'v@immo.cm', 'password' => Hash::make('x'),
            'role' => 'visitor', 'status' => 'active',
        ]);
        $p = Property::create([
            'agent_id' => $agent->id,
            'title' => 'P', 'description' => 'D', 'type' => 'villa',
            'standing' => 'standard', 'transaction_type' => 'sale',
            'price' => 100, 'area' => 50,
            'images' => ['url'], 'address' => 'a', 'city' => 'c', 'quartier' => 'q',
            'status' => 'published', 'published_at' => now(),
        ]);
        return [$visitor, $p];
    }

    public function test_visitor_can_add_remove_favorite(): void
    {
        [$visitor, $p] = $this->setupVisitorAndProperty();
        Sanctum::actingAs($visitor);

        $this->postJson("/api/v1/favorites/{$p->id}")->assertStatus(201);
        $this->getJson("/api/v1/favorites/{$p->id}/check")
            ->assertStatus(200)
            ->assertJsonPath('data.is_favorite', true);

        $this->deleteJson("/api/v1/favorites/{$p->id}")->assertStatus(200);
        $this->getJson("/api/v1/favorites/{$p->id}/check")
            ->assertJsonPath('data.is_favorite', false);
    }

    public function test_unauthenticated_cannot_use_favorites(): void
    {
        $this->postJson('/api/v1/favorites/1')->assertStatus(401);
    }

    public function test_favorite_idempotent(): void
    {
        [$visitor, $p] = $this->setupVisitorAndProperty();
        Sanctum::actingAs($visitor);

        $this->postJson("/api/v1/favorites/{$p->id}")->assertStatus(201);
        $this->postJson("/api/v1/favorites/{$p->id}")->assertStatus(200); // ré-ajout = 200
    }
}
