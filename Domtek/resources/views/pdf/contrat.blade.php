<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }

  .page { padding: 40px 48px; }

  /* En-tête */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #1e293b; padding-bottom: 18px; }
  .org-name { font-size: 18px; font-weight: 700; color: #1e293b; }
  .org-info  { font-size: 9px; color: #64748b; margin-top: 4px; line-height: 1.7; }
  .contrat-meta { text-align: right; }
  .contrat-title { font-size: 18px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 1px; }
  .contrat-sub   { font-size: 10px; color: #64748b; margin-top: 3px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 9px; font-weight: 700; margin-top: 5px; text-transform: uppercase; letter-spacing: .5px; }
  .badge-actif   { background: #dcfce7; color: #166534; }
  .badge-termine { background: #f1f5f9; color: #475569; }
  .badge-resilie { background: #fee2e2; color: #991b1b; }

  /* Corps */
  .intro { font-weight: 700; font-size: 12px; margin-bottom: 14px; color: #1e293b; }

  .partie { border-left: 3px solid #2563eb; padding: 10px 14px; margin-bottom: 12px; background: #f8fafc; border-radius: 0 6px 6px 0; }
  .partie p { font-size: 11px; color: #334155; line-height: 1.8; }
  .partie .denomination { font-size: 10px; color: #64748b; font-style: italic; margin-top: 4px; }

  .et-separateur { text-align: center; font-weight: 700; font-size: 12px; color: #1e293b; margin: 10px 0; }

  .partie-b { border-left-color: #16a34a; }

  /* Articles */
  .article { margin-bottom: 14px; }
  .article-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
  .article p { font-size: 11px; color: #334155; line-height: 1.8; }

  .bien-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 10px 14px; margin: 8px 0; }
  .bien-box .row { display: flex; gap: 8px; margin-bottom: 3px; }
  .bien-box .label { font-size: 10px; color: #64748b; min-width: 90px; }
  .bien-box .value { font-size: 11px; font-weight: 600; color: #1e293b; }

  .montant-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px 14px; margin: 8px 0; }
  .montant-box .row { display: flex; gap: 8px; margin-bottom: 4px; }
  .montant-box .label { font-size: 10px; color: #64748b; min-width: 90px; }
  .montant-box .value { font-size: 11px; font-weight: 600; color: #1e40af; }
  .montant-box .modalites { font-size: 10px; color: #475569; line-height: 1.6; }

  /* Séparateur */
  .separator { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }

  /* Signatures */
  .signature-block { margin-top: 28px; }
  .signature-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #64748b; margin-bottom: 16px; }
  .signatures { display: flex; gap: 32px; }
  .sig-col { flex: 1; text-align: center; }
  .sig-line { border-bottom: 1px solid #94a3b8; height: 48px; margin-bottom: 6px; }
  .sig-name  { font-size: 10px; font-weight: 700; color: #1e293b; }
  .sig-label { font-size: 9px; color: #94a3b8; margin-top: 2px; }

  /* Pied de page */
  .footer { border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; }
</style>
</head>
<body>
<div class="page">

  {{-- En-tête --}}
  <div class="header">
    <div>
      <div class="org-name">{{ $contrat->organisation->nom }}</div>
      <div class="org-info">
        @if($contrat->forme_juridique) {{ $contrat->forme_juridique }}<br>@endif
        @if($contrat->organisation->adresse) {{ $contrat->organisation->adresse }}<br>@endif
        @if($contrat->organisation->ville)   {{ $contrat->organisation->ville }}<br>@endif
        @if($contrat->organisation->telephone) Tél : {{ $contrat->organisation->telephone }}<br>@endif
        @if($contrat->organisation->email)     {{ $contrat->organisation->email }}@endif
      </div>
    </div>
    <div class="contrat-meta">
      @php
        $typeLabels = [
          'bail_habitation'    => "Bail d'Habitation",
          'bail_etudiant'      => "Bail Étudiant",
          'bail_professionnel' => "Bail Professionnel",
          'bail_commercial'    => "Bail Commercial",
          'bail_saisonnier'    => "Bail Saisonnier",
          'loyer'              => "Contrat de Location",
          'vente'              => "Contrat de Vente",
          'autre'              => "Contrat",
        ];
        $typeLabel = $typeLabels[$contrat->type] ?? ucfirst($contrat->type);
      @endphp
      <div class="contrat-title">{{ $typeLabel }}</div>
      @if($contrat->designation)
      <div class="contrat-sub" style="font-style:italic;margin-top:2px;">« {{ $contrat->designation }} »</div>
      @endif
      <div class="contrat-sub">
        N° {{ $contrat->id }} —
        @if($contrat->date_contrat)
          {{ \Carbon\Carbon::parse($contrat->date_contrat)->format('d/m/Y') }}
        @else
          {{ $contrat->created_at->format('d/m/Y') }}
        @endif
      </div>
      @php
        $badgeClass = match($contrat->statut) {
          'actif'    => 'badge-actif',
          'resilie'  => 'badge-resilie',
          default    => 'badge-termine',
        };
        $badgeLabel = match($contrat->statut) {
          'actif'    => 'Actif',
          'resilie'  => 'Résilié',
          default    => 'Terminé',
        };
      @endphp
      <span class="badge {{ $badgeClass }}">{{ $badgeLabel }}</span>
    </div>
  </div>

  {{-- Intro --}}
  <p class="intro">ENTRE LES SOUSSIGNÉS :</p>

  {{-- Partie A --}}
  @php $client = $contrat->clients->first(); @endphp
  <div class="partie">
    <p>
      <strong>1.</strong>
      <strong>{{ $contrat->organisation->nom }}</strong>
      @if($contrat->forme_juridique), {{ $contrat->forme_juridique }}@endif,
      dont le siège social est situé à
      {{ implode(', ', array_filter([$contrat->organisation->adresse, $contrat->organisation->ville])) ?: '—' }},
      représentée par son représentant légal
      <strong>{{ $contrat->representant ?? '—' }}</strong>,
      dûment habilité aux fins des présentes.
    </p>
    <p class="denomination">Ci-après dénommée <strong>"La Partie A"</strong>.</p>
  </div>

  <div class="et-separateur">— ET —</div>

  {{-- Partie B --}}
  <div class="partie partie-b">
    <p>
      <strong>2.</strong>
      @if($client)
        <strong>{{ ($client->civilite ? $client->civilite . ' ' : '') . $client->nom_complet }}</strong>,
        né(e) le <strong>{{ $client->date_naissance ? \Carbon\Carbon::parse($client->date_naissance)->format('d/m/Y') : '—' }}</strong>,
        titulaire de la {{ $client->type_piece ?? 'CIN' }} n°
        <strong>{{ $client->cin ?? '—' }}</strong>
        délivrée le <strong>{{ $contrat->cin_delivree_le ? \Carbon\Carbon::parse($contrat->cin_delivree_le)->format('d/m/Y') : '—' }}</strong>,
        demeurant à <strong>{{ implode(', ', array_filter([$client->adresse, $client->ville])) ?: '—' }}</strong>.
      @else
        <em>Client non renseigné.</em>
      @endif
    </p>
    <p class="denomination">Ci-après dénommé(e) <strong>"La Partie B"</strong>.</p>
  </div>

  <hr class="separator">

  {{-- Article 1 --}}
  <div class="article">
    <div class="article-title">Article 1 : Objet de la convention</div>
    <p>
      La Partie A s'engage, par la présente, à transférer à la Partie B, qui accepte,
      l'usage et la détention du bien suivant :
    </p>
    @if($contrat->bien)
    <div class="bien-box">
      <div class="row">
        <span class="label">Désignation :</span>
        <span class="value">{{ $contrat->bien->designation }} ({{ ucfirst($contrat->bien->type_bien) }})</span>
      </div>
      <div class="row">
        <span class="label">Localisation :</span>
        <span class="value">{{ implode(', ', array_filter([$contrat->bien->adresse, $contrat->bien->ville])) ?: '—' }}</span>
      </div>
      @if($contrat->bien->superficie)
      <div class="row">
        <span class="label">Superficie :</span>
        <span class="value">{{ $contrat->bien->superficie }} m²</span>
      </div>
      @endif
    </div>
    @endif
  </div>

  {{-- Article 2 --}}
  <div class="article">
    <div class="article-title">Article 2 : Prise d'effet</div>
    <p>
      La mise à disposition effective du bien au profit de la Partie B est fixée à la date du
      <strong>{{ \Carbon\Carbon::parse($contrat->date_debut)->format('d/m/Y') }}</strong>.
      À cette date, la Partie B prendra possession du bien dans l'état où il se trouve,
      après avoir effectué un constat contradictoire avec la Partie A.
      @if($contrat->type === 'loyer' && $contrat->date_fin)
        Le contrat prend fin le <strong>{{ \Carbon\Carbon::parse($contrat->date_fin)->format('d/m/Y') }}</strong>.
      @endif
    </p>
  </div>

  {{-- Article 3 --}}
  <div class="article">
    <div class="article-title">Article 3 : Conditions financières</div>
    <p>En contrepartie de cette mise à disposition, la Partie B s'oblige à verser à la Partie A :</p>
    <div class="montant-box">
      <div class="row">
        <span class="label">Montant HT :</span>
        <span class="value">{{ number_format((float)$contrat->montant_ht, 3, ',', ' ') }} TND</span>
      </div>
      @if($contrat->tva > 0)
      <div class="row">
        <span class="label">TVA :</span>
        <span class="value">{{ number_format((float)$contrat->tva, 1, ',', '') }}%</span>
      </div>
      @endif
      @if($contrat->montant_ttc)
      <div class="row">
        <span class="label">Montant TTC :</span>
        <span class="value">{{ number_format((float)$contrat->montant_ttc, 3, ',', ' ') }} TND</span>
      </div>
      @endif
      @if($contrat->frais_syndic)
      <div class="row">
        <span class="label">Frais syndic :</span>
        <span class="value">{{ number_format((float)$contrat->frais_syndic, 3, ',', ' ') }} TND</span>
      </div>
      @endif
      @if($contrat->retenue_source)
      <div class="row">
        <span class="label">Retenue à la source :</span>
        <span class="value">{{ number_format((float)$contrat->retenue_source, 1, ',', '') }}%</span>
      </div>
      @endif
      @if($contrat->montant_paiement)
      <div class="row">
        <span class="label">Montant à payer :</span>
        <span class="value">{{ number_format((float)$contrat->montant_paiement, 3, ',', ' ') }} TND</span>
      </div>
      @endif
      @php
        $periodiciteLabels = ['mensuel'=>'Mensuel','bimestriel'=>'Bimestriel','trimestriel'=>'Trimestriel','quadrimestriel'=>'Quadrimestriel','semestriel'=>'Semestriel','annuel'=>'Annuel'];
      @endphp
      @if($contrat->periodicite_paiement)
      <div class="row">
        <span class="label">Périodicité :</span>
        <span class="value">{{ $periodiciteLabels[$contrat->periodicite_paiement] ?? $contrat->periodicite_paiement }}{{ $contrat->jour_paiement ? ' — le ' . $contrat->jour_paiement . ' de chaque mois' : '' }}</span>
      </div>
      @endif
      @if($contrat->premiere_echeance)
      <div class="row">
        <span class="label">1ère échéance :</span>
        <span class="value">{{ \Carbon\Carbon::parse($contrat->premiere_echeance)->format('d/m/Y') }}</span>
      </div>
      @endif
      @if($contrat->depot_garantie)
      <div class="row">
        <span class="label">Dépôt de garantie :</span>
        <span class="value">{{ number_format((float)$contrat->depot_garantie, 3, ',', ' ') }} TND</span>
      </div>
      @endif
    </div>
  </div>

  {{-- Article 4 --}}
  <div class="article">
    <div class="article-title">Article 4 : Obligations des parties</div>
    <p>La Partie A garantit que le bien est libre de toute entrave juridique empêchant sa jouissance par la Partie B.</p>
    <p>La Partie B s'engage à utiliser le bien conformément à sa destination et à ne rien faire qui puisse en dégrader la valeur ou la structure.</p>
  </div>

  {{-- Article 5 --}}
  <div class="article">
    <div class="article-title">Article 5 : Nature de la relation</div>
    <p>
      Les parties conviennent que la nature définitive de cette convention est entendue comme
      @if($contrat->type === 'loyer')
        <strong>une concession de jouissance temporaire</strong>, régie par les dispositions légales applicables au contrat de location.
      @else
        <strong>une cession définitive de droits</strong>, régie par les dispositions légales applicables au contrat de vente.
      @endif
    </p>
  </div>

  {{-- Article 6 --}}
  <div class="article">
    <div class="article-title">Article 6 : Élection de domicile</div>
    <p>Pour l'exécution du présent contrat et de ses suites, les parties élisent domicile à leurs adresses respectives mentionnées en tête des présentes.</p>
  </div>

  @if($contrat->notes)
  <div class="article">
    <div class="article-title">Notes</div>
    <p>{{ $contrat->notes }}</p>
  </div>
  @endif

  {{-- Signatures --}}
  <div class="signature-block">
    <p style="font-size:11px; color:#334155; margin-bottom:16px;">
      Fait à <strong>{{ $contrat->ville_signature ?? ($contrat->organisation->ville ?? '—') }}</strong>,
      le <strong>
        @if($contrat->date_contrat)
          {{ \Carbon\Carbon::parse($contrat->date_contrat)->format('d/m/Y') }}
        @else
          {{ $contrat->created_at->format('d/m/Y') }}
        @endif
      </strong>
      en deux exemplaires originaux.
    </p>
    <div class="signatures">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">{{ $contrat->organisation->nom }}</div>
        <div class="sig-label">La Partie A — {{ $contrat->representant ?? 'Représentant légal' }}</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">{{ $client ? $client->nom_complet : '—' }}</div>
        <div class="sig-label">La Partie B</div>
      </div>
    </div>
  </div>

  {{-- Pied de page --}}
  <div class="footer">
    Document généré le {{ now()->format('d/m/Y à H:i') }} — {{ $contrat->organisation->nom }}
    @if($contrat->organisation->email) — {{ $contrat->organisation->email }}@endif
  </div>

</div>
</body>
</html>
