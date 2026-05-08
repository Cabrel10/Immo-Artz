<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('property_id')->nullable()->constrained('properties')->onDelete('set null');
            $table->string('rater_name');
            $table->string('rater_email');
            $table->string('rater_phone')->nullable();
            $table->string('rater_ip'); // Pour protection anti-spam
            $table->tinyInteger('score')->unsigned(); // 1-5 étoiles
            $table->text('comment')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Protection anti-spam: un IP ne peut noter qu'une fois par jour un même agent
            $table->unique(['agent_id', 'rater_ip', 'created_at'], 'unique_rating_per_ip_daily');
            
            // Index pour optimisation
            $table->index(['agent_id', 'status']);
            $table->index('score');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
