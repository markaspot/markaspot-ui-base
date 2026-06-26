// locales/hu.ts
export default {
    locale: {
        code: 'hu-HU'
    },
    meta: {
        description: 'Mark-a-Spot'
    },
    // CAP (Common Alerting Protocol) veszélyszintek és kategóriák
    hazard: {
        levels: {
            unknown: 'Ismeretlen',
            minor: 'Enyhe',
            moderate: 'Mérsékelt',
            severe: 'Súlyos',
            extreme: 'Rendkívüli'
        },
        categories: {
            Infra: 'Infrastruktúra',
            Transport: 'Közlekedés',
            Safety: 'Közbiztonság',
            Env: 'Környezet',
            Fire: 'Tűz',
            Health: 'Egészségügy',
            Geo: 'Geofizikai',
            Met: 'Meteorológiai',
            Other: 'Egyéb'
        }
    },
    // MI által érzékelt hangulat a bejelentések leírásából
    sentiment: {
        frustrated: 'Frusztrált',
        neutral: 'Semleges',
        positive: 'Pozitív'
    },
    nav: {
        map: 'Térkép',
        dashboard: 'Dashboard',
        back_to_frontend: 'Vissza a térképre'
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Üdvözöljük, {name}',
        nav: {
            dashboard: 'Dashboard',
            requests: 'Bejelentések',
            metrics: 'Statisztikák',
            settings: 'Beállítások',
            categories: 'Kategóriák',
            status: 'Állapot',
            jurisdictions: 'Területek',
            languages: 'Nyelvek',
            billing: 'Előfizetés'
        },
        help: {
            docs: 'Dokumentáció',
            support: 'Ügyfélszolgálat'
        },
        settings: {
            languages_title: 'Nyelvi beállítások',
            languages_description: 'Adja meg, mely nyelvek érhetők el, és melyik az alapértelmezett nyelv a munkaterület látogatói számára.',
            languages_available: 'Elérhető nyelvek',
            languages_default: 'Alapértelmezett nyelv',
            languages_saved: 'Nyelvi beállítások mentve.',
            languages_min_one: 'Legalább egy nyelvet ki kell választani.'
        },
        user: {
            profile: 'Profil',
            logout: 'Kijelentkezés'
        },
        jurisdiction: {
            current: 'Munkaterület',
            citizenView: 'Polgári nézet',
            switchTo: 'Váltás erre',
            blocked: 'letiltva',
            admin_section_header: 'Összes munkaterület (adminisztrátori hozzáférés)'
        },
        stats: {
            total: 'Összes bejelentés',
            pending: 'Függőben',
            in_progress: 'Folyamatban',
            resolved: 'Megoldva',
            my_groups: 'Saját csoportok',
            overall: 'Összesített'
        },
        recent_requests: 'Legutóbbi bejelentések',
        view_all: 'Az összes megtekintése',
        no_recent: 'Nincs legutóbbi bejelentés',
        wms: {
            title: 'Térképrétegek',
            attribution: 'Adatok: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'Azonosító',
                media: 'Média',
                category: 'Kategória',
                status: 'Állapot',
                created: 'Létrehozva'
            }
        }
    },
    form: {
        body: 'Leírás',
        body_description: 'Kérjük, adjon részletes leírást',
        body_placeholder: 'Írja be a leírást...',
        body_ai_description: 'Automatikusan generálva a fotóból. A szöveget szerkesztheti.',
        body_ai_placeholder: 'Szöveg generálása a fotóból...',

        category: 'Kategória',
        category_description: 'Válassza ki a bejelentéshez megfelelő kategóriát',
        category_placeholder: 'Kategória kiválasztása',
        category_disabled: {
            title: 'Kategória kiválasztva',
            description: 'A(z) „{category}" kategóriát választotta. Ez a kategória különleges feltételekkel rendelkezik, vagy nem teszi lehetővé a további szerkesztést.'
        },
        category_empty: 'Nincs elérhető kategória',
        category_loading: 'Kategóriák betöltése...',
        category_disabled_notice: 'Ez a kategória csak tájékoztató jellegű. Bejelentés nem küldhető be.',
        category_description_loading: 'Leírás betöltése...',
        category_description_error: 'Hiba a leírás betöltésekor',

        email: 'E-mail',
        email_description: 'Kapcsolatfelvételi e-mail cím',
        email_placeholder: 'Adja meg e-mail címét',

        first_name: 'Keresztnév',
        first_name_description: 'Keresztneve',
        first_name_placeholder: 'Adja meg keresztnevét',

        last_name: 'Vezetéknév',
        last_name_description: 'Vezetékneve',
        last_name_placeholder: 'Adja meg vezetéknevét',

        gdpr: 'Adatkezelési nyilatkozat',
        gdpr_description: 'Hozzájárulok az adataim kezeléséhez az adatvédelmi tájékoztatóban leírtak szerint.',

        object_id: 'Objektumazonosító',
        object_id_description: 'A bejelentett objektum azonosítója',
        object_id_placeholder: 'Adja meg az objektumazonosítót (pl. oszlopszám)',

        phone: 'Telefonszám',
        phone_description: 'Kapcsolatfelvételi telefonszáma',
        phone_placeholder: 'Adja meg telefonszámát',

        // Létesítményalapú bejelentések
        facility: 'Létesítmény',
        facility_plural: 'Létesítmények',
        facility_placeholder: '{label} kiválasztása',
        facility_required: '{label} megadása kötelező.',
        facility_unavailable: 'A kiválasztott létesítmény már nem elérhető, kérjük válasszon újra.',
        facility_nearest_snapped: 'Legközelebbi létesítmény: {label}',
        facility_no_nearby: 'Nincs közeli létesítmény, kérjük válasszon manuálisan.',
        facility_use_my_location: 'Saját helyzet használata',
        facility_locating: 'Helyzet meghatározása…',
        facility_no_match: 'Nincs a keresésnek megfelelő létesítmény.',
        facility_opens_in_new_tab: '(új lapon nyílik meg)',
        facility_deselected_map_pick: 'Saját helyszín használata {label} helyett',
        facility_tagged_with: 'Helyszín: {label}',

        imagelist: {
            empty: 'Ehhez a típushoz nem érhető el kép.'
        },

        back_to_report: 'Vissza a bejelentési űrlapra',

        requirements: {
            title: 'Még szükséges',
            ready_to_submit: 'Elküldhető',
            photo: 'Töltsön fel fotót',
            category: 'Válasszon kategóriát',
            location: 'Adja meg a helyszínt',
            description: 'Írjon leírást',
            email: 'Adja meg e-mail címét',
            privacy: 'Fogadja el az adatvédelmi nyilatkozatot',
            privacyBlock: 'Az adatvédelmi problémás fotó cseréje vagy törlése',
            conditional: 'kategóriától függően'
        }
    },
    validation: {
        body_required: 'A leírás megadása kötelező',
        category_required: 'A kategória megadása kötelező',
        email_required: 'Az e-mail cím megadása kötelező',
        email_format: 'Érvénytelen e-mail formátum',
        first_name_required: 'A keresztnév megadása kötelező',
        last_name_required: 'A vezetéknév megadása kötelező',
        gdpr_required: 'El kell fogadnia az adatkezelési feltételeket',
        object_id_required: 'Az objektumazonosító megadása kötelező',
        phone_required: 'A telefonszám megadása kötelező',
        required_field: 'A(z) {field} mező kitöltése kötelező'
    },
    feedback: {
        page_title: 'Visszajelzés a bejelentésről',
        error_title: 'Betöltési hiba',
        invalid_request: 'Érvénytelen vagy lejárt bejelentés',
        thank_you: 'Köszönjük visszajelzését!',
        submission_received: 'Visszajelzését sikeresen fogadtuk',
        loading: 'Bejelentés betöltése...',
        title: 'Visszajelzés: {service}',
        description: 'Kérjük, adja meg visszajelzését',
        placeholder: 'Írja ide visszajelzését...',
        reopen_request: 'Kérem a bejelentés újranyitását',
        submitting: 'Beküldés...',
        sending: 'Küldés...',
        submit: 'Visszajelzés beküldése',
        existing_title: 'A visszajelzése: {service}',
        already_submitted: 'Ehhez a bejelentéshez már adott visszajelzést',
        missing_uuid: 'Hiányzó bejelentésazonosító',
        success_notification: 'Visszajelzés sikeresen elküldve',
        success_with_id: 'Visszajelzés sikeresen elküldve a #{id} számú bejelentéshez',
        updated_successfully: 'Visszajelzés sikeresen frissítve',
        added_to_list: 'A bejelentés hozzáadva a listájához',
        submission_error: 'A visszajelzés beküldése sikertelen',
        server_error: 'Szerverhiba: a visszajelzés jelenleg nem feldolgozható',
        submission_failed: 'A visszajelzés beküldése sikertelen. Kérjük, próbálja újra később',
        already_exists: 'Ehhez a bejelentéshez már létezik visszajelzés',
        error_fetching_request: 'Hiba a bejelentés adatainak betöltésekor',
        no_content: 'Nincs visszajelzés tartalom',
        refresh_complete: 'Bejelentéslista frissítve',
        try_again: 'Próbálja újra',
        format_unrecognized: 'A bejelentés formátuma nem ismerhető fel',
        processing_error: 'Hiba a bejelentés adatainak feldolgozásakor',
        your_feedback: 'Az Ön visszajelzése',
        contact_preference: 'Kapcsolatfelvételi preferencia',
        no_contact: 'Nincs kapcsolatfelvétel',
        email_contact: 'E-mailes kapcsolatfelvétel',
        email_placeholder: 'E-mail cím',
        set_status_open: 'Állapot visszaállítása nyitottra',
        set_status_open_description: 'Ha szeretné, hogy újból foglalkozzunk a bejelentéssel, újra megnyithatja.',
        email_verification: 'E-mail ellenőrzés',
        email_verification_placeholder: 'Az eredeti bejelentéshez használt e-mail cím',
        email_verification_description: 'Adja meg azt az e-mail címet, amelyet az eredeti bejelentés készítésekor használt.',
        email_mismatch: 'A megadott e-mail cím nem egyezik az eredeti bejelentéssel.',
        unauthorized_access: 'Jogosulatlan hozzáférés. Kérjük, ellenőrizze e-mail címét.',
        not_eligible: 'Ez a bejelentés jelenleg nem jogosult visszajelzésre',
        dialog_description: 'Visszajelzési űrlap párbeszédablak',
        service_provider: {
            page_title: 'Szolgáltató visszajelzése',
            page_description: 'Befejezési megjegyzések beküldése a hozzárendelt bejelentésekhez',
            modal_title: 'Szolgáltató visszajelzése',
            dialog_description: 'Szolgáltatói visszajelzési űrlap párbeszédablak',
            title: 'Megbízás teljesítése',
            your_email: 'Az Ön e-mail címe',
            email_placeholder: 'szolgaltato{\'@\'}pelda.hu',
            email_verification_note: 'Adja meg a szolgáltatói e-mail címét az ellenőrzéshez',
            completion_notes: 'Befejezési megjegyzések',
            notes_placeholder: 'Írja le az elvégzett munkát...',
            mark_as_completed: 'Befejezettnek jelölés',
            mark_as_completed_description: 'A bejelentés állapotának befejezettré állítása',
            mark_completed_description: 'Erősítse meg, hogy a munka elkészült',
            submit_completion: 'Befejezés beküldése',
            complete_request: 'Megbízás lezárása',
            completing: 'Beküldés...',
            completion_success: 'A bejelentés befejezése sikeresen beküldve',
            submission_failed: 'A befejezés beküldése sikertelen. Kérjük, próbálja újra később',
            server_error: 'Szerverhiba: a befejezés jelenleg nem feldolgozható',
            completion_not_allowed: 'Ez a bejelentés jelenleg nem zárható le',
            email_verification_failed: 'E-mail ellenőrzés sikertelen. Kérjük, ellenőrizze e-mail címét',
            already_completed: 'Ez a bejelentés már be van fejezve',
            loading: 'Bejelentés betöltése...',
            try_again: 'Próbálja újra',
            invalid_uuid: 'Érvénytelen vagy lejárt bejelentés',
            load_error: 'Hiba a bejelentés adatainak betöltésekor',
            error_fetching_request: 'Hiba a bejelentés adatainak betöltésekor',
            completion_notes_required: 'Kérjük, adjon meg befejezési megjegyzést',
            existing_completions: 'Korábbi befejezések',
            reassignment_note: 'Ez a bejelentés újrarendelésre van jelölve, és több befejezést is fogadhat'
        }
    },
    service_provider: {
        page_title: 'Szolgáltató visszajelzése',
        page_description: 'Befejezési megjegyzések beküldése a hozzárendelt bejelentésekhez',
        modal_title: 'Szolgáltató visszajelzése',
        dialog_description: 'Szolgáltatói visszajelzési űrlap párbeszédablak',
        title: 'Megbízás teljesítése',
        your_email: 'Az Ön e-mail címe',
        email_placeholder: 'szolgaltato{\'@\'}pelda.hu',
        email_verification_note: 'Adja meg a szolgáltatói e-mail címét az ellenőrzéshez',
        completion_notes: 'Befejezési megjegyzések',
        notes_placeholder: 'Írja le az elvégzett munkát...',
        mark_as_completed: 'Befejezettnek jelölés',
        mark_as_completed_description: 'A bejelentés állapotának befejezettré állítása',
        submit_completion: 'Befejezés beküldése',
        complete_request: 'Megbízás lezárása',
        completing: 'Beküldés...',
        completion_success: 'A bejelentés befejezése sikeresen beküldve',
        submission_failed: 'A befejezés beküldése sikertelen. Kérjük, próbálja újra később',
        server_error: 'Szerverhiba: a befejezés jelenleg nem feldolgozható',
        completion_not_allowed: 'Ez a bejelentés jelenleg nem zárható le',
        email_verification_failed: 'E-mail ellenőrzés sikertelen. Kérjük, ellenőrizze e-mail címét',
        already_completed: 'Ez a bejelentés már be van fejezve',
        loading: 'Bejelentés betöltése...',
        try_again: 'Próbálja újra',
        invalid_uuid: 'Érvénytelen vagy lejárt bejelentés',
        load_error: 'Hiba a bejelentés adatainak betöltésekor',
        error_fetching_request: 'Hiba a bejelentés adatainak betöltésekor',
        completion_notes_required: 'Kérjük, adjon meg befejezési megjegyzést',
        existing_completions: 'Korábbi befejezések',
        reassignment_note: 'Ez a bejelentés újrarendelésre van jelölve, és több befejezést is fogadhat'
    },
    contact: {
        title: 'Kapcsolat',
        dialog_description: 'Kapcsolatfelvételi űrlap',
        name: 'Név',
        name_placeholder: 'Az Ön neve',
        email: 'E-mail',
        email_placeholder: 'Az Ön e-mail címe',
        message: 'Üzenet',
        message_placeholder: 'Az Ön üzenete...',
        copy_label: 'Másolat küldése az e-mail címemre',
        gdpr_label: 'Hozzájárulok az adataim kezeléséhez',
        gdpr_required: 'Kérjük, fogadja el az adatkezelési feltételeket',
        submit: 'Üzenet küldése',
        sending: 'Küldés...',
        success_title: 'Üzenet elküldve',
        success_message: 'Köszönjük üzenetét. Hamarosan felvesszük Önnel a kapcsolatot.',
        submission_failed: 'Az üzenet nem küldhető el. Kérjük, próbálja újra később.',
        flood_error: 'Túl sok kérés. Kérjük, próbálja újra később.',
        required_field: 'A(z) {field} mező kitöltése kötelező',
        invalid_email: 'Kérjük, adjon meg érvényes e-mail címet',
        close: 'Bezárás',
        new_message: 'Új üzenet'
    },
    service_unavailable: {
        title: 'A szolgáltatás átmenetileg nem elérhető',
        message: 'Jelenleg nem tudunk csatlakozni a szolgáltatásainkhoz. Ez valószínűleg átmeneti probléma.',
        retry: 'Technikai nehézségeket tapasztalunk. Kérjük, próbálja újra {seconds} másodperc múlva.',
        auto_retry: 'Újrapróbálkozás {seconds} másodperc múlva...',
        retry_now: 'Próbálja most',
        try_later: 'Kérjük, próbálja meg később.',
        reload: 'Újratöltés'
    },
    header: {
        logo_alt: 'Logó',
        app_name: 'Mark-a-Spot',
        app_claim: 'Az Ön bejelentése. A mi megoldásunk.'
    },
    hiddenSection: {
        description:
          'A hibabejelentő rendszerünk infrastrukturális problémák rögzítésére szolgál. Közvetlenül folytathatja a bejelentéssel, vagy a következő oldalakra navigálhat:',
        main_navigation:
          'Főnavigáció információkkal, bejelentések listájával és statisztikákkal',
        map:
          'Interaktív térkép vizuális jelölőkkel',
        map_navigation_hint:
          'A bejelentési jelölők között a ⬆️⬇️⬅️➡️ nyílbillentyűkkel navigálhat, ↩️ Enter-rel választhat, ❌ Escape-pel törölheti a kiválasztást',
        action_button:
          'Bejelentés indítása',
        keyboard_navigation_hint: 'Navigáljon a nyílbillentyűkkel, aktiváljon az Enter-rel',
        skip_to_main_content: 'Ugrás a főtartalomra'
    },
    accessibility: {
        skip_to_main: 'Ugrás a főtartalomra',
        skip_to_map: 'Ugrás a térképre',
        skip_to_navigation: 'Ugrás a navigációra',
        skip_to_form: 'Közvetlen bejelentés',
        leichte_sprache_indicator: 'Könnyített nyelv - Egyszerű szövegek mindenkinek'
    },
    common: {
        back: 'Vissza',
        not_classified: 'Nem osztályozott',
        no_value: 'Nincs érték',
        close: 'Bezárás',
        loading: 'Betöltés...',
        error: 'Hiba',
        success: 'Sikeres',
        submit: 'Beküldés',
        cancel: 'Mégse',
        required: 'Kötelező',
        save: 'Mentés',
        delete: 'Törlés',
        edit: 'Szerkesztés',
        clear: 'Törlés',
        search: 'Keresés',
        select: 'Kiválasztás',
        on: 'Be',
        off: 'Ki',
        toggle: 'Váltás',
        yesterday: 'Tegnap',
        did_you_know: 'Tudta?',
        show_more: 'Több megjelenítése',
        show_less: 'Kevesebb megjelenítése',
        learn_more: 'Tudjon meg többet',
        learn_more_about: 'Tudjon meg többet erről: {topic}',
        opens_in_new_tab: '(új lapon nyílik meg)',
        title: {
            classic: 'Klasszikus bejelentés',
            photo: 'Fotós bejelentés'
        },
        buttons: {
            toggle_theme: 'Téma váltása',
            attribution: 'Térkép forrása',
            close: 'Bezárás'
        },
        navigation: 'Navigációs panel',
        drawer_description: 'Tartalom és lehetőségek panel',
        resize_drawer: 'Panel átméretezése',
        drawer_position_n_of_total: '{idx}. pozíció / {total}',
        share: 'Megosztás',
        copy_coordinates: 'Koordináták másolása',
        open_in_maps: 'Megnyitás térképen',
        current: 'Jelenlegi'
    },
    fields: {
        field_geolocation: 'Helyszín',
        field_gdpr: 'Adatkezelési hozzájárulás',
        field_e_mail: 'E-mail',
        field_category: 'Kategória',
        field_request_media: 'Fotók',
        field_name: 'Vezetéknév',
        field_prename: 'Keresztnév',
        field_first_name: 'Keresztnév',
        field_first_name_placeholder: 'Adja meg keresztnevét',
        field_last_name: 'Vezetéknév',
        field_last_name_placeholder: 'Adja meg vezetéknevét',
        field_phone: 'Telefon',
        body: 'Leírás',
        field_add_data: 'Nyereményjáték részvétel',
        field_terms_of_use: 'Elfogadom a felhasználási feltételeket és az adatvédelmi nyilatkozatot.',
        field_address: 'Cím',
        postal_code: 'Irányítószám',
        postal_code_placeholder: 'pl. 1051',
        city: 'Város',
        city_placeholder: 'pl. Budapest',
        street_address: 'Utca, házszám',
        street_address_placeholder: 'pl. Fő utca 123'
    },
    competition: {
        intro: 'Ha szeretne, vegyen részt éves sorsolásunkon. Vonzó nyereményeket és készpénzjutalmat nyerhet, amelyet köszönetképpen az összes résztvevő között osztunk szét.',
        disclaimer: 'Az érintett osztályok munkatársai nem vehetnek részt.',
        title: 'Nyereményjáték részvétel',
        errors: {
            already_exists: 'A nyereményjáték-nevezés már létezik',
            duplicate_found: 'Ismétlődés találva',
            duplicate_detail: 'Ehhez a bejelentéshez már létezik nyereményjáték-nevezés.',
            not_found: 'Bejelentés nem található',
            not_found_detail: 'A kapcsolódó bejelentés nem található.',
            save_failed: 'A nyereményjáték-nevezés nem mentható',
            submission_error: 'Beküldési hiba',
            submission_error_detail: 'A nyereményjáték-nevezése nem menthető, de a bejelentése sikeresen beküldve.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Információ',
                aria_label: 'Információ lap',
                panel_label: 'Információ panel'
            },
            list: {
                label: 'Lista',
                aria_label: 'Bejelentések listája lap',
                panel_label: 'Bejelentések listája panel'
            },
            following: {
                label: 'Követett',
                aria_label: 'Követett bejelentések lap',
                panel_label: 'Követett bejelentések panel'
            },
            stats: {
                label: 'Statisztikák',
                aria_label: 'Statisztikák lap',
                panel_label: 'Statisztikák panel'
            }
        },
        main: 'Főnavigáció',
        pages: 'Oldalnavigáció',
        browse_reports: 'Bejelentések böngészése',
        back_to_form: 'Vissza az űrlapra',
        panel: {
            scrollable: 'Görgethető terület'
        },
        updates_count: '{count} új frissítés'
    },
    report: {
        form_types: 'Bejelentés típusok',
        how_to_help: 'Hogyan hozzunk létre bejelentést',
        title: {
            photo: 'Fotós bejelentés',
            classic: 'Klasszikus bejelentés',
            submit: 'Bejelentés küldése',
            edit: 'Bejelentés szerkesztése',
            view: 'Bejelentés megtekintése'
        },
        photo: {
            description: 'Új bejelentés létrehozása fotóval'
        },
        classic: {
            description: 'Új bejelentés létrehozása fotó nélkül'
        },
        status: {
            new: 'Új',
            open: 'Nyitott',
            in_progress: 'Folyamatban',
            resolved: 'Megoldva',
            closed: 'Lezárva',
            unknown: 'Ismeretlen állapot'
        },
        form: {
            modal_description: 'Új bejelentés létrehozása',
            tabs: {
                photo: 'Fotóval',
                classic: 'Klasszikus'
            },
            description: {
                label: 'Leírás',
                placeholder: 'Kérjük, írja le a problémát...',
                ai_processing: 'A MI leírást generál...',
                help: 'Adjon meg annyi részletet, amennyit csak tud'
            },
            category: {
                label: 'Kategória',
                placeholder: 'Válasszon kategóriát',
                loading: 'Kategóriák betöltése...',
                error: 'Hiba a kategóriák betöltésekor',
                empty: 'Nincs elérhető kategória',
                help: 'Kategória kiválasztása (automatikusan megtörténik)',
                description: 'Kategória leírása',
                description_loading: 'Leírás betöltése...',
                description_error: 'Hiba a leírás betöltésekor',
                disabled_notice: 'Ez a kategória csak tájékoztató jellegű. Bejelentés nem küldhető be.'
            },
            location: {
                label: 'Helyszín',
                placeholder: 'Helyszín keresése...',
                selected: 'Helyszín kiválasztva',
                clear: 'Helyszín törlése',
                error: 'Hiba a helyszín meghatározásakor',
                help: 'Adja meg a címet, vagy kattintson a térképre',
                help_modal: 'Adja meg a címet, vagy használja jelenlegi tartózkodási helyét',
                current: 'Jelenlegi helyszín használata',
                searching: 'Keresés...',
                pick_on_map: 'Kiválasztás a térképen',
                auto_detected: 'Helyszín azonosítva',
                complete_address: 'Teljes cím',
                from_photo_exif: 'Helyszín automatikusan kinyerve a fotó metaadataiból',
                warning: 'Helyszín figyelmeztetés',
                unknown_location: 'Ismeretlen helyszín',
                suggestions: 'Helyszín javaslatok'
            },
            email: {
                label: 'E-mail a frissítésekhez',
                placeholder: 'Adja meg e-mail címét',
                help: 'Értesítjük a bejelentésével kapcsolatos változásokról',
                subscribe: 'Feliratkozás a frissítésekre'
            },
            gdpr: {
                label: 'Adatkezelési hozzájárulás',
                description:
          'Hozzájárulok az adataim kezeléséhez az adatvédelmi tájékoztató szerint.',
                required: 'A folytatáshoz el kell fogadnia',
                link: 'Adatvédelmi tájékoztató megtekintése'
            },
            media: {
                label: 'Fotók',
                required: 'Ehhez a kategóriához fotó szükséges',
                upload: {
                    overall_progress: 'Teljes folyamat',
                    button: 'Kattintson a feltöltéshez',
                    or: ' vagy',
                    drag: 'húzza ide a fájlokat',
                    drop_here: 'Húzza ide a fájlokat a feltöltéshez',
                    restrictions: 'Legfeljebb {count} kép ({size} max., {types})',
                    restrictions_single: 'Egy kép ({size} max., {types})',
                    progress: 'Feltöltési folyamat',
                    started_sr: 'Feltöltés elindítva',
                    progress_sr: 'Feltöltés {progress}% kész',
                    success_sr: 'Feltöltés sikeresen befejezve',
                    error_sr: 'Feltöltési hiba: {error}',
                    files_selected_sr: '{count} fájl kiválasztva feltöltéshez',
                    description: 'Töltse fel a képeket kattintással, érintéssel vagy húzással. Támogatott formátumok: JPEG, PNG, GIF.',
                    area_label: 'Fotó feltöltési terület - kattintson a fájlok kiválasztásához vagy húzza ide',
                    in_progress: 'Feltöltés folyamatban',
                    complete_sr: 'A fájl sikeresen feltöltve.'
                },
                preview: 'Kép előnézete',
                remove: 'Kép eltávolítása',
                no_image_available: 'Nem érhető el kép, vagy jogi okokból nem megjeleníthető',
                progress: 'Feltöltési folyamat: {progress}%',
                limit_reached: 'Elérte a maximálisan feltölthető {count} kép számát',
                privacy_notice: 'Kérjük, ne töltsön fel személyeket vagy rendszámtáblákat tartalmazó képeket',
                offline_cached: 'Offline mentve',
                ai_analysis: 'Elemzés Azure MI segítségével (Németország)',
                ai_analysis_help: 'Információ a MI-elemzésről',
                ai_analysis_tooltip: 'A feltöltéssel megerősíti, hogy a fotót jogszerűen készítette, és az nem sérti harmadik felek jogait.\n\nHa személyek vagy rendszámtáblák láthatók, kérjük, tegye felismerhetetlenné azokat a feltöltés előtt.\n\nAz elemzés kizárólag a bejelentés kategorizálására szolgál. Csak egy EXIF-adatok nélküli, csökkentett méretű másolat kerül az Azure OpenAI-hoz (Németország); az eredeti nem kerül elküldésre.'
            },
            submit: {
                button: 'Bejelentés elküldése',
                submitting: 'Beküldés...',
                processing: 'Feldolgozás...',
                success: 'Bejelentés sikeresen elküldve',
                error: 'Hiba a bejelentés elküldésekor',
                loading: 'Űrlap betöltése...'
            },
            loading: 'Bejelentési űrlap betöltése...',
            draft_saved: 'Vázlat mentve'
        },
        ai: {
            label: 'MI',
            powered: 'MI-alapú',
            analyzing: 'A MI elemzi a fotóit...',
            started_sr: 'MI-elemzés elindítva',
            complete_sr: 'MI-elemzés sikeresen befejezve',
            field_updated_sr: 'A(z) {field} mező frissítve: {value}',
            analysis_complete_sr: 'MI-elemzés kész.',
            category_result_sr: 'Kiválasztott kategória: {category}.',
            description_result_sr: 'Generált leírás: {description}',
            location_result_sr: 'Helyszín megtalálva: {location}.',
            category_hint: 'Úgy tűnik, ez a kép nem illik a jelentési kategóriáinkhoz. Kérjük, válasszon kategóriát maga.',
            processing: {
                analyzing: 'MI megkérdezése...',
                location: 'Kép metaadatok ellenőrzése...',
                location_found: 'Helyszín megtalálva:',
                location_ai: 'Helyszín keresése a képen...',
                location_not_found: 'Helyszín nem található a kép metaadataiban.',
                location_complete: 'Helyszín azonosítva',
                category: 'Kategória azonosítása...',
                category_found: 'Kategória azonosítva:',
                category_not_matched: 'MI által javasolt kategória (kiválasztás szükséges)',
                description: 'Leírás generálása...',
                description_complete: 'Leírás generálva',
                attributes_filled: '{count} további mező előre kitöltve',
                complete: 'MI-elemzés kész',
                error: 'Hiba a MI-elemzés során',
                privacy_warning: 'Adatvédelmi aggály észlelve'
            },
            privacy: {
                title: 'Adatvédelmi értesítés',
                description: 'Személyes adatok észlelhetők a fotón ({issues}). A fotó közzététel előtt felülvizsgálatra kerül.',
                required: 'Ezen a fotón adatvédelmi szempontból kritikus tartalom észlelhető, amelyhez nem érhető el automatikus eltakarás. A fotó nem használható. Cserélje le vagy törölje a folytatáshoz.',
                removePhoto: 'Fotó törlése',
                replace: 'Fotó cseréje',
                understood: 'Folytatás ezzel a fotóval'
            },
            failed: {
                title: 'A képelemzés nem érhető el',
                description: 'A fotója közzététel előtt manuálisan felülvizsgálásra kerül. A bejelentése ezzel együtt beküldhető.'
            },
            budget_exhausted_title: 'MI-elemzés kihagyva',
            budget_exhausted_submitted: 'Elérte a havi MI-elemzési keretet. A bejelentése sikeresen beküldve.'
        },
        buttons: {
            photo: 'Fotós bejelentés',
            classic: 'Klasszikus bejelentés',
            follow: 'Bejelentés követése',
            following: 'Követett',
            share: 'Bejelentés megosztása',
            print: 'Nyomtatás',
            flag: 'Jelölés',
            flag_submitted: 'Már jelölve',
            copy_link: 'Link másolása',
            link_copied: 'Link vágólapra másolva',
            email: 'E-mail',
            directions: 'Útvonaltervezés'
        },
        following: {
            count: '{count} bejelentés követve',
            mark_all_read: 'Összes megjelölése olvasottként',
            no_reports: 'Még nincs követett bejelentés',
            no_address: 'Nincs elérhető cím',
            status_updated: 'Állapot frissítve',
            status_changed: 'Az állapot megváltozott:',
            awaiting_server: 'Frissítésre várva',
            escalated_to: 'Átadva: {jurisdiction}',
            escalated_click: 'Koppintson az új területen való megnyitáshoz',
            unavailable: 'Ez a bejelentés jelenleg nem elérhető. Kérjük, ellenőrizze e-mailjét a részletekért, vagy vegye fel velünk a kapcsolatot.',
            date: {
                today: 'Ma',
                tomorrow: 'Holnap',
                yesterday: 'Tegnap',
                unknown: 'Ismeretlen dátum'
            }
        }
    },
    map: {
        tap_to_load: 'Koppintson a térkép megjelenítéséhez',
        tap_to_select_location: 'Koppintson a térképre a helyszín kiválasztásához',
        loading: 'Térkép betöltése...',
        loading_address: 'Cím betöltése...',
        retry_attempt: '{count}. kísérlet',
        confirm_location: 'Helyszín megerősítése',
        add_report_here: 'Bejelentés hozzáadása itt',
        controls: {
            zoom: 'Nagyítás vezérlők',
            zoom_in: 'Nagyítás',
            zoom_out: 'Kicsinyítés',
            find_location: 'Saját helyszín megkeresése',
            toggle_heatmap: 'Hőtérkép váltása',
            toggle_language: 'Nyelv váltása',
            add_report_here: 'Bejelentés itt',
            adjust_tilt: 'Dőlés beállítása',
            degrees: '{count} fok',
            layers: 'Térképrétegek',
            no_layers: 'Nincs elérhető réteg',
            geolocation: {
                label: 'Jelenlegi helyszín lekérése'
            }
        },
        pick: {
            drag_hint: 'Húzza a jelölőt a pozíció módosításához'
        },
        tooltip: {
            label: 'Térképjelölő információ',
            opens_form_above: 'Megnyitja az űrlapot fent',
            opens_modal: 'Megnyitja párbeszédablakban'
        },
        keyboard: {
            canvasInstructions: 'Interaktív térkép bejelentés jelölőkkel. A nyílbillentyűk a jelölők között navigálnak, Shift+nyíl pásztázza a térképet, Enter kiválaszt. Ctrl+= a nagyításhoz, Ctrl+- a kicsinyítéshez.',
            noFeatures: 'Nincs látható jelölő a jelenlegi térképnézetben. Próbáljon ránagyítani vagy mozgatni a térképet.',
            zoomedIntoCluster: 'Ráközelítve a csoportterületre. A nyílbillentyűkkel navigáljon a jelölők között.',
            clusterFocused: '{count} bejelentést tartalmazó csoport fókuszban. Az Enter megnyomásával bontsa ki. {position}',
            clusterExpanded: 'A csoport kibontva: {count} bejelentés. {featureLabel}',
            markerFocused: 'Bejelentés fókuszban: {name} itt: {address}{context}. Az Enter megnyomásával nyissa meg a részleteket. {position}',
            expandedContext: ' (csoportból kibontva)',
            untitledReport: 'Névtelen bejelentés',
            unknownLocation: 'helyszín',
            featurePosition: '{current}. elem a {total}-ból.',
            pannedToExplore: 'Térkép eltolva {direction} irányba. Engedje fel a Shiftet és nyílbillentyűkkel navigáljon a jelölők között.',
            pannedNoMarkers: 'Térkép eltolva {direction} irányba. Nincs jelölő ebben az irányban. Folytassa a feltárást nyílbillentyűkkel.'
        }
    },
    detail: {
        dialog_description: 'Bejelentés részleteinek megtekintése',
        location: 'Helyszín',
        photos: 'Fotók',
        description: 'Leírás',
        status_history: 'Állapotelőzmény',
        updates: 'Frissítések',
        no_updates: 'Még nincsenek frissítések',
        edit: 'Szerkesztés',
        follow: {
            button: 'Követés',
            following: 'Követett',
            stop: 'Követés leállítása',
            success: 'Most már követi ezt a bejelentést',
            error: 'Hiba a bejelentés követésekor',
            updating: 'Frissítés...'
        },
        unavailable: {
            title: 'A bejelentés nem elérhető',
            message: 'Ez a bejelentés nem létezik, vagy még nem lett közzétéve. Az újonnan beküldött bejelentések megjelenéséhez némi időre lehet szükség.'
        }
    },
    pages: {
        dialog_description: 'Oldaltartalom megtekintése'
    },
    stats: {
        status_overview: 'Állapot',
        pie_chart: 'Eloszlás',
        total_reports: 'Összes bejelentés',
        status_distribution: 'Állapoteloszlás',
        category_distribution: 'Kategória-eloszlás',
        uncategorized: 'Kategorizálatlan',
        showing_reports: '{visible} bejelentés látható a(z) {total}-ból',
        no_reports: 'Nincsenek elérhető bejelentések',
        open_reports: 'Nyitott bejelentések',
        closed_reports: 'Lezárt bejelentések',
        no_data_available: 'Nincsenek elérhető adatok',
        expand: 'Részletek megjelenítése',
        collapse: 'Részletek elrejtése',
        subcategory: 'alkategória',
        subcategories: 'alkategóriák'
    },
    time: {
        days_ago: '{count} napja',
        just_now: 'Most',
        minutes_ago: '{count} perce',
        hours_ago: '{count} órája',
        yesterday: 'Tegnap',
        today: 'Ma'
    },
    list: {
        showing: '{visible} bejelentés látható a(z) {total}-ból',
        showing_in_area: '{visible} ebben a területben, összesen {total}',
        showing_area_only: '{visible} ebben a területben',
        no_results: 'Nem található bejelentés',
        no_filtered_results: 'Nincs a szűrési feltételeknek megfelelő bejelentés',
        load_more: 'Minden bejelentés betöltve',
        load_more_button: 'Több betöltése',
        newest_first: 'Legújabb először',
        oldest_first: 'Legrégebbi először',
        refresh: 'Frissítés',
        status_update: 'Állapot frissítve',
        location: 'Helyszín',
        unpublished: 'Nem publikált',
        editable: 'Szerkeszthető'
    },
    error: {
        form_error_fallback: 'Hiba történt az űrlap betöltésekor. Kérjük, próbálja újra.',
        404: {
            title: 'Az oldal nem található',
            description: 'A keresett oldal nem létezik, vagy áthelyezték.'
        },
        403: {
            title: 'Hozzáférés megtagadva',
            description: 'Nincs jogosultsága az oldal megtekintéséhez.'
        },
        500: {
            title: 'Valami elromlott',
            description: 'Váratlan hiba történt. Kérjük, próbálja újra.'
        },
        fallback: {
            title: 'Hiba',
            description: 'Váratlan hiba történt.'
        },
        actions: {
            back: 'Vissza',
            home: 'Vissza a főoldalra',
            retry: 'Újrapróbálás'
        }
    },
    errors: {
        general: 'Valami elromlott',
        search_failed: 'A keresés sikertelen volt. Kérjük, próbálja újra.',
        api: {
            rate_limit: 'Túl sok kérés. Kérjük, várjon egy pillanatot, majd próbálja újra.',
            unauthorized: 'Nincs jogosultság. Kérjük, jelentkezzen be újra.',
            forbidden: 'Hozzáférés megtagadva.',
            not_found: 'Az erőforrás nem található.',
            server_error: 'Szerverhiba. Kérjük, próbálja újra később.',
            default: 'API hiba: {status}'
        },
        upload_failed: 'Feltöltés sikertelen',
        location_error: 'A helyszín nem állapítható meg',
        network_error: 'Hálózati hiba',
        geolocation: {
            title: 'Helyszín hiba',
            permission_denied: 'A helyszín-hozzáférés megtagadva. Kérjük, engedélyezze azt a böngésző beállításaiban.',
            unavailable: 'A helyszín-információ jelenleg nem elérhető.',
            timeout: 'A helyszín-lekérés időtúllépés miatt sikertelen.',
            unknown: 'Ismeretlen helyszínhiba történt.'
        },
        try_again: 'Kérjük, próbálja újra',
        validation: {
            title: 'Sajnáljuk, ezt a kérést nem tudjuk feldolgozni:',
            location_error_title: 'Helyszín hiba',
            invalid_input: 'Érvénytelen bevitel',
            duplicate_title: 'Ismétlődés találva',
            duplicate_found: 'Hasonló bejelentés találva',
            duplicate_report: 'Hasonló bejelentés már létezik ({reportId}. sz.)',
            duplicate_hint_title: 'Lehetséges ismétlődés találva',
            duplicate_hint_message: 'Ezen a területen már létezhet hasonló bejelentés. Amennyiben úgy gondolja, hogy ez egy új probléma, az igény esetén mégis beküldheti.',
            duplicate_existing_report: 'Meglévő bejelentés: {reportId}. sz.',
            view_existing_report: 'Meglévő bejelentés megtekintése',
            submit_anyway: 'Beküldés ennek ellenére',
            location_out_of_bounds: 'A kiválasztott helyszín kívül esik a hatáskörünkön',
            required_field: 'A(z) {field} mező kitöltése kötelező',
            required_fields: 'Kérjük, töltse ki az összes kötelező mezőt',
            please_review: 'Kérjük, tekintse át az űrlapot, és javítsa a hibákat a beküldés előtt.',
            file_size: 'A kiválasztott fájl túl nagy (max. 10 MB)',
            file_type: 'A formátum nem támogatott (engedélyezett: jpg, png, webp)',
            media_upload: 'Hiba a kép feltöltésekor',
            invalid_format: 'Érvénytelen formátum a(z) {field} mezőnél',
            photo_required: 'Ehhez a kategóriához fotó szükséges',
            consent_required: 'Kérjük, fogadja el az adatvédelmi nyilatkozatot'
        },
        rate_limit: {
            title: 'Sebességkorlátozás elérve',
            general: 'Kérjük, próbálja újra később.',
            with_time: 'Kérjük, próbálja újra {seconds} másodperc múlva.'
        },
        network: 'Kapcsolódási probléma. Kérjük, ellenőrizze internetkapcsolatát',
        timeout: 'Időtúllépés. Kérjük, próbálja újra',
        upload: {
            title: 'Feltöltési hiba',
            invalid_type: 'Érvénytelen fájltípus. Kérjük, csak képeket töltsön fel.',
            file_too_large: 'A fájl túl nagy. A maximális méret {size}.',
            file_too_large_raw: 'A fájl túl nagy ({size} a maximum). Kérjük, válasszon kisebb képet.',
            optimization_failed: 'A kép nem tömöríthető. Maximum méret tömörítés után: {size}.',
            dimensions_too_large: 'A kép mérete túl nagy. Maximum {width}x{height} pixel.',
            invalid_image: 'Érvénytelen vagy sérült képfájl.',
            failed: 'A feltöltés sikertelen. Kérjük, próbálja újra.',
            limit_reached: 'Elérte a maximálisan feltölthető {count} fájl számát.',
            remove_to_add: 'Távolítson el egy fotót, hogy újat adhasson hozzá',
            single_file_limit: 'Csak egy kép tölthető fel.',
            exact_file_limit: 'Legfeljebb {count} kép tölthető fel.'
        },
        submission_error: 'Hiba a bejelentés elküldésekor vagy a kép feltöltésekor.',
        unknown: 'Ismeretlen hiba történt.',
        pending_uploads: 'Kérjük, várjon, amíg az összes feltöltés befejeződik.',
        incomplete_form: 'Kérjük, töltse ki az összes kötelező mezőt.',
        page: {
            title: 'Hiba',
            not_found_title: 'Az oldal nem található',
            not_found_message: 'Sajnáljuk, a keresett oldal nem létezik.',
            server_error_title: 'Szerverhiba',
            server_error_message: 'Sajnáljuk, valami hiba történt a szerverünkön.',
            generic_title: 'Hiba történt',
            generic_message: 'Váratlan hiba lépett fel.',
            action_home: 'Vissza a főoldalra',
            action_back: 'Vissza',
            action_retry: 'Újrapróbálás',
            details: 'Hiba részletei'
        }
    },
    success: {
        report_submitted: 'Bejelentés elküldve',
        report_submitted_description: 'A bejelentése sikeresen beküldve, és hamarosan felülvizsgálatra kerül.',
        moderation_notice:
      'A bejelentése közzététel előtt felülvizsgálatra kerül. Az Ön hivatkozási száma:',
        submit_another: 'Újabb bejelentés küldése',
        auto_followed: 'Ez a bejelentés automatikusan hozzáadva a követett bejelentéseihez',
        visibility_limitation_notice: 'Kérjük, vegye figyelembe, hogy nem minden bejelentés válik nyilvánosan láthatóvá a weboldalon. Ha a bejelentése nem frissül a követett bejelentések listájában, az a város által mégis feldolgozásra kerülhetett. Az állapotfrissítésekért ellenőrizze e-mailjét.',
        fun_facts: [
            'Minden bejelentésével hozzájárul ahhoz, hogy a városa jobb hely legyen!',
            'A polgári bejelentések világszerte több mint 10 000 probléma megoldásához járultak hozzá.',
            'Egy átlagos bejelentés 24 órán belül felülvizsgálásra kerül.',
            'Ön egy olyan közösség tagja, amely törődik a közterületekkel!',
            'A polgári bejelentések adatai segítik a városvezetőket a jobb döntéshozatalban.',
            'A bejelentések követése automatikusan tájékoztatja az előrehaladásról.',
            'A fotós bejelentések háromszor gyorsabban kerülnek feldolgozásra, mint a csak szöveges bejelentések.',
            'Ehhez hasonló polgári részvételi platformok több mint 50 országban működnek.',
            'Az Ön visszajelzése segít meghatározni, mely problémákat oldják meg elsőként.',
            'A digitális bejelentés akár 60%-kal csökkentette a reakcióidőket.',
            'Az aktív polgárok erősebb, ellenállóbb közösségeket hoznak létre.',
            'A MI-elemzés pontosabban kategorizálja a bejelentéseket.',
            'A mobilos bejelentés lehetővé teszi, hogy azonnal rögzítse a problémákat.',
            'Köszönjük, hogy aktív állampolgár!'
        ]
    },
    flag: {
        title: 'Bejelentés megjelölése',
        description: 'Segítsen megőrizni a minőséget nem megfelelő tartalom bejelentésével.',
        reason_label: 'Miért jelöli meg ezt a bejelentést?',
        reason_spam: 'Spam vagy reklám',
        reason_offensive: 'Sértő vagy nem megfelelő tartalom',
        reason_personal: 'Személyes adatokat tartalmaz',
        reason_location: 'Helytelen helyszín',
        reason_other: 'Egyéb',
        details_label: 'További részletek',
        details_placeholder: 'Kérjük, írja le a problémát...',
        details_required: 'Kérjük, adjon meg részleteket',
        submit: 'Beküldés',
        success: 'Köszönjük. Felülvizsgáljuk ezt a bejelentést.',
        error: 'Nem sikerült beküldeni. Kérjük, próbálja újra.',
        already_flagged: 'Ezt a bejelentést már megjelölte.'
    },
    pwa: {
        install: {
            title: 'Alkalmazás telepítése',
            button: 'Telepítés',
            not_now: 'Most nem',
            description:
        'Kattintson a böngésző címsorában lévő telepítési ikonra az alkalmazás telepítéséhez.',
            share_button: 'Megosztás ikon',
            open_safari: 'Safari böngésző',
            ios: {
                title: 'Hozzáadás a kezdőképernyőhöz',
                safari_instructions:
          'Koppintson a {icon} ikonra, és válassza a „Hozzáadás a kezdőképernyőhöz" lehetőséget.',
                other_instructions:
          'Kérjük, nyissa meg ezt az oldalt a(z) {browser} böngészőben a telepítéshez.'
            },
            chrome: {
                instructions:
          'Kattintson a(z) {icon} telepítési ikonra az eszköztáron az alkalmazás telepítéséhez.'
            },
            edge: {
                instructions:
          'Kattintson a(z) {icon} telepítési ikonra a címsorban.'
            },
            firefox: {
                instructions:
          'Kattintson a(z) {icon} ház ikonra a címsorban.'
            }
        }
    },
    boundaries: {
        loading: 'Határadatok betöltése...',
        error: 'Nem sikerült érvényesíteni a területhatárokat. Kérjük, próbálja újra később.',
        notLoaded: 'Határok még nem töltődtek be',
        outsideNonStrict: 'Megjegyzés: A kiválasztott helyszín kívül esik {locationName} határain.',
        outsideStrict: 'A kiválasztott helyszín kívül esik {locationName} határain. Kérjük, válasszon helyszínt a városhatárokon belül.',
        validationUnavailable: 'A határérvényesítés nem elérhető. A bejelentése elfogadásra kerül, de felülvizsgálat tárgyát képezheti.'
    },
    filters: {
        title: 'Szűrők',
        status: {
            title: 'Állapot'
        },
        time: {
            title: 'Időszak',
            today: 'Ma',
            week: 'Ezen a héten',
            month: 'Ebben a hónapban'
        },
        category: {
            title: 'Kategória',
            other: 'Egyéb'
        },
        actions: {
            more: 'További szűrők',
            expand: 'További szűrők',
            collapse: 'Kevesebb',
            clear_all: 'Összes törlése',
            active_count: '{count} aktív szűrő',
            toggle: 'Szűrők'
        }
    },
    privacy: {
        notice_text: 'Az adatvédelemmel kapcsolatos információk',
        notice_link_text: 'itt találhatók',
        modal: {
            title: 'Adatvédelmi nyilatkozat',
            loading: 'Adatvédelmi információk betöltése...',
            retry: 'Újrapróbálás',
            noContent: 'Nem érhető el adatvédelmi információ.',
            lastUpdated: 'Utoljára frissítve',
            close: 'Bezárás'
        }
    },
    search: {
        placeholder: 'Bejelentések keresése...',
        no_results_local: 'Nincs találat az aktuális nézetben',
        expand_to_server: 'Összes bejelentés keresése',
        expand_hint: 'Keresés az aktuális nézeten túl',
        searching_server: 'Összes bejelentés keresése...'
    },
    info: {
        welcome: {
            heading: 'Üdvözöljük a(z) {name} oldalán',
            headingGeneric: 'Üdvözöljük',
            body: 'Ezzel a térképpel bejelenthet problémákat, vagy tájékozódhat a területén lévő meglévő bejelentésekről.'
        },
        shortcuts: {
            aria_label: 'Gyors műveletek',
            photo: {
                title: 'Fotó',
                description: 'Készítsen fotót, az MI elvégzi a többit',
                aria_label: 'Fotós bejelentés létrehozása'
            },
            classic: {
                title: 'Klasszikus',
                description: 'Írja le és helyezze el a problémát',
                aria_label: 'Klasszikus bejelentés létrehozása'
            },
            following: {
                title: 'Követés',
                description: 'Maradjon naprakész a fejleményekről',
                aria_label: 'Követett bejelentések megnyitása'
            },
            list: {
                title: 'Felfedezés',
                description: 'Lássa, mi történik a közelben',
                aria_label: 'Térkép felfedezése és lista megtekintése'
            }
        }
    },
    auth: {
        login: {
            title: 'Bejelentkezés',
            subtitle: 'Adja meg e-mail címét az ellenőrzési kód fogadásához',
            email_label: 'E-mail cím',
            email_hint: '6 jegyű kódot küldünk Önnek',
            email_placeholder: 'e-mail cím',
            send_code: 'Ellenőrzési kód küldése',
            disabled: {
                title: 'A bejelentkezés nem elérhető',
                message: 'A jelszó nélküli bejelentkezés itt nincs engedélyezve. Ha hozzáférésre van szüksége, forduljon a rendszergazdához.',
                back_button: 'Vissza a főoldalra'
            }
        },
        verify: {
            email_label: 'E-mail cím',
            code_label: 'Ellenőrzési kód',
            code_hint: 'Adja meg az e-mailben küldött 6 jegyű kódot',
            code_placeholder: '123456',
            verify_button: 'Ellenőrzés és bejelentkezés',
            back_button: 'Másik e-mail cím használata',
            request_new: 'Új kód igénylése',
            resend_code: 'Kód újraküldése',
            expires_in: 'A kód {time} múlva lejár',
            expired_title: 'A kód lejárt',
            expired_message: 'Az ellenőrzési kódja lejárt. Kérjük, igényeljen újat.'
        },
        code_sent: {
            title: 'Kód elküldve',
            message: '6 jegyű ellenőrzési kódot küldtünk a(z) {email} címre'
        },
        error: {
            title: 'Hitelesítési hiba',
            request_failed: 'Az ellenőrzési kód küldése sikertelen. Kérjük, próbálja újra.',
            verify_failed: 'Érvénytelen vagy lejárt ellenőrzési kód',
            sso_failed: 'A bejelentkezés sikertelen. Kérjük, próbálja újra.',
            network: 'Hálózati hiba. Kérjük, ellenőrizze kapcsolatát.',
            logout_failed: 'A kijelentkezés sikertelen. Kérjük, próbálja újra.'
        },
        sso: {
            completing: 'Bejelentkezés befejezése...',
            method_label: 'Egyszeri bejelentkezés',
            button_aria: 'Bejelentkezés ezzel: {provider} egyszeri bejelentkezéssel'
        },
        user: {
            logged_in_as: 'Bejelentkezve',
            logout: 'Kijelentkezés'
        },
        welcome: {
            greeting: 'Szia, {name}',
            sign_in: 'Bejelentkezés',
            sign_out: 'Kijelentkezés',
            user_avatar: 'Felhasználói avatar'
        }
    },
    profile: {
        title: 'Profil',
        account: {
            title: 'Fiók',
            roles: 'Szerepkörök'
        },
        groups: {
            title: 'Csoportok'
        },
        appearance: {
            title: 'Megjelenés',
            color_mode: 'Színmód',
            light: 'Világos',
            dark: 'Sötét',
            system: 'Rendszer',
            theme_override: 'Egyéni téma színek',
            theme_override_description: 'Az alapértelmezett területi téma felülírása saját színpreferenciákkal',
            primary_color: 'Elsődleges szín',
            secondary_color: 'Másodlagos szín',
            neutral_color: 'Semleges szín',
            reset_theme: 'Visszaállítás alapértelmezettre'
        },
        language: {
            title: 'Nyelv',
            select: 'Nyelv kiválasztása',
            save_failed: 'Nem sikerült menteni a nyelvi preferenciát. Kérjük, próbálja újra.'
        }
    },
    offline: {
        banner: {
            title: 'Offline vagy',
            description: 'A bejelentések helyileg lesznek mentve, és később szinkronizálva.',
            pending: '{count} bejelentés függőben',
            dismiss: 'Bezárás',
            states: {
                offline: {
                    title: 'Offline vagy',
                    description: 'A bejelentések helyileg lesznek mentve'
                },
                syncing: {
                    title: 'Szinkronizálás...',
                    description: '{count} bejelentés küldése'
                },
                success: {
                    title: '{count} bejelentés elküldve',
                    titleDefault: 'Szinkronizálás kész'
                },
                error: {
                    title: '{count} sikertelen',
                    description: 'Áttekintés és újrapróbálás'
                },
                pending: {
                    title: 'Bejelentések készen állnak a küldésre'
                }
            },
            report: 'bejelentés | bejelentés',
            syncNow: 'Küldés most'
        },
        toast: {
            went_offline: 'Kapcsolat megszakadt',
            went_offline_description: 'A bejelentések helyileg lesznek mentve.',
            back_online: 'Ismét online',
            back_online_description: 'Kapcsolat helyreállítva.',
            syncing: 'Szinkronizálás...',
            syncing_description: '{count} bejelentés szinkronizálása.',
            sync_complete: 'Szinkronizálás kész',
            sync_complete_description: 'Minden bejelentés sikeresen elküldve.',
            sync_failed: 'Szinkronizálás sikertelen',
            sync_failed_description: '{count} bejelentés nem küldhető el.'
        },
        status: {
            offline: 'Offline',
            syncing: 'Szinkronizálás...',
            pending: '{count} függőben',
            synced: 'Szinkronizálva'
        },
        sync: {
            title: 'Szinkronizálás állapota',
            syncNow: 'Szinkronizálás most',
            syncing: 'Szinkronizálás...',
            offlineWarning: 'Offline vagy. A bejelentések a kapcsolat helyreállítása után szinkronizálódnak.',
            pendingCount: '{count} bejelentés vár szinkronizálásra',
            readyToSync: 'Készen áll a szinkronizálásra',
            waitingForConnection: 'Kapcsolatra várakozás',
            failedItems: 'Sikertelen beküldések',
            untitledRequest: 'Névtelen bejelentés',
            unknownError: 'Ismeretlen hiba',
            attempts: '{count} kísérlet',
            retry: 'Újrapróbálás',
            delete: 'Törlés',
            allSynced: 'Minden bejelentés szinkronizálva',
            lastSync: 'Utolsó szinkronizálás',
            syncSuccess: '{count} bejelentés sikeresen szinkronizálva',
            syncFailed: '{count} bejelentés szinkronizálása sikertelen',
            retrySuccess: 'Bejelentés sikeresen szinkronizálva',
            retryFailed: 'A bejelentés szinkronizálása sikertelen',
            itemDeleted: 'Bejelentés eltávolítva a sorból',
            queuedSuccess: 'Bejelentés mentve',
            willSyncWhenOnline: 'Elküldésre kerül a kapcsolat helyreállításakor.',
            queueFailed: 'A bejelentés mentése a későbbi küldéshez sikertelen'
        },
        failed: {
            title: 'Sikertelen beküldések',
            description: 'Ezek a bejelentések nem küldhetők el, és figyelmet igényelnek.',
            empty: 'Nincs sikertelen beküldés',
            validation_error: 'Javítás szükséges',
            server_error: 'Szerverhiba',
            edit: 'Szerkesztés',
            retry: 'Újrapróbálás',
            delete: 'Törlés',
            confirm_delete: 'Biztosan törölni szeretné ezt a bejelentést? Ez a művelet nem vonható vissza.',
            untitled: 'Névtelen bejelentés',
            view_failed: 'Sikertelenek megtekintése'
        },
        form: {
            unavailable_title: 'Az űrlap offline nem elérhető',
            unavailable_description: 'A bejelentési űrlap betöltéséhez internetkapcsolat szükséges. Kérjük, csatlakozzon az internethez, és próbálja újra.',
            retry: 'Újrapróbálás',
            go_back: 'Vissza',
            waiting_for_connection: 'Kapcsolatra várakozás...'
        }
    },
    legal: {
        impressum: {
            title: 'Impresszum',
            heading: 'Impresszum',
            responsible_heading: 'A tartalomért felelős',
            responsible_text: 'A platform tartalmáért {name} felelős.'
        },
        privacy: {
            title: 'Adatvédelmi nyilatkozat',
            heading: 'Adatvédelmi nyilatkozat',
            intro: 'Személyes adatai védelme fontos számunkra. Adatait kizárólag jogszabályi előírások alapján (GDPR) kezeljük.',
            controller_heading: 'Adatkezelő',
            data_heading: 'Gyűjtött adatok',
            data_text: 'A platform használata során az alábbi adatok kerülnek kezelésre: a bejelentés helyszíni adatai, a leírás szövege, a feltöltött fotók, valamint technikai hozzáférési adatok (IP-cím, böngésző típusa, a hozzáférés időpontja).',
            rights_heading: 'Az Ön jogai',
            rights_text: 'Önnek joga van a hozzáféréshez, a helyesbítéshez, a törléshez, az adatkezelés korlátozásához, az adathordozhatósághoz és a tiltakozáshoz.'
        },
        terms: {
            title: 'Felhasználási feltételek',
            heading: 'Felhasználási feltételek',
            intro: 'A platform használatával elfogadja az alábbi feltételeket.',
            purpose_heading: 'Cél',
            purpose_text: 'Ez a platform közterületi problémák bejelentésére szolgál. A bejelentések az illetékes hatósághoz kerülnek továbbításra.',
            obligations_heading: 'Felhasználói kötelezettségek',
            obligations_text: 'Ön vállalja, hogy csak valós adatokat ad meg, és nem tölt fel jogszabálysértő tartalmat. A feltöltött fotókon azonosítható személyek csak a saját hozzájárulásukkal szerepelhetnek.',
            liability_heading: 'Felelősség',
            liability_text: '{name} nem vállal felelősséget a megadott adatok teljességéért és pontosságáért.'
        },
        email_label: 'E-mail',
        contact_label: 'Kapcsolat',
        platform: {
            heading: 'Platform üzemeltető',
            intro: 'Ezt a platformot technikailag üzemelteti:',
            description: 'A Civic Patches GmbH biztosítja a Mark-a-Spot platform technikai infrastruktúráját.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Németország',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'A térkép üzemeltetője',
            not_configured: 'A térkép üzemeltetője még nem adta meg jogi információit. A nyilvánosan elérhető online szolgáltatások üzemeltetőitől impresszum és adatvédelmi nyilatkozat megadása lehet kötelező.'
        },
        footer: {
            impressum: 'Impresszum',
            privacy: 'Adatvédelem',
            terms: 'Felhasználási feltételek'
        },
        not_configured: 'Az üzemeltető adatai még nincsenek konfigurálva.'
    },
    demo_mode: {
        banner: {
            title: 'Demo környezet',
            message: 'Az itt beküldött bejelentéseket nem továbbítjuk semmilyen hatósághoz.',
            link_label: 'Látogassa meg: mark-a-spot.com',
            minimize_label: 'Demó figyelmeztetés kicsinyítése',
            expand_label: 'Demó figyelmeztetés megnyitása'
        },
        reset: {
            title: 'Demó adatbázis',
            notice: 'A demó rendszer óránként visszaáll.',
            countdown_label: 'Következő visszaállítás',
            countdown_aria: 'A demó adatbázis következő visszaállítása {time} múlva'
        },
        modal: {
            title: 'Demo beküldés',
            body: 'Ez egy demo. A bejelentése NEM kerül továbbításra az önkormányzathoz. Folytatja a demo beküldést?',
            confirm_label: 'Demo bejelentés elküldése',
            cancel_label: 'Mégse'
        },
        lite: {
            title: 'Csak demo',
            heading: 'Demo környezet',
            body: 'Ez a Mark-a-Spot bemutatója. Az egyszerűsített űrlapon keresztüli beküldés itt le van tiltva, hogy valódi bejelentések véletlenül se jussanak el egy önkormányzathoz.',
            link_label: 'Látogassa meg: mark-a-spot.com'
        }
    },
    print: {
        title: 'Szolgáltatási kérelem jelentés',
        description: 'Leírás',
        location: 'Helyszín',
        media: 'Mellékletek',
        image_unavailable: 'Image unavailable',
        attributes: 'További mezők',
        status_history: 'Állapottörténet',
        internal_fields: 'Belső információk',
        organisation: 'Osztály',
        hazard_level: 'Veszélyszint',
        hazard_category: 'Veszélykategória',
        sentiment: 'Hangulat',
        printed_at: 'Nyomtatva',
        showing_recent: '{count} / {total} frissítés megjelenítése'
    }
};
