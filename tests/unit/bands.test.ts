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
import { bbox, unionBBox, type Annotation } from '../../src/editor/annotations';

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

  it('gives a dead-even tie to the upper seam', () => {
    const pair: Band[] = [
      { y: 100, h: 50 },
      { y: 156, h: 50 },
    ];
    expect(seamPositions(pair)).toEqual([100, 106]);
    expect(bandAtSeam(pair, 103, 6)).toBe(0);
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

/**
 * The group resize frame is a source-space box, and both it and the members
 * inside it are drawn rigidly, each shifted by the cut above its own top edge
 * (CanvasController.projectAt / annotationOffset). Two questions follow, and
 * Task 24's defect is the first of them.
 *
 * Containment holds because `cutAbove` over a merged, disjoint band list is
 * monotone and 1-Lipschitz: a member can never be drawn outside the frame it
 * sits in. What does happen is the other direction — the frame over-encloses,
 * and the part of that the cut adds is what the disclosure in the task report
 * is about, so it is measured on its own rather than folded into the slack a
 * member already had.
 *
 * The frame is built with the real `unionBBox` over real annotations, which is
 * the fallback frame `CanvasController.liveGroupFrame` computes; the arbitrary
 * containing box is the carried frame, which can sit anywhere above them.
 */
describe('a drawn frame and the drawn members inside it', () => {
  const drawnTop = (bands: Band[], y: number) => y - cutAbove(bands, y);

  /** A deterministic generator, so a failure is reproducible from the seed. */
  function rng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  }

  const box = (id: string, y: number, h: number): Annotation => ({
    id,
    type: 'rect',
    x: 0,
    y,
    w: 50,
    h,
    stroke: '#ff3b30',
    strokeWidth: 6,
    fill: null,
  });

  it('never draws a member outside its frame, whether the frame is the union or a carried box', () => {
    const next = rng(20250830);
    const H = 1000;
    let checked = 0;
    let worstSourceSlack = 0;
    let worstCutPart = 0;
    for (let iter = 0; iter < 4000; iter++) {
      const bands = normalizeBands(
        Array.from({ length: 1 + Math.floor(next() * 3) }, () => ({
          y: Math.floor(next() * 1200) - 100,
          h: Math.floor(next() * 400) - 50,
        })),
        H,
      );
      const members = Array.from({ length: 3 }, (_, i) => {
        const y = Math.floor(next() * H);
        return box(`m${i}`, y, Math.floor(next() * (H - y)));
      }).filter((m) => !inBand(bands, bbox(m).y));
      if (members.length < 2) continue;

      // The fallback frame liveGroupFrame builds, from the real union.
      const union = unionBBox(members);
      // ...and a carried frame: any box that still contains them, which is
      // what a resize leaves behind once a glyph has scaled inside it.
      const carried = {
        x: union.x,
        y: Math.max(0, union.y - Math.floor(next() * 200)),
        w: union.w,
        h: 0,
      };
      carried.h = union.y + union.h - carried.y + Math.floor(next() * 200);

      for (const frame of [union, carried]) {
        if (inBand(bands, frame.y)) continue;
        const top = drawnTop(bands, frame.y);
        const bottom = top + frame.h;
        for (const m of members) {
          const b = bbox(m);
          const mTop = drawnTop(bands, b.y);
          // Containment, both edges. These are what monotone and 1-Lipschitz
          // buy: no member is ever drawn outside the frame it sits in.
          expect(mTop).toBeGreaterThanOrEqual(top);
          expect(mTop + b.h).toBeLessThanOrEqual(bottom);
          // The over-enclosure decomposed: the slack the member already had in
          // source space, and the cut lying between the two top edges.
          const sourceSlack = frame.y + frame.h - b.y - b.h;
          const cutPart = cutAbove(bands, b.y) - cutAbove(bands, frame.y);
          expect(bottom - (mTop + b.h)).toBe(sourceSlack + cutPart);
          worstSourceSlack = Math.max(worstSourceSlack, sourceSlack);
          worstCutPart = Math.max(worstCutPart, cutPart);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(5000);
    // The number the disclosure quotes: what the cut alone adds to the frame's
    // drawn height over its members, kept apart from the slack a member
    // already had in source space, which the cut has nothing to do with.
    //
    // This measures the geometry; it does not lock the product's choice of
    // frame, and cannot — both frames here are built by the test, out of
    // bands.ts and annotations.ts alone. What locks the choice is the browser
    // smoke's step 84 against step 85: the same resize moves a badge 36 rows
    // through a carried frame thirty rows above it and 14 through the frame
    // drawn around the members, so a frame changed to hug its members reads 14
    // in both and step 84 fails.
    expect(
      worstCutPart,
      `worst cut-borne over-enclosure over ${checked} drawn members on a ${H}-row image ` +
        `(worst source-space slack, which the cut has nothing to do with: ${worstSourceSlack})`,
    ).toBeGreaterThan(300);
  });

  it('over-encloses by nearly the whole picture when the cut sits between frame and member', () => {
    // A frame whose top is row 0 around one member below a band that takes
    // almost everything between them: 991 rows of frame around 1 row of mark,
    // its bottom handles nowhere near anything. That is the resize frame doing
    // its job — it is the box scaleInBox measures against, not a bounding box.
    const bands: Band[] = [{ y: 1, h: 990 }];
    const member = box('m', 991, 1);
    const frame = { x: 0, y: 0, w: 50, h: 1000 };
    const b = bbox(member);
    const top = drawnTop(bands, frame.y);
    const mTop = drawnTop(bands, b.y);
    expect(top).toBe(0);
    expect(mTop).toBe(1);
    expect(cutAbove(bands, b.y) - cutAbove(bands, frame.y)).toBe(990);
    expect(top + frame.h - (mTop + b.h)).toBe(998);
  });
});
