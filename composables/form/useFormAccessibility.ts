
import { ref, onMounted, onUnmounted } from 'vue'

export const useFormAccessibility = () => {
  
  const hasFocus = ref(false)
  
    const scrollToError = (errorSelector: string) => {
    nextTick(() => {
      const errorElement = document.querySelector(errorSelector)
      if (errorElement) {
        
        errorElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        })
        
        
        const focusableElement = 
          errorElement.querySelector('input, select, textarea, button, [tabindex]') || 
          errorElement
        
        if (focusableElement instanceof HTMLElement) {
          focusableElement.focus()
        }
      }
    })
  }
  
    const handleKeyboardNavigation = (
    event: KeyboardEvent,
    options: any[],
    currentIndex: number,
    selectOption: (option: any, index: number) => void
  ) => {
    if (!options.length) return
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
        selectOption(options[nextIndex], nextIndex)
        break
        
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
        selectOption(options[prevIndex], prevIndex)
        break
        
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (currentIndex >= 0) {
          selectOption(options[currentIndex], currentIndex)
        }
        break
        
      case 'Escape':
        event.preventDefault()
        
        break
    }
  }
  
    const createAriaAttributes = (params: {
    id: string,
    label: string,
    required?: boolean,
    hasError?: boolean,
    errorId?: string,
    describedBy?: string[],
    expanded?: boolean,
    controls?: string,
    selected?: boolean,
    role?: string
  }) => {
    const ariaAttrs: Record<string, any> = {
      id: params.id,
      'aria-label': params.label,
    }
    
    if (params.required) {
      ariaAttrs['aria-required'] = 'true'
    }
    
    if (params.hasError) {
      ariaAttrs['aria-invalid'] = 'true'
    }
    
    
    const describedBy = [...(params.describedBy || [])]
    if (params.hasError && params.errorId) {
      describedBy.push(params.errorId)
    }
    
    if (describedBy.length > 0) {
      ariaAttrs['aria-describedby'] = describedBy.join(' ')
    }
    
    if (params.expanded !== undefined) {
      ariaAttrs['aria-expanded'] = params.expanded.toString()
    }
    
    if (params.controls) {
      ariaAttrs['aria-controls'] = params.controls
    }
    
    if (params.selected !== undefined) {
      ariaAttrs['aria-selected'] = params.selected.toString()
    }
    
    if (params.role) {
      ariaAttrs.role = params.role
    }
    
    return ariaAttrs
  }
  
    const setupFocusTracking = (elementRef: any) => {
    const onFocus = () => {
      hasFocus.value = true
    }
    
    const onBlur = () => {
      hasFocus.value = false
    }
    
    onMounted(() => {
      const element = elementRef.value
      if (element) {
        element.addEventListener('focus', onFocus)
        element.addEventListener('blur', onBlur)
      }
    })
    
    onUnmounted(() => {
      const element = elementRef.value
      if (element) {
        element.removeEventListener('focus', onFocus)
        element.removeEventListener('blur', onBlur)
      }
    })
    
    return { hasFocus }
  }
  
  return {
    scrollToError,
    handleKeyboardNavigation,
    createAriaAttributes,
    setupFocusTracking,
    hasFocus
  }
}