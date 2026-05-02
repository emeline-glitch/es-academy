import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const region = process.env.AWS_SES_REGION || "eu-west-3";
const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
const fromEmail = process.env.SES_FROM_EMAIL || "emeline@emeline-siron.fr";
const fromName = process.env.SES_FROM_NAME || "Emeline Siron";
const to = process.argv[2] || fromEmail;

if (!accessKeyId || !secretAccessKey) {
  console.error("ERREUR: AWS_SES_ACCESS_KEY_ID ou AWS_SES_SECRET_ACCESS_KEY manquant.");
  process.exit(1);
}

const client = new SESv2Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

const cmd = new SendEmailCommand({
  FromEmailAddress: `${fromName} <${fromEmail}>`,
  Destination: { ToAddresses: [to] },
  Content: {
    Simple: {
      Subject: { Data: "Test SES ES Academy", Charset: "UTF-8" },
      Body: {
        Html: {
          Data: `<p>Si tu lis ceci, AWS SES fonctionne en local.</p><p>Région: ${region}<br>From: ${fromEmail}<br>To: ${to}</p>`,
          Charset: "UTF-8",
        },
      },
    },
  },
});

try {
  const res = await client.send(cmd);
  console.log("OK envoi SES");
  console.log("MessageId:", res.MessageId);
  console.log("Destinataire:", to);
} catch (e) {
  console.error("KO envoi SES:", e.name, "-", e.message);
  process.exit(1);
}
