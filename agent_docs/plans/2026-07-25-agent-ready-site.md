# Agent-Ready openscreenshot.app — Local-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make OpenScreenShot usable by CLI tools and AI agents **without betraying its local-first, open-source spirit** — by shipping an open-source screenshot **CLI + local MCP server** that runs entirely on the user's machine, and publishing only *truthful static* discovery docs on `openscreenshot.app` that point agents at that tool.

**Architecture:** A new standalone, npm-publishable package (`mcp/`) in this repo. It renders arbitrary URLs locally by driving the user's **already-installed Chrome** via `puppeteer-core` (no bundled browser download), and exposes two entry points: a **CLI** (`openscreenshot-mcp shot <url>`) and a **stdio MCP server** (`openscreenshot-mcp serve`) speaking the Model Context Protocol so agents (Claude Desktop, etc.) can call a `capture_screenshot` tool. The website stays static; we add machine-readable discovery files that describe this real, downloadable tool. No hosted rendering service, no hosted auth, no per-user backend.

**Tech Stack:** TypeScript + Node, `puppeteer-core` (drives the system Chrome — no Chromium download), `@modelcontextprotocol/sdk` (stdio transport), `zod`, Vitest (matches the repo). Static discovery files served by the existing site host; a small set of **optional** edge-header tweaks documented as a Cloudflare runbook.

## Global Constraints

- **No hosted backend. No fiction.** Every published discovery file describes the *local* tool and points only at things that really exist (docs, the SKILL artifact, the npm package). Nothing advertises a networked endpoint we do not run.
- **Runs on the user's machine = the user's trust boundary.** The CLI/MCP renders whatever URL its operator asks; there is **no SSRF guard** (that was only needed for the public API we are deliberately not building). `// ponytail: local tool, operator can already fetch anything — no server-side URL guard`.
- **Open-source & self-hostable.** The tool is MIT (inherits repo license), installable via `npx openscreenshot-mcp` or from source. No proprietary/paid platform is required to run it.
- **Extension untouched.** `src/`, `manifest.json`, `vite.config.ts`, `dist/`, `npm run build|package` stay exactly as-is.
- **Static site stays plain-hosting-compatible.** New site files (`docs/skills/…`, `docs/.well-known/…`) must work on the current host as static files. Anything needing custom response headers/content-types is confined to the **optional** Cloudflare runbook (Task 6) and is not required for the core deliverable.
- **Package manager:** `npm`. **Language/tests:** TypeScript + Vitest. The `mcp/` package has its own `package.json` and its own vitest run; it does not disturb the extension's `tests/unit`.
- **Privacy messaging stays consistent.** The README/site must present the CLI/MCP as a *separate, optional, local* tool — never blended into the extension's "stays on your device" claim in a way that implies a cloud service.
- **Commit atomically** at the end of each task. No Claude co-author; no Claude trailers.

## Dropped directives (cannot be satisfied truthfully without a hosted service)

| Directive | Why dropped |
|---|---|
| DNS-AID (SVCB `alpn`/`endpoint`) | Advertises a live network endpoint; a local stdio MCP server has none. |
| OAuth/OIDC discovery | No hosted auth server exists; publishing metadata would 404 on `/authorize`,`/token`. |
| OAuth protected resource | No protected hosted resource exists. |

These stay off until/unless a hosted service is ever built. Leaving them absent is the honest state — the scanner flags absence, which is accurate.

## Directives kept (all truthful about the local tool)

| # | Directive | Task | Backing |
|---|---|---|---|
| — | The actual tool (CLI + MCP) | 1–3 | Real, open-source, local |
| 9 | Agent Skills index | 4 | Static index → real published SKILL.md, real sha256 |
| 8 | MCP Server Card | 5 | Static card describing the real local stdio server |
| 3 | Markdown for Agents | 6 (opt) | Cloudflare-native zone toggle (no code) |
| 1 | Link headers | 6 (opt) | Cloudflare Transform Rule → docs + skills index |
| 4 | API catalog | 6 (opt) | Static linkset → CLI docs + skill (no hosted `status`) |
| 7 | auth.md | 6 (opt) | Self-contained "no auth; install locally" |
| 10 | WebMCP | 7 (opt) | Thin in-page tool that surfaces install/usage |

