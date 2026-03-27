<?php

namespace App\Mail;

use App\Models\Facture;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FactureCreee extends Mailable
{
    use Queueable, SerializesModels;

    private static array $typeLabels = [
        'eau'              => 'Eau',
        'electricite'      => 'Électricité',
        'gaz'              => 'Gaz',
        'electricite_gaz'  => 'Électricité & Gaz',
        'loyer'            => 'Loyer',
    ];

    public function __construct(
        public Facture $facture,
        public string $paymentUrl
    ) {}

    public function envelope(): Envelope
    {
        $label = self::$typeLabels[$this->facture->type] ?? ucfirst($this->facture->type);
        $ref   = $this->facture->reference ?? 'N°' . $this->facture->id;

        return new Envelope(
            subject: "Votre facture {$label} — {$ref}",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.facture_creee');
    }

    public function attachments(): array
    {
        $this->facture->loadMissing(['organisation', 'client', 'contrat.bien']);

        $pdf      = Pdf::loadView('pdf.facture', ['facture' => $this->facture])->setPaper('a4', 'portrait');
        $filename = 'facture-' . ($this->facture->reference ?? $this->facture->id) . '.pdf';

        return [
            Attachment::fromData(fn () => $pdf->output(), $filename)
                ->withMime('application/pdf'),
        ];
    }
}
