<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('catalog_password_id')->constrained('catalog_passwords')->onDelete('cascade');
            $table->string('ip_address');
            $table->string('user_agent')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->timestamp('accessed_at');
            $table->boolean('success');
            $table->string('failure_reason')->nullable();
            
            // Index pour rate limiting et analytics
            $table->index(['ip_address', 'accessed_at']);
            $table->index('accessed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_access_logs');
    }
};
