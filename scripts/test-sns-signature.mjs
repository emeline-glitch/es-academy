// Test unitaire de la verification de signature SNS.
//
// Run : node scripts/test-sns-signature.mjs
//
// Couvre :
//   1. Signature valide avec cert auto-genere -> true
//   2. Signature corrompue -> false
//   3. CertURL hors domaine sns.*.amazonaws.com -> false
//   4. CertURL avec mauvais protocole (http) -> false
//   5. Message sans Signature -> false
//   6. SubscriptionConfirmation avec Token+SubscribeURL valides -> true
//   7. SubscriptionConfirmation sans Token -> false (buildStringToSign throw)
//
// Le test mocke `fetch` pour servir un certificat auto-genere correspondant
// a la cle privee utilisee pour signer le message canonique. C'est exactement
// le meme algorithme que SNS (RSA-SHA1 ou RSA-SHA256 selon SignatureVersion).

import crypto from "node:crypto";
import { verifySnsSignature, buildStringToSign, isValidSnsCertUrl } from "../src/lib/aws/sns-signature.ts";

let pass = 0;
let fail = 0;
const failures = [];

function assert(name, cond, details) {
  if (cond) {
    pass++;
    console.log(`OK   ${name}`);
  } else {
    fail++;
    failures.push({ name, details });
    console.error(`FAIL ${name}`, details || "");
  }
}

// Genere une paire RSA + cert auto-signe au format PEM. SNS utilise RSA, donc
// notre clef test fait pareil.
function genRsaCertPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  // crypto.createVerify accepte directement une cle publique PEM (pas besoin de la
  // wrapper dans un X509 cert pour ce test).
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

function signCanonical(privateKeyPem, stringToSign, algo) {
  const signer = crypto.createSign(algo);
  signer.update(stringToSign, "utf-8");
  return signer.sign(privateKeyPem).toString("base64");
}

function makeMockFetch(certPem) {
  return async (url) => {
    return {
      ok: true,
      status: 200,
      text: async () => certPem,
    };
  };
}

