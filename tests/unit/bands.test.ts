import { describe, expect, it } from 'vitest';
import {
  addBand,
  bandAtSeam,
  canCut,
  composedHeight,
  cutAbove,
  cutHeight,
  inBand,
  moveBandBy,
  normalizeBand,
  normalizeBands,
  resizeBandBy,
  seamPositions,
  segments,
  toComposed,
  toSource,
  type Band,
} from '../../src/editor/bands';

const IMG_H = 1000;

describe('normalizeBands', () => {
  it('sorts by top edge, so the list reads down the picture', () => {
    expect(
      normalizeBands(
        [
          { y: 600, h: 50 },
          { y: 100, h: 50 },
        ],
        IMG_H,
      ),
    ).toEqual([
      { y: 100, h: 50 },
      { y: 600, h: 50 },
    ]);
  });

  it('merges overlapping bands, so the overlap is not removed twice', () => {
    const merged = normalizeBands(
      [
        { y: 100, h: 200 },
        { y: 200, h: 200 },
      ],
      IMG_H,
    );
    expect(merged).toEqual([{ y: 100, h: 300 }]);
    // The naive sum is 400; the picture only loses 300 rows.
    expect(cutHeight(merged)).toBe(300);
  });

  it('merges a band wholly inside another without shrinking it', () => {
    expect(
      normalizeBands(
        [
          { y: 100, h: 300 },
          { y: 150, h: 50 },
        ],
        IMG_H,
      ),
    ).toEqual([{ y: 100, h: 300 }]);
  });

  it('merges bands that touch, because they leave one seam', () => {
    expect(
      normalizeBands(
        [
          { y: 100, h: 100 },
          { y: 200, h: 100 },
        ],
        IMG_H,
      ),
    ).toEqual([{ y: 100, h: 200 }]);
  });

  it('keeps a gap of a single row as two bands', () => {
    expect(
      normalizeBands(
        [
          { y: 100, h: 100 },
          { y: 201, h: 100 },
        ],
        IMG_H,
      ),
    ).toEqual([
      { y: 100, h: 100 },
      { y: 201, h: 100 },
    ]);
  });

  it('drops a zero-height band, and a negative one', () => {
    expect(normalizeBands([{ y: 100, h: 0 }], IMG_H)).toEqual([]);
    expect(normalizeBands([{ y: 100, h: -20 }], IMG_H)).toEqual([]);
  });

  it('drops a band with a non-finite edge, so bad storage cannot poison the maths', () => {
    expect(normalizeBands([{ y: Number.NaN, h: 10 }], IMG_H)).toEqual([]);
    expect(normalizeBands([{ y: 10, h: Number.POSITIVE_INFINITY }], IMG_H)).toEqual([]);
  });

  it('clamps a band at the top edge', () => {
    expect(normalizeBands([{ y: -100, h: 300 }], IMG_H)).toEqual([{ y: 0, h: 200 }]);
  });

  it('clamps a band at the bottom edge', () => {
    expect(normalizeBands([{ y: 900, h: 300 }], IMG_H)).toEqual([{ y: 900, h: 100 }]);
  });

  it('drops a band entirely below the image', () => {
    expect(normalizeBands([{ y: 1200, h: 100 }], IMG_H)).toEqual([]);
  });

  it('clamps a band taller than the image to the whole image', () => {
    expect(normalizeBands([{ y: -50, h: 5000 }], IMG_H)).toEqual([{ y: 0, h: IMG_H }]);
  });
});

describe('composedHeight', () => {
  it('is the source height when nothing is cut', () => {
    expect(composedHeight([], IMG_H)).toBe(IMG_H);
  });

  it('is the source height less one band', () => {
    expect(composedHeight([{ y: 300, h: 200 }], IMG_H)).toBe(800);
  });

  it('counts two separate bands', () => {
    expect(
      composedHeight(
        [
          { y: 100, h: 50 },
          { y: 600, h: 150 },
        ],
        IMG_H,
      ),
    ).toBe(800);
  });

  it('counts overlapping bands once', () => {
    expect(
      composedHeight(
        [
          { y: 100, h: 200 },
          { y: 200, h: 200 },
        ],
        IMG_H,
      ),
    ).toBe(700);
  });

  it('counts a band at the top edge and one at the bottom edge', () => {
    expect(composedHeight([{ y: 0, h: 100 }], IMG_H)).toBe(900);
    expect(composedHeight([{ y: 900, h: 100 }], IMG_H)).toBe(900);
  });

  it('is zero for a band taller than the image, not negative', () => {
    expect(composedHeight([{ y: 0, h: 4000 }], IMG_H)).toBe(0);
    expect(composedHeight([{ y: -500, h: 4000 }], IMG_H)).toBe(0);
  });

  it('is unchanged by a zero-height band', () => {
    expect(composedHeight([{ y: 400, h: 0 }], IMG_H)).toBe(IMG_H);
  });
});

