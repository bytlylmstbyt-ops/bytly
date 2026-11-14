import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const registration = await readFile(
  new URL("../supabase/functions/complete-registration/index.ts", import.meta.url),
  "utf8",
);
const workspace = await readFile(
  new URL("../supabase/functions/send-workspace-notification/index.ts", import.meta.url),
  "utf8",
);

test("engineer registration requires both certificates and a valid upload session", () => {
  assert.match(registration, /const certificateFields=\["graduation_certificate_url","saudi_engineers_council_certificate_url"\]/);
  assert.match(registration, /registration-temp\/\$\{uploadSessionId\}/);
  assert.match(registration, /if\(!expectedPathPattern\?\.test\(path\)\)/);
  assert.match(registration, /if\(!doc\?\.name\)/);
});

test("certificate validation checks size and file signatures before account creation", () => {
  assert.match(registration, /blob\.size<=0\|\|blob\.size>10\*1024\*1024/);
  assert.match(registration, /const signatureValid=doc\.type==="application\/pdf"/);
  assert.match(registration, /header\[0\]===0xff&&header\[1\]===0xd8&&header\[2\]===0xff/);
  assert.match(registration, /header\[0\]===0x89/);
  assert.match(registration, /"WEBP"/);
  assert.ok(registration.indexOf("validatedDocuments.set(field") < registration.indexOf("admin.auth.admin.createUser("),
    "all submitted documents must be validated before creating an auth user");
});

test("engineer accounts remain pending and unverified after registration", () => {
  assert.match(registration, /if\(table==="engineers"\)\{row\.status="pending";row\.is_verified=false;\}/);
});

test("temporary uploads are tracked for cleanup before document validation", () => {
  const track = registration.indexOf("temporaryDocumentPaths.push(candidatePath)");
  const validate = registration.indexOf("if(!expectedPathPattern?.test(path))");
  assert.ok(track >= 0 && validate >= 0 && track < validate);
  assert.match(registration, /registration-documents"\)\.remove\(temporaryDocumentPaths\)/);
  assert.ok(registration.includes("(pdf|jpg|png|webp)$"), "cleanup tracking must not trust the caller-declared MIME type");
});

test("upload rate limiting requires the edge IP and fails closed on missing IP or RPC errors", () => {
  assert.match(registration, /req\.headers\.get\("cf-connecting-ip"\)/);
  assert.match(registration, /if\(!clientIp\)return \{ok:false,reason:"trusted_client_ip_unavailable"\}/);
  assert.match(registration, /admin\.rpc\("consume_registration_upload_rate_limit"/);
  assert.match(registration, /if\(error\)return \{ok:false,reason:"rate_limit_backend_unavailable"\}/);
  assert.match(registration, /rateLimit\.reason==="rate_limit_exceeded"\?429:503/);
});

test("workspace email headers strip CRLF from recipient and subject", () => {
  assert.ok(workspace.includes('const cleanHeader = (value: unknown) => String(value ?? "").replace(/[\\r\\n]/g, " ").trim();'));
  assert.match(workspace, /`To: \$\{cleanHeader\(to\)\}`/);
  assert.match(workspace, /`Subject: \$\{cleanHeader\(subject\)\}`/);
});

test("workspace authorization lookup failures stop before notification insertion", () => {
  const failed = workspace.indexOf('error: "PARTICIPANT_LOOKUP_FAILED"');
  const insert = workspace.indexOf('admin.from("notifications").insert(rows)');
  assert.ok(failed >= 0 && insert >= 0 && failed < insert);
  assert.ok(workspace.includes('if (!isParticipant && !isAdmin) return json({ ok: false, error: "NOT_A_PROJECT_PARTICIPANT" }, 403);'));
});

test("workspace email delivery is best-effort after notifications are inserted", () => {
  const insert = workspace.indexOf('admin.from("notifications").insert(rows)');
  const send = workspace.indexOf("sendSystemEmail(to, title, html)");
  assert.ok(insert >= 0 && send > insert);
  assert.match(workspace, /catch \(error\) \{\s*console\.error\("Workspace email delivery failed", error\);\s*return \{ sent: false, reason: "email_delivery_unavailable" \};/);
  assert.match(workspace, /return json\(\{ ok: true, notified: rows\.length, emailed, emailUnavailable \}\)/);
});
