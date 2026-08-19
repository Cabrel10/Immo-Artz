<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute le flag "meublé" (is_furnished) aux propriétés.
 *
 * Pragmatique SQLite : un boolean dédié évite de reconstruire la table
 * pour étendre l'enum `type`. La catégorie "Meublé" côté frontend
 * correspond aux biens immobiliers avec is_furnished = true.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->boolean('is_furnished')->default(false)->after('construction_year');
            $table->index('is_furnished');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex(['is_furnished']);
            $table->dropColumn('is_furnished');
        });
    }
};
