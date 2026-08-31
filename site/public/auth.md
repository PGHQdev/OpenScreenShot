# auth.md

OpenScreenShot's agent tooling runs **locally** on your machine. There is no
hosted API and no authentication. The operator's own machine is the trust
boundary.

- Agent audience: coding/automation agents that need screenshots.
- Usage: run `openscreenshot serve` as an MCP stdio server, or `shot <url>` as a CLI.

## Registration

No registration, provisioning, or credentials are needed. Install
`openscreenshot` (npm) and run it.

## Methods Supported

- None (public site; local execution for all tooling).

## Credential Usage

This service operates without authentication. No credential is issued, stored,
or accepted. Public resources on openscreenshot.app require no token.
