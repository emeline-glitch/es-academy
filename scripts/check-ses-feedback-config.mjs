// Verifie la config feedback notifications de l'identite SES emeline-siron.fr
//
// Run : node --env-file=.env.local scripts/check-ses-feedback-config.mjs

import { SESv2Client, GetEmailIdentityCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
});

for (const identity of ["emeline-siron.fr", "emeline@emeline-siron.fr"]) {
  console.log(`\n=== ${identity} ===`);
  try {
    const resp = await ses.send(new GetEmailIdentityCommand({ EmailIdentity: identity }));
    console.log("Verified:", resp.VerifiedForSendingStatus);
    console.log("IdentityType:", resp.IdentityType);
    console.log("FeedbackForwardingStatus:", resp.FeedbackForwardingStatus);
    console.log("MailFromAttributes:", resp.MailFromAttributes);
  } catch (err) {
    console.log("Error:", err.name, err.message);
  }
}
