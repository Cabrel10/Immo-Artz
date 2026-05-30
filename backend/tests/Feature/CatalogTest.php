<?php

namespace Tests\Feature;

use App\Models\CatalogPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_verify_with_invalid_password(): void
    {
        $this->postJson('/api/v1/catalog/verify', ['password' => 'WRONG123'])
            ->assertStatus(401)
            ->assertJsonPath('error_code', 'INVALID_PASSWORD');
    }

    public function test_verify_with_valid_password(): void
    {
        $pwd = CatalogPassword::createNew();
        $this->postJson('/api/v1/catalog/verify', ['password' => $pwd->password])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['valid_until', 'time_remaining', 'uses_remaining']]);
    }

    public function test_password_format_validation(): void
    {
        $this->postJson('/api/v1/catalog/verify', ['password' => 'short'])
            ->assertStatus(422);
    }
}
