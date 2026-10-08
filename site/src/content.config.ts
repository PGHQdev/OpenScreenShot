import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One folder per site locale under src/content/blog/; the entry id is
// `<locale>/<slug>`. A translation keeps the en file's slug and frontmatter
// shape, translates title, description, and body, and prefixes internal page
// links with its locale (`/de/docs/`). Files such as `/skills/x.md` keep
// their plain path.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    audience: z.enum(['everyday', 'developers']),
    order: z.number(),
  }),
});

export const collections = { blog };
