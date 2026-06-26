// locales/sv.ts
export default {
    locale: {
        code: 'sv-SE'
    },
    meta: {
        description: 'Mark-a-Spot-gränssnitt'
    },
    // CAP (Common Alerting Protocol) hazard severity levels and categories
    // https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html
    hazard: {
        levels: {
            unknown: 'Okänd',
            minor: 'Mindre',
            moderate: 'Måttlig',
            severe: 'Allvarlig',
            extreme: 'Extrem'
        },
        categories: {
            Infra: 'Infrastruktur',
            Transport: 'Transport',
            Safety: 'Allmän säkerhet',
            Env: 'Miljö',
            Fire: 'Brand',
            Health: 'Hälsa',
            Geo: 'Geofysisk',
            Met: 'Meteorologisk',
            Other: 'Annat'
        }
    },
    // AI-detected sentiment from service request descriptions
    sentiment: {
        frustrated: 'Frustrerad',
        neutral: 'Neutral',
        positive: 'Positiv'
    },
    nav: {
        map: 'Karta',
        dashboard: 'Instrumentpanel',
        back_to_frontend: 'Tillbaka till kartan'
    },
    dashboard: {
        title: 'Instrumentpanel',
        welcome: 'Välkommen, {name}',
        nav: {
            dashboard: 'Instrumentpanel',
            requests: 'Anmälningar',
            metrics: 'Mått',
            settings: 'Inställningar',
            categories: 'Kategorier',
            status: 'Status',
            jurisdictions: 'Områden',
            languages: 'Språk',
            billing: 'Fakturering'
        },
        help: {
            docs: 'Dokumentation',
            support: 'Kontakta support'
        },
        settings: {
            languages_title: 'Språkinställningar',
            languages_description: 'Välj vilka språk som är tillgängliga och vilket språk som visas som standard för besökare i den här arbetsytan.',
            languages_available: 'Tillgängliga språk',
            languages_default: 'Standardspråk',
            languages_saved: 'Språkinställningarna har sparats.',
            languages_min_one: 'Minst ett språk måste vara valt.'
        },
        user: {
            profile: 'Profil',
            logout: 'Logga ut'
        },
        jurisdiction: {
            current: 'Arbetsyta',
            citizenView: 'Medborgarvy',
            switchTo: 'Byt till',
            blocked: 'blockerat',
            admin_section_header: 'Alla arbetsytor (administratörsåtkomst)'
        },
        stats: {
            total: 'Anmälningar totalt',
            pending: 'Väntar',
            in_progress: 'Pågår',
            resolved: 'Löst',
            my_groups: 'Mina grupper',
            overall: 'Totalt'
        },
        recent_requests: 'Senaste anmälningar',
        view_all: 'Visa alla',
        no_recent: 'Inga senaste anmälningar',
        wms: {
            title: 'Kartlager',
            attribution: 'Data: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Medier',
                category: 'Kategori',
                status: 'Status',
                created: 'Skapad'
            }
        }
    },
    form: {
        // Form field labels
        body: 'Beskrivning',
        body_description: 'Ge en detaljerad beskrivning',
        body_placeholder: 'Skriv en beskrivning...',
        body_ai_description: 'Automatiskt genererad från ditt foto. Du kan redigera texten.',
        body_ai_placeholder: 'Genererar text från fotot...',

        category: 'Kategori',
        category_description: 'Välj rätt kategori för din anmälan',
        category_placeholder: 'Välj en kategori',
        category_disabled: {
            title: 'Kategori vald',
            description: 'Du har valt kategorin "{category}". Den här kategorin har särskilda krav eller tillåter inte ytterligare redigering av formuläret.'
        },
        category_empty: 'Inga kategorier tillgängliga',
        category_loading: 'Läser in kategorier...',
        category_disabled_notice: 'Den här kategorin är endast för information. Det går inte att skicka in.',
        category_description_loading: 'Läser in beskrivning...',
        category_description_error: 'Kunde inte läsa in beskrivningen',

        email: 'E-post',
        email_description: 'Din kontakt-e-post',
        email_placeholder: 'Ange din e-postadress',

        first_name: 'Förnamn',
        first_name_description: 'Ditt förnamn',
        first_name_placeholder: 'Ange ditt förnamn',

        last_name: 'Efternamn',
        last_name_description: 'Ditt efternamn',
        last_name_placeholder: 'Ange ditt efternamn',

        gdpr: 'Samtycke till dataskydd',
        gdpr_description: 'Jag samtycker till behandlingen av mina uppgifter enligt integritetspolicyn.',

        object_id: 'Objekt-ID',
        object_id_description: 'Identifierare för det rapporterade objektet',
        object_id_placeholder: 'Ange objekt-ID (t.ex. stolpnummer)',

        phone: 'Telefonnummer',
        phone_description: 'Ditt kontakttelefonnummer',
        phone_placeholder: 'Ange ditt telefonnummer',

        // Anläggningsbaserad rapportering
        facility: 'Anläggning',
        facility_plural: 'Anläggningar',
        facility_placeholder: 'Välj {label}',
        facility_required: '{label} är obligatoriskt.',
        facility_unavailable: 'Den valda anläggningen är inte längre tillgänglig, välj igen.',
        facility_nearest_snapped: 'Närmaste anläggning: {label}',
        facility_no_nearby: 'Ingen anläggning i närheten, välj manuellt.',
        facility_use_my_location: 'Använd min plats',
        facility_locating: 'Platsen hämtas…',
        facility_no_match: 'Inga anläggningar matchar din sökning.',
        facility_opens_in_new_tab: '(öppnas i ny flik)',
        facility_deselected_map_pick: 'Använder din plats istället för {label}',
        facility_tagged_with: 'Vid: {label}',

        // Imagelist
        imagelist: {
            empty: 'Inga bilder finns tillgängliga för den här typen.'
        },

        // Form-first mode
        back_to_report: 'Tillbaka till anmälningsformuläret',

        // Form requirements indicator
        requirements: {
            title: 'Kvar att fylla i',
            ready_to_submit: 'Klar att skicka',
            photo: 'Ladda upp ett foto',
            category: 'Välj en kategori',
            location: 'Ange plats',
            description: 'Skriv en beskrivning',
            email: 'Ange e-postadress',
            privacy: 'Godkänn integritetspolicyn',
            privacyBlock: 'Ersätt eller ta bort det integritetskänsliga fotot',
            conditional: 'beroende på kategori'
        }
    },
    validation: {
        // Validation error messages
        body_required: 'Beskrivning krävs',
        category_required: 'Kategori krävs',
        email_required: 'E-post krävs',
        email_format: 'Ogiltigt e-postformat',
        first_name_required: 'Förnamn krävs',
        last_name_required: 'Efternamn krävs',
        gdpr_required: 'Du måste godkänna dataskyddsvillkoren',
        object_id_required: 'Objekt-ID krävs',
        phone_required: 'Telefonnummer krävs',
        required_field: '{field} krävs'
    },
    feedback: {
        page_title: 'Återkoppling på serviceärende',
        error_title: 'Inläsningsfel',
        invalid_request: 'Ogiltigt eller utgånget serviceärende',
        thank_you: 'Tack för din återkoppling!',
        submission_received: 'Din återkoppling har tagits emot',
        loading: 'Läser in serviceärende...',
        title: 'Återkoppling för: {service}',
        description: 'Ge din återkoppling',
        placeholder: 'Skriv din återkoppling här...',
        reopen_request: 'Jag vill att det här serviceärendet öppnas igen',
        submitting: 'Skickar...',
        sending: 'Skickar...',
        submit: 'Skicka återkoppling',
        existing_title: 'Din återkoppling för: {service}',
        already_submitted: 'Du har redan skickat återkoppling för det här serviceärendet',
        missing_uuid: 'Service-ID saknas',
        success_notification: 'Återkoppling skickad',
        success_with_id: 'Återkoppling skickad för ärende #{id}',
        updated_successfully: 'Återkoppling uppdaterad',
        added_to_list: 'Serviceärendet har lagts till i din lista',
        submission_error: 'Kunde inte skicka återkoppling',
        server_error: 'Serverfel: återkopplingen kunde inte behandlas just nu',
        submission_failed: 'Kunde inte skicka återkoppling. Försök igen senare',
        already_exists: 'Det finns redan återkoppling för det här serviceärendet',
        error_fetching_request: 'Kunde inte läsa in informationen om serviceärendet',
        no_content: 'Inget återkopplingsinnehåll',
        refresh_complete: 'Ärendelistan har uppdaterats',
        try_again: 'Försök igen',
        format_unrecognized: 'Serviceärendets format känns inte igen',
        processing_error: 'Fel vid behandling av serviceärendets data',
        your_feedback: 'Din återkoppling',
        contact_preference: 'Kontaktpreferens',
        no_contact: 'Ingen kontakt',
        email_contact: 'Kontakt via e-post',
        email_placeholder: 'Din e-postadress',
        set_status_open: 'Sätt status till öppen',
        set_status_open_description: 'Om du vill att vi ska titta på detta igen kan du öppna serviceärendet på nytt.',
        email_verification: 'E-postverifiering',
        email_verification_placeholder: 'E-postadressen från den ursprungliga anmälan',
        email_verification_description: 'Ange e-postadressen du använde när du skapade den ursprungliga anmälan.',
        email_mismatch: 'Den angivna e-postadressen matchar inte den ursprungliga anmälan.',
        unauthorized_access: 'Obehörig åtkomst. Kontrollera din e-postadress.',
        not_eligible: 'Det här serviceärendet kan inte ta emot återkoppling just nu',
        dialog_description: 'Dialogruta för återkopplingsformulär',
        service_provider: {
            // Page and modal titles
            page_title: 'Utförarens svar',
            page_description: 'Skicka slutförandeanteckningar för tilldelade serviceärenden',
            modal_title: 'Utförarens svar',
            dialog_description: 'Dialogruta för utförarens svarsformulär',

            // Form fields
            title: 'Slutför uppdrag',
            your_email: 'Din e-postadress',
            email_placeholder: 'provider{\'@\'}example.com',
            email_verification_note: 'Ange din e-postadress hos utföraren för verifiering',
            completion_notes: 'Slutförandeanteckningar',
            notes_placeholder: 'Beskriv arbetet som har slutförts...',
            mark_as_completed: 'Markera som slutförd',
            mark_as_completed_description: 'Sätt ärendets status till slutfört',
            mark_completed_description: 'Bekräfta att arbetet är slutfört',

            // Buttons
            submit_completion: 'Skicka slutförande',
            complete_request: 'Slutför uppdrag',
            completing: 'Skickar...',

            // Success and error messages
            completion_success: 'Slutförande av serviceärende skickat',
            submission_failed: 'Kunde inte skicka slutförandet. Försök igen senare',
            server_error: 'Serverfel: slutförandet kunde inte behandlas just nu',
            completion_not_allowed: 'Det här ärendet kan inte slutföras just nu',
            email_verification_failed: 'E-postverifieringen misslyckades. Kontrollera din e-postadress',
            already_completed: 'Det här ärendet har redan slutförts',

            // Loading and validation
            loading: 'Läser in serviceärende...',
            try_again: 'Försök igen',
            invalid_uuid: 'Ogiltigt eller utgånget serviceärende',
            load_error: 'Kunde inte läsa in information om serviceärendet',
            error_fetching_request: 'Kunde inte läsa in informationen om serviceärendet',
            completion_notes_required: 'Ange slutförandeanteckningar',

            // Multiple completions
            existing_completions: 'Tidigare slutföranden',
            reassignment_note: 'Det här ärendet har markerats för omfördelning och kan ta emot flera slutföranden'
        }
    },
    service_provider: {
        page_title: 'Utförarens svar',
        page_description: 'Skicka slutförandeanteckningar för tilldelade serviceärenden',
        modal_title: 'Utförarens svar',
        dialog_description: 'Dialogruta för utförarens svarsformulär',
        title: 'Slutför uppdrag',
        your_email: 'Din e-postadress',
        email_placeholder: 'provider{\'@\'}example.com',
        email_verification_note: 'Ange din e-postadress hos utföraren för verifiering',
        completion_notes: 'Slutförandeanteckningar',
        notes_placeholder: 'Beskriv arbetet som har slutförts...',
        mark_as_completed: 'Markera som slutförd',
        mark_as_completed_description: 'Sätt ärendets status till slutfört',
        submit_completion: 'Skicka slutförande',
        complete_request: 'Slutför uppdrag',
        completing: 'Skickar...',
        completion_success: 'Slutförande av serviceärende skickat',
        submission_failed: 'Kunde inte skicka slutförandet. Försök igen senare',
        server_error: 'Serverfel: slutförandet kunde inte behandlas just nu',
        completion_not_allowed: 'Det här ärendet kan inte slutföras just nu',
        email_verification_failed: 'E-postverifieringen misslyckades. Kontrollera din e-postadress',
        already_completed: 'Det här ärendet har redan slutförts',
        loading: 'Läser in serviceärende...',
        try_again: 'Försök igen',
        invalid_uuid: 'Ogiltigt eller utgånget serviceärende',
        load_error: 'Kunde inte läsa in information om serviceärendet',
        error_fetching_request: 'Kunde inte läsa in informationen om serviceärendet',
        completion_notes_required: 'Ange slutförandeanteckningar',
        existing_completions: 'Tidigare slutföranden',
        reassignment_note: 'Det här ärendet har markerats för omfördelning och kan ta emot flera slutföranden'
    },
    contact: {
        title: 'Kontakt',
        dialog_description: 'Kontaktformulär',
        name: 'Namn',
        name_placeholder: 'Ditt namn',
        email: 'E-post',
        email_placeholder: 'Din e-postadress',
        message: 'Meddelande',
        message_placeholder: 'Ditt meddelande...',
        copy_label: 'Skicka en kopia till min e-postadress',
        gdpr_label: 'Jag samtycker till behandlingen av mina uppgifter',
        gdpr_required: 'Godkänn databehandlingen',
        submit: 'Skicka meddelande',
        sending: 'Skickar...',
        success_title: 'Meddelande skickat',
        success_message: 'Tack för ditt meddelande. Vi återkommer så snart som möjligt.',
        submission_failed: 'Meddelandet kunde inte skickas. Försök igen senare.',
        flood_error: 'För många förfrågningar. Försök igen senare.',
        required_field: '{field} krävs',
        invalid_email: 'Ange en giltig e-postadress',
        close: 'Stäng',
        new_message: 'Nytt meddelande'
    },
    service_unavailable: {
        title: 'Tjänsten är tillfälligt otillgänglig',
        message: 'Vi kan inte ansluta till våra tjänster just nu. Det är troligen ett tillfälligt problem.',
        retry: 'Vi har tekniska problem. Försök igen om {seconds} sekunder.',
        auto_retry: 'Försöker igen om {seconds} sekunder...',
        retry_now: 'Försök nu',
        try_later: 'Försök igen senare.',
        reload: 'Läs in igen'
    },
    header: {
        logo_alt: 'Logotyp',
        app_name: 'Mark-a-Spot',
        app_claim: 'Din anmälan. Vår lösning.'
    },
    hiddenSection: {
        description:
          'Vår felanmälning är ett rapporteringssystem för infrastrukturproblem. Du kan gå direkt till att anmäla problem eller navigera till följande:',
        main_navigation:
          'Huvudnavigering med information, lista över anmälningar och statistik',
        map:
          'Interaktiv karta med visuella markörer',
        map_navigation_hint:
          'Använd piltangenterna ⬆️⬇️⬅️➡️ för att navigera mellan anmälningsmarkörer, ↩️ Enter för att välja, ❌ Escape för att rensa valet',
        action_button:
          'Anmäl direkt',
        keyboard_navigation_hint: 'Använd piltangenterna för att navigera, Enter för att aktivera',
        skip_to_main_content: 'Hoppa till huvudinnehåll'
    },
    accessibility: {
        skip_to_main: 'Hoppa till huvudinnehåll',
        skip_to_map: 'Hoppa till karta',
        skip_to_navigation: 'Hoppa till navigering',
        skip_to_form: 'Anmäl direkt',
        leichte_sprache_indicator: 'Lätt språk, enkla texter för alla'
    },
    common: {
        back: 'Tillbaka',
        not_classified: 'Inte klassificerad',
        no_value: 'Inget värde',
        close: 'Stäng',
        loading: 'Läser in...',
        error: 'Fel',
        success: 'Klart',
        submit: 'Skicka',
        cancel: 'Avbryt',
        required: 'Obligatoriskt',
        save: 'Spara',
        delete: 'Ta bort',
        edit: 'Redigera',
        clear: 'Rensa',
        search: 'Sök',
        select: 'Välj',
        on: 'På',
        off: 'Av',
        toggle: 'Växla',
        yesterday: 'Igår',
        did_you_know: 'Visste du?',
        show_more: 'Visa mer',
        show_less: 'Visa mindre',
        learn_more: 'Läs mer',
        learn_more_about: 'Läs mer om {topic}',
        opens_in_new_tab: '(öppnas i ny flik)',
        title: {
            classic: 'Klassisk anmälan',
            photo: 'Fotoanmälan'
        },
        buttons: {
            toggle_theme: 'Växla tema',
            attribution: 'Kartkällor',
            close: 'Stäng'
        },
        navigation: 'Navigationspanel',
        drawer_description: 'Innehålls- och alternativpanel',
        resize_drawer: 'Ändra panelstorlek',
        drawer_position_n_of_total: 'läge {idx} av {total}',
        share: 'Dela',
        copy_coordinates: 'Kopiera koordinater',
        open_in_maps: 'Öppna i kartor',
        current: 'Nuvarande'
    },
    fields: {
        field_geolocation: 'Plats',
        field_gdpr: 'Samtycke till databehandling',
        field_e_mail: 'E-post',
        field_category: 'Kategori',
        field_request_media: 'Foton',
        field_name: 'Efternamn',
        field_prename: 'Förnamn',
        field_first_name: 'Förnamn',
        field_first_name_placeholder: 'Ange förnamn',
        field_last_name: 'Efternamn',
        field_last_name_placeholder: 'Ange efternamn',
        field_phone: 'Telefon',
        body: 'Beskrivning',
        field_add_data: 'Tävlingsdeltagande',
        field_terms_of_use: 'Jag godkänner villkoren och integritetspolicyn.',
        field_address: 'Adress',
        postal_code: 'Postnummer',
        postal_code_placeholder: 't.ex. 10001',
        city: 'Stad',
        city_placeholder: 't.ex. New York',
        street_address: 'Gatuadress',
        street_address_placeholder: 't.ex. Main Street 123'
    },
    competition: {
        intro: 'Om du vill kan du delta i vår årliga utlottning. Du har chans att vinna fina priser och kontantbelöningar som vi delar ut bland alla deltagare som ett litet tack.',
        disclaimer: 'Anställda vid ansvariga avdelningar får inte delta.',
        title: 'Tävlingsdeltagande',
        errors: {
            already_exists: 'Tävlingsbidrag finns redan',
            duplicate_found: 'Dubblett hittades',
            duplicate_detail: 'Ett tävlingsbidrag har redan skapats för den här anmälan.',
            not_found: 'Anmälan hittades inte',
            not_found_detail: 'Den tillhörande anmälan kunde inte hittas.',
            save_failed: 'Tävlingsbidraget kunde inte sparas',
            submission_error: 'Inskicksfel',
            submission_error_detail: 'Ditt tävlingsbidrag kunde inte sparas, men din anmälan skickades.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Informationsflik',
                panel_label: 'Informationspanel'
            },
            list: {
                label: 'Lista',
                aria_label: 'Flik för anmälningslista',
                panel_label: 'Panel för anmälningslista'
            },
            following: {
                label: 'Följer',
                aria_label: 'Flik för följda anmälningar',
                panel_label: 'Panel för följda anmälningar'
            },
            stats: {
                label: 'Statistik',
                aria_label: 'Statistikflik',
                panel_label: 'Statistikpanel'
            }
        },
        main: 'Huvudnavigering',
        pages: 'Sidnavigering',
        browse_reports: 'Bläddra bland anmälningar',
        back_to_form: 'Tillbaka till formuläret',
        panel: {
            scrollable: 'Rullningsbart område'
        },
        updates_count: '{count} nya uppdateringar'
    },
    report: {
        form_types: 'Anmälningstyper',
        how_to_help: 'Så skapar du en anmälan',
        title: {
            photo: 'Fotoanmälan',
            classic: 'Klassisk anmälan',
            submit: 'Skicka anmälan',
            edit: 'Redigera anmälan',
            view: 'Visa anmälan'
        },
        photo: {
            description: 'Skapa en ny anmälan med foto'
        },
        classic: {
            description: 'Skapa en ny anmälan utan foto'
        },
        status: {
            new: 'Ny',
            open: 'Öppen',
            in_progress: 'Pågår',
            resolved: 'Löst',
            closed: 'Stängd',
            unknown: 'Okänd status'
        },
        form: {
            modal_description: 'Skapa en ny anmälan',
            tabs: {
                photo: 'Med foto',
                classic: 'Klassisk'
            },
            description: {
                label: 'Beskrivning',
                placeholder: 'Beskriv problemet...',
                ai_processing: 'AI genererar en beskrivning...',
                help: 'Ge så många detaljer som möjligt'
            },
            category: {
                label: 'Kategori',
                placeholder: 'Välj en kategori',
                loading: 'Läser in kategorier...',
                error: 'Kunde inte läsa in kategorier',
                empty: 'Inga kategorier tillgängliga',
                help: 'Kategori väljs automatiskt',
                description: 'Kategoribeskrivning',
                description_loading: 'Läser in beskrivning...',
                description_error: 'Kunde inte läsa in beskrivningen',
                disabled_notice: 'Den här kategorin är endast för information. Det går inte att skicka in.'
            },
            location: {
                label: 'Plats',
                placeholder: 'Sök efter en plats...',
                selected: 'Plats vald',
                clear: 'Rensa plats',
                error: 'Kunde inte hämta plats',
                help: 'Ange en adress eller klicka på kartan',
                help_modal: 'Ange en adress eller använd din nuvarande plats',
                current: 'Använd nuvarande plats',
                searching: 'Söker...',
                pick_on_map: 'Välj på kartan',
                auto_detected: 'Plats hittad',
                complete_address: 'Fullständig adress',
                from_photo_exif: 'Plats hämtades automatiskt från fotots metadata',
                warning: 'Platsvarning',
                unknown_location: 'Okänd plats',
                suggestions: 'Platsförslag'
            },
            email: {
                label: 'E-post för uppdateringar',
                placeholder: 'Ange din e-postadress',
                help: 'Vi skickar uppdateringar om din anmälan',
                subscribe: 'Prenumerera på uppdateringar'
            },
            gdpr: {
                label: 'Samtycke till databehandling',
                description:
          'Jag samtycker till behandlingen av mina uppgifter enligt integritetspolicyn.',
                required: 'Du måste godkänna för att fortsätta',
                link: 'Visa integritetspolicy'
            },
            media: {
                label: 'Foton',
                required: 'Ett foto krävs för den här kategorin',
                upload: {
                    overall_progress: 'Total förlopp',
                    button: 'Klicka för att ladda upp',
                    or: ' eller',
                    drag: 'dra och släpp',
                    drop_here: 'Släpp filer här för att ladda upp',
                    restrictions: 'Upp till {count} bilder (max {size}, {types})',
                    restrictions_single: 'En bild (max {size}, {types})',
                    progress: 'Uppladdningsförlopp',
                    started_sr: 'Uppladdning startad',
                    progress_sr: 'Uppladdning {progress} % klar',
                    success_sr: 'Uppladdning klar',
                    error_sr: 'Uppladdning misslyckades: {error}',
                    files_selected_sr: '{count} filer valda för uppladdning',
                    description: 'Ladda upp bilder genom att klicka, trycka eller dra filer hit. Format som stöds: JPEG, PNG, GIF.',
                    area_label: 'Område för fotouppladdning, klicka för att välja filer eller dra och släpp',
                    in_progress: 'Uppladdning pågår',
                    complete_sr: 'Filen har laddats upp.'
                },
                preview: 'Bildförhandsvisning',
                remove: 'Ta bort bild',
                no_image_available: 'Ingen bild tillgänglig eller visas inte av juridiska skäl',
                progress: 'Uppladdningsförlopp: {progress} %',
                limit_reached: 'Maximalt antal bilder ({count}) har uppnåtts',
                privacy_notice: 'Undvik personer och registreringsskyltar i foton',
                offline_cached: 'Sparad offline',
                ai_analysis: 'Analys med Azure AI (Tyskland)',
                ai_analysis_help: 'Information om AI-analys',
                ai_analysis_tooltip: 'Genom att ladda upp bekräftar du att fotot har tagits lagligt och inte kränker tredje parts rättigheter.\n\nOm personer eller registreringsskyltar går att känna igen, gör dem oidentifierbara före uppladdning.\n\nAnalysen används enbart för att kategorisera din anmälan. Endast en reducerad, EXIF-fri kopia skickas till Azure OpenAI (Tyskland); originalet skickas inte till tjänsten.'
            },
            submit: {
                button: 'Skicka anmälan',
                submitting: 'Skickar...',
                processing: 'Bearbetar...',
                success: 'Anmälan skickad',
                error: 'Fel vid inskick av anmälan',
                loading: 'Läser in formulär...'
            },
            loading: 'Läser in anmälningsformulär...',
            draft_saved: 'Utkast sparat'
        },
        ai: {
            label: 'AI',
            powered: 'AI-driven',
            analyzing: 'AI analyserar dina foton...',
            started_sr: 'AI-analys startad',
            complete_sr: 'AI-analysen slutfördes',
            field_updated_sr: '{field} har uppdaterats med: {value}',
            analysis_complete_sr: 'AI-analys klar.',
            category_result_sr: 'Kategori vald: {category}.',
            description_result_sr: 'Beskrivning genererad: {description}',
            location_result_sr: 'Plats hittad: {location}.',
            category_hint: 'Det här fotot verkar inte matcha våra rapportkategorier. Välj själv en kategori.',
            processing: {
                analyzing: 'Frågar AI...',
                location: 'Kontrollerar fotots metadata...',
                location_found: 'Plats hittad:',
                location_ai: 'Hittar plats i bilden...',
                location_not_found: 'Ingen plats hittades i fotots metadata.',
                location_complete: 'Plats identifierad',
                category: 'Identifierar kategori...',
                category_found: 'Kategori identifierad:',
                category_not_matched: 'Kategori föreslagen av AI (måste väljas)',
                description: 'Genererar beskrivning...',
                description_complete: 'Beskrivning genererad',
                attributes_filled: '{count} extra fält förifyllt(a)',
                complete: 'AI-analys klar',
                error: 'Fel under AI-analys',
                privacy_warning: 'Integritetsrisk upptäckt'
            },
            privacy: {
                title: 'Integritetsmeddelande',
                description: 'Personuppgifter kan ha upptäckts i ditt foto ({issues}). Fotot granskas före publicering.',
                required: 'Integritetskänsligt innehåll har upptäckts i det här fotot och automatisk oskärpa är inte tillgänglig. Fotot kan inte användas. Ersätt det eller ta bort det för att fortsätta.',
                removePhoto: 'Ta bort foto',
                replace: 'Byt foto',
                understood: 'Fortsätt med det här fotot'
            },
            failed: {
                title: 'Bildanalys är inte tillgänglig',
                description: 'Ditt foto granskas manuellt före publicering. Du kan fortfarande skicka in din anmälan.'
            },
            budget_exhausted_title: 'AI-analys hoppades över',
            budget_exhausted_submitted: 'AI-analysbudgeten för denna månad har förbrukats. Din rapport skickades in.'
        },
        buttons: {
            photo: 'Fotoanmälan',
            classic: 'Klassisk anmälan',
            follow: 'Följ anmälan',
            following: 'Följer',
            share: 'Dela anmälan',
            print: 'Skriv ut',
            flag: 'Rapportera',
            flag_submitted: 'Redan rapporterad',
            copy_link: 'Kopiera länk',
            link_copied: 'Länk kopierad till urklipp',
            email: 'E-post',
            directions: 'Hämta vägbeskrivning'
        },
        following: {
            count: 'Följer {count} anmälningar',
            mark_all_read: 'Markera alla som lästa',
            no_reports: 'Inga följda anmälningar ännu',
            no_address: 'Ingen adress tillgänglig',
            status_updated: 'Status uppdaterad',
            status_changed: 'Status ändrad till:',
            awaiting_server: 'Väntar på uppdatering',
            escalated_to: 'Vidarebefordrad till {jurisdiction}',
            escalated_click: 'Tryck för att öppna i nytt område',
            unavailable: 'Den här anmälan är inte tillgänglig just nu. Kontrollera din e-post för mer information eller kontakta oss.',
            date: {
                today: 'Idag',
                tomorrow: 'I morgon',
                yesterday: 'Igår',
                unknown: 'Okänt datum'
            }
        }
    },
    map: {
        tap_to_load: 'Tryck för att visa karta',
        tap_to_select_location: 'Tryck på kartan för att välja plats',
        loading: 'Läser in karta...',
        loading_address: 'Läser in adress...',
        retry_attempt: 'Försök {count}',
        confirm_location: 'Bekräfta plats',
        add_report_here: 'Lägg till anmälan här',
        controls: {
            zoom: 'Zoomkontroller',
            zoom_in: 'Zooma in',
            zoom_out: 'Zooma ut',
            find_location: 'Hitta min plats',
            toggle_heatmap: 'Visa eller dölj värmekarta',
            toggle_language: 'Byt språk',
            add_report_here: 'Anmäl här',
            adjust_tilt: 'Justera lutning',
            degrees: '{count} grader',
            layers: 'Kartlager',
            no_layers: 'Inga lager tillgängliga',
            geolocation: {
                label: 'Hämta nuvarande plats'
            }
        },
        pick: {
            drag_hint: 'Dra markören för att justera platsen'
        },
        tooltip: {
            label: 'Kartmarkörsinformation',
            opens_form_above: 'Öppnar formuläret ovanför',
            opens_modal: 'Öppnas i dialogruta'
        },
        keyboard: {
            canvasInstructions: 'Interaktiv karta med anmälningsmarkörer. Piltangenterna navigerar mellan markörer, Skift+piltangent panorerar kartan, Enter väljer. Tryck Ctrl+= för att zooma in, Ctrl+- för att zooma ut.',
            noFeatures: 'Inga markörer synliga i aktuell kartvy. Försök zooma in eller panorera för att hitta markörer.',
            zoomedIntoCluster: 'Inzoomat på klusterområde. Använd piltangenterna för att navigera mellan markörer.',
            clusterFocused: 'Kluster med {count} anmälningar i fokus. Tryck Enter för att expandera. {position}',
            clusterExpanded: 'Kluster expanderat till {count} anmälningar. {featureLabel}',
            markerFocused: 'Anmälan i fokus: {name} vid {address}{context}. Tryck Enter för att öppna detaljer. {position}',
            expandedContext: ' (expanderad från kluster)',
            untitledReport: 'Anmälan utan titel',
            unknownLocation: 'plats',
            featurePosition: 'Element {current} av {total}.',
            pannedToExplore: 'Kartan panorerad {direction}. Släpp Skift och använd piltangenterna för att navigera markörer.',
            pannedNoMarkers: 'Kartan panorerad {direction}. Inga markörer hittades i den riktningen. Använd piltangenterna för att fortsätta utforska.'
        }
    },
    detail: {
        dialog_description: 'Visa anmälningsdetaljer',
        location: 'Plats',
        photos: 'Foton',
        description: 'Beskrivning',
        status_history: 'Statushistorik',
        updates: 'Uppdateringar',
        no_updates: 'Inga uppdateringar ännu',
        edit: 'Redigera',
        follow: {
            button: 'Följ',
            following: 'Följer',
            stop: 'Sluta följa',
            success: 'Du följer nu denna anmälan',
            error: 'Fel vid följning av anmälan',
            updating: 'Uppdaterar...'
        },
        unavailable: {
            title: 'Anmälan inte tillgänglig',
            message: 'Denna anmälan finns inte eller har ännu inte publicerats. Nyligen inlämnade anmälningar kan ta en stund innan de visas.'
        }
    },
    pages: {
        dialog_description: 'Visa sidinnehåll'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Fördelning',
        total_reports: 'Anmälningar totalt',
        status_distribution: 'Statusfördelning',
        category_distribution: 'Kategorifördelning',
        uncategorized: 'Okategoriserad',
        showing_reports: 'Visar {visible} av {total} anmälningar',
        no_reports: 'Inga anmälningar tillgängliga',
        open_reports: 'Öppna anmälningar',
        closed_reports: 'Stängda anmälningar',
        no_data_available: 'Inga data tillgängliga',
        expand: 'Visa detaljer',
        collapse: 'Dölj detaljer',
        subcategory: 'underkategori',
        subcategories: 'underkategorier'
    },
    time: {
        days_ago: 'för {count} dagar sedan',
        just_now: 'Just nu',
        minutes_ago: 'för {count} minuter sedan',
        hours_ago: 'för {count} timmar sedan',
        yesterday: 'Igår',
        today: 'Idag'
    },
    list: {
        showing: 'Visar {visible} av {total} anmälningar',
        showing_in_area: 'Visar {visible} i det här området, {total} totalt',
        showing_area_only: 'Visar {visible} i det här området',
        no_results: 'Inga anmälningar hittades',
        no_filtered_results: 'Inga anmälningar matchar dina filterkriterier',
        load_more: 'Alla anmälningar har laddats',
        load_more_button: 'Ladda fler',
        newest_first: 'Nyast först',
        oldest_first: 'Äldst först',
        refresh: 'Uppdatera',
        status_update: 'Status uppdaterad',
        location: 'Plats',
        unpublished: 'Opublicerad',
        editable: 'Redigerbar'
    },
    error: {
        form_error_fallback: 'Ett fel uppstod när formuläret lästes in. Försök igen.',
        404: {
            title: 'Sidan hittades inte',
            description: 'Sidan du letar efter finns inte eller har flyttats.'
        },
        403: {
            title: 'Åtkomst nekad',
            description: 'Du har inte behörighet att visa den här sidan.'
        },
        500: {
            title: 'Något gick fel',
            description: 'Ett oväntat fel uppstod. Försök igen.'
        },
        fallback: {
            title: 'Fel',
            description: 'Ett oväntat fel uppstod.'
        },
        actions: {
            back: 'Tillbaka',
            home: 'Till startsidan',
            retry: 'Försök igen'
        }
    },
    errors: {
        general: 'Något gick fel',
        search_failed: 'Sökningen misslyckades. Försök igen.',
        api: {
            rate_limit: 'För många förfrågningar. Vänta en stund och försök igen.',
            unauthorized: 'Inte behörig. Logga in igen.',
            forbidden: 'Åtkomst nekad.',
            not_found: 'Resursen hittades inte.',
            server_error: 'Serverfel. Försök igen senare.',
            default: 'API-fel: {status}'
        },
        upload_failed: 'Uppladdning misslyckades',
        location_error: 'Kunde inte fastställa plats',
        network_error: 'Nätverksfel',
        geolocation: {
            title: 'Platsfel',
            permission_denied: 'Platsbehörighet nekades. Tillåt åtkomst i webbläsarens inställningar.',
            unavailable: 'Platsinformation är inte tillgänglig just nu.',
            timeout: 'Platsförfrågan tog för lång tid.',
            unknown: 'Ett okänt platsfel uppstod.'
        },
        try_again: 'Försök igen',
        validation: {
            title: 'Tyvärr kan vi inte behandla den här begäran:',
            location_error_title: 'Platsfel',
            invalid_input: 'Ogiltig inmatning',
            duplicate_title: 'Dubblett hittades',
            duplicate_found: 'Liknande anmälan hittades',
            duplicate_report: 'En liknande anmälan har redan skapats (nr {reportId})',
            duplicate_hint_title: 'Möjlig dubblett hittades',
            duplicate_hint_message: 'Det kan redan finnas en liknande anmälan i området. Du kan ändå skicka in om du anser att detta är ett nytt problem.',
            duplicate_existing_report: 'Befintlig anmälan: nr {reportId}',
            view_existing_report: 'Visa befintlig anmälan',
            submit_anyway: 'Skicka ändå',
            location_out_of_bounds: 'Vald plats ligger utanför vårt område',
            required_field: '{field} krävs',
            required_fields: 'Fyll i alla obligatoriska fält',
            please_review: 'Granska formuläret och korrigera eventuella fel innan du skickar in.',
            file_size: 'Den valda filen är för stor (max 10 MB)',
            file_type: 'Formatet stöds inte (tillåtna: jpg, png, webp)',
            media_upload: 'Fel vid uppladdning av bild',
            invalid_format: 'Ogiltigt format för {field}',
            photo_required: 'Ett foto krävs för den här kategorin',
            consent_required: 'Godkänn integritetspolicyn'
        },
        rate_limit: {
            title: 'Gräns för antal förfrågningar överskriden',
            general: 'Försök igen senare.',
            with_time: 'Försök igen om {seconds} sekunder.'
        },
        network: 'Anslutningsproblem. Kontrollera din internetanslutning',
        timeout: 'Tidsgränsen överskreds. Försök igen',
        upload: {
            title: 'Uppladdningsfel',
            invalid_type: 'Ogiltig filtyp. Ladda bara upp bilder.',
            file_too_large: 'Filen är för stor. Maxstorlek är {size}.',
            file_too_large_raw: 'Filen är för stor (max {size}). Välj en mindre bild.',
            optimization_failed: 'Bilden kunde inte komprimeras. Maxstorlek efter komprimering: {size}.',
            dimensions_too_large: 'Bildens dimensioner är för stora. Max {width}x{height} pixlar.',
            invalid_image: 'Ogiltig eller skadad bildfil.',
            failed: 'Uppladdningen misslyckades. Försök igen.',
            limit_reached: 'Maximalt antal filer ({count}) har uppnåtts.',
            remove_to_add: 'Ta bort ett foto för att lägga till ett nytt',
            single_file_limit: 'Endast en bild kan laddas upp.',
            exact_file_limit: 'Högst {count} bilder kan laddas upp.'
        },
        submission_error: 'Fel vid inskick eller uppladdning av bilden.',
        unknown: 'Ett okänt fel uppstod.',
        pending_uploads: 'Vänta tills alla uppladdningar är klara.',
        incomplete_form: 'Fyll i alla obligatoriska fält.',
        page: {
            title: 'Fel',
            not_found_title: 'Sidan hittades inte',
            not_found_message: 'Tyvärr finns inte sidan du letar efter.',
            server_error_title: 'Serverfel',
            server_error_message: 'Tyvärr gick något fel på vår server.',
            generic_title: 'Fel uppstod',
            generic_message: 'Ett oväntat fel har uppstått.',
            action_home: 'Gå till startsidan',
            action_back: 'Gå tillbaka',
            action_retry: 'Försök igen',
            details: 'Felinformation'
        }
    },
    success: {
        report_submitted: 'Anmälan skickad',
        report_submitted_description: 'Din anmälan har skickats och kommer snart att granskas.',
        moderation_notice:
      'Din anmälan granskas före publicering. Ditt referensnummer:',
        submit_another: 'Skicka en ny anmälan',
        auto_followed: 'Den här anmälan har automatiskt lagts till bland dina följda anmälningar',
        visibility_limitation_notice: 'Observera att alla anmälningar inte blir offentligt synliga på webbplatsen. Om din anmälan inte uppdateras i listan över följda anmälningar kan den ändå ha behandlats av kommunen. Kontrollera din e-post för statusuppdateringar.',
        fun_facts: [
            '🌱 Varje anmälan du skickar in hjälper till att göra din stad bättre att leva i.',
            '🏙️ Medborgaranmälningar har hjälpt till att åtgärda över 10 000 problem i städer världen över.',
            '⚡ En anmälan granskas i genomsnitt inom 24 timmar.',
            '🤝 Du är en del av en gemenskap som bryr sig om offentliga miljöer.',
            '📊 Data från medborgaranmälningar hjälper stadsplanerare att fatta bättre beslut.',
            '🔄 När du följer dina anmälningar får du automatiskt uppdateringar om utvecklingen.',
            '🎯 Fotoanmälningar behandlas tre gånger snabbare än anmälningar med bara text.',
            '🌍 Plattformar för medborgarengagemang som denna finns i över 50 länder.',
            '💡 Din återkoppling hjälper till att prioritera vilka problem som åtgärdas först.',
            '🚀 Digital rapportering har minskat svarstiderna med upp till 60 procent.',
            '🏆 Engagerade invånare gör samhällen starkare och mer motståndskraftiga.',
            '🔍 AI-analys hjälper till att kategorisera dina anmälningar mer exakt.',
            '📱 Mobil rapportering gör det enkelt att anmäla problem när du ser dem.',
            '⭐ Tack för ditt engagemang.'
        ]
    },
    flag: {
        title: 'Rapportera denna anmälan',
        description: 'Hjälp oss att upprätthålla kvaliteten genom att rapportera olämpligt innehåll.',
        reason_label: 'Varför rapporterar du denna anmälan?',
        reason_spam: 'Spam eller reklam',
        reason_offensive: 'Stötande eller olämpligt innehåll',
        reason_personal: 'Innehåller personuppgifter',
        reason_location: 'Fel plats',
        reason_other: 'Annat',
        details_label: 'Ytterligare detaljer',
        details_placeholder: 'Vänligen beskriv problemet...',
        details_required: 'Vänligen ange detaljer',
        submit: 'Skicka',
        success: 'Tack. Vi kommer att granska denna anmälan.',
        error: 'Kunde inte skicka. Vänligen försök igen.',
        already_flagged: 'Du har redan rapporterat denna anmälan.'
    },

    pwa: {
        install: {
            title: 'Installera app',
            button: 'Installera',
            not_now: 'Inte nu',
            description:
        'Installera appen genom att klicka på installationsikonen i webbläsarens adressfält.',
            share_button: 'Delningsikon',
            open_safari: 'Safari-webbläsare',
            ios: {
                title: 'Lägg till på hemskärmen',
                safari_instructions:
          'Tryck på {icon} och välj "Lägg till på hemskärmen".',
                other_instructions:
          'Öppna den här webbplatsen i {browser} för att installera.'
            },
            chrome: {
                instructions:
          'Installera appen genom att klicka på installationsikonen {icon} i verktygsfältet.'
            },
            edge: {
                instructions:
          'Klicka på installationsikonen {icon} i adressfältet.'
            },
            firefox: {
                instructions:
          'Klicka på hemikonen {icon} i adressfältet.'
            }
        }
    },
    boundaries: {
        loading: 'Läser in gränsdata...',
        error: 'Kunde inte kontrollera platsgränserna. Försök igen senare.',
        notLoaded: 'Gränserna har inte lästs in ännu',
        outsideNonStrict: 'Obs: vald plats ligger utanför gränserna för {locationName}.',
        outsideStrict: 'Vald plats ligger utanför gränserna för {locationName}. Välj en plats inom kommungränsen.',
        validationUnavailable: 'Gränskontroll är inte tillgänglig. Din anmälan tas emot men kan komma att granskas.'
    },
    filters: {
        title: 'Filter',
        status: {
            title: 'Status'
        },
        time: {
            title: 'Tid',
            today: 'Idag',
            week: 'Den här veckan',
            month: 'Den här månaden'
        },
        category: {
            title: 'Kategori',
            other: 'Annat'
        },
        actions: {
            more: 'Fler filter',
            expand: 'Fler filter',
            collapse: 'Mindre',
            clear_all: 'Rensa alla',
            active_count: '{count} filter aktiva',
            toggle: 'Filter'
        }
    },
    privacy: {
        notice_text: 'Information om integritet finns',
        notice_link_text: 'här',
        modal: {
            title: 'Integritetspolicy',
            loading: 'Läser in integritetsinformation...',
            retry: 'Försök igen',
            noContent: 'Ingen integritetsinformation tillgänglig.',
            lastUpdated: 'Senast uppdaterad',
            close: 'Stäng'
        }
    },
    search: {
        placeholder: 'Sök anmälningar...',
        no_results_local: 'Inga resultat hittades i den aktuella vyn',
        expand_to_server: 'Sök i alla anmälningar',
        expand_hint: 'Sök utanför aktuell vy',
        searching_server: 'Söker i alla anmälningar...'
    },
    info: {
        welcome: {
            heading: 'Välkommen till {name}',
            headingGeneric: 'Välkommen',
            body: 'Använd denna karta för att rapportera problem eller hitta befintliga rapporter i ditt område.'
        },
        shortcuts: {
            aria_label: 'Snabbåtgärder',
            photo: {
                title: 'Foto',
                description: 'Ta ett foto, AI sköter resten',
                aria_label: 'Skapa en fotorapport'
            },
            classic: {
                title: 'Klassisk',
                description: 'Beskriv och lokalisera problemet',
                aria_label: 'Skapa en klassisk rapport'
            },
            following: {
                title: 'Följ',
                description: 'Håll dig uppdaterad om utvecklingen',
                aria_label: 'Öppna följda rapporter'
            },
            list: {
                title: 'Utforska',
                description: 'Se vad som händer i närheten',
                aria_label: 'Utforska kartan och visa listan'
            }
        }
    },
    auth: {
        login: {
            title: 'Logga in',
            subtitle: 'Ange din e-post för att få en verifieringskod',
            email_label: 'E-postadress',
            email_hint: 'Vi skickar en 6-siffrig kod',
            email_placeholder: 'e-postadress',
            send_code: 'Skicka verifieringskod',
            disabled: {
                title: 'Inloggning inte tillgänglig',
                message: 'Lösenordsfri inloggning är inte aktiverad här. Kontakta administratören om du behöver åtkomst.',
                back_button: 'Tillbaka till startsidan'
            }
        },
        verify: {
            email_label: 'E-postadress',
            code_label: 'Verifieringskod',
            code_hint: 'Ange den 6-siffriga koden från din e-post',
            code_placeholder: '123456',
            verify_button: 'Verifiera och logga in',
            back_button: 'Använd en annan e-post',
            request_new: 'Begär ny kod',
            resend_code: 'Skicka koden igen',
            expires_in: 'Koden går ut om {time}',
            expired_title: 'Koden har gått ut',
            expired_message: 'Din verifieringskod har gått ut. Begär en ny.'
        },
        code_sent: {
            title: 'Kod skickad',
            message: 'Vi har skickat en 6-siffrig verifieringskod till {email}'
        },
        error: {
            title: 'Autentiseringsfel',
            request_failed: 'Kunde inte skicka verifieringskoden. Försök igen.',
            verify_failed: 'Ogiltig eller utgången verifieringskod',
            sso_failed: 'Inloggningen misslyckades. Försök igen.',
            network: 'Nätverksfel. Kontrollera din anslutning.',
            logout_failed: 'Kunde inte logga ut. Försök igen.'
        },
        sso: {
            completing: 'Slutför inloggning...',
            method_label: 'Single sign-on',
            button_aria: 'Logga in med {provider} via single sign-on'
        },
        user: {
            logged_in_as: 'Inloggad som',
            logout: 'Logga ut'
        },
        welcome: {
            greeting: 'Hej, {name}',
            sign_in: 'Logga in',
            sign_out: 'Logga ut',
            user_avatar: 'Användaravatar'
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
            color_mode: 'Färgläge',
            light: 'Ljust',
            dark: 'Mörkt',
            system: 'System',
            theme_override: 'Anpassade temafärger',
            theme_override_description: 'Åsidosätt områdets standardtema med dina egna färgval',
            primary_color: 'Primär färg',
            secondary_color: 'Sekundär färg',
            neutral_color: 'Neutral färg',
            reset_theme: 'Återställ till standard'
        },
        language: {
            title: 'Språk',
            select: 'Välj språk',
            save_failed: 'Det gick inte att spara språkinställningen. Försök igen.'
        }
    },
    offline: {
        banner: {
            title: 'Du är offline',
            description: 'Anmälningar sparas lokalt och synkroniseras senare.',
            pending: '{count} anmälningar väntar',
            dismiss: 'Stäng',
            states: {
                offline: {
                    title: 'Du är offline',
                    description: 'Anmälningar sparas lokalt'
                },
                syncing: {
                    title: 'Synkroniserar...',
                    description: 'Skickar {count} anmälningar'
                },
                success: {
                    title: '{count} anmälningar skickade',
                    titleDefault: 'Synkronisering klar'
                },
                error: {
                    title: '{count} misslyckades',
                    description: 'Granska och försök igen'
                },
                pending: {
                    title: 'Anmälningar redo att skickas'
                }
            },
            report: 'anmälan | anmälningar',
            syncNow: 'Skicka nu'
        },
        toast: {
            went_offline: 'Anslutningen bröts',
            went_offline_description: 'Anmälningar sparas lokalt.',
            back_online: 'Online igen',
            back_online_description: 'Anslutningen återställdes.',
            syncing: 'Synkroniserar...',
            syncing_description: 'Synkroniserar {count} anmälningar.',
            sync_complete: 'Synkronisering klar',
            sync_complete_description: 'Alla anmälningar har skickats.',
            sync_failed: 'Synkronisering misslyckades',
            sync_failed_description: '{count} anmälningar kunde inte skickas.'
        },
        status: {
            offline: 'Frånkopplad',
            syncing: 'Synkroniserar...',
            pending: '{count} väntar',
            synced: 'Synkroniserad'
        },
        sync: {
            title: 'Synkroniseringsstatus',
            syncNow: 'Synkronisera nu',
            syncing: 'Synkroniserar...',
            offlineWarning: 'Du är offline. Anmälningar synkroniseras när anslutningen är tillbaka.',
            pendingCount: '{count} anmälningar väntar på synkronisering',
            readyToSync: 'Klar att synkronisera',
            waitingForConnection: 'Väntar på anslutning',
            failedItems: 'Misslyckade inskick',
            untitledRequest: 'Anmälan utan titel',
            unknownError: 'Okänt fel',
            attempts: '{count} försök',
            retry: 'Försök igen',
            delete: 'Ta bort',
            allSynced: 'Alla anmälningar synkroniserade',
            lastSync: 'Senaste synkronisering',
            syncSuccess: '{count} anmälningar synkroniserade',
            syncFailed: '{count} anmälningar kunde inte synkroniseras',
            retrySuccess: 'Anmälan synkroniserad',
            retryFailed: 'Kunde inte synkronisera anmälan',
            itemDeleted: 'Anmälan har tagits bort från kön',
            queuedSuccess: 'Anmälan sparad',
            willSyncWhenOnline: 'Skickas när anslutningen är tillbaka.',
            queueFailed: 'Kunde inte spara anmälan till senare'
        },
        failed: {
            title: 'Misslyckade inskick',
            description: 'De här anmälningarna kunde inte skickas och behöver granskas.',
            empty: 'Inga misslyckade inskick',
            validation_error: 'Behöver korrigeras',
            server_error: 'Serverfel',
            edit: 'Redigera',
            retry: 'Försök igen',
            delete: 'Ta bort',
            confirm_delete: 'Är du säker på att du vill ta bort den här anmälan? Det går inte att ångra.',
            untitled: 'Anmälan utan titel',
            view_failed: 'Visa misslyckad'
        },
        form: {
            unavailable_title: 'Formuläret är inte tillgängligt offline',
            unavailable_description: 'Anmälningsformuläret kräver internetanslutning för att läsas in. Anslut till internet och försök igen.',
            retry: 'Försök igen',
            go_back: 'Gå tillbaka',
            waiting_for_connection: 'Väntar på anslutning...'
        }
    },
    legal: {
        impressum: {
            title: 'Juridisk information',
            heading: 'Juridisk information',
            responsible_heading: 'Ansvarig för innehåll',
            responsible_text: '{name} ansvarar för innehållet på den här plattformen.'
        },
        privacy: {
            title: 'Integritetspolicy',
            heading: 'Integritetspolicy',
            intro: 'Skyddet av dina personuppgifter är viktigt för oss. Vi behandlar dina uppgifter endast med stöd av lagbestämmelser (GDPR).',
            controller_heading: 'Personuppgiftsansvarig',
            data_heading: 'Insamlade data',
            data_text: 'När den här plattformen används behandlas följande data: platsdata för anmälan, beskrivningstext, uppladdade foton och tekniska åtkomstdata (IP-adress, webbläsartyp, åtkomsttid).',
            rights_heading: 'Dina rättigheter',
            rights_text: 'Du har rätt till tillgång, rättelse, radering, begränsning av behandling, dataportabilitet och invändning.'
        },
        terms: {
            title: 'Användarvillkor',
            heading: 'Användarvillkor',
            intro: 'Genom att använda den här plattformen godkänner du följande villkor.',
            purpose_heading: 'Syfte',
            purpose_text: 'Den här plattformen används för att anmäla problem i offentliga miljöer. Anmälningar vidarebefordras till ansvarig myndighet.',
            obligations_heading: 'Användarens skyldigheter',
            obligations_text: 'Du godkänner att endast lämna sanningsenliga uppgifter och att inte ladda upp olagligt innehåll. Uppladdade foton får inte visa identifierbara personer utan deras samtycke.',
            liability_heading: 'Ansvar',
            liability_text: '{name} ansvarar inte för att de lämnade uppgifterna är fullständiga eller korrekta.'
        },
        email_label: 'E-post',
        contact_label: 'Kontakt',
        platform: {
            heading: 'Plattformsoperatör',
            intro: 'Den här plattformen drivs tekniskt av:',
            description: 'Civic Patches GmbH tillhandahåller den tekniska infrastrukturen för Mark-a-Spot-plattformen.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Germany',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operatör för den här kartan',
            not_configured: 'Operatören för den här kartan har ännu inte lämnat juridisk information. Operatörer av offentligt tillgängliga onlinetjänster kan behöva tillhandahålla juridisk information och integritetspolicy.'
        },
        footer: {
            impressum: 'Juridisk information',
            privacy: 'Integritet',
            terms: 'Användarvillkor'
        },
        not_configured: 'Operatörsdata har inte konfigurerats ännu.'
    },
    demo_mode: {
        banner: {
            title: 'Demoinstans',
            message: 'Ärenden som skickas in här vidarebefordras inte till någon myndighet.',
            link_label: 'Besök mark-a-spot.com',
            minimize_label: 'Minimera demomeddelande',
            expand_label: 'Visa demomeddelande'
        },
        reset: {
            title: 'Demodatabas',
            notice: 'Demosystemet återställs varje timme.',
            countdown_label: 'Nästa återställning om',
            countdown_aria: 'Nästa återställning av demodatabasen om {time}'
        },
        modal: {
            title: 'Demoinlämning',
            body: 'Det här är en demo. Ditt ärende kommer INTE att vidarebefordras till kommunen. Fortsätt med demoinlämningen?',
            confirm_label: 'Skicka in demoärende',
            cancel_label: 'Avbryt'
        },
        lite: {
            title: 'Endast demo',
            heading: 'Demoinstans',
            body: 'Det här är en demonstration av Mark-a-Spot. Inlämningar via det enkla formuläret är inaktiverade här så att riktiga ärenden aldrig råkar nå en kommun.',
            link_label: 'Besök mark-a-spot.com'
        }
    },
    print: {
        title: 'Rapport om serviceärende',
        description: 'Beskrivning',
        location: 'Plats',
        media: 'Bilagor',
        image_unavailable: 'Image unavailable',
        attributes: 'Extra fält',
        status_history: 'Statushistorik',
        internal_fields: 'Intern information',
        organisation: 'Avdelning',
        hazard_level: 'Faronivå',
        hazard_category: 'Farokategori',
        sentiment: 'Känsloton',
        printed_at: 'Utskriven',
        showing_recent: 'Visar {count} av {total} uppdateringar'
    }
};
