#!/usr/bin/env node
// Read-only delivery check for the site's test emails in the IONOS mailbox.
//
//   node scripts/check-test-emails.mjs [--since YYYY-MM-DD] [--verbose]
//
// Needs env var AIM_IMAP_PASSWORD. Optional: AIM_IMAP_USER, AIM_IMAP_HOST, AIM_IMAP_PORT.
// Folders are opened with EXAMINE (read-only) and headers fetched with BODY.PEEK,
// so nothing is deleted, moved, or marked as read. The password is never printed.
// Exit code: 0 = all expected emails found, 1 = some missing, 2 = error.

import tls from "node:tls";

const HOST = process.env.AIM_IMAP_HOST || "imap.ionos.co.uk";
const PORT = Number(process.env.AIM_IMAP_PORT || 993);
const USER = process.env.AIM_IMAP_USER || "enquiry@aimsmartsolutions.tech";
const PASSWORD = process.env.AIM_IMAP_PASSWORD;

// Subjects sent by supabase/functions/*. Customer copies go to the address typed
// into the form, so they only land here if the test used this mailbox as the customer.
const EXPECTED = [
  { label: "Enquiry: customer acknowledgement", re: /^We have received your enquiry - AIM Smart Solutions/i },
  { label: "Enquiry: owner notification", re: /^(\[URGENT\] )?New enquiry - /i },
  { label: "Quote/service request: customer acknowledgement", re: /^We have received your service request/i },
  { label: "Quote/service request: owner notification", re: /^New service request - /i },
  { label: "Booking confirmation", re: /^Your appointment is confirmed/i },
];

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const sinceArg = args.includes("--since") ? args[args.indexOf("--since") + 1] : null;
const since = sinceArg ? new Date(`${sinceArg}T00:00:00`) : new Date();
if (Number.isNaN(since.getTime())) fail("Invalid --since date, use YYYY-MM-DD.");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const imapDate = `${since.getDate()}-${MONTHS[since.getMonth()]}-${since.getFullYear()}`;

if (!PASSWORD) fail("AIM_IMAP_PASSWORD is not set.");

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(2);
}

// --- Minimal IMAP client (latin1 strings so byte counts match literals) ---
class Imap {
  constructor(socket) {
    this.socket = socket;
    this.buf = "";
    this.n = 0;
    this.waiter = null;
    socket.setEncoding("latin1");
    socket.on("data", (d) => { this.buf += d; this.waiter?.(); });
  }
  waitFor(test) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("IMAP timeout")), 30000);
      const check = () => {
        const r = test(this.buf);
        if (r !== undefined) { clearTimeout(timer); this.waiter = null; resolve(r); }
      };
      this.waiter = check;
      check();
    });
  }
  async greeting() {
    await this.waitFor((b) => (b.includes("\r\n") ? true : undefined));
    this.buf = "";
  }
  async cmd(text, { literal } = {}) {
    const tag = `A${++this.n}`;
    if (literal !== undefined) {
      // Send the secret as a literal so special characters need no escaping.
      const len = Buffer.byteLength(literal, "utf8");
      this.socket.write(`${tag} ${text} {${len}}\r\n`);
      await this.waitFor((b) => (/^\+/m.test(b) ? true : /^A\d+ (NO|BAD)/m.test(b) ? true : undefined));
      if (!/^\+/m.test(this.buf)) throw new Error("Server refused login");
      this.buf = "";
      this.socket.write(Buffer.from(`${literal}\r\n`, "utf8"));
    } else {
      this.socket.write(`${tag} ${text}\r\n`);
    }
    const re = new RegExp(`(^|\\r\\n)${tag} (OK|NO|BAD)([^\\r\\n]*)\\r\\n`);
    const m = await this.waitFor((b) => b.match(re) ?? undefined);
    const out = this.buf.slice(0, m.index);
    this.buf = this.buf.slice(m.index + m[0].length);
    if (m[2] !== "OK") throw new Error(`${text.split(" ")[0]} failed: ${m[2]}${m[3]}`);
    return out;
  }
}

function decodeWords(s) {
  return s.replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, cs, enc, data) => {
    const bytes = enc.toUpperCase() === "B"
      ? Buffer.from(data, "base64")
      : Buffer.from(data.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (__, h) => String.fromCharCode(parseInt(h, 16))), "latin1");
    try { return new TextDecoder(cs).decode(bytes); } catch { return bytes.toString("utf8"); }
  }).replace(/\?=\s+=\?/g, "?==?");
}

