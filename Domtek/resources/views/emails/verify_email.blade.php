<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérification de votre adresse e-mail</title>
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
              <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Vérification de votre adresse e-mail</p>
            </td>
          </tr>

          {{-- Corps --}}
          <tr>
            <td style="padding:36px;">
              <p style="margin:0 0 6px;font-size:15px;color:#334155;">
                Bonjour <strong>{{ $user->name }}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                Merci de vous être inscrit sur Domtek.<br>
                Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail.
                Ce lien est valable pendant <strong>24 heures</strong>.
              </p>

              {{-- Bouton --}}
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="background:#2563eb;border-radius:8px;">
                    <a href="{{ $verifyUrl }}"
                       style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                      Vérifier mon adresse e-mail
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
              </p>
              <p style="margin:0;font-size:11px;color:#3b82f6;text-align:center;word-break:break-all;">
                {{ $verifyUrl }}
              </p>
            </td>
          </tr>

          {{-- Pied de page --}}
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 36px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.7;">
                Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.<br>
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
