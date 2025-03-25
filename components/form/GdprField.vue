<template>
  <div v-if="config" class="mb-4">
    <!-- Use the standard UFormGroup structure but with proper labels -->
    <UFormGroup
        :error="error"
    >
      <!-- Try a completely different approach using a custom checkbox -->
      <div class="flex items-start space-x-2">
        <div class="flex items-center h-6 mt-0.5">
          <input
            type="checkbox"
            :checked="modelValue"
            @change="handleInput(!modelValue)"
            :required="isRequired"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            :class="{ 'border-red-500': error }"
          />
        </div>
        <div>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ config.label }}
            <span v-if="isRequired" class="text-red-500">*</span>
          </span>
          
          <!-- Use v-html for description now that the HTML comes pre-formatted correctly from Drupal -->
          <div 
            v-if="config?.description" 
            class="text-sm text-gray-600 dark:text-gray-400"
            v-html="processedDescription"
            @click="handleLinkClick($event)"
          ></div>
        </div>
      </div>
    </UFormGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useFormSettings } from '~/composables/form/useFormSettings'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'validation': [isValid: boolean]
}>()

const { settings } = useFormSettings()
const error = ref<string | null>(null)

const config = computed(() => settings.value?.fields.field_gdpr)
const isRequired = computed(() => config.value?.required ?? false)


)


const availableFields = computed(() => {
  const fields = [];
  if (config.value) {
    for (const key in config.value) {
      fields.push(key);
    }
  }
  
  return fields;
});


const processedDescription = computed(() => {
  
  const description = config.value?.description || t('report.form.gdpr.description');
  
  
  return description;
});


const handleLinkClick = (event: MouseEvent) => {
  
  const target = event.target as HTMLElement;
  
  if (target && target.tagName === 'A') {
    
    event.preventDefault();
    
    
    const pageName = target.getAttribute('data-page');
    
    
    if (pageName) {
      
      showPageByName(pageName);
    }
  }
};

const validate = (value: boolean) => {
  if (isRequired.value && !value) {
    error.value = config.value?.validation_message || t('report.form.gdpr.required')
    emit('validation', false)
    return false
  }
  error.value = null
  emit('validation', true)
  return true
}

const handleInput = (value: boolean) => {
  emit('update:modelValue', value)
  validate(value)
}


const pageToShow = ref<any>(null)


const showPageDirectly = inject<(page: any) => void>('showPage')
const emitter = useEmitter()


const showPageByName = async (pageName: string) => {
  
  
  
  const { pages, fetchPages } = usePages()
  
  
  if (pages.value.length === 0) {
    await fetchPages()
  }
  
  
  let searchTerms: string[] = []
  
  
  if (pageName === 'privacy') {
    searchTerms = ['privacy', 'datenschutz', 'datenschutzerkl']
  } else if (pageName === 'terms') {
    searchTerms = ['terms', 'term', 'agb', 'bedingung']
  } else {
    searchTerms = [pageName]
  }
  
  
  const page = pages.value.find(page => {
    const title = page.attributes.title.toLowerCase();
    return searchTerms.some(term => title.includes(term.toLowerCase()))
  })
  
  
  
  if (page) {
    
    if (showPageDirectly) {
      
      showPageDirectly(page)
      return
    }
    
    
    
    emitter.emit('show-page', page)
  } else {
    console.warn(`Page with name '${pageName}' not found`)
    
    if (pages.value.length > 0) {
      const firstPage = pages.value[0]
      
      
      if (showPageDirectly) {
        showPageDirectly(firstPage)
      } else {
        emitter.emit('show-page', firstPage)
      }
    }
  }
}

watchEffect(() => {
  validate(props.modelValue)
})
</script>

<style scoped>
:deep(a), :deep(.page-link) {
  color: var(--color-primary-500, #4f46e5);
  text-decoration: underline;
  cursor: pointer;
}

:deep(a:hover), :deep(.page-link:hover) {
  text-decoration: none;
}

:deep(.form-checkbox-container) {
  align-items: flex-start; 
}

:deep(.form-checkbox-label) {
  padding-top: 0;
}
</style>