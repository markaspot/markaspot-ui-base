<template>
  <nav
    class="sr-only focus-within:not-sr-only"
    aria-label="Skip navigation"
  >
    <ul class="flex flex-col gap-2">
      <li>
        <a
          href="#main-content"
          class="skip-link focus-ring-thick"
          data-allow-mismatch="text"
          @click="skipToMain"
        >
          {{ $t('accessibility.skip_to_main', 'Skip to main content') }}
        </a>
      </li>
      <li v-if="showMapLink">
        <a
          href="#map-canvas"
          class="skip-link focus-ring-thick"
          data-allow-mismatch="text"
          @click="skipToMap"
        >
          {{ $t('accessibility.skip_to_map', 'Skip to map') }}
        </a>
      </li>
      <li v-if="showFormLink">
        <a
          href="#report-actions"
          class="skip-link focus-ring-thick"
          data-allow-mismatch="text"
          @click="skipToForm"
        >
          {{ $t('accessibility.skip_to_form', 'Skip to form') }}
        </a>
      </li>
      <li>
        <a
          href="#main-navigation-tabs"
          class="skip-link focus-ring-thick"
          data-allow-mismatch="text"
          @click="skipToNavigation"
        >
          {{ $t('accessibility.skip_to_navigation', 'Skip to navigation') }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
/**
 * SkipNavigation Component
 *
 * Provides keyboard users with quick access to main page sections.
 * Links are hidden until focused, providing a clean visual experience
 * while maintaining accessibility.
 */

interface Props {
    showMapLink?: boolean
    showFormLink?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    showMapLink: true,
    showFormLink: true
});

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const smoothScroll = (element: Element, block: ScrollLogicalPosition = 'start') => {
    if (!element) return;
    if (prefersReducedMotion()) {
        (element as HTMLElement).scrollIntoView({ block });
        return;
    }
    (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block });
};

const skipToMain = (event: Event) => {
    event.preventDefault();
    const main = document.getElementById('main-content') || document.querySelector('main');
    if (main) {
        main.focus();
        smoothScroll(main, 'start');
    }
};

const skipToMap = (event: Event) => {
    event.preventDefault();
    // Look for MapLibre canvas first, then fallback to map container
    const mapCanvas = document.querySelector('.maplibregl-canvas') as HTMLCanvasElement;
    if (mapCanvas) {
        mapCanvas.focus();
        smoothScroll(mapCanvas, 'center');
    } else {
        const mapContainer = document.getElementById('map-canvas') || document.querySelector('[id*="map"]');
        if (mapContainer) {
            (mapContainer as HTMLElement).focus();
            smoothScroll(mapContainer, 'center');
        }
    }
};

const skipToForm = (event: Event) => {
    event.preventDefault();
    // Prefer explicit report action buttons (opens reporting flow)
    const actions = document.getElementById('report-actions');
    if (actions) {
        const firstAction = actions.querySelector('button, [href], [role="button"], [tabindex]:not([tabindex="-1"])') as HTMLElement;
        if (firstAction) {
            firstAction.focus();
            smoothScroll(actions, 'start');
            return;
        }
    }
    // Fallback to explicit form container or first form on page
    const form = document.getElementById('report-form') || document.querySelector('form');
    if (form) {
        const firstInput = form.querySelector('input, select, textarea, button:not([disabled])') as HTMLElement;
        if (firstInput) {
            firstInput.focus();
            smoothScroll(form, 'start');
        }
    }
};

const skipToNavigation = (event: Event) => {
    event.preventDefault();
    // Prefer the tablist used for main navigation
    const tablist = document.getElementById('main-navigation-tabs') || document.querySelector('[role="tablist"]');
    if (tablist) {
        const firstTab = tablist.querySelector('[role="tab"]') as HTMLElement;
        if (firstTab) {
            firstTab.focus();
            smoothScroll(tablist, 'start');
            return;
        }
    }
    // Fallback: any nav landmark
    const nav = document.querySelector('nav');
    if (nav) smoothScroll(nav, 'start');
};
</script>
