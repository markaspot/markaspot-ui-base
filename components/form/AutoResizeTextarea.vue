<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
      {{ $t('report.form.description.label') }}
    </label>
    <div class="relative">
      <!-- Hidden clone for measuring -->
      <div
          ref="ghost"
          aria-hidden="true"
          class="invisible absolute top-0 left-0 w-full"
          :class="textAreaClasses"
      >{{ modelValue }}{{ modelValue.endsWith('\n') ? '\n' : '' }}&nbsp;</div>

      <textarea
          :id="id"
          ref="textarea"
          :value="modelValue"
          @input="onInput"
          :required="required"
          :placeholder="placeholder"
          :class="[
          textAreaClasses,
          {'typing-animation': isTyping}
        ]"
          :style="{ height: textareaHeight + 'px' }"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string
  label?: string
  required?: boolean
  placeholder?: string
  isTyping?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()


const ghost = ref<HTMLDivElement | null>(null)
const textarea = ref<HTMLTextAreaElement | null>(null)
const textareaHeight = ref(100) 
const id = `textarea-${Math.random().toString(36).slice(2, 9)}`

const textAreaClasses = [
  'block w-full rounded-lg',
  'border-gray-300 shadow-sm',
  'focus:ring-blue-500 focus:border-blue-500',
  'transition-all duration-200',
  'p-3',
  'min-h-[100px]',
  'resize-none',
  'whitespace-pre-wrap'
]

const updateHeight = () => {
  if (ghost.value) {
    const newHeight = Math.max(100, ghost.value.scrollHeight)
    if (newHeight !== textareaHeight.value) {
      textareaHeight.value = newHeight
    }
  }
}

const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

watch(() => props.modelValue, () => {
  nextTick(updateHeight)
})

onMounted(() => {
  updateHeight()
})
</script>

<style scoped>
.typing-animation {
  @apply relative;
}

.typing-animation::after {
  content: '|';
  @apply absolute;
  right: 4px;
  top: 3px;
  height: 24px;
  width: 2px;
  background-color: currentColor;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  from, to { opacity: 1; }
  50% { opacity: 0; }
}
</style>