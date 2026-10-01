import { describe, expect, it } from 'vitest';
import {
  areaFromDrag,
  areaPixelSize,
  isFullArea,
  moveArea,
  resizeArea,
} from '../../src/control/area';
import { FULL_AREA, MIN_AREA_SIDE } from '../../src/shared/recording-types';

describe('areaFromDrag', () => {
  it('spans the two points in either drag direction', () => {
    const area = { x: 0.25, y: 0.5, w: 0.5, h: 0.25 };
    expect(areaFromDrag({ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.75 })).toEqual(area);
    expect(areaFromDrag({ x: 0.75, y: 0.75 }, { x: 0.25, y: 0.5 })).toEqual(area);
  });

  it('clips a drag that leaves the picture', () => {
    expect(areaFromDrag({ x: 0.5, y: 0.5 }, { x: 1.4, y: -0.3 })).toEqual({
      x: 0.5,
      y: 0,
      w: 0.5,
      h: 0.5,
    });
  });

  it('is the whole tab while the drag is still too small', () => {
    expect(areaFromDrag({ x: 0.5, y: 0.5 }, { x: 0.51, y: 0.9 })).toBe(FULL_AREA);
  });
});

describe('moveArea', () => {
  it('stops at the viewport edges and keeps its size', () => {
    const area = { x: 0.5, y: 0.5, w: 0.25, h: 0.25 };
    expect(moveArea(area, 1, -1)).toEqual({ x: 0.75, y: 0, w: 0.25, h: 0.25 });
  });
});

describe('resizeArea', () => {
  it('never grows past the viewport or shrinks below the minimum', () => {
    const area = { x: 0.5, y: 0.5, w: 0.25, h: 0.25 };
    expect(resizeArea(area, 1, -1)).toEqual({ x: 0.5, y: 0.5, w: 0.5, h: MIN_AREA_SIDE });
  });
});

describe('isFullArea', () => {
  it('tells the whole tab from a part of it', () => {
    expect(isFullArea(FULL_AREA)).toBe(true);
    expect(isFullArea({ x: 0, y: 0, w: 1, h: 0.5 })).toBe(false);
  });
});

describe('areaPixelSize', () => {
  it('scales the area to the still', () => {
    expect(areaPixelSize({ x: 0, y: 0, w: 0.5, h: 0.25 }, 2880, 1800)).toEqual({ w: 1440, h: 450 });
  });
});
