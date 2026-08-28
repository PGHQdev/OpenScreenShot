/**
 * Serializes a JSON-LD object for a `<script type="application/ld+json">`
 * rendered with `set:html`. `set:html` does not escape, and some of the
 * objects passed here carry HTML-bearing FAQ answers, so this closes the
 * only `</script>` break-out `JSON.stringify` leaves open.
 */
export const ld = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');
