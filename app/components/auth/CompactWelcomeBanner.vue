<template>
  <!-- Authenticated: user info + logout -->
  <div
    v-if="isAuthenticated && user"
    class="px-3 pt-2 pb-1"
  >
    <div class="p-2">
      <div class="flex items-center gap-3">
        <!-- User Avatar -->
        <div class="flex-shrink-0">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-inverted text-sm font-medium"
            :aria-label="$t('auth.welcome.user_avatar')"
          >
            {{ userInitials }}
          </div>
        </div>

        <!-- User Info & Actions -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <div class="truncate flex-1">
              <p class="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {{ $t('auth.welcome.greeting', { name: displayName }) }}
              </p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {{ user.email }}
              </p>
            </div>


            <!-- Sign Out Button -->
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-arrow-right-on-rectangle"
              :loading="isLoading"
              :aria-label="$t('auth.welcome.sign_out')"
              class="min-h-10 min-w-10 justify-center"
              @click="handleLogout"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const toast = useToast();
const {} = useFeatureFlags();
const { user, isAuthenticated, isLoading, logout } = usePasswordlessAuth();
const { buildPath } = useJurisdictions();

// Compute user initials for avatar
const userInitials = computed(() => {
    if (!user.value) return '';
    const name = user.value.name || user.value.email;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

// Display name with fallback
const displayName = computed(() => {
    if (!user.value) return '';
    return user.value.name || user.value.email.split('@')[0];
});

const handleLogout = async () => {
    const result = await logout();

    if (!result.success) {
        // API call failed. Local state is cleared (user.value = null), so the
        // UI shows anonymous. However, the HttpOnly session cookie may still
        // be present. Do NOT reload, as that would re-authenticate via checkStatus().
        toast.add({
            title: t('auth.error.logout_failed'),
            color: 'error'
        });
        return;
    }

    // Full reload to clear all cached state (config, CSRF, permissions, map data)
    window.location.reload();
};
</script>
