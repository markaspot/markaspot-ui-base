// locales/da.ts
export default {
    locale: {
        code: 'da-DK'
    },
    meta: {
        description: 'Mark-a-Spot'
    },
    nav: {
        map: 'Kort',
        dashboard: 'Dashboard',
        back_to_frontend: 'Tilbage til kortet'
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Velkommen, {name}',
        nav: {
            dashboard: 'Dashboard',
            requests: 'Henvendelser',
            settings: 'Indstillinger',
            categories: 'Kategorier',
            jurisdictions: 'Jurisdiktioner',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'Sprog',
            billing: 'Fakturering'
        },
        help: {
            docs: 'Dokumentation',
            support: 'Kontakt support'
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
            profile: 'Profil',
            logout: 'Log ud'
        },
        jurisdiction: {
            current: 'Arbejdsområde',
            citizenView: 'Borgervisning',
            switchTo: 'Skift til',
            blocked: 'blokeret',
            admin_section_header: 'Alle arbejdsrum (administratoradgang)'
        },
        stats: {
            total: 'Alle henvendelser',
            pending: 'Afventende',
            in_progress: 'Under behandling',
            resolved: 'Løst',
            my_groups: 'Mine grupper',
            overall: 'Samlet'
        },
        recent_requests: 'Seneste henvendelser',
        view_all: 'Vis alle',
        no_recent: 'Ingen nylige henvendelser',
        wms: {
            title: 'Kortlag',
            attribution: 'Data: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Medie',
                category: 'Kategori',
                status: 'Status',
                created: 'Oprettet'
            }
        }
    },
    form: {
        body: 'Beskrivelse',
        body_description: 'Angiv venligst en detaljeret beskrivelse',
        body_placeholder: 'Indtast en beskrivelse...',
        category: 'Kategori',
        category_description: 'Vælg den passende kategori for din henvendelse',
        category_placeholder: 'Vælg en kategori',
        category_disabled: {
            title: 'Kategori valgt',
            description: 'Du har valgt kategorien "{category}". Denne kategori har særlige krav eller tillader ikke yderligere redigering af formularen.'
        },
        category_empty: 'Ingen kategorier tilgængelige',
        category_loading: 'Indlæser kategorier...',
        category_disabled_notice: 'Denne kategori er kun til information. Indsendelser er ikke mulige.',
        category_description_loading: 'Indlæser beskrivelse...',
        category_description_error: 'Fejl ved indlæsning af beskrivelse',
        email: 'E-mail',
        email_description: 'Din kontakt-e-mail',
        email_placeholder: 'Indtast din e-mailadresse',
        first_name: 'Fornavn',
        first_name_description: 'Dit fornavn',
        first_name_placeholder: 'Indtast dit fornavn',
        last_name: 'Efternavn',
        last_name_description: 'Dit efternavn',
        last_name_placeholder: 'Indtast dit efternavn',
        gdpr: 'Databeskyttelsesaftale',
        gdpr_description: 'Jeg accepterer behandlingen af mine data som beskrevet i privatlivspolitikken.',
        object_id: 'Objekt-ID',
        object_id_description: 'Identifikator for det rapporterede objekt',
        object_id_placeholder: 'Indtast objekt-ID (f.eks. mastnummer)',
        phone: 'Telefonnummer',
        phone_description: 'Dit kontakttelefonnummer',
        phone_placeholder: 'Indtast dit telefonnummer',

        // Facilitetbaseret indberetning
        facility: 'Facilitet',
        facility_plural: 'Faciliteter',
        facility_placeholder: 'Vælg {label}',
        facility_required: '{label} er påkrævet.',
        facility_unavailable: 'Den valgte facilitet er ikke længere tilgængelig, vælg venligst igen.',
        facility_nearest_snapped: 'Nærmeste facilitet: {label}',
        facility_no_nearby: 'Ingen facilitet i nærheden, vælg venligst manuelt.',
        facility_use_my_location: 'Brug min placering',
        facility_locating: 'Finder placering…',
        facility_no_match: 'Ingen facilitet matcher din søgning.',
        facility_opens_in_new_tab: '(åbner i ny fane)',
        facility_deselected_map_pick: 'Bruger din egen placering i stedet for {label}',
        facility_tagged_with: 'På: {label}',

        imagelist: {
            empty: 'Ingen billeder tilgængelige for denne type.'
        },
        back_to_report: 'Tilbage til henvendelsesformularen',
        requirements: {
            title: 'Stadig påkrævet',
            ready_to_submit: 'Klar til indsendelse',
            photo: 'Upload et foto',
            category: 'Vælg en kategori',
            location: 'Angiv placering',
            description: 'Indtast en beskrivelse',
            email: 'Angiv e-mailadresse',
            privacy: 'Accepter privatlivspolitik',
            privacyBlock: 'Udskift eller fjern det personfølsomme foto',
            conditional: 'afhængigt af kategori'
        },
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'Beskrivelse er påkrævet',
        category_required: 'Kategori er påkrævet',
        email_required: 'E-mail er påkrævet',
        email_format: 'Ugyldigt e-mail-format',
        first_name_required: 'Fornavn er påkrævet',
        last_name_required: 'Efternavn er påkrævet',
        gdpr_required: 'Du skal acceptere databeskyttelsesvilkårene',
        object_id_required: 'Objekt-ID er påkrævet',
        phone_required: 'Telefonnummer er påkrævet',
        required_field: '{field} er påkrævet'
    },
    feedback: {
        page_title: 'Feedback på henvendelse',
        error_title: 'Indlæsningsfejl',
        invalid_request: 'Ugyldig eller udløbet henvendelse',
        thank_you: 'Tak for din feedback!',
        submission_received: 'Din feedback er modtaget',
        loading: 'Indlæser henvendelse...',
        title: 'Feedback for: {service}',
        description: 'Angiv venligst din feedback',
        placeholder: 'Indtast din feedback her...',
        reopen_request: 'Jeg ønsker, at denne henvendelse genåbnes',
        submitting: 'Indsender...',
        sending: 'Sender...',
        submit: 'Indsend feedback',
        existing_title: 'Din feedback for: {service}',
        already_submitted: 'Du har allerede indsendt feedback for denne henvendelse',
        missing_uuid: 'Manglende henvendelses-ID',
        success_notification: 'Feedback indsendt',
        success_with_id: 'Feedback indsendt for henvendelse #{id}',
        updated_successfully: 'Feedback opdateret',
        added_to_list: 'Henvendelsen er tilføjet til din liste',
        submission_error: 'Kunne ikke indsende feedback',
        server_error: 'Serverfejl: Feedbacken kunne ikke behandles på nuværende tidspunkt',
        submission_failed: 'Kunne ikke indsende feedback. Prøv venligst igen senere',
        already_exists: 'Feedback eksisterer allerede for denne henvendelse',
        error_fetching_request: 'Fejl ved indlæsning af henvendelsesdetaljer',
        no_content: 'Ingen feedback-indhold',
        refresh_complete: 'Henvendelsesliste opdateret',
        try_again: 'Prøv igen',
        format_unrecognized: 'Henvendelsesformat ikke genkendt',
        processing_error: 'Fejl ved behandling af henvendelsesdata',
        your_feedback: 'Din feedback',
        contact_preference: 'Kontaktpræference',
        no_contact: 'Ingen kontakt',
        email_contact: 'Kontakt via e-mail',
        email_placeholder: 'Din e-mailadresse',
        set_status_open: 'Sæt status til åben',
        set_status_open_description: 'Hvis du ønsker, at vi skal se på dette igen, kan du genåbne denne henvendelse.',
        email_verification: 'E-mailbekræftelse',
        email_verification_placeholder: 'E-mailadresse fra den oprindelige henvendelse',
        email_verification_description: 'Indtast den e-mailadresse, du brugte ved oprettelse af den oprindelige henvendelse.',
        email_mismatch: 'Den indtastede e-mailadresse matcher ikke den oprindelige henvendelse.',
        unauthorized_access: 'Uautoriseret adgang. Kontroller venligst din e-mailadresse.',
        not_eligible: 'Denne henvendelse er ikke berettiget til feedback på nuværende tidspunkt',
        dialog_description: 'Feedback-formular dialog',
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
            reassignment_note: 'This request has been marked for reassignment and can receive multiple completions',
            mark_completed_description: 'Confirm that the work has been completed'
        }
    },
    service_provider: {
        page_title: 'Serviceudbyder-svar',
        page_description: 'Indsend færdiggørelsesnotater for tildelte henvendelser',
        modal_title: 'Serviceudbyder-svar',
        dialog_description: 'Serviceudbyder-svarformular dialog',
        title: 'Fuldfør opgave',
        your_email: 'Din e-mailadresse',
        email_placeholder: 'udbyder{\'@\'}eksempel.dk',
        email_verification_note: 'Indtast din serviceudbyder-e-mail til bekræftelse',
        completion_notes: 'Færdiggørelsesnotater',
        notes_placeholder: 'Beskriv det udførte arbejde...',
        mark_as_completed: 'Marker som fuldført',
        mark_as_completed_description: 'Sæt henvendelsesstatus til fuldført',
        submit_completion: 'Indsend færdiggørelse',
        complete_request: 'Fuldfør opgave',
        completing: 'Indsender...',
        completion_success: 'Henvendelsesfærdiggørelse indsendt',
        submission_failed: 'Kunne ikke indsende færdiggørelse. Prøv venligst igen senere',
        server_error: 'Serverfejl: Færdiggørelsen kunne ikke behandles på nuværende tidspunkt',
        completion_not_allowed: 'Denne henvendelse kan ikke fuldføres på nuværende tidspunkt',
        email_verification_failed: 'E-mail matcher ikke den tildelte serviceudbyder',
        already_completed: 'Denne henvendelse er allerede fuldført',
        loading: 'Indlæser henvendelse...',
        try_again: 'Prøv igen',
        invalid_uuid: 'Ugyldig eller udløbet henvendelse',
        load_error: 'Fejl ved indlæsning af henvendelsesdetaljer',
        error_fetching_request: 'Fejl ved indlæsning af henvendelsesdetaljer',
        completion_notes_required: 'Angiv venligst færdiggørelsesnotater',
        existing_completions: 'Tidligere færdiggørelser',
        reassignment_note: 'Denne henvendelse er markeret til omfordeling og kan modtage flere færdiggørelser'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Din henvendelse. Vores løsning.'
    },
    service_unavailable: {
        title: 'Tjeneste midlertidigt utilgængelig',
        message: 'Vi kan ikke oprette forbindelse til vores tjenester lige nu. Dette problem er sandsynligvis midlertidigt.',
        retry: 'Vi oplever i øjeblikket tekniske problemer. Prøv venligst igen om {seconds} sekunder.',
        auto_retry: 'Prøver igen om {seconds} sekunder...',
        retry_now: 'Prøv igen nu',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    hiddenSection: {
        description: 'Vores henvendelsessystem er et rapporteringssystem for infrastrukturproblemer. Du kan fortsætte direkte med at rapportere problemer eller navigere til følgende:',
        main_navigation: 'Hovednavigation med information, en liste over henvendelser og statistik',
        map: 'Interaktivt kort med visuelle markører',
        map_navigation_hint: 'Brug piletaster til at navigere mellem henvendelsesmarkører, Enter for at vælge, Escape for at rydde valg',
        action_button: 'Rapportér direkte',
        keyboard_navigation_hint: 'Brug piletaster til navigation, Enter for at aktivere',
        skip_to_main_content: 'Spring til hovedindhold'
    },
    accessibility: {
        skip_to_main: 'Spring til hovedindhold',
        skip_to_map: 'Spring til kort',
        skip_to_navigation: 'Spring til navigation',
        skip_to_form: 'Rapportér direkte',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'Tilbage',
        not_classified: 'Ikke klassificeret',
        no_value: 'Ingen værdi',
        close: 'Luk',
        loading: 'Indlæser...',
        error: 'Fejl',
        success: 'Succes',
        submit: 'Indsend',
        cancel: 'Annuller',
        required: 'Påkrævet',
        save: 'Gem',
        delete: 'Slet',
        edit: 'Rediger',
        clear: 'Ryd',
        search: 'Søg',
        select: 'Vælg',
        on: 'Til',
        off: 'Fra',
        toggle: 'Skift',
        yesterday: 'I går',
        current: 'Aktuel',
        did_you_know: 'Vidste du?',
        show_more: 'Vis mere',
        show_less: 'Vis mindre',
        learn_more: 'Læs mere',
        learn_more_about: 'Læs mere om {topic}',
        opens_in_new_tab: '(åbner i ny fane)',
        buttons: {
            toggle_theme: 'Skift tema',
            attribution: 'Kortattribution',
            close: 'Luk'
        },
        navigation: 'Navigationspanel',
        drawer_description: 'Indhold og valgmuligheder',
        resize_drawer: 'Tilpas panel',
        drawer_position_n_of_total: 'position {idx} af {total}',
        title: {
            classic: 'Classic Report',
            photo: 'Photo Report'
        },
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'Placering',
        field_gdpr: 'Databeskyttelse',
        field_e_mail: 'E-mail',
        field_category: 'Kategori',
        field_request_media: 'Fotos',
        field_name: 'Efternavn',
        field_prename: 'Fornavn',
        field_first_name: 'Fornavn',
        field_first_name_placeholder: 'Indtast venligst fornavn',
        field_last_name: 'Efternavn',
        field_last_name_placeholder: 'Indtast venligst efternavn',
        field_phone: 'Telefon',
        body: 'Beskrivelse',
        field_add_data: 'Konkurrencedeltagelse',
        field_terms_of_use: 'Jeg accepterer vilkårene og betingelserne samt privatlivspolitikken.',
        field_address: 'Adresse',
        postal_code: 'Postnummer',
        postal_code_placeholder: 'f.eks. 1000',
        city: 'By',
        city_placeholder: 'f.eks. København',
        street_address: 'Adresse',
        street_address_placeholder: 'f.eks. Hovedgaden 123'
    },
    competition: {
        intro: 'Hvis du ønsker det, kan du deltage i vores årlige lodtrækning. Du har mulighed for at vinde attraktive præmier og pengepræmier, som vi uddeler blandt alle deltagere som en lille tak.',
        disclaimer: 'Medarbejdere i de ansvarlige afdelinger er udelukket fra deltagelse.',
        title: 'Konkurrencedeltagelse',
        errors: {
            already_exists: 'Konkurrenceindlæg eksisterer allerede',
            duplicate_found: 'Duplikat fundet',
            duplicate_detail: 'Et konkurrenceindlæg er allerede oprettet for denne henvendelse.',
            not_found: 'Henvendelse ikke fundet',
            not_found_detail: 'Den tilknyttede henvendelse kunne ikke findes.',
            save_failed: 'Konkurrenceindlæg kunne ikke gemmes',
            submission_error: 'Indsendelsesfejl',
            submission_error_detail: 'Dit konkurrenceindlæg kunne ikke gemmes, men din henvendelse blev indsendt.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Information fane',
                panel_label: 'Informationspanel'
            },
            list: {
                label: 'Liste',
                aria_label: 'Henvendelsesliste fane',
                panel_label: 'Henvendelsesliste panel'
            },
            following: {
                label: 'Følger',
                aria_label: 'Følgende henvendelser fane',
                panel_label: 'Følgende henvendelser panel'
            },
            stats: {
                label: 'Statistik',
                aria_label: 'Statistik fane',
                panel_label: 'Statistik panel'
            }
        },
        main: 'Hovednavigation',
        pages: 'Sidenavigation',
        browse_reports: 'Gennemse henvendelser',
        back_to_form: 'Tilbage til formular',
        panel: {
            scrollable: 'Rulbart område'
        },
        updates_count: '{count} nye opdateringer'
    },
    report: {
        form_types: 'Henvendelsestyper',
        how_to_help: 'Sådan opretter du en henvendelse',
        title: {
            photo: 'Fotohenvendelse',
            classic: 'Klassisk henvendelse',
            submit: 'Indsend henvendelse',
            edit: 'Rediger henvendelse',
            view: 'Vis henvendelse'
        },
        photo: {
            description: 'Opret en ny henvendelse med et foto'
        },
        classic: {
            description: 'Opret en ny henvendelse uden foto'
        },
        status: {
            new: 'Ny',
            open: 'Åben',
            in_progress: 'Under behandling',
            resolved: 'Løst',
            closed: 'Lukket',
            unknown: 'Ukendt status'
        },
        form: {
            modal_description: 'Opret ny henvendelse',
            tabs: {
                photo: 'Med foto',
                classic: 'Klassisk'
            },
            description: {
                label: 'Beskrivelse',
                placeholder: 'Beskriv venligst problemet...',
                ai_processing: 'AI genererer en beskrivelse...',
                help: 'Angiv så mange detaljer som muligt'
            },
            category: {
                label: 'Kategori',
                placeholder: 'Vælg en kategori',
                loading: 'Indlæser kategorier...',
                error: 'Fejl ved indlæsning af kategorier',
                empty: 'Ingen kategorier tilgængelige',
                help: 'Kategorivalg (sker automatisk)',
                description: 'Kategoribeskrivelse',
                description_loading: 'Indlæser beskrivelse...',
                description_error: 'Fejl ved indlæsning af beskrivelse',
                disabled_notice: 'Denne kategori er kun til information. Indsendelser er ikke mulige.'
            },
            location: {
                label: 'Placering',
                placeholder: 'Søg efter en placering...',
                selected: 'Placering valgt',
                warning: 'Placeringsadvarsel',
                unknown_location: 'Ukendt placering',
                suggestions: 'Placeringsforslag',
                clear: 'Ryd placering',
                error: 'Fejl ved hentning af placering',
                help: 'Indtast en adresse eller klik på kortet',
                help_modal: 'Indtast en adresse eller brug din nuværende placering',
                current: 'Brug nuværende placering',
                searching: 'Søger...',
                pick_on_map: 'Placering upræcis? Vælg på kortet',
                auto_detected: 'Placering registreret',
                complete_address: 'Fuldstændig adresse',
                from_photo_exif: 'Placering automatisk udtrukket fra fotometadata'
            },
            email: {
                label: 'E-mail til opdateringer',
                placeholder: 'Indtast din e-mailadresse',
                help: 'Vi sender dig opdateringer om din henvendelse',
                subscribe: 'Abonner på opdateringer'
            },
            gdpr: {
                label: 'Databeskyttelsessamtykke',
                description: 'Jeg accepterer behandlingen af mine data i henhold til privatlivspolitikken.',
                required: 'Du skal acceptere for at fortsætte',
                link: 'Se privatlivspolitik'
            },
            media: {
                label: 'Fotos',
                required: 'Et foto er påkrævet for denne kategori',
                upload: {
                    overall_progress: 'Samlet fremgang',
                    button: 'Klik for at uploade',
                    or: ' eller',
                    drag: 'træk og slip',
                    drop_here: 'Slip filer her for at uploade',
                    restrictions: 'Op til {count} billeder ({size} maks., {types})',
                    progress: 'Upload-fremgang',
                    started_sr: 'Upload startet',
                    progress_sr: 'Upload {progress}% fuldført',
                    success_sr: 'Upload fuldført',
                    error_sr: 'Upload mislykkedes: {error}',
                    files_selected_sr: '{count} fil(er) valgt til upload',
                    area_label: 'Foto-upload område - klik for at vælge filer eller træk og slip',
                    in_progress: 'Upload i gang',
                    complete_sr: 'Fil er uploadet.',
                    restrictions_single: 'One image ({size} max., {types})',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'Billedforhåndsvisning',
                remove: 'Fjern billede',
                no_image_available: 'Intet billede tilgængeligt eller ikke vist af juridiske årsager',
                progress: 'Upload-fremgang: {progress}%',
                limit_reached: 'Maksimalt antal på {count} billeder nået',
                privacy_notice: 'Ingen personer/nummerplader på fotos venligst',
                offline_cached: 'Gemt offline',
                ai_analysis: 'Analyse via Azure AI (Tyskland)',
                ai_analysis_tooltip: 'Ved at uploade bekræfter du, at fotoet er taget lovligt og ikke krænker tredjepartsrettigheder. Hvis personer eller nummerplader er genkendelige, skal de gøres ukendelige før upload. Analysen tjener udelukkende til at kategorisere din henvendelse. Kun en reduceret, EXIF-fri kopi sendes til Azure OpenAI (Tyskland); originalen sendes ikke til tjenesten.',
                ai_analysis_help: 'Information about AI analysis'
            },
            submit: {
                button: 'Indsend henvendelse',
                submitting: 'Indsender...',
                processing: 'Behandler...',
                success: 'Henvendelse indsendt',
                error: 'Fejl ved indsendelse af henvendelse',
                loading: 'Loading form...'
            },
            loading: 'Indlæser henvendelsesformular...',
            draft_saved: 'Kladde gemt'
        },
        ai: {
            label: 'AI',
            powered: 'AI-drevet',
            analyzing: 'AI analyserer dine fotos...',
            started_sr: 'AI-analyse startet',
            complete_sr: 'AI-analyse fuldført',
            field_updated_sr: '{field} er blevet opdateret med: {value}',
            analysis_complete_sr: 'AI-analyse fuldført.',
            category_result_sr: 'Kategori valgt: {category}.',
            description_result_sr: 'Beskrivelse genereret: {description}',
            location_result_sr: 'Placering fundet: {location}.',
            category_hint: 'Dette foto ser ikke ud til at passe til vores rapportkategorier. Vælg venligst en kategori selv.',
            processing: {
                analyzing: 'Spørger AI...',
                location: 'Tjekker billedmetadata...',
                location_found: 'Placering fundet:',
                location_ai: 'Finder placering i billede...',
                location_not_found: 'Placering ikke fundet i billedmetadata.',
                location_complete: 'Placering identificeret',
                category: 'Identificerer kategori...',
                category_found: 'Kategori identificeret:',
                description: 'Genererer beskrivelse...',
                description_complete: 'Beskrivelse genereret',
                attributes_filled: '{count} ekstra felt(er) udfyldt på forhånd',
                complete: 'AI-analyse fuldført',
                error: 'Fejl under AI-analyse',
                privacy_warning: 'Privatlivsproblem registreret',
                category_not_matched: 'Category suggested by AI (needs selection)'
            },
            privacy: {
                title: 'Privatlivsmeddelelse',
                description: 'Der er muligvis registreret personlige data på dit foto ({issues}). Fotoet vil blive gennemgået inden offentliggørelse.',
                required: 'Der er registreret personfølsomt indhold på dette foto, og automatisk sløring er ikke tilgængelig. Fotoet kan ikke bruges. Udskift det eller fjern det for at fortsætte.',
                removePhoto: 'Fjern foto',
                replace: 'Erstat foto',
                understood: 'Fortsæt med dette foto'
            },
            failed: {
                title: 'Billedanalyse ikke tilgængelig',
                description: 'Dit foto vil blive manuelt gennemgået inden offentliggørelse. Du kan stadig indsende din henvendelse.'
            },
            budget_exhausted_title: 'AI-analyse sprunget over',
            budget_exhausted_submitted: 'AI-analysebudgettet for denne måned er opbrugt. Din henvendelse blev indsendt.'
        },
        buttons: {
            photo: 'Fotohenvendelse',
            classic: 'Klassisk henvendelse',
            follow: 'Følg henvendelse',
            following: 'Følger',
            share: 'Del henvendelse',
            print: 'Udskriv',
            flag: 'Rapportér',
            flag_submitted: 'Allerede rapporteret',
            copy_link: 'Kopiér link',
            link_copied: 'Link kopieret til udklipsholder',
            email: 'E-mail',
            directions: 'Få rutevejledning'
        },
        following: {
            count: 'Følger {count} henvendelse(r)',
            mark_all_read: 'Marker alle som læst',
            no_reports: 'Ingen fulgte henvendelser endnu',
            no_address: 'Ingen adresse tilgængelig',
            status_updated: 'Status opdateret',
            status_changed: 'Status ændret til:',
            awaiting_server: 'Afventer opdatering',
            escalated_to: 'Videresendt til {jurisdiction}',
            escalated_click: 'Tryk for at åbne i ny jurisdiktion',
            unavailable: 'Denne indberetning er i øjeblikket ikke tilgængelig. Tjek venligst din e-mail for detaljer eller kontakt os.',
            date: {
                today: 'I dag',
                tomorrow: 'I morgen',
                yesterday: 'I går',
                unknown: 'Ukendt dato'
            }
        }
    },
    map: {
        tap_to_load: 'Tryk for at vise kort',
        tap_to_select_location: 'Tryk på kortet for at vælge placering',
        loading: 'Indlæser kort...',
        loading_address: 'Indlæser adresse...',
        retry_attempt: 'Forsøg {count}',
        confirm_location: 'Bekræft placering',
        add_report_here: 'Tilføj henvendelse her',
        controls: {
            zoom_in: 'Zoom ind',
            zoom_out: 'Zoom ud',
            zoom: 'Zoom',
            find_location: 'Find min placering',
            toggle_heatmap: 'Skift varmekort',
            toggle_language: 'Skift sprog',
            add_report_here: 'Rapportér her',
            adjust_tilt: 'Juster hældning',
            degrees: '{count} grader',
            layers: 'Kortlag',
            no_layers: 'Ingen lag tilgængelige',
            geolocation: {
                label: 'Hent aktuel placering'
            }
        },
        pick: {
            drag_hint: 'Træk markør for at justere position'
        },
        tooltip: {
            label: 'Kortmarkøroplysninger',
            opens_form_above: 'Åbner formular ovenfor',
            opens_modal: 'Åbner i dialog'
        },
        keyboard: {
            canvasInstructions: 'Interaktivt kort med indberetningsmarkører. Piletaster navigerer mellem markører, Skift+Piletaster panorerer kortet, Enter vælger. Tryk Ctrl+= for at zoome ind, Ctrl+- for at zoome ud.',
            noFeatures: 'Ingen markører synlige i det aktuelle kortudsnit. Prøv at zoome ind eller panorere for at finde markører.',
            zoomedIntoCluster: 'Zoomet ind i klyngeområde. Brug piletaster til at navigere mellem markører.',
            clusterFocused: 'Fokus på klynge med {count} indberetninger. Tryk Enter for at udvide. {position}',
            clusterExpanded: 'Klynge udvidet til {count} indberetninger. {featureLabel}',
            markerFocused: 'Fokus på indberetning: {name} ved {address}{context}. Tryk Enter for at åbne detaljer. {position}',
            expandedContext: ' (udvidet fra klynge)',
            untitledReport: 'Indberetning uden titel',
            unknownLocation: 'placering',
            featurePosition: 'Markør {current} af {total}.',
            pannedToExplore: 'Kortet panoreret {direction}. Slip Skift og brug piletaster til at navigere markører.',
            pannedNoMarkers: 'Kortet panoreret {direction}. Ingen markører fundet i denne retning - brug piletaster til at fortsætte udforskningen.'
        }
    },
    detail: {
        location: 'Placering',
        photos: 'Fotos',
        description: 'Beskrivelse',
        status_history: 'Statushistorik',
        updates: 'Opdateringer',
        no_updates: 'Ingen opdateringer endnu',
        dialog_description: 'Vis henvendelsesdetaljer',
        edit: 'Rediger',
        follow: {
            button: 'Følg',
            following: 'Følger',
            stop: 'Stop med at følge',
            success: 'Du følger nu denne henvendelse',
            error: 'Fejl ved følgning af henvendelse',
            updating: 'Opdaterer...'
        },
        unavailable: {
            title: 'Henvendelse ikke tilgængelig',
            message: 'Denne henvendelse findes ikke eller er endnu ikke offentliggjort. Nyligt indsendte henvendelser kan tage lidt tid, inden de vises.'
        }
    },
    pages: {
        dialog_description: 'Vis sideindhold'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Fordeling',
        total_reports: 'Samlede henvendelser',
        status_distribution: 'Statusfordeling',
        category_distribution: 'Kategorifordeling',
        uncategorized: 'Ukategoriseret',
        showing_reports: 'Viser {visible} af {total} henvendelser',
        no_reports: 'Ingen henvendelser tilgængelige',
        open_reports: 'Åbne henvendelser',
        closed_reports: 'Lukkede henvendelser',
        no_data_available: 'Ingen data tilgængelig',
        expand: 'Vis detaljer',
        collapse: 'Skjul detaljer',
        subcategory: 'underkategori',
        subcategories: 'underkategorier'
    },
    time: {
        days_ago: 'for {count} dage siden',
        just_now: 'Lige nu',
        minutes_ago: 'for {count} minutter siden',
        hours_ago: 'for {count} timer siden',
        yesterday: 'I går',
        today: 'I dag'
    },
    list: {
        showing: 'Viser {visible} af {total} henvendelser',
        showing_in_area: '{visible} i dette område, {total} i alt',
        showing_area_only: '{visible} i dette område',
        no_results: 'Ingen henvendelser fundet',
        no_filtered_results: 'Ingen henvendelser matcher dine filterkriterier',
        load_more: 'Alle henvendelser indlæst',
        load_more_button: 'Indlæs flere',
        newest_first: 'Nyeste først',
        oldest_first: 'Ældste først',
        refresh: 'Opdater',
        status_update: 'Status opdateret',
        location: 'Placering',
        unpublished: 'Ikke offentliggjort',
        editable: 'Redigerbar'
    },
    errors: {
        general: 'Noget gik galt',
        search_failed: 'Søgning mislykkedes. Prøv igen.',
        api: {
            rate_limit: 'For mange anmodninger. Vent venligst et øjeblik og prøv igen.',
            unauthorized: 'Ikke autoriseret. Log venligst ind igen.',
            forbidden: 'Adgang nægtet.',
            not_found: 'Ressource ikke fundet.',
            server_error: 'Serverfejl. Prøv venligst igen senere.',
            default: 'API-fejl: {status}'
        },
        upload_failed: 'Upload mislykkedes',
        location_error: 'Kunne ikke bestemme placering',
        network_error: 'Netværksfejl',
        geolocation: {
            title: 'Placeringsfejl',
            permission_denied: 'Placeringstilladelse nægtet. Tillad venligst adgang i dine browserindstillinger.',
            unavailable: 'Placeringsoplysninger er i øjeblikket ikke tilgængelige.',
            timeout: 'Placeringsanmodningen udløb.',
            unknown: 'Der opstod en ukendt placeringsfejl.'
        },
        try_again: 'Prøv venligst igen',
        validation: {
            title: 'Beklager, vi kan ikke behandle denne anmodning:',
            location_error_title: 'Placeringsfejl',
            invalid_input: 'Ugyldig input',
            duplicate_title: 'Duplikat fundet',
            duplicate_found: 'Lignende henvendelse fundet',
            duplicate_report: 'En lignende henvendelse er allerede oprettet (Nr. {reportId})',
            duplicate_hint_title: 'Muligt duplikat fundet',
            duplicate_hint_message: 'En lignende henvendelse findes muligvis allerede i dette område. Du kan stadig indsende, hvis du mener, det er et nyt problem.',
            duplicate_existing_report: 'Eksisterende henvendelse: Nr. {reportId}',
            view_existing_report: 'Se eksisterende henvendelse',
            submit_anyway: 'Indsend alligevel',
            location_out_of_bounds: 'Den valgte placering er uden for vores jurisdiktion',
            required_field: '{field} er påkrævet',
            file_size: 'Den valgte fil er for stor (maks. 10 MB)',
            file_type: 'Formatet understøttes ikke (tilladt: jpg, png, webp)',
            media_upload: 'Fejl ved upload af billede',
            required_fields: 'Udfyld venligst alle påkrævede felter',
            please_review: 'Gennemgå venligst formularen og ret eventuelle fejl før indsendelse.',
            invalid_format: 'Ugyldigt format for {field}',
            consent_required: 'Accepter venligst privatlivspolitikken',
            photo_required: 'Et foto er påkrævet for denne kategori'
        },
        rate_limit: {
            title: 'Billedantal midlertidigt overskredet',
            general: 'Prøv venligst igen senere.',
            with_time: 'For mange billeder på én gang! Prøv venligst igen om {seconds} sekunder.'
        },
        network: 'Forbindelsesproblem. Tjek venligst din internetforbindelse',
        timeout: 'Timeout. Prøv venligst igen',
        upload: {
            title: 'Uploadfejl',
            invalid_type: 'Ugyldig filtype. Upload venligst kun billeder.',
            file_too_large: 'Fil for stor. Maksimal størrelse er {size}.',
            dimensions_too_large: 'Billeddimensioner for store. Maksimalt {width}x{height} pixels.',
            invalid_image: 'Ugyldig eller beskadiget billedfil.',
            failed: 'Upload mislykkedes. Prøv venligst igen.',
            limit_reached: 'Maksimalt antal på {count} filer nået.',
            remove_to_add: 'Fjern et foto for at tilføje et nyt',
            single_file_limit: 'Kun ét billede kan uploades.',
            exact_file_limit: 'Maksimalt {count} billeder kan uploades.',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'Fejl ved indsendelse af formular',
        unknown: 'En ukendt fejl opstod.',
        pending_uploads: 'Vent venligst til alle uploads er færdige.',
        incomplete_form: 'Udfyld venligst alle påkrævede felter.',
        page: {
            title: 'Fejl',
            not_found_title: 'Side ikke fundet',
            not_found_message: 'Beklager, den side du leder efter findes ikke.',
            server_error_title: 'Serverfejl',
            server_error_message: 'Beklager, der opstod en fejl på vores server.',
            generic_title: 'Fejl opstod',
            generic_message: 'En uventet fejl er opstået.',
            action_home: 'Gå til forsiden',
            action_back: 'Gå tilbage',
            action_retry: 'Prøv igen',
            details: 'Fejldetaljer'
        }
    },
    success: {
        report_submitted: 'Henvendelse indsendt.',
        report_submitted_description: 'Din henvendelse er blevet indsendt og vil snart blive gennemgået.',
        moderation_notice: 'Din henvendelse vil blive gennemgået før offentliggørelse. Dit referencenummer:',
        submit_another: 'Indsend en anden henvendelse',
        auto_followed: 'Denne henvendelse er automatisk tilføjet til dine fulgte henvendelser',
        visibility_limitation_notice: 'Bemærk venligst, at ikke alle henvendelser bliver offentligt synlige på hjemmesiden. Hvis din henvendelse ikke opdateres i listen over fulgte henvendelser, kan den stadig være behandlet af kommunen. Tjek din e-mail for statusopdateringer.',
        fun_facts: [
            'Hver henvendelse du indsender hjælper med at gøre din by et bedre sted at bo!',
            'Borgerhenvendelser har hjulpet med at løse over 10.000 problemer i byer verden over.',
            'Den gennemsnitlige henvendelse bliver gennemgået inden for 24 timer.',
            'Du er en del af et fællesskab, der bekymrer sig om offentlige rum!',
            'Data fra borgerhenvendelser hjælper byplanlæggere med at træffe bedre beslutninger.',
            'At følge dine henvendelser holder dig automatisk opdateret om fremskridt.',
            'Fotohenvendelser behandles 3x hurtigere end teksthenvendelser.',
            'Borgerengagementsplatforme som denne findes i over 50 lande.',
            'Din feedback hjælper med at prioritere, hvilke problemer der løses først.',
            'Digital rapportering har reduceret svartider med op til 60%.',
            'Aktive borgere skaber stærkere, mere modstandsdygtige samfund.',
            'AI-analyse hjælper med at kategorisere dine henvendelser mere præcist.',
            'Mobil rapportering gør det nemt at rapportere problemer, når du ser dem.',
            'Tak fordi du er en engageret borger!'
        ]
    },
    flag: {
        title: 'Rapportér denne henvendelse',
        description: 'Hjælp os med at opretholde kvaliteten ved at rapportere upassende indhold.',
        reason_label: 'Hvorfor rapporterer du denne henvendelse?',
        reason_spam: 'Spam eller reklame',
        reason_offensive: 'Stødende eller upassende indhold',
        reason_personal: 'Indeholder personlige data',
        reason_location: 'Forkert placering',
        reason_other: 'Andet',
        details_label: 'Yderligere detaljer',
        details_placeholder: 'Beskriv venligst problemet...',
        details_required: 'Angiv venligst detaljer',
        submit: 'Indsend',
        success: 'Tak. Vi vil gennemgå denne henvendelse.',
        error: 'Kunne ikke indsende. Prøv venligst igen.',
        already_flagged: 'Du har allerede rapporteret denne henvendelse.'
    },

    pwa: {
        install: {
            title: 'Installer app',
            button: 'Installer',
            not_now: 'Ikke nu',
            description: 'Klik på installationsikonet i din browsers adresselinje for at installere denne app.',
            share_button: 'Del-ikon',
            open_safari: 'Safari-browser',
            ios: {
                title: 'Føj til startskærm',
                safari_instructions: 'Tryk på {icon} og vælg "Føj til startskærm".',
                other_instructions: 'Åbn venligst dette websted i {browser} for at installere.'
            },
            chrome: {
                instructions: 'Klik på installationsikonet {icon} i værktøjslinjen for at installere denne app.'
            },
            edge: {
                instructions: 'Klik på installationsikonet {icon} i adresselinjen.'
            },
            firefox: {
                instructions: 'Klik på hjemikonet {icon} i adresselinjen.'
            }
        }
    },
    boundaries: {
        loading: 'Indlæser grænsedata...',
        error: 'Kan ikke validere placeringsgrænser. Prøv venligst igen senere.',
        notLoaded: 'Grænser ikke indlæst endnu',
        outsideNonStrict: 'Bemærk: Valgt placering er uden for {locationName} grænser.',
        outsideStrict: 'Placering uden for jurisdiktion. Vælg venligst en placering inden for bygrænsen.',
        validationUnavailable: 'Grænsevalidering ikke tilgængelig. Din henvendelse vil blive accepteret, men kan blive gennemgået.'
    },
    filters: {
        title: 'Filtre',
        status: {
            title: 'Status'
        },
        time: {
            title: 'Tid',
            today: 'I dag',
            week: 'Denne uge',
            month: 'Denne måned'
        },
        category: {
            title: 'Kategori',
            other: 'Andet'
        },
        actions: {
            more: 'Flere filtre',
            expand: 'Flere filtre',
            collapse: 'Færre',
            clear_all: 'Ryd alle',
            active_count: '{count} filtre aktive',
            toggle: 'Filtre'
        }
    },
    privacy: {
        notice_text: 'Information om privatlivspolitik kan findes',
        notice_link_text: 'her',
        modal: {
            title: 'Privatlivspolitik',
            loading: 'Indlæser privatlivsinformation...',
            retry: 'Prøv igen',
            noContent: 'Ingen privatlivsinformation tilgængelig.',
            lastUpdated: 'Sidst opdateret',
            close: 'Luk'
        }
    },
    search: {
        placeholder: 'Søg i henvendelser...',
        no_results_local: 'Ingen resultater fundet i aktuel visning',
        expand_to_server: 'Søg i alle henvendelser',
        expand_hint: 'Søg ud over aktuel visning',
        searching_server: 'Søger i alle henvendelser...'
    },
    info: {
        welcome: {
            heading: 'Velkommen til {name}',
            headingGeneric: 'Velkommen',
            body: 'Brug dette kort til at indberette problemer eller finde ud af eksisterende henvendelser i dit område.'
        },
        shortcuts: {
            aria_label: 'Hurtige handlinger',
            photo: {
                title: 'Foto',
                description: 'Tag et foto, AI klarer resten',
                aria_label: 'Opret en fotohenvendelse'
            },
            classic: {
                title: 'Klassisk',
                description: 'Beskriv og find problemet',
                aria_label: 'Opret en klassisk henvendelse'
            },
            following: {
                title: 'Følg',
                description: 'Bliv informeret om fremskridt',
                aria_label: 'Åbn fulgte henvendelser'
            },
            list: {
                title: 'Udforsk',
                description: 'Se hvad der sker i nærheden',
                aria_label: 'Udforsk kort og se listen'
            }
        }
    },
    auth: {
        login: {
            title: 'Log ind',
            subtitle: 'Indtast din e-mail for at modtage en bekræftelseskode',
            email_label: 'E-mailadresse',
            email_hint: 'Vi sender dig en 6-cifret kode',
            email_placeholder: 'e-mailadresse',
            send_code: 'Send bekræftelseskode',
            disabled: {
                title: 'Log ind er ikke tilgængeligt',
                message: 'Passwordless login er ikke aktiveret her. Kontakt administratoren, hvis du har brug for adgang.',
                back_button: 'Tilbage til forsiden'
            }
        },
        verify: {
            email_label: 'E-mailadresse',
            code_label: 'Bekræftelseskode',
            code_hint: 'Indtast den 6-cifrede kode fra din e-mail',
            code_placeholder: '123456',
            verify_button: 'Bekræft og log ind',
            back_button: 'Brug anden e-mail',
            request_new: 'Anmod om ny kode',
            resend_code: 'Gensend kode',
            expires_in: 'Kode udløber om {time}',
            expired_title: 'Kode udløbet',
            expired_message: 'Din bekræftelseskode er udløbet. Anmod venligst om en ny.'
        },
        code_sent: {
            title: 'Kode sendt',
            message: 'Vi har sendt en 6-cifret bekræftelseskode til {email}'
        },
        error: {
            title: 'Godkendelsesfejl',
            request_failed: 'Kunne ikke sende bekræftelseskode. Prøv venligst igen.',
            verify_failed: 'Ugyldig eller udløbet bekræftelseskode',
            sso_failed: 'Login mislykkedes. Prøv venligst igen.',
            network: 'Netværksfejl. Tjek venligst din forbindelse.',
            logout_failed: 'Kunne ikke logge ud. Prøv venligst igen.'
        },
        sso: {
            completing: 'Fuldfører login...',
            method_label: 'Single sign-on',
            button_aria: 'Log ind med {provider} via single sign-on'
        },
        user: {
            logged_in_as: 'Logget ind som',
            logout: 'Log ud'
        },
        welcome: {
            greeting: 'Hej, {name}',
            sign_in: 'Log ind',
            sign_out: 'Log ud',
            user_avatar: 'User avatar'
        }
    },
    profile: {
        title: 'Profil',
        account: {
            title: 'Konto',
            roles: 'Roller'
        },
        groups: {
            title: 'Grupper'
        },
        appearance: {
            title: 'Udseende',
            color_mode: 'Farvetilstand',
            light: 'Lys',
            dark: 'Mørk',
            system: 'System',
            theme_override: 'Brugerdefinerede temafarver',
            theme_override_description: 'Tilsidesæt standardtemaet med dine egne farvepræferencer',
            primary_color: 'Primær farve',
            secondary_color: 'Sekundær farve',
            neutral_color: 'Neutral farve',
            reset_theme: 'Nulstil til standard'
        },
        language: {
            title: 'Sprog',
            select: 'Vælg sprog',
            save_failed: 'Sprogindstillingen kunne ikke gemmes. Prøv igen.'
        }
    },
    offline: {
        banner: {
            title: 'Du er offline',
            description: 'Henvendelser gemmes lokalt',
            pending: '{count} henvendelse(r) afventer',
            dismiss: 'Luk',
            states: {
                offline: {
                    title: 'Du er offline',
                    description: 'Henvendelser gemmes lokalt'
                },
                syncing: {
                    title: 'Synkroniserer...',
                    description: 'Sender {count} henvendelse(r)'
                },
                success: {
                    title: '{count} henvendelse(r) sendt',
                    titleDefault: 'Synkronisering fuldført'
                },
                error: {
                    title: '{count} mislykkedes',
                    description: 'Gennemgå og prøv igen'
                },
                pending: {
                    title: 'Henvendelser klar til afsendelse'
                }
            },
            report: 'henvendelse | henvendelser',
            syncNow: 'Send nu'
        },
        toast: {
            went_offline: 'Forbindelse mistet',
            went_offline_description: 'Henvendelser gemmes lokalt.',
            back_online: 'Online igen',
            back_online_description: 'Forbindelse genoprettet.',
            syncing: 'Synkroniserer...',
            syncing_description: 'Synkroniserer {count} henvendelse(r).',
            sync_complete: 'Synkronisering fuldført',
            sync_complete_description: 'Alle henvendelser er blevet sendt.',
            sync_failed: 'Synkronisering mislykkedes',
            sync_failed_description: '{count} henvendelse(r) kunne ikke sendes.'
        },
        status: {
            offline: 'Offline',
            syncing: 'Synkroniserer...',
            pending: '{count} afventer',
            synced: 'Synkroniseret'
        },
        sync: {
            title: 'Synkroniseringsstatus',
            syncNow: 'Synkroniser nu',
            syncing: 'Synkroniserer...',
            offlineWarning: 'Du er offline. Henvendelser synkroniseres, når forbindelsen genoprettes.',
            pendingCount: '{count} henvendelse(r) venter på synkronisering',
            readyToSync: 'Klar til synkronisering',
            waitingForConnection: 'Venter på forbindelse',
            failedItems: 'Mislykkede indsendelser',
            untitledRequest: 'Unavngiven henvendelse',
            unknownError: 'Ukendt fejl',
            attempts: '{count} forsøg',
            retry: 'Prøv igen',
            delete: 'Slet',
            allSynced: 'Alle henvendelser synkroniseret',
            lastSync: 'Sidste synkronisering',
            syncSuccess: '{count} henvendelse(r) synkroniseret',
            syncFailed: '{count} henvendelse(r) kunne ikke synkroniseres',
            retrySuccess: 'Henvendelse synkroniseret',
            retryFailed: 'Kunne ikke synkronisere henvendelse',
            itemDeleted: 'Henvendelse fjernet fra kø',
            queuedSuccess: 'Henvendelse gemt',
            willSyncWhenOnline: 'Sendes når forbindelsen genoprettes.',
            queueFailed: 'Kunne ikke gemme henvendelse til senere'
        },
        failed: {
            title: 'Mislykkede indsendelser',
            description: 'Disse henvendelser kunne ikke sendes og kræver din opmærksomhed.',
            empty: 'Ingen mislykkede indsendelser',
            validation_error: 'Kræver rettelse',
            server_error: 'Serverfejl',
            edit: 'Rediger',
            retry: 'Prøv igen',
            delete: 'Slet',
            confirm_delete: 'Er du sikker på, at du vil slette denne henvendelse? Dette kan ikke fortrydes.',
            untitled: 'Unavngiven henvendelse',
            view_failed: 'Vis mislykkede'
        },
        form: {
            unavailable_title: 'Formular utilgængelig offline',
            unavailable_description: 'Henvendelsesformularen kræver en internetforbindelse for at indlæse. Opret forbindelse til internettet og prøv igen.',
            retry: 'Prøv igen',
            go_back: 'Gå tilbage',
            waiting_for_connection: 'Venter på forbindelse...'
        }
    },
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
    sentiment: {
        frustrated: 'Frustrated',
        neutral: 'Neutral',
        positive: 'Positive'
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
    error: {
        form_error_fallback: 'An error occurred while loading the form. Please try again.',
        404: {
            title: 'Siden blev ikke fundet',
            description: 'Siden du leder efter findes ikke eller er blevet flyttet.'
        },
        403: {
            title: 'Adgang nægtet',
            description: 'Du har ikke tilladelse til at se denne side.'
        },
        500: {
            title: 'Noget gik galt',
            description: 'Der opstod en uventet fejl. Prøv igen.'
        },
        fallback: {
            title: 'Fejl',
            description: 'Der opstod en uventet fejl.'
        },
        actions: {
            back: 'Tilbage',
            home: 'Til forsiden',
            retry: 'Prøv igen'
        }
    },
    legal: {
        impressum: {
            title: 'Juridisk meddelelse',
            heading: 'Juridisk meddelelse',
            responsible_heading: 'Ansvarlig for indholdet',
            responsible_text: '{name} er ansvarlig for indholdet af denne platform.'
        },
        privacy: {
            title: 'Privatlivspolitik',
            heading: 'Privatlivspolitik',
            intro: 'Beskyttelsen af dine personlige data er vigtig for os. Vi behandler kun dine data på grundlag af lovbestemmelser (GDPR).',
            controller_heading: 'Dataansvarlig',
            data_heading: 'Indsamlede data',
            data_text: 'Ved brug af denne platform behandles følgende data: placeringsdata for indberetningen, beskrivelsestekst, uploadede fotos og tekniske adgangsdata (IP-adresse, browsertype, adgangstidspunkt).',
            rights_heading: 'Dine rettigheder',
            rights_text: 'Du har ret til indsigt, berigtigelse, sletning, begrænsning af behandling, dataportabilitet og indsigelse.'
        },
        terms: {
            title: 'Brugsbetingelser',
            heading: 'Brugsbetingelser',
            intro: 'Ved at bruge denne platform accepterer du følgende betingelser.',
            purpose_heading: 'Formål',
            purpose_text: 'Denne platform tjener til at indberette problemer i det offentlige rum. Indberetninger videresendes til den ansvarlige myndighed.',
            obligations_heading: 'Brugerpligter',
            obligations_text: 'Du accepterer kun at angive sandfærdige oplysninger og ikke at uploade ulovligt indhold. Uploadede fotos må ikke vise genkendelige personer uden deres samtykke.',
            liability_heading: 'Ansvar',
            liability_text: '{name} påtager sig intet ansvar for fuldstændigheden og nøjagtigheden af de angivne oplysninger.'
        },
        email_label: 'E-mail',
        contact_label: 'Kontakt',
        platform: {
            heading: 'Platformoperatør',
            intro: 'Denne platform drives teknisk af:',
            description: 'Civic Patches GmbH leverer den tekniske infrastruktur til Mark-a-Spot platformen.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Tyskland',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operatør af dette kort',
            not_configured: 'Operatøren af dette kort har endnu ikke angivet sine juridiske oplysninger. Operatører af offentligt tilgængelige onlinetjenester kan være forpligtet til at give et kolofon og en privatlivspolitik.'
        },
        footer: {
            impressum: 'Juridisk meddelelse',
            privacy: 'Privatliv',
            terms: 'Brugsbetingelser'
        },
        not_configured: 'Operatørdata er endnu ikke konfigureret.'
    },
    demo_mode: {
        banner: {
            title: 'Demoinstans',
            message: 'Indberetninger her videresendes ikke til nogen myndighed.',
            link_label: 'Besøg mark-a-spot.com',
            minimize_label: 'Minimer demo-advarsel',
            expand_label: 'Udvid demo-advarsel'
        },
        reset: {
            title: 'Demodatabase',
            notice: 'Demosystemet nulstilles hver time.',
            countdown_label: 'Næste nulstilling om',
            countdown_aria: 'Næste nulstilling af demodatabasen om {time}'
        },
        modal: {
            title: 'Demoindsendelse',
            body: 'Dette er en demo. Din indberetning vil IKKE blive videresendt til kommunen. Fortsæt med demoindsendelsen?',
            confirm_label: 'Indsend demoindberetning',
            cancel_label: 'Annuller'
        },
        lite: {
            title: 'Kun demo',
            heading: 'Demoinstans',
            body: 'Dette er en demonstration af Mark-a-Spot. Indsendelser via den enkle formular er deaktiveret her, så rigtige indberetninger aldrig utilsigtet når en kommune.',
            link_label: 'Besøg mark-a-spot.com'
        }
    },
    print: {
        title: 'Serviceanmodningsrapport',
        description: 'Beskrivelse',
        location: 'Placering',
        media: 'Medier',
        image_unavailable: 'Image unavailable',
        attributes: 'Ekstra felter',
        status_history: 'Statushistorik',
        internal_fields: 'Intern information',
        organisation: 'Afdeling',
        hazard_level: 'Fareniveau',
        hazard_category: 'Farekategori',
        sentiment: 'Stemning',
        printed_at: 'Udskrevet',
        showing_recent: 'Viser {count} af {total} opdateringer'
    }
};
