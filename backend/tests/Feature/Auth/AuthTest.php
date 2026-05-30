<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@immo.cm',
            'phone' => '+237699000001',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'visitor',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'test@immo.cm']);
    }

    public function test_user_can_login(): void
    {
        User::create([
            'first_name' => 'Login',
            'last_name' => 'User',
            'email' => 'login@immo.cm',
            'password' => Hash::make('Password123!'),
            'role' => 'visitor',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'login@immo.cm',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['access_token', 'user']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::create([
            'first_name' => 'Wrong',
            'last_name' => 'Pass',
            'email' => 'wrong@immo.cm',
            'password' => Hash::make('Password123!'),
            'role' => 'visitor',
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/login', [
            'email' => 'wrong@immo.cm',
            'password' => 'WRONG',
        ])->assertStatus(401);
    }
}