---

## File Structure

- `mcp/package.json` (**new**) — standalone publishable package `openscreenshot-mcp`, `bin` → CLI.
- `mcp/tsconfig.json`, `mcp/vitest.config.ts` (**new**).
- `mcp/src/capture.ts` (**new**) — `capture(opts): Promise<Buffer>` (`puppeteer-core` + system Chrome), `resolveChrome()` (locate the browser / honor `CHROME_PATH`), `CaptureOptions` zod schema. The single source of capture logic.
- `mcp/src/cli.ts` (**new**) — arg parsing → `capture` → write PNG.
- `mcp/src/serve.ts` (**new**) — stdio MCP server exposing `capture_screenshot`.
- `mcp/src/bin.ts` (**new**) — `#!/usr/bin/env node` dispatcher: `shot` vs `serve`.
- `mcp/test/*.test.ts` (**new**).
- `docs/skills/capture-screenshot.md` (**new, published**) — the SKILL artifact.
- `docs/.well-known/agent-skills/index.json` (**new, published**) — skills discovery index.
- `docs/.well-known/mcp/server-card.json` (**new, published**) — MCP server card for the local server.
- `docs/auth.md` (**new, published, optional**) — self-contained no-auth notice.
- `docs/.well-known/api-catalog` (**new, published, optional**) — linkset.
- `docs/assets/webmcp.js` + `docs/index.html` tag (**optional**) — WebMCP.
- `agent_docs/runbooks/edge-headers.md` (**new**) — optional Cloudflare Transform Rule / markdown-toggle steps.
- `scripts/skill-digest.mjs` (**new**) — compute the SKILL sha256 for the index.
- `README.md` (**modify**) — document the tool.

---

## Task 1: Core local capture (`capture()` via puppeteer-core + system Chrome)

**Files:**
- Create: `mcp/package.json`, `mcp/tsconfig.json`, `mcp/vitest.config.ts`
- Create: `mcp/src/capture.ts`
- Create: `mcp/test/capture.test.ts`

**Interfaces:**
- Produces: `CaptureOptions` (zod schema + type), `resolveChrome(env?: NodeJS.ProcessEnv): string` (returns a Chrome executable path — honors `CHROME_PATH`, else probes common OS locations, else throws a clear "Chrome not found" error), and `capture(opts: CaptureOptions): Promise<Buffer>` returning PNG bytes. Reused verbatim by the CLI (Task 2) and MCP server (Task 3).

- [ ] **Step 1: Scaffold the package**

`mcp/package.json`:
```json
{
  "name": "openscreenshot-mcp",
  "version": "0.1.0",
  "description": "Local CLI + MCP server for programmatic screenshot capture.",
  "license": "MIT",
  "type": "module",
  "bin": { "openscreenshot-mcp": "dist/bin.js" },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "puppeteer-core": "^23.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.1.9"
  }
}
```
`mcp/tsconfig.json`: `module`/`target` `ES2022`, `moduleResolution` `bundler`, `outDir dist`, `rootDir src`, `strict true`.
`mcp/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["test/**/*.test.ts"], testTimeout: 60000 } });
```

- [ ] **Step 2: Install deps (no browser download)**

Run:
```bash
cd mcp && npm install
```
Expected: deps installed. **No Chromium download** — `puppeteer-core` drives the Chrome already on the machine. (`// ponytail: audience is Chrome-extension users, so system Chrome is a safe assumption; CHROME_PATH override + a clear not-found error cover the rest`.) Confirm a local Chrome exists for the test in Step 6 (Chrome/Chromium/Edge, or set `CHROME_PATH`).

- [ ] **Step 3: Write the failing test**

