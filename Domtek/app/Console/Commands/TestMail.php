<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestMail extends Command
{
    protected $signature   = 'mail:test {email}';
    protected $description = 'Envoie un mail de test pour vérifier la configuration SMTP';

    public function handle(): void
    {
        $email  = $this->argument('email');
        $mailer = config('mail.default');

        $this->line('');
        $this->line("  Driver actuel : <fg=yellow>{$mailer}</>");

        if ($mailer === 'log') {
            $this->line('  <fg=red>⚠  MAIL_MAILER=log → les mails sont écrits dans storage/logs/laravel.log, pas envoyés.</>');
            $this->line('  Changez MAIL_MAILER=smtp dans votre .env puis relancez php artisan config:clear');
            $this->line('');
            return;
        }

        $this->line("  Destination    : {$email}");
        $this->line("  Host SMTP      : " . config('mail.mailers.smtp.host'));
        $this->line("  Port           : " . config('mail.mailers.smtp.port'));
        $this->line('');

        try {
            Mail::raw(
                "✅ La configuration mail fonctionne correctement.\n\nDomtek — " . now()->format('d/m/Y H:i'),
                fn ($m) => $m->to($email)->subject('Test mail — Domtek')
            );
            $this->info('  ✅ Mail envoyé ! Vérifiez votre boîte (ou votre inbox Mailtrap).');
        } catch (\Throwable $e) {
            $this->error('  ❌ Échec SMTP : ' . $e->getMessage());
            $this->line('  Vérifiez vos credentials dans .env (MAIL_USERNAME, MAIL_PASSWORD).');
        }

        $this->line('');
    }
}
