import { describe, expect, it } from 'vitest';
import { computeTourPopoverPosition } from '@/utils/tourPosition';

describe('Interactive Onboarding Tour Coachmark Positioning', () => {
  it('places coachmark below target and aligns pointer arrow straight at target center', () => {
    const pos = computeTourPopoverPosition({
      targetRect: { top: 48, left: 300, width: 120, height: 32 },
      viewportWidth: 1280,
      viewportHeight: 800,
      popoverWidth: 340,
      popoverHeight: 200,
      preferredPlacement: 'bottom',
    });

    expect(pos.placement).toBe('bottom');
    expect(pos.top).toBe(94); // 48 + 32 + 14 gap
    expect(pos.arrowLeft).toBe(170); // centered over popover
  });

  it('clamps coachmark inside right edge of viewport while keeping pointer arrow aimed at Settings icon', () => {
    const pos = computeTourPopoverPosition({
      targetRect: { top: 10, left: 1230, width: 32, height: 32 },
      viewportWidth: 1280,
      viewportHeight: 800,
      popoverWidth: 340,
      popoverHeight: 200,
      preferredPlacement: 'bottom',
    });

    // Clamped inside right margin: 1280 - 340 - 12 = 928
    expect(pos.left).toBe(928);
    // Arrow points right to target center (1246 - 928 = 318)
    expect(pos.arrowLeft).toBe(318);
  });

  it('flips from bottom to top when target sits near bottom edge of viewport', () => {
    const pos = computeTourPopoverPosition({
      targetRect: { top: 700, left: 500, width: 200, height: 48 },
      viewportWidth: 1280,
      viewportHeight: 800,
      popoverWidth: 340,
      popoverHeight: 200,
      preferredPlacement: 'bottom',
    });

    expect(pos.placement).toBe('top');
    expect(pos.top).toBe(486); // 700 - 14 - 200
  });

  it('places coachmark to the right when vertical room above and below a tall target is exhausted', () => {
    const pos = computeTourPopoverPosition({
      targetRect: { top: 200, left: 24, width: 280, height: 420 },
      viewportWidth: 1280,
      viewportHeight: 760,
      popoverWidth: 380,
      popoverHeight: 300,
      preferredPlacement: 'bottom',
    });

    expect(pos.placement).toBe('right');
    expect(pos.left).toBe(318); // 24 + 280 + 14 gap
  });
});