`mcp/test/capture.test.ts`:
```ts
import { expect, test } from "vitest";
import { capture, CaptureOptions, resolveChrome } from "../src/capture";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("schema rejects a non-url", () => {
  expect(CaptureOptions.safeParse({ url: "not a url" }).success).toBe(false);
});

test("resolveChrome honors CHROME_PATH", () => {
  expect(resolveChrome({ CHROME_PATH: "/custom/chrome" })).toBe("/custom/chrome");
});

test("resolveChrome throws a clear error when nothing is found", () => {
  // No CHROME_PATH and a probe list that cannot exist.
  expect(() => resolveChrome({ CHROME_PATH: "", OSS_TEST_NO_CHROME: "1" })).toThrow(/Chrome/);
});

test("captures a real page as PNG bytes", async () => {
  const png = await capture(CaptureOptions.parse({ url: "https://example.com", width: 800, height: 600 }));
  expect(png.length).toBeGreaterThan(1000);
  expect(png.subarray(0, 8)).toEqual(PNG_MAGIC);
});
```

- [ ] **Step 4: Run — expect FAIL**

Run: `cd mcp && npm test`
Expected: FAIL — `capture` not defined.

- [ ] **Step 5: Implement `capture`**

`mcp/src/capture.ts`:
```ts
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { z } from "zod";

export const CaptureOptions = z.object({
  url: z.string().url(),
  output: z.string().optional(),
  fullPage: z.boolean().optional().default(false),
  width: z.number().int().min(200).max(3840).optional().default(1280),
  height: z.number().int().min(200).max(2160).optional().default(800),
});
export type CaptureOptions = z.infer<typeof CaptureOptions>;

// Common Chrome/Chromium/Edge locations per OS. puppeteer-core ships no browser,
// so we point it at whatever the user already has.
const PROBE: Record<string, string[]> = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
};

export function resolveChrome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.CHROME_PATH) return env.CHROME_PATH;
  // OSS_TEST_NO_CHROME lets the unit test force the not-found path deterministically.
  const candidates = env.OSS_TEST_NO_CHROME ? [] : (PROBE[process.platform] ?? []);
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error(
    "Chrome not found. Install Google Chrome, or set CHROME_PATH to its executable.",
  );
}

export async function capture(opts: CaptureOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: opts.width, height: opts.height });
    await page.goto(opts.url, { waitUntil: "networkidle2", timeout: 30000 });
    const png = await page.screenshot({ fullPage: opts.fullPage, type: "png" });
    return Buffer.from(png);
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 6: Run — expect PASS**

Run: `cd mcp && npm test`
Expected: all tests PASS (the capture test requires network + a local Chrome; the `resolveChrome` tests need neither).

- [ ] **Step 7: Commit**

```bash
git add mcp/package.json mcp/tsconfig.json mcp/vitest.config.ts mcp/src/capture.ts mcp/test/capture.test.ts mcp/package-lock.json
git commit -m "feat(mcp): local screenshot capture core via puppeteer-core"
```

---

## Task 2: CLI wrapper

**Files:**
- Create: `mcp/src/cli.ts`
- Create: `mcp/src/bin.ts`
- Create: `mcp/test/cli.test.ts`

**Interfaces:**
- Consumes: `capture`, `CaptureOptions`.
- Produces: `runCli(argv: string[]): Promise<number>` — parses `shot <url> [--out file] [--full] [--width n] [--height n]`, writes PNG to `--out` (default `screenshot.png`) or stdout when `--out -`, returns exit code. `bin.ts` dispatches `shot` (default) vs `serve` (Task 3).

- [ ] **Step 1: Write the failing test**

`mcp/test/cli.test.ts`:
```ts
import { expect, test } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { runCli } from "../src/cli";

test("shot writes a png file", async () => {
  const out = "test-out.png";
  rmSync(out, { force: true });
  const code = await runCli(["shot", "https://example.com", "--out", out, "--width", "600", "--height", "400"]);
  expect(code).toBe(0);
  expect(existsSync(out)).toBe(true);
  rmSync(out, { force: true });
});

