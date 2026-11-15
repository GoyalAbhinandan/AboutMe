const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { once } = require("node:events");
const { readFile } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { createServer } = require("../server");

let server;
let origin;

before(async () => {
  server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve, reject) => {
  server.close((error) => error ? reject(error) : resolve());
}));

test("serves the resume and its local assets with browser-safe content types", async () => {
  for (const [route, type] of [
    ["/", "text/html"],
    ["/styles.css", "text/css"],
    ["/app.js", "text/javascript"],
    ["/favicon.svg", "image/svg+xml"],
  ]) {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 200, route);
    assert.ok(response.headers.get("content-type").startsWith(type), route);
    assert.ok((await response.text()).length > 0, route);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.ok(response.headers.get("content-security-policy").includes("frame-ancestors 'none'"));
  }
});

test("keeps LinkedIn as the only contact option and locations limited to India", async () => {
  const response = await fetch(origin);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.doesNotMatch(html, /mailto:|tel:/i);
  assert.doesNotMatch(html, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  assert.doesNotMatch(html, /\+\d[\d ()-]{7,}\d/);
  assert.doesNotMatch(html, /\b(?:Noida|Bengaluru)\b/i);
  assert.match(html, /href="https:\/\/www\.linkedin\.com\/in\/iamabhinandangoyal\/"/);
});

test("downloads the privacy-edited resume PDF with an attachment filename", async () => {
  const response = await fetch(`${origin}/Abhinandan-Goyal-Resume.pdf`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(response.headers.get("content-disposition"), /^attachment; filename=".*\.pdf"$/);
  const downloaded = Buffer.from(await response.arrayBuffer());
  const resume = await readFile(path.join(__dirname, "..", "public", "resume.pdf"));
  assert.equal(downloaded.subarray(0, 5).toString(), "%PDF-");
  assert.deepEqual(downloaded, resume);
});

test("provides an independent health endpoint and body-free HEAD responses", async () => {
  const health = await fetch(`${origin}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  for (const route of ["/", "/health", "/Abhinandan-Goyal-Resume.pdf", "/missing"]) {
    const get = await fetch(`${origin}${route}`);
    const body = await get.arrayBuffer();
    const head = await fetch(`${origin}${route}`, { method: "HEAD" });
    assert.equal(head.status, get.status);
    assert.equal(Number(head.headers.get("content-length")), body.byteLength);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
});

test("does not expose project files or accept writes", async () => {
  for (const route of ["/server.js", "/package.json", "/.git/config", "/%2e%2e/server.js", "/..%2fserver.js", "/%ZZ", "/missing"]) {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 404, route);
  }
  const response = await fetch(origin, { method: "POST", body: "not accepted" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("rejects malformed request URLs with a clear client error", async () => {
  const response = await new Promise((resolve, reject) => {
    const request = http.request(`${origin}/`, { path: "http://[" }, resolve);
    request.on("error", reject);
    request.end();
  });
  assert.equal(response.statusCode, 400);
  response.resume();
});
