<?php

namespace App\Console\Commands;

use App\Models\CatalogPassword;
use Illuminate\Console\Command;

class RotateCatalogPassword extends Command
{
    /**
     * Signature de la commande
     */
    protected $signature = 'catalog:rotate-password
                            {--validity=12 : Validité du mot de passe en heures}
                            {--max-uses=100 : Nombre maximum d\'utilisations}
                            {--price=2000 : Prix en FCFA}';

    /**
     * Description
     */
    protected $description = 'Génère un nouveau mot de passe pour le catalogue premium et désactive l\'ancien';

    /**
     * Exécuter la commande
     */
    public function handle(): int
    {
        $this->info('Rotation du mot de passe du catalogue...');

        // Nettoyer les mots de passe expirés
        $cleanedCount = CatalogPassword::cleanupExpired();
        if ($cleanedCount > 0) {
            $this->info("{$cleanedCount} mot(s) de passe expiré(s) nettoyé(s).");
        }

        // Vérifier s'il y a déjà un mot de passe actif récent (moins de 11h)
        $currentValid = CatalogPassword::getCurrentValid();
        
        if ($currentValid && $currentValid->valid_until->diffInHours(now()) > 1) {
            $this->warn('Un mot de passe valide existe déjà et expire dans plus d\'une heure.');
            
            if (!$this->confirm('Voulez-vous quand même créer un nouveau mot de passe ?')) {
                $this->info('Opération annulée.');
                return self::SUCCESS;
            }
        }

        // Créer le nouveau mot de passe
        $validity = (int) $this->option('validity');
        $maxUses = (int) $this->option('max-uses');
        $price = (float) $this->option('price');

        $newPassword = CatalogPassword::createNew($price, $validity, $maxUses);

        $this->info('Nouveau mot de passe généré avec succès !');
        $this->newLine();
        $this->table(
            ['Propriété', 'Valeur'],
            [
                ['Mot de passe', $newPassword->password],
                ['Prix', $newPassword->price . ' ' . $newPassword->currency],
                ['Valide depuis', $newPassword->valid_from->format('d/m/Y H:i')],
                ['Expire le', $newPassword->valid_until->format('d/m/Y H:i')],
                ['Validité', $validity . ' heures'],
                ['Utilisations max', $maxUses],
            ]
        );

        // Notification (optionnel)
        $this->notifySubscribers($newPassword);

        return self::SUCCESS;
    }

    /**
     * Notifier les abonnés du nouveau mot de passe
     */
    private function notifySubscribers(CatalogPassword $password): void
    {
        // TODO: Implémenter l'envoi d'emails/SMS aux abonnés
        // Cette méthode peut être étendue pour intégrer:
        // - Envoi d'emails via Mailgun/SendGrid
        // - Envoi de SMS via Twilio/Orange SMS API
        // - Notifications push via Firebase
        
        $this->info('Notification des abonnés... (à implémenter)');
    }
}