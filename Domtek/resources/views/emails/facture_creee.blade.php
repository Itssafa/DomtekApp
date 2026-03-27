<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre facture</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          {{-- ── En-tête ── --}}
          <tr>
            <td style="background:#1e293b;padding:28px 36px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                {{ $facture->organisation->nom }}
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">
                Nouvelle facture émise à votre attention
              </p>
            </td>
          </tr>

          {{-- ── Corps ── --}}
          <tr>
            <td style="padding:36px;">

              <p style="margin:0 0 6px;font-size:15px;color:#334155;">
                Bonjour <strong>{{ $facture->client?->nom_complet ?? 'Client' }}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
                @php
                  $typeLabels = [
                    'eau' => 'Eau', 'electricite' => 'Électricité', 'gaz' => 'Gaz',
                    'electricite_gaz' => 'Électricité & Gaz', 'loyer' => 'Loyer',
                  ];
                  $typeLabel = $typeLabels[$facture->type] ?? ucfirst($facture->type);
                @endphp
                Une nouvelle facture <strong>{{ $typeLabel }}</strong>
                d'un montant de <strong>{{ number_format((float)$facture->montant, 3, ',', ' ') }} TND</strong>
                vient d'être émise pour votre compte.
                Elle est à régler avant le
                <strong>{{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}</strong>.
              </p>

              {{-- Récapitulatif --}}
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;">Référence</span><br>
                    <span style="font-size:14px;font-weight:600;color:#1e293b;">{{ $facture->reference ?? 'N°'.$facture->id }}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;">Type de facture</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#334155;">{{ $typeLabel }}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;">Date d'émission</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#334155;">
                          {{ \Carbon\Carbon::parse($facture->date_emission)->format('d/m/Y') }}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;">Date d'échéance</td>
                        <td align="right" style="font-size:13px;font-weight:600;color:#e11d48;">
                          {{ \Carbon\Carbon::parse($facture->date_echeance)->format('d/m/Y') }}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 20px;background:#eff6ff;border-radius:0 0 8px 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:14px;font-weight:700;color:#1e40af;">Montant total</td>
                        <td align="right" style="font-size:18px;font-weight:700;color:#1e40af;">
                          {{ number_format((float)$facture->montant, 3, ',', ' ') }} TND
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              {{-- Bouton de paiement --}}
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td align="center" style="background:#2563eb;border-radius:8px;">
                    <a href="{{ $paymentUrl }}"
                       style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                      {{ $facture->type === 'loyer' ? '💳 Payer le loyer' : '💳 Régler en ligne' }}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Le bouton ci-dessus vous redirige vers une page de paiement sécurisée (Stripe).<br>
                La facture est également disponible en pièce jointe au format PDF.
              </p>

            </td>
          </tr>

          {{-- ── Pied de page ── --}}
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.7;">
                {{ $facture->organisation->nom }}
                @if($facture->organisation->email)
                  — {{ $facture->organisation->email }}
                @endif
                @if($facture->organisation->telephone)
                  — {{ $facture->organisation->telephone }}
                @endif
                <br>Cet e-mail a été généré automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
