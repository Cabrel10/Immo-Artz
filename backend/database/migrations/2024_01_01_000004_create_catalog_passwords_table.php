<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_passwords', function (Blueprint $table) {
            $table->id();
            $table->string('password', 8)->unique(); // Mot de passe à 8 caractères
            $table->string('hash')->unique(); // Hash pour vérification
            $table->decimal('price', 10, 2)->default(2000); // Prix en FCFA
            $table->string('currency')->default('XAF');
            $table->timestamp('valid_from');
            $table->timestamp('valid_until')->nullable(); // 12h de validité
            $table->boolean('is_active')->default(true);
            $table->integer('max_uses')->default(100); // Limite d'utilisations
            $table->integer('current_uses')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            
            // Index pour optimisation
            $table->index(['is_active', 'valid_from', 'valid_until']);
            $table->index('password');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_passwords');
    }
};
