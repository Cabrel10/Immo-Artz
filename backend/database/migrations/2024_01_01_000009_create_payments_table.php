<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('transaction_id')->unique();
            $table->enum('type', ['catalog_access', 'featured_listing', 'premium_subscription']);
            $table->morphs('payable'); // Polymorphique: catalog_password, property, etc.
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('XAF');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->string('payment_method')->nullable(); // MTN Money, Orange Money, carte
            $table->string('payment_provider')->nullable();
            $table->string('provider_transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            
            $table->index(['status', 'type']);
            $table->index('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
