// locales/de.ts
export default {
    locale: {
        code: 'de-DE'
    },
    meta: {
        description: 'Mark-a-Spot' // Translated "Frontend"
    },
    // CAP (Common Alerting Protocol) Gefahrenstufen und -kategorien
    // https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html
    hazard: {
        levels: {
            unknown: 'Unbekannt',
            minor: 'Gering',
            moderate: 'Mäßig',
            severe: 'Schwer',
            extreme: 'Extrem'
        },
        categories: {
            Infra: 'Infrastruktur',
            Transport: 'Verkehr',
            Safety: 'Öffentliche Sicherheit',
            Env: 'Umwelt',
            Fire: 'Feuer/Brand',
            Health: 'Gesundheit',
            Geo: 'Geophysikalisch',
            Met: 'Meteorologisch',
            Other: 'Sonstiges'
        }
    },
    // KI-erkannte Stimmung aus Dienstanfrage-Beschreibungen
    sentiment: {
        frustrated: 'Frustriert',
        neutral: 'Neutral',
        positive: 'Positiv'
    },
    nav: {
        map: 'Karte',
        dashboard: 'Dashboard',
        back_to_frontend: 'Zurück zur Karte'
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Willkommen, {name}',
        nav: {
            dashboard: 'Dashboard',
            requests: 'Meldungen',
            metrics: 'Statistiken',
            settings: 'Einstellungen',
            categories: 'Kategorien',
            status: 'Status',
            jurisdictions: 'Zuständigkeiten',
            languages: 'Sprachen',
            billing: 'Abrechnung'
        },
        help: {
            docs: 'Dokumentation',
            support: 'Support kontaktieren'
        },
        settings: {
            languages_title: 'Spracheinstellungen',
            languages_description: 'Legen Sie fest, welche Sprachen verfügbar sind und welche Sprache Besuchern dieses Workspace standardmäßig angezeigt wird.',
            languages_available: 'Verfügbare Sprachen',
            languages_default: 'Standardsprache',
            languages_saved: 'Spracheinstellungen gespeichert.',
            languages_min_one: 'Mindestens eine Sprache muss ausgewählt sein.'
        },
        user: {
            profile: 'Profil',
            logout: 'Abmelden'
        },
        jurisdiction: {
            current: 'Arbeitsbereich',
            citizenView: 'Bürgeransicht',
            switchTo: 'Wechseln zu',
            blocked: 'gesperrt',
            admin_section_header: 'Alle Workspaces (Admin-Zugriff)'
        },
        stats: {
            total: 'Alle Meldungen',
            pending: 'Ausstehend',
            in_progress: 'In Bearbeitung',
            resolved: 'Erledigt',
            my_groups: 'Meine Gruppen',
            overall: 'Gesamt'
        },
        recent_requests: 'Letzte Meldungen',
        view_all: 'Alle anzeigen',
        no_recent: 'Keine aktuellen Meldungen',
        wms: {
            title: 'Kartenebenen',
            attribution: 'Daten: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Medien',
                category: 'Kategorie',
                status: 'Status',
                created: 'Erstellt'
            }
        }
    },
    form: {
        // Form field labels
        body: 'Beschreibung',
        body_description: 'Bitte geben Sie eine detaillierte Beschreibung an',
        body_placeholder: 'Beschreibung eingeben...',
        body_ai_description: 'Wird automatisch aus dem Foto generiert. Sie können den Text anpassen.',
        body_ai_placeholder: 'Text wird aus dem Foto generiert...',

        category: 'Kategorie',
        category_description: 'Wählen Sie die passende Kategorie für Ihre Meldung',
        category_placeholder: 'Kategorie auswählen',
        category_disabled: {
            title: 'Kategorie ausgewählt',
            description: 'Sie haben die Kategorie "{category}" ausgewählt. Diese Kategorie hat spezielle Anforderungen oder erlaubt keine weitere Bearbeitung des Formulars.'
        },
        category_empty: 'Keine Kategorien verfügbar',
        category_loading: 'Kategorien werden geladen...',
        category_disabled_notice: 'Diese Kategorie dient nur zur Information. Meldungen sind nicht möglich.',
        category_description_loading: 'Beschreibung wird geladen...',
        category_description_error: 'Fehler beim Laden der Beschreibung',

        email: 'E-Mail',
        email_description: 'Ihre Kontakt-E-Mail',
        email_placeholder: 'Ihre E-Mail-Adresse eingeben',

        first_name: 'Vorname',
        first_name_description: 'Ihr Vorname',
        first_name_placeholder: 'Bitte Vornamen eingeben',

        last_name: 'Nachname',
        last_name_description: 'Ihr Nachname',
        last_name_placeholder: 'Bitte Nachnamen eingeben',

        gdpr: 'Datenschutzerklärung',
        gdpr_description: 'Ich stimme der Verarbeitung meiner Daten gemäß der Datenschutzerklärung zu.',

        object_id: 'Objektnummer',
        object_id_description: 'Kennung für das gemeldete Objekt',
        object_id_placeholder: 'Objektnummer eingeben (z.B. Mastnummer)',

        phone: 'Telefonnummer',
        phone_description: 'Ihre Kontakt-Telefonnummer',
        phone_placeholder: 'Ihre Telefonnummer eingeben',

        // Einrichtungsbasierte Meldungen (Bediener kann die Bezeichnung in der Jurisdiktionskonfiguration überschreiben)
        facility: 'Einrichtung',
        facility_plural: 'Einrichtungen',
        facility_placeholder: '{label} auswählen',
        facility_required: '{label} ist erforderlich.',
        facility_unavailable: 'Die gewählte Einrichtung ist nicht mehr verfügbar, bitte erneut auswählen.',
        facility_nearest_snapped: 'Nächste Einrichtung: {label}',
        facility_no_nearby: 'Keine Einrichtung in der Nähe, bitte manuell auswählen.',
        facility_use_my_location: 'Meinen Standort verwenden',
        facility_locating: 'Standort wird ermittelt…',
        facility_no_match: 'Keine Einrichtung entspricht Ihrer Suche.',
        facility_opens_in_new_tab: '(öffnet in neuem Tab)',
        facility_deselected_map_pick: 'Eigener Standort statt {label}',
        // Optionaler Facility-Modus: Bürgerformular taggt automatisch die
        // nächstgelegene Einrichtung, wenn die Position im Snap-Radius liegt.
        facility_tagged_with: 'Bei: {label}',

        // Imagelist
        imagelist: {
            empty: 'Keine Bilder für diesen Typ verfügbar.'
        },

        // Form-first mode
        back_to_report: 'Zurück zum Meldeformular',

        // Form requirements indicator
        requirements: {
            title: 'Noch erforderlich',
            ready_to_submit: 'Bereit zum Absenden',
            photo: 'Foto hochladen',
            category: 'Kategorie auswählen',
            location: 'Standort angeben',
            description: 'Beschreibung eingeben',
            email: 'E-Mail-Adresse angeben',
            privacy: 'Datenschutz akzeptieren',
            privacyBlock: 'Datenschutzkritisches Foto ersetzen oder entfernen',
            conditional: 'je nach Kategorie'
        }
    },
    validation: {
        // Validation error messages
        body_required: 'Beschreibung ist erforderlich',
        category_required: 'Kategorie ist erforderlich',
        email_required: 'E-Mail ist erforderlich',
        email_format: 'Ungültiges E-Mail-Format',
        first_name_required: 'Vorname ist erforderlich',
        last_name_required: 'Nachname ist erforderlich',
        gdpr_required: 'Sie müssen den Datenschutzbestimmungen zustimmen',
        object_id_required: 'Objektnummer ist erforderlich',
        phone_required: 'Telefonnummer ist erforderlich',
        required_field: '{field} ist erforderlich'
    },
    feedback: {
        page_title: 'Feedback zur Meldung',
        error_title: 'Fehler beim Laden',
        invalid_request: 'Ungültige oder abgelaufene Meldung',
        thank_you: 'Vielen Dank für Ihr Feedback!',
        submission_received: 'Ihr Feedback wurde erfolgreich empfangen',
        loading: 'Meldung wird geladen...',
        title: 'Feedback für: {service}',
        description: 'Bitte geben Sie Ihr Feedback ein',
        placeholder: 'Geben Sie hier Ihr Feedback ein...',
        reopen_request: 'Ich möchte, dass diese Meldung erneut bearbeitet wird',
        submitting: 'Wird übermittelt...',
        sending: 'Wird gesendet...',
        submit: 'Feedback senden',
        existing_title: 'Ihr Feedback für: {service}',
        already_submitted: 'Sie haben bereits Feedback für diese Meldung abgegeben',
        missing_uuid: 'Fehlende Meldungs-ID',
        success_notification: 'Feedback erfolgreich übermittelt',
        success_with_id: 'Feedback für Meldung Nr. {id} erfolgreich übermittelt',
        updated_successfully: 'Feedback erfolgreich aktualisiert',
        added_to_list: 'Die Meldung wurde zu Ihrer Liste hinzugefügt',
        submission_error: 'Feedback konnte nicht übermittelt werden',
        server_error: 'Serverfehler: Das Feedback konnte derzeit nicht verarbeitet werden',
        submission_failed: 'Feedback konnte nicht übermittelt werden. Bitte versuchen Sie es später erneut',
        already_exists: 'Für diese Meldung existiert bereits ein Feedback',
        error_fetching_request: 'Fehler beim Laden der Meldungs-Details',
        no_content: 'Kein Feedback-Inhalt',
        refresh_complete: 'Meldungsliste aktualisiert',
        try_again: 'Erneut versuchen',
        format_unrecognized: 'Format der Meldung nicht erkannt',
        processing_error: 'Fehler bei der Verarbeitung der Meldung',
        your_feedback: 'Ihr Feedback',
        contact_preference: 'Kontaktpräferenz',
        no_contact: 'Kein Kontakt',
        email_contact: 'Kontakt per E-Mail',
        email_placeholder: 'Ihre E-Mail-Adresse',
        set_status_open: 'Status auf offen setzen',
        set_status_open_description: 'Falls Sie möchten, dass wir uns nochmals darum kümmern, können Sie diese Meldung wieder öffnen.',
        email_verification: 'E-Mail-Verifizierung',
        email_verification_placeholder: 'E-Mail-Adresse aus der ursprünglichen Meldung',
        email_verification_description: 'Geben Sie die E-Mail-Adresse ein, die Sie bei der ursprünglichen Meldung verwendet haben.',
        email_mismatch: 'Die eingegebene E-Mail-Adresse stimmt nicht mit der ursprünglichen Meldung überein.',
        unauthorized_access: 'Unbefugter Zugriff. Bitte überprüfen Sie Ihre E-Mail-Adresse.',
        not_eligible: 'Für diese Meldung kann derzeit kein Feedback abgegeben werden',
        dialog_description: 'Feedback-Formular-Dialog',
        service_provider: {
            page_title: 'Dienstleister-Antwort',
            page_description: 'Abschlussnotizen für zugewiesene Meldungen einreichen',
            modal_title: 'Dienstleister-Antwort',
            dialog_description: 'Dialogfenster für Dienstleister-Antwort',
            title: 'Auftrag abschließen',
            your_email: 'Ihre E-Mail-Adresse',
            email_placeholder: 'dienstleister{\'@\'}beispiel.de',
            email_verification_note: 'Geben Sie Ihre Dienstleister-E-Mail zur Verifizierung ein',
            completion_notes: 'Abschlussnotizen',
            notes_placeholder: 'Beschreiben Sie die durchgeführten Arbeiten...',
            mark_as_completed: 'Als erledigt markieren',
            mark_as_completed_description: 'Status der Meldung auf erledigt setzen',
            mark_completed_description: 'Bestätigen, dass die Arbeit abgeschlossen ist',
            submit_completion: 'Abschluss einreichen',
            complete_request: 'Auftrag abschließen',
            completing: 'Wird eingereicht...',
            completion_success: 'Abschluss der Meldung erfolgreich eingereicht',
            submission_failed: 'Abschluss konnte nicht eingereicht werden. Bitte versuchen Sie es später erneut',
            server_error: 'Serverfehler: Der Abschluss konnte derzeit nicht verarbeitet werden',
            completion_not_allowed: 'Diese Meldung kann derzeit nicht abgeschlossen werden',
            email_verification_failed: 'E-Mail-Verifizierung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse',
            already_completed: 'Diese Meldung wurde bereits abgeschlossen',
            loading: 'Meldung wird geladen...',
            try_again: 'Erneut versuchen',
            invalid_uuid: 'Ungültige oder abgelaufene Meldung',
            load_error: 'Fehler beim Laden der Meldungsdetails',
            error_fetching_request: 'Fehler beim Laden der Meldungsdetails',
            completion_notes_required: 'Bitte geben Sie Abschlussnotizen an',
            existing_completions: 'Frühere Abschlüsse',
            reassignment_note: 'Diese Meldung wurde zur Neuzuweisung markiert und kann mehrere Abschlüsse erhalten'
        }
    },
    contact: {
        title: 'Kontakt',
        dialog_description: 'Kontaktformular',
        name: 'Name',
        name_placeholder: 'Ihr Name',
        email: 'E-Mail',
        email_placeholder: 'Ihre E-Mail-Adresse',
        message: 'Nachricht',
        message_placeholder: 'Ihre Nachricht...',
        copy_label: 'Kopie an meine E-Mail-Adresse senden',
        gdpr_label: 'Ich stimme der Verarbeitung meiner Daten zu',
        gdpr_required: 'Bitte stimmen Sie der Datenverarbeitung zu',
        submit: 'Nachricht senden',
        sending: 'Wird gesendet...',
        success_title: 'Nachricht gesendet',
        success_message: 'Vielen Dank für Ihre Nachricht. Wir melden uns so bald wie möglich bei Ihnen.',
        submission_failed: 'Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
        flood_error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
        required_field: '{field} ist erforderlich',
        invalid_email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        close: 'Schließen',
        new_message: 'Neue Nachricht'
    },
    service_provider: {
        // Seiten- und Modal-Titel
        page_title: 'Dienstleister-Rückmeldung',
        page_description: 'Abschlussnotizen für zugewiesene Serviceanfragen einreichen',
        modal_title: 'Dienstleister-Rückmeldung',
        dialog_description: 'Dienstleister-Rückmeldungsformular-Dialog',

        // Formularfelder
        title: 'Auftrag abschließen',
        your_email: 'Ihre E-Mail-Adresse',
        email_placeholder: 'dienstleister{\'@\'}beispiel.de',
        email_verification_note: 'Geben Sie Ihre Dienstleister-E-Mail-Adresse zur Verifizierung ein',
        completion_notes: 'Abschlussnotizen',
        notes_placeholder: 'Beschreiben Sie die durchgeführten Arbeiten...',
        mark_as_completed: 'Als erledigt markieren',
        mark_as_completed_description: 'Den Anfragestatus auf abgeschlossen setzen',

        // Schaltflächen
        submit_completion: 'Rückmeldung absenden',
        complete_request: 'Auftrag abschließen',
        completing: 'Wird übermittelt...',

        // Erfolgs- und Fehlermeldungen
        completion_success: 'Abschluss der Serviceanfrage erfolgreich eingereicht',
        submission_failed: 'Abschluss konnte nicht eingereicht werden. Bitte versuchen Sie es später erneut',
        server_error: 'Serverfehler: Der Abschluss konnte derzeit nicht verarbeitet werden',
        completion_not_allowed: 'Diese Anfrage kann derzeit nicht abgeschlossen werden',
        email_verification_failed: 'Die E-Mail stimmt nicht mit dem beauftragten Dienstleister überein',
        already_completed: 'Diese Anfrage wurde bereits abgeschlossen',

        // Laden und Validierung
        loading: 'Serviceanfrage wird geladen...',
        try_again: 'Erneut versuchen',
        invalid_uuid: 'Ungültige oder abgelaufene Serviceanfrage',
        load_error: 'Fehler beim Laden der Serviceanfrage-Details',
        error_fetching_request: 'Fehler beim Laden der Serviceanfrage-Details',
        completion_notes_required: 'Bitte geben Sie Abschlussnotizen an',

        // Mehrfachabschlüsse
        existing_completions: 'Frühere Abschluss-Rückmeldungen',
        reassignment_note: 'Diese Anfrage wurde für die Neuzuweisung markiert und kann mehrere Abschlüsse erhalten'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mängelmelder',
        app_claim: 'Ihre Meldung. Unsere Lösung.'
    },
    service_unavailable: {
        title: 'Service vorübergehend nicht verfügbar',
        message: 'Wir können derzeit keine Verbindung zu unseren Diensten herstellen. Das Problem ist wahrscheinlich vorübergehend.',
        retry: 'Wir haben derzeit technische Schwierigkeiten. Bitte versuchen Sie es in {seconds} Sekunden erneut.',
        auto_retry: 'Erneuter Versuch in {seconds} Sekunden...',
        retry_now: 'Jetzt versuchen',
        try_later: 'Bitte versuchen Sie es später noch einmal.',
        reload: 'Neu laden'
    },
    hiddenSection: {
        description:
      'Der Mängelmelder ist ein Meldesystem für Infrastrukturprobleme. Sie können direkt mit der Meldung von Problemen fortfahren oder zu Folgendem navigieren:',
        main_navigation:
      'Hauptnavigation mit Informationen, einer Liste von Meldungen und Statistiken',
        map: 'Interaktive Karte mit visuellen Markierungen',
        map_navigation_hint:
      'Verwenden Sie ⬆️⬇️⬅️➡️ Pfeiltasten zur Navigation zwischen Meldungsmarkern, ↩️ Enter zum Auswählen, ❌ Escape zum Löschen der Auswahl',
        action_button: 'Direkt melden',
        keyboard_navigation_hint:
      'Verwenden Sie ↑↓ Pfeiltasten zur Navigation, Enter zum Aktivieren',
        skip_to_main_content:
      'Zum Hauptinhalt springen'
    },
    accessibility: {
        skip_to_main: 'Zum Hauptinhalt springen',
        skip_to_map: 'Zur Karte springen',
        skip_to_navigation: 'Zur Navigation springen',
        skip_to_form: 'Direkt melden',
        leichte_sprache_indicator: 'Leichte Sprache - Einfache Texte für alle'
    },
    common: {
        back: 'Zurück',
        not_classified: 'Nicht klassifiziert',
        no_value: 'Kein Wert',
        close: 'Schließen',
        loading: 'Laden...',
        error: 'Fehler',
        success: 'Erfolgreich',
        submit: 'Absenden',
        cancel: 'Abbrechen',
        required: 'Erforderlich',
        save: 'Speichern',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        clear: 'Löschen',
        search: 'Suchen',
        select: 'Auswählen',
        on: 'An',
        off: 'Aus',
        toggle: 'Umschalten',
        yesterday: 'Gestern',
        current: 'Aktuell',
        did_you_know: 'Wussten Sie?',
        show_more: 'Mehr anzeigen',
        show_less: 'Weniger anzeigen',
        learn_more: 'Mehr erfahren',
        learn_more_about: 'Mehr über {topic} erfahren',
        opens_in_new_tab: '(öffnet in neuem Tab)',
        title: {
            classic: 'Klassische Meldung',
            photo: 'Foto-Meldung'
        },
        buttons: {
            toggle_theme: 'Design umschalten',
            attribution: 'Karten-Attribution',
            close: 'Schließen'
        },
        navigation: 'Navigationsbereich',
        drawer_description: 'Inhalts- und Optionsfenster',
        resize_drawer: 'Panel anpassen',
        drawer_position_n_of_total: 'Position {idx} von {total}',
        share: 'Teilen',
        copy_coordinates: 'Koordinaten kopieren',
        open_in_maps: 'In Karten öffnen'
    },
    fields: {
        field_geolocation: 'Standort',
        field_gdpr: 'Datenschutz',
        field_e_mail: 'E-Mail',
        field_category: 'Kategorie',
        field_request_media: 'Fotos',
        field_name: 'Nachname',
        field_prename: 'Vorname',
        field_first_name: 'Vorname',
        field_first_name_placeholder: 'Bitte Vornamen eingeben',
        field_last_name: 'Nachname',
        field_last_name_placeholder: 'Bitte Nachnamen eingeben',
        field_phone: 'Telefon',
        body: 'Beschreibung',
        field_add_data: 'Teilnahme am Gewinnspiel',
        field_terms_of_use: 'Ich akzeptiere die Teilnahmebedingungen und Datenschutzhinweise.',
        field_address: 'Adresse',
        postal_code: 'Postleitzahl',
        postal_code_placeholder: 'z.B. 80331',
        city: 'Stadt',
        city_placeholder: 'z.B. München',
        street_address: 'Straße und Hausnummer',
        street_address_placeholder: 'z.B. Hauptstraße 123'
    },
    competition: {
        intro: 'Wenn Sie es wünschen, nehmen Sie an unserer jährlichen Verlosung teil. Sie haben die Chance auf attraktive Sach- und Geldpreise, die wir unter allen Teilnehmer*innen als kleines Dankeschön verlosen.',
        disclaimer: 'Mitarbeiter*innen der zuständigen Abteilungen sind von der Teilnahme ausgeschlossen.',
        title: 'Teilnahme am Gewinnspiel',
        errors: {
            already_exists: 'Wettbewerb-Eintrag bereits vorhanden',
            duplicate_found: 'Duplikat gefunden',
            duplicate_detail: 'Für diese Meldung wurde bereits ein Wettbewerb-Eintrag erstellt.',
            not_found: 'Meldung nicht gefunden',
            not_found_detail: 'Die zugehörige Meldung konnte nicht gefunden werden.',
            save_failed: 'Wettbewerb-Eintrag konnte nicht gespeichert werden',
            submission_error: 'Fehler bei der Übermittlung',
            submission_error_detail: 'Ihr Wettbewerb-Eintrag konnte nicht gespeichert werden, aber Ihre Meldung wurde erfolgreich übermittelt.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Informationen Tab',
                panel_label: 'Informationsbereich'
            },
            list: {
                label: 'Liste',
                aria_label: 'Meldungsliste Tab',
                panel_label: 'Meldungslistenbereich'
            },
            following: {
                label: 'Folgend',
                aria_label: 'Gefolgte Meldungen Tab',
                panel_label: 'Gefolgte Meldungen Bereich'
            },
            stats: {
                label: 'Statistik',
                aria_label: 'Statistik Tab',
                panel_label: 'Statistikbereich'
            }
        },
        main: 'Hauptnavigation',
        pages: 'Seitennavigation',
        browse_reports: 'Meldungen durchsuchen',
        back_to_form: 'Zum Formular',
        panel: {
            scrollable: 'Scrollbarer Bereich'
        },
        updates_count: '{count} neue Aktualisierungen'
    },
    report: {
        form_types: 'Meldungstypen',
        how_to_help: 'So erstellen Sie eine Meldung',
        title: {
            photo: 'Foto-Meldung',
            classic: 'Klassische Meldung',
            submit: 'Meldung absenden',
            edit: 'Meldung bearbeiten',
            view: 'Meldung ansehen'
        },
        photo: {
            description: 'Erstellen Sie eine neue Meldung mit einem Foto'
        },
        classic: {
            description: 'Erstellen Sie eine neue Meldung ohne Foto'
        },
        status: {
            new: 'Neu',
            open: 'Offen',
            in_progress: 'In Bearbeitung',
            resolved: 'Gelöst',
            closed: 'Geschlossen',
            unknown: 'Unbekannter Status'
        },
        form: {
            modal_description: 'Neue Meldung erstellen',
            tabs: {
                photo: 'Mit Foto',
                classic: 'Klassisch'
            },
            description: {
                label: 'Beschreibung',
                placeholder: 'Bitte beschreiben Sie das Problem...',
                ai_processing: 'KI generiert eine Beschreibung...',
                help: 'Geben Sie möglichst viele Details an'
            },
            category: {
                label: 'Kategorie',
                placeholder: 'Bitte wählen',
                loading: 'Kategorien werden geladen...',
                error: 'Fehler beim Laden der Kategorien',
                empty: 'Keine Kategorien verfügbar',
                help: 'Kategorieauswahl (erfolgt automatisch)',
                description: 'Kategorie-Beschreibung',
                description_loading: 'Beschreibung wird geladen...',
                description_error: 'Fehler beim Laden der Beschreibung',
                disabled_notice: 'Diese Kategorie dient nur zur Information. Meldungen sind nicht möglich.'
            },
            location: {
                label: 'Standort',
                placeholder: 'Standort suchen...',
                selected: 'Standort ausgewählt',
                warning: 'Standort-Warnung',
                clear: 'Standort löschen',
                error: 'Fehler beim Ermitteln des Standorts',
                help: 'Geben Sie eine Adresse ein oder klicken Sie auf die Karte',
                help_modal: 'Geben Sie eine Adresse ein oder nutzen Sie Ihren aktuellen Standort',
                current: 'Aktuellen Standort verwenden',
                searching: 'Suche...',
                pick_on_map: 'Standort ungenau? Jetzt auf Karte wählen',
                auto_detected: 'Standort erkannt',
                complete_address: 'Vollständige Adresse',
                from_photo_exif: 'Standort automatisch aus Foto-Metadaten extrahiert',
                unknown_location: 'Unbekannter Standort',
                suggestions: 'Ortsvorschläge'
            },
            email: {
                label: 'E-Mail für Updates',
                placeholder: 'E-Mail-Adresse eingeben',
                help: 'Wir senden Ihnen Updates zu Ihrer Meldung',
                subscribe: 'Updates abonnieren'
            },
            gdpr: {
                label: 'Datenschutz-Einwilligung',
                description:
          'Ich stimme der Verarbeitung meiner Daten gemäß der Datenschutzerklärung zu.',
                required: 'Sie müssen zustimmen, um fortzufahren',
                link: 'Datenschutzerklärung anzeigen'
            },
            media: {
                label: 'Fotos',
                required: 'Für diese Kategorie ist ein Foto erforderlich',
                upload: {
                    overall_progress: 'Gesamtfortschritt',
                    button: 'Zum Hochladen klicken',
                    or: ' oder',
                    drag: 'per Drag & Drop',
                    drop_here: 'Dateien hier ablegen zum Hochladen',
                    restrictions:
            'Bis zu {count} Bilder ({size} max., {types}) hochladen',
                    restrictions_single: 'Ein Bild ({size} max., {types})',
                    description: 'Laden Sie Bilder hoch, indem Sie klicken, tippen oder Dateien hierher ziehen. Unterstützte Formate: JPEG, PNG, GIF.',
                    progress: 'Upload-Fortschritt',
                    started_sr: 'Upload gestartet',
                    progress_sr: 'Upload {progress}% abgeschlossen',
                    success_sr: 'Upload erfolgreich abgeschlossen',
                    error_sr: 'Upload fehlgeschlagen: {error}',
                    files_selected_sr: '{count} Datei(en) für Upload ausgewählt',
                    area_label: 'Foto-Upload-Bereich - Klicken Sie zum Auswählen von Dateien oder ziehen Sie sie per Drag & Drop',
                    in_progress: 'Upload läuft',
                    complete_sr: 'Datei wurde erfolgreich hochgeladen.'
                },
                preview: 'Bildvorschau',
                remove: 'Bild entfernen',
                no_image_available: 'Kein Bild verfügbar oder aus rechtlichen Gründen nicht angezeigt',
                progress: 'Upload-Fortschritt: {progress}%',
                limit_reached: 'Maximale Anzahl von {count} Bildern erreicht',
                privacy_notice: 'Keine Personen/Kennzeichen fotografieren',
                offline_cached: 'Wird offline gespeichert',
                ai_analysis: 'Analyse via Azure AI (Deutschland)',
                ai_analysis_help: 'Informationen zur KI-Analyse',
                ai_analysis_tooltip: 'Mit dem Upload bestätigen Sie, dass das Foto rechtmäßig erstellt wurde und keine Rechte Dritter verletzt. Wenn Personen oder Kennzeichen erkennbar sind, bitte vor dem Upload unkenntlich machen. Die Analyse dient ausschließlich der Kategorisierung Ihrer Meldung. Es wird nur eine verkleinerte, EXIF-freie Kopie an Azure OpenAI (Deutschland) übertragen; das Original wird nicht an den Dienst gesendet.'
            },
            submit: {
                button: 'Meldung absenden',
                submitting: 'Wird gesendet...',
                processing: 'Wird verarbeitet...',
                success: 'Meldung erfolgreich eingereicht',
                error: 'Fehler beim Absenden der Meldung',
                loading: 'Formular wird geladen...'
            },
            loading: 'Meldeformular wird geladen...',
            draft_saved: 'Entwurf gespeichert'
        },
        ai: {
            label: 'KI',
            powered: 'KI-gestützt',
            analyzing: 'KI analysiert Ihre Fotos...',
            started_sr: 'KI-Analyse gestartet',
            complete_sr: 'KI-Analyse erfolgreich abgeschlossen',
            field_updated_sr: '{field} wurde aktualisiert mit: {value}',
            analysis_complete_sr: 'KI-Analyse abgeschlossen.',
            category_result_sr: 'Kategorie ausgewählt: {category}.',
            description_result_sr: 'Beschreibung generiert: {description}',
            location_result_sr: 'Standort gefunden: {location}.',
            category_hint: 'Dieses Foto scheint nicht zu unseren Meldungskategorien zu passen. Bitte wähle selbst eine Kategorie aus.',
            processing: {
                analyzing: 'Frage die KI ...',
                location: 'Prüfe Bild-Metadaten...',
                location_found: 'Standort gefunden:',
                location_ai: 'Suche Standort im Bild...',
                location_not_found: 'Standort nicht in Bild-Metadaten gefunden.',
                location_complete: 'Standort identifiziert',
                category: 'Identifiziere Kategorie...',
                category_found: 'Kategorie identifiziert:',
                category_not_matched: 'Von KI vorgeschlagene Kategorie (Auswahl erforderlich)',
                description: 'Generiere Beschreibung...',
                description_complete: 'Beschreibung generiert',
                attributes_filled: '{count} zusätzliche(s) Feld(er) vorausgefüllt',
                complete: 'KI-Analyse abgeschlossen',
                error: 'Fehler bei der KI-Analyse',
                privacy_warning: 'Datenschutzhinweis'
            },
            privacy: {
                title: 'Datenschutzhinweis',
                description: 'Auf Ihrem Foto wurden möglicherweise persönliche Daten erkannt ({issues}). Das Foto wird vor Veröffentlichung durch die Verwaltung geprüft.',
                required: 'Auf diesem Foto wurden datenschutzkritische Inhalte erkannt, für die keine automatische Unkenntlichmachung verfügbar ist. Das Foto kann nicht verwendet werden. Bitte ersetzen oder entfernen Sie es, um fortzufahren.',
                removePhoto: 'Foto entfernen',
                replace: 'Foto ersetzen',
                understood: 'Mit diesem Foto fortfahren'
            },
            failed: {
                title: 'Bildanalyse nicht verfügbar',
                description: 'Ihr Bild wird vor der Veröffentlichung manuell geprüft. Sie können die Meldung trotzdem absenden.'
            },
            budget_exhausted_title: 'KI-Analyse übersprungen',
            budget_exhausted_submitted: 'Das KI-Analyse-Budget für diesen Monat ist aufgebraucht. Ihre Meldung wurde erfolgreich eingereicht.'
        },
        buttons: {
            photo: 'Foto-Meldung',
            classic: 'Klassische Meldung',
            follow: 'Meldung folgen',
            following: 'Folgend',
            share: 'Meldung teilen',
            print: 'Drucken',
            flag: 'Melden',
            flag_submitted: 'Bereits gemeldet',
            copy_link: 'Link kopieren',
            link_copied: 'Link in die Zwischenablage kopiert',
            email: 'E-Mail',
            directions: 'Route anzeigen'
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
                unknown: 'Unbekanntes Datum'
            }
        }
    },
    map: {
        tap_to_load: 'Tippen um Karte anzuzeigen',
        tap_to_select_location: 'Auf Karte tippen um Standort zu wählen',
        loading: 'Karte wird geladen...',
        loading_address: 'Adresse wird geladen...',
        retry_attempt: 'Versuch {count}',
        confirm_location: 'Ort bestätigen',
        add_report_here: 'Hier melden',
        controls: {
            zoom_in: 'Vergrößern',
            zoom_out: 'Verkleinern',
            zoom: 'Zoom',
            find_location: 'Meinen Standort finden',
            toggle_heatmap: 'Heatmap ein-/ausschalten',
            toggle_language: 'Sprache ändern',
            add_report_here: 'Hier melden',
            adjust_tilt: 'Neigung anpassen',
            degrees: '{count} Grad',
            layers: 'Kartenebenen',
            no_layers: 'Keine Ebenen verfügbar',
            geolocation: {
                label: 'Standort ermitteln'
            }
        },
        pick: {
            drag_hint: 'Marker verschieben um Position anzupassen'
        },
        tooltip: {
            label: 'Informationen zum Kartenmarker',
            opens_form_above: 'Öffnet Formular oben',
            opens_modal: 'Öffnet im Dialog'
        },
        keyboard: {
            canvasInstructions: 'Interaktive Karte mit Meldungsmarkierungen. Pfeiltasten navigieren zwischen Markierungen, Umschalt+Pfeiltasten verschieben die Karte, Eingabe zum Auswählen. Strg+= zum Vergrößern, Strg+- zum Verkleinern.',
            noFeatures: 'Keine Markierungen im aktuellen Kartenausschnitt. Versuchen Sie hineinzuzoomen oder die Karte zu verschieben.',
            zoomedIntoCluster: 'In Clusterbereich hineingezoomt. Pfeiltasten zur Navigation zwischen Markierungen nutzen.',
            clusterFocused: 'Cluster mit {count} Meldungen fokussiert. Eingabe zum Aufklappen. {position}',
            clusterExpanded: 'Cluster in {count} Meldungen aufgeklappt. {featureLabel}',
            markerFocused: 'Meldung fokussiert: {name} bei {address}{context}. Eingabe für Details. {position}',
            expandedContext: ' (aus Cluster aufgeklappt)',
            untitledReport: 'Unbenannte Meldung',
            unknownLocation: 'Standort',
            featurePosition: 'Markierung {current} von {total}.',
            pannedToExplore: 'Karte {direction} verschoben. Umschalt loslassen und Pfeiltasten zur Navigation nutzen.',
            pannedNoMarkers: 'Karte {direction} verschoben. Keine Markierungen in dieser Richtung - Pfeiltasten zum Weitererkunden nutzen.'
        }
    },
    detail: {
        location: 'Standort',
        photos: 'Fotos',
        description: 'Beschreibung',
        status_history: 'Status-Verlauf',
        updates: 'Aktualisierungen',
        no_updates: 'Noch keine Aktualisierungen',
        dialog_description: 'Meldungsdetails anzeigen',
        edit: 'Bearbeiten',
        follow: {
            button: 'Folgen',
            following: 'Folgend',
            stop: 'Nicht mehr folgen',
            success: 'Sie folgen jetzt dieser Meldung',
            error: 'Fehler beim Folgen der Meldung',
            updating: 'Wird aktualisiert...'
        },
        unavailable: {
            title: 'Meldung nicht verfügbar',
            message: 'Diese Meldung existiert nicht oder wurde noch nicht veröffentlicht. Neu eingereichte Meldungen können etwas Zeit benötigen, bevor sie erscheinen.'
        }
    },
    pages: {
        dialog_description: 'Seiteninhalte anzeigen'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Verteilung',
        total_reports: 'Meldungen insgesamt',
        status_distribution: 'Statusverteilung',
        category_distribution: 'Kategorieverteilung',
        uncategorized: 'Nicht kategorisiert',
        showing_reports: 'Zeige {visible} von {total} Meldungen',
        no_reports: 'Keine Meldungen verfügbar',
        open_reports: 'Offene Meldungen',
        closed_reports: 'Geschlossene Meldungen',
        no_data_available: 'Keine Daten vorhanden',
        expand: 'Details anzeigen',
        collapse: 'Details ausblenden',
        subcategory: 'Unterkategorie',
        subcategories: 'Unterkategorien'
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
        showing_in_area: 'Zeige {visible} in diesem Bereich, {total} insgesamt',
        showing_area_only: 'Zeige {visible} in diesem Bereich',
        no_results: 'Keine Meldungen gefunden',
        no_filtered_results: 'Keine Meldungen entsprechen Ihren Filterkriterien',
        load_more: 'Alle Meldungen geladen',
        load_more_button: 'Weitere laden',
        newest_first: 'Neueste zuerst',
        oldest_first: 'Älteste zuerst',
        refresh: 'Aktualisieren',
        status_update: 'Status aktualisiert',
        location: 'Standort',
        unpublished: 'Unveröffentlicht',
        editable: 'Bearbeitbar'
    },
    error: {
        form_error_fallback: 'Beim Laden des Formulars ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
        404: {
            title: 'Seite nicht gefunden',
            description: 'Die gesuchte Seite existiert nicht oder wurde verschoben.'
        },
        403: {
            title: 'Zugriff verweigert',
            description: 'Du hast keine Berechtigung, diese Seite anzusehen.'
        },
        500: {
            title: 'Etwas ist schiefgelaufen',
            description: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.'
        },
        fallback: {
            title: 'Fehler',
            description: 'Ein unerwarteter Fehler ist aufgetreten.'
        },
        actions: {
            back: 'Zurück',
            home: 'Zur Startseite',
            retry: 'Erneut versuchen'
        }
    },
    errors: {
        general: 'Etwas ist schiefgelaufen',
        search_failed: 'Suche fehlgeschlagen. Bitte erneut versuchen.',
        api: {
            rate_limit: 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
            unauthorized: 'Nicht autorisiert. Bitte melden Sie sich erneut an.',
            forbidden: 'Zugriff verweigert.',
            not_found: 'Ressource nicht gefunden.',
            server_error: 'Serverfehler. Bitte versuchen Sie es später erneut.',
            default: 'API-Fehler: {status}'
        },
        upload_failed: 'Upload fehlgeschlagen',
        location_error: 'Standort konnte nicht ermittelt werden',
        network_error: 'Netzwerkfehler',
        geolocation: {
            title: 'Standortfehler',
            permission_denied: 'Standortfreigabe wurde verweigert. Bitte erlauben Sie den Zugriff in Ihren Browsereinstellungen.',
            unavailable: 'Standortinformationen sind derzeit nicht verfügbar.',
            timeout: 'Zeitüberschreitung bei der Standortermittlung.',
            unknown: 'Ein unbekannter Standortfehler ist aufgetreten.'
        },
        try_again: 'Bitte versuchen Sie es erneut',
        validation: {
            title: 'Leider können wir die Meldung nicht annehmen:',
            location_error_title: 'Standortfehler',
            invalid_input: 'Ungültige Eingabe',
            duplicate_title: 'Duplikat gefunden',
            duplicate_found: 'Ähnlicher Bericht gefunden',
            duplicate_report:
        'Ein ähnlicher Bericht wurde bereits erstellt (Nr. {reportId})',
            duplicate_hint_title: 'Mögliches Duplikat gefunden',
            duplicate_hint_message: 'Ein ähnlicher Bericht könnte in diesem Bereich bereits existieren. Sie können trotzdem absenden, wenn Sie glauben, dass es sich um ein neues Anliegen handelt.',
            duplicate_existing_report: 'Existierender Bericht: Nr. {reportId}',
            view_existing_report: 'Vorhandenen Bericht ansehen',
            submit_anyway: 'Trotzdem absenden',
            location_out_of_bounds:
        'Der gewählte Standort liegt außerhalb unseres Zuständigkeitsbereichs',
            required_field: '{field} ist erforderlich',
            file_size: 'Die ausgewählte Datei ist zu groß (maximal 10 MB)',
            file_type: 'Das Format wird nicht unterstützt (erlaubt: jpg, png, webp)',
            media_upload: 'Fehler beim Hochladen des Bildes',
            required_fields: 'Bitte füllen Sie alle erforderlichen Felder aus',
            please_review: 'Bitte überprüfen Sie das Formular und korrigieren Sie alle Fehler vor dem Absenden.',
            invalid_format: 'Ungültiges Format für {field}', // Added missing key from en.ts
            consent_required: 'Bitte akzeptieren Sie die Datenschutzerklärung', // Added missing key from en.ts
            photo_required: 'Für diese Kategorie ist ein Foto erforderlich' // Added for photo requirement
        },
        rate_limit: {
            title: 'Bildanzahl kurzfristig überschritten',
            general: 'Bitte versuchen Sie es später erneut.',
            with_time: 'Zu viele Bilder auf einmal! Bitte versuchen Sie es in {seconds} Sekunden erneut.'
        },
        network: 'Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung',
        timeout: 'Zeitüberschreitung. Bitte versuchen Sie es erneut',
        upload: {
            title: 'Upload-Fehler',
            invalid_type: 'Ungültiger Dateityp. Bitte nur Bilder hochladen.',
            file_too_large: 'Datei zu groß. Maximale Größe ist {size}.',
            file_too_large_raw: 'Datei zu groß ({size} Maximum). Bitte ein kleineres Bild wählen.',
            optimization_failed: 'Bild konnte nicht komprimiert werden. Maximale Größe nach Komprimierung: {size}.',
            dimensions_too_large:
        'Bildmaße zu groß. Maximal {width}x{height} Pixel.',
            invalid_image: 'Ungültige oder beschädigte Bilddatei.',
            failed: 'Upload fehlgeschlagen. Bitte erneut versuchen.',
            limit_reached: 'Maximale Anzahl von {count} Dateien erreicht.',
            remove_to_add: 'Entfernen Sie ein Foto, um ein neues hinzuzufügen',
            single_file_limit: 'Es kann nur ein Bild hochgeladen werden.',
            exact_file_limit: 'Maximal {count} Bilder können hochgeladen werden.'
        },
        submission_error: 'Fehler beim Absenden des Formulars', // Corrected from "Meldung"
        unknown: 'Ein unbekannter Fehler ist aufgetreten.',
        pending_uploads: 'Bitte warten Sie, bis alle Uploads abgeschlossen sind.',
        incomplete_form: 'Bitte füllen Sie alle erforderlichen Felder aus.',
        page: {
            title: 'Fehler',
            not_found_title: 'Seite nicht gefunden',
            not_found_message: 'Die gesuchte Seite existiert leider nicht.',
            server_error_title: 'Serverfehler',
            server_error_message: 'Entschuldigung, auf unserem Server ist ein Fehler aufgetreten.',
            generic_title: 'Fehler aufgetreten',
            generic_message: 'Ein unerwarteter Fehler ist aufgetreten.',
            action_home: 'Zur Startseite',
            action_back: 'Zurück',
            action_retry: 'Erneut versuchen',
            details: 'Fehlerdetails'
        }
    },
    success: {
        report_submitted: 'Meldung eingereicht.',
        report_submitted_description: 'Ihre Meldung wurde erfolgreich eingereicht und wird in Kürze bearbeitet.',
        moderation_notice:
      'Ihre Meldung wird vor der Veröffentlichung geprüft. Ihre Meldungsnummer:',
        submit_another: 'Weitere Meldung',
        auto_followed: 'Diese Meldung wurde automatisch zu Ihren gefolgten Meldungen hinzugefügt',
        visibility_limitation_notice: 'Bitte beachten Sie, dass nicht alle Meldungen öffentlich auf der Website sichtbar werden. Wenn sich Ihre Meldung in der Liste der gefolgten Meldungen nicht aktualisiert, kann sie dennoch von der Stadt bearbeitet worden sein. Überprüfen Sie Ihre E-Mail für Statusaktualisierungen.',
        fun_facts: [
            '🌱 Jede Meldung, die Sie einreichen, trägt dazu bei, Ihre Stadt lebenswerter zu machen!',
            '🏙️ Bürgermeldungen haben bereits über 10.000 Probleme in Städten weltweit behoben.',
            '⚡ Die durchschnittliche Meldung wird innerhalb von 24 Stunden bearbeitet.',
            '🤝 Sie sind Teil einer Gemeinschaft, die sich um öffentliche Räume kümmert!',
            '📊 Daten aus Bürgermeldungen helfen Stadtplanern bei besseren Entscheidungen.',
            '🔄 Das Verfolgen Ihrer Meldungen hält Sie automatisch über Fortschritte auf dem Laufenden.',
            '🎯 Foto-Meldungen werden 3x schneller bearbeitet als reine Text-Meldungen.',
            '🌍 Bürgerbeteiligungsplattformen wie diese gibt es in über 50 Ländern.',
            '💡 Ihr Feedback hilft bei der Priorisierung, welche Probleme zuerst behoben werden.',
            '🚀 Digitale Meldungen haben Reaktionszeiten um bis zu 60% reduziert.',
            '🏆 Aktive Bürger schaffen stärkere, widerstandsfähigere Gemeinden.',
            '🔍 KI-Analyse hilft dabei, Ihre Meldungen genauer zu kategorisieren.',
            '📱 Mobile Meldungen erleichtern es, Probleme sofort zu melden, wenn Sie sie sehen.',
            '⭐ Vielen Dank, dass Sie ein engagierter Bürger sind!'
        ]
    },
    flag: {
        title: 'Meldung melden',
        description: 'Helfen Sie uns, die Qualität zu sichern, indem Sie unangemessene Inhalte melden.',
        reason_label: 'Warum melden Sie diese Meldung?',
        reason_spam: 'Spam oder Werbung',
        reason_offensive: 'Anstößiger oder unangemessener Inhalt',
        reason_personal: 'Enthält personenbezogene Daten',
        reason_location: 'Falscher Standort',
        reason_other: 'Sonstiges',
        details_label: 'Weitere Details',
        details_placeholder: 'Bitte beschreiben Sie das Problem...',
        details_required: 'Bitte geben Sie Details an',
        submit: 'Absenden',
        success: 'Vielen Dank. Wir werden diese Meldung prüfen.',
        error: 'Konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
        already_flagged: 'Sie haben diese Meldung bereits gemeldet.'
    },
    pwa: {
        install: {
            title: 'App installieren',
            button: 'Installieren',
            not_now: 'Später',
            description:
        'Klicken Sie auf das Installations-Symbol in der Adressleiste Ihres Browsers.',
            share_button: 'Teilen-Symbol',
            open_safari: 'Safari-Browser',
            ios: {
                title: 'Zum Home-Bildschirm',
                safari_instructions:
          'Tippen Sie auf das {icon} und wählen Sie "Zum Home-Bildschirm hinzufügen".',
                other_instructions:
          'Bitte öffnen Sie diese Seite im {browser}, um sie zu installieren.'
            },
            chrome: {
                instructions:
          'Klicken Sie auf das Installations-Symbol {icon} in der Symbolleiste, um diese App zu installieren.'
            },
            edge: {
                instructions:
          'Klicken Sie auf das Installations-Symbol {icon} in der Adressleiste.'
            },
            firefox: {
                instructions:
          'Klicken Sie auf das Home-Symbol {icon} in der Adressleiste.'
            }
        }
    },
    boundaries: {
        loading: 'Standortgrenzen werden geladen...',
        error: 'Standortgrenzen können nicht validiert werden. Bitte versuchen Sie es später erneut.',
        notLoaded: 'Standortgrenzen noch nicht geladen',
        outsideNonStrict: 'Hinweis: Der ausgewählte Standort liegt außerhalb der örtlichen Zuständigkeit (Stadtgrenze) von {locationName}.',
        outsideStrict: 'Standort außerhalb des Zuständigkeitsbereichs. Bitte wählen Sie einen Standort innerhalb der Stadtgrenzen.',
        validationUnavailable: 'Standortvalidierung nicht verfügbar. Ihre Meldung wird akzeptiert, kann aber überprüft werden.'
    },
    filters: {
        title: 'Filter',
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
            title: 'Kategorie',
            other: 'Andere'
        },
        actions: {
            more: 'Weitere Filter',
            expand: 'Mehr Filter',
            collapse: 'Weniger',
            clear_all: 'Alle löschen',
            active_count: '{count} Filter aktiv',
            toggle: 'Filter'
        }
    },
    privacy: {
        notice_text: 'Informationen zum Datenschutz finden Sie',
        notice_link_text: 'hier',
        modal: {
            title: 'Datenschutzerklärung',
            loading: 'Datenschutzinformationen werden geladen...',
            retry: 'Wiederholen',
            noContent: 'Keine Datenschutzinformationen verfügbar.',
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
            aria_label: 'Schnellzugriffe',
            photo: {
                title: 'Foto',
                description: 'Machen Sie ein Bild, die KI erledigt den Rest',
                aria_label: 'Foto-Meldung erstellen'
            },
            classic: {
                title: 'Klassisch',
                description: 'Beschreiben und verorten Sie das Problem',
                aria_label: 'Klassische Meldung erstellen'
            },
            following: {
                title: 'Verfolgen',
                description: 'Bleiben Sie über den Fortschritt informiert',
                aria_label: 'Zu verfolgten Meldungen wechseln'
            },
            list: {
                title: 'Erkunden',
                description: 'Sehen Sie, was in Ihrer Nähe passiert',
                aria_label: 'Karte erkunden und Liste anzeigen'
            }
        }
    },
    auth: {
        login: {
            title: 'Anmelden',
            subtitle: 'Geben Sie Ihre E-Mail-Adresse ein, um einen Bestätigungscode zu erhalten',
            email_label: 'E-Mail-Adresse',
            email_hint: 'Wir senden Ihnen einen 6-stelligen Code',
            email_placeholder: 'E-Mail-Adresse',
            send_code: 'Bestätigungscode senden',
            disabled: {
                title: 'Anmeldung nicht verfügbar',
                message: 'Die passwortlose Anmeldung ist hier nicht aktiviert. Bitte wenden Sie sich an die Administration, wenn Sie Zugang benötigen.',
                back_button: 'Zurück zur Startseite'
            }
        },
        verify: {
            email_label: 'E-Mail-Adresse',
            code_label: 'Bestätigungscode',
            code_hint: 'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein',
            code_placeholder: '123456',
            verify_button: 'Verifizieren & Anmelden',
            back_button: 'Andere E-Mail verwenden',
            request_new: 'Neuen Code anfordern',
            resend_code: 'Code erneut senden',
            expires_in: 'Code läuft ab in {time}',
            expired_title: 'Code abgelaufen',
            expired_message: 'Ihr Bestätigungscode ist abgelaufen. Bitte fordern Sie einen neuen an.'
        },
        code_sent: {
            title: 'Code gesendet',
            message: 'Wir haben einen 6-stelligen Bestätigungscode an {email} gesendet'
        },
        error: {
            title: 'Authentifizierungsfehler',
            request_failed: 'Fehler beim Senden des Bestätigungscodes. Bitte versuchen Sie es erneut.',
            verify_failed: 'Ungültiger oder abgelaufener Bestätigungscode',
            sso_failed: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.',
            network: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
            logout_failed: 'Fehler beim Abmelden. Bitte versuchen Sie es erneut.'
        },
        sso: {
            completing: 'Anmeldung wird abgeschlossen...',
            method_label: 'Single Sign-On',
            button_aria: 'Mit {provider} per Single Sign-On anmelden'
        },
        user: {
            logged_in_as: 'Angemeldet als',
            logout: 'Abmelden'
        },
        welcome: {
            greeting: 'Hallo, {name}',
            sign_in: 'Anmelden',
            sign_out: 'Abmelden',
            user_avatar: 'Benutzer-Avatar'
        }
    },
    profile: {
        title: 'Profil',
        account: {
            title: 'Konto',
            roles: 'Rollen'
        },
        groups: {
            title: 'Gruppen'
        },
        appearance: {
            title: 'Darstellung',
            color_mode: 'Farbmodus',
            light: 'Hell',
            dark: 'Dunkel',
            system: 'System',
            theme_override: 'Eigene Farbeinstellungen',
            theme_override_description: 'Das Standard-Theme mit eigenen Farbeinstellungen überschreiben',
            primary_color: 'Primärfarbe',
            secondary_color: 'Sekundärfarbe',
            neutral_color: 'Neutralfarbe',
            reset_theme: 'Auf Standard zurücksetzen'
        },
        language: {
            title: 'Sprache',
            select: 'Sprache auswählen',
            save_failed: 'Spracheinstellung konnte nicht gespeichert werden. Bitte erneut versuchen.'
        }
    },
    offline: {
        banner: {
            title: 'Du bist offline',
            description: 'Meldungen werden lokal gespeichert',
            pending: '{count} Meldung(en) ausstehend',
            dismiss: 'Schließen',
            states: {
                offline: {
                    title: 'Du bist offline',
                    description: 'Meldungen werden lokal gespeichert'
                },
                syncing: {
                    title: 'Synchronisiere...',
                    description: '{count} Meldung(en) werden gesendet'
                },
                success: {
                    title: '{count} Meldung(en) gesendet',
                    titleDefault: 'Synchronisierung abgeschlossen'
                },
                error: {
                    title: '{count} fehlgeschlagen',
                    description: 'Pruefen und erneut versuchen'
                },
                pending: {
                    title: 'Meldungen bereit zum Senden'
                }
            },
            report: 'Meldung | Meldungen',
            syncNow: 'Jetzt senden'
        },
        toast: {
            went_offline: 'Verbindung unterbrochen',
            went_offline_description: 'Meldungen werden lokal gespeichert.',
            back_online: 'Wieder online',
            back_online_description: 'Verbindung wiederhergestellt.',
            syncing: 'Synchronisiere...',
            syncing_description: '{count} Meldung(en) werden synchronisiert.',
            sync_complete: 'Synchronisierung abgeschlossen',
            sync_complete_description: 'Alle Meldungen wurden erfolgreich gesendet.',
            sync_failed: 'Synchronisierung fehlgeschlagen',
            sync_failed_description: '{count} Meldung(en) konnten nicht gesendet werden.'
        },
        status: {
            offline: 'Offline',
            syncing: 'Synchronisiere...',
            pending: '{count} ausstehend',
            synced: 'Synchronisiert'
        },
        sync: {
            title: 'Sync-Status',
            syncNow: 'Jetzt synchronisieren',
            syncing: 'Synchronisiere...',
            offlineWarning: 'Du bist offline. Meldungen werden synchronisiert, sobald die Verbindung wiederhergestellt ist.',
            pendingCount: '{count} Meldung(en) warten auf Synchronisierung',
            readyToSync: 'Bereit zur Synchronisierung',
            waitingForConnection: 'Warte auf Verbindung',
            failedItems: 'Fehlgeschlagene Übertragungen',
            untitledRequest: 'Unbenannte Meldung',
            unknownError: 'Unbekannter Fehler',
            attempts: '{count} Versuch(e)',
            retry: 'Erneut versuchen',
            delete: 'Löschen',
            allSynced: 'Alle Meldungen synchronisiert',
            lastSync: 'Letzte Synchronisierung',
            syncSuccess: '{count} Meldung(en) erfolgreich synchronisiert',
            syncFailed: '{count} Meldung(en) konnten nicht synchronisiert werden',
            retrySuccess: 'Meldung erfolgreich synchronisiert',
            retryFailed: 'Meldung konnte nicht synchronisiert werden',
            itemDeleted: 'Meldung aus Warteschlange entfernt',
            queuedSuccess: 'Meldung gespeichert',
            willSyncWhenOnline: 'Wird gesendet, sobald Verbindung wiederhergestellt ist.',
            queueFailed: 'Meldung konnte nicht gespeichert werden'
        },
        failed: {
            title: 'Fehlgeschlagene Meldungen',
            description: 'Diese Meldungen konnten nicht gesendet werden und benötigen Ihre Aufmerksamkeit.',
            empty: 'Keine fehlgeschlagenen Meldungen',
            validation_error: 'Korrektur nötig',
            server_error: 'Server-Fehler',
            edit: 'Bearbeiten',
            retry: 'Erneut versuchen',
            delete: 'Löschen',
            confirm_delete: 'Sind Sie sicher, dass Sie diese Meldung löschen möchten? Dies kann nicht rückgängig gemacht werden.',
            untitled: 'Unbenannte Meldung',
            view_failed: 'Fehlgeschlagene anzeigen'
        },
        form: {
            unavailable_title: 'Formular offline nicht verfügbar',
            unavailable_description: 'Das Meldeformular benötigt eine Internetverbindung zum Laden. Bitte verbinden Sie sich mit dem Internet und versuchen Sie es erneut.',
            retry: 'Erneut versuchen',
            go_back: 'Zurück',
            waiting_for_connection: 'Warten auf Verbindung...'
        }
    },
    legal: {
        impressum: {
            title: 'Impressum',
            heading: 'Angaben gemäss TMG §5',
            responsible_heading: 'Verantwortlich für den Inhalt',
            responsible_text: '{name} ist verantwortlich für den Inhalt dieser Plattform gemäss § 55 Abs. 2 RStV.'
        },
        privacy: {
            title: 'Datenschutzerklärung',
            heading: 'Datenschutz',
            intro: 'Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschliesslich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003).',
            controller_heading: 'Verantwortlicher',
            data_heading: 'Erhobene Daten',
            data_text: 'Bei der Nutzung dieser Plattform werden folgende Daten verarbeitet: Standortdaten der Meldung, Beschreibungstext, hochgeladene Fotos sowie technische Zugriffsdaten (IP-Adresse, Browser-Typ, Zeitpunkt des Zugriffs).',
            rights_heading: 'Ihre Rechte',
            rights_text: 'Ihnen stehen die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch zu.'
        },
        terms: {
            title: 'Nutzungsbedingungen',
            heading: 'Nutzungsbedingungen',
            intro: 'Mit der Nutzung dieser Plattform erklären Sie sich mit den folgenden Bedingungen einverstanden.',
            purpose_heading: 'Zweck',
            purpose_text: 'Diese Plattform dient der Meldung von Anliegen im öffentlichen Raum. Meldungen werden an die zuständige Stelle weitergeleitet.',
            obligations_heading: 'Nutzerpflichten',
            obligations_text: 'Sie verpflichten sich, nur wahrheitsgemässe Angaben zu machen und keine rechtswidrigen Inhalte einzustellen. Hochgeladene Fotos dürfen keine erkennbaren Personen ohne deren Einwilligung zeigen.',
            liability_heading: 'Haftung',
            liability_text: '{name} übernimmt keine Gewähr für die Vollständigkeit und Richtigkeit der bereitgestellten Informationen.'
        },
        email_label: 'E-Mail',
        contact_label: 'Kontakt',
        platform: {
            heading: 'Plattformbetreiber',
            intro: 'Diese Plattform wird technisch betrieben von:',
            description: 'Die Civic Patches GmbH stellt die technische Infrastruktur für die Mark-a-Spot Plattform bereit.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Deutschland',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Betreiber dieser Karte',
            not_configured: 'Der Betreiber dieser Karte hat noch keine rechtlichen Angaben hinterlegt. Betreiber öffentlich zugänglicher Online-Dienste sind ggf. verpflichtet, ein Impressum und eine Datenschutzerklärung bereitzustellen.'
        },
        footer: {
            impressum: 'Impressum',
            privacy: 'Datenschutz',
            terms: 'Nutzungsbedingungen'
        },
        not_configured: 'Betreiberdaten sind noch nicht konfiguriert.'
    },
    demo_mode: {
        banner: {
            title: 'Demo-System',
            message: 'Meldungen werden hier nicht an eine Behörde weitergeleitet.',
            link_label: 'mark-a-spot.com besuchen',
            minimize_label: 'Demo-Hinweis verkleinern',
            expand_label: 'Demo-Hinweis aufklappen'
        },
        reset: {
            title: 'Demo-System',
            notice: 'Das Demo-System wird stündlich zurückgesetzt.',
            countdown_label: 'Nächster Reset in',
            countdown_aria: 'Nächster Reset des Demo-Systems in {time}'
        },
        modal: {
            title: 'Demo-Einreichung',
            body: 'Dies ist eine Demo. Ihre Meldung wird NICHT an die Behörde weitergeleitet. Mit der Demo-Einreichung fortfahren?',
            confirm_label: 'Demo-Meldung absenden',
            cancel_label: 'Abbrechen'
        },
        lite: {
            title: 'Nur Demo',
            heading: 'Demo-System',
            body: 'Dies ist eine Demonstration von Mark-a-Spot. Einreichungen über das Lite-Formular sind hier deaktiviert, damit echte Meldungen nicht versehentlich eine Behörde erreichen.',
            link_label: 'mark-a-spot.com besuchen'
        }
    },
    print: {
        title: 'Meldungs-Bericht',
        description: 'Beschreibung',
        location: 'Standort',
        media: 'Medien',
        image_unavailable: 'Bild nicht verfügbar',
        attributes: 'Zusatzfelder',
        status_history: 'Statusverlauf',
        internal_fields: 'Interne Informationen',
        organisation: 'Zuständige Stelle',
        hazard_level: 'Gefahrenstufe',
        hazard_category: 'Gefahrenkategorie',
        sentiment: 'Stimmung',
        printed_at: 'Gedruckt',
        showing_recent: 'Es werden {count} von {total} Aktualisierungen angezeigt'
    }
};
