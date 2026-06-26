// locales/nb.ts
export default {
    locale: {
        code: 'nb-NO'
    },
    meta: {
        description: 'Mark-a-Spot-grensesnitt'
    },
    // CAP (Common Alerting Protocol) hazard severity levels and categories
    // https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html
    hazard: {
        levels: {
            unknown: 'Ukjent',
            minor: 'Mindre',
            moderate: 'Moderat',
            severe: 'Alvorlig',
            extreme: 'Ekstrem'
        },
        categories: {
            Infra: 'Infrastruktur',
            Transport: 'Transport',
            Safety: 'Offentlig sikkerhet',
            Env: 'Miljø',
            Fire: 'Brann',
            Health: 'Helse',
            Geo: 'Geofysisk',
            Met: 'Meteorologisk',
            Other: 'Annet'
        }
    },
    // AI-detected sentiment from service request descriptions
    sentiment: {
        frustrated: 'Frustrert',
        neutral: 'Nøytral',
        positive: 'Positiv'
    },
    nav: {
        map: 'Kart',
        dashboard: 'Dashbord',
        back_to_frontend: 'Tilbake til kartet'
    },
    dashboard: {
        title: 'Dashbord',
        welcome: 'Velkommen, {name}',
        nav: {
            dashboard: 'Dashbord',
            requests: 'Meldinger',
            metrics: 'Måltall',
            settings: 'Innstillinger',
            categories: 'Kategorier',
            status: 'Status',
            jurisdictions: 'Områder',
            languages: 'Språk',
            billing: 'Fakturering'
        },
        help: {
            docs: 'Dokumentasjon',
            support: 'Kontakt support'
        },
        settings: {
            languages_title: 'Språkinnstillinger',
            languages_description: 'Velg hvilke språk som er tilgjengelige, og hvilket språk som vises som standard for besøkende i dette arbeidsrommet.',
            languages_available: 'Tilgjengelige språk',
            languages_default: 'Standardspråk',
            languages_saved: 'Språkinnstillingene er lagret.',
            languages_min_one: 'Minst ett språk må være valgt.'
        },
        user: {
            profile: 'Profil',
            logout: 'Logg ut'
        },
        jurisdiction: {
            current: 'Arbeidsrom',
            citizenView: 'Innbyggervisning',
            switchTo: 'Bytt til',
            blocked: 'blokkert',
            admin_section_header: 'Alle arbeidsrom (administratortilgang)'
        },
        stats: {
            total: 'Meldinger totalt',
            pending: 'Venter',
            in_progress: 'Under behandling',
            resolved: 'Løst',
            my_groups: 'Mine grupper',
            overall: 'Totalt'
        },
        recent_requests: 'Siste meldinger',
        view_all: 'Vis alle',
        no_recent: 'Ingen nylige meldinger',
        wms: {
            title: 'Kartlag',
            attribution: 'Data: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Medier',
                category: 'Kategori',
                status: 'Status',
                created: 'Opprettet'
            }
        }
    },
    form: {
        // Form field labels
        body: 'Beskrivelse',
        body_description: 'Gi en detaljert beskrivelse',
        body_placeholder: 'Skriv inn en beskrivelse...',
        body_ai_description: 'Automatisk generert fra bildet ditt. Du kan redigere teksten.',
        body_ai_placeholder: 'Genererer tekst fra bildet...',

        category: 'Kategori',
        category_description: 'Velg riktig kategori for meldingen',
        category_placeholder: 'Velg en kategori',
        category_disabled: {
            title: 'Kategori valgt',
            description: 'Du har valgt kategorien "{category}". Denne kategorien har egne krav eller tillater ikke videre redigering av skjemaet.'
        },
        category_empty: 'Ingen kategorier tilgjengelig',
        category_loading: 'Laster kategorier...',
        category_disabled_notice: 'Denne kategorien er kun til informasjon. Innsending er ikke mulig.',
        category_description_loading: 'Laster beskrivelse...',
        category_description_error: 'Kunne ikke laste beskrivelse',

        email: 'E-post',
        email_description: 'Kontakt-e-posten din',
        email_placeholder: 'Skriv inn e-postadressen din',

        first_name: 'Fornavn',
        first_name_description: 'Fornavnet ditt',
        first_name_placeholder: 'Skriv inn fornavnet ditt',

        last_name: 'Etternavn',
        last_name_description: 'Etternavnet ditt',
        last_name_placeholder: 'Skriv inn etternavnet ditt',

        gdpr: 'Samtykke til personvern',
        gdpr_description: 'Jeg samtykker til behandling av dataene mine slik det er beskrevet i personvernerklæringen.',

        object_id: 'Objekt-ID',
        object_id_description: 'Identifikator for objektet som meldes inn',
        object_id_placeholder: 'Skriv inn objekt-ID (f.eks. stolpenummer)',

        phone: 'Telefonnummer',
        phone_description: 'Kontakttelefonnummeret ditt',
        phone_placeholder: 'Skriv inn telefonnummeret ditt',

        // Anleggbasert rapportering
        facility: 'Anlegg',
        facility_plural: 'Anlegg',
        facility_placeholder: 'Velg {label}',
        facility_required: '{label} er påkrevd.',
        facility_unavailable: 'Det valgte anlegget er ikke lenger tilgjengelig, velg på nytt.',
        facility_nearest_snapped: 'Nærmeste anlegg: {label}',
        facility_no_nearby: 'Ingen anlegg i nærheten, velg manuelt.',
        facility_use_my_location: 'Bruk min posisjon',
        facility_locating: 'Henter posisjon…',
        facility_no_match: 'Ingen anlegg samsvarer med søket ditt.',
        facility_opens_in_new_tab: '(åpnes i ny fane)',
        facility_deselected_map_pick: 'Bruker din egen plassering i stedet for {label}',
        facility_tagged_with: 'Ved: {label}',

        // Imagelist
        imagelist: {
            empty: 'Ingen bilder tilgjengelig for denne typen.'
        },

        // Form-first mode
        back_to_report: 'Tilbake til meldeskjemaet',

        // Form requirements indicator
        requirements: {
            title: 'Mangler fortsatt',
            ready_to_submit: 'Klar til innsending',
            photo: 'Last opp et bilde',
            category: 'Velg en kategori',
            location: 'Oppgi posisjon',
            description: 'Skriv inn en beskrivelse',
            email: 'Oppgi e-postadresse',
            privacy: 'Godta personvernerklæringen',
            privacyBlock: 'Bytt ut eller fjern det personvernsensitive bildet',
            conditional: 'avhengig av kategori'
        }
    },
    validation: {
        // Validation error messages
        body_required: 'Beskrivelse er påkrevd',
        category_required: 'Kategori er påkrevd',
        email_required: 'E-post er påkrevd',
        email_format: 'Ugyldig e-postformat',
        first_name_required: 'Fornavn er påkrevd',
        last_name_required: 'Etternavn er påkrevd',
        gdpr_required: 'Du må godta personvernvilkårene',
        object_id_required: 'Objekt-ID er påkrevd',
        phone_required: 'Telefonnummer er påkrevd',
        required_field: '{field} er påkrevd'
    },
    feedback: {
        page_title: 'Tilbakemelding på serviceforespørsel',
        error_title: 'Lastefeil',
        invalid_request: 'Ugyldig eller utløpt serviceforespørsel',
        thank_you: 'Takk for tilbakemeldingen!',
        submission_received: 'Tilbakemeldingen din er mottatt',
        loading: 'Laster serviceforespørsel...',
        title: 'Tilbakemelding for: {service}',
        description: 'Gi tilbakemelding',
        placeholder: 'Skriv tilbakemeldingen din her...',
        reopen_request: 'Jeg vil at denne serviceforespørselen åpnes igjen',
        submitting: 'Sender inn...',
        sending: 'Sender...',
        submit: 'Send tilbakemelding',
        existing_title: 'Din tilbakemelding for: {service}',
        already_submitted: 'Du har allerede sendt tilbakemelding for denne serviceforespørselen',
        missing_uuid: 'Mangler tjeneste-ID',
        success_notification: 'Tilbakemelding sendt',
        success_with_id: 'Tilbakemelding sendt for forespørsel #{id}',
        updated_successfully: 'Tilbakemelding oppdatert',
        added_to_list: 'Serviceforespørselen er lagt til i listen din',
        submission_error: 'Kunne ikke sende tilbakemelding',
        server_error: 'Serverfeil: tilbakemeldingen kunne ikke behandles akkurat nå',
        submission_failed: 'Kunne ikke sende tilbakemelding. Prøv igjen senere',
        already_exists: 'Det finnes allerede tilbakemelding for denne serviceforespørselen',
        error_fetching_request: 'Kunne ikke laste detaljene for serviceforespørselen',
        no_content: 'Ingen tilbakemeldingstekst',
        refresh_complete: 'Forespørselslisten er oppdatert',
        try_again: 'Prøv igjen',
        format_unrecognized: 'Formatet på serviceforespørselen gjenkjennes ikke',
        processing_error: 'Feil ved behandling av data for serviceforespørselen',
        your_feedback: 'Din tilbakemelding',
        contact_preference: 'Kontaktpreferanse',
        no_contact: 'Ingen kontakt',
        email_contact: 'Kontakt via e-post',
        email_placeholder: 'E-postadressen din',
        set_status_open: 'Sett status til åpen',
        set_status_open_description: 'Hvis du vil at vi skal se på dette igjen, kan du åpne serviceforespørselen på nytt.',
        email_verification: 'E-postbekreftelse',
        email_verification_placeholder: 'E-postadressen fra den opprinnelige meldingen',
        email_verification_description: 'Skriv inn e-postadressen du brukte da du opprettet den opprinnelige meldingen.',
        email_mismatch: 'Den angitte e-postadressen samsvarer ikke med den opprinnelige meldingen.',
        unauthorized_access: 'Uautorisert tilgang. Sjekk e-postadressen din.',
        not_eligible: 'Denne serviceforespørselen kan ikke motta tilbakemelding akkurat nå',
        dialog_description: 'Dialog for tilbakemeldingsskjema',
        service_provider: {
            // Page and modal titles
            page_title: 'Tjenesteleverandørens svar',
            page_description: 'Send fullføringsnotater for tildelte serviceforespørsler',
            modal_title: 'Tjenesteleverandørens svar',
            dialog_description: 'Dialog for tjenesteleverandørens svarskjema',

            // Form fields
            title: 'Fullfør oppdrag',
            your_email: 'E-postadressen din',
            email_placeholder: 'provider{\'@\'}example.com',
            email_verification_note: 'Skriv inn e-postadressen din hos tjenesteleverandøren for bekreftelse',
            completion_notes: 'Fullføringsnotater',
            notes_placeholder: 'Beskriv arbeidet som er utført...',
            mark_as_completed: 'Merk som fullført',
            mark_as_completed_description: 'Sett forespørselens status til fullført',
            mark_completed_description: 'Bekreft at arbeidet er fullført',

            // Buttons
            submit_completion: 'Send fullføring',
            complete_request: 'Fullfør oppdrag',
            completing: 'Sender inn...',

            // Success and error messages
            completion_success: 'Fullføring av serviceforespørsel sendt',
            submission_failed: 'Kunne ikke sende fullføring. Prøv igjen senere',
            server_error: 'Serverfeil: fullføringen kunne ikke behandles akkurat nå',
            completion_not_allowed: 'Denne forespørselen kan ikke fullføres nå',
            email_verification_failed: 'E-postbekreftelsen mislyktes. Sjekk e-postadressen din',
            already_completed: 'Denne forespørselen er allerede fullført',

            // Loading and validation
            loading: 'Laster serviceforespørsel...',
            try_again: 'Prøv igjen',
            invalid_uuid: 'Ugyldig eller utløpt serviceforespørsel',
            load_error: 'Kunne ikke laste detaljer for serviceforespørselen',
            error_fetching_request: 'Kunne ikke laste detaljene for serviceforespørselen',
            completion_notes_required: 'Oppgi fullføringsnotater',

            // Multiple completions
            existing_completions: 'Tidligere fullføringer',
            reassignment_note: 'Denne forespørselen er merket for omfordeling og kan motta flere fullføringer'
        }
    },
    service_provider: {
        page_title: 'Tjenesteleverandørens svar',
        page_description: 'Send fullføringsnotater for tildelte serviceforespørsler',
        modal_title: 'Tjenesteleverandørens svar',
        dialog_description: 'Dialog for tjenesteleverandørens svarskjema',
        title: 'Fullfør oppdrag',
        your_email: 'E-postadressen din',
        email_placeholder: 'provider{\'@\'}example.com',
        email_verification_note: 'Skriv inn e-postadressen din hos tjenesteleverandøren for bekreftelse',
        completion_notes: 'Fullføringsnotater',
        notes_placeholder: 'Beskriv arbeidet som er utført...',
        mark_as_completed: 'Merk som fullført',
        mark_as_completed_description: 'Sett forespørselens status til fullført',
        submit_completion: 'Send fullføring',
        complete_request: 'Fullfør oppdrag',
        completing: 'Sender inn...',
        completion_success: 'Fullføring av serviceforespørsel sendt',
        submission_failed: 'Kunne ikke sende fullføring. Prøv igjen senere',
        server_error: 'Serverfeil: fullføringen kunne ikke behandles akkurat nå',
        completion_not_allowed: 'Denne forespørselen kan ikke fullføres nå',
        email_verification_failed: 'E-postbekreftelsen mislyktes. Sjekk e-postadressen din',
        already_completed: 'Denne forespørselen er allerede fullført',
        loading: 'Laster serviceforespørsel...',
        try_again: 'Prøv igjen',
        invalid_uuid: 'Ugyldig eller utløpt serviceforespørsel',
        load_error: 'Kunne ikke laste detaljer for serviceforespørselen',
        error_fetching_request: 'Kunne ikke laste detaljene for serviceforespørselen',
        completion_notes_required: 'Oppgi fullføringsnotater',
        existing_completions: 'Tidligere fullføringer',
        reassignment_note: 'Denne forespørselen er merket for omfordeling og kan motta flere fullføringer'
    },
    contact: {
        title: 'Kontakt',
        dialog_description: 'Kontaktskjema',
        name: 'Navn',
        name_placeholder: 'Navnet ditt',
        email: 'E-post',
        email_placeholder: 'E-postadressen din',
        message: 'Melding',
        message_placeholder: 'Meldingen din...',
        copy_label: 'Send en kopi til e-postadressen min',
        gdpr_label: 'Jeg samtykker til behandling av dataene mine',
        gdpr_required: 'Godta databehandlingen',
        submit: 'Send melding',
        sending: 'Sender...',
        success_title: 'Melding sendt',
        success_message: 'Takk for meldingen. Vi tar kontakt så snart som mulig.',
        submission_failed: 'Meldingen kunne ikke sendes. Prøv igjen senere.',
        flood_error: 'For mange forespørsler. Prøv igjen senere.',
        required_field: '{field} er påkrevd',
        invalid_email: 'Skriv inn en gyldig e-postadresse',
        close: 'Lukk',
        new_message: 'Ny melding'
    },
    service_unavailable: {
        title: 'Tjenesten er midlertidig utilgjengelig',
        message: 'Vi får ikke kontakt med tjenestene våre akkurat nå. Dette er sannsynligvis midlertidig.',
        retry: 'Vi har tekniske problemer. Prøv igjen om {seconds} sekunder.',
        auto_retry: 'Prøver igjen om {seconds} sekunder...',
        retry_now: 'Prøv nå',
        try_later: 'Prøv igjen senere.',
        reload: 'Last inn på nytt'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Din melding. Vår løsning.'
    },
    hiddenSection: {
        description:
          'Meldetjenesten vår er et system for infrastrukturproblemer. Du kan gå direkte til å melde inn problemer eller navigere til følgende:',
        main_navigation:
          'Hovednavigasjon med informasjon, meldingsliste og statistikk',
        map:
          'Interaktivt kart med visuelle markører',
        map_navigation_hint:
          'Bruk piltastene ⬆️⬇️⬅️➡️ for å navigere mellom meldingsmarkører, ↩️ Enter for å velge, ❌ Escape for å fjerne valget',
        action_button:
          'Meld inn direkte',
        keyboard_navigation_hint: 'Bruk piltastene for å navigere, Enter for å aktivere',
        skip_to_main_content: 'Hopp til hovedinnhold'
    },
    accessibility: {
        skip_to_main: 'Hopp til hovedinnhold',
        skip_to_map: 'Hopp til kart',
        skip_to_navigation: 'Hopp til navigasjon',
        skip_to_form: 'Meld inn direkte',
        leichte_sprache_indicator: 'Klarspråk, enkle tekster for alle'
    },
    common: {
        back: 'Tilbake',
        not_classified: 'Ikke klassifisert',
        no_value: 'Ingen verdi',
        close: 'Lukk',
        loading: 'Laster...',
        error: 'Feil',
        success: 'Fullført',
        submit: 'Send inn',
        cancel: 'Avbryt',
        required: 'Påkrevd',
        save: 'Lagre',
        delete: 'Slett',
        edit: 'Rediger',
        clear: 'Tøm',
        search: 'Søk',
        select: 'Velg',
        on: 'På',
        off: 'Av',
        toggle: 'Veksle',
        yesterday: 'I går',
        did_you_know: 'Visste du det?',
        show_more: 'Vis mer',
        show_less: 'Vis mindre',
        learn_more: 'Les mer',
        learn_more_about: 'Les mer om {topic}',
        opens_in_new_tab: '(åpnes i ny fane)',
        title: {
            classic: 'Klassisk melding',
            photo: 'Bildemelding'
        },
        buttons: {
            toggle_theme: 'Bytt tema',
            attribution: 'Kartkreditering',
            close: 'Lukk'
        },
        navigation: 'Navigasjonspanel',
        drawer_description: 'Innholds- og valgpanel',
        resize_drawer: 'Endre panelstørrelse',
        drawer_position_n_of_total: 'posisjon {idx} av {total}',
        share: 'Del',
        copy_coordinates: 'Kopier koordinater',
        open_in_maps: 'Åpne i kart',
        current: 'Nåværende'
    },
    fields: {
        field_geolocation: 'Posisjon',
        field_gdpr: 'Samtykke til databehandling',
        field_e_mail: 'E-post',
        field_category: 'Kategori',
        field_request_media: 'Bilder',
        field_name: 'Etternavn',
        field_prename: 'Fornavn',
        field_first_name: 'Fornavn',
        field_first_name_placeholder: 'Skriv inn fornavn',
        field_last_name: 'Etternavn',
        field_last_name_placeholder: 'Skriv inn etternavn',
        field_phone: 'Telefon',
        body: 'Beskrivelse',
        field_add_data: 'Konkurransedeltakelse',
        field_terms_of_use: 'Jeg godtar vilkårene og personvernerklæringen.',
        field_address: 'Adresse',
        postal_code: 'Postnummer',
        postal_code_placeholder: 'f.eks. 10001',
        city: 'By',
        city_placeholder: 'f.eks. New York',
        street_address: 'Gateadresse',
        street_address_placeholder: 'f.eks. Main Street 123'
    },
    competition: {
        intro: 'Hvis du ønsker det, kan du delta i vår årlige trekning. Du har mulighet til å vinne attraktive premier og pengepremier som vi deler ut blant alle deltakere som en liten takk.',
        disclaimer: 'Ansatte i ansvarlige avdelinger kan ikke delta.',
        title: 'Konkurransedeltakelse',
        errors: {
            already_exists: 'Konkurransedeltakelse finnes allerede',
            duplicate_found: 'Duplikat funnet',
            duplicate_detail: 'Det er allerede opprettet en konkurransedeltakelse for denne meldingen.',
            not_found: 'Melding ikke funnet',
            not_found_detail: 'Den tilknyttede meldingen ble ikke funnet.',
            save_failed: 'Konkurransedeltakelsen kunne ikke lagres',
            submission_error: 'Innsendingsfeil',
            submission_error_detail: 'Konkurransedeltakelsen din kunne ikke lagres, men meldingen din ble sendt.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Informasjonsfane',
                panel_label: 'Informasjonspanel'
            },
            list: {
                label: 'Liste',
                aria_label: 'Fane for meldingsliste',
                panel_label: 'Panel for meldingsliste'
            },
            following: {
                label: 'Følger',
                aria_label: 'Fane for fulgte meldinger',
                panel_label: 'Panel for fulgte meldinger'
            },
            stats: {
                label: 'Statistikk',
                aria_label: 'Statistikkfane',
                panel_label: 'Statistikkpanel'
            }
        },
        main: 'Hovednavigasjon',
        pages: 'Sidenavigasjon',
        browse_reports: 'Bla gjennom meldinger',
        back_to_form: 'Tilbake til skjemaet',
        panel: {
            scrollable: 'Rullbart område'
        },
        updates_count: '{count} nye oppdateringer'
    },
    report: {
        form_types: 'Meldingstyper',
        how_to_help: 'Slik oppretter du en melding',
        title: {
            photo: 'Bildemelding',
            classic: 'Klassisk melding',
            submit: 'Send inn melding',
            edit: 'Rediger melding',
            view: 'Vis melding'
        },
        photo: {
            description: 'Opprett en ny melding med bilde'
        },
        classic: {
            description: 'Opprett en ny melding uten bilde'
        },
        status: {
            new: 'Ny',
            open: 'Åpen',
            in_progress: 'Under behandling',
            resolved: 'Løst',
            closed: 'Lukket',
            unknown: 'Ukjent status'
        },
        form: {
            modal_description: 'Opprett en ny melding',
            tabs: {
                photo: 'Med bilde',
                classic: 'Klassisk'
            },
            description: {
                label: 'Beskrivelse',
                placeholder: 'Beskriv problemet...',
                ai_processing: 'KI genererer en beskrivelse...',
                help: 'Gi så mange detaljer som mulig'
            },
            category: {
                label: 'Kategori',
                placeholder: 'Velg en kategori',
                loading: 'Laster kategorier...',
                error: 'Kunne ikke laste kategorier',
                empty: 'Ingen kategorier tilgjengelig',
                help: 'Kategori velges automatisk',
                description: 'Kategoribeskrivelse',
                description_loading: 'Laster beskrivelse...',
                description_error: 'Kunne ikke laste beskrivelse',
                disabled_notice: 'Denne kategorien er kun til informasjon. Innsending er ikke mulig.'
            },
            location: {
                label: 'Posisjon',
                placeholder: 'Søk etter en posisjon...',
                selected: 'Posisjon valgt',
                clear: 'Fjern posisjon',
                error: 'Kunne ikke hente posisjon',
                help: 'Skriv inn en adresse eller klikk på kartet',
                help_modal: 'Skriv inn en adresse eller bruk din nåværende posisjon',
                current: 'Bruk nåværende posisjon',
                searching: 'Søker...',
                pick_on_map: 'Velg på kartet',
                auto_detected: 'Posisjon funnet',
                complete_address: 'Fullstendig adresse',
                from_photo_exif: 'Posisjon ble automatisk hentet fra bildets metadata',
                warning: 'Posisjonsvarsel',
                unknown_location: 'Ukjent posisjon',
                suggestions: 'Posisjonsforslag'
            },
            email: {
                label: 'E-post for oppdateringer',
                placeholder: 'Skriv inn e-postadressen din',
                help: 'Vi sender deg oppdateringer om meldingen din',
                subscribe: 'Abonner på oppdateringer'
            },
            gdpr: {
                label: 'Samtykke til databehandling',
                description:
          'Jeg samtykker til behandling av dataene mine i henhold til personvernerklæringen.',
                required: 'Du må samtykke for å fortsette',
                link: 'Vis personvernerklæring'
            },
            media: {
                label: 'Bilder',
                required: 'Et bilde er påkrevd for denne kategorien',
                upload: {
                    overall_progress: 'Samlet fremdrift',
                    button: 'Klikk for å laste opp',
                    or: ' eller',
                    drag: 'dra og slipp',
                    drop_here: 'Slipp filer her for å laste opp',
                    restrictions: 'Opptil {count} bilder (maks {size}, {types})',
                    restrictions_single: 'Ett bilde (maks {size}, {types})',
                    progress: 'Opplastingsfremdrift',
                    started_sr: 'Opplasting startet',
                    progress_sr: 'Opplasting {progress} % fullført',
                    success_sr: 'Opplasting fullført',
                    error_sr: 'Opplasting mislyktes: {error}',
                    files_selected_sr: '{count} filer valgt for opplasting',
                    description: 'Last opp bilder ved å klikke, trykke eller dra filer hit. Støttede formater: JPEG, PNG, GIF.',
                    area_label: 'Bildeopplastingsområde, klikk for å velge filer eller dra og slipp',
                    in_progress: 'Opplasting pågår',
                    complete_sr: 'Filen er lastet opp.'
                },
                preview: 'Bildeforhåndsvisning',
                remove: 'Fjern bilde',
                no_image_available: 'Ingen bilde tilgjengelig eller vises ikke av juridiske grunner',
                progress: 'Opplastingsfremdrift: {progress} %',
                limit_reached: 'Maksimalt antall bilder ({count}) er nådd',
                privacy_notice: 'Unngå personer og bilskilt i bilder',
                offline_cached: 'Lagret frakoblet',
                ai_analysis: 'Analyse med Azure AI (Tyskland)',
                ai_analysis_help: 'Informasjon om KI-analyse',
                ai_analysis_tooltip: 'Ved å laste opp bekrefter du at bildet er tatt lovlig og ikke krenker tredjeparts rettigheter.\n\nHvis personer eller bilskilt kan gjenkjennes, må du gjøre dem ugjenkjennelige før opplasting.\n\nAnalysen brukes bare til å kategorisere meldingen din. Bare en redusert, EXIF-fri kopi sendes til Azure OpenAI (Tyskland); originalen sendes ikke til tjenesten.'
            },
            submit: {
                button: 'Send inn melding',
                submitting: 'Sender inn...',
                processing: 'Behandler...',
                success: 'Melding sendt',
                error: 'Feil ved innsending av melding',
                loading: 'Laster skjema...'
            },
            loading: 'Laster meldeskjema...',
            draft_saved: 'Utkast lagret'
        },
        ai: {
            label: 'AI',
            powered: 'KI-drevet',
            analyzing: 'KI analyserer bildene dine...',
            started_sr: 'KI-analyse startet',
            complete_sr: 'KI-analysen ble fullført',
            field_updated_sr: '{field} er oppdatert med: {value}',
            analysis_complete_sr: 'KI-analyse fullført.',
            category_result_sr: 'Kategori valgt: {category}.',
            description_result_sr: 'Beskrivelse generert: {description}',
            location_result_sr: 'Posisjon funnet: {location}.',
            category_hint: 'Dette bildet ser ikke ut til å samsvare med rapportkategoriene våre. Velg en kategori selv.',
            processing: {
                analyzing: 'Spør KI...',
                location: 'Sjekker bildemetadata...',
                location_found: 'Posisjon funnet:',
                location_ai: 'Finner posisjon i bildet...',
                location_not_found: 'Fant ikke posisjon i bildemetadata.',
                location_complete: 'Posisjon identifisert',
                category: 'Identifiserer kategori...',
                category_found: 'Kategori identifisert:',
                category_not_matched: 'Kategori foreslått av KI (må velges)',
                description: 'Genererer beskrivelse...',
                description_complete: 'Beskrivelse generert',
                attributes_filled: '{count} ekstra felt forhåndsutfylt',
                complete: 'KI-analyse fullført',
                error: 'Feil under KI-analyse',
                privacy_warning: 'Personvernbekymring oppdaget'
            },
            privacy: {
                title: 'Personvernmerknad',
                description: 'Personopplysninger kan ha blitt oppdaget i bildet ditt ({issues}). Bildet blir gjennomgått før publisering.',
                required: 'Det ble oppdaget personvernsensitivt innhold i dette bildet som ikke kan sladdes automatisk. Bildet kan ikke brukes. Bytt det ut eller fjern det for å fortsette.',
                removePhoto: 'Fjern bilde',
                replace: 'Bytt bilde',
                understood: 'Fortsett med dette bildet'
            },
            failed: {
                title: 'Bildeanalyse er ikke tilgjengelig',
                description: 'Bildet ditt blir gjennomgått manuelt før publisering. Du kan fortsatt sende inn meldingen.'
            },
            budget_exhausted_title: 'KI-analyse hoppet over',
            budget_exhausted_submitted: 'Budsjettet for KI-analyse denne måneden er brukt opp. Meldingen din ble sendt inn.'
        },
        buttons: {
            photo: 'Bildemelding',
            classic: 'Klassisk melding',
            follow: 'Følg melding',
            following: 'Følger',
            share: 'Del melding',
            print: 'Skriv ut',
            flag: 'Rapporter',
            flag_submitted: 'Allerede rapportert',
            copy_link: 'Kopier lenke',
            link_copied: 'Lenke kopiert til utklippstavlen',
            email: 'E-post',
            directions: 'Få veibeskrivelse'
        },
        following: {
            count: 'Følger {count} meldinger',
            mark_all_read: 'Merk alle som lest',
            no_reports: 'Ingen fulgte meldinger ennå',
            no_address: 'Ingen adresse tilgjengelig',
            status_updated: 'Status oppdatert',
            status_changed: 'Status endret til:',
            awaiting_server: 'Venter på oppdatering',
            escalated_to: 'Videresendt til {jurisdiction}',
            escalated_click: 'Trykk for å åpne i nytt område',
            unavailable: 'Denne meldingen er ikke tilgjengelig akkurat nå. Sjekk e-posten din for detaljer eller kontakt oss.',
            date: {
                today: 'I dag',
                tomorrow: 'I morgen',
                yesterday: 'I går',
                unknown: 'Ukjent dato'
            }
        }
    },
    map: {
        tap_to_load: 'Trykk for å vise kart',
        tap_to_select_location: 'Trykk på kartet for å velge posisjon',
        loading: 'Laster kart...',
        loading_address: 'Laster adresse...',
        retry_attempt: 'Forsøk {count}',
        confirm_location: 'Bekreft posisjon',
        add_report_here: 'Legg til melding her',
        controls: {
            zoom: 'Zoomkontroller',
            zoom_in: 'Zoom inn',
            zoom_out: 'Zoom ut',
            find_location: 'Finn posisjonen min',
            toggle_heatmap: 'Vis eller skjul varmekart',
            toggle_language: 'Endre språk',
            add_report_here: 'Meld her',
            adjust_tilt: 'Juster helling',
            degrees: '{count} grader',
            layers: 'Kartlag',
            no_layers: 'Ingen lag tilgjengelig',
            geolocation: {
                label: 'Hent nåværende posisjon'
            }
        },
        pick: {
            drag_hint: 'Dra markøren for å justere posisjonen'
        },
        tooltip: {
            label: 'Kartmarkørinformasjon',
            opens_form_above: 'Åpner skjemaet over',
            opens_modal: 'Åpnes i dialog'
        },
        keyboard: {
            canvasInstructions: 'Interaktivt kart med meldingsmarkører. Piltaster navigerer mellom markører, Skift+piltast panorerer kartet, Enter velger. Trykk Ctrl+= for å zoome inn, Ctrl+- for å zoome ut.',
            noFeatures: 'Ingen markører synlige i gjeldende kartvisning. Prøv å zoome inn eller panorere for å finne markører.',
            zoomedIntoCluster: 'Zoomet inn i gruppeområde. Bruk piltaster for å navigere mellom markører.',
            clusterFocused: 'Gruppe med {count} meldinger i fokus. Trykk Enter for å utvide. {position}',
            clusterExpanded: 'Gruppe utvidet til {count} meldinger. {featureLabel}',
            markerFocused: 'Melding i fokus: {name} ved {address}{context}. Trykk Enter for å åpne detaljer. {position}',
            expandedContext: ' (utvidet fra gruppe)',
            untitledReport: 'Melding uten tittel',
            unknownLocation: 'posisjon',
            featurePosition: 'Element {current} av {total}.',
            pannedToExplore: 'Kartet panorert {direction}. Slipp Skift og bruk piltaster for å navigere markører.',
            pannedNoMarkers: 'Kartet panorert {direction}. Ingen markører funnet i denne retningen. Bruk piltaster for å fortsette utforskningen.'
        }
    },
    detail: {
        dialog_description: 'Vis meldingsdetaljer',
        location: 'Posisjon',
        photos: 'Bilder',
        description: 'Beskrivelse',
        status_history: 'Statushistorikk',
        updates: 'Oppdateringer',
        no_updates: 'Ingen oppdateringer ennå',
        edit: 'Rediger',
        follow: {
            button: 'Følg',
            following: 'Følger',
            stop: 'Slutt å følge',
            success: 'Du følger nå denne meldingen',
            error: 'Feil ved følging av melding',
            updating: 'Oppdaterer...'
        },
        unavailable: {
            title: 'Melding ikke tilgjengelig',
            message: 'Denne meldingen finnes ikke eller er ennå ikke publisert. Nylig innsendte meldinger kan ta litt tid før de vises.'
        }
    },
    pages: {
        dialog_description: 'Vis sideinnhold'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Fordeling',
        total_reports: 'Meldinger totalt',
        status_distribution: 'Statusfordeling',
        category_distribution: 'Kategorifordeling',
        uncategorized: 'Ukategorisert',
        showing_reports: 'Viser {visible} av {total} meldinger',
        no_reports: 'Ingen meldinger tilgjengelig',
        open_reports: 'Åpne meldinger',
        closed_reports: 'Lukkede meldinger',
        no_data_available: 'Ingen data tilgjengelig',
        expand: 'Vis detaljer',
        collapse: 'Skjul detaljer',
        subcategory: 'underkategori',
        subcategories: 'underkategorier'
    },
    time: {
        days_ago: 'for {count} dager siden',
        just_now: 'Akkurat nå',
        minutes_ago: 'for {count} minutter siden',
        hours_ago: 'for {count} timer siden',
        yesterday: 'I går',
        today: 'I dag'
    },
    list: {
        showing: 'Viser {visible} av {total} meldinger',
        showing_in_area: 'Viser {visible} i dette området, {total} totalt',
        showing_area_only: 'Viser {visible} i dette området',
        no_results: 'Ingen meldinger funnet',
        no_filtered_results: 'Ingen meldinger samsvarer med filterkriteriene dine',
        load_more: 'Alle meldinger er lastet',
        load_more_button: 'Last inn mer',
        newest_first: 'Nyeste først',
        oldest_first: 'Eldste først',
        refresh: 'Oppdater',
        status_update: 'Status oppdatert',
        location: 'Posisjon',
        unpublished: 'Ikke publisert',
        editable: 'Redigerbar'
    },
    error: {
        form_error_fallback: 'Det oppstod en feil ved lasting av skjemaet. Prøv igjen.',
        404: {
            title: 'Siden ble ikke funnet',
            description: 'Siden du leter etter finnes ikke eller er flyttet.'
        },
        403: {
            title: 'Ingen tilgang',
            description: 'Du har ikke tillatelse til å se denne siden.'
        },
        500: {
            title: 'Noe gikk galt',
            description: 'Det oppstod en uventet feil. Prøv igjen.'
        },
        fallback: {
            title: 'Feil',
            description: 'Det oppstod en uventet feil.'
        },
        actions: {
            back: 'Tilbake',
            home: 'Til forsiden',
            retry: 'Prøv igjen'
        }
    },
    errors: {
        general: 'Noe gikk galt',
        search_failed: 'Søket mislyktes. Prøv igjen.',
        api: {
            rate_limit: 'For mange forespørsler. Vent litt og prøv igjen.',
            unauthorized: 'Ikke autorisert. Logg inn igjen.',
            forbidden: 'Tilgang nektet.',
            not_found: 'Ressursen ble ikke funnet.',
            server_error: 'Serverfeil. Prøv igjen senere.',
            default: 'API-feil: {status}'
        },
        upload_failed: 'Opplasting mislyktes',
        location_error: 'Kunne ikke bestemme posisjon',
        network_error: 'Nettverksfeil',
        geolocation: {
            title: 'Posisjonsfeil',
            permission_denied: 'Posisjonstillatelse avvist. Tillat tilgang i nettleserinnstillingene.',
            unavailable: 'Posisjonsinformasjon er ikke tilgjengelig akkurat nå.',
            timeout: 'Posisjonsforespørselen tidsavbrøt.',
            unknown: 'Det oppstod en ukjent posisjonsfeil.'
        },
        try_again: 'Prøv igjen',
        validation: {
            title: 'Beklager, vi kan ikke behandle denne forespørselen:',
            location_error_title: 'Posisjonsfeil',
            invalid_input: 'Ugyldig inndata',
            duplicate_title: 'Duplikat funnet',
            duplicate_found: 'Lignende melding funnet',
            duplicate_report: 'En lignende melding er allerede opprettet (nr. {reportId})',
            duplicate_hint_title: 'Mulig duplikat funnet',
            duplicate_hint_message: 'Det kan allerede finnes en lignende melding i dette området. Du kan likevel sende inn hvis du mener dette er et nytt problem.',
            duplicate_existing_report: 'Eksisterende melding: nr. {reportId}',
            view_existing_report: 'Vis eksisterende melding',
            submit_anyway: 'Send inn likevel',
            location_out_of_bounds: 'Valgt posisjon er utenfor vårt område',
            required_field: '{field} er påkrevd',
            required_fields: 'Fyll ut alle obligatoriske felt',
            please_review: 'Se gjennom skjemaet og rett eventuelle feil før innsending.',
            file_size: 'Den valgte filen er for stor (maks 10 MB)',
            file_type: 'Formatet støttes ikke (tillatt: jpg, png, webp)',
            media_upload: 'Feil ved opplasting av bilde',
            invalid_format: 'Ugyldig format for {field}',
            photo_required: 'Et bilde er påkrevd for denne kategorien',
            consent_required: 'Godta personvernerklæringen'
        },
        rate_limit: {
            title: 'Rategrense overskredet',
            general: 'Prøv igjen senere.',
            with_time: 'Prøv igjen om {seconds} sekunder.'
        },
        network: 'Tilkoblingsproblem. Sjekk internettforbindelsen din',
        timeout: 'Tidsavbrudd. Prøv igjen',
        upload: {
            title: 'Opplastingsfeil',
            invalid_type: 'Ugyldig filtype. Last bare opp bilder.',
            file_too_large: 'Filen er for stor. Maksimal størrelse er {size}.',
            file_too_large_raw: 'Filen er for stor (maks {size}). Velg et mindre bilde.',
            optimization_failed: 'Bildet kunne ikke komprimeres. Maksimal størrelse etter komprimering: {size}.',
            dimensions_too_large: 'Bildedimensjonene er for store. Maksimum {width}x{height} piksler.',
            invalid_image: 'Ugyldig eller skadet bildefil.',
            failed: 'Opplasting mislyktes. Prøv igjen.',
            limit_reached: 'Maksimalt antall filer ({count}) er nådd.',
            remove_to_add: 'Fjern et bilde for å legge til et nytt',
            single_file_limit: 'Bare ett bilde kan lastes opp.',
            exact_file_limit: 'Maksimalt {count} bilder kan lastes opp.'
        },
        submission_error: 'Feil ved innsending eller opplasting av bildet.',
        unknown: 'Det oppstod en ukjent feil.',
        pending_uploads: 'Vent til alle opplastinger er fullført.',
        incomplete_form: 'Fyll ut alle obligatoriske felt.',
        page: {
            title: 'Feil',
            not_found_title: 'Siden ble ikke funnet',
            not_found_message: 'Beklager, siden du leter etter finnes ikke.',
            server_error_title: 'Serverfeil',
            server_error_message: 'Beklager, noe gikk galt på serveren vår.',
            generic_title: 'Feil oppstod',
            generic_message: 'Det har oppstått en uventet feil.',
            action_home: 'Gå til forsiden',
            action_back: 'Gå tilbake',
            action_retry: 'Prøv igjen',
            details: 'Feildetaljer'
        }
    },
    success: {
        report_submitted: 'Melding sendt',
        report_submitted_description: 'Meldingen din er sendt og blir snart gjennomgått.',
        moderation_notice:
      'Meldingen din blir gjennomgått før publisering. Referansenummeret ditt:',
        submit_another: 'Send inn en ny melding',
        auto_followed: 'Denne meldingen er automatisk lagt til i meldingene du følger',
        visibility_limitation_notice: 'Merk at ikke alle meldinger blir offentlig synlige på nettstedet. Hvis meldingen din ikke oppdateres i listen over fulgte meldinger, kan den likevel ha blitt behandlet av kommunen. Sjekk e-posten din for statusoppdateringer.',
        fun_facts: [
            '🌱 Hver melding du sender inn, bidrar til å gjøre byen din bedre å bo i.',
            '🏙️ Innbyggermeldinger har bidratt til å løse over 10 000 problemer i byer verden over.',
            '⚡ En melding blir i snitt vurdert innen 24 timer.',
            '🤝 Du er del av et fellesskap som bryr seg om offentlige rom.',
            '📊 Data fra innbyggermeldinger hjelper byplanleggere med å ta bedre beslutninger.',
            '🔄 Når du følger meldingene dine, får du automatisk oppdateringer om fremdriften.',
            '🎯 Bildemeldinger behandles tre ganger raskere enn rene tekstmeldinger.',
            '🌍 Slike innbyggerplattformer finnes i over 50 land.',
            '💡 Tilbakemeldingen din bidrar til å prioritere hvilke problemer som løses først.',
            '🚀 Digital innmelding har redusert responstiden med opptil 60 prosent.',
            '🏆 Engasjerte innbyggere gjør lokalsamfunn sterkere og mer robuste.',
            '🔍 KI-analyse hjelper med å kategorisere meldingene dine mer presist.',
            '📱 Mobil rapportering gjør det enkelt å melde inn problemer når du ser dem.',
            '⭐ Takk for at du engasjerer deg.'
        ]
    },
    flag: {
        title: 'Rapporter denne meldingen',
        description: 'Hjelp oss å opprettholde kvaliteten ved å rapportere upassende innhold.',
        reason_label: 'Hvorfor rapporterer du denne meldingen?',
        reason_spam: 'Spam eller reklame',
        reason_offensive: 'Støtende eller upassende innhold',
        reason_personal: 'Inneholder personlige data',
        reason_location: 'Feil plassering',
        reason_other: 'Annet',
        details_label: 'Ytterligere detaljer',
        details_placeholder: 'Vennligst beskriv problemet...',
        details_required: 'Vennligst oppgi detaljer',
        submit: 'Send inn',
        success: 'Takk. Vi vil gjennomgå denne meldingen.',
        error: 'Kunne ikke sende. Vennligst prøv igjen.',
        already_flagged: 'Du har allerede rapportert denne meldingen.'
    },

    pwa: {
        install: {
            title: 'Installer app',
            button: 'Installer',
            not_now: 'Ikke nå',
            description:
        'Installer appen ved å klikke på installasjonsikonet i nettleserens adresselinje.',
            share_button: 'Delingsikon',
            open_safari: 'Safari-nettleser',
            ios: {
                title: 'Legg til på hjemskjermen',
                safari_instructions:
          'Trykk på {icon} og velg "Legg til på hjemskjermen".',
                other_instructions:
          'Åpne dette nettstedet i {browser} for å installere.'
            },
            chrome: {
                instructions:
          'Installer appen ved å klikke på installasjonsikonet {icon} i verktøylinjen.'
            },
            edge: {
                instructions:
          'Klikk på installasjonsikonet {icon} i adresselinjen.'
            },
            firefox: {
                instructions:
          'Klikk på hjem-ikonet {icon} i adresselinjen.'
            }
        }
    },
    boundaries: {
        loading: 'Laster grensedata...',
        error: 'Kunne ikke validere posisjonsgrensene. Prøv igjen senere.',
        notLoaded: 'Grenser er ikke lastet inn ennå',
        outsideNonStrict: 'Merk: valgt posisjon er utenfor grensene til {locationName}.',
        outsideStrict: 'Valgt posisjon er utenfor grensene til {locationName}. Velg en posisjon innenfor bygrensen.',
        validationUnavailable: 'Grensevalidering er ikke tilgjengelig. Meldingen din blir mottatt, men kan bli gjennomgått.'
    },
    filters: {
        title: 'Filtre',
        status: {
            title: 'Status'
        },
        time: {
            title: 'Tid',
            today: 'I dag',
            week: 'Denne uken',
            month: 'Denne måneden'
        },
        category: {
            title: 'Kategori',
            other: 'Annet'
        },
        actions: {
            more: 'Flere filtre',
            expand: 'Flere filtre',
            collapse: 'Mindre',
            clear_all: 'Tøm alle',
            active_count: '{count} filtre aktive',
            toggle: 'Filtre'
        }
    },
    privacy: {
        notice_text: 'Informasjon om personvern finnes',
        notice_link_text: 'her',
        modal: {
            title: 'Personvernerklæring',
            loading: 'Laster personverninformasjon...',
            retry: 'Prøv igjen',
            noContent: 'Ingen personverninformasjon tilgjengelig.',
            lastUpdated: 'Sist oppdatert',
            close: 'Lukk'
        }
    },
    search: {
        placeholder: 'Søk i meldinger...',
        no_results_local: 'Ingen resultater funnet i gjeldende visning',
        expand_to_server: 'Søk i alle meldinger',
        expand_hint: 'Søk utenfor gjeldende visning',
        searching_server: 'Søker i alle meldinger...'
    },
    info: {
        welcome: {
            heading: 'Velkommen til {name}',
            headingGeneric: 'Velkommen',
            body: 'Bruk dette kartet til å melde problemer eller finne eksisterende meldinger i ditt område.'
        },
        shortcuts: {
            aria_label: 'Hurtighandlinger',
            photo: {
                title: 'Foto',
                description: 'Ta et bilde, AI tar seg av resten',
                aria_label: 'Opprett en fotomelding'
            },
            classic: {
                title: 'Klassisk',
                description: 'Beskriv og lokaliser problemet',
                aria_label: 'Opprett en klassisk melding'
            },
            following: {
                title: 'Følg',
                description: 'Hold deg oppdatert på fremdriften',
                aria_label: 'Åpne fulgte meldinger'
            },
            list: {
                title: 'Utforsk',
                description: 'Se hva som skjer i nærheten',
                aria_label: 'Utforsk kartet og vis listen'
            }
        }
    },
    auth: {
        login: {
            title: 'Logg inn',
            subtitle: 'Skriv inn e-posten din for å motta en bekreftelseskode',
            email_label: 'E-postadresse',
            email_hint: 'Vi sender deg en 6-sifret kode',
            email_placeholder: 'e-postadresse',
            send_code: 'Send bekreftelseskode',
            disabled: {
                title: 'Innlogging ikke tilgjengelig',
                message: 'Passordløs innlogging er ikke aktivert her. Kontakt administratoren hvis du trenger tilgang.',
                back_button: 'Tilbake til forsiden'
            }
        },
        verify: {
            email_label: 'E-postadresse',
            code_label: 'Bekreftelseskode',
            code_hint: 'Skriv inn den 6-sifrede koden fra e-posten din',
            code_placeholder: '123456',
            verify_button: 'Bekreft og logg inn',
            back_button: 'Bruk en annen e-post',
            request_new: 'Be om ny kode',
            resend_code: 'Send kode på nytt',
            expires_in: 'Koden utløper om {time}',
            expired_title: 'Koden er utløpt',
            expired_message: 'Bekreftelseskoden din er utløpt. Be om en ny.'
        },
        code_sent: {
            title: 'Kode sendt',
            message: 'Vi har sendt en 6-sifret bekreftelseskode til {email}'
        },
        error: {
            title: 'Autentiseringsfeil',
            request_failed: 'Kunne ikke sende bekreftelseskode. Prøv igjen.',
            verify_failed: 'Ugyldig eller utløpt bekreftelseskode',
            sso_failed: 'Innlogging mislyktes. Prøv igjen.',
            network: 'Nettverksfeil. Sjekk tilkoblingen din.',
            logout_failed: 'Kunne ikke logge ut. Prøv igjen.'
        },
        sso: {
            completing: 'Fullfører innlogging...',
            method_label: 'Single sign-on',
            button_aria: 'Logg inn med {provider} via single sign-on'
        },
        user: {
            logged_in_as: 'Logget inn som',
            logout: 'Logg ut'
        },
        welcome: {
            greeting: 'Hei, {name}',
            sign_in: 'Logg inn',
            sign_out: 'Logg ut',
            user_avatar: 'Brukeravatar'
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
            title: 'Utseende',
            color_mode: 'Fargemodus',
            light: 'Lys',
            dark: 'Mørk',
            system: 'System',
            theme_override: 'Egendefinerte temafarger',
            theme_override_description: 'Overstyr standardtemaet for området med dine egne fargevalg',
            primary_color: 'Primærfarge',
            secondary_color: 'Sekundærfarge',
            neutral_color: 'Nøytral farge',
            reset_theme: 'Tilbakestill til standard'
        },
        language: {
            title: 'Språk',
            select: 'Velg språk',
            save_failed: 'Kunne ikke lagre språkinnstillingen. Prøv igjen.'
        }
    },
    offline: {
        banner: {
            title: 'Du er frakoblet',
            description: 'Meldinger lagres lokalt og synkroniseres senere.',
            pending: '{count} meldinger venter',
            dismiss: 'Lukk',
            states: {
                offline: {
                    title: 'Du er frakoblet',
                    description: 'Meldinger lagres lokalt'
                },
                syncing: {
                    title: 'Synkroniserer...',
                    description: 'Sender {count} meldinger'
                },
                success: {
                    title: '{count} meldinger sendt',
                    titleDefault: 'Synkronisering fullført'
                },
                error: {
                    title: '{count} mislyktes',
                    description: 'Se gjennom og prøv igjen'
                },
                pending: {
                    title: 'Meldinger klare til sending'
                }
            },
            report: 'melding | meldinger',
            syncNow: 'Send nå'
        },
        toast: {
            went_offline: 'Tilkoblingen ble brutt',
            went_offline_description: 'Meldinger lagres lokalt.',
            back_online: 'Tilkoblet igjen',
            back_online_description: 'Tilkoblingen er gjenopprettet.',
            syncing: 'Synkroniserer...',
            syncing_description: 'Synkroniserer {count} meldinger.',
            sync_complete: 'Synkronisering fullført',
            sync_complete_description: 'Alle meldinger er sendt.',
            sync_failed: 'Synkronisering mislyktes',
            sync_failed_description: '{count} meldinger kunne ikke sendes.'
        },
        status: {
            offline: 'Frakoblet',
            syncing: 'Synkroniserer...',
            pending: '{count} venter',
            synced: 'Synkronisert'
        },
        sync: {
            title: 'Synkroniseringsstatus',
            syncNow: 'Synkroniser nå',
            syncing: 'Synkroniserer...',
            offlineWarning: 'Du er frakoblet. Meldinger synkroniseres når tilkoblingen er tilbake.',
            pendingCount: '{count} meldinger venter på synkronisering',
            readyToSync: 'Klar til synkronisering',
            waitingForConnection: 'Venter på tilkobling',
            failedItems: 'Mislykkede innsendinger',
            untitledRequest: 'Melding uten tittel',
            unknownError: 'Ukjent feil',
            attempts: '{count} forsøk',
            retry: 'Prøv igjen',
            delete: 'Slett',
            allSynced: 'Alle meldinger er synkronisert',
            lastSync: 'Siste synkronisering',
            syncSuccess: '{count} meldinger synkronisert',
            syncFailed: '{count} meldinger kunne ikke synkroniseres',
            retrySuccess: 'Meldingen er synkronisert',
            retryFailed: 'Kunne ikke synkronisere meldingen',
            itemDeleted: 'Meldingen er fjernet fra køen',
            queuedSuccess: 'Meldingen er lagret',
            willSyncWhenOnline: 'Sendes når tilkoblingen er tilbake.',
            queueFailed: 'Kunne ikke lagre meldingen til senere'
        },
        failed: {
            title: 'Mislykkede innsendinger',
            description: 'Disse meldingene kunne ikke sendes og trenger oppmerksomhet.',
            empty: 'Ingen mislykkede innsendinger',
            validation_error: 'Må korrigeres',
            server_error: 'Serverfeil',
            edit: 'Rediger',
            retry: 'Prøv igjen',
            delete: 'Slett',
            confirm_delete: 'Er du sikker på at du vil slette denne meldingen? Dette kan ikke angres.',
            untitled: 'Melding uten tittel',
            view_failed: 'Vis mislykket'
        },
        form: {
            unavailable_title: 'Skjemaet er ikke tilgjengelig frakoblet',
            unavailable_description: 'Meldeskjemaet krever internettforbindelse for å lastes. Koble til internett og prøv igjen.',
            retry: 'Prøv igjen',
            go_back: 'Gå tilbake',
            waiting_for_connection: 'Venter på tilkobling...'
        }
    },
    legal: {
        impressum: {
            title: 'Juridisk informasjon',
            heading: 'Juridisk informasjon',
            responsible_heading: 'Ansvarlig for innhold',
            responsible_text: '{name} er ansvarlig for innholdet på denne plattformen.'
        },
        privacy: {
            title: 'Personvernerklæring',
            heading: 'Personvernerklæring',
            intro: 'Beskyttelsen av personopplysningene dine er viktig for oss. Vi behandler dataene dine utelukkende på grunnlag av lovbestemmelser (GDPR).',
            controller_heading: 'Behandlingsansvarlig',
            data_heading: 'Innsamlede data',
            data_text: 'Når denne plattformen brukes, behandles følgende data: posisjonsdata for meldingen, beskrivelsestekst, opplastede bilder og tekniske tilgangsdata (IP-adresse, nettlesertype, tilgangstidspunkt).',
            rights_heading: 'Dine rettigheter',
            rights_text: 'Du har rett til innsyn, retting, sletting, begrensning av behandling, dataportabilitet og innsigelse.'
        },
        terms: {
            title: 'Bruksvilkår',
            heading: 'Bruksvilkår',
            intro: 'Ved å bruke denne plattformen godtar du følgende vilkår.',
            purpose_heading: 'Formål',
            purpose_text: 'Denne plattformen brukes til å melde inn problemer i offentlige rom. Meldinger videresendes til ansvarlig myndighet.',
            obligations_heading: 'Brukerens plikter',
            obligations_text: 'Du godtar å oppgi bare sannferdige opplysninger og ikke laste opp ulovlig innhold. Opplastede bilder må ikke vise identifiserbare personer uten deres samtykke.',
            liability_heading: 'Ansvar',
            liability_text: '{name} tar ikke ansvar for at opplysningene er fullstendige eller korrekte.'
        },
        email_label: 'E-post',
        contact_label: 'Kontakt',
        platform: {
            heading: 'Plattformoperatør',
            intro: 'Denne plattformen driftes teknisk av:',
            description: 'Civic Patches GmbH leverer den tekniske infrastrukturen for Mark-a-Spot-plattformen.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Germany',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operatør av dette kartet',
            not_configured: 'Operatøren av dette kartet har ennå ikke oppgitt juridisk informasjon. Operatører av offentlig tilgjengelige nettjenester kan være pålagt å oppgi juridisk informasjon og personvernerklæring.'
        },
        footer: {
            impressum: 'Juridisk informasjon',
            privacy: 'Personvern',
            terms: 'Bruksvilkår'
        },
        not_configured: 'Operatørdata er ikke konfigurert ennå.'
    },
    demo_mode: {
        banner: {
            title: 'Demoinstans',
            message: 'Meldinger her videresendes ikke til noen myndighet.',
            link_label: 'Besøk mark-a-spot.com',
            minimize_label: 'Minimer demovarsel',
            expand_label: 'Utvid demovarsel'
        },
        reset: {
            title: 'Demodatabase',
            notice: 'Demosystemet tilbakestilles hver time.',
            countdown_label: 'Neste tilbakestilling om',
            countdown_aria: 'Neste tilbakestilling av demodatabasen om {time}'
        },
        modal: {
            title: 'Demoinnsending',
            body: 'Dette er en demo. Meldingen din vil IKKE bli videresendt til kommunen. Vil du fortsette med demoinnsendingen?',
            confirm_label: 'Send inn demomelding',
            cancel_label: 'Avbryt'
        },
        lite: {
            title: 'Kun demo',
            heading: 'Demoinstans',
            body: 'Dette er en demonstrasjon av Mark-a-Spot. Innsending via det enkle skjemaet er deaktivert her slik at ekte meldinger aldri utilsiktet når en kommune.',
            link_label: 'Besøk mark-a-spot.com'
        }
    },
    print: {
        title: 'Rapport om tjenesteforespørsel',
        description: 'Beskrivelse',
        location: 'Sted',
        media: 'Medier',
        image_unavailable: 'Image unavailable',
        attributes: 'Ekstra felt',
        status_history: 'Statushistorikk',
        internal_fields: 'Intern informasjon',
        organisation: 'Avdeling',
        hazard_level: 'Farenivå',
        hazard_category: 'Farekategori',
        sentiment: 'Stemning',
        printed_at: 'Skrevet ut',
        showing_recent: 'Viser {count} av {total} oppdateringer'
    }
};
