// database/migrations/xxxx_xx_xx_xxxxxx_create_news_translations_table.php

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Create the new translations table for storing multilingual content.
        Schema::create('news_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_id')->constrained()->onDelete('cascade');
            $table->string('locale')->index();
            $table->string('title');
            $table->text('excerpt');
            $table->timestamps();

            // Ensure that each news item can only have one translation per locale.
            $table->unique(['news_id', 'locale']);
        });

        // Step 2: Carefully migrate existing data from the 'news' table.
        // We assume the current content is in Croatian ('hr') as a safe default.
        $existing_news = DB::table('news')->select('id', 'title', 'excerpt')->get();
        foreach ($existing_news as $news_item) {
            DB::table('news_translations')->insert([
                'news_id'    => $news_item->id,
                'locale'     => 'hr',
                'title'      => $news_item->title,
                'excerpt'    => $news_item->excerpt,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Step 3: Drop the now-redundant columns from the original 'news' table.
        Schema::table('news', function (Blueprint $table) {
            $table->dropColumn(['title', 'excerpt']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // To make the migration reversible, we perform the inverse operations.
        // Step 1: Add the columns back to the 'news' table.
        Schema::table('news', function (Blueprint $table) {
            $table->string('title')->after('id')->nullable();
            $table->text('excerpt')->after('slug')->nullable();
        });

        // Step 2: Move the data back from translations to the main table.
        // Note: This will only restore one locale's data (Croatian in this case).
        $translations = DB::table('news_translations')->where('locale', 'hr')->get();
        foreach ($translations as $translation) {
            DB::table('news')->where('id', $translation->news_id)->update([
                'title'   => $translation->title,
                'excerpt' => $translation->excerpt,
            ]);
        }

        // Step 3: Drop the translations table.
        Schema::dropIfExists('news_translations');
    }
};
