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
