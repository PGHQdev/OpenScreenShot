import { describe, it, expect } from 'vitest';
import { faq, homeFaq } from '../../site/src/data/faq';

// The site used to keep the homepage's eight questions and the Support page's
// sixteen in two places, and they drifted. One array now feeds both, and each
// page derives its FAQPage JSON-LD from the slice it renders.
describe('site FAQ data', () => {
  it('answers sixteen questions, eight of them on the homepage', () => {
    expect(faq).toHaveLength(16);
    expect(homeFaq).toHaveLength(8);
  });

  it('draws the homepage slice from the same array', () => {
    for (const item of homeFaq) expect(faq).toContain(item);
  });

  it('carries a question and an answer for every item', () => {
    for (const item of faq) {
      expect(item.q.trim()).not.toBe('');
      expect(item.a.trim()).not.toBe('');
    }
  });

  it('asks each question once', () => {
    expect(new Set(faq.map((item) => item.q)).size).toBe(faq.length);
  });
});