function parseHeaders(block) {
  const unfolded = block.replace(/\r\n[ \t]+/g, " ");
  const h = {};
  for (const line of unfolded.split("\r\n")) {
    const i = line.indexOf(":");
    if (i > 0) h[line.slice(0, i).toLowerCase()] = decodeWords(line.slice(i + 1).trim());
  }
  return h;
}

function parseFetch(raw) {
  const msgs = [];
  const re = /\* \d+ FETCH \([^{]*\{(\d+)\}\r\n/g;
  let m;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length;
    msgs.push(parseHeaders(raw.slice(start, start + Number(m[1]))));
    re.lastIndex = start + Number(m[1]);
  }
  return msgs;
}

function parseList(raw) {
  const folders = [];
  for (const line of raw.split("\r\n")) {
    const m = line.match(/^\* LIST \(([^)]*)\) (?:"[^"]*"|NIL) (.+)$/i);
    if (!m) continue;
    let name = m[2].trim();
    if (name.startsWith('"')) name = name.slice(1, -1).replace(/\\(.)/g, "$1");
    folders.push({ flags: m[1], name });
  }
  return folders;
}

const quote = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

async function main() {
  const socket = tls.connect({ host: HOST, port: PORT, servername: HOST });
  await new Promise((res, rej) => { socket.once("secureConnect", res); socket.once("error", rej); });
  const imap = new Imap(socket);
  await imap.greeting();
  try {
    await imap.cmd(`LOGIN ${quote(USER)}`, { literal: PASSWORD });
  } catch (err) {
    throw new Error(`Login failed for ${USER} on ${HOST} (check AIM_IMAP_PASSWORD). Server said: ${err.message}`);
  }

  const folders = parseList(await imap.cmd('LIST "" "*"'));
  const inbox = folders.find((f) => f.name.toUpperCase() === "INBOX") ?? { name: "INBOX" };
  const junk = folders.filter((f) => /\\Junk/i.test(f.flags) || /spam|junk/i.test(f.name));
  const toCheck = [inbox, ...junk.filter((f) => f !== inbox)];
  if (!junk.length) console.log("Note: no Spam/Junk folder found on the server.");

  console.log(`Mailbox ${USER} on ${HOST}:${PORT}, read-only, since ${imapDate}\n`);
  const found = [];
  for (const folder of toCheck) {
    await imap.cmd(`EXAMINE ${quote(folder.name)}`);
    const search = await imap.cmd(`SEARCH SINCE ${imapDate}`);
    const ids = (search.match(/^\* SEARCH([\d ]*)/m)?.[1] ?? "").trim().split(/\s+/).filter(Boolean);
    let msgs = [];
    if (ids.length) {
      msgs = parseFetch(await imap.cmd(`FETCH ${ids.join(",")} (BODY.PEEK[HEADER.FIELDS (SUBJECT FROM TO DATE)])`));
    }
    console.log(`${folder.name}: ${msgs.length} message(s) since ${imapDate}`);
    for (const h of msgs) {
      const exp = EXPECTED.find((e) => e.re.test(h.subject ?? ""));
      if (exp) found.push({ ...h, label: exp.label, folder: folder.name });
      if (verbose) console.log(`   - ${h.date ?? ""} | ${h.subject ?? "(no subject)"}`);
    }
  }
  await imap.cmd("LOGOUT").catch(() => {});
  socket.end();

  console.log("\nResults:");
  let missing = 0;
  for (const e of EXPECTED) {
    const hits = found.filter((f) => f.label === e.label);
    if (!hits.length) { missing++; console.log(`  MISSING  ${e.label}`); continue; }
    for (const h of hits) console.log(`  FOUND    ${e.label}  [${h.folder}]  ${h.date ?? ""}\n           "${h.subject}"  to: ${h.to ?? "?"}`);
  }
  console.log(missing ? `\n${missing} expected type(s) not found. Customer copies only arrive here if the form used this address.` : "\nAll expected email types found.");
  process.exit(missing ? 1 : 0);
}

main().catch((err) => fail(String(err?.message ?? err).replaceAll(PASSWORD, "***")));
