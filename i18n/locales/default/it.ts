// locales/it.ts
export default {
    locale: {
        code: 'it-IT'
    },
    meta: {
        description: 'Frontend di Mark-a-Spot'
    },
    nav: {
        map: 'Mappa',
        dashboard: 'Dashboard',
        back_to_frontend: 'Torna alla mappa'
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Benvenuto, {name}',
        nav: {
            dashboard: 'Dashboard',
            requests: 'Richieste',
            settings: 'Impostazioni',
            categories: 'Categorie',
            jurisdictions: 'Giurisdizioni',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'Lingue',
            billing: 'Fatturazione'
        },
        help: {
            docs: 'Documentazione',
            support: 'Contatta il supporto'
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
            profile: 'Profilo',
            logout: 'Disconnetti'
        },
        jurisdiction: {
            current: 'Spazio di lavoro',
            citizenView: 'Vista cittadino',
            switchTo: 'Passa a',
            blocked: 'bloccato',
            admin_section_header: 'Tutti gli spazi di lavoro (accesso amministratore)'
        },
        stats: {
            total: 'Totale richieste',
            pending: 'In attesa',
            in_progress: 'In corso',
            resolved: 'Risolto',
            my_groups: 'I miei gruppi',
            overall: 'Generale'
        },
        recent_requests: 'Richieste recenti',
        view_all: 'Vedi tutto',
        no_recent: 'Nessuna richiesta recente',
        wms: {
            title: 'Livelli mappa',
            attribution: 'Dati: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Media',
                category: 'Categoria',
                status: 'Stato',
                created: 'Creato'
            }
        }
    },
    form: {
        body: 'Descrizione',
        body_description: 'Si prega di fornire una descrizione dettagliata',
        body_placeholder: 'Inserisci una descrizione...',
        category: 'Categoria',
        category_description: 'Seleziona la categoria appropriata per la tua segnalazione',
        category_placeholder: 'Seleziona una categoria',
        category_disabled: {
            title: 'Categoria selezionata',
            description: 'Hai selezionato la categoria "{category}". Questa categoria ha requisiti speciali o non consente ulteriori modifiche al modulo.'
        },
        category_empty: 'Nessuna categoria disponibile',
        category_loading: 'Caricamento categorie...',
        category_disabled_notice: 'Questa categoria è solo informativa. Non è possibile inviare segnalazioni.',
        category_description_loading: 'Caricamento descrizione...',
        category_description_error: 'Errore nel caricamento della descrizione',
        email: 'Email',
        email_description: 'La tua email di contatto',
        email_placeholder: 'Inserisci il tuo indirizzo email',
        first_name: 'Nome',
        first_name_description: 'Il tuo nome',
        first_name_placeholder: 'Inserisci il tuo nome',
        last_name: 'Cognome',
        last_name_description: 'Il tuo cognome',
        last_name_placeholder: 'Inserisci il tuo cognome',
        gdpr: 'Accordo sulla protezione dei dati',
        gdpr_description: 'Acconsento al trattamento dei miei dati come descritto nell\'informativa sulla privacy.',
        object_id: 'ID Oggetto',
        object_id_description: 'Identificativo per l\'oggetto segnalato',
        object_id_placeholder: 'Inserisci ID oggetto (es. numero del palo)',
        phone: 'Numero di telefono',
        phone_description: 'Il tuo numero di telefono di contatto',
        phone_placeholder: 'Inserisci il tuo numero di telefono',

        // Segnalazione basata su struttura
        facility: 'Struttura',
        facility_plural: 'Strutture',
        facility_placeholder: 'Seleziona {label}',
        facility_required: '{label} è obbligatorio.',
        facility_unavailable: 'La struttura selezionata non è più disponibile, si prega di selezionarne un\'altra.',
        facility_nearest_snapped: 'Struttura più vicina: {label}',
        facility_no_nearby: 'Nessuna struttura nelle vicinanze, selezionare manualmente.',
        facility_use_my_location: 'Usa la mia posizione',
        facility_locating: 'Localizzazione in corso…',
        facility_no_match: 'Nessuna struttura corrisponde alla tua ricerca.',
        facility_opens_in_new_tab: '(si apre in una nuova scheda)',
        facility_deselected_map_pick: 'Posizione propria usata al posto di {label}',
        facility_tagged_with: 'Presso: {label}',

        imagelist: {
            empty: 'Nessuna immagine disponibile per questo tipo.'
        },
        back_to_report: 'Torna al modulo di segnalazione',
        requirements: {
            title: 'Still required',
            ready_to_submit: 'Ready to submit',
            photo: 'Upload a photo',
            category: 'Select a category',
            location: 'Provide location',
            description: 'Enter a description',
            email: 'Provide email address',
            privacy: 'Accept privacy policy',
            privacyBlock: 'Sostituisci o rimuovi la foto con contenuto critico per la privacy',
            conditional: 'depending on category'
        },
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'La descrizione è obbligatoria',
        category_required: 'La categoria è obbligatoria',
        email_required: 'L\'email è obbligatoria',
        email_format: 'Formato email non valido',
        first_name_required: 'Il nome è obbligatorio',
        last_name_required: 'Il cognome è obbligatorio',
        gdpr_required: 'Devi accettare i termini di protezione dei dati',
        object_id_required: 'L\'ID oggetto è obbligatorio',
        phone_required: 'Il numero di telefono è obbligatorio',
        required_field: '{field} è obbligatorio'
    },
    feedback: {
        page_title: 'Feedback richiesta di servizio',
        error_title: 'Errore di caricamento',
        invalid_request: 'Richiesta di servizio non valida o scaduta',
        thank_you: 'Grazie per il tuo feedback!',
        submission_received: 'Il tuo feedback è stato ricevuto con successo',
        loading: 'Caricamento richiesta di servizio...',
        title: 'Feedback per: {service}',
        description: 'Si prega di fornire il tuo feedback',
        placeholder: 'Inserisci il tuo feedback qui...',
        reopen_request: 'Vorrei che questa richiesta di servizio fosse riaperta',
        submitting: 'Invio in corso...',
        sending: 'Invio...',
        submit: 'Invia feedback',
        existing_title: 'Il tuo feedback per: {service}',
        already_submitted: 'Hai già inviato un feedback per questa richiesta di servizio',
        missing_uuid: 'ID servizio mancante',
        success_notification: 'Feedback inviato con successo',
        success_with_id: 'Feedback inviato con successo per la richiesta #{id}',
        updated_successfully: 'Feedback aggiornato con successo',
        added_to_list: 'La richiesta di servizio è stata aggiunta alla tua lista',
        submission_error: 'Impossibile inviare il feedback',
        server_error: 'Errore del server: Il feedback non può essere elaborato al momento',
        submission_failed: 'Impossibile inviare il feedback. Si prega di riprovare più tardi',
        already_exists: 'Il feedback esiste già per questa richiesta di servizio',
        error_fetching_request: 'Errore nel caricamento dei dettagli della richiesta di servizio',
        no_content: 'Nessun contenuto di feedback',
        refresh_complete: 'Elenco richieste aggiornato',
        try_again: 'Riprova',
        format_unrecognized: 'Formato richiesta di servizio non riconosciuto',
        processing_error: 'Errore durante l\'elaborazione dei dati della richiesta di servizio',
        your_feedback: 'Il tuo feedback',
        contact_preference: 'Preferenza di contatto',
        no_contact: 'Nessun contatto',
        email_contact: 'Contatto via email',
        email_placeholder: 'Il tuo indirizzo email',
        set_status_open: 'Imposta stato su aperto',
        set_status_open_description: 'Nel caso tu voglia che esaminiamo di nuovo questo caso, puoi riaprire questa richiesta di servizio.',
        email_verification: 'Verifica email',
        email_verification_placeholder: 'Indirizzo email dal report originale',
        email_verification_description: 'Inserisci l\'indirizzo email utilizzato durante la creazione del report originale.',
        email_mismatch: 'L\'indirizzo email inserito non corrisponde al report originale.',
        unauthorized_access: 'Accesso non autorizzato. Si prega di controllare il proprio indirizzo email.',
        not_eligible: 'Questa richiesta di servizio non è attualmente idonea per il feedback',
        service_provider: {
            page_title: 'Risposta del fornitore di servizi',
            page_description: 'Invia note di completamento per le richieste di servizio assegnate',
            modal_title: 'Risposta del fornitore di servizi',
            dialog_description: 'Finestra di dialogo del modulo di risposta del fornitore di servizi',
            title: 'Completa assegnazione',
            your_email: 'Il tuo indirizzo email',
            email_placeholder: 'fornitore{\'@\'}esempio.com',
            email_verification_note: 'Inserisci la tua email di fornitore di servizi per la verifica',
            completion_notes: 'Note di completamento',
            notes_placeholder: 'Descrivi il lavoro che è stato completato...',
            mark_as_completed: 'Segna come completato',
            mark_as_completed_description: 'Imposta lo stato della richiesta come completato',
            submit_completion: 'Invia completamento',
            complete_request: 'Completa assegnazione',
            completing: 'Invio in corso...',
            completion_success: 'Completamento della richiesta di servizio inviato con successo',
            submission_failed: 'Impossibile inviare il completamento. Si prega di riprovare più tardi',
            server_error: 'Errore del server: Il completamento non può essere elaborato al momento',
            completion_not_allowed: 'Questa richiesta non può essere completata al momento',
            email_verification_failed: 'Verifica email fallita. Si prega di controllare il proprio indirizzo email',
            already_completed: 'Questa richiesta è già stata completata',
            loading: 'Caricamento richiesta di servizio...',
            try_again: 'Riprova',
            invalid_uuid: 'Richiesta di servizio non valida o scaduta',
            load_error: 'Errore nel caricamento dei dettagli della richiesta di servizio',
            error_fetching_request: 'Errore nel caricamento dei dettagli della richiesta di servizio',
            completion_notes_required: 'Si prega di fornire note di completamento',
            existing_completions: 'Completamenti precedenti',
            reassignment_note: 'Questa richiesta è stata contrassegnata per la riassegnazione e può ricevere più completamenti',
            mark_completed_description: 'Confirm that the work has been completed'
        },
        dialog_description: 'Feedback form dialog'
    },
    service_unavailable: {
        title: 'Servizio temporaneamente non disponibile',
        message: 'Non riusciamo a connetterci ai nostri servizi in questo momento. Questo problema è probabilmente temporaneo.',
        retry: 'Stiamo riscontrando difficoltà tecniche. Si prega di riprovare tra {seconds} secondi.',
        auto_retry: 'Nuovo tentativo tra {seconds} secondi...',
        retry_now: 'Riprova ora',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'La tua segnalazione. La nostra soluzione.'
    },
    hiddenSection: {
        description: 'Il nostro sistema di segnalazione problemi è un sistema per problemi infrastrutturali. Puoi procedere direttamente con la segnalazione di problemi o navigare verso quanto segue:',
        main_navigation: 'Navigazione principale con informazioni, un elenco di segnalazioni e statistiche',
        map: 'Mappa interattiva con marcatori visivi',
        map_navigation_hint: 'Usa i tasti freccia ⬆️⬇️⬅️➡️ per navigare tra i marcatori delle segnalazioni, ↩️ Invio per selezionare, ❌ Esc per cancellare la selezione',
        action_button: 'Segnala direttamente',
        keyboard_navigation_hint: 'Use arrow keys to navigate, Enter to activate',
        skip_to_main_content: 'Skip to main content'
    },
    accessibility: {
        skip_to_main: 'Vai al contenuto principale',
        skip_to_map: 'Vai alla mappa',
        skip_to_navigation: 'Vai alla navigazione',
        skip_to_form: 'Segnala direttamente',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'Indietro',
        not_classified: 'Non classificato',
        no_value: 'Nessun valore',
        close: 'Chiudi',
        loading: 'Caricamento...',
        error: 'Errore',
        success: 'Successo',
        submit: 'Invia',
        cancel: 'Annulla',
        required: 'Obbligatorio',
        save: 'Salva',
        delete: 'Elimina',
        edit: 'Modifica',
        clear: 'Pulisci',
        search: 'Cerca',
        select: 'Seleziona',
        on: 'Attivo',
        off: 'Inattivo',
        toggle: 'Attiva/disattiva',
        yesterday: 'Ieri',
        did_you_know: 'Lo sapevi?',
        show_more: 'Mostra di più',
        show_less: 'Mostra di meno',
        learn_more: 'Per saperne di più',
        learn_more_about: 'Per saperne di più su {topic}',
        opens_in_new_tab: '(si apre in una nuova scheda)',
        title: {
            classic: 'Segnalazione classica',
            photo: 'Segnalazione con foto'
        },
        buttons: {
            toggle_theme: 'Cambia tema',
            attribution: 'Attribuzione mappa',
            close: 'Chiudi'
        },
        navigation: 'Cassetto di navigazione',
        drawer_description: 'Pannello contenuti e opzioni',
        resize_drawer: 'Ridimensiona pannello',
        drawer_position_n_of_total: 'posizione {idx} di {total}',
        current: 'Current',
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'Posizione',
        field_gdpr: 'Consenso al trattamento dati',
        field_e_mail: 'Email',
        field_category: 'Categoria',
        field_request_media: 'Foto',
        field_name: 'Cognome',
        field_prename: 'Nome',
        field_first_name: 'Nome',
        field_first_name_placeholder: 'Si prega di inserire il nome',
        field_last_name: 'Cognome',
        field_last_name_placeholder: 'Si prega di inserire il cognome',
        field_phone: 'Telefono',
        body: 'Descrizione',
        field_add_data: 'Partecipazione al concorso',
        field_terms_of_use: 'Accetto i termini e le condizioni e l\'informativa sulla privacy.',
        field_address: 'Indirizzo',
        postal_code: 'Codice postale',
        postal_code_placeholder: 'es. 10001',
        city: 'Città',
        city_placeholder: 'es. Roma',
        street_address: 'Indirizzo',
        street_address_placeholder: 'es. Via Roma 123'
    },
    competition: {
        intro: 'Se lo desideri, partecipa alla nostra estrazione annuale. Hai la possibilità di vincere premi interessanti e ricompense in denaro che distribuiamo tra tutti i partecipanti come piccolo ringraziamento.',
        disclaimer: 'I dipendenti dei dipartimenti responsabili sono esclusi dalla partecipazione.',
        title: 'Partecipazione al concorso',
        errors: {
            already_exists: 'L\'iscrizione al concorso esiste già',
            duplicate_found: 'Duplicato trovato',
            duplicate_detail: 'È già stata creata un\'iscrizione al concorso per questa segnalazione.',
            not_found: 'Segnalazione non trovata',
            not_found_detail: 'Impossibile trovare la segnalazione associata.',
            save_failed: 'Impossibile salvare l\'iscrizione al concorso',
            submission_error: 'Errore di invio',
            submission_error_detail: 'Impossibile salvare la tua iscrizione al concorso, ma la tua segnalazione è stata inviata con successo.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Scheda informazioni',
                panel_label: 'Pannello informazioni'
            },
            list: {
                label: 'Elenco',
                aria_label: 'Scheda elenco segnalazioni',
                panel_label: 'Pannello elenco segnalazioni'
            },
            following: {
                label: 'Seguiti',
                aria_label: 'Scheda segnalazioni seguite',
                panel_label: 'Pannello segnalazioni seguite'
            },
            stats: {
                label: 'Statistiche',
                aria_label: 'Scheda statistiche',
                panel_label: 'Pannello statistiche'
            }
        },
        main: 'Navigazione principale',
        pages: 'Navigazione pagina',
        browse_reports: 'Sfoglia segnalazioni',
        back_to_form: 'Torna al modulo',
        panel: {
            scrollable: 'Area scorrevole'
        },
        updates_count: '{count} nuovi aggiornamenti'
    },
    report: {
        form_types: 'Tipi di segnalazione',
        how_to_help: 'Come creare una segnalazione',
        title: {
            photo: 'Segnalazione con foto',
            classic: 'Segnalazione classica',
            submit: 'Invia segnalazione',
            edit: 'Modifica segnalazione',
            view: 'Visualizza segnalazione'
        },
        photo: {
            description: 'Crea una nuova segnalazione con una foto'
        },
        classic: {
            description: 'Crea una nuova segnalazione senza una foto'
        },
        status: {
            new: 'Nuovo',
            open: 'Aperto',
            in_progress: 'In corso',
            resolved: 'Risolto',
            closed: 'Chiuso',
            unknown: 'Stato sconosciuto'
        },
        form: {
            tabs: {
                photo: 'Con foto',
                classic: 'Classica'
            },
            description: {
                label: 'Descrizione',
                placeholder: 'Si prega di descrivere il problema...',
                ai_processing: 'L\'IA sta generando una descrizione...',
                help: 'Fornisci quanti più dettagli possibili'
            },
            category: {
                label: 'Categoria',
                placeholder: 'Seleziona una categoria',
                loading: 'Caricamento categorie...',
                error: 'Errore nel caricamento delle categorie',
                empty: 'Nessuna categoria disponibile',
                help: 'Selezione categoria (fatta automaticamente)',
                description: 'Descrizione categoria',
                description_loading: 'Caricamento descrizione...',
                description_error: 'Errore nel caricamento della descrizione',
                disabled_notice: 'Questa categoria è solo a scopo informativo. L\'invio non è possibile.'
            },
            location: {
                label: 'Posizione',
                placeholder: 'Cerca una posizione...',
                selected: 'Posizione selezionata',
                clear: 'Cancella posizione',
                error: 'Errore nell\'ottenere la posizione',
                help: 'Inserisci un indirizzo o clicca sulla mappa',
                help_modal: 'Inserisci un indirizzo o usa la tua posizione attuale',
                current: 'Usa posizione attuale',
                searching: 'Ricerca in corso...',
                pick_on_map: 'Scegli sulla mappa',
                auto_detected: 'Posizione rilevata',
                complete_address: 'Indirizzo completo',
                from_photo_exif: 'Posizione estratta automaticamente dai metadati della foto',
                warning: 'Avviso posizione',
                unknown_location: 'Posizione sconosciuta',
                suggestions: 'Suggerimenti di posizione'
            },
            email: {
                label: 'Email per aggiornamenti',
                placeholder: 'Inserisci il tuo indirizzo email',
                help: 'Ti invieremo aggiornamenti sulla tua segnalazione',
                subscribe: 'Iscriviti agli aggiornamenti'
            },
            gdpr: {
                label: 'Consenso al trattamento dati',
                description: 'Acconsento al trattamento dei miei dati secondo l\'informativa sulla privacy.',
                required: 'Devi accettare per continuare',
                link: 'Visualizza informativa sulla privacy'
            },
            media: {
                label: 'Foto',
                required: 'Una foto è richiesta per questa categoria',
                upload: {
                    overall_progress: 'Progresso complessivo',
                    button: 'Clicca per caricare',
                    or: ' o',
                    drag: 'trascina e rilascia',
                    drop_here: 'Rilascia i file qui per caricare',
                    restrictions: 'Fino a {count} immagini ({size} max., {types})',
                    restrictions_single: 'Un\'immagine ({size} max., {types})',
                    progress: 'Progresso caricamento',
                    started_sr: 'Caricamento iniziato',
                    progress_sr: 'Caricamento {progress}% completato',
                    success_sr: 'Caricamento completato con successo',
                    error_sr: 'Caricamento fallito: {error}',
                    files_selected_sr: '{count} file selezionati per il caricamento',
                    area_label: 'Area caricamento foto - clicca per selezionare file o trascina e rilascia',
                    in_progress: 'Caricamento in corso',
                    complete_sr: 'Il file è stato caricato con successo.',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'Anteprima immagine',
                remove: 'Rimuovi immagine',
                no_image_available: 'Nessuna immagine disponibile o non visualizzata per motivi legali',
                progress: 'Progresso caricamento: {progress}%',
                limit_reached: 'Numero massimo di {count} immagini raggiunto',
                privacy_notice: 'Si prega di non includere persone/targhe nelle foto',
                ai_analysis: 'Analisi via Azure AI (Germania)',
                ai_analysis_tooltip: 'Caricando, confermi che la foto è stata scattata legalmente e non viola i diritti di terzi.\n\nSe persone o targhe sono riconoscibili, si prega di renderle irriconoscibili prima del caricamento.\n\nL\'analisi serve esclusivamente a categorizzare la tua segnalazione. Solo una copia ridotta, priva di EXIF viene trasmessa a Azure OpenAI (Germania); l\'originale non viene inviato al servizio.',
                offline_cached: 'Saved offline',
                ai_analysis_help: 'Information about AI analysis'
            },
            submit: {
                button: 'Invia segnalazione',
                submitting: 'Invio in corso...',
                processing: 'Elaborazione...',
                success: 'Segnalazione inviata con successo',
                error: 'Errore nell\'invio della segnalazione',
                loading: 'Loading form...'
            },
            loading: 'Caricamento modulo di segnalazione...',
            draft_saved: 'Bozza salvata',
            modal_description: 'Create a new report'
        },
        ai: {
            label: 'IA',
            powered: 'Basato su IA',
            analyzing: 'L\'IA sta analizzando le tue foto...',
            started_sr: 'Analisi IA iniziata',
            complete_sr: 'Analisi IA completata con successo',
            field_updated_sr: '{field} è stato aggiornato con: {value}',
            analysis_complete_sr: 'Analisi IA completata.',
            category_result_sr: 'Categoria selezionata: {category}.',
            description_result_sr: 'Descrizione generata: {description}',
            location_result_sr: 'Posizione trovata: {location}.',
            category_hint: 'Questa foto non sembra corrispondere alle nostre categorie di segnalazione. Scegli tu stesso una categoria.',
            processing: {
                analyzing: 'Chiedendo all\'IA...',
                location: 'Controllo metadati immagine...',
                location_found: 'Posizione trovata:',
                location_ai: 'Ricerca posizione nell\'immagine...',
                location_not_found: 'Posizione non trovata nei metadati dell\'immagine.',
                location_complete: 'Posizione identificata',
                category: 'Identificazione categoria...',
                category_found: 'Categoria identificata:',
                category_not_matched: 'Categoria suggerita dall\'IA (necessita selezione)',
                description: 'Generazione descrizione...',
                description_complete: 'Descrizione generata',
                attributes_filled: '{count} campo/i aggiuntivo/i precompilato/i',
                complete: 'Analisi IA completa',
                error: 'Errore durante l\'analisi IA',
                privacy_warning: 'Problema di privacy rilevato'
            },
            privacy: {
                title: 'Avviso sulla privacy',
                description: 'Nella tua foto potrebbero essere stati rilevati dati personali ({issues}). La foto verrà verificata prima della pubblicazione.',
                required: 'In questa foto è stato rilevato contenuto critico per la privacy e la sfocatura automatica non è disponibile. La foto non può essere utilizzata. Sostituiscila o rimuovila per continuare.',
                removePhoto: 'Rimuovi foto',
                replace: 'Sostituisci foto',
                understood: 'Continua con questa foto'
            },
            failed: {
                title: 'Analisi immagine non disponibile',
                description: 'La tua foto verrà verificata manualmente prima della pubblicazione. Puoi comunque inviare la tua segnalazione.'
            },
            budget_exhausted_title: 'Analisi IA saltata',
            budget_exhausted_submitted: 'Il budget per l\'analisi IA di questo mese è stato raggiunto. La tua segnalazione è stata inviata con successo.'
        },
        buttons: {
            photo: 'Segnalazione con foto',
            classic: 'Segnalazione classica',
            follow: 'Segui segnalazione',
            following: 'Seguiti',
            share: 'Condividi segnalazione',
            print: 'Stampa',
            flag: 'Segnala',
            flag_submitted: 'Già segnalato',
            copy_link: 'Copia link',
            link_copied: 'Link copiato negli appunti',
            email: 'Email',
            directions: 'Ottieni indicazioni'
        },
        following: {
            count: 'Seguendo {count} segnalazione(i)',
            mark_all_read: 'Segna tutto come letto',
            no_reports: 'Nessuna segnalazione seguita ancora',
            no_address: 'Nessun indirizzo disponibile',
            status_updated: 'Stato aggiornato',
            status_changed: 'Stato cambiato in:',
            awaiting_server: 'In attesa di aggiornamento',
            escalated_to: 'Inoltrato a {jurisdiction}',
            escalated_click: 'Tocca per aprire nella nuova giurisdizione',
            unavailable: 'Questa segnalazione non è al momento disponibile. Controlla la tua e-mail per i dettagli o contattaci.',
            date: {
                today: 'Oggi',
                tomorrow: 'Domani',
                yesterday: 'Ieri',
                unknown: 'Unknown date'
            }
        }
    },
    map: {
        tap_to_load: 'Tocca per mostrare la mappa',
        tap_to_select_location: 'Tocca sulla mappa per selezionare la posizione',
        loading: 'Caricamento mappa...',
        loading_address: 'Caricamento indirizzo...',
        retry_attempt: 'Tentativo {count}',
        confirm_location: 'Conferma posizione',
        add_report_here: 'Aggiungi segnalazione qui',
        controls: {
            zoom_in: 'Ingrandisci',
            zoom_out: 'Rimpicciolisci',
            find_location: 'Trova la mia posizione',
            toggle_heatmap: 'Attiva/disattiva mappa di calore',
            toggle_language: 'Cambia lingua',
            add_report_here: 'Segnala qui',
            adjust_tilt: 'Regola inclinazione',
            degrees: '{count} gradi',
            layers: 'Livelli mappa',
            no_layers: 'Nessun livello disponibile',
            geolocation: {
                label: 'Ottieni posizione attuale'
            },
            zoom: 'Zoom controls'
        },
        pick: {
            drag_hint: 'Trascina il marcatore per regolare la posizione'
        },
        tooltip: {
            label: 'Informazioni sul marcatore mappa',
            opens_form_above: 'Apre il modulo sopra',
            opens_modal: 'Apre in finestra di dialogo'
        },
        keyboard: {
            canvasInstructions: 'Mappa interattiva con marcatori segnalazioni. I tasti freccia navigano tra i marcatori, Maiusc+freccia sposta la mappa, Invio seleziona. Premi Ctrl+= per ingrandire, Ctrl+- per rimpicciolire.',
            noFeatures: 'Nessun marcatore visibile nella vista corrente. Prova a ingrandire o spostare la mappa.',
            zoomedIntoCluster: 'Ingrandito nell\'area del gruppo. Usa i tasti freccia per navigare tra i marcatori.',
            clusterFocused: 'Gruppo con {count} segnalazioni in focus. Premi Invio per espandere. {position}',
            clusterExpanded: 'Gruppo espanso in {count} segnalazioni. {featureLabel}',
            markerFocused: 'Segnalazione in focus: {name} a {address}{context}. Premi Invio per aprire i dettagli. {position}',
            expandedContext: ' (espanso dal gruppo)',
            untitledReport: 'Segnalazione senza titolo',
            unknownLocation: 'posizione',
            featurePosition: 'Elemento {current} di {total}.',
            pannedToExplore: 'Mappa spostata verso {direction}. Rilascia Maiusc e usa i tasti freccia per navigare.',
            pannedNoMarkers: 'Mappa spostata verso {direction}. Nessun marcatore trovato in questa direzione. Usa i tasti freccia per continuare.'
        }
    },
    detail: {
        location: 'Posizione',
        photos: 'Foto',
        description: 'Descrizione',
        status_history: 'Cronologia stato',
        updates: 'Aggiornamenti',
        no_updates: 'Nessun aggiornamento ancora',
        edit: 'Modifica',
        follow: {
            button: 'Segui',
            following: 'Seguiti',
            stop: 'Smetti di seguire',
            success: 'Ora stai seguendo questa segnalazione',
            error: 'Errore nel seguire la segnalazione',
            updating: 'Aggiornamento...'
        },
        unavailable: {
            title: 'Segnalazione non disponibile',
            message: 'Questa segnalazione non esiste o non è ancora stata pubblicata. Le segnalazioni appena inviate potrebbero richiedere qualche momento prima di apparire.'
        },
        dialog_description: 'View report details'
    },
    stats: {
        status_overview: 'Stato',
        pie_chart: 'Distribuzione',
        total_reports: 'Totale segnalazioni',
        status_distribution: 'Distribuzione stato',
        category_distribution: 'Distribuzione categoria',
        uncategorized: 'Non categorizzato',
        showing_reports: 'Visualizzazione {visible} di {total} segnalazioni',
        no_reports: 'Nessuna segnalazione disponibile',
        open_reports: 'Segnalazioni aperte',
        closed_reports: 'Segnalazioni chiuse',
        no_data_available: 'Nessun dato disponibile',
        expand: 'Mostra dettagli',
        collapse: 'Nascondi dettagli',
        subcategory: 'sottocategoria',
        subcategories: 'sottocategorie'
    },
    time: {
        days_ago: '{count} giorni fa',
        just_now: 'Proprio ora',
        minutes_ago: '{count} minuti fa',
        hours_ago: '{count} ore fa',
        yesterday: 'Ieri',
        today: 'Oggi'
    },
    list: {
        showing: 'Visualizzazione {visible} di {total} segnalazioni',
        showing_in_area: '{visible} in quest\'area, {total} in totale',
        showing_area_only: '{visible} in quest\'area',
        no_results: 'Nessuna segnalazione trovata',
        no_filtered_results: 'Nessuna segnalazione corrisponde ai tuoi criteri di filtro',
        load_more: 'Tutte le segnalazioni caricate',
        load_more_button: 'Carica altro',
        newest_first: 'Più recenti prima',
        oldest_first: 'Più vecchi prima',
        refresh: 'Aggiorna',
        status_update: 'Stato aggiornato',
        location: 'Posizione',
        unpublished: 'Non pubblicato',
        editable: 'Modificabile'
    },
    errors: {
        general: 'Qualcosa è andato storto',
        search_failed: 'Ricerca non riuscita. Riprova.',
        api: {
            rate_limit: 'Troppe richieste. Si prega di attendere un momento e riprovare.',
            unauthorized: 'Non autorizzato. Si prega di accedere di nuovo.',
            forbidden: 'Accesso negato.',
            not_found: 'Risorsa non trovata.',
            server_error: 'Errore del server. Si prega di riprovare più tardi.',
            default: 'Errore API: {status}'
        },
        upload_failed: 'Caricamento fallito',
        location_error: 'Impossibile determinare la posizione',
        network_error: 'Errore di rete',
        geolocation: {
            title: 'Errore di posizione',
            permission_denied: 'Permesso di localizzazione negato. Si prega di consentire l\'accesso nelle impostazioni del browser.',
            unavailable: 'Le informazioni sulla posizione non sono attualmente disponibili.',
            timeout: 'La richiesta di posizione è scaduta.',
            unknown: 'Si è verificato un errore di posizione sconosciuto.'
        },
        try_again: 'Si prega di riprovare',
        validation: {
            title: 'Spiacenti, non possiamo elaborare questa richiesta:',
            location_error_title: 'Errore di posizione',
            invalid_input: 'Input non valido',
            duplicate_title: 'Duplicato trovato',
            duplicate_found: 'Segnalazione simile trovata',
            duplicate_report: 'È già stata creata una segnalazione simile (No. {reportId})',
            location_out_of_bounds: 'La posizione selezionata è fuori dalla nostra giurisdizione',
            required_field: '{field} è obbligatorio',
            required_fields: 'Si prega di compilare tutti i campi obbligatori',
            please_review: 'Si prega di rivedere il modulo e correggere eventuali errori prima di inviare.',
            file_size: 'Il file selezionato è troppo grande (max. 10 MB)',
            file_type: 'Il formato non è supportato (ammessi: jpg, png, webp)',
            media_upload: 'Errore nel caricamento dell\'immagine',
            invalid_format: 'Formato non valido per {field}',
            photo_required: 'Una foto è richiesta per questa categoria',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway',
            consent_required: 'Please accept the privacy policy'
        },
        rate_limit: {
            title: 'Limite di velocità superato',
            general: 'Si prega di riprovare più tardi.',
            with_time: 'Si prega di riprovare tra {seconds} secondi.'
        },
        network: 'Problema di connessione. Si prega di controllare la connessione internet',
        timeout: 'Tempo scaduto. Si prega di riprovare',
        upload: {
            invalid_type: 'Tipo di file non valido. Si prega di caricare solo immagini.',
            file_too_large: 'File troppo grande. La dimensione massima è {size}.',
            dimensions_too_large: 'Dimensioni immagine troppo grandi. Massimo {width}x{height} pixel.',
            invalid_image: 'File immagine non valido o corrotto.',
            failed: 'Caricamento fallito. Si prega di riprovare.',
            limit_reached: 'Numero massimo di {count} file raggiunto.',
            remove_to_add: 'Rimuovi una foto per aggiungerne una nuova',
            single_file_limit: 'È possibile caricare solo un\'immagine.',
            exact_file_limit: 'È possibile caricare un massimo di {count} immagini.',
            title: 'Upload Error',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'Errore nell\'invio o nel caricamento dell\'immagine.',
        unknown: 'Si è verificato un errore sconosciuto.',
        pending_uploads: 'Si prega di attendere fino al completamento di tutti i caricamenti.',
        incomplete_form: 'Si prega di compilare tutti i campi obbligatori.',
        page: {
            title: 'Errore',
            not_found_title: 'Pagina non trovata',
            not_found_message: 'Spiacenti, la pagina che stai cercando non esiste.',
            server_error_title: 'Errore del server',
            server_error_message: 'Spiacenti, qualcosa è andato storto sul nostro server.',
            generic_title: 'Si è verificato un errore',
            generic_message: 'Si è verificato un errore imprevisto.',
            action_home: 'Torna alla home',
            action_back: 'Torna indietro',
            action_retry: 'Riprova',
            details: 'Dettagli errore'
        }
    },
    success: {
        report_submitted: 'Segnalazione inviata',
        report_submitted_description: 'La tua segnalazione è stata inviata con successo e sarà esaminata a breve.',
        moderation_notice: 'La tua segnalazione sarà esaminata prima della pubblicazione. Il tuo numero di riferimento:',
        submit_another: 'Invia un\'altra segnalazione',
        auto_followed: 'Questa segnalazione è stata aggiunta automaticamente alle tue segnalazioni seguite',
        visibility_limitation_notice: 'Si prega di notare che non tutte le segnalazioni diventano visibili pubblicamente attraverso il sito web. Se la tua segnalazione non si aggiorna nell\'elenco delle segnalazioni seguite, potrebbe comunque essere stata elaborata dalla città. Controlla la tua email per aggiornamenti sullo stato.',
        fun_facts: [
            '🌱 Ogni segnalazione che invii aiuta a rendere la tua città un posto migliore in cui vivere!',
            '🏙️ Le segnalazioni dei cittadini hanno aiutato a risolvere oltre 10.000 problemi nelle città di tutto il mondo.',
            '⚡ La segnalazione media viene esaminata entro 24 ore.',
            '🤝 Fai parte di una comunità che si preoccupa degli spazi pubblici!',
            '📊 I dati delle segnalazioni dei cittadini aiutano i pianificatori urbani a prendere decisioni migliori.',
            '🔄 Seguire le tue segnalazioni ti tiene aggiornato automaticamente sui progressi.',
            '🎯 Le segnalazioni con foto vengono elaborate 3 volte più velocemente delle segnalazioni solo testo.',
            '🌍 Piattaforme di coinvolgimento dei cittadini come questa esistono in oltre 50 paesi.',
            '💡 Il tuo feedback aiuta a dare priorità a quali problemi vengono risolti per primi.',
            '🚀 Le segnalazioni digitali hanno ridotto i tempi di risposta fino al 60%.',
            '🏆 Cittadini attivi creano comunità più forti e resilienti.',
            '🔍 L\'analisi IA aiuta a categorizzare le tue segnalazioni in modo più accurato.',
            '📱 Le segnalazioni mobili rendono facile segnalare problemi non appena li vedi.',
            '⭐ Grazie per essere un cittadino impegnato!'
        ]
    },
    flag: {
        title: 'Segnala questa segnalazione',
        description: 'Aiutaci a mantenere la qualità segnalando contenuti inappropriati.',
        reason_label: 'Perché stai segnalando questa segnalazione?',
        reason_spam: 'Spam o pubblicità',
        reason_offensive: 'Contenuto offensivo o inappropriato',
        reason_personal: 'Contiene dati personali',
        reason_location: 'Posizione errata',
        reason_other: 'Altro',
        details_label: 'Dettagli aggiuntivi',
        details_placeholder: 'Descrivi il problema...',
        details_required: 'Fornisci i dettagli',
        submit: 'Invia',
        success: 'Grazie. Esamineremo questa segnalazione.',
        error: 'Impossibile inviare. Riprova.',
        already_flagged: 'Hai già segnalato questa segnalazione.'
    },

    pwa: {
        install: {
            title: 'Installa app',
            button: 'Installa',
            not_now: 'Non ora',
            description: 'Clicca sull\'icona di installazione nella barra degli indirizzi del tuo browser per installare questa app.',
            share_button: 'Icona condividi',
            open_safari: 'Browser Safari',
            ios: {
                title: 'Aggiungi a schermata Home',
                safari_instructions: 'Tocca l\'icona {icon} e seleziona "Aggiungi a schermata Home".',
                other_instructions: 'Si prega di aprire questo sito in {browser} per installare.'
            },
            chrome: {
                instructions: 'Clicca sull\'icona di installazione {icon} nella barra degli strumenti per installare questa app.'
            },
            edge: {
                instructions: 'Clicca sull\'icona di installazione {icon} nella barra degli indirizzi.'
            },
            firefox: {
                instructions: 'Clicca sull\'icona home {icon} nella barra degli indirizzi.'
            }
        }
    },
    boundaries: {
        loading: 'Caricamento dati confini...',
        error: 'Impossibile convalidare i confini della posizione. Si prega di riprovare più tardi.',
        notLoaded: 'Confini non ancora caricati',
        outsideNonStrict: 'Nota: La posizione selezionata è fuori dai confini di {locationName}.',
        outsideStrict: 'La posizione selezionata è fuori dai confini di {locationName}. Si prega di selezionare una posizione entro i limiti della città.',
        validationUnavailable: 'Convalida confini non disponibile. La tua segnalazione sarà accettata ma potrebbe essere esaminata.'
    },
    filters: {
        title: 'Filtri',
        status: {
            title: 'Stato'
        },
        time: {
            title: 'Tempo',
            today: 'Oggi',
            week: 'Questa settimana',
            month: 'Questo mese'
        },
        category: {
            title: 'Categoria',
            other: 'Altro'
        },
        actions: {
            more: 'Altri filtri',
            expand: 'Altri filtri',
            collapse: 'Meno',
            clear_all: 'Cancella tutto',
            active_count: '{count} filtri attivi',
            toggle: 'Filtri'
        }
    },
    privacy: {
        notice_text: 'Le informazioni sulla privacy possono essere trovate',
        notice_link_text: 'qui',
        modal: {
            title: 'Informativa sulla privacy',
            loading: 'Caricamento informazioni sulla privacy...',
            retry: 'Riprova',
            noContent: 'Nessuna informazione sulla privacy disponibile.',
            lastUpdated: 'Ultimo aggiornamento',
            close: 'Chiudi'
        }
    },
    search: {
        placeholder: 'Cerca segnalazioni...',
        no_results_local: 'Nessun risultato trovato nella vista corrente',
        expand_to_server: 'Cerca tutte le segnalazioni',
        expand_hint: 'Cerca oltre la vista corrente',
        searching_server: 'Ricerca in tutte le segnalazioni...'
    },
    info: {
        welcome: {
            heading: 'Benvenuto su {name}',
            headingGeneric: 'Benvenuto',
            body: 'Usa questa mappa per segnalare problemi o scoprire le segnalazioni esistenti nella tua area.'
        },
        shortcuts: {
            aria_label: 'Azioni rapide',
            photo: {
                title: 'Foto',
                description: 'Scatta una foto, l\'IA fa il resto',
                aria_label: 'Crea una segnalazione con foto'
            },
            classic: {
                title: 'Classica',
                description: 'Descrivi e localizza il problema',
                aria_label: 'Crea una segnalazione classica'
            },
            following: {
                title: 'Segui',
                description: 'Resta informato sui progressi',
                aria_label: 'Apri le segnalazioni seguite'
            },
            list: {
                title: 'Esplora',
                description: 'Scopri cosa succede vicino a te',
                aria_label: 'Esplora la mappa e visualizza l\'elenco'
            }
        }
    },
    auth: {
        login: {
            title: 'Accedi',
            subtitle: 'Inserisci la tua email per ricevere un codice di verifica',
            email_label: 'Indirizzo email',
            email_hint: 'Ti invieremo un codice a 6 cifre',
            email_placeholder: 'indirizzo email',
            send_code: 'Invia codice di verifica',
            disabled: {
                title: 'Accesso non disponibile',
                message: 'L\'accesso senza password non è attivato qui. Contatta l\'amministratore se hai bisogno di accedere.',
                back_button: 'Torna alla home'
            }
        },
        verify: {
            email_label: 'Indirizzo email',
            code_label: 'Codice di verifica',
            code_hint: 'Inserisci il codice a 6 cifre dalla tua email',
            code_placeholder: '123456',
            verify_button: 'Verifica e accedi',
            back_button: 'Usa email diversa',
            request_new: 'Richiedi nuovo codice',
            resend_code: 'Invia di nuovo codice',
            expires_in: 'Il codice scade tra {time}',
            expired_title: 'Codice scaduto',
            expired_message: 'Il tuo codice di verifica è scaduto. Si prega di richiederne uno nuovo.'
        },
        code_sent: {
            title: 'Codice inviato',
            message: 'Abbiamo inviato un codice di verifica a 6 cifre a {email}'
        },
        error: {
            title: 'Errore di autenticazione',
            request_failed: 'Impossibile inviare il codice di verifica. Si prega di riprovare.',
            verify_failed: 'Codice di verifica non valido o scaduto',
            sso_failed: 'Accesso non riuscito. Riprova.',
            network: 'Errore di rete. Si prega di controllare la connessione.',
            logout_failed: 'Impossibile disconnettersi. Si prega di riprovare.'
        },
        sso: {
            completing: 'Completamento accesso...',
            method_label: 'Accesso single sign-on',
            button_aria: 'Accedi con {provider} tramite single sign-on'
        },
        user: {
            logged_in_as: 'Accesso effettuato come',
            logout: 'Disconnetti'
        },
        welcome: {
            greeting: 'Ciao, {name}',
            sign_in: 'Accedi',
            sign_out: 'Disconnetti',
            user_avatar: 'User avatar'
        }
    },
    profile: {
        title: 'Profilo',
        account: {
            title: 'Account',
            roles: 'Ruoli'
        },
        groups: {
            title: 'Gruppi'
        },
        appearance: {
            title: 'Aspetto',
            color_mode: 'Modalità colore',
            light: 'Chiaro',
            dark: 'Scuro',
            system: 'Sistema',
            theme_override: 'Colori tema personalizzati',
            theme_override_description: 'Sovrascrivi il tema predefinito della giurisdizione con le tue preferenze di colore',
            primary_color: 'Colore primario',
            secondary_color: 'Colore secondario',
            neutral_color: 'Colore neutro',
            reset_theme: 'Ripristina predefinito'
        },
        language: {
            title: 'Lingua',
            select: 'Seleziona lingua',
            save_failed: 'Impossibile salvare la preferenza della lingua. Riprova.'
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
    pages: {
        dialog_description: 'View page content'
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
            title: 'Pagina non trovata',
            description: 'La pagina che cerchi non esiste o è stata spostata.'
        },
        403: {
            title: 'Accesso negato',
            description: 'Non hai i permessi per visualizzare questa pagina.'
        },
        500: {
            title: 'Qualcosa è andato storto',
            description: 'Si è verificato un errore imprevisto. Riprova.'
        },
        fallback: {
            title: 'Errore',
            description: 'Si è verificato un errore imprevisto.'
        },
        actions: {
            back: 'Indietro',
            home: 'Torna alla home',
            retry: 'Riprova'
        }
    },
    legal: {
        impressum: {
            title: 'Note legali',
            heading: 'Note legali',
            responsible_heading: 'Responsabile del contenuto',
            responsible_text: '{name} è responsabile del contenuto di questa piattaforma.'
        },
        privacy: {
            title: 'Informativa sulla privacy',
            heading: 'Informativa sulla privacy',
            intro: 'La protezione dei vostri dati personali è importante per noi. Trattiamo i vostri dati esclusivamente sulla base delle disposizioni di legge (GDPR).',
            controller_heading: 'Titolare del trattamento',
            data_heading: 'Dati raccolti',
            data_text: 'Durante l\'utilizzo di questa piattaforma vengono trattati i seguenti dati: dati di localizzazione della segnalazione, testo descrittivo, foto caricate e dati tecnici di accesso (indirizzo IP, tipo di browser, ora di accesso).',
            rights_heading: 'I vostri diritti',
            rights_text: 'Avete il diritto di accesso, rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e opposizione.'
        },
        terms: {
            title: 'Condizioni d\'uso',
            heading: 'Condizioni d\'uso',
            intro: 'Utilizzando questa piattaforma, accettate le seguenti condizioni.',
            purpose_heading: 'Scopo',
            purpose_text: 'Questa piattaforma serve per segnalare problemi negli spazi pubblici. Le segnalazioni vengono inoltrate all\'autorità competente.',
            obligations_heading: 'Obblighi dell\'utente',
            obligations_text: 'Vi impegnate a fornire solo informazioni veritiere e a non caricare contenuti illegali. Le foto caricate non devono mostrare persone riconoscibili senza il loro consenso.',
            liability_heading: 'Responsabilità',
            liability_text: '{name} non si assume alcuna responsabilità per la completezza e l\'accuratezza delle informazioni fornite.'
        },
        email_label: 'E-mail',
        contact_label: 'Contatto',
        platform: {
            heading: 'Operatore della piattaforma',
            intro: 'Questa piattaforma è gestita tecnicamente da:',
            description: 'Civic Patches GmbH fornisce l\'infrastruttura tecnica per la piattaforma Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Germania',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operatore di questa mappa',
            not_configured: 'L\'operatore di questa mappa non ha ancora fornito le proprie informazioni legali. Gli operatori di servizi online accessibili al pubblico potrebbero essere tenuti a fornire un avviso legale e un\'informativa sulla privacy.'
        },
        footer: {
            impressum: 'Note legali',
            privacy: 'Privacy',
            terms: 'Condizioni d\'uso'
        },
        not_configured: 'I dati dell\'operatore non sono ancora configurati.'
    },
    demo_mode: {
        banner: {
            title: 'Istanza di dimostrazione',
            message: 'Le segnalazioni inserite qui non vengono inoltrate ad alcuna autorità.',
            link_label: 'Visita mark-a-spot.com',
            minimize_label: 'Riduci avviso demo',
            expand_label: 'Espandi avviso demo'
        },
        reset: {
            title: 'Database demo',
            notice: 'Il sistema demo viene ripristinato ogni ora.',
            countdown_label: 'Prossimo reset tra',
            countdown_aria: 'Prossimo reset del database demo tra {time}'
        },
        modal: {
            title: 'Invio di dimostrazione',
            body: 'Questa è una demo. La tua segnalazione NON verrà inoltrata al comune. Continuare con l\'invio di dimostrazione?',
            confirm_label: 'Invia segnalazione demo',
            cancel_label: 'Annulla'
        },
        lite: {
            title: 'Solo dimostrazione',
            heading: 'Istanza di dimostrazione',
            body: 'Questa è una dimostrazione di Mark-a-Spot. Gli invii tramite il modulo semplificato sono disabilitati qui affinché le segnalazioni reali non raggiungano mai accidentalmente un comune.',
            link_label: 'Visita mark-a-spot.com'
        }
    },
    print: {
        title: 'Rapporto di richiesta di servizio',
        description: 'Descrizione',
        location: 'Posizione',
        media: 'Allegati',
        image_unavailable: 'Image unavailable',
        attributes: 'Campi aggiuntivi',
        status_history: 'Storico stati',
        internal_fields: 'Informazioni interne',
        organisation: 'Ufficio',
        hazard_level: 'Livello di rischio',
        hazard_category: 'Categoria di rischio',
        sentiment: 'Sentiment',
        printed_at: 'Stampato il',
        showing_recent: 'Visualizzazione di {count} su {total} aggiornamenti'
    }
};
