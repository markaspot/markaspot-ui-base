/**
 * Form State Persistence Composable
 *
 * Shared logic for saving and restoring state across citizen report forms.
 * Handles media serialization (blob URLs -> base64), state restoration, and mapCenter watching.
 */

import type { UploadedMedia } from '@/types/form';

interface LocationData {
    lat: string | number
    lng: string | number
    address?: string
    addressObj?: Record<string, unknown>
    displayName?: string
}

interface FormState {
    description?: string
    category?: string
    email?: string
    phone?: string
    name?: string
    prename?: string
    facilityId?: string
    gdprAccepted?: boolean
    uploadedMedia?: UploadedMedia[]
    location?: LocationData
    conditionalFields?: Record<string, any>
    aiAnalysisComplete?: boolean
}

interface FormStateRefs {
    description: Ref<string>
    category: Ref<string>
    email: Ref<string>
    phone: Ref<string>
    name: Ref<string>
    prename: Ref<string>
    facilityId?: Ref<string>
    gdprAccepted: Ref<boolean>
    uploadedMedia: Ref<UploadedMedia[]>
    location: Ref<LocationData | null>
}

interface WatchMapCenterOptions {
    enabled?: Ref<boolean> | ComputedRef<boolean>
}

export const useFormStatePersistence = (formRefs: FormStateRefs) => {
    const isSavingState = ref(false);

    /**
     * Get current form state with async media serialization
     * Converts blob URLs to base64 data URLs so they survive component destruction
     */
    const getFormState = async (): Promise<FormState | null> => {
        console.log('💾 SAVE: getFormState called');

        // Prevent concurrent save operations
        if (isSavingState.value) {
            console.warn('⚠️ SAVE: Form state save already in progress, skipping...');
            return null;
        }

        isSavingState.value = true;
        console.log('💾 SAVE: Starting state save, uploadedMedia.length:', formRefs.uploadedMedia.value.length);

        try {
            // Convert uploadedMedia blob URLs to base64 data URLs so they survive component destruction
            let serializedMedia = [];

            if (formRefs.uploadedMedia.value && formRefs.uploadedMedia.value.length > 0) {
                serializedMedia = await Promise.all(
                    formRefs.uploadedMedia.value.map(async (media) => {
                        try {
                            // Skip if already a data URL
                            if (media.preview.startsWith('data:')) {
                                return media;
                            }

                            // Fetch the blob from the blob URL and convert to base64
                            const response = await fetch(media.preview);
                            const blob = await response.blob();
                            return new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    resolve({
                                        ...media,
                                        preview: reader.result as string // base64 data URL
                                    });
                                };
                                reader.readAsDataURL(blob);
                            });
                        } catch (error) {
                            console.error('Failed to serialize media:', error);
                            return null;
                        }
                    })
                );
            }

            return {
                description: formRefs.description.value,
                category: formRefs.category.value,
                email: formRefs.email.value,
                phone: formRefs.phone.value,
                name: formRefs.name.value,
                prename: formRefs.prename.value,
                facilityId: formRefs.facilityId?.value,
                gdprAccepted: formRefs.gdprAccepted.value,
                uploadedMedia: serializedMedia.filter(Boolean),
                location: formRefs.location.value
            };
        } finally {
            isSavingState.value = false;
        }
    };

    /**
     * Restore form state from saved data
     */
    const restoreFormState = (state: FormState | null) => {
        if (!state) return;

        console.log('🔄 RESTORE: Starting form state restoration');

        if (state.description !== undefined) formRefs.description.value = state.description;
        if (state.category !== undefined) formRefs.category.value = state.category;
        if (state.email !== undefined) formRefs.email.value = state.email;
        if (state.phone !== undefined) formRefs.phone.value = state.phone;
        if (state.name !== undefined) formRefs.name.value = state.name;
        if (state.prename !== undefined) formRefs.prename.value = state.prename;
        if (state.facilityId !== undefined && formRefs.facilityId) formRefs.facilityId.value = state.facilityId;
        if (state.gdprAccepted !== undefined) formRefs.gdprAccepted.value = state.gdprAccepted;

        // Restore uploadedMedia with base64 data URLs (converted from blob URLs during save)
        if (state.uploadedMedia !== undefined) {
            console.log('🔄 RESTORE: Restoring uploadedMedia, length:', state.uploadedMedia?.length);
            formRefs.uploadedMedia.value = state.uploadedMedia;
        }

        if (state.location !== undefined) formRefs.location.value = state.location;

        console.log('✅ RESTORE: Form state restoration complete');
    };

    /**
     * Setup watcher for mapCenter changes to update location
     * Handles "pick on map" functionality
     */
    const watchMapCenter = (
        mapCenterProp: ComputedRef<LocationData | null> | Ref<LocationData | null>,
        options: WatchMapCenterOptions = {}
    ) => {
        watch(
            mapCenterProp,
            (newMapCenter, oldMapCenter) => {
                if (options.enabled && !options.enabled.value) {
                    return;
                }

                console.log('📍 WATCH: mapCenter changed', { new: newMapCenter, old: oldMapCenter });

                // Skip if no oldMapCenter (initial run handled by onMounted)
                if (!oldMapCenter) {
                    console.log('📍 WATCH: Skipping - no oldMapCenter');
                    return;
                }

                // Skip if coordinates haven't actually changed
                if (newMapCenter?.lat === oldMapCenter?.lat && newMapCenter?.lng === oldMapCenter?.lng) {
                    console.log('📍 WATCH: Skipping - coordinates unchanged');
                    return;
                }

                // Update location when map center changes (for subsequent map clicks)
                if (newMapCenter?.lat !== undefined && newMapCenter?.lng !== undefined) {
                    console.log('📍 WATCH: Updating location from mapCenter');
                    // Clear the current location first to trigger reverse geocoding
                    formRefs.location.value = { lat: '', lng: '', address: undefined, displayName: '' };

                    // Then set the new location in next tick
                    nextTick(() => {
                        formRefs.location.value = {
                            lat: newMapCenter.lat.toString(),
                            lng: newMapCenter.lng.toString(),
                            address: newMapCenter.address,
                            addressObj: newMapCenter.addressObj || undefined,
                            displayName: newMapCenter.address || ''
                        };
                    });
                }
            }
        );
    };

    return {
        getFormState,
        restoreFormState,
        watchMapCenter
    };
};