describe('canCut', () => {
  it('allows a cut that leaves a picture behind', () => {
    expect(canCut([], { y: 0, h: 999 }, IMG_H)).toBe(true);
  });

  it('refuses a cut that would remove the last row', () => {
    expect(canCut([], { y: 0, h: 1000 }, IMG_H)).toBe(false);
    expect(canCut([{ y: 0, h: 500 }], { y: 500, h: 500 }, IMG_H)).toBe(false);
  });
});

describe('cutAbove / toComposed / toSource', () => {
  const bands: Band[] = [
    { y: 100, h: 100 },
    { y: 500, h: 200 },
  ];

  it('removes nothing above the first band', () => {
    expect(cutAbove(bands, 0)).toBe(0);
    expect(cutAbove(bands, 100)).toBe(0);
    expect(toComposed(bands, 50)).toBe(50);
  });

  it('counts only the part of a band above a row inside it', () => {
    expect(cutAbove(bands, 150)).toBe(50);
    // Every row of a band lands on the band's own seam.
    expect(toComposed(bands, 100)).toBe(100);
    expect(toComposed(bands, 150)).toBe(100);
    expect(toComposed(bands, 199)).toBe(100);
  });

  it('shifts everything under a band up by its height', () => {
    expect(toComposed(bands, 200)).toBe(100);
    expect(toComposed(bands, 400)).toBe(300);
    expect(toComposed(bands, 700)).toBe(400);
    expect(toComposed(bands, IMG_H)).toBe(700);
  });

  it('maps a composed row back to the first source row that reaches it', () => {
    expect(toSource(bands, 50)).toBe(50);
    expect(toSource(bands, 100)).toBe(200);
    expect(toSource(bands, 300)).toBe(400);
    expect(toSource(bands, 400)).toBe(700);
  });

  it('round-trips composed -> source -> composed for every composed row', () => {
    for (let y = 0; y <= composedHeight(bands, IMG_H); y++) {
      expect(toComposed(bands, toSource(bands, y))).toBe(y);
    }
  });

  it('is monotone in the source, so nothing below a band ever moves above it', () => {
    let prev = -1;
    for (let y = 0; y <= IMG_H; y++) {
      const c = toComposed(bands, y);
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
  });
});

describe('inBand', () => {
  const bands: Band[] = [{ y: 100, h: 100 }];

  it('covers its own rows, top inclusive and bottom exclusive', () => {
    expect(inBand(bands, 99)).toBe(false);
    expect(inBand(bands, 100)).toBe(true);
    expect(inBand(bands, 199)).toBe(true);
    expect(inBand(bands, 200)).toBe(false);
  });
});

describe('segments', () => {
  it('is the whole image when nothing is cut', () => {
    expect(segments([], IMG_H)).toEqual([{ sy: 0, h: IMG_H, dy: 0 }]);
  });

  it('splits around a band, pulling the lower run up by the cut', () => {
    expect(segments([{ y: 300, h: 200 }], IMG_H)).toEqual([
      { sy: 0, h: 300, dy: 0 },
      { sy: 500, h: 500, dy: 300 },
    ]);
  });

  it('drops the run above a band at the top edge', () => {
    expect(segments([{ y: 0, h: 100 }], IMG_H)).toEqual([{ sy: 100, h: 900, dy: 0 }]);
  });

  it('drops the run below a band at the bottom edge', () => {
    expect(segments([{ y: 900, h: 100 }], IMG_H)).toEqual([{ sy: 0, h: 900, dy: 0 }]);
  });

  it('has nothing to draw when a band taller than the image covers it', () => {
    expect(segments([{ y: 0, h: 4000 }], IMG_H)).toEqual([]);
  });

  it('adds up to the composed height, whatever the bands are', () => {
    const cases: Band[][] = [
      [],
      [{ y: 0, h: 100 }],
      [{ y: 900, h: 100 }],
      [
        { y: 100, h: 200 },
        { y: 200, h: 200 },
      ],
      [
        { y: 0, h: 10 },
        { y: 500, h: 10 },
        { y: 990, h: 10 },
      ],
      [{ y: -50, h: 4000 }],
    ];
    for (const bands of cases) {
      const total = segments(bands, IMG_H).reduce((sum, s) => sum + s.h, 0);
      expect(total).toBe(composedHeight(bands, IMG_H));
    }
  });

  it('lands each run where the coordinate map says it does', () => {
    const bands: Band[] = [
      { y: 100, h: 100 },
      { y: 500, h: 200 },
    ];
    for (const s of segments(bands, IMG_H)) {
      expect(s.dy).toBe(toComposed(bands, s.sy));
    }
  });
});

describe('seamPositions / bandAtSeam', () => {
  const bands: Band[] = [
    { y: 100, h: 100 },
    { y: 500, h: 200 },
  ];

  it('puts each seam where its band collapsed to', () => {
    expect(seamPositions(bands)).toEqual([100, 400]);
  });

  it('finds the band under a composed point, within the tolerance', () => {
    expect(bandAtSeam(bands, 104, 6)).toBe(0);
    expect(bandAtSeam(bands, 106, 6)).toBe(0);
    expect(bandAtSeam(bands, 107, 6)).toBe(-1);
    expect(bandAtSeam(bands, 400, 6)).toBe(1);
  });

  it('picks the nearer of two seams inside one tolerance', () => {
    const close: Band[] = [
      { y: 100, h: 50 },
      { y: 155, h: 50 },
    ];
    expect(seamPositions(close)).toEqual([100, 105]);
    expect(bandAtSeam(close, 101, 6)).toBe(0);
    expect(bandAtSeam(close, 104, 6)).toBe(1);
  });

  it('finds nothing in an empty list', () => {
    expect(bandAtSeam([], 100, 6)).toBe(-1);
  });
});

describe('addBand', () => {
  it('inserts in order and merges as it goes', () => {
    let bands: Band[] = [];
    bands = addBand(bands, { y: 500, h: 100 }, IMG_H);
    bands = addBand(bands, { y: 100, h: 100 }, IMG_H);
    bands = addBand(bands, { y: 550, h: 100 }, IMG_H);
    expect(bands).toEqual([
      { y: 100, h: 100 },
      { y: 500, h: 150 },
    ]);
    expect(composedHeight(bands, IMG_H)).toBe(750);
  });

  it('does not mutate the list it was handed', () => {
    const before: Band[] = [{ y: 100, h: 100 }];
    addBand(before, { y: 150, h: 100 }, IMG_H);
    expect(before).toEqual([{ y: 100, h: 100 }]);
  });
});

describe('moveBandBy / resizeBandBy', () => {
  it('moves a band and holds it inside the image', () => {
    expect(moveBandBy({ y: 100, h: 50 }, 10, IMG_H)).toEqual({ y: 110, h: 50 });
    expect(moveBandBy({ y: 5, h: 50 }, -10, IMG_H)).toEqual({ y: 0, h: 50 });
    expect(moveBandBy({ y: 960, h: 50 }, 100, IMG_H)).toEqual({ y: 950, h: 50 });
  });

  it('resizes from the bottom edge, never past the image or under one row', () => {
    expect(resizeBandBy({ y: 100, h: 50 }, 10, IMG_H)).toEqual({ y: 100, h: 60 });
    expect(resizeBandBy({ y: 100, h: 50 }, -100, IMG_H)).toEqual({ y: 100, h: 1 });
    expect(resizeBandBy({ y: 900, h: 50 }, 500, IMG_H)).toEqual({ y: 900, h: 100 });
  });
});

describe('normalizeBand', () => {
  it('turns an upward drag the right way up', () => {
    expect(normalizeBand({ y: 300, h: -100 })).toEqual({ y: 200, h: 100 });
  });

  it('leaves a downward drag alone', () => {
    expect(normalizeBand({ y: 200, h: 100 })).toEqual({ y: 200, h: 100 });
  });
});
