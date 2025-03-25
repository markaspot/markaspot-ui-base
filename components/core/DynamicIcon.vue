<template>
  <div v-if="svgContent" v-html="svgContent"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  iconName: string
  className?: string
  color?: string 
}>()

const svgContent = ref<string | null>(null)

const loadIcon = async () => {
  if (!props.iconName) return;

  try {
    const cleanIconName = props.iconName
      .replace(/^(far|fas)\s/, '')
      .replace('fa-', '')
      .replace(/-o$/, '')
      .replace(/\s/g, '-');

    const response = await fetch(`/icons/${cleanIconName}.svg`);
    if (!response.ok) {
      console.error(`Failed to load icon: ${cleanIconName}`);
      return;
    }

    let svgText = await response.text();

    // Remove existing fill attributes
    svgText = svgText.replace(/fill="[^"]*"/g, '');

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    
    if (props.color) {
      const paths = svgElement.querySelectorAll('path');
      paths.forEach(path => path.setAttribute('fill', props.color));
    }

    
    if (props.className) {
      svgElement.setAttribute('class', props.className);
    }

    svgContent.value = svgElement.outerHTML;
  } catch (error) {
    console.error('Error loading icon:', error);
  }
};


watch(() => [props.iconName, props.className, props.color], () => {
  loadIcon()
})


onMounted(() => {
  loadIcon()
})
</script>