async function main() {
  // ---------------- Test 1 : signature valide RSA-SHA256 ----------------
  {
    const { publicKeyPem, privateKeyPem } = genRsaCertPair();
    const baseMsg = {
      Type: "Notification",
      MessageId: "msg-1",
      TopicArn: "arn:aws:sns:eu-west-3:123:test",
      Message: "hello",
      Timestamp: "2026-05-12T08:00:00.000Z",
      SignatureVersion: "2",
      SigningCertURL: "https://sns.eu-west-3.amazonaws.com/cert.pem",
      Subject: "sujet",
      Signature: "", // a remplir
    };
    const canonical = buildStringToSign(baseMsg);
    baseMsg.Signature = signCanonical(privateKeyPem, canonical, "RSA-SHA256");
    const ok = await verifySnsSignature(baseMsg, makeMockFetch(publicKeyPem));
    assert("signature valide RSA-SHA256 retourne true", ok === true);
  }

  // ---------------- Test 2 : signature corrompue ----------------
  {
    const { publicKeyPem, privateKeyPem } = genRsaCertPair();
    const baseMsg = {
      Type: "Notification",
      MessageId: "msg-2",
      TopicArn: "arn:aws:sns:eu-west-3:123:test",
      Message: "hello",
      Timestamp: "2026-05-12T08:00:00.000Z",
      SignatureVersion: "2",
      SigningCertURL: "https://sns.eu-west-3.amazonaws.com/cert.pem",
      Signature: "",
    };
    const canonical = buildStringToSign(baseMsg);
    const valid = signCanonical(privateKeyPem, canonical, "RSA-SHA256");
    // On corrompt 1 char en milieu pour casser la signature sans casser le base64
    const corrupted = valid.slice(0, 20) + (valid[20] === "A" ? "B" : "A") + valid.slice(21);
    baseMsg.Signature = corrupted;
    const ok = await verifySnsSignature(baseMsg, makeMockFetch(publicKeyPem));
    assert("signature corrompue retourne false", ok === false);
  }

  // ---------------- Test 3 : certURL hors domaine SNS ----------------
  {
    assert(
      "certURL hors amazonaws.com refuse",
      isValidSnsCertUrl("https://evil.example.com/cert.pem") === false,
    );
    assert(
      "certURL amazonaws.com mais pas sns.* refuse",
      isValidSnsCertUrl("https://s3.eu-west-3.amazonaws.com/cert.pem") === false,
    );
  }

  // ---------------- Test 4 : protocole http refuse ----------------
  {
    assert(
      "certURL http refuse",
      isValidSnsCertUrl("http://sns.eu-west-3.amazonaws.com/cert.pem") === false,
    );
  }

  // ---------------- Test 5 : message sans Signature ----------------
  {
    const msg = {
      Type: "Notification",
      MessageId: "msg-5",
      TopicArn: "arn:aws:sns:eu-west-3:123:test",
      Message: "hello",
      Timestamp: "2026-05-12T08:00:00.000Z",
      SignatureVersion: "2",
      SigningCertURL: "https://sns.eu-west-3.amazonaws.com/cert.pem",
      // Signature absente
    };
    const ok = await verifySnsSignature(msg, makeMockFetch("dummy"));
    assert("message sans Signature retourne false", ok === false);
  }

  // ---------------- Test 6 : SubscriptionConfirmation valide ----------------
  {
    const { publicKeyPem, privateKeyPem } = genRsaCertPair();
    const baseMsg = {
      Type: "SubscriptionConfirmation",
      MessageId: "msg-6",
      TopicArn: "arn:aws:sns:eu-west-3:123:test",
      Message: "subscribe",
      Timestamp: "2026-05-12T08:00:00.000Z",
      SignatureVersion: "1",
      SigningCertURL: "https://sns.eu-west-3.amazonaws.com/cert.pem",
      Token: "tok-xyz",
      SubscribeURL: "https://sns.eu-west-3.amazonaws.com/subscribe",
      Signature: "",
    };
    const canonical = buildStringToSign(baseMsg);
    baseMsg.Signature = signCanonical(privateKeyPem, canonical, "RSA-SHA1");
    const ok = await verifySnsSignature(baseMsg, makeMockFetch(publicKeyPem));
    assert("SubscriptionConfirmation valide (RSA-SHA1) retourne true", ok === true);
  }

  // ---------------- Test 7 : SubscriptionConfirmation sans Token ----------------
  {
    const { publicKeyPem, privateKeyPem } = genRsaCertPair();
    const msg = {
      Type: "SubscriptionConfirmation",
      MessageId: "msg-7",
      TopicArn: "arn:aws:sns:eu-west-3:123:test",
      Message: "subscribe",
      Timestamp: "2026-05-12T08:00:00.000Z",
      SignatureVersion: "1",
      SigningCertURL: "https://sns.eu-west-3.amazonaws.com/cert.pem",
      // Token et SubscribeURL absents -> buildStringToSign throw -> verify renvoie false
      Signature: signCanonical(privateKeyPem, "irrelevant", "RSA-SHA1"),
    };
    const ok = await verifySnsSignature(msg, makeMockFetch(publicKeyPem));
    assert("SubscriptionConfirmation sans Token retourne false", ok === false);
  }

  // ---------------- Summary ----------------
  console.log("\n----------------");
  console.log(`Passed : ${pass}`);
  console.log(`Failed : ${fail}`);
  if (fail > 0) {
    console.log("\nFailures detail :");
    for (const f of failures) {
      console.log(`  - ${f.name}`, f.details || "");
    }
    process.exit(1);
  }
  console.log("\nAll SNS signature tests passed.");
}

main().catch((e) => {
  console.error("Test script crashed:", e);
  process.exit(2);
});
