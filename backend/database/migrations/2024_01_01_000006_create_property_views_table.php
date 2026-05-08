<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->onDelete('cascade');
            $table->string('ip_address');
            $table->string('user_agent')->nullable();
            $table->string('referrer')->nullable();
            $table->timestamp('viewed_at');
            
            // Un IP ne compte qu'une vue par propriété et par jour
            $table->unique(['property_id', 'ip_address', 'viewed_at'], 'unique_view_per_ip_daily');
            
            $table->index(['property_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_views');
    }
};
