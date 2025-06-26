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
        Schema::table('news_images', function (Blueprint $table) {
            // Add is_thumbnail column after 'author' or adjust as needed
            $table->boolean('is_thumbnail')->default(false)->after('author');
            // Add index for faster lookups
            $table->index(['news_id', 'is_thumbnail']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news_images', function (Blueprint $table) {
            $table->dropColumn('is_thumbnail');
        });
    }
};
