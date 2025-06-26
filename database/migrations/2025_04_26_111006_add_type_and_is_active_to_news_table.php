<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\NewsType; // Import the Enum we will create

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            // Add type column after 'source' or adjust as needed
            $table->enum('type', NewsType::values())->default(NewsType::NOVOSTI->value)->after('source');
            // Add is_active column
            $table->boolean('is_active')->default(true)->after('type');
            // Add index for faster filtering
            $table->index('is_active');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->dropColumn(['type', 'is_active']);
        });
    }
};
