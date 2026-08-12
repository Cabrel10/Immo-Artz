<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (!Schema::hasColumn('properties', 'featured_order')) {
                $table->integer('featured_order')->default(0)->after('is_premium');
            }
            if (!Schema::hasColumn('properties', 'featured_until')) {
                $table->timestamp('featured_until')->nullable()->after('featured_order');
            }
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (Schema::hasColumn('properties', 'featured_order')) {
                $table->dropColumn('featured_order');
            }
            if (Schema::hasColumn('properties', 'featured_until')) {
                $table->dropColumn('featured_until');
            }
        });
    }
};
