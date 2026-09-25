const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "dist");
const PROJECT = process.env.FIREBASE_PROJECT_ID || "";
const EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "";
const KEY = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || "";
const SMTP_PASS = (process.env.SMTP_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const NODE_ENV = process.env.NODE_ENV || "production";
let tokenCache = null;
function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(obj));
}
function bodyOf(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 4e6) req.destroy(); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("bad json")); } });
  });
}
function hashPass(password, salt) { return crypto.scryptSync(String(password), salt, 32).toString("hex"); }
function pub(u) { return { id: u.id, email: u.email, username: u.username, displayName: u.displayName, createdAt: u.createdAt }; }
function bid(email, extra="") { return crypto.createHash("sha256").update(email + extra).digest("hex").slice(0, 24); }
async function gtoken() {
  if (!PROJECT || !EMAIL || !KEY) throw new Error("FIREBASE_NOT_CONFIGURED");
  if (tokenCache && tokenCache.exp > Date.now() + 20000) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: EMAIL, sub: EMAIL, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600, scope: "https://www.googleapis.com/auth/datastore" })).toString("base64url");
  const signer = crypto.createSign("RSA-SHA256"); signer.update(header + "." + payload);
  const assertion = header + "." + payload + "." + signer.sign(KEY, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const data = await res.json();
  if (!data.access_token) throw new Error("FIREBASE_AUTH_FAILED");
  tokenCache = { token: data.access_token, exp: Date.now() + 3000000 };
  return tokenCache.token;
}
function fromDoc(doc) {
  if (!doc || !doc.fields) return null;
  const o = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    if (v.stringValue !== undefined) o[k] = v.stringValue;
    else if (v.integerValue !== undefined) o[k] = Number(v.integerValue);
  }
  return o;
}
function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = { stringValue: String(v ?? "") };
  return { fields };
}
async function fsWrite(col, id, obj) {
  const token = await gtoken();
  const res = await fetch("https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/" + col + "/" + id, { method: "PATCH", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(toFields(obj)) });
  if (!res.ok) throw new Error("FIREBASE_WRITE_FAILED");
  return obj;
}
async function fsRead(col, id) {
  const token = await gtoken();
  const res = await fetch("https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/" + col + "/" + id, { headers: { Authorization: "Bearer " + token } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("FIREBASE_READ_FAILED");
  return fromDoc(await res.json());
}
async function findUser(identifier) {
  const byUser = await fsRead("studio_usernames", identifier.replace(/[^a-z0-9_@.]/g, ""));
  if (byUser && byUser.userId) return fsRead("studio_users", byUser.userId);
  return null;
}
async function mailOtp(to, code) {
  if (!SMTP_USER || !SMTP_PASS) {
    if (NODE_ENV !== "production") return { sent: true, devCode: code };
    throw new Error("MAIL_NOT_CONFIGURED");
  }
  const tls = require("tls");
  await new Promise((resolve, reject) => {
    const socket = tls.connect({ host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com" }, () => {
      let step = 0, buf = "";
      const w = (l) => socket.write(l + "\r\n");
      socket.on("data", (c) => {
        buf += c.toString();
        const lines = buf.split(/\r?\n/); buf = lines.pop() || "";
        for (const raw of lines) {
          if (!/^\d{3}[\s-]/.test(raw) || raw[3] === "-") continue;
          const n = Number(raw.slice(0, 3));
          if (step === 0 && n < 400) { w("EHLO studio"); step = 1; }
          else if (step === 1 && n < 400) { w("AUTH LOGIN"); step = 2; }
          else if (step === 2 && n === 334) { w(Buffer.from(SMTP_USER).toString("base64")); step = 3; }
          else if (step === 3 && n === 334) { w(Buffer.from(SMTP_PASS).toString("base64")); step = 4; }
          else if (step === 4 && n === 235) { w("MAIL FROM:<" + (SMTP_FROM || SMTP_USER) + ">"); step = 5; }
          else if (step === 5 && n < 400) { w("RCPT TO:<" + to + ">"); step = 6; }
          else if (step === 6 && n < 400) { w("DATA"); step = 7; }
          else if (step === 7 && n === 354) { socket.write("From: Browser Studio <" + SMTP_USER + ">\r\nTo: " + to + "\r\nSubject: Browser Studio code " + code + "\r\n\r\nYour code is " + code + " (10 minutes).\r\n.\r\n"); step = 8; }
          else if (step === 8 && n < 400) { w("QUIT"); step = 9; }
          else if (step === 9) { socket.end(); resolve(); }
          else if (n >= 400) { socket.end(); reject(new Error("SMTP " + n)); }
        }
      });
    });
    socket.setTimeout(20000, () => { socket.destroy(); reject(new Error("SMTP timeout")); });
    socket.on("error", reject);
  });
  return { sent: true };
}
function bearer(req) { const h = req.headers.authorization || ""; return h.startsWith("Bearer ") ? h.slice(7) : ""; }
async function userOf(req) {
  const t = bearer(req); if (!t) return null;
  const s = await fsRead("studio_sessions", t);
  if (!s || s.revoked === "1") return null;
  return fsRead("studio_users", s.userId);
}
function serveStatic(res, urlPath) {
  if (urlPath === "/help" || urlPath === "/help.html") {
    const help = path.join(__dirname, "help.html");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return fs.createReadStream(help).pipe(res);
  }
  const file = path.normalize(path.join(PUBLIC, urlPath === "/" ? "/index.html" : urlPath));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end("no"); }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const ext = path.extname(file);
    const mime = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" }[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    return fs.createReadStream(file).pipe(res);
  }
  const index = path.join(PUBLIC, "index.html");
  if (fs.existsSync(index)) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return fs.createReadStream(index).pipe(res); }
  const nf = path.join(__dirname, "404.html");
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  if (fs.existsSync(nf)) fs.createReadStream(nf).pipe(res); else res.end("404");
}
const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }); return res.end(); }
  const url = new URL(req.url, "http://localhost:" + PORT);
  const p = url.pathname;
  try {
    if (p === "/api/health") return send(res, 200, { ok: true, db: PROJECT ? "firebase" : "missing", mail: Boolean(SMTP_USER && SMTP_PASS), disk: false });
    if (p === "/api/auth/otp" && req.method === "POST") {
      const b = await bodyOf(req);
      const email = String(b.email || "").trim().toLowerCase();
      const purpose = b.purpose === "recovery" ? "recovery" : "signup";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: "Enter a valid email." });
      const code = String(crypto.randomInt(0, 1e6)).padStart(6, "0");
      await fsWrite("studio_otp", bid(email, purpose), { email, purpose, codeHash: crypto.createHash("sha256").update(code).digest("hex"), expiresAt: String(Date.now() + 600000), verified: "0" });
      const mailed = await mailOtp(email, code);
      return send(res, 200, { sent: true, ...(mailed.devCode ? { devCode: mailed.devCode } : {}) });
    }
    if (p === "/api/auth/otp/verify" && req.method === "POST") {
      const b = await bodyOf(req);
      const email = String(b.email || "").trim().toLowerCase();
      const purpose = b.purpose === "recovery" ? "recovery" : "signup";
      const rec = await fsRead("studio_otp", bid(email, purpose));
      if (!rec || Number(rec.expiresAt) < Date.now()) return send(res, 401, { error: "Code invalid or expired." });
      if (crypto.createHash("sha256").update(String(b.code || "")).digest("hex") !== rec.codeHash) return send(res, 401, { error: "Code invalid or expired." });
      rec.verified = "1"; await fsWrite("studio_otp", bid(email, purpose), rec);
      return send(res, 200, { verified: true });
    }
    if (p === "/api/auth/register" && req.method === "POST") {
      const b = await bodyOf(req);
      const email = String(b.email || "").trim().toLowerCase();
      const username = String(b.username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
      const displayName = String(b.displayName || "").trim().slice(0, 80);
      const password = String(b.password || "");
      const rec = await fsRead("studio_otp", bid(email, "signup"));
      if (!rec || rec.verified !== "1") return send(res, 401, { error: "Verify the email code first." });
      if (username.length < 3 || displayName.length < 2 || password.length < 8) return send(res, 400, { error: "Username, display name, and 8+ password required." });
      const salt = crypto.randomBytes(16).toString("hex");
      const user = { id: crypto.randomUUID(), email, username, displayName, passwordHash: hashPass(password, salt), passwordSalt: salt, createdAt: new Date().toISOString() };
      await fsWrite("studio_users", user.id, user);
      await fsWrite("studio_usernames", username, { userId: user.id });
      await fsWrite("studio_usernames", email, { userId: user.id });
      rec.verified = "used"; await fsWrite("studio_otp", bid(email, "signup"), rec);
      return send(res, 201, { user: pub(user), requiresLogin: true });
    }
    if (p === "/api/auth/login" && req.method === "POST") {
      const b = await bodyOf(req);
      const identifier = String(b.usernameOrEmail || b.email || "").trim().toLowerCase();
      const found = await findUser(identifier);
      if (!found || hashPass(String(b.password || ""), found.passwordSalt) !== found.passwordHash) return send(res, 401, { error: "Invalid credentials." });
      const token = crypto.randomBytes(24).toString("hex");
      await fsWrite("studio_sessions", token, { userId: found.id, revoked: "0" });
      return send(res, 200, { user: pub(found), token });
    }
    if (p === "/api/auth/recovery" && req.method === "POST") {
      const b = await bodyOf(req);
      const email = String(b.email || "").trim().toLowerCase();
      const rec = await fsRead("studio_otp", bid(email, "recovery"));
      if (!rec || rec.verified !== "1") return send(res, 401, { error: "Verify the email code first." });
      const user = await findUser(email);
      if (user) {
        const salt = crypto.randomBytes(16).toString("hex");
        user.passwordHash = hashPass(String(b.password || ""), salt);
        user.passwordSalt = salt;
        if (String(b.password || "").length < 8) return send(res, 400, { error: "Password must be 8+ characters." });
        await fsWrite("studio_users", user.id, user);
      }
      return send(res, 200, { reset: true });
    }
    if (p === "/api/auth/me") {
      const u = await userOf(req); if (!u) return send(res, 401, { error: "Authentication is required." });
      return send(res, 200, { user: pub(u) });
    }
    if (p === "/api/auth/logout" && req.method === "POST") {
      const t = bearer(req); if (t) await fsWrite("studio_sessions", t, { revoked: "1", userId: "" });
      return send(res, 200, { loggedOut: true });
    }
    if (p === "/api/workspace" && req.method === "GET") {
      const u = await userOf(req); if (!u) return send(res, 401, { error: "Authentication is required." });
      const row = await fsRead("studio_workspaces", u.id);
      return send(res, 200, { files: row && row.json ? JSON.parse(row.json) : null });
    }
    if (p === "/api/workspace" && req.method === "POST") {
      const u = await userOf(req); if (!u) return send(res, 401, { error: "Authentication is required." });
      const b = await bodyOf(req);
      await fsWrite("studio_workspaces", u.id, { json: JSON.stringify(b.files || []), updatedAt: new Date().toISOString() });
      return send(res, 200, { saved: true });
    }
    if (p.startsWith("/api/")) return send(res, 404, { error: "API route not found." });
    return serveStatic(res, p);
  } catch (err) {
    const map = { FIREBASE_NOT_CONFIGURED: [503, "Firebase is not configured."], FIREBASE_WRITE_FAILED: [503, "Create Firestore Database in Firebase Console first."], FIREBASE_READ_FAILED: [503, "Firebase database is not ready."], FIREBASE_AUTH_FAILED: [503, "Firebase credentials failed."], MAIL_NOT_CONFIGURED: [503, "Email sending is not configured."] };
    const hit = map[err.message] || [500, "Server error."];
    return send(res, hit[0], { error: hit[1] });
  }
});
server.listen(PORT, () => console.log(JSON.stringify({ listen: Number(PORT), firebase: Boolean(PROJECT), mail: Boolean(SMTP_USER && SMTP_PASS) })));
