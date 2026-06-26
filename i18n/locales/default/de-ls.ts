// locales/de-ls.ts (Leichte Sprache)
// REGISTER: Leichte Sprache = vereinfachtes DEUTSCH (für Menschen mit Lese-Schwierigkeiten).
// NIEMALS Plattdeutsch / Niedersächsisch (Low Saxon). "ls" steht für Leichte Sprache, nicht Low Saxon.
export default {
    locale: {
        code: 'de-LS'
    },
    meta: {
        description: 'Mark-a-Spot'
    },
    nav: {
        map: 'Karte',
        dashboard: 'Verwaltung',
        back_to_frontend: 'Zurück zur Karte'
    },
    dashboard: {
        title: 'Verwaltung',
        welcome: 'Hallo, {name}',
        nav: {
            dashboard: 'Start',
            requests: 'Meldungen',
            settings: 'Einstellungen',
            categories: 'Kategorien',
            jurisdictions: 'Zuständig-Keiten',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'Sprachen',
            billing: 'Abrechnung'
        },
        help: {
            docs: 'Dokumentation',
            support: 'Hilfe bekommen'
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
            profile: 'Mein Profil',
            logout: 'Abmelden'
        },
        stats: {
            total: 'Alle Meldungen',
            pending: 'Warten',
            in_progress: 'In Arbeit',
            resolved: 'Fertig',
            my_groups: 'Meine Gruppen',
            overall: 'Alle'
        },
        recent_requests: 'Neue Meldungen',
        view_all: 'Alle zeigen',
        no_recent: 'Keine neuen Meldungen',
        wms: {
            title: 'Kartenlagen',
            attribution: 'Daten: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'Nummer',
                media: 'Bilder',
                category: 'Art',
                status: 'Stand',
                created: 'Datum'
            }
        },
        jurisdiction: {
            current: 'Workspace',
            citizenView: 'Citizen View',
            switchTo: 'Switch to',
            blocked: 'gesperrt',
            admin_section_header: 'Alle Workspaces (Admin-Zugriff)'
        }
    },
    form: {
        body: 'Was ist das Problem?',
        body_description: 'Schreiben Sie hier das Problem auf.',
        body_placeholder: 'Problem schreiben...',
        category: 'Art des Problems',
        category_description: 'Wählen Sie die Art vom Problem.',
        category_placeholder: 'Art vom Problem wählen',
        category_disabled: {
            title: 'Art des Problems gewählt',
            description: 'Sie haben die Art des Problems "{category}" gewählt. Diese Art hat besondere Regeln. Sie können das Formular nicht mehr ändern.'
        },
        category_empty: 'Es gibt keine Problem-Arten.',
        category_loading: 'Problem-Arten werden geladen...',
        category_disabled_notice: 'Diese Art ist nur zur Information. Sie können hier keine Meldung machen.',
        category_description_loading: 'Text wird geladen...',
        category_description_error: 'Der Text konnte nicht geladen werden.',
        email: 'E-Mail',
        email_description: 'Ihre E-Mail-Adresse',
        email_placeholder: 'E-Mail schreiben',
        first_name: 'Vor-Name',
        first_name_description: 'Ihr Vor-Name',
        first_name_placeholder: 'Vor-Name schreiben',
        last_name: 'Nach-Name',
        last_name_description: 'Ihr Nach-Name',
        last_name_placeholder: 'Nach-Name schreiben',
        gdpr: 'Daten-Schutz',
        gdpr_description: 'Ich bin damit einverstanden. Sie dürfen meine Daten nutzen.',
        object_id: 'Nummer vom Objekt',
        object_id_description: 'Nummer von dem kaputten Ding',
        object_id_placeholder: 'Nummer schreiben',
        phone: 'Telefon-Nummer',
        phone_description: 'Ihre Telefon-Nummer',
        phone_placeholder: 'Telefon-Nummer schreiben',

        // Einrichtungs-basierte Meldungen
        facility: 'Einrichtung',
        facility_plural: 'Einrichtungen',
        facility_placeholder: '{label} wählen',
        facility_required: '{label} muss ausgefüllt werden.',
        facility_unavailable: 'Die gewählte Einrichtung gibt es nicht mehr. Bitte wählen Sie eine andere.',
        facility_nearest_snapped: 'Nächste Einrichtung: {label}',
        facility_no_nearby: 'Keine Einrichtung in der Nähe. Bitte suchen Sie selbst.',
        facility_use_my_location: 'Meinen Ort verwenden',
        facility_locating: 'Ort wird gesucht…',
        facility_no_match: 'Keine Einrichtung passt zu Ihrer Suche.',
        facility_opens_in_new_tab: '(öffnet in neuem Fenster)',
        facility_deselected_map_pick: 'Eigener Ort statt {label}',
        facility_tagged_with: 'Bei: {label}',

        imagelist: {
            empty: 'Es gibt keine Bilder für diese Art.'
        },
        back_to_report: 'Back to report form',
        requirements: {
            title: 'Still required',
            ready_to_submit: 'Ready to submit',
            photo: 'Upload a photo',
            category: 'Select a category',
            location: 'Provide location',
            description: 'Enter a description',
            email: 'Provide email address',
            privacy: 'Accept privacy policy',
            privacyBlock: 'Datenschutz-Foto ersetzen oder löschen',
            conditional: 'depending on category'
        },
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'Sie müssen das Problem schreiben',
        category_required: 'Sie müssen die Art vom Problem wählen',
        email_required: 'Sie müssen eine E-Mail schreiben',
        email_format: 'Die E-Mail ist nicht richtig',
        first_name_required: 'Sie müssen den Vor-Namen schreiben',
        last_name_required: 'Sie müssen den Nach-Namen schreiben',
        gdpr_required: 'Sie müssen beim Daten-Schutz zustimmen',
        object_id_required: 'Sie müssen die Nummer schreiben',
        phone_required: 'Sie müssen die Telefon-Nummer schreiben',
        required_field: '{field} müssen Sie ausfüllen'
    },
    feedback: {
        page_title: 'Was sagen Sie zu der Meldung?',
        error_title: 'Fehler beim Laden',
        invalid_request: 'Die Meldung gibt es nicht mehr',
        thank_you: 'Vielen Dank für Ihre Meinung!',
        submission_received: 'Wir haben Ihre Meinung bekommen',
        loading: 'Meldung wird geladen...',
        title: 'Ihre Meinung zu: {service}',
        description: 'Schreiben Sie Ihre Meinung',
        placeholder: 'Ihre Meinung hier schreiben...',
        reopen_request: 'Ich will, dass Sie das Problem nochmal bearbeiten',
        submitting: 'Wird gesendet...',
        sending: 'Wird gesendet...',
        submit: 'Meinung senden',
        existing_title: 'Ihre Meinung zu: {service}',
        already_submitted: 'Sie haben schon eine Meinung geschrieben',
        missing_uuid: 'Die Meldungs-Nummer fehlt',
        success_notification: 'Meinung wurde gesendet',
        success_with_id: 'Meinung für Meldung Nr. {id} wurde gesendet',
        updated_successfully: 'Meinung wurde geändert',
        added_to_list: 'Die Meldung steht jetzt in Ihrer Liste',
        submission_error: 'Meinung konnte nicht gesendet werden',
        server_error: 'Server-Fehler: Wir können die Meinung gerade nicht bearbeiten',
        submission_failed: 'Meinung konnte nicht gesendet werden. Versuchen Sie es später noch mal',
        already_exists: 'Es gibt schon eine Meinung zu dieser Meldung',
        error_fetching_request: 'Fehler beim Laden von der Meldung',
        no_content: 'Keine Meinung da',
        refresh_complete: 'Liste wurde erneuert',
        try_again: 'Noch mal versuchen',
        format_unrecognized: 'Wir verstehen die Meldung nicht',
        processing_error: 'Fehler beim Bearbeiten von der Meldung',
        your_feedback: 'Ihre Meinung',
        contact_preference: 'Wie wollen Sie Kontakt?',
        no_contact: 'Kein Kontakt',
        email_contact: 'Kontakt über E-Mail',
        email_placeholder: 'Ihre E-Mail-Adresse',
        set_status_open: 'Problem wieder öffnen',
        set_status_open_description: 'Wenn wir uns nochmal darum kümmern sollen, können Sie das Problem wieder öffnen.',
        email_verification: 'E-Mail prüfen',
        email_verification_placeholder: 'E-Mail von der ersten Meldung',
        email_verification_description: 'Schreiben Sie die E-Mail von der ersten Meldung.',
        email_mismatch: 'Die E-Mail ist nicht die gleiche wie bei der ersten Meldung.',
        unauthorized_access: 'Sie dürfen das nicht. Prüfen Sie Ihre E-Mail.',
        service_provider: {
            title: 'Arbeit fertig machen',
            your_email: 'Ihre E-Mail',
            email_placeholder: 'Ihre E-Mail schreiben',
            email_verification_note: 'Schreiben Sie Ihre richtige E-Mail',
            completion_notes: 'Was haben Sie gemacht?',
            notes_placeholder: 'Schreiben Sie hier, was Sie gemacht haben...',
            mark_as_completed: 'Fertig machen',
            mark_completed_description: 'Sagen, dass die Arbeit fertig ist',
            completion_success: 'Arbeit ist fertig!',
            complete_request: 'Arbeit fertig machen',
            page_title: 'Service Provider Response',
            page_description: 'Submit completion notes for assigned service requests',
            modal_title: 'Service Provider Response',
            dialog_description: 'Service provider response form dialog',
            mark_as_completed_description: 'Set the request status to completed',
            submit_completion: 'Submit Completion',
            completing: 'Submitting...',
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
        not_eligible: 'This service request is not currently eligible for feedback',
        dialog_description: 'Feedback form dialog'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mängelmelder',
        app_claim: 'Deine Meldung. Unsere Lösung.'
    },
    service_unavailable: {
        title: 'Dienst funktioniert gerade nicht',
        try_later: 'Bitte versuchen Sie es später noch einmal.',
        reload: 'Neu laden',
        message: 'We are unable to connect to our services right now. This is likely a temporary issue.',
        retry: 'We are experiencing technical difficulties. Please try again in {seconds} seconds.',
        auto_retry: 'Retrying in {seconds} seconds...',
        retry_now: 'Try now'
    },
    hiddenSection: {
        description: 'Der Mängel-Melder ist ein System für Infrastruktur-Probleme. Sie können direkt Probleme melden. Oder Sie gehen zu diesen Bereichen:',
        main_navigation: 'Haupt-Navigation mit Infos, einer Liste von Meldungen und Zahlen',
        map: 'Interaktive Karte mit Zeichen',
        map_navigation_hint: 'Nutzen Sie ⬆️⬇️⬅️➡️ Pfeil-Tasten für Navigation zwischen Meldungs-Zeichen, ↩️ Enter zum Wählen, ❌ Escape zum Löschen',
        action_button: 'Direkt melden',
        keyboard_navigation_hint: 'Nutzen Sie ↑↓ Pfeil-Tasten für Navigation, Enter zum Aktivieren',
        skip_to_main_content: 'Zum Haupt-Inhalt springen'
    },
    accessibility: {
        skip_to_main: 'Zum Haupt-Inhalt springen',
        skip_to_map: 'Zur Karte springen',
        skip_to_navigation: 'Zur Navigation springen',
        skip_to_form: 'Direkt melden',
        leichte_sprache_indicator: 'Leichte Sprache - Einfache Texte für alle'
    },
    common: {
        close: 'Schließen',
        loading: 'Lädt...',
        error: 'Fehler',
        success: 'Gut',
        submit: 'Senden',
        cancel: 'Abbrechen',
        required: 'Muss ausgefüllt werden',
        save: 'Speichern',
        delete: 'Löschen',
        edit: 'Ändern',
        clear: 'Löschen',
        search: 'Suchen',
        select: 'Wählen',
        on: 'An',
        off: 'Aus',
        toggle: 'Umschalten',
        yesterday: 'Gestern',
        current: 'Jetzt',
        buttons: {
            toggle_theme: 'Design ändern',
            attribution: 'Karten-Infos',
            close: 'Schließen'
        },
        navigation: 'Menü-Bereich',
        drawer_description: 'Inhalts-Fenster',
        resize_drawer: 'Panel anpassen',
        drawer_position_n_of_total: 'Position {idx} von {total}',
        back: 'Back',
        not_classified: 'Nicht eingeordnet',
        no_value: 'Kein Wert',
        did_you_know: 'Did you know?',
        show_more: 'Show more',
        show_less: 'Show less',
        learn_more: 'Mehr erfahren',
        learn_more_about: 'Mehr über {topic} erfahren',
        opens_in_new_tab: '(öffnet in neuem Tab)',
        title: {
            classic: 'Classic Report',
            photo: 'Photo Report'
        },
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'Ort',
        field_gdpr: 'Daten-Schutz',
        field_e_mail: 'E-Mail',
        field_category: 'Art vom Problem',
        field_request_media: 'Fotos',
        field_name: 'Nach-Name',
        field_prename: 'Vor-Name',
        field_first_name: 'Vor-Name',
        field_first_name_placeholder: 'Vor-Name schreiben',
        field_last_name: 'Nach-Name',
        field_last_name_placeholder: 'Nach-Name schreiben',
        field_phone: 'Telefon',
        body: 'Was ist das Problem?',
        field_add_data: 'Bei Gewinn-Spiel mitmachen',
        field_terms_of_use: 'Ich stimme den Regeln und Daten-Schutz-Hinweisen zu.',
        field_address: 'Adresse',
        postal_code: 'Post-Leit-Zahl',
        postal_code_placeholder: 'zum Beispiel 80331',
        city: 'Stadt',
        city_placeholder: 'zum Beispiel München',
        street_address: 'Straße und Haus-Nummer',
        street_address_placeholder: 'zum Beispiel Haupt-Straße 123'
    },
    competition: {
        intro: 'Wenn Sie wollen, können Sie bei unserer jährlichen Verlosung mitmachen. Sie können tolle Sach-Preise und Geld-Preise gewinnen. Wir verlosen sie unter allen Teilnehmern als kleines Danke-Schön.',
        disclaimer: 'Mitarbeiter von den zuständigen Abteilungen dürfen nicht mitmachen.',
        title: 'Bei Gewinn-Spiel mitmachen',
        errors: {
            already_exists: 'Gewinn-Spiel-Eintrag gibt es schon',
            duplicate_found: 'Doppelt gefunden',
            duplicate_detail: 'Für diese Meldung gibt es schon einen Gewinn-Spiel-Eintrag.',
            not_found: 'Meldung nicht gefunden',
            not_found_detail: 'Die Meldung konnte nicht gefunden werden.',
            save_failed: 'Gewinn-Spiel-Eintrag konnte nicht gespeichert werden',
            submission_error: 'Fehler beim Senden',
            submission_error_detail: 'Ihr Gewinn-Spiel-Eintrag konnte nicht gespeichert werden. Aber Ihre Meldung wurde gesendet.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Infos Tab',
                panel_label: 'Info-Bereich'
            },
            list: {
                label: 'Liste',
                aria_label: 'Meldungs-Liste Tab',
                panel_label: 'Meldungs-Listen-Bereich'
            },
            following: {
                label: 'Folgen',
                aria_label: 'Gefolgte Meldungen Tab',
                panel_label: 'Gefolgte Meldungen Bereich'
            },
            stats: {
                label: 'Zahlen',
                aria_label: 'Zahlen Tab',
                panel_label: 'Zahlen-Bereich'
            }
        },
        main: 'Haupt-Navigation',
        pages: 'Seiten-Navigation',
        panel: {
            scrollable: 'Bereich zum Scrollen'
        },
        updates_count: '{count} neue Updates',
        browse_reports: 'Browse Reports',
        back_to_form: 'Back to Form'
    },
    report: {
        form_types: 'Arten von Meldungen',
        how_to_help: 'So machen Sie eine Meldung',
        title: {
            photo: 'Foto-Meldung',
            classic: 'Normale Meldung',
            submit: 'Meldung senden',
            edit: 'Meldung ändern',
            view: 'Meldung ansehen'
        },
        photo: {
            description: 'Eine neue Meldung mit einem Foto machen'
        },
        classic: {
            description: 'Eine neue Meldung ohne Foto machen'
        },
        status: {
            new: 'Neu',
            open: 'Offen',
            in_progress: 'Wird bearbeitet',
            resolved: 'Gelöst',
            closed: 'Geschlossen',
            unknown: 'Status unbekannt'
        },
        form: {
            description: {
                label: 'Was ist das Problem?',
                placeholder: 'Schreiben Sie das Problem...',
                ai_processing: 'Computer schreibt eine Beschreibung...',
                help: 'Schreiben Sie viele Details'
            },
            category: {
                label: 'Art vom Problem',
                placeholder: 'Bitte wählen',
                loading: 'Arten werden geladen...',
                error: 'Fehler beim Laden von den Arten',
                empty: 'Keine Arten da',
                help: 'Art wählen (passiert automatisch)',
                description: 'Beschreibung von der Art',
                description_loading: 'Beschreibung wird geladen...',
                description_error: 'Fehler beim Laden von der Beschreibung',
                disabled_notice: 'Diese Art ist nur für Infos. Sie können keine Meldungen machen.'
            },
            location: {
                label: 'Ort',
                placeholder: 'Ort suchen...',
                selected: 'Ort gewählt',
                warning: 'Hinweis zum Ort',
                unknown_location: 'Ort unbekannt',
                suggestions: 'Ort-Vorschläge',
                clear: 'Ort löschen',
                error: 'Fehler beim Finden vom Ort',
                help: 'Schreiben Sie eine Adresse oder klicken Sie auf die Karte',
                help_modal: 'Schreiben Sie eine Adresse. Oder: Nutzen Sie Ihren aktuellen Ort.',
                current: 'Meinen Ort nutzen',
                searching: 'Suche...',
                pick_on_map: 'Pick on map',
                auto_detected: 'Location detected',
                complete_address: 'Adresse ist komplett',
                from_photo_exif: 'Location automatically extracted from photo metadata'
            },
            email: {
                label: 'E-Mail für Updates',
                placeholder: 'E-Mail schreiben',
                help: 'Wir senden Ihnen Updates zu Ihrer Meldung',
                subscribe: 'Updates abonnieren'
            },
            gdpr: {
                label: 'Daten-Schutz-Zustimmung',
                description: 'Ich bin damit einverstanden. Sie dürfen meine Daten nutzen.',
                required: 'Sie müssen zustimmen um weiter zu machen',
                link: 'Daten-Schutz-Erklärung anzeigen'
            },
            media: {
                label: 'Fotos',
                required: 'Für diese Art brauchen Sie ein Foto',
                upload: {
                    overall_progress: 'Fortschritt beim Hochladen',
                    button: 'Zum Hochladen klicken',
                    or: ' oder',
                    drag: 'mit Ziehen und Ablegen',
                    drop_here: 'Dateien hier ablegen',
                    restrictions: 'Bis zu {count} Bilder hochladen ({size} maximal, {types})',
                    progress: 'Fortschritt beim Hochladen',
                    started_sr: 'Hochladen gestartet',
                    progress_sr: 'Hochladen {progress}% fertig',
                    success_sr: 'Hochladen fertig',
                    error_sr: 'Hochladen fehlgeschlagen: {error}',
                    files_selected_sr: '{count} Datei(en) zum Hochladen gewählt',
                    area_label: 'Bereich zum Hochladen – klicken oder Dateien hierher ziehen',
                    in_progress: 'Hochladen läuft',
                    complete_sr: 'Datei wurde hochgeladen.',
                    restrictions_single: 'One image ({size} max., {types})',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'Bild-Vorschau',
                remove: 'Bild entfernen',
                no_image_available: 'Kein Bild vorhanden oder aus rechtlichen Gründen nicht angezeigt',
                progress: 'Upload-Fortschritt: {progress}%',
                limit_reached: 'Maximale Anzahl von {count} Bildern erreicht',
                privacy_notice: 'Keine Personen oder Auto-Kennzeichen fotografieren',
                ai_analysis: 'Beschreibung mit Azure Computer (Deutschland)',
                ai_analysis_help: 'Infos zur Computer-Hilfe',
                ai_analysis_tooltip: 'Mit dem Upload bestätigen Sie: Das Foto ist rechtmäßig gemacht. Es verletzt keine Rechte von anderen Personen. Wenn Personen oder Kennzeichen zu sehen sind, machen Sie sie unkenntlich vor dem Upload. Die Analyse dient nur zur Kategorisierung Ihrer Meldung. Es wird nur eine verkleinerte Kopie ohne EXIF-Daten an Azure OpenAI (Deutschland) übertragen. Das Original wird nicht an den Dienst gesendet.',
                offline_cached: 'Saved offline'
            },
            submit: {
                button: 'Meldung senden',
                submitting: 'Wird gesendet...',
                processing: 'Wird bearbeitet...',
                success: 'Meldung wurde eingereicht',
                error: 'Fehler beim Senden von der Meldung',
                loading: 'Formular wird geladen...'
            },
            draft_saved: 'Entwurf gespeichert',
            tabs: {
                photo: 'With Photo',
                classic: 'Classic'
            },
            loading: 'Loading report form...',
            modal_description: 'Create a new report'
        },
        ai: {
            label: 'Mit Computerhilfe',
            powered: 'Computer-unterstützt',
            analyzing: 'Computerhilfe angefragt für Ihre Fotos...',
            started_sr: 'Computer-Beschreibung gestartet',
            complete_sr: 'Computer ist fertig',
            field_updated_sr: '{field} wurde aktualisiert mit: {value}',
            analysis_complete_sr: 'Computer ist fertig.',
            category_result_sr: 'Art gewählt: {category}.',
            description_result_sr: 'Beschreibung gemacht: {description}',
            location_result_sr: 'Ort gefunden: {location}.',
            category_hint: 'Dieses Foto passt nicht zu unseren Kategorien. Bitte wähle selbst eine aus.',
            processing: {
                analyzing: 'Frage den Computer ...',
                location: 'Prüfe Bild-Daten...',
                location_found: 'Ort gefunden:',
                location_ai: 'Suche Ort im Bild...',
                location_complete: 'Ort gefunden',
                category: 'Finde Art...',
                category_found: 'Art gefunden:',
                description: 'Mache Beschreibung...',
                description_complete: 'Beschreibung gemacht',
                attributes_filled: '{count} zusätzliche(s) Feld(er) vorausgefüllt',
                complete: 'Computer ist fertig',
                error: 'Fehler bei der Computer-Hilfe',
                privacy_warning: 'Daten-Schutz-Hinweis',
                location_not_found: 'Location not found in image metadata.',
                category_not_matched: 'Category suggested by AI (needs selection)'
            },
            privacy: {
                title: 'Daten-Schutz-Hinweis',
                description: 'Auf Ihrem Foto wurden vielleicht persönliche Daten gefunden ({issues}). Das Foto wird vor der Veröffentlichung geprüft.',
                required: 'Auf diesem Foto sind Daten, die nicht gezeigt werden dürfen. Es gibt keine automatische Unkenntlichmachung. Das Foto kann nicht verwendet werden. Bitte nehmen Sie ein anderes Foto oder löschen Sie dieses Foto.',
                removePhoto: 'Foto löschen',
                replace: 'Anderes Foto nehmen',
                understood: 'Mit diesem Foto weiter machen'
            },
            failed: {
                title: 'Bild-Prüfung geht gerade nicht',
                description: 'Ihr Bild wird von Hand geprüft, bevor es veröffentlicht wird. Sie können die Meldung trotzdem senden.'
            },
            budget_exhausted_title: 'KI-Prüfung wurde nicht gemacht',
            budget_exhausted_submitted: 'Das KI-Guthaben ist diesen Monat aufgebraucht. Ihre Meldung wurde trotzdem gesendet.'
        },
        buttons: {
            photo: 'Foto-Meldung',
            classic: 'Normale Meldung',
            follow: 'Meldung folgen',
            following: 'Folgen',
            share: 'Meldung teilen',
            print: 'Drucken',
            flag: 'Melden',
            flag_submitted: 'Bereits gemeldet',
            copy_link: 'Link kopieren',
            link_copied: 'Link in die Zwischenablage kopiert',
            email: 'E-Mail',
            directions: 'Weg zeigen'
        },
        following: {
            count: 'Eine Meldung, der Sie folgen | {count} Meldungen, denen Sie folgen',
            mark_all_read: 'Alle als gelesen markieren',
            no_reports: 'Noch keine Meldungen, deren Status Sie verfolgen',
            no_address: 'Keine Adresse verfügbar',
            status_updated: 'Status aktualisiert',
            status_changed: 'Status geändert zu:',
            awaiting_server: 'Wartet auf Update',
            escalated_to: 'Weitergeleitet an {jurisdiction}',
            escalated_click: 'Tippen, um in neuer Zustaendigkeit zu oeffnen',
            unavailable: 'Diese Meldung ist derzeit nicht verfuegbar. Bitte pruefen Sie Ihre E-Mails oder kontaktieren Sie uns.',
            date: {
                today: 'Heute',
                tomorrow: 'Morgen',
                yesterday: 'Gestern',
                unknown: 'Unknown date'
            }
        }
    },
    map: {
        loading: 'Karte wird geladen...',
        controls: {
            zoom_in: 'Größer machen',
            zoom_out: 'Kleiner machen',
            find_location: 'Meinen Ort finden',
            toggle_heatmap: 'Dichte-Karte an/aus',
            toggle_language: 'Sprache ändern',
            add_report_here: 'Hier melden',
            adjust_tilt: 'Karte kippen',
            degrees: '{count} Grad',
            layers: 'Karten-Ebenen',
            no_layers: 'Keine Ebenen da',
            geolocation: {
                label: 'Ort ermitteln'
            },
            zoom: 'Zoom controls'
        },
        tap_to_load: 'Tap to show map',
        tap_to_select_location: 'Tap on map to select location',
        loading_address: 'Loading address...',
        retry_attempt: 'Attempt {count}',
        confirm_location: 'Confirm location',
        add_report_here: 'Add report here',
        pick: {
            drag_hint: 'Drag marker to adjust position'
        },
        tooltip: {
            label: 'Infos zum Kartenzeiger',
            opens_form_above: 'Opens form above',
            opens_modal: 'Opens in dialog'
        },
        keyboard: {
            canvasInstructions: 'Das ist eine Karte. Sie zeigt Meldungen. Pfeil-Tasten: zwischen Meldungen wechseln. Umschalt und Pfeil: Karte verschieben. Enter: auswählen. Strg+= zum Vergrößern, Strg+- zum Verkleinern.',
            noFeatures: 'Keine Meldungen sichtbar. Zoomen Sie rein oder verschieben Sie die Karte.',
            zoomedIntoCluster: 'Hineingezoomt in eine Gruppe. Pfeil-Tasten: zwischen Meldungen wechseln.',
            clusterFocused: 'Gruppe mit {count} Meldungen. Enter drücken zum Öffnen. {position}',
            clusterExpanded: 'Gruppe geöffnet: {count} Meldungen. {featureLabel}',
            markerFocused: 'Meldung: {name} bei {address}{context}. Enter drücken für Details. {position}',
            expandedContext: ' (aus Gruppe geöffnet)',
            untitledReport: 'Meldung ohne Titel',
            unknownLocation: 'Ort',
            featurePosition: 'Meldung {current} von {total}.',
            pannedToExplore: 'Karte nach {direction} verschoben. Umschalt loslassen und Pfeil-Tasten nutzen.',
            pannedNoMarkers: 'Karte nach {direction} verschoben. Keine Meldungen in dieser Richtung.'
        }
    },
    detail: {
        location: 'Ort',
        photos: 'Fotos',
        description: 'Was ist das Problem?',
        status_history: 'Status-Verlauf',
        updates: 'Updates',
        no_updates: 'Noch keine Updates',
        edit: 'Bearbeiten',
        follow: {
            button: 'Folgen',
            following: 'Folgen',
            stop: 'Nicht mehr folgen',
            success: 'Sie folgen jetzt dieser Meldung',
            error: 'Fehler beim Folgen von der Meldung',
            updating: 'Wird aktualisiert...'
        },
        unavailable: {
            title: 'Meldung nicht da',
            message: 'Diese Meldung gibt es nicht. Oder sie wurde noch nicht veröffentlicht. Neue Meldungen brauchen manchmal etwas Zeit.'
        },
        dialog_description: 'View report details'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Verteilung',
        total_reports: 'Meldungen insgesamt',
        status_distribution: 'Status-Verteilung',
        category_distribution: 'Art-Verteilung',
        uncategorized: 'Nicht kategorisiert',
        showing_reports: 'Zeige {visible} von {total} Meldungen',
        no_reports: 'Keine Meldungen da',
        open_reports: 'Offene Meldungen',
        closed_reports: 'Geschlossene Meldungen',
        no_data_available: 'Keine Daten da',
        expand: 'Details zeigen',
        collapse: 'Details verstecken',
        subcategory: 'Unter-Art',
        subcategories: 'Unter-Arten'
    },
    time: {
        days_ago: 'vor {count} Tagen',
        just_now: 'Gerade eben',
        minutes_ago: 'vor {count} Minuten',
        hours_ago: 'vor {count} Stunden',
        yesterday: 'Gestern',
        today: 'Heute'
    },
    list: {
        showing: 'Zeige {visible} von {total} Meldungen',
        showing_in_area: 'Zeige {visible} in diesem Bereich. Insgesamt: {total}',
        showing_area_only: 'Zeige {visible} in diesem Bereich',
        no_results: 'Keine Meldungen gefunden',
        no_filtered_results: 'Keine Meldungen entsprechen Ihren Filter-Kriterien',
        load_more: 'Alle Meldungen geladen',
        load_more_button: 'Weitere laden',
        newest_first: 'Neueste zuerst',
        oldest_first: 'Älteste zuerst',
        refresh: 'Erneuern',
        status_update: 'Status aktualisiert',
        location: 'Ort',
        unpublished: 'Noch nicht öffentlich',
        editable: 'Editable'
    },
    errors: {
        general: 'Etwas ist schief gelaufen',
        search_failed: 'Suche hat nicht geklappt. Bitte noch einmal versuchen.',
        upload_failed: 'Hochladen fehlgeschlagen',
        location_error: 'Ort konnte nicht gefunden werden',
        network_error: 'Netzwerk-Fehler',
        geolocation: {
            title: 'Fehler beim Standort',
            permission_denied: 'Der Standort wurde nicht erlaubt. Bitte erlaube den Zugriff in deinem Browser.',
            unavailable: 'Der Standort kann gerade nicht gefunden werden.',
            timeout: 'Die Suche nach dem Standort hat zu lange gedauert.',
            unknown: 'Ein unbekannter Fehler ist passiert.'
        },
        try_again: 'Bitte versuchen Sie es noch mal',
        validation: {
            title: 'Leider können wir die Meldung nicht annehmen:',
            location_error_title: 'Ort-Fehler',
            invalid_input: 'Ungültige Eingabe',
            duplicate_title: 'Doppelt gefunden',
            duplicate_found: 'Ähnlicher Bericht gefunden',
            duplicate_report: 'Ein ähnlicher Bericht wurde schon erstellt (Nr. {reportId})',
            location_out_of_bounds: 'Der gewählte Ort liegt außerhalb von unserem Zuständigkeits-Bereich',
            required_field: '{field} müssen Sie ausfüllen',
            file_size: 'Die gewählte Datei ist zu groß (maximal 10 MB)',
            file_type: 'Das Format wird nicht unterstützt (erlaubt: jpg, png, webp)',
            media_upload: 'Fehler beim Hochladen vom Bild',
            required_fields: 'Bitte füllen Sie alle Pflicht-Felder aus',
            invalid_format: 'Ungültiges Format für {field}',
            consent_required: 'Bitte akzeptieren Sie die Daten-Schutz-Erklärung',
            photo_required: 'Für diese Art brauchen Sie ein Foto',
            please_review: 'Please review the form and correct any errors before submitting.',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway'
        },
        rate_limit: {
            title: 'Bild-Anzahl kurzfristig überschritten',
            general: 'Bitte versuchen Sie es später noch mal.',
            with_time: 'Zu viele Bilder auf einmal! Bitte versuchen Sie es in {seconds} Sekunden noch mal.'
        },
        network: 'Verbindungs-Problem. Bitte prüfen Sie Ihre Internet-Verbindung',
        timeout: 'Zeit-Überschreitung. Bitte versuchen Sie es noch mal',
        upload: {
            title: 'Fehler beim Hochladen',
            invalid_type: 'Ungültiger Datei-Typ. Bitte nur Bilder hochladen.',
            file_too_large: 'Datei zu groß. Maximale Größe ist {size}.',
            dimensions_too_large: 'Bild-Maße zu groß. Maximal {width}x{height} Pixel.',
            invalid_image: 'Ungültige oder beschädigte Bild-Datei.',
            failed: 'Hochladen fehlgeschlagen. Bitte noch mal versuchen.',
            limit_reached: 'Maximale Anzahl von {count} Dateien erreicht.',
            remove_to_add: 'Entfernen Sie ein Foto, um ein neues hinzuzufügen',
            single_file_limit: 'Es kann nur ein Bild hochgeladen werden.',
            exact_file_limit: 'Maximal {count} Bilder können hochgeladen werden.',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'Fehler beim Senden vom Formular',
        unknown: 'Ein unbekannter Fehler ist passiert.',
        pending_uploads: 'Bitte warten Sie, bis alle Uploads fertig sind.',
        incomplete_form: 'Bitte füllen Sie alle Pflicht-Felder aus.',
        page: {
            title: 'Fehler',
            not_found_title: 'Seite nicht gefunden',
            not_found_message: 'Die gesuchte Seite gibt es leider nicht.',
            server_error_title: 'Server-Fehler',
            server_error_message: 'Entschuldigung, auf unserem Server ist ein Fehler passiert.',
            generic_title: 'Fehler passiert',
            generic_message: 'Ein unerwarteter Fehler ist passiert.',
            action_home: 'Zur Start-Seite',
            action_back: 'Zurück',
            action_retry: 'Noch mal versuchen',
            details: 'Fehler-Details'
        },
        api: {
            rate_limit: 'Too many requests. Please wait a moment and try again.',
            unauthorized: 'Not authorized. Please sign in again.',
            forbidden: 'Access denied.',
            not_found: 'Resource not found.',
            server_error: 'Server error. Please try again later.',
            default: 'API Error: {status}'
        }
    },
    success: {
        report_submitted: 'Meldung eingereicht.',
        moderation_notice: 'Ihre Meldung wird vor der Veröffentlichung geprüft. Ihre Meldungs-Nummer:',
        submit_another: 'Weitere Meldung',
        auto_followed: 'Diese Meldung wurde automatisch zu Ihren gefolgten Meldungen hinzugefügt',
        visibility_limitation_notice: 'Bitte beachten Sie: Nicht alle Meldungen werden öffentlich auf der Website sichtbar. Wenn sich Ihre Meldung in der Liste der gefolgten Meldungen nicht aktualisiert, kann sie dennoch von der Stadt bearbeitet worden sein. Prüfen Sie Ihre E-Mail für Status-Updates.',
        report_submitted_description: 'Your report has been successfully submitted and will be reviewed shortly.',
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
        title: 'Diese Meldung melden',
        description: 'Helfen Sie uns, die Qualität zu wahren, indem Sie unangemessene Inhalte melden.',
        reason_label: 'Warum melden Sie diese Meldung?',
        reason_spam: 'Spam oder Werbung',
        reason_offensive: 'Anstößiger oder unangemessener Inhalt',
        reason_personal: 'Enthält personenbezogene Daten',
        reason_location: 'Falscher Standort',
        reason_other: 'Sonstiges',
        details_label: 'Zusätzliche Details',
        details_placeholder: 'Bitte beschreiben Sie das Problem...',
        details_required: 'Bitte geben Sie Details an',
        submit: 'Absenden',
        success: 'Vielen Dank. Wir werden diese Meldung überprüfen.',
        error: 'Konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
        already_flagged: 'Sie haben diese Meldung bereits gemeldet.'
    },

    pwa: {
        install: {
            title: 'App installieren',
            button: 'Installieren',
            not_now: 'Später',
            description: 'Klicken Sie auf das Installations-Symbol in der Adress-Leiste von Ihrem Browser.',
            share_button: 'Teilen-Symbol',
            open_safari: 'Safari-Browser',
            ios: {
                title: 'Zum Home-Bildschirm',
                safari_instructions: 'Tippen Sie auf das {icon} und wählen Sie "Zum Home-Bildschirm hinzufügen".',
                other_instructions: 'Bitte öffnen Sie diese Seite im {browser}, um sie zu installieren.'
            },
            chrome: {
                instructions: 'Klicken Sie auf das Installations-Symbol {icon} in der Symbol-Leiste, um diese App zu installieren.'
            },
            edge: {
                instructions: 'Klicken Sie auf das Installations-Symbol {icon} in der Adress-Leiste.'
            },
            firefox: {
                instructions: 'Klicken Sie auf das Home-Symbol {icon} in der Adress-Leiste.'
            }
        }
    },
    boundaries: {
        loading: 'Gebiets-Grenzen werden geladen...',
        error: 'Gebiets-Grenzen können nicht geprüft werden. Bitte versuchen Sie es später noch mal.',
        notLoaded: 'Gebiets-Grenzen noch nicht geladen',
        outsideNonStrict: 'Hinweis: Der Ort liegt außerhalb vom Zuständigkeits-Gebiet {locationName}.',
        outsideStrict: 'Der Ort liegt außerhalb von {locationName}. Bitte wählen Sie einen Ort innerhalb der Stadt-Grenzen.',
        validationUnavailable: 'Grenz-Prüfung nicht verfügbar. Ihre Meldung wird angenommen und ggf. später geprüft.'
    },
    filters: {
        status: {
            title: 'Status'
        },
        time: {
            title: 'Zeit',
            today: 'Heute',
            week: 'Diese Woche',
            month: 'Dieser Monat'
        },
        category: {
            title: 'Art',
            other: 'Andere'
        },
        actions: {
            expand: 'Mehr Filter',
            collapse: 'Weniger',
            clear_all: 'Alle löschen',
            active_count: '{count} Filter aktiv',
            toggle: 'Filter',
            more: 'More Filters'
        },
        title: 'Filters'
    },
    privacy: {
        notice_text: 'Infos zum Daten-Schutz finden Sie',
        notice_link_text: 'hier',
        modal: {
            title: 'Daten-Schutz-Erklärung',
            loading: 'Daten-Schutz-Infos werden geladen...',
            retry: 'Wiederholen',
            noContent: 'Keine Daten-Schutz-Infos da.',
            lastUpdated: 'Zuletzt aktualisiert',
            close: 'Schließen'
        }
    },
    search: {
        placeholder: 'Meldungen durchsuchen...',
        no_results_local: 'Keine Ergebnisse in der aktuellen Ansicht',
        expand_to_server: 'Gesamte Datenbank durchsuchen',
        expand_hint: 'Über aktuelle Ansicht hinaus suchen',
        searching_server: 'Gesamte Datenbank wird durchsucht...'
    },
    info: {
        welcome: {
            heading: 'Willkommen bei {name}',
            headingGeneric: 'Willkommen',
            body: 'Nutzen Sie diese Karte, um Probleme zu melden oder bestehende Meldungen in Ihrer Umgebung zu finden.'
        },
        shortcuts: {
            aria_label: 'Schnelle Aktionen',
            photo: {
                title: 'Foto',
                description: 'Machen Sie ein Bild. Die KI macht den Rest.',
                aria_label: 'Eine neue Meldung mit Foto machen'
            },
            classic: {
                title: 'Klassisch',
                description: 'Beschreiben Sie das Problem und den Ort.',
                aria_label: 'Eine neue Meldung ohne Foto machen'
            },
            following: {
                title: 'Verfolgen',
                description: 'Sehen Sie, wie es weiter geht.',
                aria_label: 'Zu Ihren verfolgten Meldungen gehen'
            },
            list: {
                title: 'Erkunden',
                description: 'Sehen Sie, was in Ihrer Nähe ist.',
                aria_label: 'Karte erkunden und Liste anzeigen'
            }
        }
    },
    profile: {
        title: 'Mein Profil',
        account: {
            title: 'Mein Konto',
            roles: 'Meine Rollen'
        },
        groups: {
            title: 'Meine Gruppen'
        },
        appearance: {
            title: 'Aussehen',
            color_mode: 'Farb-Modus',
            light: 'Hell',
            dark: 'Dunkel',
            system: 'Automatisch',
            primary_color: 'Haupt-Farbe',
            theme_override: 'Custom Theme Colors',
            theme_override_description: 'Override the default jurisdiction theme with your own color preferences',
            secondary_color: 'Secondary Color',
            neutral_color: 'Neutral Color',
            reset_theme: 'Reset to Default'
        },
        language: {
            title: 'Sprache',
            select: 'Sprache wählen',
            save_failed: 'Spracheinstellung konnte nicht gespeichert werden. Bitte erneut versuchen.'
        }
    },
    auth: {
        login: {
            title: 'Anmelden',
            subtitle: 'Geben Sie Ihre E-Mail-Adresse ein. Dann bekommen Sie einen Code.',
            email_label: 'E-Mail-Adresse',
            email_hint: 'Wir senden Ihnen einen Code mit 6 Zahlen.',
            email_placeholder: 'E-Mail-Adresse',
            send_code: 'Code senden',
            disabled: {
                title: 'Anmeldung nicht verfügbar',
                message: 'Die passwortlose Anmeldung ist hier nicht aktiviert. Bitte wenden Sie sich an die Administration, wenn Sie Zugang benötigen.',
                back_button: 'Zurück zur Startseite'
            }
        },
        verify: {
            email_label: 'E-Mail-Adresse',
            code_label: 'Code',
            code_hint: 'Geben Sie den Code mit 6 Zahlen aus Ihrer E-Mail ein.',
            code_placeholder: '123456',
            verify_button: 'Prüfen und anmelden',
            back_button: 'Andere E-Mail-Adresse verwenden',
            request_new: 'Neuen Code anfordern',
            resend_code: 'Code noch einmal senden',
            expires_in: 'Code ist gültig bis {time}',
            expired_title: 'Code ist abgelaufen',
            expired_message: 'Ihr Code ist abgelaufen. Bitte fordern Sie einen neuen Code an.'
        },
        code_sent: {
            title: 'Code wurde gesendet',
            message: 'Wir haben einen Code mit 6 Zahlen an {email} gesendet.'
        },
        error: {
            title: 'Fehler bei der Anmeldung',
            request_failed: 'Der Code konnte nicht gesendet werden. Bitte versuchen Sie es noch einmal.',
            verify_failed: 'Der Code ist falsch oder abgelaufen.',
            sso_failed: 'Die Anmeldung hat nicht geklappt. Bitte versuchen Sie es noch einmal.',
            network: 'Netzwerk-Fehler. Bitte prüfen Sie Ihre Verbindung.',
            logout_failed: 'Das Abmelden hat nicht geklappt. Bitte versuchen Sie es noch einmal.'
        },
        sso: {
            completing: 'Wir melden Sie an...',
            method_label: 'Anmelden mit einem Konto',
            button_aria: 'Mit {provider} anmelden'
        },
        user: {
            logged_in_as: 'Angemeldet als',
            logout: 'Abmelden'
        },
        welcome: {
            greeting: 'Hallo, {name}',
            sign_in: 'Anmelden',
            sign_out: 'Abmelden',
            user_avatar: 'User avatar'
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
            title: 'Seite nicht gefunden',
            description: 'Diese Seite gibt es nicht oder sie wurde verschoben.'
        },
        403: {
            title: 'Kein Zugang',
            description: 'Du darfst diese Seite nicht sehen.'
        },
        500: {
            title: 'Etwas ist schiefgegangen',
            description: 'Es gab einen Fehler. Bitte versuche es noch einmal.'
        },
        fallback: {
            title: 'Fehler',
            description: 'Es gab einen unerwarteten Fehler.'
        },
        actions: {
            back: 'Zurück',
            home: 'Zur Startseite',
            retry: 'Noch einmal versuchen'
        }
    },
    legal: {
        impressum: {
            title: 'Impressum',
            heading: 'Impressum',
            responsible_heading: 'Wer ist verantwortlich?',
            responsible_text: '{name} ist verantwortlich für diese Seite.'
        },
        privacy: {
            title: 'Daten-Schutz',
            heading: 'Daten-Schutz',
            intro: 'Ihre Daten sind uns wichtig. Wir halten uns an die Gesetze zum Daten-Schutz.',
            controller_heading: 'Wer ist verantwortlich für die Daten?',
            data_heading: 'Welche Daten speichern wir?',
            data_text: 'Wir speichern den Ort der Meldung, den Text, die Fotos und technische Daten. Zum Beispiel: Ihre IP-Adresse, Ihren Browser und die Uhrzeit.',
            rights_heading: 'Ihre Rechte',
            rights_text: 'Sie dürfen Ihre Daten ansehen. Sie dürfen Ihre Daten ändern. Sie dürfen Ihre Daten löschen lassen.'
        },
        terms: {
            title: 'Nutzungs-Regeln',
            heading: 'Nutzungs-Regeln',
            intro: 'Wenn Sie diese Seite benutzen, gelten diese Regeln.',
            purpose_heading: 'Wofür ist die Seite?',
            purpose_text: 'Auf dieser Seite können Sie Probleme melden. Die Meldungen gehen an die zuständige Stelle.',
            obligations_heading: 'Was müssen Sie beachten?',
            obligations_text: 'Schreiben Sie nur die Wahrheit. Laden Sie keine verbotenen Inhalte hoch. Fotos dürfen keine erkennbaren Personen zeigen.',
            liability_heading: 'Haftung',
            liability_text: '{name} haftet nicht für die Richtigkeit der Angaben.'
        },
        email_label: 'E-Mail',
        contact_label: 'Kontakt',
        platform: {
            heading: 'Plattform-Betreiber',
            intro: 'Diese Plattform wird betrieben von:',
            description: 'Die Civic Patches GmbH stellt die Technik für die Mark-a-Spot Plattform bereit.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Deutschland',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Betreiber dieser Karte',
            not_configured: 'Der Betreiber dieser Karte hat noch keine Angaben gemacht. Betreiber von Internet-Seiten müssen ein Impressum und eine Daten-Schutz-Erklärung bereit stellen.'
        },
        footer: {
            impressum: 'Impressum',
            privacy: 'Daten-Schutz',
            terms: 'Nutzungs-Regeln'
        },
        not_configured: 'Die Daten des Betreibers sind noch nicht eingerichtet.'
    },
    demo_mode: {
        banner: {
            title: 'Nur Demo',
            message: 'Das hier ist eine Demo. Meldungen gehen nicht an die Stadt.',
            link_label: 'mark-a-spot.com besuchen',
            minimize_label: 'Demo-Hinweis kleiner machen',
            expand_label: 'Demo-Hinweis wieder anzeigen'
        },
        reset: {
            title: 'Demo-System',
            notice: 'Das Demo-System wird jede Stunde zurückgesetzt.',
            countdown_label: 'Nächster Reset in',
            countdown_aria: 'Nächster Reset des Demo-Systems in {time}'
        },
        modal: {
            title: 'Demo-Einreichung',
            body: 'Das hier ist nur eine Probe. Die Meldung geht NICHT an die Stadt. Wollen Sie trotzdem schicken?',
            confirm_label: 'Demo absenden',
            cancel_label: 'Abbrechen'
        },
        lite: {
            title: 'Nur Demo',
            heading: 'Nur Demo',
            body: 'Das ist eine Demo von Mark-a-Spot. Das Formular ist hier gesperrt. Echte Meldungen gehen nicht an die Stadt.',
            link_label: 'mark-a-spot.com besuchen'
        }
    },
    print: {
        title: 'Meldungs-Bericht',
        description: 'Was passiert ist',
        location: 'Wo es ist',
        media: 'Bilder',
        image_unavailable: 'Image unavailable',
        attributes: 'Mehr Felder',
        status_history: 'Status-Verlauf',
        internal_fields: 'Interne Infos',
        organisation: 'Zuständige Stelle',
        hazard_level: 'Gefahrenstufe',
        hazard_category: 'Gefahrenkategorie',
        sentiment: 'Stimmung',
        printed_at: 'Gedruckt',
        showing_recent: '{count} von {total} Aktualisierungen angezeigt'
    }
};
