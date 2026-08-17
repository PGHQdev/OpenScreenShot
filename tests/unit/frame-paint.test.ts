import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FRAME,
  frameMetrics,
  paintFrame,
  type FrameBackground,
  type FrameOptions,
} from '../../src/editor/frame';

interface FillRectCall {
  x: number;
  y: number;
  w: number;
  h: number;
  style: unknown;
}

/** The slice of CanvasRenderingContext2D that paintFrame touches. */
class FakeCtx {
  fillStyle: unknown = '';
  shadowColor = '';
  shadowBlur = 0;
  shadowOffsetY = 0;
  fillRects: FillRectCall[] = [];
  roundRects: { x: number; y: number; w: number; h: number; r: number }[] = [];
  shadowBlurAtFill: number[] = [];
  gradients: { coords: number[]; stops: string[] }[] = [];
  fills = 0;

  save(): void {}
  restore(): void {}
  beginPath(): void {}
  fillRect(x: number, y: number, w: number, h: number): void {
    this.fillRects.push({ x, y, w, h, style: this.fillStyle });
  }
  roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.roundRects.push({ x, y, w, h, r });
  }
  fill(): void {
    this.fills += 1;
    this.shadowBlurAtFill.push(this.shadowBlur);
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    const g = { coords: [x0, y0, x1, y1], stops: [] as string[] };
    this.gradients.push(g);
    return { addColorStop: (_o: number, c: string) => g.stops.push(c) };
  }
}

const paint = (opts: Partial<FrameOptions>, scale = 1, w = 1000, h = 800) => {
  const frame: FrameOptions = { ...DEFAULT_FRAME, enabled: true, ...opts };
  const ctx = new FakeCtx();
  const m = frameMetrics(frame, w, h);
  paintFrame(ctx as unknown as CanvasRenderingContext2D, m, frame.background, scale);
  return { ctx, m };
};

describe('paintFrame', () => {
  it('draws nothing when the frame is off', () => {
    const ctx = new FakeCtx();
    const m = frameMetrics({ ...DEFAULT_FRAME, enabled: false }, 1000, 800);
    paintFrame(ctx as unknown as CanvasRenderingContext2D, m, DEFAULT_FRAME.background, 1);
    expect(ctx.fillRects).toHaveLength(0);
    expect(ctx.fills).toBe(0);
  });

  it('covers the whole outer box, starting at the negative padding', () => {
    const { ctx, m } = paint({ padding: 40 });
    const bg = ctx.fillRects[0];
    expect(bg.x).toBe(-m.pad);
    expect(bg.y).toBe(-m.pad);
    expect(bg.w).toBe(m.outerW);
    expect(bg.h).toBe(m.outerH);
  });

  it('paints a preset as a two-stop gradient', () => {
    const bg: FrameBackground = { kind: 'preset', id: 'coral' };
    const { ctx } = paint({ background: bg });
    expect(ctx.gradients).toHaveLength(1);
    expect(ctx.gradients[0].stops).toEqual(['#ff7a59', '#e0326b']);
  });

  it('paints a solid background with the given colour', () => {
    const { ctx } = paint({ background: { kind: 'solid', color: '#123456' } });
    expect(ctx.fillRects[0].style).toBe('#123456');
  });

  it('fills no background when the background is transparent', () => {
    const { ctx } = paint({ background: { kind: 'transparent' } });
    expect(ctx.fillRects).toHaveLength(0);
    expect(ctx.fills).toBe(1); // the shadow plate still draws
  });

  it('rounds the shadow plate at the metric radius, inset 1px so its antialiased edge stays under the image', () => {
    const { ctx, m } = paint({ radius: 30 });
    expect(ctx.roundRects[0]).toEqual({ x: 1, y: 1, w: m.imgW - 2, h: m.imgH - 2, r: m.radius });
  });

  it('scales the shadow with the caller scale, since ctx ignores the transform', () => {
    const one = paint({ shadow: 60 }, 1);
    const two = paint({ shadow: 60 }, 2);
    expect(two.ctx.shadowBlurAtFill[0]).toBeCloseTo(one.ctx.shadowBlurAtFill[0] * 2, 10);
    expect(two.ctx.shadowOffsetY).toBeCloseTo(one.ctx.shadowOffsetY * 2, 10);
  });

  it('skips the shadow plate at shadow strength zero', () => {
    const { ctx } = paint({ shadow: 0, padding: 40 });
    expect(ctx.fills).toBe(0);
  });
});
