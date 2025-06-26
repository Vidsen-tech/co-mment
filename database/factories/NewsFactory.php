<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class NewsFactory extends Factory
{
    public function definition(): array
    {
        $title = $this->faker->sentence(3);

        return [
            'title'    => $title,
            'slug'     => Str::slug($title) . '-' . rand(1000, 9999),
            'excerpt'  => $this->faker->paragraph(3),
            'images'   => [
                '/images/sample1.jpg',
                '/images/sample2.jpg',
            ],
            'date'     => $this->faker->dateTimeBetween('-1 year', '+1 month'),
            'category' => 'novosti',
            'source'   => 'Interno',
        ];
    }
}
