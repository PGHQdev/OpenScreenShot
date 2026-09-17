# Search and answer discovery

The website source is `site/`; `pnpm run site:build` generates `docs/`.
Do not edit generated pages directly. The initial guides are English-only;
add translated routes before advertising them through hreflang or language links.

## Audience and first content set

Give everyday screenshot users and developers equal editorial attention.
The six initial guides each address a distinct task:

| Audience       | Guide                          | Useful next action                    |
| -------------- | ------------------------------ | ------------------------------------- |
| Everyday users | Full-page screenshot in Chrome | Install, capture, inspect the image   |
| Everyday users | Screenshot to PDF              | Choose an appropriate PDF layout      |
| Everyday users | Screenshot redaction           | Export and verify an opaque redaction |
| Developers     | Screenshot CLI                 | Produce a local PNG                   |
| Developers     | Screenshot MCP server          | Connect a client and call the tool    |
| Developers     | CI screenshots                 | Save a repeatable review artifact     |

Topic demand and conversion potential are hypotheses, not measured keyword volumes.
No Search Console or install attribution data was available for this pass.

## Publishing and maintenance

Create an article in `src/pages/blog/` with the existing Markdown frontmatter:
`layout`, `title`, `description`, `audience`, and `order`. The blog index reads
these files automatically. Keep the audience values consistent with the two
existing groups. Reuse the article layout so canonical, social, breadcrumb,
and BlogPosting metadata remain consistent.

Start with a direct answer, then show the steps, expected output, and important
limits. Verify command examples against `mcp/src/`; verify extension behavior
against `src/` and the browser-specific build. Explain when a feature is available
only in a source build rather than implying it is published in a browser store.

Link each new guide from an appropriate existing page and to relevant reference
sections. Add it to `public/llms.txt` for tools that use that file. This file is
agent navigation, not a Google ranking mechanism. Keep substantive information
in the visible HTML. Use schema that describes the actual page; do not add
invented reviews, authors, rankings, or publication dates. Add real publication
and modification dates to visible content and schema when those dates are known.

Before release, build the site, check internal links and fragments, parse JSON-LD,
check canonical and hreflang targets, and inspect desktop and narrow layouts.
Run Lighthouse against the built site. Confirm the deployment returns real page
content and correct status codes, then submit or refresh the sitemap in Search
Console if needed. These local edits do not deploy the site or submit URLs.

## Measure and choose the next topics

After publishing, establish a baseline and review after 28 days:

- Indexed pages, impressions, clicks, and queries for `/blog/` and `/docs/`.
- Which queries reach each guide, and whether those queries match the task covered.
- Available store acquisition data and existing aggregate site data. Do not invent
  install attribution or introduce tracking that contradicts the privacy policy.
- Support questions that remain unanswered after readers use the guide.

Expand the audience cluster with evidence of useful visits, keeping both audiences
represented. Candidate follow-ups are sticky-header troubleshooting, annotated
bug reports, capturing a local preview server, and interpreting agent screenshots.
Verify actual demand before building many near-duplicate keyword pages.

## Research used

[Google’s guidance for generative AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
prioritizes useful original information and crawlable technical structure. It says
there is no special AI schema requirement and that Google ignores llms.txt for
ranking. This shaped the focus on accurate task guides and visible content.

[Google’s Article documentation](https://developers.google.com/search/docs/appearance/structured-data/article)
informs the BlogPosting metadata. Structured data does not guarantee rich results.

[Lenny’s Data: Ethan Smith on internal linking](https://www.lennysnewsletter.com/p/ethan-smith-the-power-of-internal-linking-for-seo)
connects editorial and technical SEO through links between useful related pages.
This shaped the docs-to-guide links, blog index, footer link, and contextual links
inside the articles. The archive search also surfaced Meltem Kuran Berkowitz’s
advice to understand search intent; the initial topics therefore start from real
product tasks rather than broad generic screenshot keywords.
