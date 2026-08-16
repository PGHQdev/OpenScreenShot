import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { capture, CaptureOptions } from './capture.js';

export function buildServer(): McpServer {
  const server = new McpServer({ name: 'openscreenshot', version: '0.6.0' });
  server.registerTool(
    'capture_screenshot',
    {
      description: 'Capture a PNG screenshot of a public web page locally via the system Chrome.',
      inputSchema: {
        url: z.string().url(),
        fullPage: z.boolean().optional(),
        width: z.number().int().min(200).max(3840).optional(),
        height: z.number().int().min(200).max(2160).optional(),
      },
    },
    async (args) => {
      const png = await capture(CaptureOptions.parse(args));
      return {
        content: [{ type: 'image', data: png.toString('base64'), mimeType: 'image/png' }],
      };
    },
  );
  return server;
}

export async function serve(): Promise<void> {
  const server = buildServer();
  await server.connect(new StdioServerTransport());
}
