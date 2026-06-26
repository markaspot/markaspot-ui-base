# Unit Testing Guide for Nuxt Composables

This guide explains how to write unit tests for Vue/Nuxt composables with dependencies like API calls, state management, and Nuxt-specific composables.

> **This is the unit layer (layer 1): no backend, no network.** Every dependency is
> mocked; a real `fetch()`/`XMLHttpRequest` throws (guard in `setup.ts`). If your test
> needs a real Drupal response, it belongs in the API-contract or integration layer —
> see [`../README.md`](../README.md) for the layer split and how to decide.

## Table of Contents

1. [Setup Overview](#setup-overview)
2. [Testing Simple Composables](#testing-simple-composables)
3. [Testing Composables with Dependencies](#testing-composables-with-dependencies)
4. [Key Testing Patterns](#key-testing-patterns)
5. [Examples](#examples)
6. [Common Issues](#common-issues)

---

## Setup Overview

### Project Structure

```
tests/unit/
├── __mocks__/              # Reusable mocks
│   ├── nuxt.ts            # Mock Nuxt composables
│   └── apiClient.ts       # Mock API client
├── setup.ts               # Global test setup (auto-imports)
├── composables/           # Composable tests
│   ├── core/
│   │   ├── useDebounceFn.test.ts
│   │   └── useServiceStatus.test.ts
│   └── form/
│       └── useFormSettings.test.ts
└── README.md              # This file
```

### Configuration Files

**vitest.config.ts:**
```typescript
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/unit/setup.ts']
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '@': resolve(__dirname, './app'),
      '#app': resolve(__dirname, './tests/unit/__mocks__/nuxt')
    }
  }
});
```

**tests/unit/setup.ts:**
- Provides Vue auto-imports (ref, computed, reactive, etc.)
- Simulates Nuxt's auto-import behavior for tests

---

## Testing Simple Composables

### Example: Pure Function (useDebounceFn)

**Characteristics:**
- No external dependencies
- Pure function logic
- Only needs timer mocking

**Key Patterns:**
```typescript
describe('useDebounceFn', () => {
  beforeEach(() => {
    vi.useFakeTimers(); // Control time in tests
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const mockFn = vi.fn();
    const debouncedFn = useDebounceFn(mockFn, 500);

    debouncedFn('hello');
    expect(mockFn).not.toHaveBeenCalled(); // Not called immediately

    vi.advanceTimersByTime(500); // Fast-forward time
    expect(mockFn).toHaveBeenCalledWith('hello'); // Now called
  });
});
```

**What to test:**
- ✅ Function behavior with timing
- ✅ Argument handling
- ✅ Edge cases (rapid calls, different delays)
- ✅ TypeScript type safety

**See:** `/tests/unit/composables/core/useDebounceFn.test.ts`

---

## Testing Composables with Dependencies

### Example: Stateful Composable (useServiceStatus)

**Characteristics:**
- Uses Nuxt composables (useNuxtApp)
- Manages reactive state (refs)
- Singleton pattern
- Time-based logic

**Key Patterns:**

#### 1. Mock Nuxt Composables

```typescript
// Mock BEFORE importing the composable
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $t: (key: string, params?: any) => `translated: ${key}`,
    $i18n: { t: (key: string) => key }
  })
}));

// NOW import the composable
import { useServiceStatus } from '@/composables/core/useServiceStatus';
```

#### 2. Test Reactive State

```typescript
it('should register service failure', () => {
  const { isServiceDown, retryAfter, registerServiceFailure } = useServiceStatus();

  // Initial state
  expect(isServiceDown.value).toBe(false);

  // Act
  registerServiceFailure({ statusCode: 503 });

  // State changed
  expect(isServiceDown.value).toBe(true);
  expect(retryAfter.value).toBe(30000);
});
```

#### 3. Test Singleton State

```typescript
it('should share state across instances', () => {
  const instance1 = useServiceStatus();
  const instance2 = useServiceStatus();

  instance1.registerServiceFailure({ statusCode: 503 });

  // Both instances see the same state
  expect(instance1.isServiceDown.value).toBe(true);
  expect(instance2.isServiceDown.value).toBe(true);
});
```

#### 4. Test Time-Based Logic

```typescript
it('should prevent retry during retry window', () => {
  const { shouldRetry, registerServiceFailure } = useServiceStatus();

  vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  registerServiceFailure({ statusCode: 503 });

  expect(shouldRetry()).toBe(false); // Blocked immediately

  vi.advanceTimersByTime(15000); // 15 seconds
  expect(shouldRetry()).toBe(false); // Still blocked

  vi.advanceTimersByTime(15001); // 30+ seconds
  expect(shouldRetry()).toBe(true); // Now allowed
});
```

**What to test:**
- ✅ State initialization
- ✅ State transitions
- ✅ Singleton behavior
- ✅ Time-based logic
- ✅ Error handling
- ✅ Readonly refs
- ✅ Real-world scenarios

**See:** `/tests/unit/composables/core/useServiceStatus.test.ts`

---

## Key Testing Patterns

### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
it('should do something', () => {
  // Arrange: Set up test data and mocks
  const mockFn = vi.fn();
  const composable = useMyComposable();

  // Act: Execute the code
  composable.doSomething();

  // Assert: Verify the result
  expect(mockFn).toHaveBeenCalled();
});
```

### Pattern 2: Mocking Nuxt Composables

**Option A: Simple Mock**
```typescript
vi.mock('#app', () => ({
  useState: (key: string, init: () => any) => ref(init()),
  useAsyncData: vi.fn()
}));
```

**Option B: Reusable Mock**
```typescript
// In tests/unit/__mocks__/nuxt.ts
export const mockUseState = <T>(key: string, init?: () => T) => {
  // Implementation
};

// In your test
vi.mock('#app', () => ({
  useState: mockUseState
}));
```

### Pattern 3: Mocking API Calls

```typescript
// Create mock API client
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  // ... other methods
};

// Mock the module
vi.mock('@/composables/api/useApiClient', () => ({
  useApiClient: () => mockApi
}));

// In test: Control responses
mockApi.get.mockResolvedValueOnce({ data: 'success' });
mockApi.get.mockRejectedValueOnce(new Error('failed'));
```

### Pattern 4: Testing Computed Properties

```typescript
it('should update computed when state changes', async () => {
  const { settings, hasField, fetchSettings } = useFormSettings();

  // Initially no settings
  expect(hasField('field_address').value).toBe(false);

  // Fetch settings
  mockApi.get.mockResolvedValueOnce(mockFormSettings);
  await fetchSettings();
  await nextTick(); // Wait for Vue to update

  // Computed property reflects new data
  expect(hasField('field_address').value).toBe(true);
});
```

### Pattern 5: Testing Error Handling

```typescript
it('should handle API errors gracefully', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error')
    .mockImplementation(() => {});

  mockApi.get.mockRejectedValueOnce(new Error('Network error'));

  const { settings, fetchSettings } = useFormSettings();
  await fetchSettings();

  expect(settings.value).toBeNull();
  expect(consoleErrorSpy).toHaveBeenCalled();

  consoleErrorSpy.mockRestore();
});
```

### Pattern 6: Testing Real-World Scenarios

```typescript
it('real-world: search input debouncing', () => {
  const searchAPI = vi.fn();
  const debouncedSearch = useDebounceFn(searchAPI, 300);

  // User types "mark-a-spot" quickly
  'mark-a-spot'.split('').forEach((char) => {
    debouncedSearch(char);
    vi.advanceTimersByTime(50); // 50ms between keystrokes
  });

  // API not called during typing
  expect(searchAPI).not.toHaveBeenCalled();

  // User stops typing - wait 300ms
  vi.advanceTimersByTime(250); // 50 + 250 = 300ms since last keystroke

  // NOW search executes (only once!)
  expect(searchAPI).toHaveBeenCalledOnce();
});
```

---

## Examples

### Example 1: Testing Pure Functions

**When to use:**
- Composable has no external dependencies
- Logic is synchronous
- No API calls or state management

**Example:** `useDebounceFn`

**Test file:** `/tests/unit/composables/core/useDebounceFn.test.ts`

**Key learnings:**
- Use `vi.useFakeTimers()` for time-based logic
- Use `vi.fn()` to create mock functions
- Use `vi.advanceTimersByTime()` to control time
- Test TypeScript types with `@ts-expect-error`

---

### Example 2: Testing Stateful Composables

**When to use:**
- Composable uses refs/reactive state
- Has Nuxt composable dependencies
- Manages singleton state

**Example:** `useServiceStatus`

**Test file:** `/tests/unit/composables/core/useServiceStatus.test.ts`

**Key learnings:**
- Mock `#app` imports before importing composable
- Test state initialization and transitions
- Handle singleton state across test instances
- Use `vi.setSystemTime()` for Date.now() mocking
- Mock console methods to verify logging

**Coverage:**
- ✅ 15 test cases
- ✅ State management
- ✅ Time-based retry logic
- ✅ Singleton pattern
- ✅ i18n fallbacks
- ✅ Real-world API retry scenarios

---

### Example 3: Testing API-Dependent Composables

**When to use:**
- Composable makes API calls
- Uses `useAsyncData` or `useFetch`
- Has complex async logic

**Example:** `useFormSettings` (advanced)

**Test file:** `/tests/unit/composables/form/useFormSettings.test.ts`

**Challenges:**
- Mocking `useApiClient` and its dependencies
- Handling SSR vs client-side logic
- Testing computed properties with async data

**Note:** This example demonstrates advanced patterns but has complex dependency chains. Start with simpler composables first.

---

## Common Issues

### Issue 1: "ref is not defined"

**Problem:** Nuxt auto-imports Vue functions, but tests don't have them.

**Solution:** Add to `/tests/unit/setup.ts`:
```typescript
import { ref, computed, reactive } from 'vue';
globalThis.ref = ref;
globalThis.computed = computed;
globalThis.reactive = reactive;
```

---

### Issue 2: "Failed to resolve import '#app'"

**Problem:** Vitest doesn't know how to resolve Nuxt's `#app` alias.

**Solution:** Add to `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '#app': resolve(__dirname, './tests/unit/__mocks__/nuxt')
  }
}
```

---

### Issue 3: Singleton State Leaking Between Tests

**Problem:** Composable uses singleton pattern, state persists across tests.

**Solution:** Reset state in `beforeEach`:
```typescript
beforeEach(() => {
  const { registerServiceSuccess } = useServiceStatus();
  registerServiceSuccess(); // Clear any failure state
});
```

Or expose a reset function in the composable for testing.

---

### Issue 4: Async Tests Not Updating

**Problem:** Computed properties don't update after async operations.

**Solution:** Use `await nextTick()`:
```typescript
await fetchSettings();
await nextTick(); // Wait for Vue reactivity to update

expect(hasField('field_address').value).toBe(true);
```

---

### Issue 5: Mock Not Working

**Problem:** Mock defined after import, or in wrong order.

**Solution:** Always mock BEFORE importing:
```typescript
// ✅ Correct order
vi.mock('#app', () => ({ /* ... */ }));
import { useMyComposable } from '@/composables/useMyComposable';

// ❌ Wrong order
import { useMyComposable } from '@/composables/useMyComposable';
vi.mock('#app', () => ({ /* ... */ }));
```

---

## Best Practices

### 1. Start Simple
- Begin with pure functions (like `useDebounceFn`)
- Progress to stateful composables (like `useServiceStatus`)
- Then tackle API-dependent composables

### 2. Test Behavior, Not Implementation
```typescript
// ✅ Good: Test behavior
expect(isServiceDown.value).toBe(true);

// ❌ Bad: Test implementation details
expect(composable._internalState).toBe(true);
```

### 3. Use Descriptive Test Names
```typescript
// ✅ Good
it('should prevent retry during retry window')

// ❌ Bad
it('test retry')
```

### 4. Clean Up After Tests
```typescript
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
```

### 5. Document Complex Patterns
Add comments explaining non-obvious test logic, especially for:
- Time-based logic
- Singleton state handling
- Complex mock setup

---

## Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit tests/unit/composables/core/useServiceStatus.test.ts

# Run in watch mode
npm run test:unit -- --watch

# Run with coverage
npm run test:unit -- --coverage
```

---

## Next Steps

1. **Learn by example:** Study `useDebounceFn.test.ts` and `useServiceStatus.test.ts`
2. **Start simple:** Write tests for pure utility functions first
3. **Build up:** Progress to more complex composables
4. **Iterate:** Refine your mocks as you discover patterns
5. **Document:** Add comments explaining complex test patterns

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Vue Composables](https://vuejs.org/guide/scaling-up/testing.html)
- [Nuxt Testing Guide](https://nuxt.com/docs/getting-started/testing)

---

## Questions?

If you encounter issues:

1. Check if the composable is importing auto-imported functions (add to setup.ts)
2. Verify mocks are defined before imports
3. Look at existing test examples in this directory
4. Check the [Common Issues](#common-issues) section above

Happy testing! 🎉
