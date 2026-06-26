import { computed, onUnmounted } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import type { FacilityConfigItem } from '~~/types/clientConfig';
import { useFacilityReporting } from '~/composables/features/useFacilityReporting';
import { useMapFacilitySelection } from '~/composables/features/useMapFacilitySelection';
import { formatFacilityAddress } from '~/utils/facilityAddress';

export const FACILITY_FORM_FIELD = 'field_facility' as const;
export const FACILITY_DRAFT_FIELD = 'facilityId' as const;

interface FacilityLocationValue {
    lat: string | number
    lng: string | number
    address?: unknown
    displayName?: string
}

interface UseFacilityFormModeOptions {
    /**
     * Frontend form and offline draft name. The Drupal/Open311 payload name is
     * intentionally kept separate as FACILITY_FORM_FIELD.
     */
    facilityId: Ref<string>
    location: Ref<FacilityLocationValue>
}

type FieldInteractionState = Record<string, boolean | undefined>;
type FieldInteractionRef = Ref<FieldInteractionState>;

interface FacilityValidationError {
    status: '400'
    title: 'Validation Error'
    detail: string
}

interface ConnectMapSelectionOptions {
    fieldHasInteracted: FieldInteractionRef
}

export function useFacilityFormMode(options: UseFacilityFormModeOptions) {
    const { t, locale } = useI18n();
    const reporting = useFacilityReporting({
        selectedFacilityId: options.facilityId,
        location: options.location
    });

    const facilityLabel = computed(() => reporting.singularLabel.value);
    const facilityPlaceholder = computed(() =>
        t('form.facility_placeholder', { label: reporting.singularLabel.value })
    );
    const facilitySearchPlaceholder = computed(() => t('common.search'));
    const facilityPickRequired = computed(() =>
        reporting.isExclusive.value && !reporting.showMapPicker.value
    );
    const submittableFacilityId = computed(() =>
        reporting.facilityUIEnabled.value ? options.facilityId.value : ''
    );

    const markFacilityInteracted = (fieldHasInteracted: FieldInteractionRef) => {
        fieldHasInteracted.value[FACILITY_FORM_FIELD] = true;
    };

    const setFacilityId = (value: string, fieldHasInteracted?: FieldInteractionRef) => {
        options.facilityId.value = value;
        if (fieldHasInteracted) {
            markFacilityInteracted(fieldHasInteracted);
        }
    };

    const canSubmitWithFacility = (baseCanSubmit: boolean) =>
        baseCanSubmit && (!facilityPickRequired.value || !!options.facilityId.value);

    const getFacilityRequiredMessage = () =>
        t('form.facility_required', { label: facilityLabel.value });

    const getFacilityError = (fieldHasInteracted: FieldInteractionRef): ComputedRef<string | undefined> =>
        computed(() =>
            facilityPickRequired.value &&
            fieldHasInteracted.value[FACILITY_FORM_FIELD] &&
            !options.facilityId.value
                ? getFacilityRequiredMessage()
                : undefined
        );

    const getFacilityValidationError = (): FacilityValidationError | null => {
        if (!facilityPickRequired.value || options.facilityId.value) {
            return null;
        }
        return {
            status: '400',
            title: 'Validation Error',
            detail: getFacilityRequiredMessage()
        };
    };

    const getSubmissionFields = (): Partial<Record<typeof FACILITY_FORM_FIELD, string>> => {
        const id = submittableFacilityId.value;
        return id ? { [FACILITY_FORM_FIELD]: id } : {};
    };

    const writeOptionalFacilityLocation = (
        facility: FacilityConfigItem,
        coords?: { lat: string | number, lng: string | number }
    ) => {
        options.location.value = {
            lat: String(coords?.lat ?? facility.lat),
            lng: String(coords?.lng ?? facility.lng),
            address: undefined,
            displayName: formatFacilityAddress(facility.address, locale.value) || facility.label
        };
    };

    const connectMapSelection = ({ fieldHasInteracted }: ConnectMapSelectionOptions) => {
        const facilityMapSelection = useMapFacilitySelection();
        const unsubscribeFacilitySelected = facilityMapSelection.onFacilitySelected((facility) => {
            if (reporting.isExclusive.value) {
                setFacilityId(facility.id, fieldHasInteracted);
            } else if (reporting.isOptional.value) {
                writeOptionalFacilityLocation(facility);
            }
        }, { immediate: true });
        const unsubscribeFacilityLocationPicked = facilityMapSelection.onFacilityLocationPicked(({ facility, lat, lng }) => {
            if (!reporting.isOptional.value) return;
            writeOptionalFacilityLocation(facility, { lat, lng });
        }, { immediate: true });

        onUnmounted(() => {
            unsubscribeFacilitySelected();
            unsubscribeFacilityLocationPicked();
            facilityMapSelection.clearSelection();
        });

        return facilityMapSelection;
    };

    return {
        ...reporting,
        facilityId: options.facilityId,
        submittableFacilityId,
        facilityFieldName: FACILITY_FORM_FIELD,
        draftFieldName: FACILITY_DRAFT_FIELD,
        facilityOptions: reporting.selectOptions,
        facilityLabel,
        facilityPlaceholder,
        facilitySearchPlaceholder,
        facilityPickRequired,
        markFacilityInteracted,
        setFacilityId,
        canSubmitWithFacility,
        getFacilityError,
        getFacilityValidationError,
        getSubmissionFields,
        connectMapSelection
    };
}
