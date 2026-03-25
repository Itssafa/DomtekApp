<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }

  .page { padding: 40px 48px; }

  /* En-tête */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
  .org-name { font-size: 20px; font-weight: 700; color: #2563eb; }
  .org-info { font-size: 10px; color: #555; margin-top: 4px; line-height: 1.6; }
  .facture-meta { text-align: right; }
  .facture-title { font-size: 22px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; }
  .facture-ref { font-size: 11px; color: #64748b; margin-top: 4px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; margin-top: 6px; }
  .badge-attente  { background: #fef3c7; color: #92400e; }
  .badge-payee    { background: #d1fae5; color: #065f46; }
  .badge-retard   { background: #fee2e2; color: #991b1b; }

  /* Type de facture */
  .type-banner { background: #eff6ff; border-left: 4px solid #2563eb; padding: 10px 14px; margin-bottom: 24px; border-radius: 0 6px 6px 0; }
  .type-banner .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }
  .type-banner .value { font-size: 15px; font-weight: 700; color: #1e40af; margin-top: 2px; }

  /* Blocs info */
  .row-2 { display: flex; gap: 24px; margin-bottom: 24px; }
  .box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
  .box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; margin-bottom: 10px; }
  .box p  { font-size: 11px; color: #334155; line-height: 1.7; }
  .box .highlight { font-weight: 600; color: #1e293b; }

  /* Tableau */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #1e293b; color: #fff; }
  thead th { padding: 10px 14px; text-align: left; font-size: 11px; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 10px 14px; font-size: 11px; color: #334155; }

  /* Total */
  .total-block { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .total-inner { border: 2px solid #2563eb; border-radius: 8px; padding: 14px 20px; min-width: 200px; }
  .total-row { display: flex; justify-content: space-between; gap: 40px; font-size: 11px; color: #64748b; margin-bottom: 4px; }
  .total-row.main { font-size: 15px; font-weight: 700; color: #1e293b; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px; }

  /* Notes */
  .notes-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
  .notes-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; margin-bottom: 6px; }
  .notes-box p { font-size: 11px; color: #475569; line-height: 1.6; }

  /* Pied de page */
  .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 9px; color: #94a3b8; }
</style>
</head>
<body>
<div class="page">

  {{-- En-tête --}}
  <div class="header">
    <div>
      <div class="org-name">{{ $facture->organisation->nom }}</div>
      <div class="org-info">
        @if($facture->organisation->adresse) {{ $facture->organisation->adresse }}<br>@endif
        @if($facture->organisation->ville)   {{ $facture->organisation->ville }}<br>@endif
        @if($facture->organisation->telephone) Tél : {{ $facture->organisation->telephone }}<br>@endif
        @if($facture->organisation->email)     {{ $facture->organisation->email }}@endif
      </div>
    </div>
    <div class="facture-meta">
      <div class="facture-title">Facture</div>
      @if($facture->reference)
        <div class="facture-ref">Réf : {{ $facture->reference }}</div>
      @endif
      @php
        $badgeClass = match($facture->statut) {
          'payee'    => 'badge-payee',
          'en_retard'=> 'badge-retard',
          default    => 'badge-attente',
        };
        $badgeLabel = match($facture->statut) {
          'payee'    => 'Payée',
          'en_retard'=> 'En retard',
          default    => 'En attente',
        };
      @endphp
      <span class="badge {{ $badgeClass }}">{{ $badgeLabel }}</span>
    </div>
  </div>

  {{-- Type de facture --}}
  @php
    $typeLabel = match($facture->type) {
      'eau'            => 'Facture d\'eau',
      'electricite_gaz'=> 'Facture d\'électricité et de gaz',
      'loyer'          => 'Facture de loyer',
      'electricite'    => 'Facture d\'électricité',
      'gaz'            => 'Facture de gaz',
      default          => 'Facture',
    };
  @endphp
  <div class="type-banner">
    <div class="label">Nature</div>
    <div class="value">{{ $typeLabel }}</div>
  </div>

  {{-- Client + Bien --}}
  <div class="row-2">
    <div class="box">
      <h3>Destinataire</h3>
      <p>
        <span class="highlight">{{ $facture->client->nom_complet }}</span><br>
        @if($facture->client->adresse) {{ $facture->client->adresse }}<br>@endif
        @if($facture->client->ville)   {{ $facture->client->ville }}<br>@endif
        @if($facture->client->telephone) Tél : {{ $facture->client->telephone }}<br>@endif
        @if($facture->client->email)     {{ $facture->client->email }}@endif
      </p>
    </div>

    @if($facture->contrat && $facture->contrat->bien)
    <div class="box">
      <h3>Bien concerné</h3>
      <p>
        <span class="highlight">{{ $facture->contrat->bien->titre }}</span><br>
        @if($facture->contrat->bien->adresse) {{ $facture->contrat->bien->adresse }}<br>@endif
        @if($facture->contrat->bien->ville)   {{ $facture->contrat->bien->ville }}<br>@endif
        Type : {{ ucfirst($facture->contrat->bien->type_bien) }}<br>
        @if($facture->contrat->bien->superficie) Surface : {{ $facture->contrat->bien->superficie }} m²@endif
      </p>
    </div>
    @endif
  </div>

  {{-- Dates --}}
  <div class="row-2">
    <div class="box">
      <h3>Date d'émission</h3>
      <p class="highlight">{{ \Carbon\Carbon::parse($facture->date_emission)->format('d/m/Y') }}</p>
    </div>
    <div class="box">
      <h3>Date d'échéance</h3>
      <p class="highlight">{{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}</p>
    </div>
    @if($facture->contrat)
    <div class="box">
      <h3>Contrat associé</h3>
      <p>
        Type : {{ $facture->contrat->type === 'loyer' ? 'Location' : 'Vente' }}<br>
        Depuis le : {{ \Carbon\Carbon::parse($facture->contrat->date_debut)->format('d/m/Y') }}
      </p>
    </div>
    @endif
  </div>

  {{-- Détail de la facture --}}
  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th>Période</th>
        <th style="text-align:right">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ $typeLabel }}</td>
        <td>
          {{ \Carbon\Carbon::parse($facture->date_emission)->format('d/m/Y') }}
          → {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}
        </td>
        <td style="text-align:right">{{ number_format($facture->montant, 3, ',', ' ') }} TND</td>
      </tr>
    </tbody>
  </table>

  {{-- Total --}}
  <div class="total-block">
    <div class="total-inner">
      <div class="total-row">
        <span>Sous-total</span>
        <span>{{ number_format($facture->montant, 3, ',', ' ') }} TND</span>
      </div>
      <div class="total-row">
        <span>TVA</span>
        <span>—</span>
      </div>
      <div class="total-row main">
        <span>Total à payer</span>
        <span>{{ number_format($facture->montant, 3, ',', ' ') }} TND</span>
      </div>
    </div>
  </div>

  {{-- Notes --}}
  @if($facture->notes)
  <div class="notes-box">
    <h3>Notes</h3>
    <p>{{ $facture->notes }}</p>
  </div>
  @endif

  {{-- Pied de page --}}
  <div class="footer">
    Document généré le {{ now()->format('d/m/Y à H:i') }} — {{ $facture->organisation->nom }}
    @if($facture->organisation->email) — {{ $facture->organisation->email }}@endif
  </div>

</div>
</body>
</html>
