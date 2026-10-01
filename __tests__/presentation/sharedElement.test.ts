import { SharedElementRole } from '../../src/presentation/enums/SharedElementRole.enum';
import type { SharedElementEntry } from '../../src/presentation/sharedElement/SharedElementRegistry';
import { SharedElementRegistry } from '../../src/presentation/sharedElement/SharedElementRegistry';
import {
  flightTransform,
  isRectVisible,
} from '../../src/presentation/sharedElement/sharedElementMath';

const { SOURCE, TARGET } = SharedElementRole;

const entryAt = (
  x: number,
  y: number,
  size: number,
  hasLayout = true,
): SharedElementEntry => ({
  hasLayout,
  node: { measureInWindow: callback => callback(x, y, size, size) },
});

const opacity = (registry: SharedElementRegistry, key: string) =>
  (
    registry.opacityFor(key, SOURCE) as unknown as { __getValue(): number }
  ).__getValue();

describe('flightTransform', () => {
  it('moves centre to centre and scales by the width ratio', () => {
    expect(
      flightTransform(
        { x: 10, y: 100, width: 100, height: 100 },
        { x: 50, y: 300, width: 200, height: 200 },
      ),
    ).toEqual({ translateX: 90, translateY: 250, scale: 2 });
  });

  it('never divides by zero', () => {
    expect(
      flightTransform(
        { x: 0, y: 0, width: 0, height: 0 },
        { x: 0, y: 0, width: 10, height: 10 },
      ).scale,
    ).toBe(1);
  });
});

describe('isRectVisible', () => {
  const viewport = { width: 400, height: 800 };
  it('accepts frames fully inside the viewport only', () => {
    expect(
      isRectVisible({ x: 10, y: 10, width: 100, height: 100 }, viewport),
    ).toBe(true);
    expect(
      isRectVisible({ x: 10, y: -20, width: 100, height: 100 }, viewport),
    ).toBe(false);
    expect(
      isRectVisible({ x: 10, y: 750, width: 100, height: 100 }, viewport),
    ).toBe(false);
    expect(
      isRectVisible({ x: 10, y: 10, width: 0, height: 100 }, viewport),
    ).toBe(false);
  });
});

describe('SharedElementRegistry', () => {
  it('measures a laid-out element in window coordinates', async () => {
    const registry = new SharedElementRegistry();
    registry.register('p1', SOURCE, entryAt(5, 6, 70));
    await expect(registry.measure('p1', SOURCE)).resolves.toEqual({
      x: 5,
      y: 6,
      width: 70,
      height: 70,
    });
  });

  it('returns null for unmounted, not laid out or unresponsive elements', async () => {
    const registry = new SharedElementRegistry();
    await expect(registry.measure('missing', SOURCE)).resolves.toBeNull();

    registry.register('p1', SOURCE, entryAt(0, 0, 70, false));
    await expect(registry.measure('p1', SOURCE)).resolves.toBeNull();

    registry.register('p2', SOURCE, {
      hasLayout: true,
      node: { measureInWindow: () => undefined },
    });
    await expect(registry.measure('p2', SOURCE, 10)).resolves.toBeNull();
  });

  it('uses the most recently mounted element and falls back when it unmounts', async () => {
    const registry = new SharedElementRegistry();
    registry.register('p1', SOURCE, entryAt(1, 1, 50));
    const unregisterSearchCard = registry.register(
      'p1',
      SOURCE,
      entryAt(9, 9, 50),
    );

    await expect(registry.measure('p1', SOURCE)).resolves.toMatchObject({
      x: 9,
    });
    unregisterSearchCard();
    await expect(registry.measure('p1', SOURCE)).resolves.toMatchObject({
      x: 1,
    });
  });

  it('prefers the tapped element over a later mount with the same key', async () => {
    const registry = new SharedElementRegistry();
    const listCard = entryAt(1, 1, 50);
    registry.register('p1', SOURCE, listCard);
    registry.markActive('p1', SOURCE, listCard);
    // e.g. the paged list re-mounts a card while search results are shown
    registry.register('p1', SOURCE, entryAt(9, 9, 50));

    await expect(registry.measure('p1', SOURCE)).resolves.toMatchObject({
      x: 1,
    });
  });

  it('forgets the tapped element once it unmounts', async () => {
    const registry = new SharedElementRegistry();
    registry.register('p1', SOURCE, entryAt(1, 1, 50));
    const searchCard = entryAt(9, 9, 50);
    const unregister = registry.register('p1', SOURCE, searchCard);
    registry.markActive('p1', SOURCE, searchCard);
    unregister();

    await expect(registry.measure('p1', SOURCE)).resolves.toMatchObject({
      x: 1,
    });
  });

  it('waits for the target to be laid out, with a timeout', async () => {
    const registry = new SharedElementRegistry();
    const waiting = registry.waitForLayout('p1', TARGET, 1000);
    registry.register('p1', TARGET, entryAt(0, 0, 200));
    registry.notifyLayout('p1', TARGET);
    await expect(waiting).resolves.toBe(true);

    await expect(registry.waitForLayout('never', TARGET, 10)).resolves.toBe(
      false,
    );
  });

  it('hides and reveals elements through their shared opacity', () => {
    const registry = new SharedElementRegistry();
    registry.setHidden('p1', SOURCE, true);
    expect(opacity(registry, 'p1')).toBe(0);
    registry.setHidden('p1', SOURCE, false);
    expect(opacity(registry, 'p1')).toBe(1);
  });
});
