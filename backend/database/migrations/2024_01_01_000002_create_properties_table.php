<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['apartment', 'house', 'villa', 'land', 'commercial', 'office', 'car', 'suv', 'truck', 'motorcycle']);
            $table->enum('standing', ['standard', 'moyen', 'haut_de_gamme'])->default('standard');
            $table->enum('transaction_type', ['sale', 'rent'])->default('sale');
            $table->decimal('price', 15, 2);
            $table->string('currency')->default('XAF');
            $table->decimal('area', 10, 2);
            $table->integer('bedrooms')->nullable();
            $table->integer('bathrooms')->nullable();
            $table->integer('parking_spaces')->nullable();
            $table->integer('floor')->nullable();
            $table->integer('total_floors')->nullable();
            $table->integer('construction_year')->nullable();
            $table->json('features')->nullable(); // Équipements: piscine, jardin, sécurité, etc.
            $table->json('images'); // Tableau d'URLs des images
            $table->string('main_image')->nullable();
            $table->string('video_url')->nullable();
            $table->string('virtual_tour_url')->nullable();
            
            // Localisation
            $table->string('address');
            $table->string('city');
            $table->string('quartier');
            $table->string('postal_code')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            // Statut et visibilité
            $table->enum('status', ['draft', 'published', 'sold', 'rented', 'archived'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_premium')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // Compteur de vues
            $table->integer('view_count')->default(0);
            $table->integer('contact_count')->default(0);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index pour optimisation des recherches
            $table->index(['status', 'standing', 'type']);
            $table->index(['city', 'quartier']);
            $table->index('price');
            $table->index(['latitude', 'longitude']);
            $table->index('is_featured');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};