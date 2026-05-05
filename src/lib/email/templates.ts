const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #2c6e55; padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-family: Georgia, serif; }
    .content { padding: 32px; line-height: 1.6; }
    .content h2 { font-family: Georgia, serif; color: #2c6e55; margin-top: 0; }
    .cta-button { display: inline-block; background: #C9A96E; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .footer { padding: 24px 32px; background: #f9f9f9; text-align: center; font-size: 12px; color: #999; }
    .footer a { color: #2c6e55; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ES Academy</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Emeline Siron : Aix-en-Provence</p>
      <p><a href="{{unsubscribe_url}}">Se desabonner</a></p>
    </div>
  </div>
</body>
</html>
`;

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Bienvenue dans ES Academy !",
    html: baseTemplate(`
      <h2>Bienvenue ${name} !</h2>
      <p>Tu viens de rejoindre ES Academy et ta formation est prete.</p>
      <p>Connecte-toi a ton espace pour commencer :</p>
      <p><a href="{{site_url}}/connexion" class="cta-button">Acceder a ma formation</a></p>
      <p>Si tu as des questions, reponds simplement a cet email.</p>
      <p>A tout de suite,<br><strong>Emeline</strong></p>
    `),
  };
}

export function newsletterTemplate(title: string, content: string): { subject: string; html: string } {
  return {
    subject: title,
    html: baseTemplate(content),
  };
}

export function reminderEmail(name: string, lessonName: string): { subject: string; html: string } {
  return {
    subject: `${name}, ta formation t'attend !`,
    html: baseTemplate(`
      <h2>Tu en etais ou, ${name} ?</h2>
      <p>Ta prochaine lecon est : <strong>${lessonName}</strong></p>
      <p>Continue ta progression et rapproche-toi de ton premier investissement !</p>
      <p><a href="{{site_url}}/dashboard" class="cta-button">Reprendre ma formation</a></p>
    `),
  };
}
