import { expect, test } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../src/serve";

test("server exposes capture_screenshot", async () => {
  const server = buildServer();
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverT), client.connect(clientT)]);
  const { tools } = await client.listTools();
  expect(tools.map((t) => t.name)).toContain("capture_screenshot");
  await client.close();
});
