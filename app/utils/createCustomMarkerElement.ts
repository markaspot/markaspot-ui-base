/**
 * Create custom pulsating marker element with crosshair
 * Used for all draggable markers on the map
 * Includes iOS touch handling fixes to prevent drag jumping
 */
export function createCustomMarkerElement(
    color: string = '#dc2626',
    enableColorTransitions = false,
    showDragTooltip = false,
    primaryColor?: string,
    iconType: 'plus' | 'crosshair' = 'plus'
) {
    const el = document.createElement('div');
    el.className = 'refine-marker-wrap';
    // Fix for iOS: Remove inline-block and ensure proper touch target
    el.style.cssText = 'position: relative; display: flex; align-items: center; justify-content: center; cursor: move; width: 40px; height: 61px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); transition: opacity 0.1s ease, transform 0.1s ease; touch-action: manipulation; -webkit-touch-callout: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;';

    // No drag visual effects - keep it simple like normal markers

    el.innerHTML = `
    <svg width="40" height="61" viewBox="0 -20 40 100" xmlns="http://www.w3.org/2000/svg" aria-label="Refine location" class="refine-marker" style="position: relative; pointer-events: all; overflow: visible;">
      <defs>
        <filter id="softShadow" x="-200%" y="-200%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/>
        </filter>
      </defs>
      <g transform="translate(20,56)" pointer-events="none">
        <ellipse cx="0" cy="0" rx="16" ry="5" fill="black" opacity="0.3" filter="url(#softShadow)"/>
      </g>
      <g class="whole-marker-pulse" style="transform-origin: 20px 20px; animation: whole-marker-pulse 2s ease-in-out infinite;" transform="translate(0, -19)">
        <path class="marker-pin" d="M20 4C11 4 4 11 4 20c0 12 16 32 16 32s16-20 16-32c0-9-7-16-16-16Z" fill="${color}" style="${enableColorTransitions ? 'transition: fill 0.2s ease;' : ''}"/>
        <circle class="pulse-circle" cx="20" cy="20" r="11" fill="white"/>
        <g class="marker-icon" fill="${color}" style="${enableColorTransitions ? 'transition: fill 0.2s ease;' : ''}">
          ${iconType === 'crosshair'
                    ? `<path d="M20 11l2 2-2 2-2-2 2-2ZM13 18l2 2-2 2-2-2 2-2ZM27 18l2 2-2 2-2-2 2-2ZM20 25l2 2-2 2-2-2 2-2Z" fill="${color}" style="${enableColorTransitions ? 'transition: fill 0.2s ease;' : ''}"/>
               <path d="M20 13v3M20 24v3M13 20h3M24 20h3" stroke="${color}" stroke-width="3.5" stroke-linecap="round" style="${enableColorTransitions ? 'transition: stroke 0.2s ease;' : ''}"/>`
                    : `<path d="M20 15v10M15 20h10" stroke="${color}" stroke-width="2.5" stroke-linecap="round" style="${enableColorTransitions ? 'transition: stroke 0.2s ease;' : ''}"/>`
            }
        </g>
      </g>
    </svg>
    ${showDragTooltip ? '<div class="refine-tooltip" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 8px; background: #fff; color: #111827; font-size: 13px; line-height: 1.3; padding: 6px 10px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25); opacity: 0; animation: tooltip-fade 0.3s ease forwards, tooltip-hide 1s ease forwards 4s; pointer-events: none;">Zieh mich, um die Position zu verfeinern</div>' : ''}
  `;

    // No need for custom touch handling - MapLibre GL handles dragging

    // Prevent context menu on long press (iOS/Android)
    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    return el;
}