test("missing url returns non-zero", async () => {
  expect(await runCli(["shot"])).not.toBe(0);
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd mcp && npm test`

- [ ] **Step 3: Implement the CLI**

`mcp/src/cli.ts`:
```ts
import { writeFileSync } from "node:fs";
import { capture, CaptureOptions } from "./capture";

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

export async function runCli(argv: string[]): Promise<number> {
  const [cmd, url] = argv;
  if (cmd !== "shot" || !url) {
    process.stderr.write("usage: openscreenshot-mcp shot <url> [--out file|-] [--full] [--width n] [--height n]\n");
    return 2;
  }
  const parsed = CaptureOptions.safeParse({
    url,
    fullPage: argv.includes("--full"),
    width: flag(argv, "width") ? Number(flag(argv, "width")) : undefined,
    height: flag(argv, "height") ? Number(flag(argv, "height")) : undefined,
  });
  if (!parsed.success) {
    process.stderr.write("invalid arguments: " + parsed.error.issues.map((i) => i.message).join("; ") + "\n");
    return 2;
  }
  try {
    const png = await capture(parsed.data);
    const out = flag(argv, "out") ?? "screenshot.png";
    if (out === "-") process.stdout.write(png);
    else writeFileSync(out, png);
    return 0;
  } catch (err) {
    process.stderr.write("capture failed: " + String(err) + "\n");
    return 1;
  }
}
```

`mcp/src/bin.ts`:
```ts
#!/usr/bin/env node
import { runCli } from "./cli";
import { serve } from "./serve";

const argv = process.argv.slice(2);
if (argv[0] === "serve") {
  serve().catch((e) => { process.stderr.write(String(e) + "\n"); process.exit(1); });
} else {
  runCli(argv).then((code) => process.exit(code));
}
```
(`serve` is created in Task 3; add a temporary `export async function serve() {}` stub in `mcp/src/serve.ts` now so `bin.ts` type-checks, to be filled in Task 3.)

- [ ] **Step 4: Run — expect PASS**

Run: `cd mcp && npm test`

- [ ] **Step 5: Verify the built binary**

Run: `cd mcp && npm run build && node dist/bin.js shot https://example.com --out /tmp/cli.png && file /tmp/cli.png`
Expected: `PNG image data`.

- [ ] **Step 6: Commit**

```bash
git add mcp/src/cli.ts mcp/src/bin.ts mcp/src/serve.ts mcp/test/cli.test.ts
git commit -m "feat(mcp): screenshot CLI (shot) with file/stdout output"
```

---

## Task 3: Local MCP stdio server

**Files:**
- Modify: `mcp/src/serve.ts` (replace the stub)
- Create: `mcp/test/serve.test.ts`

**Interfaces:**
- Consumes: `capture`, `CaptureOptions`.
- Produces: `serve(): Promise<void>` — starts a stdio MCP server named `openscreenshot` exposing tool `capture_screenshot(url, fullPage?, width?, height?)` returning an MCP image content block (base64 PNG). Also exports `buildServer()` returning the configured `McpServer` for testing.

> **Implementer note (not a placeholder):** confirm the current `@modelcontextprotocol/sdk` server API (`McpServer`, `server.tool(...)` or `registerTool`, `StdioServerTransport`) against the installed version's README; the shape below matches the documented stdio-server pattern.

- [ ] **Step 1: Write the failing test**

`mcp/test/serve.test.ts`:
```ts
import { expect, test } from "vitest";
import { buildServer } from "../src/serve";

test("server exposes capture_screenshot", async () => {
  const server = buildServer();
  // The SDK exposes registered tools; assert our tool is present.
  // Adjust the accessor to the installed SDK (e.g. server.server.getRegisteredTools()).
  expect(JSON.stringify(server)).toContain("capture_screenshot");
});
```
(If the SDK offers no introspection accessor, replace this with an in-memory client↔server `listTools()` round-trip using the SDK's `InMemoryTransport`, which is the SDK's documented test pattern.)

- [ ] **Step 2: Run — expect FAIL**

Run: `cd mcp && npm test`

- [ ] **Step 3: Implement the server**

`mcp/src/serve.ts`:
```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { capture, CaptureOptions } from "./capture";

export function buildServer(): McpServer {
  const server = new McpServer({ name: "openscreenshot", version: "0.1.0" });
  server.tool(
    "capture_screenshot",
    {
      url: z.string().url(),
      fullPage: z.boolean().optional(),
      width: z.number().int().min(200).max(3840).optional(),
      height: z.number().int().min(200).max(2160).optional(),
    },
    async (args) => {
      const png = await capture(CaptureOptions.parse(args));
      return { content: [{ type: "image", data: png.toString("base64"), mimeType: "image/png" }] };
    },
  );
  return server;
}

export async function serve(): Promise<void> {
  const server = buildServer();
  await server.connect(new StdioServerTransport());
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd mcp && npm test`

- [ ] **Step 5: Verify with a real MCP client**

Run: `cd mcp && npm run build`, then add to an MCP client (e.g. Claude Desktop config) an entry: `{"command":"node","args":["<abs>/mcp/dist/bin.js","serve"]}`, restart the client, and confirm `capture_screenshot` lists and returns an image for `https://example.com`. Alternatively use `npx @modelcontextprotocol/inspector node dist/bin.js serve`.

- [ ] **Step 6: Commit**

```bash
git add mcp/src/serve.ts mcp/test/serve.test.ts
git commit -m "feat(mcp): stdio MCP server exposing capture_screenshot"
```

---

## Task 4: Publish the Agent Skills discovery index + SKILL artifact

Covers directive **9**. Pure static files — work on the current host as-is.

**Files:**
- Create: `docs/skills/capture-screenshot.md`
- Create: `scripts/skill-digest.mjs`
- Create: `docs/.well-known/agent-skills/index.json`

**Interfaces:**
- Produces: `https://openscreenshot.app/.well-known/agent-skills/index.json` referencing the real SKILL artifact with a matching `sha256:` digest.

- [ ] **Step 1: Write the SKILL artifact**

`docs/skills/capture-screenshot.md`:
```markdown
---
name: capture-screenshot
description: Capture a PNG screenshot of any public web page locally, via the open-source OpenScreenShot CLI or MCP server.
---

# capture-screenshot

Capture a screenshot of a URL on your own machine. No account, no hosted service.

## Install
`npx openscreenshot-mcp` (uses the Chrome already on your machine — no browser download; set `CHROME_PATH` if it can't be found).

## CLI
`openscreenshot-mcp shot https://example.com --out shot.png --full`

## MCP (for agents)
Add to your MCP client config:
`{ "command": "npx", "args": ["openscreenshot-mcp", "serve"] }`
Then call the `capture_screenshot` tool with `{ "url": "https://example.com" }`.

Source: https://github.com/pghqdev/OpenScreenShot
```

- [ ] **Step 2: Compute the digest**

`scripts/skill-digest.mjs`:
```js
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const buf = readFileSync("docs/skills/capture-screenshot.md");
process.stdout.write("sha256:" + createHash("sha256").update(buf).digest("hex") + "\n");
```
Run: `node scripts/skill-digest.mjs` and copy the value.

- [ ] **Step 3: Write the index**

`docs/.well-known/agent-skills/index.json`:
```json
{
  "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
  "skills": [
    {
      "name": "capture-screenshot",
      "type": "skill-md",
      "description": "Capture a PNG screenshot of any public web page locally.",
      "url": "https://openscreenshot.app/skills/capture-screenshot.md",
      "digest": "sha256:<paste-from-script>"
    }
  ]
}
```

- [ ] **Step 4: Verify the digest matches**

Run:
```bash
node scripts/skill-digest.mjs
grep digest docs/.well-known/agent-skills/index.json
```
Expected: the two `sha256:` values are identical. (This is the check that fails if the artifact is edited without re-running the script.)

- [ ] **Step 5: Commit**

```bash
git add docs/skills/capture-screenshot.md scripts/skill-digest.mjs docs/.well-known/agent-skills/index.json
git commit -m "feat(site): publish agent-skills index and capture-screenshot skill"
```

---

## Task 5: Publish the MCP Server Card

Covers directive **8**. Static file describing the real local stdio server. Truthful: the server exists and is launched as documented.

**Files:**
- Create: `docs/.well-known/mcp/server-card.json`
- Create: `docs/robots-check.test?` — none; verify via curl in Step 2.

- [ ] **Step 1: Write the card**

`docs/.well-known/mcp/server-card.json`:
```json
{
  "serverInfo": { "name": "openscreenshot", "version": "0.1.0" },
  "transport": { "type": "stdio", "endpoint": "npx openscreenshot-mcp serve" },
  "capabilities": ["tools"]
}
```
Note: the checker requires `serverInfo`, `transport`, `capabilities` present and 200. `transport.type: "stdio"` with the launch command is the honest representation of a local server (there is no hosted URL). If the checker strictly rejects a non-URL `endpoint`, keep `endpoint` and add the launch command under a `command` field instead — confirm against the checker output and adjust; do not invent a hosted URL.

- [ ] **Step 2: Verify it serves as JSON 200**

Run (after deploy or against the current host): `curl -si https://openscreenshot.app/.well-known/mcp/server-card.json | head -20`
Expected: `200` and valid JSON with the three keys.

- [ ] **Step 3: Commit**

```bash
git add docs/.well-known/mcp/server-card.json
git commit -m "feat(site): publish MCP server card for the local capture server"
```

---

## Task 6 (optional): Cloudflare edge headers — Link, markdown, api-catalog, auth.md

Covers directives **1, 3, 4, 7**. These need custom response headers/content-types the static host does not set, so they live at the Cloudflare edge (Transform Rules + the native Markdown-for-Agents toggle) — **no application backend**. Do this only if you want these extra checks to pass; the core tool (Tasks 1–5) does not depend on it.

**Files:**
- Create: `docs/auth.md`
- Create: `docs/.well-known/api-catalog` (extensionless; Content-Type set by the edge rule)
- Create: `agent_docs/runbooks/edge-headers.md`

- [ ] **Step 1: Write `auth.md` (self-contained, no auth)**

`docs/auth.md`:
```markdown
# auth.md

OpenScreenShot's agent tooling runs **locally** on your machine. There is no
hosted API and no authentication.

- Agent audience: coding/automation agents that need screenshots.
- Provisioning: install `openscreenshot-mcp` (npm) — no registration.
- Auth method: none (local execution; the operator's own machine is the trust boundary).
- Usage: run `openscreenshot-mcp serve` as an MCP stdio server, or `shot <url>` as a CLI.
```

- [ ] **Step 2: Write the API catalog (no hosted `status`)**

`docs/.well-known/api-catalog`:
```json
{
  "linkset": [
    {
      "anchor": "https://openscreenshot.app/skills/capture-screenshot.md",
      "links": [
        { "rel": "service-doc", "href": "https://openscreenshot.app/skills/capture-screenshot.md" },
        { "rel": "describedby", "href": "https://openscreenshot.app/.well-known/mcp/server-card.json" }
      ]
    }
  ]
}
```
(`service-desc`/`status` are omitted deliberately — there is no OpenAPI-served hosted API or health endpoint. Only truthful relations are included.)

- [ ] **Step 3: Cloudflare runbook**

Write `agent_docs/runbooks/edge-headers.md` documenting, in the Cloudflare dashboard for `openscreenshot.app`:
1. **Transform Rule — response header** on the homepage: set
   `Link: </.well-known/api-catalog>; rel="api-catalog", </skills/capture-screenshot.md>; rel="service-doc"` (directive 1).
2. **Transform Rule — Content-Type override**: `/.well-known/api-catalog` → `application/linkset+json`; `/auth.md` → `text/markdown; charset=utf-8` (directives 4, 7).
3. **Markdown for Agents**: enable the zone-level "Markdown for Agents" toggle if available on the plan (directive 3). If unavailable, leave directive 3 unmet — do not hand-roll a renderer for a static marketing page.
4. Record which rules were created and screenshots/exports of each.

- [ ] **Step 4: Verify**

Run:
```bash
curl -sI https://openscreenshot.app/ | grep -i '^link:'
curl -sI https://openscreenshot.app/.well-known/api-catalog | grep -i content-type
curl -sI -H 'Accept: text/markdown' https://openscreenshot.app/ | grep -i content-type
```
Expected: Link header present; `application/linkset+json`; `text/markdown` when negotiated (if the toggle exists).

- [ ] **Step 5: Commit**

```bash
git add docs/auth.md docs/.well-known/api-catalog agent_docs/runbooks/edge-headers.md
git commit -m "feat(site): static discovery docs + edge-header runbook"
```

---

## Task 7 (optional): WebMCP tool on the homepage

Covers directive **10**. Thin — a browser cannot screenshot arbitrary cross-origin URLs, so this tool surfaces how to run the real local tool rather than performing capture in-page.

**Files:**
- Create: `docs/assets/webmcp.js`
- Modify: `docs/index.html`

- [ ] **Step 1: Write the script**

`docs/assets/webmcp.js`:
```js
if (navigator.modelContext && typeof navigator.modelContext.registerTool === "function") {
  navigator.modelContext.registerTool({
    name: "how_to_capture_screenshot",
    description: "Explains how to capture a screenshot of any URL using the local OpenScreenShot CLI/MCP.",
    inputSchema: { type: "object", properties: { url: { type: "string" } } },
    async execute(input) {
      const url = input?.url ?? "https://example.com";
      return {
        content: [{
          type: "text",
          text: [
            "OpenScreenShot runs locally (no hosted API).",
            `CLI: npx openscreenshot-mcp shot ${url} --out shot.png`,
            'MCP: add { "command": "npx", "args": ["openscreenshot-mcp","serve"] } to your client, then call capture_screenshot.',
          ].join("\n"),
        }],
      };
    },
  });
}
```
`// ponytail: registration is the checked behavior; in-page rendering is impossible for cross-origin URLs, so the tool truthfully returns instructions instead of faking a capture`.

- [ ] **Step 2: Reference it**

In `docs/index.html` before `</body>`: `<script src="/assets/webmcp.js" defer></script>`.

- [ ] **Step 3: Verify registration**

Open the homepage in a Chrome build with WebMCP enabled; confirm in DevTools the tool registers without error, and the guard no-ops where the API is absent.

- [ ] **Step 4: Commit**

```bash
git add docs/assets/webmcp.js docs/index.html
git commit -m "feat(site): register a WebMCP tool pointing at the local capture tool"
```

---

## Task 8: Document the tool (README) + publish

**Files:**
- Modify: `README.md`
- Runbook: npm publish

- [ ] **Step 1: README section**

Add an "Agents & CLI" section to `README.md`: what `openscreenshot-mcp` is, install (`npx openscreenshot-mcp`), CLI and MCP usage, and an explicit line that it is a **separate, optional, local** tool — the browser extension remains a client-side, no-server capture tool. Keep the privacy framing consistent (no implication of a cloud service).

- [ ] **Step 2: Publish the package**

Run:
```bash
cd mcp && npm run build && npm publish --access public
```
Expected: `openscreenshot-mcp@0.1.0` on npm so `npx openscreenshot-mcp` resolves (required for the SKILL/card instructions to be real). Record the published version.

- [ ] **Step 3: Re-scan**

Submit `https://openscreenshot.app` to `https://isitagentready.com/api/scan`. Confirm the kept directives (9, 8, and — if Task 6/7 done — 1, 3, 4, 7, 10) pass. The three dropped directives will remain flagged; that is the accurate, honest result.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs(readme): document the local openscreenshot-mcp CLI and MCP server"
```

---

## Self-review notes

- **Spirit alignment:** no hosted rendering/auth backend; the tool runs on the user's machine and is MIT + self-hostable. Consistent with the local-first privacy pitch.
- **Honesty:** three directives are dropped with stated reasons rather than satisfied by placeholder metadata. Every published file describes something real.
- **Coverage:** Tasks 1–3 build the real tool; 4–5 publish truthful static discovery (work on the current host); 6–7 are optional edge/browser extras; 8 documents + publishes.
- **Type consistency:** `capture` + `CaptureOptions` (Task 1) are the single capture path, reused by CLI (Task 2) and MCP (Task 3). Tool name `capture_screenshot` matches across MCP server, SKILL artifact, and card. Package/bin name `openscreenshot-mcp` is identical across package.json, SKILL, card, WebMCP, and README.
- **Version-sensitive libs** (`@modelcontextprotocol/sdk`, `puppeteer-core`): the SDK-shaped tasks carry an explicit "confirm against installed version" step; the static outputs we control are fully specified.
- **Ponytail simplifications marked:** no SSRF guard (local trust boundary), `puppeteer-core` + system Chrome (no bundled-browser download; safe because the audience already runs Chrome), no hand-rolled markdown renderer (native toggle or skip), instructions-only WebMCP.
```