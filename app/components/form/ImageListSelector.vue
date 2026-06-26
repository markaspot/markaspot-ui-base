<template>
  <div>
    <!-- Loading state -->
    <div
      v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-2xl"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="aspect-square rounded-lg bg-(--ui-bg-elevated) animate-pulse"
      />
    </div>

    <!-- Empty state -->
    <p
      v-else-if="items.length === 0"
      class="text-sm text-(--ui-text-muted) py-4"
    >
      {{ $t('form.imagelist.empty', 'No images available for this type.') }}
    </p>

    <!-- Image grid -->
    <div
      v-else
      role="radiogroup"
      :aria-label="ariaLabel"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-2xl"
    >
      <button
        v-for="option in items"
        :key="option.id"
        type="button"
        role="radio"
        :aria-checked="modelValue === option.id"
        class="group relative rounded-lg border-2 p-2 text-center transition-all cursor-pointer
               hover:border-(--ui-primary) focus-visible:outline-2 focus-visible:outline-(--ui-primary)"
        :class="modelValue === option.id
          ? 'border-(--ui-primary) bg-(--ui-primary)/5 ring-2 ring-(--ui-primary)/20'
          : 'border-(--ui-border)'"
        @click="emit('update:modelValue', modelValue === option.id ? '' : option.id)"
      >
        <img
          v-if="option.imageUrl && !imageErrors[option.id]"
          :src="option.imageUrl"
          :alt="option.name"
          class="w-full aspect-square object-contain rounded mb-1"
          loading="lazy"
          @error="imageErrors[option.id] = true"
        >
        <div
          v-else
          class="w-full aspect-square rounded mb-1 bg-(--ui-bg-elevated) flex items-center justify-center"
        >
          <UIcon
            name="i-lucide-image"
            class="size-8 text-(--ui-text-dimmed)"
            aria-hidden="true"
          />
        </div>
        <span class="text-sm font-medium line-clamp-2">{{ option.name }}</span>

        <!-- Selected indicator (decorative, state conveyed by aria-checked) -->
        <UIcon
          v-if="modelValue === option.id"
          name="i-lucide-check-circle"
          class="absolute top-1 right-1 text-(--ui-primary) size-5"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Error -->
    <p
      v-if="error"
      class="text-sm text-(--ui-error) mt-2"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    mediaType: string
    mediaGroup?: string
    modelValue: string
    ariaLabel?: string
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>();

const imageErrors = reactive<Record<string, boolean>>({});

const mediaTypeRef = toRef(() => props.mediaType);
const mediaGroupRef = toRef(() => props.mediaGroup);
const { items, loading, error } = useMediaTypeEntities(mediaTypeRef, mediaGroupRef);
</script>
