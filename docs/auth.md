# auth.md

OpenScreenShot's agent tooling runs **locally** on your machine. There is no
hosted API and no authentication.

- Agent audience: coding/automation agents that need screenshots.
- Provisioning: install `openscreenshot-mcp` (npm) — no registration.
- Auth method: none (local execution; the operator's own machine is the trust boundary).
- Usage: run `openscreenshot-mcp serve` as an MCP stdio server, or `shot <url>` as a CLI.
