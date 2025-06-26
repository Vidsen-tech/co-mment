<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            // Check if the column exists before trying to drop it, to make the migration safer
            if (Schema::hasColumn('news', 'images')) {
                $table->dropColumn('images');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            // If you were to roll back, this would attempt to add it back.
            // You'd need to know its original type.
            // For simplicity, and because the goal is removal,
            // you might decide what's appropriate here.
            // Adding it back as nullable text is a safe bet if you're unsure.
            // However, ensure this matches what it might have been if you intend to roll back.
            $table->text('images')->nullable();
        });
    }
};

