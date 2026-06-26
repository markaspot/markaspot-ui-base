// locales/en.ts
export default {
    locale: {
        code: 'en-US'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    // CAP (Common Alerting Protocol) hazard severity levels and categories
    // https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html
    hazard: {
        levels: {
            unknown: 'Unknown',
            minor: 'Minor',
            moderate: 'Moderate',
            severe: 'Severe',
            extreme: 'Extreme'
        },
        categories: {
            Infra: 'Infrastructure',
            Transport: 'Transportation',
            Safety: 'Public Safety',
            Env: 'Environmental',
            Fire: 'Fire',
            Health: 'Health',
            Geo: 'Geophysical',
            Met: 'Meteorological',
            Other: 'Other'
        }
    },
    // AI-detected sentiment from service request descriptions
    sentiment: {
        frustrated: 'Frustrated',
        neutral: 'Neutral',
        positive: 'Positive'
    },
    nav: {
        map: 'Map',
        dashboard: 'Dashboard',
        back_to_frontend: 'Back to Map'
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome, {name}',
        nav: {
            dashboard: 'Dashboard',
            requests: 'Requests',
            metrics: 'Metrics',
            settings: 'Settings',
            categories: 'Categories',
            status: 'Status',
            jurisdictions: 'Jurisdictions',
            languages: 'Languages',
            billing: 'Billing'
        },
        help: {
            docs: 'Documentation',
            support: 'Contact Support'
        },
        settings: {
            languages_title: 'Language Settings',
            languages_description: 'Configure which languages are available and which language is shown by default for visitors of this workspace.',
            languages_available: 'Available Languages',
            languages_default: 'Default Language',
            languages_saved: 'Language settings saved.',
            languages_min_one: 'At least one language must be selected.'
        },
        user: {
            profile: 'Profile',
            logout: 'Logout'
        },
        jurisdiction: {
            current: 'Workspace',
            citizenView: 'Citizen View',
            switchTo: 'Switch to',
            blocked: 'blocked',
            admin_section_header: 'All workspaces (admin access)'
        },
        stats: {
            total: 'Total Requests',
            pending: 'Pending',
            in_progress: 'In Progress',
            resolved: 'Resolved',
            my_groups: 'My Groups',
            overall: 'Overall'
        },
        recent_requests: 'Recent Requests',
        view_all: 'View All',
        no_recent: 'No recent requests',
        wms: {
            title: 'Map Layers',
            attribution: 'Data: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Media',
                category: 'Category',
                status: 'Status',
                created: 'Created'
            }
        }
    },
    form: {
        // Form field labels
        body: 'Description',
        body_description: 'Please provide a detailed description',
        body_placeholder: 'Enter a description...',
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...',

        category: 'Category',
        category_description: 'Select the appropriate category for your report',
        category_placeholder: 'Select a category',
        category_disabled: {
            title: 'Category Selected',
            description: 'You have selected the "{category}" category. This category has special requirements or does not allow further form editing.'
        },
        category_empty: 'No categories available',
        category_loading: 'Loading categories...',
        category_disabled_notice: 'This category is for information only. Submissions are not possible.',
        category_description_loading: 'Loading description...',
        category_description_error: 'Error loading description',

        email: 'Email',
        email_description: 'Your contact email',
        email_placeholder: 'Enter your email address',

        first_name: 'First Name',
        first_name_description: 'Your first name',
        first_name_placeholder: 'Enter your first name',

        last_name: 'Last Name',
        last_name_description: 'Your last name',
        last_name_placeholder: 'Enter your last name',

        gdpr: 'Data Protection Agreement',
        gdpr_description: 'I agree with the processing of my data as described in the privacy policy.',

        object_id: 'Object ID',
        object_id_description: 'Identifier for the reported object',
        object_id_placeholder: 'Enter object ID (e.g., pole number)',

        phone: 'Phone Number',
        phone_description: 'Your contact phone number',
        phone_placeholder: 'Enter your phone number',

        // Facility-based reporting (operator can override label via jurisdiction config)
        facility: 'Facility',
        facility_plural: 'Facilities',
        facility_placeholder: 'Select {label}',
        facility_required: '{label} is required.',
        facility_unavailable: 'Selected facility is no longer available, please pick again.',
        facility_nearest_snapped: 'Nearest facility: {label}',
        facility_no_nearby: 'No facility nearby, please select manually.',
        facility_use_my_location: 'Use my location',
        facility_locating: 'Locating…',
        facility_no_match: 'No facility matches your search.',
        facility_opens_in_new_tab: '(opens in new tab)',
        facility_deselected_map_pick: 'Using your own location instead of {label}',
        // Optional facility mode: citizen form auto-tags the nearest facility
        // when the picked position lies within snap radius.
        facility_tagged_with: 'At: {label}',

        // Imagelist
        imagelist: {
            empty: 'No images available for this type.'
        },

        // Form-first mode
        back_to_report: 'Back to report form',

        // Form requirements indicator
        requirements: {
            title: 'Still required',
            ready_to_submit: 'Ready to submit',
            photo: 'Upload a photo',
            category: 'Select a category',
            location: 'Provide location',
            description: 'Enter a description',
            email: 'Provide email address',
            privacy: 'Accept privacy policy',
            privacyBlock: 'Replace or remove the privacy-sensitive photo',
            conditional: 'depending on category'
        }
    },
    validation: {
        // Validation error messages
        body_required: 'Description is required',
        category_required: 'Category is required',
        email_required: 'Email is required',
        email_format: 'Invalid email format',
        first_name_required: 'First name is required',
        last_name_required: 'Last name is required',
        gdpr_required: 'You must agree to the data protection terms',
        object_id_required: 'Object ID is required',
        phone_required: 'Phone number is required',
        required_field: '{field} is required'
    },
    feedback: {
        page_title: 'Service Request Feedback',
        error_title: 'Loading Error',
        invalid_request: 'Invalid or expired service request',
        thank_you: 'Thank you for your feedback!',
        submission_received: 'Your feedback has been received successfully',
        loading: 'Loading service request...',
        title: 'Feedback for: {service}',
        description: 'Please provide your feedback',
        placeholder: 'Enter your feedback here...',
        reopen_request: 'I would like this service request to be reopened',
        submitting: 'Submitting...',
        sending: 'Sending...',
        submit: 'Submit Feedback',
        existing_title: 'Your feedback for: {service}',
        already_submitted: 'You have already submitted feedback for this service request',
        missing_uuid: 'Missing service ID',
        success_notification: 'Feedback successfully submitted',
        success_with_id: 'Feedback successfully submitted for request #{id}',
        updated_successfully: 'Feedback updated successfully',
        added_to_list: 'The service request has been added to your list',
        submission_error: 'Failed to submit feedback',
        server_error: 'Server error: The feedback could not be processed at this time',
        submission_failed: 'Failed to submit feedback. Please try again later',
        already_exists: 'Feedback already exists for this service request',
        error_fetching_request: 'Error loading the service request details',
        no_content: 'No feedback content',
        refresh_complete: 'Request list refreshed',
        try_again: 'Try again',
        format_unrecognized: 'Service request format unrecognized',
        processing_error: 'Error processing service request data',
        your_feedback: 'Your Feedback',
        contact_preference: 'Contact Preference',
        no_contact: 'No Contact',
        email_contact: 'Contact by Email',
        email_placeholder: 'Your email address',
        set_status_open: 'Set Status to open',
        set_status_open_description: 'In case you want us to look after this again, you can re-open this service-request.',
        email_verification: 'Email Verification',
        email_verification_placeholder: 'Email address from the original report',
        email_verification_description: 'Enter the email address you used when creating the original report.',
        email_mismatch: 'The entered email address does not match the original report.',
        unauthorized_access: 'Unauthorized access. Please check your email address.',
        not_eligible: 'This service request is not currently eligible for feedback',
        dialog_description: 'Feedback form dialog',
        service_provider: {
            // Page and modal titles
            page_title: 'Service Provider Response',
            page_description: 'Submit completion notes for assigned service requests',
            modal_title: 'Service Provider Response',
            dialog_description: 'Service provider response form dialog',

            // Form fields
            title: 'Complete Assignment',
            your_email: 'Your Email Address',
            email_placeholder: 'provider{\'@\'}example.com',
            email_verification_note: 'Enter your service provider email address for verification',
            completion_notes: 'Completion Notes',
            notes_placeholder: 'Describe the work that has been completed...',
            mark_as_completed: 'Mark as Completed',
            mark_as_completed_description: 'Set the request status to completed',
            mark_completed_description: 'Confirm that the work has been completed',

            // Buttons
            submit_completion: 'Submit Completion',
            complete_request: 'Complete Assignment',
            completing: 'Submitting...',

            // Success and error messages
            completion_success: 'Service request completion submitted successfully',
            submission_failed: 'Failed to submit completion. Please try again later',
            server_error: 'Server error: The completion could not be processed at this time',
            completion_not_allowed: 'This request cannot be completed at this time',
            email_verification_failed: 'Email verification failed. Please check your email address',
            already_completed: 'This request has already been completed',

            // Loading and validation
            loading: 'Loading service request...',
            try_again: 'Try again',
            invalid_uuid: 'Invalid or expired service request',
            load_error: 'Error loading service request details',
            error_fetching_request: 'Error loading the service request details',
            completion_notes_required: 'Please provide completion notes',

            // Multiple completions
            existing_completions: 'Previous Completions',
            reassignment_note: 'This request has been marked for reassignment and can receive multiple completions'
        }
    },
    service_provider: {
        page_title: 'Service Provider Response',
        page_description: 'Submit completion notes for assigned service requests',
        modal_title: 'Service Provider Response',
        dialog_description: 'Service provider response form dialog',
        title: 'Complete Assignment',
        your_email: 'Your Email Address',
        email_placeholder: 'provider{\'@\'}example.com',
        email_verification_note: 'Enter your service provider email address for verification',
        completion_notes: 'Completion Notes',
        notes_placeholder: 'Describe the work that has been completed...',
        mark_as_completed: 'Mark as Completed',
        mark_as_completed_description: 'Set the request status to completed',
        submit_completion: 'Submit Completion',
        complete_request: 'Complete Assignment',
        completing: 'Submitting...',
        completion_success: 'Service request completion submitted successfully',
        submission_failed: 'Failed to submit completion. Please try again later',
        server_error: 'Server error: The completion could not be processed at this time',
        completion_not_allowed: 'This request cannot be completed at this time',
        email_verification_failed: 'Email verification failed. Please check your email address',
        already_completed: 'This request has already been completed',
        loading: 'Loading service request...',
        try_again: 'Try again',
        invalid_uuid: 'Invalid or expired service request',
        load_error: 'Error loading service request details',
        error_fetching_request: 'Error loading the service request details',
        completion_notes_required: 'Please provide completion notes',
        existing_completions: 'Previous Completions',
        reassignment_note: 'This request has been marked for reassignment and can receive multiple completions'
    },
    contact: {
        title: 'Contact',
        dialog_description: 'Contact form',
        name: 'Name',
        name_placeholder: 'Your name',
        email: 'Email',
        email_placeholder: 'Your email address',
        message: 'Message',
        message_placeholder: 'Your message...',
        copy_label: 'Send a copy to my email address',
        gdpr_label: 'I agree to the processing of my data',
        gdpr_required: 'Please agree to the data processing',
        submit: 'Send message',
        sending: 'Sending...',
        success_title: 'Message sent',
        success_message: 'Thank you for your message. We will get back to you as soon as possible.',
        submission_failed: 'Message could not be sent. Please try again later.',
        flood_error: 'Too many requests. Please try again later.',
        required_field: '{field} is required',
        invalid_email: 'Please enter a valid email address',
        close: 'Close',
        new_message: 'New message'
    },
    service_unavailable: {
        title: 'Service Temporarily Unavailable',
        message: 'We are unable to connect to our services right now. This is likely a temporary issue.',
        retry: 'We are experiencing technical difficulties. Please try again in {seconds} seconds.',
        auto_retry: 'Retrying in {seconds} seconds...',
        retry_now: 'Try now',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Your report. Our solution.'
    },
    hiddenSection: {
        description:
          'Our issue reporter is a reporting system for infrastructure problems. You can proceed directly with reporting issues or navigate to the following:',
        main_navigation:
          'Main navigation with information, a list of reports and statistics',
        map:
          'Interactive map with visual markers',
        map_navigation_hint:
          'Use ⬆️⬇️⬅️➡️ arrow keys to navigate between report markers, ↩️ Enter to select, ❌ Escape to clear selection',
        action_button:
          'Report directly',
        keyboard_navigation_hint: 'Use arrow keys to navigate, Enter to activate',
        skip_to_main_content: 'Skip to main content'
    },
    accessibility: {
        skip_to_main: 'Skip to main content',
        skip_to_map: 'Skip to map',
        skip_to_navigation: 'Skip to navigation',
        skip_to_form: 'Report directly',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'Back',
        not_classified: 'Not classified',
        no_value: 'No value',
        close: 'Close',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        submit: 'Submit',
        cancel: 'Cancel',
        required: 'Required',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        clear: 'Clear',
        search: 'Search',
        select: 'Select',
        on: 'On',
        off: 'Off',
        toggle: 'Toggle',
        yesterday: 'Yesterday',
        did_you_know: 'Did you know?',
        show_more: 'Show more',
        show_less: 'Show less',
        learn_more: 'Learn more',
        learn_more_about: 'Learn more about {topic}',
        opens_in_new_tab: '(opens in new tab)',
        title: {
            classic: 'Classic Report',
            photo: 'Photo Report'
        },
        buttons: {
            toggle_theme: 'Toggle theme',
            attribution: 'Map attribution',
            close: 'Close'
        },
        navigation: 'Navigation drawer',
        drawer_description: 'Content and options panel',
        resize_drawer: 'Resize panel',
        drawer_position_n_of_total: 'position {idx} of {total}',
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps',
        current: 'Current'
    },
    fields: {
        field_geolocation: 'Location',
        field_gdpr: 'Data Processing Consent',
        field_e_mail: 'Email',
        field_category: 'Category',
        field_request_media: 'Photos',
        field_name: 'Last Name',
        field_prename: 'First Name',
        field_first_name: 'First Name',
        field_first_name_placeholder: 'Please enter first name',
        field_last_name: 'Last Name',
        field_last_name_placeholder: 'Please enter last name',
        field_phone: 'Phone',
        body: 'Description',
        field_add_data: 'Contest Participation',
        field_terms_of_use: 'I accept the terms and conditions and privacy policy.',
        field_address: 'Address',
        postal_code: 'Postal Code',
        postal_code_placeholder: 'e.g. 10001',
        city: 'City',
        city_placeholder: 'e.g. New York',
        street_address: 'Street Address',
        street_address_placeholder: 'e.g. Main Street 123'
    },
    competition: {
        intro: 'If you wish, participate in our annual drawing. You have the chance to win attractive prizes and cash rewards that we distribute among all participants as a small thank you.',
        disclaimer: 'Employees of the responsible departments are excluded from participation.',
        title: 'Contest Participation',
        errors: {
            already_exists: 'Contest entry already exists',
            duplicate_found: 'Duplicate found',
            duplicate_detail: 'A contest entry has already been created for this report.',
            not_found: 'Report not found',
            not_found_detail: 'The associated report could not be found.',
            save_failed: 'Contest entry could not be saved',
            submission_error: 'Submission error',
            submission_error_detail: 'Your contest entry could not be saved, but your report was successfully submitted.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Information tab',
                panel_label: 'Information panel'
            },
            list: {
                label: 'List',
                aria_label: 'Reports list tab',
                panel_label: 'Reports list panel'
            },
            following: {
                label: 'Following',
                aria_label: 'Following reports tab',
                panel_label: 'Following reports panel'
            },
            stats: {
                label: 'Statistics',
                aria_label: 'Statistics tab',
                panel_label: 'Statistics panel'
            }
        },
        main: 'Main navigation',
        pages: 'Page navigation',
        browse_reports: 'Browse Reports',
        back_to_form: 'Back to Form',
        panel: {
            scrollable: 'Scrollable area'
        },
        updates_count: '{count} new updates'
    },
    report: {
        form_types: 'Report types',
        how_to_help: 'How to create a report',
        title: {
            photo: 'Photo Report',
            classic: 'Classic Report',
            submit: 'Submit Report',
            edit: 'Edit Report',
            view: 'View Report'
        },
        photo: {
            description: 'Create a new report with a photo'
        },
        classic: {
            description: 'Create a new report without a photo'
        },
        status: {
            new: 'New',
            open: 'Open',
            in_progress: 'In Progress',
            resolved: 'Resolved',
            closed: 'Closed',
            unknown: 'Unknown Status'
        },
        form: {
            modal_description: 'Create a new report',
            tabs: {
                photo: 'With Photo',
                classic: 'Classic'
            },
            description: {
                label: 'Description',
                placeholder: 'Please describe the issue...',
                ai_processing: 'AI is generating a description...',
                help: 'Provide as much detail as possible'
            },
            category: {
                label: 'Category',
                placeholder: 'Select a category',
                loading: 'Loading categories...',
                error: 'Error loading categories',
                empty: 'No categories available',
                help: 'Category selection (done automatically)',
                description: 'Category Description',
                description_loading: 'Loading description...',
                description_error: 'Error loading description',
                disabled_notice: 'This category is for information only. Submissions are not possible.'
            },
            location: {
                label: 'Location',
                placeholder: 'Search for a location...',
                selected: 'Location selected',
                clear: 'Clear location',
                error: 'Error getting location',
                help: 'Enter an address or click on the map',
                help_modal: 'Enter an address, or use your current location',
                current: 'Use current location',
                searching: 'Searching...',
                pick_on_map: 'Pick on map',
                auto_detected: 'Location detected',
                complete_address: 'Complete address',
                from_photo_exif: 'Location automatically extracted from photo metadata',
                warning: 'Location warning',
                unknown_location: 'Unknown location',
                suggestions: 'Location suggestions'
            },
            email: {
                label: 'Email for Updates',
                placeholder: 'Enter your email address',
                help: 'We\'ll send you updates about your report',
                subscribe: 'Subscribe to updates'
            },
            gdpr: {
                label: 'Data Processing Consent',
                description:
          'I agree to the processing of my data according to the privacy policy.',
                required: 'You must agree to continue',
                link: 'View Privacy Policy'
            },
            media: {
                label: 'Photos',
                required: 'A photo is required for this category',
                upload: {
                    overall_progress: 'Overall Progress',
                    button: 'Click to upload',
                    or: ' or',
                    drag: 'drag and drop',
                    drop_here: 'Drop files here to upload',
                    restrictions: 'Up to {count} images ({size} max., {types})',
                    restrictions_single: 'One image ({size} max., {types})',
                    progress: 'Upload progress',
                    started_sr: 'Upload started',
                    progress_sr: 'Upload {progress}% complete',
                    success_sr: 'Upload completed successfully',
                    error_sr: 'Upload failed: {error}',
                    files_selected_sr: '{count} file(s) selected for upload',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.',
                    area_label: 'Upload photo area - click to select files or drag and drop',
                    in_progress: 'Upload in progress',
                    complete_sr: 'File has been uploaded successfully.'
                },
                preview: 'Image preview',
                remove: 'Remove image',
                no_image_available: 'No image available or not displayed for legal reasons',
                progress: 'Upload progress: {progress}%',
                limit_reached: 'Maximum number of {count} images reached',
                privacy_notice: 'No people/license plates in photos please',
                offline_cached: 'Saved offline',
                ai_analysis: 'Analysis via Azure AI (Germany)',
                ai_analysis_help: 'Information about AI analysis',
                ai_analysis_tooltip: 'By uploading you confirm that the photo was taken legally and does not violate third party rights.\n\nIf people or license plates are recognizable, please make them unrecognizable before upload.\n\nThe analysis serves exclusively to categorize your report. Only a reduced, EXIF-free copy is transmitted to Azure OpenAI (Germany); the original is not sent to the service.'
            },
            submit: {
                button: 'Submit Report',
                submitting: 'Submitting...',
                processing: 'Processing...',
                success: 'Report submitted successfully',
                error: 'Error submitting report',
                loading: 'Loading form...'
            },
            loading: 'Loading report form...',
            draft_saved: 'Draft saved'
        },
        ai: {
            label: 'AI',
            powered: 'AI-Powered',
            analyzing: 'AI is analyzing your photos...',
            started_sr: 'AI analysis started',
            complete_sr: 'AI analysis completed successfully',
            field_updated_sr: '{field} has been updated with: {value}',
            analysis_complete_sr: 'AI analysis complete.',
            category_result_sr: 'Category selected: {category}.',
            description_result_sr: 'Description generated: {description}',
            location_result_sr: 'Location found: {location}.',
            category_hint: 'This photo doesn\'t seem to match our report categories. Please choose a category yourself.',
            processing: {
                analyzing: 'Asking the AI...',
                location: 'Checking image metadata...',
                location_found: 'Location found:',
                location_ai: 'Finding location in image...',
                location_not_found: 'Location not found in image metadata.',
                location_complete: 'Location identified',
                category: 'Identifying category...',
                category_found: 'Category identified:',
                category_not_matched: 'Category suggested by AI (needs selection)',
                description: 'Generating description...',
                description_complete: 'Description generated',
                attributes_filled: '{count} additional field(s) pre-filled',
                complete: 'AI analysis complete',
                error: 'Error during AI analysis',
                privacy_warning: 'Privacy concern detected'
            },
            privacy: {
                title: 'Privacy notice',
                description: 'Personal data may have been detected in your photo ({issues}). The photo will be reviewed before publication.',
                required: 'Privacy-sensitive content was detected in this photo and automatic blurring is not available. The photo cannot be used. Please replace it or remove it to continue.',
                removePhoto: 'Remove photo',
                replace: 'Replace photo',
                understood: 'Continue with this photo'
            },
            failed: {
                title: 'Image analysis unavailable',
                description: 'Your photo will be manually reviewed before publication. You can still submit your report.'
            },
            budget_exhausted_title: 'AI analysis skipped',
            budget_exhausted_submitted: 'AI analysis budget for this month has been reached. Your report was submitted successfully.'
        },
        buttons: {
            photo: 'Photo Report',
            classic: 'Classic Report',
            follow: 'Follow Report',
            following: 'Following',
            share: 'Share Report',
            print: 'Print',
            flag: 'Flag',
            flag_submitted: 'Already flagged',
            copy_link: 'Copy link',
            link_copied: 'Link copied to clipboard',
            email: 'Email',
            directions: 'Get Directions'
        },
        following: {
            count: 'Following {count} report(s)',
            mark_all_read: 'Mark all as read',
            no_reports: 'No followed reports yet',
            no_address: 'No address available',
            status_updated: 'Status updated',
            status_changed: 'Status changed to:',
            awaiting_server: 'Awaiting update',
            escalated_to: 'Forwarded to {jurisdiction}',
            escalated_click: 'Tap to open in new jurisdiction',
            unavailable: 'This report is currently not available. Please check your email for details or contact us.',
            date: {
                today: 'Today',
                tomorrow: 'Tomorrow',
                yesterday: 'Yesterday',
                unknown: 'Unknown date'
            }
        }
    },
    map: {
        tap_to_load: 'Tap to show map',
        tap_to_select_location: 'Tap on map to select location',
        loading: 'Loading map...',
        loading_address: 'Loading address...',
        retry_attempt: 'Attempt {count}',
        confirm_location: 'Confirm location',
        add_report_here: 'Add report here',
        controls: {
            zoom: 'Zoom controls',
            zoom_in: 'Zoom in',
            zoom_out: 'Zoom out',
            find_location: 'Find my location',
            toggle_heatmap: 'Toggle heatmap',
            toggle_language: 'Change language',
            add_report_here: 'Report here',
            adjust_tilt: 'Adjust tilt',
            degrees: '{count} degrees',
            layers: 'Map layers',
            no_layers: 'No layers available',
            geolocation: {
                label: 'Get current location'
            }
        },
        pick: {
            drag_hint: 'Drag marker to adjust position'
        },
        tooltip: {
            label: 'Map marker information',
            opens_form_above: 'Opens form above',
            opens_modal: 'Opens in dialog'
        },
        keyboard: {
            canvasInstructions: 'Interactive map with report markers. Arrow keys navigate between markers, Shift+Arrow keys pan map to explore, Enter to select. Press Ctrl+= to zoom in, Ctrl+- to zoom out.',
            noFeatures: 'No features visible in current map view. Try zooming in or panning to find markers.',
            zoomedIntoCluster: 'Zoomed into cluster area. Use arrow keys to navigate markers.',
            clusterFocused: 'Focused on cluster with {count} reports. Press Enter to expand. {position}',
            clusterExpanded: 'Cluster expanded into {count} reports. {featureLabel}',
            markerFocused: 'Focused on report: {name} at {address}{context}. Press Enter to open details. {position}',
            expandedContext: ' (expanded from cluster)',
            untitledReport: 'Untitled report',
            unknownLocation: 'location',
            featurePosition: 'Feature {current} of {total}.',
            pannedToExplore: 'Panned map {direction} to explore. Release Shift and use arrow keys to navigate markers.',
            pannedNoMarkers: 'Panned map {direction}. No markers found in this direction - use arrow keys to continue exploring.'
        }
    },
    detail: {
        dialog_description: 'View report details',
        location: 'Location',
        photos: 'Photos',
        description: 'Description',
        status_history: 'Status History',
        updates: 'Updates',
        no_updates: 'No updates yet',
        edit: 'Edit',
        follow: {
            button: 'Follow',
            following: 'Following',
            stop: 'Stop following',
            success: 'You\'re now following this report',
            error: 'Error following report',
            updating: 'Updating...'
        },
        unavailable: {
            title: 'Report not available',
            message: 'This report does not exist or has not been published yet. Newly submitted reports can take a while before they appear.'
        }
    },
    pages: {
        dialog_description: 'View page content'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Distribution',
        total_reports: 'Total Reports',
        status_distribution: 'Status Distribution',
        category_distribution: 'Category Distribution',
        uncategorized: 'Uncategorized',
        showing_reports: 'Showing {visible} of {total} reports',
        no_reports: 'No reports available',
        open_reports: 'Open Reports',
        closed_reports: 'Closed Reports',
        no_data_available: 'No data available',
        expand: 'Show details',
        collapse: 'Hide details',
        subcategory: 'subcategory',
        subcategories: 'subcategories'
    },
    time: {
        days_ago: '{count} days ago',
        just_now: 'Just now',
        minutes_ago: '{count} minutes ago',
        hours_ago: '{count} hours ago',
        yesterday: 'Yesterday',
        today: 'Today'
    },
    list: {
        showing: 'Showing {visible} of {total} reports',
        showing_in_area: 'Showing {visible} in this area, {total} total',
        showing_area_only: 'Showing {visible} in this area',
        no_results: 'No reports found',
        no_filtered_results: 'No reports match your filter criteria',
        load_more: 'All reports loaded',
        load_more_button: 'Load more',
        newest_first: 'Newest first',
        oldest_first: 'Oldest first',
        refresh: 'Refresh',
        status_update: 'Status updated',
        location: 'Location',
        unpublished: 'Unpublished',
        editable: 'Editable'
    },
    error: {
        form_error_fallback: 'An error occurred while loading the form. Please try again.',
        404: {
            title: 'Page not found',
            description: 'The page you\'re looking for doesn\'t exist or has been moved.'
        },
        403: {
            title: 'Access denied',
            description: 'You don\'t have permission to view this page.'
        },
        500: {
            title: 'Something went wrong',
            description: 'An unexpected error occurred. Please try again.'
        },
        fallback: {
            title: 'Error',
            description: 'An unexpected error occurred.'
        },
        actions: {
            back: 'Go back',
            home: 'Back to home',
            retry: 'Try again'
        }
    },
    errors: {
        general: 'Something went wrong',
        search_failed: 'Search failed. Please try again.',
        api: {
            rate_limit: 'Too many requests. Please wait a moment and try again.',
            unauthorized: 'Not authorized. Please sign in again.',
            forbidden: 'Access denied.',
            not_found: 'Resource not found.',
            server_error: 'Server error. Please try again later.',
            default: 'API Error: {status}'
        },
        upload_failed: 'Upload failed',
        location_error: 'Unable to determine location',
        network_error: 'Network error',
        geolocation: {
            title: 'Location Error',
            permission_denied: 'Location permission denied. Please allow access in your browser settings.',
            unavailable: 'Location information is currently unavailable.',
            timeout: 'Location request timed out.',
            unknown: 'An unknown location error occurred.'
        },
        try_again: 'Please try again',
        validation: {
            title: 'Sorry, we cannot process this request:',
            location_error_title: 'Location Error',
            invalid_input: 'Invalid Input',
            duplicate_title: 'Duplicate Found',
            duplicate_found: 'Similar report found',
            duplicate_report: 'A similar report has already been created (No. {reportId})',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway',
            location_out_of_bounds: 'The selected location is outside our jurisdiction',
            required_field: '{field} is required',
            required_fields: 'Please fill in all required fields',
            please_review: 'Please review the form and correct any errors before submitting.',
            file_size: 'The selected file is too large (max. 10 MB)',
            file_type: 'The format is not supported (allowed: jpg, png, webp)',
            media_upload: 'Error uploading image',
            invalid_format: 'Invalid format for {field}',
            photo_required: 'A photo is required for this category',
            consent_required: 'Please accept the privacy policy'
        },
        rate_limit: {
            title: 'Rate Limit Exceeded',
            general: 'Please try again later.',
            with_time: 'Please try again in {seconds} seconds.'
        },
        network: 'Connection problem. Please check your internet connection',
        timeout: 'Timeout. Please try again',
        upload: {
            title: 'Upload Error',
            invalid_type: 'Invalid file type. Please upload images only.',
            file_too_large: 'File too large. Maximum size is {size}.',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.',
            dimensions_too_large: 'Image dimensions too large. Maximum {width}x{height} pixels.',
            invalid_image: 'Invalid or corrupted image file.',
            failed: 'Upload failed. Please try again.',
            limit_reached: 'Maximum number of {count} files reached.',
            remove_to_add: 'Remove a photo to add a new one',
            single_file_limit: 'Only one image can be uploaded.',
            exact_file_limit: 'Maximum of {count} images can be uploaded.'
        },
        submission_error: 'Error submitting or uploading the image.',
        unknown: 'An unknown error occurred.',
        pending_uploads: 'Please wait until all uploads are complete.',
        incomplete_form: 'Please fill out all required fields.',
        page: {
            title: 'Error',
            not_found_title: 'Page not found',
            not_found_message: 'Sorry, the page you are looking for does not exist.',
            server_error_title: 'Server error',
            server_error_message: 'Sorry, something went wrong on our server.',
            generic_title: 'Error occurred',
            generic_message: 'An unexpected error has occurred.',
            action_home: 'Return to home',
            action_back: 'Go back',
            action_retry: 'Try again',
            details: 'Error details'
        }
    },
    success: {
        report_submitted: 'Report submitted',
        report_submitted_description: 'Your report has been successfully submitted and will be reviewed shortly.',
        moderation_notice:
      'Your report will be reviewed before publishing. Your reference number:',
        submit_another: 'Submit another report',
        auto_followed: 'This report has been automatically added to your followed reports',
        visibility_limitation_notice: 'Please note that not all reports become publicly visible through the website. If your report doesn\'t update in the followed reports list, it may still have been processed by the city. Check your email for status updates.',
        fun_facts: [
            '🌱 Every report you submit helps make your city a better place to live!',
            '🏙️ Citizen reports have helped fix over 10,000 issues in cities worldwide.',
            '⚡ The average report gets reviewed within 24 hours.',
            '🤝 You\'re part of a community that cares about public spaces!',
            '📊 Data from citizen reports helps city planners make better decisions.',
            '🔄 Following your reports keeps you updated on progress automatically.',
            '🎯 Photo reports are processed 3x faster than text-only reports.',
            '🌍 Citizen engagement platforms like this exist in over 50 countries.',
            '💡 Your feedback helps prioritize which issues get fixed first.',
            '🚀 Digital reporting has reduced response times by up to 60%.',
            '🏆 Active citizens make stronger, more resilient communities.',
            '🔍 AI analysis helps categorize your reports more accurately.',
            '📱 Mobile reporting makes it easy to report issues as you see them.',
            '⭐ Thank you for being an engaged citizen!'
        ]
    },
    flag: {
        title: 'Flag this report',
        description: 'Help us maintain quality by reporting inappropriate content.',
        reason_label: 'Why are you flagging this report?',
        reason_spam: 'Spam or advertising',
        reason_offensive: 'Offensive or inappropriate content',
        reason_personal: 'Contains personal data',
        reason_location: 'Wrong location',
        reason_other: 'Other',
        details_label: 'Additional details',
        details_placeholder: 'Please describe the issue...',
        details_required: 'Please provide details',
        submit: 'Submit',
        success: 'Thank you. We will review this report.',
        error: 'Could not submit. Please try again.',
        already_flagged: 'You have already flagged this report.'
    },
    pwa: {
        install: {
            title: 'Install App',
            button: 'Install',
            not_now: 'Not Now',
            description:
        'Click the installation icon in your browser\'s address bar to install this app.',
            share_button: 'Share icon',
            open_safari: 'Safari browser',
            ios: {
                title: 'Add to Home Screen',
                safari_instructions:
          'Tap the {icon} and select "Add to Home Screen".',
                other_instructions:
          'Please open this site in {browser} to install.'
            },
            chrome: {
                instructions:
          'Click the install icon {icon} in the toolbar to install this app.'
            },
            edge: {
                instructions:
          'Click the install icon {icon} in the address bar.'
            },
            firefox: {
                instructions:
          'Click the home icon {icon} in the address bar.'
            }
        }
    },
    boundaries: {
        loading: 'Loading boundary data...',
        error: 'Unable to validate location boundaries. Please try again later.',
        notLoaded: 'Boundaries not loaded yet',
        outsideNonStrict: 'Note: Selected location is outside {locationName} boundaries.',
        outsideStrict: 'Selected location is outside {locationName} boundaries. Please select a location within the city limits.',
        validationUnavailable: 'Boundary validation unavailable. Your report will be accepted but may be reviewed.'
    },
    filters: {
        title: 'Filters',
        status: {
            title: 'Status'
        },
        time: {
            title: 'Time',
            today: 'Today',
            week: 'This Week',
            month: 'This Month'
        },
        category: {
            title: 'Category',
            other: 'Other'
        },
        actions: {
            more: 'More Filters',
            expand: 'More Filters',
            collapse: 'Less',
            clear_all: 'Clear All',
            active_count: '{count} filters active',
            toggle: 'Filters'
        }
    },
    privacy: {
        notice_text: 'Information about privacy can be found',
        notice_link_text: 'here',
        modal: {
            title: 'Privacy Policy',
            loading: 'Loading privacy information...',
            retry: 'Retry',
            noContent: 'No privacy information available.',
            lastUpdated: 'Last updated',
            close: 'Close'
        }
    },
    search: {
        placeholder: 'Search reports...',
        no_results_local: 'No results found in current view',
        expand_to_server: 'Search all reports',
        expand_hint: 'Search beyond current view',
        searching_server: 'Searching all reports...'
    },
    info: {
        welcome: {
            heading: 'Welcome to {name}',
            headingGeneric: 'Welcome',
            body: 'Use this map to report issues or find out about existing reports in your area.'
        },
        shortcuts: {
            aria_label: 'Quick actions',
            photo: {
                title: 'Photo',
                description: 'Take a photo, AI will do the rest',
                aria_label: 'Create a photo report'
            },
            classic: {
                title: 'Classic',
                description: 'Describe and locate the problem',
                aria_label: 'Create a classic report'
            },
            following: {
                title: 'Follow',
                description: 'Stay informed about the progress',
                aria_label: 'Open followed reports'
            },
            list: {
                title: 'Explore',
                description: 'See what is happening near you',
                aria_label: 'Explore the map and view the list'
            }
        }
    },
    auth: {
        login: {
            title: 'Sign In',
            subtitle: 'Enter your email to receive a verification code',
            email_label: 'Email Address',
            email_hint: 'We will send you a 6-digit code',
            email_placeholder: 'email address',
            send_code: 'Send Verification Code',
            disabled: {
                title: 'Sign in is not available',
                message: 'Passwordless sign-in is not enabled here. Please contact the administrator if you need access.',
                back_button: 'Back to home'
            }
        },
        verify: {
            email_label: 'Email Address',
            code_label: 'Verification Code',
            code_hint: 'Enter the 6-digit code from your email',
            code_placeholder: '123456',
            verify_button: 'Verify & Sign In',
            back_button: 'Use Different Email',
            request_new: 'Request New Code',
            resend_code: 'Resend Code',
            expires_in: 'Code expires in {time}',
            expired_title: 'Code Expired',
            expired_message: 'Your verification code has expired. Please request a new one.'
        },
        code_sent: {
            title: 'Code Sent',
            message: 'We sent a 6-digit verification code to {email}'
        },
        error: {
            title: 'Authentication Error',
            request_failed: 'Failed to send verification code. Please try again.',
            verify_failed: 'Invalid or expired verification code',
            sso_failed: 'Sign-in failed. Please try again.',
            network: 'Network error. Please check your connection.',
            logout_failed: 'Failed to log out. Please try again.'
        },
        sso: {
            completing: 'Completing sign-in...',
            method_label: 'Single sign-on',
            button_aria: 'Sign in with {provider} using single sign-on'
        },
        user: {
            logged_in_as: 'Signed in as',
            logout: 'Sign Out'
        },
        welcome: {
            greeting: 'Hello, {name}',
            sign_in: 'Sign in',
            sign_out: 'Sign Out',
            user_avatar: 'User avatar'
        }
    },
    profile: {
        title: 'Profile',
        account: {
            title: 'Account',
            roles: 'Roles'
        },
        groups: {
            title: 'Groups'
        },
        appearance: {
            title: 'Appearance',
            color_mode: 'Color Mode',
            light: 'Light',
            dark: 'Dark',
            system: 'System',
            theme_override: 'Custom Theme Colors',
            theme_override_description: 'Override the default jurisdiction theme with your own color preferences',
            primary_color: 'Primary Color',
            secondary_color: 'Secondary Color',
            neutral_color: 'Neutral Color',
            reset_theme: 'Reset to Default'
        },
        language: {
            title: 'Language',
            select: 'Select Language',
            save_failed: 'Could not save your language preference. Please try again.'
        }
    },
    offline: {
        banner: {
            title: 'You are offline',
            description: 'Reports will be saved locally and synced later.',
            pending: '{count} report(s) pending',
            dismiss: 'Close',
            states: {
                offline: {
                    title: 'You are offline',
                    description: 'Reports will be saved locally'
                },
                syncing: {
                    title: 'Syncing...',
                    description: 'Sending {count} report(s)'
                },
                success: {
                    title: '{count} report(s) sent',
                    titleDefault: 'Sync complete'
                },
                error: {
                    title: '{count} failed',
                    description: 'Review and retry'
                },
                pending: {
                    title: 'Reports ready to send'
                }
            },
            report: 'report | reports',
            syncNow: 'Send now'
        },
        toast: {
            went_offline: 'Connection lost',
            went_offline_description: 'Reports will be saved locally.',
            back_online: 'Back online',
            back_online_description: 'Connection restored.',
            syncing: 'Syncing...',
            syncing_description: 'Syncing {count} report(s).',
            sync_complete: 'Sync complete',
            sync_complete_description: 'All reports have been sent successfully.',
            sync_failed: 'Sync failed',
            sync_failed_description: '{count} report(s) could not be sent.'
        },
        status: {
            offline: 'Offline',
            syncing: 'Syncing...',
            pending: '{count} pending',
            synced: 'Synced'
        },
        sync: {
            title: 'Sync Status',
            syncNow: 'Sync now',
            syncing: 'Syncing...',
            offlineWarning: 'You are offline. Reports will sync when connection is restored.',
            pendingCount: '{count} report(s) waiting to sync',
            readyToSync: 'Ready to sync',
            waitingForConnection: 'Waiting for connection',
            failedItems: 'Failed submissions',
            untitledRequest: 'Untitled request',
            unknownError: 'Unknown error',
            attempts: '{count} attempt(s)',
            retry: 'Retry',
            delete: 'Delete',
            allSynced: 'All reports synced',
            lastSync: 'Last sync',
            syncSuccess: '{count} report(s) synced successfully',
            syncFailed: '{count} report(s) failed to sync',
            retrySuccess: 'Report synced successfully',
            retryFailed: 'Failed to sync report',
            itemDeleted: 'Report removed from queue',
            queuedSuccess: 'Report saved',
            willSyncWhenOnline: 'Will be sent when connection is restored.',
            queueFailed: 'Failed to save report for later'
        },
        failed: {
            title: 'Failed Submissions',
            description: 'These reports could not be sent and need your attention.',
            empty: 'No failed submissions',
            validation_error: 'Needs correction',
            server_error: 'Server error',
            edit: 'Edit',
            retry: 'Retry',
            delete: 'Delete',
            confirm_delete: 'Are you sure you want to delete this report? This cannot be undone.',
            untitled: 'Untitled report',
            view_failed: 'View failed'
        },
        form: {
            unavailable_title: 'Form unavailable offline',
            unavailable_description: 'The report form requires an internet connection to load. Please connect to the internet and try again.',
            retry: 'Retry',
            go_back: 'Go back',
            waiting_for_connection: 'Waiting for connection...'
        }
    },
    legal: {
        impressum: {
            title: 'Legal Notice',
            heading: 'Legal Notice',
            responsible_heading: 'Responsible for Content',
            responsible_text: '{name} is responsible for the content of this platform.'
        },
        privacy: {
            title: 'Privacy Policy',
            heading: 'Privacy Policy',
            intro: 'The protection of your personal data is important to us. We process your data exclusively on the basis of legal provisions (GDPR).',
            controller_heading: 'Data Controller',
            data_heading: 'Data Collected',
            data_text: 'When using this platform, the following data is processed: location data of the report, description text, uploaded photos, and technical access data (IP address, browser type, time of access).',
            rights_heading: 'Your Rights',
            rights_text: 'You have the right to access, rectification, erasure, restriction of processing, data portability, and objection.'
        },
        terms: {
            title: 'Terms of Use',
            heading: 'Terms of Use',
            intro: 'By using this platform, you agree to the following terms.',
            purpose_heading: 'Purpose',
            purpose_text: 'This platform serves for reporting issues in public spaces. Reports are forwarded to the responsible authority.',
            obligations_heading: 'User Obligations',
            obligations_text: 'You agree to provide only truthful information and not to upload illegal content. Uploaded photos must not show identifiable persons without their consent.',
            liability_heading: 'Liability',
            liability_text: '{name} assumes no liability for the completeness and accuracy of the information provided.'
        },
        email_label: 'Email',
        contact_label: 'Contact',
        platform: {
            heading: 'Platform Operator',
            intro: 'This platform is technically operated by:',
            description: 'Civic Patches GmbH provides the technical infrastructure for the Mark-a-Spot platform.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Germany',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operator of this map',
            not_configured: 'The operator of this map has not yet provided their legal information. Operators of publicly accessible online services may be required to provide an imprint and privacy policy.'
        },
        footer: {
            impressum: 'Legal Notice',
            privacy: 'Privacy',
            terms: 'Terms of Use'
        },
        not_configured: 'Operator data is not yet configured.'
    },
    demo_mode: {
        banner: {
            title: 'Demo system',
            message: 'Reports entered here are not forwarded to any authority.',
            link_label: 'Visit mark-a-spot.com',
            minimize_label: 'Minimize demo notice',
            expand_label: 'Expand demo notice'
        },
        reset: {
            title: 'Demo system',
            notice: 'The demo system is reset every hour.',
            countdown_label: 'Next reset in',
            countdown_aria: 'Next demo system reset in {time}'
        },
        modal: {
            title: 'Demo submission',
            body: 'This is a demo. Your report will NOT be forwarded to the municipality. Continue with the demo submission?',
            confirm_label: 'Submit demo report',
            cancel_label: 'Cancel'
        },
        lite: {
            title: 'Demo only',
            heading: 'Demo system',
            body: 'This is a demonstration of Mark-a-Spot. Submissions through the lite form are disabled here so that real reports never reach a municipality by accident.',
            link_label: 'Visit mark-a-spot.com'
        }
    },
    print: {
        title: 'Service Request Report',
        description: 'Description',
        location: 'Location',
        media: 'Media',
        image_unavailable: 'Image unavailable',
        attributes: 'Additional fields',
        status_history: 'Status history',
        internal_fields: 'Internal information',
        organisation: 'Department',
        hazard_level: 'Hazard level',
        hazard_category: 'Hazard category',
        sentiment: 'Sentiment',
        printed_at: 'Printed',
        showing_recent: 'Showing {count} of {total} updates'
    }
};
