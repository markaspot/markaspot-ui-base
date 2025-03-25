import { defineStore } from 'pinia'

export const useServiceRequestStore = defineStore('serviceRequest', {
    state: () => ({
        requests: [],
        loading: false,
        error: null
    }),
    actions: {
        
    }
})