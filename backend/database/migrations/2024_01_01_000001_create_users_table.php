<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable()->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'agent', 'visitor'])->default('visitor');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->string('agency_name')->nullable();
            $table->string('license_number')->nullable();
            $table->decimal('rating_average', 2, 1)->default(0);
            $table->integer('rating_count')->default(0);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            
            // Index pour optimisation
            $table->index(['role', 'status']);
            $table->index('rating_average');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
