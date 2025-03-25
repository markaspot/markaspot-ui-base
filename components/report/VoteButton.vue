# components/VoteButton.vue
<template>
  <div v-if="isVotingEnabled" class="flex items-center gap-2">
    <UButton
      :loading="loading"
      :disabled="loading"
      variant="soft"
      color="primary"
      class="flex items-center gap-2"
      @click="handleVote"
    >
      <UIcon
        v-if="loading"
        name="i-heroicons-refresh"
        class="w-4 h-4 animate-spin"></UIcon>
      <UIcon
        v-else
        name="i-heroicons-hand-thumb-up"
        class="w-4 h-4"
      />
      <span>{{ voteCount }}</span>
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useVoting } from '~/composables/features/useVoting'
import { useI18n } from 'vue-i18n'
import { useRuntimeConfig } from '#app'

const props = defineProps<{
  reportId: string
}>()

const runtimeConfig = useRuntimeConfig()
const isVotingEnabled = computed(() => 
  runtimeConfig.public.clientConfig.features.voting === true
)

const { t } = useI18n()
const { submitVote, getVotes, loading, voteCount } = useVoting()

const handleVote = async () => {
  try {
    await submitVote(props.reportId)
    await getVotes(props.reportId)
  } catch (error) {
    console.error('Error voting:', error)
  }
}

onMounted(async () => {
  if (isVotingEnabled.value) {
    await getVotes(props.reportId)
  }
})
</script>
