const http = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const publicDirectory = path.join(__dirname, "public");
const routes = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/favicon.svg", ["favicon.svg", "image/svg+xml"]],
  ["/Abhinandan-Goyal-Resume.pdf", ["resume.pdf", "application/pdf"]],
]);

function send(response, status, contentType, body, headOnly = false) {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(headOnly ? undefined : body);
}

function createServer() {
  return http.createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; " +
        "connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    );
    response.setHeader("Cache-Control", "no-cache");

    const headOnly = request.method === "HEAD";
    if (request.method !== "GET" && !headOnly) {
      response.setHeader("Allow", "GET, HEAD");
      send(response, 405, "text/plain; charset=utf-8", "Method not allowed.\n");
      return;
    }

    let pathname;
    try {
      pathname = new URL(request.url, "http://localhost").pathname;
    } catch {
      send(response, 400, "text/plain; charset=utf-8", "Invalid request URL.\n", headOnly);
      return;
    }

    if (pathname === "/health") {
      send(response, 200, "application/json; charset=utf-8", '{"status":"ok"}', headOnly);
      return;
    }

    const route = routes.get(pathname);
    if (!route) {
      send(response, 404, "text/plain; charset=utf-8", "Page not found.\n", headOnly);
      return;
    }

    try {
      const [filename, contentType] = route;
      const content = await readFile(path.join(publicDirectory, filename));
      if (contentType === "application/pdf") {
        response.setHeader("Content-Disposition", 'attachment; filename="Abhinandan-Goyal-Resume.pdf"');
      }
      send(response, 200, contentType, content, headOnly);
    } catch (error) {
      console.error(`Unable to serve ${pathname}:`, error);
      send(response, 500, "text/plain; charset=utf-8", "Unable to load this resource.\n", headOnly);
    }
  });
}

if (require.main === module) {
  const portValue = process.env.PORT ?? "3000";
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error("PORT must be an integer between 1 and 65535.");
    process.exitCode = 1;
  } else {
    const server = createServer();
    server.on("error", (error) => {
      console.error("Resume server failed:", error);
      process.exitCode = 1;
    });
    server.listen(port, "0.0.0.0", () => {
      console.log(`Resume available on port ${port}. Open http://localhost:${port}`);
    });
    for (const signal of ["SIGTERM", "SIGINT"]) {
      process.once(signal, () => {
        server.close((error) => {
          if (error) {
            console.error("Unable to close the resume server:", error);
            process.exitCode = 1;
          }
        });
      });
    }
  }
}

module.exports = { createServer };
