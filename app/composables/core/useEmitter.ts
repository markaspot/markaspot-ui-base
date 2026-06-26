import mitt from 'mitt';

// Create a typed event emitter

/**
 * Emitter Composable
 *
 * Provides  emitter functionality for the application.
 *
 * @returns Reactive state and methods for emitter functionality
 */

type Events = {
    'show-page': unknown // The page object to display
    'requests-refreshed': { reason: 'locale-change' }
};

// Create a symbol key for injection
const EmitterKey = Symbol('emitter');

// Create a single instance of the emitter
const emitter = mitt<Events>();

// Simply use a singleton pattern
export const useEmitter = () => {
    return emitter;
};

// For completeness, though we're using a singleton now
export const provideEmitter = () => {
    provide(EmitterKey, emitter);
    return emitter;
};
