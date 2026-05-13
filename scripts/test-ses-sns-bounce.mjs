// Test integration : envoie un mail au simulateur SES bounce, observe que :
//   1. SES bounce immediatement (mailbox simulator owned by AWS)
//   2. SES notifie SNS topic ses-bounce-notifications
//   3. SNS POST notre webhook https://emeline-siron.fr/api/aws/sns/webhook
//   4. Webhook insert dans processed_sns_messages + audit_log
//
// Adresses simulateur AWS SES :
//   - bounce@simulator.amazonses.com -> hard bounce instantane
//   - complaint@simulator.amazonses.com -> complaint instantane
//   - success@simulator.amazonses.com -> delivered, pas de bounce
//
// Run : node --env-file=.env.local scripts/test-ses-sns-bounce.mjs

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const target = process.argv[2] || "bounce";
if (!["bounce", "complaint", "success"].includes(target)) {
  console.error("Usage: node scripts/test-ses-sns-bounce.mjs [bounce|complaint|success]");
  process.exit(1);
}

const ses = new SESv2Client({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
});

const to = `${target}@simulator.amazonses.com`;

const cmd = new SendEmailCommand({
  FromEmailAddress: `${process.env.SES_FROM_NAME} <${process.env.SES_FROM_EMAIL}>`,
  Destination: { ToAddresses: [to] },
  Content: {
    Simple: {
      Subject: { Data: `Test SNS webhook ${target} (${new Date().toISOString()})` },
      Body: {
        Text: {
          Data: `Test integration SES -> SNS -> webhook /api/aws/sns/webhook.\nCible simulateur AWS : ${to}\nMode attendu : ${target}\nTimestamp : ${new Date().toISOString()}`,
        },
      },
    },
  },
});

console.log(`Envoi a ${to}...`);
const result = await ses.send(cmd);
console.log(`Sent. MessageId : ${result.MessageId}`);
console.log(`Attend 15-30s puis check audit_log + processed_sns_messages cote Supabase.`);
