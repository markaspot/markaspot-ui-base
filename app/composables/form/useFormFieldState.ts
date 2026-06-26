// composables/form/useFormFieldState.ts

export const useFormFieldState = () => {
    // Centralized form state
    const formState = reactive({
    // Basic fields
        description: '',
        category: '',
        email: '',
        gdprAccepted: false,

        // Personal fields
        prename: '',
        name: '',
        phone: '',

        // Location and media
        location: { lat: '', lng: '', address: undefined, displayName: '' },
        uploadedMedia: [],

        // Special fields
        objectId: '',
        addData: false,
        party: null,
        oktoberfest: null
    });

    // Field interaction tracking
    const fieldHasInteracted = ref<Record<string, boolean>>({});

    // Get field value by name
    const getFieldValue = (fieldName: string) => {
    // Handle special field name mappings
        switch (fieldName) {
            case 'body':
                return formState.description;
            case 'field_category':
                return formState.category;
            case 'field_e_mail':
                return formState.email;
            case 'field_first_name':
                return formState.prename;
            case 'field_last_name':
                return formState.name;
            case 'field_phone':
                return formState.phone;
            case 'field_gdpr':
                return formState.gdprAccepted;
            case 'field_geolocation':
                return formState.location;
            case 'field_request_media':
                return formState.uploadedMedia;
            case 'field_object_id':
                return formState.objectId;
            case 'field_add_data':
                return formState.addData;
            case 'field_party':
                return formState.party;
            case 'field_oktoberfest':
                return formState.oktoberfest;
            default:
                return undefined;
        }
    };

    // Set field value by name
    const setFieldValue = (fieldName: string, value: unknown) => {
        switch (fieldName) {
            case 'body':
                formState.description = value as string;
                break;
            case 'field_category':
                formState.category = value as string;
                break;
            case 'field_e_mail':
                formState.email = value as string;
                break;
            case 'field_first_name':
                formState.prename = value as string;
                break;
            case 'field_last_name':
                formState.name = value as string;
                break;
            case 'field_phone':
                formState.phone = value as string;
                break;
            case 'field_gdpr':
                formState.gdprAccepted = value as boolean;
                break;
            case 'field_geolocation':
                formState.location = value as typeof formState.location;
                break;
            case 'field_request_media':
                formState.uploadedMedia = value as typeof formState.uploadedMedia;
                break;
            case 'field_object_id':
                formState.objectId = value as string;
                break;
            case 'field_add_data':
                formState.addData = value as boolean;
                break;
            case 'field_party':
                formState.party = value as string;
                break;
            case 'field_oktoberfest':
                formState.oktoberfest = value as string;
                break;
        }
    };

    // Get form data for submission
    const getFormData = () => {
        return {
            title: `Report ${new Date().toISOString()}`,
            body: {
                value: formState.description,
                format: 'plain_text'
            },
            field_category: formState.category,
            field_geolocation: {
                lat: parseFloat(formState.location.lat),
                lng: parseFloat(formState.location.lng)
            },
            field_request_media: formState.uploadedMedia.map((media: { id: string }) => media.id),
            locationAddress: formState.location.address,

            // Conditional fields
            ...(formState.email && { field_e_mail: formState.email }),
            ...(formState.prename && { field_first_name: formState.prename }),
            ...(formState.name && { field_last_name: formState.name }),
            ...(formState.phone && { field_phone: formState.phone }),
            ...(formState.gdprAccepted !== undefined && { field_gdpr: formState.gdprAccepted }),
            ...(formState.objectId && { field_object_id: formState.objectId }),
            ...(formState.addData !== undefined && { field_add_data: formState.addData }),
            ...(formState.party !== null && { field_party: formState.party }),
            ...(formState.oktoberfest !== null && { field_oktoberfest: formState.oktoberfest })
        };
    };

    // Reset form
    const resetForm = () => {
        formState.description = '';
        formState.category = '';
        formState.email = '';
        formState.gdprAccepted = false;
        formState.prename = '';
        formState.name = '';
        formState.phone = '';
        formState.location = { lat: '', lng: '', address: undefined, displayName: '' };
        formState.uploadedMedia = [];
        formState.objectId = '';
        formState.addData = false;
        formState.party = null;
        formState.oktoberfest = null;
        fieldHasInteracted.value = {};
    };

    // Track field interaction
    const markFieldInteracted = (fieldName: string) => {
        fieldHasInteracted.value[fieldName] = true;
    };

    return {
        formState,
        fieldHasInteracted,
        getFieldValue,
        setFieldValue,
        getFormData,
        resetForm,
        markFieldInteracted
    };
};
