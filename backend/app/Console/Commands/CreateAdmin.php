<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdmin extends Command
{
    protected $signature = 'admin:create
                            {--name= : Nom complet}
                            {--email= : Email}
                            {--phone= : Téléphone}
                            {--password= : Mot de passe}';

    protected $description = 'Créer un nouvel administrateur';

    public function handle(): int
    {
        $this->info('Création d\'un nouvel administrateur IMMO');
        $this->newLine();

        // Récupérer ou demander les informations
        $firstName = $this->option('name') ?? $this->ask('Prénom');
        $lastName = $this->ask('Nom');
        $email = $this->option('email') ?? $this->ask('Email');
        $phone = $this->option('phone') ?? $this->ask('Téléphone (optionnel)', null);
        $password = $this->option('password') ?? $this->secret('Mot de passe (min 8 caractères)');
        $passwordConfirmation = $this->secret('Confirmer le mot de passe');

        // Validation
        if ($password !== $passwordConfirmation) {
            $this->error('Les mots de passe ne correspondent pas.');
            return self::FAILURE;
        }

        $validator = Validator::make([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'password' => $password,
        ], [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return self::FAILURE;
        }

        // Vérifier si un admin existe déjà
        $existingAdmin = User::where('role', 'admin')->first();
        if ($existingAdmin) {
            $this->warn('Un administrateur existe déjà : ' . $existingAdmin->email);
            if (!$this->confirm('Voulez-vous quand même créer un autre administrateur ?')) {
                return self::SUCCESS;
            }
        }

        // Créer l'admin
        $admin = User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'password' => Hash::make($password),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->newLine();
        $this->info(' Administrateur créé avec succès !');
        $this->newLine();
        $this->table(
            ['Champ', 'Valeur'],
            [
                ['ID', $admin->id],
                ['Nom', $admin->full_name],
                ['Email', $admin->email],
                ['Téléphone', $admin->phone ?: 'Non renseigné'],
                ['Rôle', $admin->role],
            ]
        );

        return self::SUCCESS;
    }
}