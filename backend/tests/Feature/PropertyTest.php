<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyTest extends TestCase
{
    use RefreshDatabase;

    private function makeAgent(array $overrides = []): User
    {
        static $counter = 0;
        $counter++;
        return User::create(array_merge([
            'first_name' => 'Agent',
            'last_name' => "Test{$counter}",
            'email' => "agent{$counter}@immo.cm",
            'password' => Hash::make('Password123!'),
            'role' => 'agent',
            'status' => 'active',
        ], $overrides));
    }

    private function makeProperty(User $agent, array $overrides = []): Property
    {
        return Property::create(array_merge([
            'agent_id' => $agent->id,
            'title' => 'Belle villa',
            'description' => 'Description complète du bien immobilier',
            'type' => 'villa',
            'standing' => 'haut_de_gamme',
            'transaction_type' => 'sale',
            'price' => 100000000,
            'area' => 300,
            'images' => ['https://example.com/img.jpg'],
            'address' => '1 rue test',
            'city' => 'Douala',
            'quartier' => 'Bonapriso',
            'status' => 'published',
            'published_at' => now(),
        ], $overrides));
    }

    public function test_public_can_list_properties(): void
    {
        $agent = $this->makeAgent();
        $this->makeProperty($agent);

        $this->getJson('/api/v1/properties')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['properties', 'pagination']]);
    }

    public function test_public_listing_only_shows_published(): void
    {
        $agent = $this->makeAgent();
        $this->makeProperty($agent, ['status' => 'draft', 'title' => 'Draft']);
        $this->makeProperty($agent, ['status' => 'published', 'title' => 'Published']);

        $response = $this->getJson('/api/v1/properties');
        $response->assertStatus(200);
        $properties = $response->json('data.properties');
        $this->assertCount(1, $properties);
        $this->assertEquals('Published', $properties[0]['title']);
    }

    public function test_agent_can_create_property_with_uploaded_images(): void
    {
        Storage::fake('public');
        $agent = $this->makeAgent();
        Sanctum::actingAs($agent);

        $response = $this->postJson('/api/v1/properties', [
            'title' => 'Studio neuf',
            'description' => 'Bel emplacement, lumineux et calme',
            'type' => 'apartment',
            'standing' => 'moyen',
            'transaction_type' => 'rent',
            'price' => 250000,
            'area' => 45,
            'address' => '12 rue X',
            'city' => 'Yaoundé',
            'quartier' => 'Bastos',
            'images' => [UploadedFile::fake()->image('a.jpg', 800, 600)],
            'status' => 'published',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.property.title', 'Studio neuf');

        $this->assertDatabaseCount('properties', 1);
    }

    public function test_agent_cannot_edit_other_agent_property(): void
    {
        $agent1 = $this->makeAgent();
        $agent2 = $this->makeAgent();

        $p = $this->makeProperty($agent1);

        Sanctum::actingAs($agent2);
        $this->putJson('/api/v1/properties/' . $p->id, ['title' => 'hack'])
            ->assertStatus(403);
    }

    public function test_visitor_cannot_create_property(): void
    {
        $visitor = User::create([
            'first_name' => 'V',
            'last_name' => 'V',
            'email' => 'visitor@immo.cm',
            'password' => Hash::make('Password123!'),
            'role' => 'visitor',
            'status' => 'active',
        ]);
        Sanctum::actingAs($visitor);

        $this->postJson('/api/v1/properties', [
            'title' => 'X',
            'description' => 'desc',
            'type' => 'house',
            'standing' => 'standard',
            'transaction_type' => 'sale',
            'price' => 1,
            'area' => 1,
            'address' => 'a',
            'city' => 'c',
            'quartier' => 'q',
        ])->assertStatus(403);
    }

    public function test_property_filters_work(): void
    {
        $agent = $this->makeAgent();
        $this->makeProperty($agent, ['type' => 'villa', 'city' => 'Douala', 'price' => 50000000]);
        $this->makeProperty($agent, ['type' => 'apartment', 'city' => 'Yaoundé', 'price' => 10000000]);

        // Filter by type
        $response = $this->getJson('/api/v1/properties?type=villa');
        $this->assertCount(1, $response->json('data.properties'));

        // Filter by city
        $response = $this->getJson('/api/v1/properties?city=Yaoundé');
        $this->assertCount(1, $response->json('data.properties'));

        // Filter by price range
        $response = $this->getJson('/api/v1/properties?min_price=40000000');
        $this->assertCount(1, $response->json('data.properties'));
    }
}
