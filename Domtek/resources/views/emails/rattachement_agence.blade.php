<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle agence dans votre espace client</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          {{-- En-tête --}}
          <tr>
            <td style="background:#1e293b;padding:28px 36px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Domtek</p>
              <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Votre espace client</p>
            </td>
          </tr>

          {{-- Corps --}}
          <tr>
            <td style="padding:36px;">
              <p style="margin:0 0 6px;font-size:15px;color:#334155;">
                Bonjour <strong>{{ $client->nom_complet }}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                @if ($organisation)
                  L'agence <strong>{{ $organisation->nom }}</strong> vous a référencé comme client.
                @else
                  Une nouvelle agence vous a référencé comme client.
                @endif
                <br>
                Ses contrats et ses factures sont désormais visibles dans votre espace.
                <strong>Vos identifiants ne changent pas</strong> : connectez-vous comme d'habitude.
              </p>

              {{-- Bouton --}}
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td align="center" style="background:#2563eb;border-radius:8px;">
                    <a href="{{ $url }}"
                       style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                      Accéder à mon espace
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Identifiant : <strong style="color:#475569;">{{ $user->email }}</strong>
              </p>
            </td>
          </tr>

          {{-- Pied de page --}}
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.7;">
                Si ce rattachement vous semble erroné, contactez directement l'agence concernée.<br>
                Cet e-mail a été généré automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
