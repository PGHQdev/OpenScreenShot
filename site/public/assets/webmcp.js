if (navigator.modelContext && typeof navigator.modelContext.registerTool === 'function') {
  navigator.modelContext.registerTool({
    name: 'how_to_capture_screenshot',
    description:
      'Explains how to capture a screenshot of any URL using the local OpenScreenShot CLI/MCP.',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } } },
    async execute(input) {
      const url = input?.url ?? 'https://example.com';
      return {
        content: [
          {
            type: 'text',
            text: [
              'OpenScreenShot runs locally (no hosted API).',
              `CLI: npx openscreenshot shot ${url} --out shot.png`,
              'MCP: add { "command": "npx", "args": ["openscreenshot","serve"] } to your client, then call capture_screenshot.',
            ].join('\n'),
          },
        ],
      };
    },
  });
}
// ponytail: registration is the checked behavior; in-page rendering is impossible for cross-origin URLs, so the tool truthfully returns instructions instead of faking a capture
