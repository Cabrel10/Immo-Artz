<?php

namespace Tests\Feature;

use App\Models\CatalogPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
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
        // Time is frozen by TestCase::setUp() — no drift possible
        $pwd = CatalogPassword::createNew();

        $this->postJson('/api/v1/catalog/verify', ['password' => $pwd->password])
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['valid_until', 'time_remaining', 'uses_remaining']]);
    }

    public function test_password_format_validation(): void
    {
        // Password must be exactly 8 chars (size:8 rule)
        $this->postJson('/api/v1/catalog/verify', ['password' => 'short'])
            ->assertStatus(422);
    }

    public function test_expired_password_is_rejected(): void
    {
        $pwd = CatalogPassword::createNew();

        // Advance time by 13 hours (password validity is 12 hours)
        Carbon::setTestNow(now()->addHours(13));

        $this->postJson('/api/v1/catalog/verify', ['password' => $pwd->password])
            ->assertStatus(401);
    }

    public function test_password_rotation_creates_new_and_deactivates_old(): void
    {
        $old = CatalogPassword::createNew();
        $this->assertTrue($old->is_valid);

        $new = CatalogPassword::rotate();
        $old->refresh();

        $this->assertFalse($old->is_active);
        $this->assertTrue($new->is_valid);
        $this->assertNotEquals($old->password, $new->password);
    }

    public function test_generate_password_format(): void
    {
        $password = CatalogPassword::generatePassword();
        $this->assertEquals(8, strlen($password));
        // Should only contain allowed characters (no 0,1,I,O)
        $this->assertMatchesRegularExpression('/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/', $password);
    }
}
