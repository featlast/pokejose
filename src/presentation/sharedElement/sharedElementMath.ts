import type { Rect } from './SharedElement.types';

/**
 * Transform that moves a view laid out at `from` onto `to`: translate the centres,
 * then scale around the centre (RN's default transform origin).
 */
export const flightTransform = (from: Rect, to: Rect) => ({
  translateX: to.x + to.width / 2 - (from.x + from.width / 2),
  translateY: to.y + to.height / 2 - (from.y + from.height / 2),
  scale: from.width > 0 ? to.width / from.width : 1,
});

/**
 * True when the frame is non-empty and fully inside the viewport. `top` excludes
 * areas covered by overlays such as a collapsing header.
 */
export const isRectVisible = (
  rect: Rect,
  viewport: { width: number; height: number; top?: number },
): boolean =>
  rect.width > 0 &&
  rect.height > 0 &&
  rect.x >= 0 &&
  rect.y >= (viewport.top ?? 0) &&
  rect.x + rect.width <= viewport.width &&
  rect.y + rect.height <= viewport.height;
