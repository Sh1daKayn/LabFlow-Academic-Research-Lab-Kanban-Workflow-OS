export type TourPlacement = 'bottom' | 'top' | 'left' | 'right';

export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ComputedTourPopover {
  top: number;
  left: number;
  placement: TourPlacement;
  arrowLeft: number;
  arrowTop: number;
}

/**
 * Computes non-clipping viewport coordinates and exact pointer-arrow offsets
 * for an Onboarding Tour coachmark anchored to `targetRect`.
 */
export function computeTourPopoverPosition(params: {
  targetRect: TourRect;
  viewportWidth: number;
  viewportHeight: number;
  popoverWidth?: number;
  popoverHeight?: number;
  preferredPlacement?: TourPlacement;
  gap?: number;
  margin?: number;
}): ComputedTourPopover {
  const {
    targetRect,
    viewportWidth,
    viewportHeight,
    popoverWidth = 340,
    popoverHeight = 205,
    preferredPlacement = 'bottom',
    gap = 14,
    margin = 12,
  } = params;

  const safeW = Math.min(popoverWidth, Math.max(240, viewportWidth - margin * 2));
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const targetBottom = targetRect.top + targetRect.height;
  const targetRight = targetRect.left + targetRect.width;

  const fitsBottom = targetBottom + gap + popoverHeight + margin <= viewportHeight;
  const fitsTop = targetRect.top - gap - popoverHeight - margin >= 0;
  const fitsRight = targetRight + gap + safeW + margin <= viewportWidth;
  const fitsLeft = targetRect.left - gap - safeW - margin >= 0;

  let placement: TourPlacement = preferredPlacement;
  if (placement === 'bottom' && !fitsBottom) {
    placement = fitsTop ? 'top' : fitsRight ? 'right' : fitsLeft ? 'left' : 'bottom';
  } else if (placement === 'top' && !fitsTop) {
    placement = fitsBottom ? 'bottom' : fitsRight ? 'right' : fitsLeft ? 'left' : 'top';
  } else if (placement === 'right' && !fitsRight) {
    placement = fitsLeft ? 'left' : fitsBottom ? 'bottom' : 'top';
  } else if (placement === 'left' && !fitsLeft) {
    placement = fitsRight ? 'right' : fitsBottom ? 'bottom' : 'top';
  }

  let top = 0;
  let left = 0;

  if (placement === 'bottom') {
    top = targetBottom + gap;
    left = targetCenterX - safeW / 2;
  } else if (placement === 'top') {
    top = targetRect.top - gap - popoverHeight;
    left = targetCenterX - safeW / 2;
  } else if (placement === 'right') {
    left = targetRight + gap;
    top = targetCenterY - popoverHeight / 2;
  } else {
    left = targetRect.left - gap - safeW;
    top = targetCenterY - popoverHeight / 2;
  }

  const clampedLeft = Math.max(margin, Math.min(left, viewportWidth - safeW - margin));
  const clampedTop = Math.max(margin, Math.min(top, viewportHeight - popoverHeight - margin));

  const arrowLeft = Math.max(
    18,
    Math.min(targetCenterX - clampedLeft, safeW - 18)
  );
  const arrowTop = Math.max(
    18,
    Math.min(targetCenterY - clampedTop, popoverHeight - 18)
  );

  return {
    top: Math.round(clampedTop),
    left: Math.round(clampedLeft),
    placement,
    arrowLeft: Math.round(arrowLeft),
    arrowTop: Math.round(arrowTop),
  };
}
