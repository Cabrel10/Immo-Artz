<?php

namespace Database\Seeders;

use App\Models\CatalogPassword;
use App\Models\Property;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        $admin = User::create([
            'first_name' => 'Nathan',
            'last_name' => 'Biloa',
            'email' => 'admin@immo.cm',
            'phone' => '+237698705679',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Agents
        $agents = [];
        for ($i = 1; $i <= 5; $i++) {
            $agents[] = User::create([
                'first_name' => 'Agent',
                'last_name' => "Numéro $i",
                'email' => "agent$i@immo.cm",
                'phone' => "+237678991831" . ($i + 1),
                'password' => Hash::make('password'),
                'role' => 'agent',
                'status' => 'active',
                'agency_name' => "Agence $i",
                'license_number' => "LIC-2024-00$i",
                'bio' => "Agent immobilier professionnel avec $i années d'expérience.",
            ]);
        }

        // Properties
        $types = ['apartment', 'house', 'villa', 'land', 'commercial', 'office'];
        $standings = ['standard', 'moyen', 'haut_de_gamme'];
        $transactionTypes = ['sale', 'rent'];
        $cities = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua'];
        $quartiers = ['Akwa', 'Bonapriso', 'Makepe', 'Logpom', 'Kotto'];
        $features = [
            'Piscine',
            'Jardin',
            'Garage',
            'Sécurité 24/7',
            'Générateur',
            'Climatisation',
            'Cuisine équipée',
            'Terrasse',
            'Parking',
            'Ascenseur',
        ];

        foreach ($agents as $agent) {
            for ($i = 0; $i < 5; $i++) {
                $type = $types[array_rand($types)];
                $standing = $standings[array_rand($standings)];
                $transactionType = $transactionTypes[array_rand($transactionTypes)];
                $city = $cities[array_rand($cities)];
                $quartier = $quartiers[array_rand($quartiers)];
                
                $price = match($standing) {
                    'haut_de_gamme' => rand(50000000, 500000000),
                    'moyen' => rand(20000000, 100000000),
                    'standard' => rand(5000000, 50000000),
                };

                $area = match($type) {
                    'land' => rand(200, 2000),
                    'apartment' => rand(50, 200),
                    default => rand(100, 500),
                };

                Property::create([
                    'agent_id' => $agent->id,
                    'title' => ucfirst($type) . ' ' . $standing . ' à ' . $quartier,
                    'description' => 'Magnifique propriété située dans un quartier prisé. ' .
                        'Cette propriété offre tout le confort moderne avec des finitions de qualité. ' .
                        'Idéal pour une famille ou un investissement.',
                    'type' => $type,
                    'standing' => $standing,
                    'transaction_type' => $transactionType,
                    'price' => $price,
                    'area' => $area,
                    'bedrooms' => in_array($type, ['apartment', 'house', 'villa']) ? rand(2, 5) : null,
                    'bathrooms' => in_array($type, ['apartment', 'house', 'villa']) ? rand(1, 3) : null,
                    'parking_spaces' => rand(1, 3),
                    'features' => array_rand(array_flip($features), rand(2, 5)),
                    'images' => [
                        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
                    ],
                    'main_image' => 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
                    'address' => rand(1, 100) . ' Rue Principale',
                    'city' => $city,
                    'quartier' => $quartier,
                    'latitude' => rand(300, 1100) / 100,
                    'longitude' => rand(800, 1400) / 100 * -1,
                    'status' => 'published',
                    'is_featured' => rand(1, 5) === 1,
                    'is_premium' => $standing === 'haut_de_gamme',
                    'published_at' => now(),
                ]);
            }
        }

        // Ratings
        foreach ($agents as $agent) {
            for ($i = 0; $i < rand(3, 10); $i++) {
                $rating = Rating::create([
                    'agent_id' => $agent->id,
                    'property_id' => null,
                    'rater_name' => 'Client ' . ($i + 1),
                    'rater_email' => 'client' . ($i + 1) . '@example.com',
                    'rater_phone' => '+2376' . rand(10000000, 99999999),
                    'rater_ip' => '192.168.1.' . rand(1, 255),
                    'score' => rand(3, 5),
                    'comment' => 'Excellent service, très professionnel. Je recommande vivement !',
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => $admin->id,
                ]);
            }
            $agent->updateRatingAverage();
        }

        // Initial catalog password
        CatalogPassword::createNew();

        $this->command->info('Database seeded successfully!');
        $this->command->info('Admin: admin@immo.cm / password');
        $this->command->info('Agents: agent1@immo.cm / password');
    }
}