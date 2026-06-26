// locales/pl.ts
export default {
    locale: {
        code: 'pl-PL'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    nav: {
        map: 'Mapa',
        dashboard: 'Panel',
        back_to_frontend: 'Powrót do mapy'
    },
    dashboard: {
        title: 'Panel',
        welcome: 'Witaj, {name}',
        nav: {
            dashboard: 'Panel',
            requests: 'Zgłoszenia',
            settings: 'Ustawienia',
            categories: 'Kategorie',
            jurisdictions: 'Jurysdykcje',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'Języki',
            billing: 'Rozliczenia'
        },
        help: {
            docs: 'Dokumentacja',
            support: 'Skontaktuj się z pomocą'
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
            logout: 'Wyloguj'
        },
        jurisdiction: {
            current: 'Przestrzeń robocza',
            citizenView: 'Widok obywatela',
            switchTo: 'Przełącz na',
            blocked: 'zablokowany',
            admin_section_header: 'Wszystkie obszary robocze (dostęp administratora)'
        },
        stats: {
            total: 'Wszystkie zgłoszenia',
            pending: 'Oczekujące',
            in_progress: 'W trakcie',
            resolved: 'Rozwiązane',
            my_groups: 'Moje grupy',
            overall: 'Ogółem'
        },
        recent_requests: 'Ostatnie zgłoszenia',
        view_all: 'Zobacz wszystkie',
        no_recent: 'Brak ostatnich zgłoszeń',
        wms: {
            title: 'Warstwy mapy',
            attribution: 'Dane: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Media',
                category: 'Kategoria',
                status: 'Status',
                created: 'Utworzono'
            }
        }
    },
    form: {
        body: 'Opis',
        body_description: 'Proszę podać szczegółowy opis',
        body_placeholder: 'Wprowadź opis...',
        category: 'Kategoria',
        category_description: 'Wybierz odpowiednią kategorię dla swojego zgłoszenia',
        category_placeholder: 'Wybierz kategorię',
        category_disabled: {
            title: 'Kategoria wybrana',
            description: 'Wybrałeś kategorię "{category}". Ta kategoria ma specjalne wymagania lub nie pozwala na dalszą edycję formularza.'
        },
        category_empty: 'Brak dostępnych kategorii',
        category_loading: 'Ładowanie kategorii...',
        category_disabled_notice: 'Ta kategoria służy wyłącznie do celów informacyjnych. Zgłoszenia nie są możliwe.',
        category_description_loading: 'Ładowanie opisu...',
        category_description_error: 'Błąd podczas ładowania opisu',
        email: 'Email',
        email_description: 'Twój adres kontaktowy',
        email_placeholder: 'Wprowadź swój adres email',
        first_name: 'Imię',
        first_name_description: 'Twoje imię',
        first_name_placeholder: 'Wprowadź swoje imię',
        last_name: 'Nazwisko',
        last_name_description: 'Twoje nazwisko',
        last_name_placeholder: 'Wprowadź swoje nazwisko',
        gdpr: 'Zgoda na przetwarzanie danych',
        gdpr_description: 'Wyrażam zgodę na przetwarzanie moich danych zgodnie z polityką prywatności.',
        object_id: 'ID obiektu',
        object_id_description: 'Identyfikator zgłaszanego obiektu',
        object_id_placeholder: 'Wprowadź ID obiektu (np. numer słupa)',
        phone: 'Numer telefonu',
        phone_description: 'Twój numer kontaktowy',
        phone_placeholder: 'Wprowadź numer telefonu',

        // Zgłoszenia oparte na obiektach
        facility: 'Obiekt',
        facility_plural: 'Obiekty',
        facility_placeholder: 'Wybierz {label}',
        facility_required: '{label} jest wymagany.',
        facility_unavailable: 'Wybrany obiekt nie jest już dostępny, wybierz ponownie.',
        facility_nearest_snapped: 'Najbliższy obiekt: {label}',
        facility_no_nearby: 'Brak obiektów w pobliżu, wybierz ręcznie.',
        facility_use_my_location: 'Użyj mojej lokalizacji',
        facility_locating: 'Lokalizowanie…',
        facility_no_match: 'Żaden obiekt nie pasuje do Twojego wyszukiwania.',
        facility_opens_in_new_tab: '(otwiera się w nowej karcie)',
        facility_deselected_map_pick: 'Używam własnej lokalizacji zamiast {label}',
        facility_tagged_with: 'W: {label}',

        imagelist: {
            empty: 'Brak dostępnych obrazów dla tego typu.'
        },
        back_to_report: 'Powrót do formularza zgłoszenia',
        requirements: {
            title: 'Still required',
            ready_to_submit: 'Ready to submit',
            photo: 'Upload a photo',
            category: 'Select a category',
            location: 'Provide location',
            description: 'Enter a description',
            email: 'Provide email address',
            privacy: 'Accept privacy policy',
            privacyBlock: 'Zastąp lub usuń zdjęcie z wrażliwą treścią',
            conditional: 'depending on category'
        },
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'Opis jest wymagany',
        category_required: 'Kategoria jest wymagana',
        email_required: 'Email jest wymagany',
        email_format: 'Nieprawidłowy format email',
        first_name_required: 'Imię jest wymagane',
        last_name_required: 'Nazwisko jest wymagane',
        gdpr_required: 'Musisz wyrazić zgodę na przetwarzanie danych',
        object_id_required: 'ID obiektu jest wymagane',
        phone_required: 'Numer telefonu jest wymagany',
        required_field: '{field} jest wymagane'
    },
    feedback: {
        page_title: 'Opinia o zgłoszeniu',
        error_title: 'Błąd ładowania',
        invalid_request: 'Nieprawidłowe lub wygasłe zgłoszenie',
        thank_you: 'Dziękujemy za opinię!',
        submission_received: 'Twoja opinia została pomyślnie przyjęta',
        loading: 'Ładowanie zgłoszenia...',
        title: 'Opinia dla: {service}',
        description: 'Proszę podzielić się swoją opinią',
        placeholder: 'Wpisz swoją opinię tutaj...',
        reopen_request: 'Chciałbym, aby to zgłoszenie zostało ponownie otwarte',
        submitting: 'Wysyłanie...',
        sending: 'Wysyłanie...',
        submit: 'Wyślij opinię',
        existing_title: 'Twoja opinia dla: {service}',
        already_submitted: 'Już przesłałeś opinię dla tego zgłoszenia',
        missing_uuid: 'Brak ID zgłoszenia',
        success_notification: 'Opinia została pomyślnie przesłana',
        success_with_id: 'Opinia pomyślnie przesłana dla zgłoszenia #{id}',
        updated_successfully: 'Opinia została zaktualizowana',
        added_to_list: 'Zgłoszenie zostało dodane do Twojej listy',
        submission_error: 'Nie udało się przesłać opinii',
        server_error: 'Błąd serwera: Opinia nie mogła zostać przetworzona w tym momencie',
        submission_failed: 'Nie udało się przesłać opinii. Spróbuj ponownie później',
        already_exists: 'Opinia dla tego zgłoszenia już istnieje',
        error_fetching_request: 'Błąd podczas ładowania szczegółów zgłoszenia',
        no_content: 'Brak treści opinii',
        refresh_complete: 'Lista zgłoszeń odświeżona',
        try_again: 'Spróbuj ponownie',
        format_unrecognized: 'Nierozpoznany format zgłoszenia',
        processing_error: 'Błąd przetwarzania danych zgłoszenia',
        your_feedback: 'Twoja opinia',
        contact_preference: 'Preferowany kontakt',
        no_contact: 'Bez kontaktu',
        email_contact: 'Kontakt przez email',
        email_placeholder: 'Twój adres email',
        set_status_open: 'Ustaw status na otwarty',
        set_status_open_description: 'Jeśli chcesz, abyśmy ponownie zajęli się tą sprawą, możesz otworzyć to zgłoszenie ponownie.',
        email_verification: 'Weryfikacja email',
        email_verification_placeholder: 'Adres email z oryginalnego zgłoszenia',
        email_verification_description: 'Wprowadź adres email użyty przy tworzeniu oryginalnego zgłoszenia.',
        email_mismatch: 'Wprowadzony adres email nie zgadza się z oryginalnym zgłoszeniem.',
        unauthorized_access: 'Nieautoryzowany dostęp. Sprawdź swój adres email.',
        not_eligible: 'To zgłoszenie nie kwalifikuje się obecnie do opinii',
        service_provider: {
            page_title: 'Odpowiedź dostawcy usługi',
            page_description: 'Prześlij notatki o wykonaniu dla przypisanych zgłoszeń',
            modal_title: 'Odpowiedź dostawcy usługi',
            dialog_description: 'Formularz odpowiedzi dostawcy usługi',
            title: 'Zakończ zadanie',
            your_email: 'Twój adres email',
            email_placeholder: 'dostawca{\'@\'}przyklad.pl',
            email_verification_note: 'Wprowadź swój adres email dostawcy usługi w celu weryfikacji',
            completion_notes: 'Notatki o wykonaniu',
            notes_placeholder: 'Opisz wykonaną pracę...',
            mark_as_completed: 'Oznacz jako zakończone',
            mark_as_completed_description: 'Ustaw status zgłoszenia na zakończone',
            submit_completion: 'Prześlij zakończenie',
            complete_request: 'Zakończ zadanie',
            completing: 'Przesyłanie...',
            completion_success: 'Zakończenie zgłoszenia zostało pomyślnie przesłane',
            submission_failed: 'Nie udało się przesłać zakończenia. Spróbuj ponownie później',
            server_error: 'Błąd serwera: Zakończenie nie mogło zostać przetworzone w tym momencie',
            completion_not_allowed: 'To zgłoszenie nie może zostać zakończone w tym momencie',
            email_verification_failed: 'Weryfikacja email nie powiodła się. Sprawdź swój adres email',
            already_completed: 'To zgłoszenie zostało już zakończone',
            loading: 'Ładowanie zgłoszenia...',
            try_again: 'Spróbuj ponownie',
            invalid_uuid: 'Nieprawidłowe lub wygasłe zgłoszenie',
            load_error: 'Błąd ładowania szczegółów zgłoszenia',
            error_fetching_request: 'Błąd podczas ładowania szczegółów zgłoszenia',
            completion_notes_required: 'Proszę podać notatki o wykonaniu',
            existing_completions: 'Poprzednie zakończenia',
            reassignment_note: 'To zgłoszenie zostało oznaczone do ponownego przypisania i może otrzymać wiele zakończeń',
            mark_completed_description: 'Confirm that the work has been completed'
        },
        dialog_description: 'Feedback form dialog'
    },
    service_unavailable: {
        title: 'Usługa tymczasowo niedostępna',
        message: 'Nie możemy połączyć się z naszymi usługami. Ten problem jest prawdopodobnie tymczasowy.',
        retry: 'Mamy obecnie problemy techniczne. Spróbuj ponownie za {seconds} sekund.',
        auto_retry: 'Ponowna próba za {seconds} sekund...',
        retry_now: 'Spróbuj teraz',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Twoje zgłoszenie. Nasze rozwiązanie.'
    },
    hiddenSection: {
        description: 'Nasz system zgłoszeń służy do raportowania problemów infrastrukturalnych. Możesz przejść bezpośrednio do zgłaszania problemów lub przejść do:',
        main_navigation: 'Główna nawigacja z informacjami, listą zgłoszeń i statystykami',
        map: 'Interaktywna mapa z wizualnymi znacznikami',
        map_navigation_hint: 'Użyj strzałek ⬆️⬇️⬅️➡️ do nawigacji między znacznikami, Enter ↩️ aby wybrać, Escape ❌ aby anulować wybór',
        action_button: 'Zgłoś bezpośrednio',
        keyboard_navigation_hint: 'Use arrow keys to navigate, Enter to activate',
        skip_to_main_content: 'Skip to main content'
    },
    accessibility: {
        skip_to_main: 'Przejdź do głównej treści',
        skip_to_map: 'Przejdź do mapy',
        skip_to_navigation: 'Przejdź do nawigacji',
        skip_to_form: 'Zgłoś bezpośrednio',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'Wstecz',
        not_classified: 'Niesklasyfikowane',
        no_value: 'Brak wartości',
        close: 'Zamknij',
        loading: 'Ładowanie...',
        error: 'Błąd',
        success: 'Sukces',
        submit: 'Wyślij',
        cancel: 'Anuluj',
        required: 'Wymagane',
        save: 'Zapisz',
        delete: 'Usuń',
        edit: 'Edytuj',
        clear: 'Wyczyść',
        search: 'Szukaj',
        select: 'Wybierz',
        on: 'Włączone',
        off: 'Wyłączone',
        toggle: 'Przełącz',
        yesterday: 'Wczoraj',
        did_you_know: 'Czy wiesz, że?',
        show_more: 'Pokaż więcej',
        show_less: 'Pokaż mniej',
        learn_more: 'Dowiedz się więcej',
        learn_more_about: 'Dowiedz się więcej o {topic}',
        opens_in_new_tab: '(otwiera się w nowej karcie)',
        title: {
            classic: 'Klasyczne zgłoszenie',
            photo: 'Zgłoszenie ze zdjęciem'
        },
        buttons: {
            toggle_theme: 'Zmień motyw',
            attribution: 'Informacje o mapie',
            close: 'Zamknij'
        },
        navigation: 'Panel nawigacji',
        drawer_description: 'Panel z treścią i opcjami',
        resize_drawer: 'Dostosuj panel',
        drawer_position_n_of_total: 'pozycja {idx} z {total}',
        current: 'Current',
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'Lokalizacja',
        field_gdpr: 'Zgoda na przetwarzanie danych',
        field_e_mail: 'Email',
        field_category: 'Kategoria',
        field_request_media: 'Zdjęcia',
        field_name: 'Nazwisko',
        field_prename: 'Imię',
        field_first_name: 'Imię',
        field_first_name_placeholder: 'Proszę podać imię',
        field_last_name: 'Nazwisko',
        field_last_name_placeholder: 'Proszę podać nazwisko',
        field_phone: 'Telefon',
        body: 'Opis',
        field_add_data: 'Udział w konkursie',
        field_terms_of_use: 'Akceptuję regulamin i politykę prywatności.',
        field_address: 'Adres',
        postal_code: 'Kod pocztowy',
        postal_code_placeholder: 'np. 00-001',
        city: 'Miasto',
        city_placeholder: 'np. Warszawa',
        street_address: 'Adres ulicy',
        street_address_placeholder: 'np. ul. Główna 123'
    },
    competition: {
        intro: 'Jeśli chcesz, weź udział w naszym corocznym losowaniu. Masz szansę wygrać atrakcyjne nagrody i nagrody pieniężne, które rozdzielamy między wszystkich uczestników jako mały podziękowanie.',
        disclaimer: 'Pracownicy odpowiedzialnych departamentów są wykluczeni z udziału.',
        title: 'Udział w konkursie',
        errors: {
            already_exists: 'Zgłoszenie konkursowe już istnieje',
            duplicate_found: 'Znaleziono duplikat',
            duplicate_detail: 'Zgłoszenie konkursowe dla tego raportu zostało już utworzone.',
            not_found: 'Nie znaleziono raportu',
            not_found_detail: 'Nie można znaleźć powiązanego raportu.',
            save_failed: 'Nie udało się zapisać zgłoszenia konkursowego',
            submission_error: 'Błąd wysyłania',
            submission_error_detail: 'Twoje zgłoszenie konkursowe nie mogło zostać zapisane, ale Twój raport został pomyślnie przesłany.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Zakładka informacji',
                panel_label: 'Panel informacji'
            },
            list: {
                label: 'Lista',
                aria_label: 'Zakładka listy zgłoszeń',
                panel_label: 'Panel listy zgłoszeń'
            },
            following: {
                label: 'Obserwowane',
                aria_label: 'Zakładka obserwowanych zgłoszeń',
                panel_label: 'Panel obserwowanych zgłoszeń'
            },
            stats: {
                label: 'Statystyki',
                aria_label: 'Zakładka statystyk',
                panel_label: 'Panel statystyk'
            }
        },
        main: 'Główna nawigacja',
        pages: 'Nawigacja stron',
        browse_reports: 'Przeglądaj zgłoszenia',
        back_to_form: 'Powrót do formularza',
        panel: {
            scrollable: 'Obszar przewijany'
        },
        updates_count: '{count} nowych aktualizacji'
    },
    report: {
        form_types: 'Typy zgłoszeń',
        how_to_help: 'Jak utworzyć zgłoszenie',
        title: {
            photo: 'Zgłoszenie ze zdjęciem',
            classic: 'Klasyczne zgłoszenie',
            submit: 'Wyślij zgłoszenie',
            edit: 'Edytuj zgłoszenie',
            view: 'Zobacz zgłoszenie'
        },
        photo: {
            description: 'Utwórz nowe zgłoszenie ze zdjęciem'
        },
        classic: {
            description: 'Utwórz nowe zgłoszenie bez zdjęcia'
        },
        status: {
            new: 'Nowe',
            open: 'Otwarte',
            in_progress: 'W trakcie',
            resolved: 'Rozwiązane',
            closed: 'Zamknięte',
            unknown: 'Nieznany status'
        },
        form: {
            tabs: {
                photo: 'Ze zdjęciem',
                classic: 'Klasyczne'
            },
            description: {
                label: 'Opis',
                placeholder: 'Proszę opisać problem...',
                ai_processing: 'AI generuje opis...',
                help: 'Podaj jak najwięcej szczegółów'
            },
            category: {
                label: 'Kategoria',
                placeholder: 'Wybierz kategorię',
                loading: 'Ładowanie kategorii...',
                error: 'Błąd ładowania kategorii',
                empty: 'Brak dostępnych kategorii',
                help: 'Wybór kategorii (wykonywany automatycznie)',
                description: 'Opis kategorii',
                description_loading: 'Ładowanie opisu...',
                description_error: 'Błąd ładowania opisu',
                disabled_notice: 'Ta kategoria jest tylko informacyjna. Zgłoszenia nie są możliwe.'
            },
            location: {
                label: 'Lokalizacja',
                placeholder: 'Szukaj lokalizacji...',
                selected: 'Lokalizacja wybrana',
                clear: 'Wyczyść lokalizację',
                error: 'Błąd pobierania lokalizacji',
                help: 'Wprowadź adres lub kliknij na mapę',
                help_modal: 'Wprowadź adres lub użyj swojej aktualnej lokalizacji',
                current: 'Użyj bieżącej lokalizacji',
                searching: 'Wyszukiwanie...',
                pick_on_map: 'Wybierz na mapie',
                auto_detected: 'Lokalizacja wykryta',
                complete_address: 'Pełny adres',
                from_photo_exif: 'Lokalizacja automatycznie wyodrębniona z metadanych zdjęcia',
                warning: 'Ostrzeżenie o lokalizacji',
                unknown_location: 'Nieznana lokalizacja',
                suggestions: 'Sugestie lokalizacji'
            },
            email: {
                label: 'Email do aktualizacji',
                placeholder: 'Wprowadź swój adres email',
                help: 'Wyślemy Ci aktualizacje dotyczące Twojego zgłoszenia',
                subscribe: 'Subskrybuj aktualizacje'
            },
            gdpr: {
                label: 'Zgoda na przetwarzanie danych',
                description: 'Wyrażam zgodę na przetwarzanie moich danych zgodnie z polityką prywatności.',
                required: 'Musisz wyrazić zgodę, aby kontynuować',
                link: 'Zobacz politykę prywatności'
            },
            media: {
                label: 'Zdjęcia',
                required: 'Zdjęcie jest wymagane dla tej kategorii',
                upload: {
                    overall_progress: 'Ogólny postęp',
                    button: 'Kliknij, aby przesłać',
                    or: ' lub',
                    drag: 'przeciągnij i upuść',
                    drop_here: 'Upuść pliki tutaj, aby przesłać',
                    restrictions: 'Do {count} obrazów ({size} maks., {types})',
                    restrictions_single: 'Jeden obraz ({size} maks., {types})',
                    progress: 'Postęp przesyłania',
                    started_sr: 'Przesyłanie rozpoczęte',
                    progress_sr: 'Przesyłanie ukończone w {progress}%',
                    success_sr: 'Przesyłanie zakończone pomyślnie',
                    error_sr: 'Przesyłanie nie powiodło się: {error}',
                    files_selected_sr: '{count} plik(ów) wybranych do przesłania',
                    area_label: 'Obszar przesyłania zdjęć - kliknij, aby wybrać pliki lub przeciągnij i upuść',
                    in_progress: 'Przesyłanie w toku',
                    complete_sr: 'Plik został pomyślnie przesłany.',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'Podgląd obrazu',
                remove: 'Usuń obraz',
                no_image_available: 'Brak obrazu lub nie wyświetlono z powodów prawnych',
                progress: 'Postęp przesyłania: {progress}%',
                limit_reached: 'Osiągnięto maksymalną liczbę {count} obrazów',
                privacy_notice: 'Prosimy nie umieszczać osób/tablic rejestracyjnych na zdjęciach',
                ai_analysis: 'Analiza przez Azure AI (Niemcy)',
                ai_analysis_tooltip: 'Przesyłając potwierdzasz, że zdjęcie zostało zrobione legalnie i nie narusza praw osób trzecich.\n\nJeśli osoby lub tablice rejestracyjne są rozpoznawalne, prosimy uczynić je nierozpoznawalnymi przed przesłaniem.\n\nAnaliza służy wyłącznie do kategoryzacji Twojego zgłoszenia. Tylko zredukowana kopia bez EXIF jest przesyłana do Azure OpenAI (Niemcy); oryginał nie jest wysyłany do usługi.',
                offline_cached: 'Saved offline',
                ai_analysis_help: 'Information about AI analysis'
            },
            submit: {
                button: 'Wyślij zgłoszenie',
                submitting: 'Wysyłanie...',
                processing: 'Przetwarzanie...',
                success: 'Zgłoszenie wysłane pomyślnie',
                error: 'Błąd wysyłania zgłoszenia',
                loading: 'Loading form...'
            },
            loading: 'Ładowanie formularza zgłoszenia...',
            draft_saved: 'Szkic zapisany',
            modal_description: 'Create a new report'
        },
        ai: {
            label: 'AI',
            powered: 'Wspomagane przez AI',
            analyzing: 'AI analizuje Twoje zdjęcia...',
            started_sr: 'Rozpoczęto analizę AI',
            complete_sr: 'Analiza AI zakończona pomyślnie',
            field_updated_sr: '{field} zostało zaktualizowane: {value}',
            analysis_complete_sr: 'Analiza AI zakończona.',
            category_result_sr: 'Wybrana kategoria: {category}.',
            description_result_sr: 'Wygenerowany opis: {description}',
            location_result_sr: 'Znaleziona lokalizacja: {location}.',
            category_hint: 'To zdjęcie nie wydaje się pasować do naszych kategorii zgłoszeń. Proszę wybrać kategorię samodzielnie.',
            processing: {
                analyzing: 'Pytanie AI...',
                location: 'Sprawdzanie metadanych obrazu...',
                location_found: 'Lokalizacja znaleziona:',
                location_ai: 'Szukanie lokalizacji w obrazie...',
                location_not_found: 'Lokalizacja nie znaleziona w metadanych obrazu.',
                location_complete: 'Lokalizacja zidentyfikowana',
                category: 'Identyfikacja kategorii...',
                category_found: 'Kategoria zidentyfikowana:',
                category_not_matched: 'Kategoria sugerowana przez AI (wymaga wyboru)',
                description: 'Generowanie opisu...',
                description_complete: 'Opis wygenerowany',
                attributes_filled: '{count} dodatkowe pole(a) wypełnione automatycznie',
                complete: 'Analiza AI zakończona',
                error: 'Błąd podczas analizy AI',
                privacy_warning: 'Wykryto problem z prywatnością'
            },
            privacy: {
                title: 'Informacja o prywatności',
                description: 'Na Twoim zdjęciu mogły zostać wykryte dane osobowe ({issues}). Zdjęcie zostanie sprawdzone przed publikacją.',
                required: 'Na tym zdjęciu wykryto treść krytyczną dla prywatności, dla której automatyczne zamazywanie nie jest dostępne. Zdjęcie nie może zostać użyte. Zastąp je lub usuń, aby kontynuować.',
                removePhoto: 'Usuń zdjęcie',
                replace: 'Zmień zdjęcie',
                understood: 'Kontynuuj z tym zdjęciem'
            },
            failed: {
                title: 'Analiza obrazu niedostępna',
                description: 'Twoje zdjęcie zostanie ręcznie sprawdzone przed publikacją. Możesz nadal wysłać swoje zgłoszenie.'
            },
            budget_exhausted_title: 'Analiza AI pominięta',
            budget_exhausted_submitted: 'Budżet analizy AI na ten miesiąc został wyczerpany. Twoje zgłoszenie zostało wysłane pomyślnie.'
        },
        buttons: {
            photo: 'Zgłoszenie ze zdjęciem',
            classic: 'Klasyczne zgłoszenie',
            follow: 'Obserwuj zgłoszenie',
            following: 'Obserwujesz',
            share: 'Udostępnij zgłoszenie',
            print: 'Drukuj',
            flag: 'Zgłoś',
            flag_submitted: 'Już zgłoszono',
            copy_link: 'Kopiuj link',
            link_copied: 'Link skopiowany do schowka',
            email: 'E-mail',
            directions: 'Pokaż trasę'
        },
        following: {
            count: 'Obserwujesz {count} zgłoszeń',
            mark_all_read: 'Oznacz wszystkie jako przeczytane',
            no_reports: 'Nie obserwujesz jeszcze żadnych zgłoszeń',
            no_address: 'Brak dostępnego adresu',
            status_updated: 'Status zaktualizowany',
            status_changed: 'Status zmieniony na:',
            awaiting_server: 'Oczekiwanie na aktualizację',
            escalated_to: 'Przekazano do {jurisdiction}',
            escalated_click: 'Stuknij, aby otworzyć w nowej jurysdykcji',
            unavailable: 'Ten raport jest obecnie niedostępny. Sprawdź swój e-mail lub skontaktuj się z nami.',
            date: {
                today: 'Dzisiaj',
                tomorrow: 'Jutro',
                yesterday: 'Wczoraj',
                unknown: 'Unknown date'
            }
        }
    },
    map: {
        tap_to_load: 'Dotknij, aby pokazać mapę',
        tap_to_select_location: 'Dotknij mapę, aby wybrać lokalizację',
        loading: 'Ładowanie mapy...',
        loading_address: 'Ładowanie adresu...',
        retry_attempt: 'Próba {count}',
        confirm_location: 'Potwierdź lokalizację',
        add_report_here: 'Dodaj zgłoszenie tutaj',
        controls: {
            zoom_in: 'Przybliż',
            zoom_out: 'Oddal',
            find_location: 'Znajdź moją lokalizację',
            toggle_heatmap: 'Przełącz mapę cieplną',
            toggle_language: 'Zmień język',
            add_report_here: 'Zgłoś tutaj',
            adjust_tilt: 'Dostosuj nachylenie',
            degrees: '{count} stopni',
            layers: 'Warstwy mapy',
            no_layers: 'Brak dostępnych warstw',
            geolocation: {
                label: 'Pobierz bieżącą lokalizację'
            },
            zoom: 'Zoom controls'
        },
        pick: {
            drag_hint: 'Przeciągnij znacznik, aby dostosować pozycję'
        },
        tooltip: {
            label: 'Informacje o znaczniku mapy',
            opens_form_above: 'Otwiera formularz powyżej',
            opens_modal: 'Otwiera w oknie dialogowym'
        },
        keyboard: {
            canvasInstructions: 'Interaktywna mapa ze znacznikami zgłoszeń. Klawisze strzałek nawigują między znacznikami, Shift+strzałka przesuwa mapę, Enter wybiera. Naciśnij Ctrl+= aby powiększyć, Ctrl+- aby pomniejszyć.',
            noFeatures: 'Brak widocznych znaczników w bieżącym widoku mapy. Spróbuj powiększyć lub przesunąć mapę.',
            zoomedIntoCluster: 'Powiększono obszar grupy. Użyj klawiszy strzałek do nawigacji między znacznikami.',
            clusterFocused: 'Grupa z {count} zgłoszeniami w fokusie. Naciśnij Enter aby rozwinąć. {position}',
            clusterExpanded: 'Grupa rozwinięta w {count} zgłoszeń. {featureLabel}',
            markerFocused: 'Zgłoszenie w fokusie: {name} przy {address}{context}. Naciśnij Enter aby otworzyć szczegóły. {position}',
            expandedContext: ' (rozwinięte z grupy)',
            untitledReport: 'Zgłoszenie bez tytułu',
            unknownLocation: 'lokalizacja',
            featurePosition: 'Element {current} z {total}.',
            pannedToExplore: 'Mapa przesunięta {direction}. Zwolnij Shift i użyj klawiszy strzałek do nawigacji.',
            pannedNoMarkers: 'Mapa przesunięta {direction}. Brak znaczników w tym kierunku. Użyj klawiszy strzałek aby kontynuować eksplorację.'
        }
    },
    detail: {
        location: 'Lokalizacja',
        photos: 'Zdjęcia',
        description: 'Opis',
        status_history: 'Historia statusu',
        updates: 'Aktualizacje',
        no_updates: 'Brak aktualizacji',
        edit: 'Edytuj',
        follow: {
            button: 'Obserwuj',
            following: 'Obserwujesz',
            stop: 'Przestań obserwować',
            success: 'Teraz obserwujesz to zgłoszenie',
            error: 'Błąd obserwowania zgłoszenia',
            updating: 'Aktualizowanie...'
        },
        unavailable: {
            title: 'Zgłoszenie niedostępne',
            message: 'To zgłoszenie nie istnieje lub nie zostało jeszcze opublikowane. Nowo przesłane zgłoszenia mogą przez chwilę nie być widoczne.'
        },
        dialog_description: 'View report details'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Rozkład',
        total_reports: 'Wszystkie zgłoszenia',
        status_distribution: 'Rozkład statusów',
        category_distribution: 'Rozkład kategorii',
        uncategorized: 'Bez kategorii',
        showing_reports: 'Pokazano {visible} z {total} zgłoszeń',
        no_reports: 'Brak dostępnych zgłoszeń',
        open_reports: 'Otwarte zgłoszenia',
        closed_reports: 'Zamknięte zgłoszenia',
        no_data_available: 'Brak dostępnych danych',
        expand: 'Pokaż szczegóły',
        collapse: 'Ukryj szczegóły',
        subcategory: 'podkategoria',
        subcategories: 'podkategorie'
    },
    time: {
        days_ago: '{count} dni temu',
        just_now: 'Przed chwilą',
        minutes_ago: '{count} minut temu',
        hours_ago: '{count} godzin temu',
        yesterday: 'Wczoraj',
        today: 'Dzisiaj'
    },
    list: {
        showing: 'Pokazano {visible} z {total} zgłoszeń',
        showing_in_area: '{visible} w tym obszarze, {total} łącznie',
        showing_area_only: '{visible} w tym obszarze',
        no_results: 'Nie znaleziono zgłoszeń',
        no_filtered_results: 'Żadne zgłoszenia nie pasują do kryteriów filtra',
        load_more: 'Wszystkie zgłoszenia załadowane',
        load_more_button: 'Załaduj więcej',
        newest_first: 'Najnowsze najpierw',
        oldest_first: 'Najstarsze najpierw',
        refresh: 'Odśwież',
        status_update: 'Status zaktualizowany',
        location: 'Lokalizacja',
        unpublished: 'Nieopublikowane',
        editable: 'Edytowalne'
    },
    errors: {
        general: 'Coś poszło nie tak',
        search_failed: 'Wyszukiwanie nie powiodło się. Spróbuj ponownie.',
        api: {
            rate_limit: 'Zbyt wiele żądań. Proszę poczekać chwilę i spróbować ponownie.',
            unauthorized: 'Brak autoryzacji. Proszę zalogować się ponownie.',
            forbidden: 'Dostęp zabroniony.',
            not_found: 'Nie znaleziono zasobu.',
            server_error: 'Błąd serwera. Spróbuj ponownie później.',
            default: 'Błąd API: {status}'
        },
        upload_failed: 'Przesyłanie nie powiodło się',
        location_error: 'Nie można określić lokalizacji',
        network_error: 'Błąd sieci',
        geolocation: {
            title: 'Błąd lokalizacji',
            permission_denied: 'Odmowa dostępu do lokalizacji. Proszę zezwolić na dostęp w ustawieniach przeglądarki.',
            unavailable: 'Informacje o lokalizacji są obecnie niedostępne.',
            timeout: 'Przekroczono czas oczekiwania na lokalizację.',
            unknown: 'Wystąpił nieznany błąd lokalizacji.'
        },
        try_again: 'Spróbuj ponownie',
        validation: {
            title: 'Przepraszamy, nie możemy przetworzyć tego żądania:',
            location_error_title: 'Błąd lokalizacji',
            invalid_input: 'Nieprawidłowe dane',
            duplicate_title: 'Znaleziono duplikat',
            duplicate_found: 'Znaleziono podobne zgłoszenie',
            duplicate_report: 'Podobne zgłoszenie zostało już utworzone (Nr {reportId})',
            location_out_of_bounds: 'Wybrana lokalizacja jest poza naszą jurysdykcją',
            required_field: '{field} jest wymagane',
            required_fields: 'Proszę wypełnić wszystkie wymagane pola',
            please_review: 'Proszę sprawdzić formularz i poprawić błędy przed wysłaniem.',
            file_size: 'Wybrany plik jest zbyt duży (maks. 10 MB)',
            file_type: 'Format nie jest obsługiwany (dozwolone: jpg, png, webp)',
            media_upload: 'Błąd przesyłania obrazu',
            invalid_format: 'Nieprawidłowy format dla {field}',
            photo_required: 'Zdjęcie jest wymagane dla tej kategorii',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway',
            consent_required: 'Please accept the privacy policy'
        },
        rate_limit: {
            title: 'Przekroczono limit żądań',
            general: 'Spróbuj ponownie później.',
            with_time: 'Spróbuj ponownie za {seconds} sekund.'
        },
        network: 'Problem z połączeniem. Sprawdź swoje połączenie internetowe',
        timeout: 'Przekroczono limit czasu. Spróbuj ponownie',
        upload: {
            invalid_type: 'Nieprawidłowy typ pliku. Proszę przesyłać tylko obrazy.',
            file_too_large: 'Plik zbyt duży. Maksymalny rozmiar to {size}.',
            dimensions_too_large: 'Wymiary obrazu zbyt duże. Maksymalnie {width}x{height} pikseli.',
            invalid_image: 'Nieprawidłowy lub uszkodzony plik obrazu.',
            failed: 'Przesyłanie nie powiodło się. Spróbuj ponownie.',
            limit_reached: 'Osiągnięto maksymalną liczbę {count} plików.',
            remove_to_add: 'Usuń zdjęcie, aby dodać nowe',
            single_file_limit: 'Można przesłać tylko jeden obraz.',
            exact_file_limit: 'Można przesłać maksymalnie {count} obrazów.',
            title: 'Upload Error',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'Błąd wysyłania lub przesyłania obrazu.',
        unknown: 'Wystąpił nieznany błąd.',
        pending_uploads: 'Proszę poczekać, aż wszystkie przesyłania zostaną zakończone.',
        incomplete_form: 'Proszę wypełnić wszystkie wymagane pola.',
        page: {
            title: 'Błąd',
            not_found_title: 'Nie znaleziono strony',
            not_found_message: 'Przepraszamy, strona której szukasz nie istnieje.',
            server_error_title: 'Błąd serwera',
            server_error_message: 'Przepraszamy, coś poszło nie tak na naszym serwerze.',
            generic_title: 'Wystąpił błąd',
            generic_message: 'Wystąpił nieoczekiwany błąd.',
            action_home: 'Powrót do strony głównej',
            action_back: 'Wróć',
            action_retry: 'Spróbuj ponownie',
            details: 'Szczegóły błędu'
        }
    },
    success: {
        report_submitted: 'Zgłoszenie wysłane',
        report_submitted_description: 'Twoje zgłoszenie zostało pomyślnie wysłane i wkrótce zostanie sprawdzone.',
        moderation_notice: 'Twoje zgłoszenie zostanie sprawdzone przed publikacją. Twój numer referencyjny:',
        submit_another: 'Wyślij kolejne zgłoszenie',
        auto_followed: 'To zgłoszenie zostało automatycznie dodane do Twoich obserwowanych zgłoszeń',
        visibility_limitation_notice: 'Pamiętaj, że nie wszystkie zgłoszenia stają się publicznie widoczne na stronie. Jeśli Twoje zgłoszenie nie aktualizuje się na liście obserwowanych, może i tak zostało przetworzone przez miasto. Sprawdź swój email, aby otrzymać aktualizacje statusu.',
        fun_facts: [
            'Każde zgłoszenie, które wysyłasz, pomaga uczynić Twoje miasto lepszym miejscem do życia!',
            'Zgłoszenia obywateli pomogły naprawić ponad 10 000 problemów w miastach na całym świecie.',
            'Średnie zgłoszenie jest sprawdzane w ciągu 24 godzin.',
            'Jesteś częścią społeczności, która dba o przestrzenie publiczne!',
            'Dane ze zgłoszeń obywateli pomagają planistom miejskim podejmować lepsze decyzje.',
            'Obserwowanie zgłoszeń automatycznie informuje Cię o postępach.',
            'Zgłoszenia ze zdjęciami są przetwarzane 3x szybciej niż same tekstowe.',
            'Platformy zaangażowania obywatelskiego jak ta istnieją w ponad 50 krajach.',
            'Twoja opinia pomaga ustalić priorytety napraw.',
            'Cyfrowe zgłaszanie skróciło czas reakcji nawet o 60%.',
            'Aktywni obywatele tworzą silniejsze, bardziej odporne społeczności.',
            'Analiza AI pomaga dokładniej kategoryzować Twoje zgłoszenia.',
            'Zgłaszanie mobilne ułatwia raportowanie problemów, gdy je widzisz.',
            'Dziękujemy za bycie zaangażowanym obywatelem!'
        ]
    },
    flag: {
        title: 'Zgłoś to zgłoszenie',
        description: 'Pomóż nam utrzymać jakość, zgłaszając nieodpowiednie treści.',
        reason_label: 'Dlaczego zgłaszasz to zgłoszenie?',
        reason_spam: 'Spam lub reklama',
        reason_offensive: 'Obraźliwe lub nieodpowiednie treści',
        reason_personal: 'Zawiera dane osobowe',
        reason_location: 'Błędna lokalizacja',
        reason_other: 'Inne',
        details_label: 'Dodatkowe szczegóły',
        details_placeholder: 'Opisz problem...',
        details_required: 'Podaj szczegóły',
        submit: 'Wyślij',
        success: 'Dziękujemy. Sprawdzimy to zgłoszenie.',
        error: 'Nie udało się wysłać. Spróbuj ponownie.',
        already_flagged: 'Już zgłosiłeś to zgłoszenie.'
    },

    pwa: {
        install: {
            title: 'Zainstaluj aplikację',
            button: 'Zainstaluj',
            not_now: 'Nie teraz',
            description: 'Kliknij ikonę instalacji w pasku adresu przeglądarki, aby zainstalować tę aplikację.',
            share_button: 'Ikona udostępniania',
            open_safari: 'Przeglądarka Safari',
            ios: {
                title: 'Dodaj do ekranu głównego',
                safari_instructions: 'Dotknij {icon} i wybierz "Dodaj do ekranu głównego".',
                other_instructions: 'Proszę otworzyć tę stronę w {browser}, aby zainstalować.'
            },
            chrome: {
                instructions: 'Kliknij ikonę instalacji {icon} na pasku narzędzi, aby zainstalować tę aplikację.'
            },
            edge: {
                instructions: 'Kliknij ikonę instalacji {icon} w pasku adresu.'
            },
            firefox: {
                instructions: 'Kliknij ikonę domu {icon} w pasku adresu.'
            }
        }
    },
    boundaries: {
        loading: 'Ładowanie danych granic...',
        error: 'Nie można zweryfikować granic lokalizacji. Spróbuj ponownie później.',
        notLoaded: 'Granice jeszcze nie załadowane',
        outsideNonStrict: 'Uwaga: Wybrana lokalizacja jest poza granicami {locationName}.',
        outsideStrict: 'Wybrana lokalizacja jest poza granicami {locationName}. Proszę wybrać lokalizację w granicach miasta.',
        validationUnavailable: 'Weryfikacja granic niedostępna. Twoje zgłoszenie zostanie przyjęte, ale może być sprawdzone.'
    },
    filters: {
        title: 'Filtry',
        status: {
            title: 'Status'
        },
        time: {
            title: 'Czas',
            today: 'Dzisiaj',
            week: 'Ten tydzień',
            month: 'Ten miesiąc'
        },
        category: {
            title: 'Kategoria',
            other: 'Inne'
        },
        actions: {
            more: 'Więcej filtrów',
            expand: 'Więcej filtrów',
            collapse: 'Mniej',
            clear_all: 'Wyczyść wszystko',
            active_count: '{count} aktywnych filtrów',
            toggle: 'Filtry'
        }
    },
    privacy: {
        notice_text: 'Informacje o prywatności można znaleźć',
        notice_link_text: 'tutaj',
        modal: {
            title: 'Polityka prywatności',
            loading: 'Ładowanie informacji o prywatności...',
            retry: 'Spróbuj ponownie',
            noContent: 'Brak dostępnych informacji o prywatności.',
            lastUpdated: 'Ostatnia aktualizacja',
            close: 'Zamknij'
        }
    },
    search: {
        placeholder: 'Szukaj zgłoszeń...',
        no_results_local: 'Nie znaleziono wyników w bieżącym widoku',
        expand_to_server: 'Szukaj wszystkich zgłoszeń',
        expand_hint: 'Szukaj poza bieżącym widokiem',
        searching_server: 'Przeszukiwanie wszystkich zgłoszeń...'
    },
    info: {
        welcome: {
            heading: 'Witamy w {name}',
            headingGeneric: 'Witamy',
            body: 'Skorzystaj z tej mapy, aby zgłosić problem lub zapoznać się z istniejącymi zgłoszeniami w Twojej okolicy.'
        },
        shortcuts: {
            aria_label: 'Szybkie akcje',
            photo: {
                title: 'Zdjęcie',
                description: 'Zrób zdjęcie, AI zrobi resztę',
                aria_label: 'Utwórz zgłoszenie ze zdjęciem'
            },
            classic: {
                title: 'Klasyczne',
                description: 'Opisz i zlokalizuj problem',
                aria_label: 'Utwórz klasyczne zgłoszenie'
            },
            following: {
                title: 'Obserwuj',
                description: 'Bądź na bieżąco z postępami',
                aria_label: 'Otwórz obserwowane zgłoszenia'
            },
            list: {
                title: 'Eksploruj',
                description: 'Zobacz, co dzieje się w okolicy',
                aria_label: 'Eksploruj mapę i zobacz listę'
            }
        }
    },
    auth: {
        login: {
            title: 'Zaloguj się',
            subtitle: 'Wprowadź swój email, aby otrzymać kod weryfikacyjny',
            email_label: 'Adres email',
            email_hint: 'Wyślemy Ci 6-cyfrowy kod',
            email_placeholder: 'adres email',
            send_code: 'Wyślij kod weryfikacyjny',
            disabled: {
                title: 'Logowanie niedostępne',
                message: 'Logowanie bez hasła nie jest tu włączone. Skontaktuj się z administratorem, jeśli potrzebujesz dostępu.',
                back_button: 'Wróć do strony głównej'
            }
        },
        verify: {
            email_label: 'Adres email',
            code_label: 'Kod weryfikacyjny',
            code_hint: 'Wprowadź 6-cyfrowy kod z emaila',
            code_placeholder: '123456',
            verify_button: 'Zweryfikuj i zaloguj',
            back_button: 'Użyj innego emaila',
            request_new: 'Poproś o nowy kod',
            resend_code: 'Wyślij kod ponownie',
            expires_in: 'Kod wygasa za {time}',
            expired_title: 'Kod wygasł',
            expired_message: 'Twój kod weryfikacyjny wygasł. Poproś o nowy.'
        },
        code_sent: {
            title: 'Kod wysłany',
            message: 'Wysłaliśmy 6-cyfrowy kod weryfikacyjny na {email}'
        },
        error: {
            title: 'Błąd uwierzytelniania',
            request_failed: 'Nie udało się wysłać kodu weryfikacyjnego. Spróbuj ponownie.',
            verify_failed: 'Nieprawidłowy lub wygasły kod weryfikacyjny',
            sso_failed: 'Logowanie nie powiodło się. Spróbuj ponownie.',
            network: 'Błąd sieci. Sprawdź swoje połączenie.',
            logout_failed: 'Nie udało się wylogować. Spróbuj ponownie.'
        },
        sso: {
            completing: 'Kończenie logowania...',
            method_label: 'Logowanie jednokrotne',
            button_aria: 'Zaloguj przez {provider} za pomocą logowania jednokrotnego'
        },
        user: {
            logged_in_as: 'Zalogowany jako',
            logout: 'Wyloguj'
        },
        welcome: {
            greeting: 'Cześć, {name}',
            sign_in: 'Zaloguj się',
            sign_out: 'Wyloguj',
            user_avatar: 'User avatar'
        }
    },
    profile: {
        title: 'Profil',
        account: {
            title: 'Konto',
            roles: 'Role'
        },
        groups: {
            title: 'Grupy'
        },
        appearance: {
            title: 'Wygląd',
            color_mode: 'Tryb kolorów',
            light: 'Jasny',
            dark: 'Ciemny',
            system: 'Systemowy',
            theme_override: 'Własne kolory motywu',
            theme_override_description: 'Zastąp domyślny motyw jurysdykcji własnymi preferencjami kolorów',
            primary_color: 'Kolor główny',
            secondary_color: 'Kolor dodatkowy',
            neutral_color: 'Kolor neutralny',
            reset_theme: 'Przywróć domyślne'
        },
        language: {
            title: 'Język',
            select: 'Wybierz język',
            save_failed: 'Nie udało się zapisać preferencji językowej. Spróbuj ponownie.'
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
            title: 'Strona nie znaleziona',
            description: 'Szukana strona nie istnieje lub została przeniesiona.'
        },
        403: {
            title: 'Brak dostępu',
            description: 'Nie masz uprawnień do wyświetlenia tej strony.'
        },
        500: {
            title: 'Coś poszło nie tak',
            description: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.'
        },
        fallback: {
            title: 'Błąd',
            description: 'Wystąpił nieoczekiwany błąd.'
        },
        actions: {
            back: 'Wróć',
            home: 'Strona główna',
            retry: 'Spróbuj ponownie'
        }
    },
    legal: {
        impressum: {
            title: 'Nota prawna',
            heading: 'Nota prawna',
            responsible_heading: 'Odpowiedzialny za treść',
            responsible_text: '{name} jest odpowiedzialny za treść tej platformy.'
        },
        privacy: {
            title: 'Polityka prywatności',
            heading: 'Polityka prywatności',
            intro: 'Ochrona Twoich danych osobowych jest dla nas ważna. Przetwarzamy Twoje dane wyłącznie na podstawie przepisów prawnych (RODO).',
            controller_heading: 'Administrator danych',
            data_heading: 'Gromadzone dane',
            data_text: 'Podczas korzystania z tej platformy przetwarzane są następujące dane: dane lokalizacji zgłoszenia, tekst opisu, przesłane zdjęcia oraz techniczne dane dostępu (adres IP, typ przeglądarki, czas dostępu).',
            rights_heading: 'Twoje prawa',
            rights_text: 'Masz prawo do dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu.'
        },
        terms: {
            title: 'Warunki korzystania',
            heading: 'Warunki korzystania',
            intro: 'Korzystając z tej platformy, akceptujesz następujące warunki.',
            purpose_heading: 'Cel',
            purpose_text: 'Ta platforma służy do zgłaszania problemów w przestrzeni publicznej. Zgłoszenia są przekazywane do właściwego organu.',
            obligations_heading: 'Obowiązki użytkownika',
            obligations_text: 'Zobowiązujesz się do podawania wyłącznie prawdziwych informacji i nieprzesyłania nielegalnych treści. Przesłane zdjęcia nie mogą przedstawiać rozpoznawalnych osób bez ich zgody.',
            liability_heading: 'Odpowiedzialność',
            liability_text: '{name} nie ponosi odpowiedzialności za kompletność i dokładność podanych informacji.'
        },
        email_label: 'E-mail',
        contact_label: 'Kontakt',
        platform: {
            heading: 'Operator platformy',
            intro: 'Platforma jest technicznie obsługiwana przez:',
            description: 'Civic Patches GmbH zapewnia infrastrukturę techniczną dla platformy Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Niemcy',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operator tej mapy',
            not_configured: 'Operator tej mapy nie podał jeszcze swoich informacji prawnych. Operatorzy publicznie dostępnych usług online mogą być zobowiązani do udostępnienia impressum i polityki prywatności.'
        },
        footer: {
            impressum: 'Nota prawna',
            privacy: 'Prywatność',
            terms: 'Warunki korzystania'
        },
        not_configured: 'Dane operatora nie zostały jeszcze skonfigurowane.'
    },
    demo_mode: {
        banner: {
            title: 'Wersja demonstracyjna',
            message: 'Zgłoszenia wpisane tutaj nie są przekazywane do żadnego urzędu.',
            link_label: 'Odwiedź mark-a-spot.com',
            minimize_label: 'Zminimalizuj komunikat demo',
            expand_label: 'Rozwiń komunikat demo'
        },
        reset: {
            title: 'Baza danych demo',
            notice: 'System demo jest resetowany co godzinę.',
            countdown_label: 'Następny reset za',
            countdown_aria: 'Następny reset bazy danych demo za {time}'
        },
        modal: {
            title: 'Wysłanie demonstracyjne',
            body: 'To jest demo. Twoje zgłoszenie NIE zostanie przekazane do urzędu gminy. Kontynuować z wysłaniem demonstracyjnym?',
            confirm_label: 'Wyślij zgłoszenie demo',
            cancel_label: 'Anuluj'
        },
        lite: {
            title: 'Tylko demo',
            heading: 'Wersja demonstracyjna',
            body: 'To jest demonstracja Mark-a-Spot. Wysyłanie przez formularz uproszczony jest tutaj wyłączone, aby prawdziwe zgłoszenia nigdy przypadkowo nie trafiły do urzędu gminy.',
            link_label: 'Odwiedź mark-a-spot.com'
        }
    },
    print: {
        title: 'Raport zgłoszenia serwisowego',
        description: 'Opis',
        location: 'Lokalizacja',
        media: 'Załączniki',
        image_unavailable: 'Image unavailable',
        attributes: 'Dodatkowe pola',
        status_history: 'Historia statusów',
        internal_fields: 'Informacje wewnętrzne',
        organisation: 'Dział',
        hazard_level: 'Poziom zagrożenia',
        hazard_category: 'Kategoria zagrożenia',
        sentiment: 'Nastrój',
        printed_at: 'Wydrukowano',
        showing_recent: 'Wyświetlanie {count} z {total} aktualizacji'
    }
};
