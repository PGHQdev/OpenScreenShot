import { describe, expect, it } from 'vitest';
import type { Annotation, Handle, Rect } from '../../src/editor/annotations';
import {
  activeCropHandle,
  CROP_EDGE_MIN_PX,
  CROP_HANDLE_TOL,
  cropAnnotations,
  cropHandleAt,
  cropHandles,
  cropSize,
  cycleCropHandle,
  resizeCropAt,
} from '../../src/editor/crop';

const identity = (x: number, y: number) => ({ x, y });
const names = (r: Rect, zoom: number): Handle[] => cropHandles(r, zoom).map((h) => h.handle);

function rect(id: string, x: number, y: number, w = 20, h = 20): Annotation {
  return { id, type: 'rect', x, y, w, h, stroke: '#ff3b30', strokeWidth: 6, fill: null };
}

function step(id: string, n: number, x: number, y: number): Annotation {
  return { id, type: 'step', n, x, y, r: 16, color: '#ff3b30', fontSize: 18 };
}

describe('cropHandles', () => {
  it('offers all eight on a rect with room for them', () => {
    expect(names({ x: 0, y: 0, w: 400, h: 300 }, 1)).toEqual([
      'nw',
      'n',
      'ne',
      'e',
      'se',
      's',
      'sw',
      'w',
    ]);
  });

  // An edge handle sits half an edge from each corner beside it. Each target is
  // 24 screen px wide, so the two would overlap — and the pointer would land on
  // whichever the list reached first — on any edge shorter than 2 x 24.
  it('drops an edge handle exactly where its target would meet a corner target', () => {
    expect(names({ x: 0, y: 0, w: CROP_EDGE_MIN_PX, h: 300 }, 1)).toContain('n');
    expect(names({ x: 0, y: 0, w: CROP_EDGE_MIN_PX - 1, h: 300 }, 1)).not.toContain('n');
    expect(names({ x: 0, y: 0, w: CROP_EDGE_MIN_PX - 1, h: 300 }, 1)).not.toContain('s');
  });

  it('leaves a small rect its four corners and nothing else', () => {
    expect(names({ x: 10, y: 10, w: 30, h: 30 }, 1)).toEqual(['nw', 'ne', 'se', 'sw']);
  });

  // The threshold is in screen pixels, so the same rect offers more handles as
  // the user zooms in — the collision it guards against is a screen collision.
  it('measures the edge on screen, not in image pixels', () => {
    const small = { x: 0, y: 0, w: 30, h: 30 };
    expect(names(small, 1)).toEqual(['nw', 'ne', 'se', 'sw']);
    expect(names(small, 2)).toEqual(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']);
  });

  it('reads a rect a drag left inverted the right way up', () => {
    const flipped = { x: 400, y: 300, w: -400, h: -300 };
    expect(cropHandles(flipped, 1)).toEqual(cropHandles({ x: 0, y: 0, w: 400, h: 300 }, 1));
  });
});

describe('cropHandleAt', () => {
  const box = { x: 100, y: 100, w: 400, h: 300 };

  it('answers within the 24x24 target and not outside it', () => {
    expect(cropHandleAt(box, identity, 1, 100 + CROP_HANDLE_TOL, 100, CROP_HANDLE_TOL)).toBe('nw');
    expect(
      cropHandleAt(box, identity, 1, 100 + CROP_HANDLE_TOL + 1, 100, CROP_HANDLE_TOL),
    ).toBeNull();
  });

  it('finds every handle the rect offers', () => {
    const found = cropHandles(box, 1).map((h) => cropHandleAt(box, identity, 1, h.x, h.y));
    expect(found).toEqual(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']);
  });

  // On a rect smaller than one target every corner is in reach at once. Taking
  // the first match in list order would hand every press to 'nw', however
  // plainly the user aimed at another corner.
  it('takes the nearest corner when the targets overlap on a tiny rect', () => {
    const tiny = { x: 100, y: 100, w: 10, h: 10 };
    expect(cropHandleAt(tiny, identity, 1, 100, 100)).toBe('nw');
    expect(cropHandleAt(tiny, identity, 1, 110, 100)).toBe('ne');
    expect(cropHandleAt(tiny, identity, 1, 110, 110)).toBe('se');
    expect(cropHandleAt(tiny, identity, 1, 100, 110)).toBe('sw');
  });

  it('never answers with a handle the rect does not offer', () => {
    const narrow = { x: 100, y: 100, w: 20, h: 300 };
    // The top edge midpoint is at x 110, y 100 — well inside a target, but the
    // rect is too narrow to offer 'n' at all, so the nearest corner answers.
    expect(names(narrow, 1)).not.toContain('n');
    expect(cropHandleAt(narrow, identity, 1, 110, 100)).toBe('nw');
  });

  it('applies the projector before measuring', () => {
    const zoomed = (x: number, y: number) => ({ x: x * 2, y: y * 2 });
    expect(cropHandleAt(box, zoomed, 2, 200, 200)).toBe('nw');
    expect(cropHandleAt(box, zoomed, 2, 100, 100)).toBeNull();
  });
});

describe('activeCropHandle and cycleCropHandle', () => {
  const box = { x: 0, y: 0, w: 400, h: 300 };

  it('stands in the bottom-right corner while no handle has been picked', () => {
    expect(activeCropHandle(null, box, 1)).toBe('se');
  });

  it('drops a handle the rect stopped offering back to that corner', () => {
    const tiny = { x: 0, y: 0, w: 30, h: 30 };
    expect(activeCropHandle('n', box, 1)).toBe('n');
    expect(activeCropHandle('n', tiny, 1)).toBe('se');
  });

  it('walks the rect clockwise and back, and wraps both ways', () => {
    let h = cycleCropHandle(null, 1, box, 1);
    const walk: Handle[] = [h];
    for (let i = 0; i < 7; i++) {
      h = cycleCropHandle(h, 1, box, 1);
      walk.push(h);
    }
    expect(walk).toEqual(['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']);
    expect(cycleCropHandle('se', -1, box, 1)).toBe('e');
  });

  it('walks only the handles a small rect offers', () => {
    const tiny = { x: 0, y: 0, w: 30, h: 30 };
    let h = cycleCropHandle(null, 1, tiny, 1);
    const walk: Handle[] = [h];
    for (let i = 0; i < 3; i++) {
      h = cycleCropHandle(h, 1, tiny, 1);
      walk.push(h);
    }
    expect(walk).toEqual(['sw', 'nw', 'ne', 'se']);
  });
});

describe('resizeCropAt', () => {
  const crop = { x: 40, y: 30, w: 200, h: 100 };

  it('resizes from the bottom-right corner', () => {
    expect(resizeCropAt(crop, 'se', 10, 10, 800, 600)).toEqual({ x: 40, y: 30, w: 210, h: 110 });
  });

  it('never grows past the image or shrinks below a pixel', () => {
    expect(resizeCropAt(crop, 'se', 1000, 1000, 800, 600)).toEqual({
      x: 40,
      y: 30,
      w: 760,
      h: 570,
    });
    expect(resizeCropAt(crop, 'se', -1000, -1000, 800, 600)).toEqual({ x: 40, y: 30, w: 1, h: 1 });
  });

  // Before the eight handles this took a resize from the far corner and a move
  // back: the only handle there was could not touch the left edge on its own.
  it('trims the left edge in one step, from the left handle', () => {
    const full = { x: 0, y: 0, w: 800, h: 600 };
    expect(resizeCropAt(full, 'w', 100, 0, 800, 600)).toEqual({ x: 100, y: 0, w: 700, h: 600 });
  });

  it('moves only the edges its handle touches', () => {
    const start = { x: 100, y: 100, w: 200, h: 200 };
    expect(resizeCropAt(start, 'n', 40, 25, 800, 600)).toEqual({
      x: 100,
      y: 125,
      w: 200,
      h: 175,
    });
    expect(resizeCropAt(start, 'e', 40, 25, 800, 600)).toEqual({
      x: 100,
      y: 100,
      w: 240,
      h: 200,
    });
    expect(resizeCropAt(start, 'sw', 40, 25, 800, 600)).toEqual({
      x: 140,
      y: 100,
      w: 160,
      h: 225,
    });
  });

  // A pointer drag hands the total delta from the grab, so a handle dragged
  // clean across the box would otherwise turn the rect inside out and leave
  // the user cropping a mirrored region.
  it('stops a handle on the opposite edge instead of flipping the rect', () => {
    const start = { x: 100, y: 100, w: 200, h: 200 };
    expect(resizeCropAt(start, 'w', 500, 0, 800, 600)).toEqual({ x: 299, y: 100, w: 1, h: 200 });
    expect(resizeCropAt(start, 'n', 0, 500, 800, 600)).toEqual({ x: 100, y: 299, w: 200, h: 1 });
  });

  it('holds every handle inside the picture', () => {
    const start = { x: 100, y: 100, w: 200, h: 200 };
    expect(resizeCropAt(start, 'nw', -500, -500, 800, 600)).toEqual({
      x: 0,
      y: 0,
      w: 300,
      h: 300,
    });
    expect(resizeCropAt(start, 'se', 5000, 5000, 800, 600)).toEqual({
      x: 100,
      y: 100,
      w: 700,
      h: 500,
    });
  });
});

describe('cropSize', () => {
  it('rounds to the pixel grid the new image is rasterised on', () => {
    expect(cropSize({ x: 10.2, y: 10.8, w: 100.4, h: 50.6 })).toEqual({ w: 100, h: 51 });
  });
});

describe('cropAnnotations', () => {
  const crop: Rect = { x: 100, y: 50, w: 300, h: 200 };

  it('moves every survivor into the new image origin', () => {
    const out = cropAnnotations([rect('a', 150, 100)], crop, []);
    expect(out).toEqual([rect('a', 50, 50)]);
  });

  it('drops a layer that falls entirely outside the new rect', () => {
    const out = cropAnnotations([rect('in', 150, 100), rect('out', 10, 10)], crop, []);
    expect(out.map((a) => a.id)).toEqual(['in']);
  });

  it('keeps a layer that only overlaps the edge', () => {
    // Its box runs x 90..110, so ten columns of it are inside the crop.
    const out = cropAnnotations([rect('edge', 90, 100)], crop, []);
    expect(out.map((a) => a.id)).toEqual(['edge']);
    expect(out[0]).toMatchObject({ x: -10 });
  });

  // The crop rasterises the composed picture, so a layer sitting on rows a cut
  // already removed marked pixels that are not in the new image at all.
  it('drops a layer whose top edge is on a cut row', () => {
    const bands = [{ y: 60, h: 40 }];
    const out = cropAnnotations([rect('onCut', 150, 70), rect('below', 150, 120)], crop, bands);
    expect(out.map((a) => a.id)).toEqual(['below']);
  });

  // A survivor below a cut is drawn pulled up by it, and the crop bakes that
  // in — which is what lets the band list be emptied afterwards.
  it('pulls a survivor up by the cuts above it as well as by the crop origin', () => {
    const bands = [{ y: 60, h: 40 }];
    const out = cropAnnotations([rect('below', 150, 120)], crop, bands);
    expect(out[0]).toMatchObject({ x: 50, y: 120 - 40 - 50 });
  });

  it('renumbers the step badges over what is left', () => {
    const out = cropAnnotations(
      [step('s1', 1, 10, 10), step('s2', 2, 150, 100), step('s3', 3, 200, 150)],
      crop,
      [],
    );
    expect(out.map((a) => (a.type === 'step' ? a.n : null))).toEqual([1, 2]);
  });

  // useEditor takes the timeline entry from the very list it then hands here,
  // so a pass that edited its input in place would put a cropped list on the
  // stack and make the undo a no-op.
  it('leaves the list it was handed untouched', () => {
    const before = [rect('a', 150, 100), rect('b', 10, 10)];
    const copy = JSON.parse(JSON.stringify(before));
    cropAnnotations(before, crop, []);
    expect(before).toEqual(copy);
  });
});
