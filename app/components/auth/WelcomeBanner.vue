<template>
  <div
    v-if="isAuthenticated && user"
    class="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800"
  >
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Welcome Message -->
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-inverted">
            <UIcon
              name="i-heroicons-user-circle"
              class="h-5 w-5"
            />
          </div>
          <div>
            <p class="text-sm font-medium text-neutral-900 dark:text-white">
              {{ $t('auth.welcome.greeting', { name: user.name || user.email }) }}
            </p>
            <p class="text-xs text-neutral-600 dark:text-neutral-400">
              {{ user.email }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">

          <!-- Sign Out Button -->
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="isLoading"
            @click="handleLogout"
          >
            <template #leading>
              <UIcon name="i-heroicons-arrow-right-on-rectangle" />
            </template>
            {{ $t('auth.welcome.sign_out') }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const {} = useFeatureFlags();
const { user, isAuthenticated, isLoading, logout } = usePasswordlessAuth();
const { buildPath } = useJurisdictions();

/**
 * Handle logout
 */
const handleLogout = async () => {
    await logout();
    // Force full page reload to clear all cached data and refresh for anonymous user
    window.location.reload();
};
</script>
