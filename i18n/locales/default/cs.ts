// locales/cs.ts
export default {
    locale: {
        code: 'cs-CZ'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    hazard: {
        levels: {
            unknown: 'Neznámé',
            minor: 'Nízké',
            moderate: 'Střední',
            severe: 'Vážné',
            extreme: 'Extrémní'
        },
        categories: {
            Infra: 'Infrastruktura',
            Transport: 'Doprava',
            Safety: 'Veřejná bezpečnost',
            Env: 'Životní prostředí',
            Fire: 'Požár',
            Health: 'Zdraví',
            Geo: 'Geofyzikální',
            Met: 'Meteorologické',
            Other: 'Jiné'
        }
    },
    sentiment: {
        frustrated: 'Frustrované',
        neutral: 'Neutrální',
        positive: 'Pozitivní'
    },
    nav: {
        map: 'Mapa',
        dashboard: 'Dashboard',
        back_to_frontend: 'Zpět na mapu'
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Vítejte, {name}',
        nav: {
            dashboard: 'Dashboard',
            requests: 'Hlášení',
            metrics: 'Metriky',
            settings: 'Nastavení',
            categories: 'Kategorie',
            status: 'Stav',
            jurisdictions: 'Jurisdikce',
            languages: 'Jazyky',
            billing: 'Fakturace'
        },
        help: {
            docs: 'Dokumentace',
            support: 'Kontaktovat podporu'
        },
        settings: {
            languages_title: 'Nastavení jazyků',
            languages_description: 'Nastavte, které jazyky jsou k dispozici a který jazyk se návštěvníkům tohoto pracovního prostoru zobrazí jako výchozí.',
            languages_available: 'Dostupné jazyky',
            languages_default: 'Výchozí jazyk',
            languages_saved: 'Nastavení jazyků bylo uloženo.',
            languages_min_one: 'Musí být vybrán alespoň jeden jazyk.'
        },
        user: {
            profile: 'Profil',
            logout: 'Odhlásit'
        },
        jurisdiction: {
            current: 'Pracovní prostor',
            citizenView: 'Pohled občana',
            switchTo: 'Přepnout na',
            blocked: 'blokován',
            admin_section_header: 'Všechny pracovní prostory (přístup správce)'
        },
        stats: {
            total: 'Celkem hlášení',
            pending: 'Čeká',
            in_progress: 'Zpracovává se',
            resolved: 'Vyřešeno',
            my_groups: 'Moje skupiny',
            overall: 'Celkem'
        },
        recent_requests: 'Poslední hlášení',
        view_all: 'Zobrazit vše',
        no_recent: 'Žádná poslední hlášení',
        wms: {
            title: 'Mapové vrstvy',
            attribution: 'Data: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Média',
                category: 'Kategorie',
                status: 'Stav',
                created: 'Vytvořeno'
            }
        }
    },
    form: {
        body: 'Popis',
        body_description: 'Uveďte prosím podrobný popis',
        body_placeholder: 'Zadejte popis...',
        body_ai_description: 'Automaticky vytvořeno z fotografie. Text můžete upravit.',
        body_ai_placeholder: 'Generuje se text z fotografie...',
        category: 'Kategorie',
        category_description: 'Vyberte vhodnou kategorii pro své hlášení',
        category_placeholder: 'Vyberte kategorii',
        category_disabled: {
            title: 'Kategorie vybrána',
            description: 'Vybrali jste kategorii "{category}". Tato kategorie má zvláštní požadavky nebo neumožňuje další úpravy formuláře.'
        },
        category_empty: 'Nejsou k dispozici žádné kategorie',
        category_loading: 'Načítají se kategorie...',
        category_disabled_notice: 'Tato kategorie je pouze informativní. Odesílání hlášení není možné.',
        category_description_loading: 'Načítá se popis...',
        category_description_error: 'Chyba při načítání popisu',
        email: 'E-mail',
        email_description: 'Váš kontaktní e-mail',
        email_placeholder: 'Zadejte svou e-mailovou adresu',
        first_name: 'Jméno',
        first_name_description: 'Vaše jméno',
        first_name_placeholder: 'Zadejte své jméno',
        last_name: 'Příjmení',
        last_name_description: 'Vaše příjmení',
        last_name_placeholder: 'Zadejte své příjmení',
        gdpr: 'Souhlas se zpracováním údajů',
        gdpr_description: 'Souhlasím se zpracováním svých údajů podle zásad ochrany osobních údajů.',
        object_id: 'ID objektu',
        object_id_description: 'Identifikátor hlášeného objektu',
        object_id_placeholder: 'Zadejte ID objektu, např. číslo sloupu',
        phone: 'Telefonní číslo',
        phone_description: 'Vaše kontaktní telefonní číslo',
        phone_placeholder: 'Zadejte své telefonní číslo',
        facility: 'Zařízení',
        facility_plural: 'Zařízení',
        facility_placeholder: 'Vyberte {label}',
        facility_required: '{label} je povinné.',
        facility_unavailable: 'Vybrané zařízení již není k dispozici, vyberte prosím znovu.',
        facility_nearest_snapped: 'Nejbližší zařízení: {label}',
        facility_no_nearby: 'V okolí není žádné zařízení, vyberte prosím ručně.',
        facility_use_my_location: 'Použít moji polohu',
        facility_locating: 'Zjišťuje se poloha…',
        facility_no_match: 'Vašemu vyhledávání neodpovídá žádné zařízení.',
        facility_opens_in_new_tab: '(otevírá se na nové kartě)',
        facility_deselected_map_pick: 'Používáte vlastní polohu místo {label}',
        facility_tagged_with: 'U: {label}',
        imagelist: {
            empty: 'Pro tento typ nejsou k dispozici žádné obrázky.'
        },
        back_to_report: 'Zpět na formulář hlášení',
        requirements: {
            title: 'Ještě chybí',
            ready_to_submit: 'Připraveno k odeslání',
            photo: 'Nahrajte fotografii',
            category: 'Vyberte kategorii',
            location: 'Zadejte polohu',
            description: 'Zadejte popis',
            email: 'Zadejte e-mailovou adresu',
            privacy: 'Přijměte zásady ochrany osobních údajů',
            privacyBlock: 'Nahraďte nebo odeberte fotografii s citlivým obsahem',
            conditional: 'podle kategorie'
        }
    },
    validation: {
        body_required: 'Popis je povinný',
        category_required: 'Kategorie je povinná',
        email_required: 'E-mail je povinný',
        email_format: 'Neplatný formát e-mailu',
        first_name_required: 'Jméno je povinné',
        last_name_required: 'Příjmení je povinné',
        gdpr_required: 'Musíte souhlasit s podmínkami ochrany údajů',
        object_id_required: 'ID objektu je povinné',
        phone_required: 'Telefonní číslo je povinné',
        required_field: '{field} je povinné'
    },
    feedback: {
        page_title: 'Zpětná vazba k hlášení',
        error_title: 'Chyba načítání',
        invalid_request: 'Neplatné nebo vypršené hlášení',
        thank_you: 'Děkujeme za zpětnou vazbu!',
        submission_received: 'Vaše zpětná vazba byla úspěšně přijata',
        loading: 'Načítá se hlášení...',
        title: 'Zpětná vazba pro: {service}',
        description: 'Napište prosím svou zpětnou vazbu',
        placeholder: 'Zadejte svou zpětnou vazbu...',
        reopen_request: 'Chci, aby bylo toto hlášení znovu otevřeno',
        submitting: 'Odesílá se...',
        sending: 'Odesílá se...',
        submit: 'Odeslat zpětnou vazbu',
        existing_title: 'Vaše zpětná vazba pro: {service}',
        already_submitted: 'K tomuto hlášení jste již zpětnou vazbu odeslali',
        missing_uuid: 'Chybí ID služby',
        success_notification: 'Zpětná vazba byla úspěšně odeslána',
        success_with_id: 'Zpětná vazba byla úspěšně odeslána k hlášení #{id}',
        updated_successfully: 'Zpětná vazba byla úspěšně aktualizována',
        added_to_list: 'Hlášení bylo přidáno do vašeho seznamu',
        submission_error: 'Zpětnou vazbu se nepodařilo odeslat',
        server_error: 'Chyba serveru: zpětnou vazbu nyní nelze zpracovat',
        submission_failed: 'Zpětnou vazbu se nepodařilo odeslat. Zkuste to prosím později',
        already_exists: 'K tomuto hlášení již zpětná vazba existuje',
        error_fetching_request: 'Chyba při načítání detailů hlášení',
        no_content: 'Žádný obsah zpětné vazby',
        refresh_complete: 'Seznam hlášení byl obnoven',
        try_again: 'Zkusit znovu',
        format_unrecognized: 'Formát hlášení nebyl rozpoznán',
        processing_error: 'Chyba při zpracování dat hlášení',
        your_feedback: 'Vaše zpětná vazba',
        contact_preference: 'Preferovaný kontakt',
        no_contact: 'Bez kontaktu',
        email_contact: 'Kontakt e-mailem',
        email_placeholder: 'Vaše e-mailová adresa',
        set_status_open: 'Nastavit stav na otevřeno',
        set_status_open_description: 'Pokud chcete, abychom se tomu znovu věnovali, můžete toto hlášení znovu otevřít.',
        email_verification: 'Ověření e-mailu',
        email_verification_placeholder: 'E-mailová adresa z původního hlášení',
        email_verification_description: 'Zadejte e-mailovou adresu, kterou jste použili při vytvoření původního hlášení.',
        email_mismatch: 'Zadaná e-mailová adresa neodpovídá původnímu hlášení.',
        unauthorized_access: 'Neoprávněný přístup. Zkontrolujte prosím svou e-mailovou adresu.',
        not_eligible: 'Toto hlášení aktuálně není způsobilé pro zpětnou vazbu',
        dialog_description: 'Dialog formuláře zpětné vazby',
        service_provider: {
            page_title: 'Odpověď poskytovatele služby',
            page_description: 'Odešlete poznámky k dokončení přiřazených hlášení',
            modal_title: 'Odpověď poskytovatele služby',
            dialog_description: 'Dialog formuláře odpovědi poskytovatele služby',
            title: 'Dokončit přiřazení',
            your_email: 'Vaše e-mailová adresa',
            email_placeholder: 'poskytovatel{\'@\'}example.com',
            email_verification_note: 'Zadejte e-mailovou adresu poskytovatele služby pro ověření',
            completion_notes: 'Poznámky k dokončení',
            notes_placeholder: 'Popište dokončenou práci...',
            mark_as_completed: 'Označit jako dokončené',
            mark_as_completed_description: 'Nastavit stav hlášení na dokončeno',
            mark_completed_description: 'Potvrďte, že práce byla dokončena',
            submit_completion: 'Odeslat dokončení',
            complete_request: 'Dokončit přiřazení',
            completing: 'Odesílá se...',
            completion_success: 'Dokončení hlášení bylo úspěšně odesláno',
            submission_failed: 'Dokončení se nepodařilo odeslat. Zkuste to prosím později',
            server_error: 'Chyba serveru: dokončení nyní nelze zpracovat',
            completion_not_allowed: 'Toto hlášení nyní nelze dokončit',
            email_verification_failed: 'Ověření e-mailu selhalo. Zkontrolujte prosím e-mailovou adresu',
            already_completed: 'Toto hlášení již bylo dokončeno',
            loading: 'Načítá se hlášení...',
            try_again: 'Zkusit znovu',
            invalid_uuid: 'Neplatné nebo vypršené hlášení',
            load_error: 'Chyba při načítání detailů hlášení',
            error_fetching_request: 'Chyba při načítání detailů hlášení',
            completion_notes_required: 'Uveďte prosím poznámky k dokončení',
            existing_completions: 'Předchozí dokončení',
            reassignment_note: 'Toto hlášení bylo označeno k opětovnému přiřazení a může přijímat více dokončení'
        }
    },
    service_provider: {
        page_title: 'Odpověď poskytovatele služby',
        page_description: 'Odešlete poznámky k dokončení přiřazených hlášení',
        modal_title: 'Odpověď poskytovatele služby',
        dialog_description: 'Dialog formuláře odpovědi poskytovatele služby',
        title: 'Dokončit přiřazení',
        your_email: 'Vaše e-mailová adresa',
        email_placeholder: 'poskytovatel{\'@\'}example.com',
        email_verification_note: 'Zadejte e-mailovou adresu poskytovatele služby pro ověření',
        completion_notes: 'Poznámky k dokončení',
        notes_placeholder: 'Popište dokončenou práci...',
        mark_as_completed: 'Označit jako dokončené',
        mark_as_completed_description: 'Nastavit stav hlášení na dokončeno',
        submit_completion: 'Odeslat dokončení',
        complete_request: 'Dokončit přiřazení',
        completing: 'Odesílá se...',
        completion_success: 'Dokončení hlášení bylo úspěšně odesláno',
        submission_failed: 'Dokončení se nepodařilo odeslat. Zkuste to prosím později',
        server_error: 'Chyba serveru: dokončení nyní nelze zpracovat',
        completion_not_allowed: 'Toto hlášení nyní nelze dokončit',
        email_verification_failed: 'Ověření e-mailu selhalo. Zkontrolujte prosím e-mailovou adresu',
        already_completed: 'Toto hlášení již bylo dokončeno',
        loading: 'Načítá se hlášení...',
        try_again: 'Zkusit znovu',
        invalid_uuid: 'Neplatné nebo vypršené hlášení',
        load_error: 'Chyba při načítání detailů hlášení',
        error_fetching_request: 'Chyba při načítání detailů hlášení',
        completion_notes_required: 'Uveďte prosím poznámky k dokončení',
        existing_completions: 'Předchozí dokončení',
        reassignment_note: 'Toto hlášení bylo označeno k opětovnému přiřazení a může přijímat více dokončení'
    },
    contact: {
        title: 'Kontakt',
        dialog_description: 'Kontaktní formulář',
        name: 'Jméno',
        name_placeholder: 'Vaše jméno',
        email: 'E-mail',
        email_placeholder: 'Vaše e-mailová adresa',
        message: 'Zpráva',
        message_placeholder: 'Vaše zpráva...',
        copy_label: 'Poslat kopii na mou e-mailovou adresu',
        gdpr_label: 'Souhlasím se zpracováním svých údajů',
        gdpr_required: 'Souhlaste prosím se zpracováním údajů',
        submit: 'Odeslat zprávu',
        sending: 'Odesílá se...',
        success_title: 'Zpráva odeslána',
        success_message: 'Děkujeme za vaši zprávu. Ozveme se vám co nejdříve.',
        submission_failed: 'Zprávu se nepodařilo odeslat. Zkuste to prosím později.',
        flood_error: 'Příliš mnoho požadavků. Zkuste to prosím později.',
        required_field: '{field} je povinné',
        invalid_email: 'Zadejte prosím platnou e-mailovou adresu',
        close: 'Zavřít',
        new_message: 'Nová zpráva'
    },
    service_unavailable: {
        title: 'Služba je dočasně nedostupná',
        message: 'Momentálně se nemůžeme připojit k našim službám. Pravděpodobně jde o dočasný problém.',
        retry: 'Máme technické potíže. Zkuste to prosím znovu za {seconds} sekund.',
        auto_retry: 'Opakování za {seconds} sekund...',
        retry_now: 'Zkusit nyní',
        try_later: 'Zkuste to prosím později.',
        reload: 'Načíst znovu'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Vaše hlášení. Naše řešení.'
    },
    hiddenSection: {
        description:
          'Náš systém pro hlášení problémů slouží k oznamování problémů s infrastrukturou. Můžete rovnou pokračovat hlášením problémů nebo přejít na:',
        main_navigation:
          'Hlavní navigace s informacemi, seznamem hlášení a statistikami',
        map:
          'Interaktivní mapa s vizuálními značkami',
        map_navigation_hint:
          'Pomocí šipek se pohybujte mezi značkami hlášení, klávesou Enter vyberte, Escape výběr zruší',
        action_button:
          'Nahlásit přímo',
        keyboard_navigation_hint: 'Pomocí šipek se pohybujte, Enter aktivuje',
        skip_to_main_content: 'Přejít na hlavní obsah'
    },
    accessibility: {
        skip_to_main: 'Přejít na hlavní obsah',
        skip_to_map: 'Přejít na mapu',
        skip_to_navigation: 'Přejít na navigaci',
        skip_to_form: 'Nahlásit přímo',
        leichte_sprache_indicator: 'Jednoduchý jazyk - jednoduché texty pro všechny'
    },
    common: {
        back: 'Zpět',
        not_classified: 'Neklasifikováno',
        no_value: 'Bez hodnoty',
        close: 'Zavřít',
        loading: 'Načítá se...',
        error: 'Chyba',
        success: 'Úspěch',
        submit: 'Odeslat',
        cancel: 'Zrušit',
        required: 'Povinné',
        save: 'Uložit',
        delete: 'Smazat',
        edit: 'Upravit',
        clear: 'Vymazat',
        search: 'Hledat',
        select: 'Vybrat',
        on: 'Zapnuto',
        off: 'Vypnuto',
        toggle: 'Přepnout',
        yesterday: 'Včera',
        did_you_know: 'Věděli jste?',
        show_more: 'Zobrazit více',
        show_less: 'Zobrazit méně',
        learn_more: 'Zjistit více',
        learn_more_about: 'Zjistit více o {topic}',
        opens_in_new_tab: '(otevírá se na nové kartě)',
        title: {
            classic: 'Klasické hlášení',
            photo: 'Hlášení s fotografií'
        },
        buttons: {
            toggle_theme: 'Přepnout motiv',
            attribution: 'Atribuce mapy',
            close: 'Zavřít'
        },
        navigation: 'Navigační panel',
        drawer_description: 'Panel obsahu a možností',
        resize_drawer: 'Upravit velikost panelu',
        drawer_position_n_of_total: 'poloha {idx} z {total}',
        share: 'Sdílet',
        copy_coordinates: 'Kopírovat souřadnice',
        open_in_maps: 'Otevřít v mapách',
        current: 'Aktuální'
    },
    fields: {
        field_geolocation: 'Poloha',
        field_gdpr: 'Souhlas se zpracováním údajů',
        field_e_mail: 'E-mail',
        field_category: 'Kategorie',
        field_request_media: 'Fotografie',
        field_name: 'Příjmení',
        field_prename: 'Jméno',
        field_first_name: 'Jméno',
        field_first_name_placeholder: 'Zadejte prosím jméno',
        field_last_name: 'Příjmení',
        field_last_name_placeholder: 'Zadejte prosím příjmení',
        field_phone: 'Telefon',
        body: 'Popis',
        field_add_data: 'Účast v soutěži',
        field_terms_of_use: 'Souhlasím s podmínkami používání a zásadami ochrany osobních údajů.',
        field_address: 'Adresa',
        postal_code: 'PSČ',
        postal_code_placeholder: 'např. 110 00',
        city: 'Město',
        city_placeholder: 'např. Praha',
        street_address: 'Ulice a číslo',
        street_address_placeholder: 'např. Hlavní 123'
    },
    competition: {
        intro: 'Pokud chcete, zapojte se do našeho každoročního losování. Máte šanci vyhrát atraktivní ceny a finanční odměny, které rozdělujeme mezi všechny účastníky jako malé poděkování.',
        disclaimer: 'Zaměstnanci odpovědných oddělení jsou z účasti vyloučeni.',
        title: 'Účast v soutěži',
        errors: {
            already_exists: 'Záznam do soutěže již existuje',
            duplicate_found: 'Nalezen duplikát',
            duplicate_detail: 'Pro toto hlášení již byl vytvořen záznam do soutěže.',
            not_found: 'Hlášení nebylo nalezeno',
            not_found_detail: 'Související hlášení se nepodařilo najít.',
            save_failed: 'Záznam do soutěže se nepodařilo uložit',
            submission_error: 'Chyba odeslání',
            submission_error_detail: 'Váš záznam do soutěže se nepodařilo uložit, ale vaše hlášení bylo úspěšně odesláno.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Karta informací',
                panel_label: 'Panel informací'
            },
            list: {
                label: 'Seznam',
                aria_label: 'Karta seznamu hlášení',
                panel_label: 'Panel seznamu hlášení'
            },
            following: {
                label: 'Sledované',
                aria_label: 'Karta sledovaných hlášení',
                panel_label: 'Panel sledovaných hlášení'
            },
            stats: {
                label: 'Statistiky',
                aria_label: 'Karta statistik',
                panel_label: 'Panel statistik'
            }
        },
        main: 'Hlavní navigace',
        pages: 'Navigace stránek',
        browse_reports: 'Procházet hlášení',
        back_to_form: 'Zpět na formulář',
        panel: {
            scrollable: 'Posuvná oblast'
        },
        updates_count: '{count} nových aktualizací'
    },
    report: {
        form_types: 'Typy hlášení',
        how_to_help: 'Jak vytvořit hlášení',
        title: {
            photo: 'Hlášení s fotografií',
            classic: 'Klasické hlášení',
            submit: 'Odeslat hlášení',
            edit: 'Upravit hlášení',
            view: 'Zobrazit hlášení'
        },
        photo: {
            description: 'Vytvořit nové hlášení s fotografií'
        },
        classic: {
            description: 'Vytvořit nové hlášení bez fotografie'
        },
        status: {
            new: 'Nové',
            open: 'Otevřeno',
            in_progress: 'Zpracovává se',
            resolved: 'Vyřešeno',
            closed: 'Uzavřeno',
            unknown: 'Neznámý stav'
        },
        form: {
            modal_description: 'Vytvořit nové hlášení',
            tabs: {
                photo: 'S fotografií',
                classic: 'Klasické'
            },
            description: {
                label: 'Popis',
                placeholder: 'Popište prosím problém...',
                ai_processing: 'AI vytváří popis...',
                help: 'Uveďte co nejvíce detailů'
            },
            category: {
                label: 'Kategorie',
                placeholder: 'Vyberte kategorii',
                loading: 'Načítají se kategorie...',
                error: 'Chyba při načítání kategorií',
                empty: 'Nejsou k dispozici žádné kategorie',
                help: 'Výběr kategorie probíhá automaticky',
                description: 'Popis kategorie',
                description_loading: 'Načítá se popis...',
                description_error: 'Chyba při načítání popisu',
                disabled_notice: 'Tato kategorie je pouze informativní. Odesílání hlášení není možné.'
            },
            location: {
                label: 'Poloha',
                placeholder: 'Vyhledejte polohu...',
                selected: 'Poloha vybrána',
                clear: 'Vymazat polohu',
                error: 'Chyba při zjišťování polohy',
                help: 'Zadejte adresu nebo klikněte do mapy',
                help_modal: 'Zadejte adresu nebo použijte aktuální polohu',
                current: 'Použít aktuální polohu',
                searching: 'Hledá se...',
                pick_on_map: 'Vybrat na mapě',
                auto_detected: 'Poloha zjištěna',
                complete_address: 'Úplná adresa',
                from_photo_exif: 'Poloha byla automaticky získána z metadat fotografie',
                warning: 'Upozornění k poloze',
                unknown_location: 'Neznámá poloha',
                suggestions: 'Návrhy polohy'
            },
            email: {
                label: 'E-mail pro aktualizace',
                placeholder: 'Zadejte svou e-mailovou adresu',
                help: 'Budeme vám posílat aktualizace k vašemu hlášení',
                subscribe: 'Přihlásit se k aktualizacím'
            },
            gdpr: {
                label: 'Souhlas se zpracováním údajů',
                description:
          'Souhlasím se zpracováním svých údajů podle zásad ochrany osobních údajů.',
                required: 'Pro pokračování musíte souhlasit',
                link: 'Zobrazit zásady ochrany osobních údajů'
            },
            media: {
                label: 'Fotografie',
                required: 'Pro tuto kategorii je vyžadována fotografie',
                upload: {
                    overall_progress: 'Celkový průběh',
                    button: 'Kliknutím nahrát',
                    or: ' nebo',
                    drag: 'přetáhnout sem',
                    drop_here: 'Pusťte soubory sem pro nahrání',
                    restrictions: 'Až {count} obrázků ({size} max., {types})',
                    restrictions_single: 'Jeden obrázek ({size} max., {types})',
                    progress: 'Průběh nahrávání',
                    started_sr: 'Nahrávání zahájeno',
                    progress_sr: 'Nahrávání dokončeno z {progress} %',
                    success_sr: 'Nahrávání bylo úspěšně dokončeno',
                    error_sr: 'Nahrávání selhalo: {error}',
                    files_selected_sr: 'Vybráno {count} souborů k nahrání',
                    description: 'Nahrajte obrázky kliknutím, klepnutím nebo přetažením souborů sem. Podporované formáty: JPEG, PNG, GIF.',
                    area_label: 'Oblast pro nahrání fotografie - kliknutím vyberte soubory nebo je přetáhněte',
                    in_progress: 'Nahrávání probíhá',
                    complete_sr: 'Soubor byl úspěšně nahrán.'
                },
                preview: 'Náhled obrázku',
                remove: 'Odebrat obrázek',
                no_image_available: 'Obrázek není k dispozici nebo se nezobrazuje z právních důvodů',
                progress: 'Průběh nahrávání: {progress} %',
                limit_reached: 'Byl dosažen maximální počet {count} obrázků',
                privacy_notice: 'Na fotografiích prosím žádné osoby ani poznávací značky',
                offline_cached: 'Uloženo offline',
                ai_analysis: 'Analýza přes Azure AI (Německo)',
                ai_analysis_help: 'Informace o AI analýze',
                ai_analysis_tooltip: 'Nahráním potvrzujete, že fotografie byla pořízena legálně a neporušuje práva třetích osob.\n\nPokud jsou rozpoznatelné osoby nebo poznávací značky, znečitelněte je prosím před nahráním.\n\nAnalýza slouží výhradně ke kategorizaci vašeho hlášení. Do Azure OpenAI (Německo) se odešle pouze zmenšená kopie bez EXIF dat, originál se službě neposílá.'
            },
            submit: {
                button: 'Odeslat hlášení',
                submitting: 'Odesílá se...',
                processing: 'Zpracovává se...',
                success: 'Hlášení bylo úspěšně odesláno',
                error: 'Chyba při odesílání hlášení',
                loading: 'Načítá se formulář...'
            },
            loading: 'Načítá se formulář hlášení...',
            draft_saved: 'Koncept uložen'
        },
        ai: {
            label: 'AI',
            powered: 'Podporováno AI',
            analyzing: 'AI analyzuje vaše fotografie...',
            started_sr: 'AI analýza zahájena',
            complete_sr: 'AI analýza byla úspěšně dokončena',
            field_updated_sr: '{field} bylo aktualizováno na: {value}',
            analysis_complete_sr: 'AI analýza dokončena.',
            category_result_sr: 'Vybraná kategorie: {category}.',
            description_result_sr: 'Vygenerovaný popis: {description}',
            location_result_sr: 'Nalezena poloha: {location}.',
            category_hint: 'Tato fotografie zřejmě neodpovídá našim kategoriím hlášení. Vyberte prosím kategorii sami.',
            processing: {
                analyzing: 'AI se dotazuje...',
                location: 'Kontrolují se metadata obrázku...',
                location_found: 'Poloha nalezena:',
                location_ai: 'Hledá se poloha v obrázku...',
                location_not_found: 'Poloha nebyla v metadatech obrázku nalezena.',
                location_complete: 'Poloha určena',
                category: 'Určuje se kategorie...',
                category_found: 'Kategorie určena:',
                category_not_matched: 'Kategorie navržená AI, je třeba ji vybrat',
                description: 'Generuje se popis...',
                description_complete: 'Popis vygenerován',
                attributes_filled: 'Předvyplněno {count} dalších polí',
                complete: 'AI analýza dokončena',
                error: 'Chyba během AI analýzy',
                privacy_warning: 'Zjištěn možný problém s ochranou soukromí'
            },
            privacy: {
                title: 'Upozornění na ochranu soukromí',
                description: 'Na vaší fotografii mohly být zjištěny osobní údaje ({issues}). Fotografie bude před zveřejněním zkontrolována.',
                required: 'Na této fotografii byl zjištěn obsah kritický pro ochranu soukromí a automatické rozmazání není k dispozici. Fotografii nelze použít. Nahraďte ji nebo ji odstraňte, abyste mohli pokračovat.',
                removePhoto: 'Odebrat fotografii',
                replace: 'Nahradit fotografii',
                understood: 'Pokračovat s touto fotografií'
            },
            failed: {
                title: 'Analýza obrázku není dostupná',
                description: 'Vaše fotografie bude před zveřejněním ručně zkontrolována. Hlášení můžete přesto odeslat.'
            },
            budget_exhausted_title: 'AI analýza přeskočena',
            budget_exhausted_submitted: 'Rozpočet AI analýz pro tento měsíc byl dosažen. Vaše hlášení bylo úspěšně odesláno.'
        },
        buttons: {
            photo: 'Hlášení s fotografií',
            classic: 'Klasické hlášení',
            follow: 'Sledovat hlášení',
            following: 'Sledujete',
            share: 'Sdílet hlášení',
            print: 'Tisk',
            flag: 'Nahlásit',
            flag_submitted: 'Již nahlášeno',
            copy_link: 'Kopírovat odkaz',
            link_copied: 'Odkaz zkopírován do schránky',
            email: 'E-mail',
            directions: 'Navigovat'
        },
        following: {
            count: 'Sledujete {count} hlášení',
            mark_all_read: 'Označit vše jako přečtené',
            no_reports: 'Zatím nesledujete žádná hlášení',
            no_address: 'Adresa není k dispozici',
            status_updated: 'Stav aktualizován',
            status_changed: 'Stav změněn na:',
            awaiting_server: 'Čeká se na aktualizaci',
            escalated_to: 'Předáno na {jurisdiction}',
            escalated_click: 'Klepnutím otevřít v nové jurisdikci',
            unavailable: 'Toto hlášení momentálně není dostupné. Podrobnosti najdete v e-mailu nebo nás kontaktujte.',
            date: {
                today: 'Dnes',
                tomorrow: 'Zítra',
                yesterday: 'Včera',
                unknown: 'Neznámé datum'
            }
        }
    },
    map: {
        tap_to_load: 'Klepnutím zobrazíte mapu',
        tap_to_select_location: 'Klepnutím na mapu vyberte polohu',
        loading: 'Načítá se mapa...',
        loading_address: 'Načítá se adresa...',
        retry_attempt: 'Pokus {count}',
        confirm_location: 'Potvrdit polohu',
        add_report_here: 'Nahlásit zde',
        controls: {
            zoom: 'Ovládání přiblížení',
            zoom_in: 'Přiblížit',
            zoom_out: 'Oddálit',
            find_location: 'Najít moji polohu',
            toggle_heatmap: 'Přepnout teplotní mapu',
            toggle_language: 'Změnit jazyk',
            add_report_here: 'Nahlásit zde',
            adjust_tilt: 'Upravit sklon',
            degrees: '{count} stupňů',
            layers: 'Vrstvy mapy',
            no_layers: 'Žádné dostupné vrstvy',
            geolocation: {
                label: 'Získat aktuální polohu'
            }
        },
        pick: {
            drag_hint: 'Přetažením značky upravte polohu'
        },
        tooltip: {
            label: 'Informace o značce na mapě',
            opens_form_above: 'Otevře formulář nahoře',
            opens_modal: 'Otevře se v dialogu'
        },
        keyboard: {
            canvasInstructions: 'Interaktivní mapa se značkami hlášení. Šipky procházejí mezi značkami, Shift+šipka posouvá mapu, Enter vybírá. Stiskněte Ctrl+= pro přiblížení, Ctrl+- pro oddálení.',
            noFeatures: 'V aktuálním zobrazení mapy nejsou viditelné žádné značky. Zkuste přiblížit nebo posunout mapu.',
            zoomedIntoCluster: 'Přiblíženo do oblasti shluku. Pomocí šipek procházejte značky.',
            clusterFocused: 'Shluk s {count} hlášeními je aktivní. Stiskněte Enter pro rozbalení. {position}',
            clusterExpanded: 'Shluk byl rozbalen na {count} hlášení. {featureLabel}',
            markerFocused: 'Aktivní hlášení: {name} na adrese {address}{context}. Stiskněte Enter pro otevření podrobností. {position}',
            expandedContext: ' (rozbaleno ze shluku)',
            untitledReport: 'Hlášení bez názvu',
            unknownLocation: 'poloha',
            featurePosition: 'Prvek {current} z {total}.',
            pannedToExplore: 'Mapa posunuta {direction}. Uvolněte Shift a pomocí šipek procházejte značky.',
            pannedNoMarkers: 'Mapa posunuta {direction}. V tomto směru nebyly nalezeny žádné značky. Pomocí šipek pokračujte v průzkumu.'
        }
    },
    detail: {
        dialog_description: 'Zobrazit detaily hlášení',
        location: 'Poloha',
        photos: 'Fotografie',
        description: 'Popis',
        status_history: 'Historie stavů',
        updates: 'Aktualizace',
        no_updates: 'Zatím žádné aktualizace',
        edit: 'Upravit',
        follow: {
            button: 'Sledovat',
            following: 'Sledujete',
            stop: 'Přestat sledovat',
            success: 'Nyní sledujete toto hlášení',
            error: 'Chyba při sledování hlášení',
            updating: 'Aktualizuje se...'
        },
        unavailable: {
            title: 'Hlášení není dostupné',
            message: 'Toto hlášení neexistuje nebo zatím nebylo zveřejněno. Nově podaná hlášení se mohou chvíli nezobrazovat.'
        }
    },
    pages: {
        dialog_description: 'Zobrazit obsah stránky'
    },
    stats: {
        status_overview: 'Stav',
        pie_chart: 'Rozdělení',
        total_reports: 'Celkem hlášení',
        status_distribution: 'Rozdělení podle stavu',
        category_distribution: 'Rozdělení podle kategorií',
        uncategorized: 'Bez kategorie',
        showing_reports: 'Zobrazuje se {visible} z {total} hlášení',
        no_reports: 'Nejsou k dispozici žádná hlášení',
        open_reports: 'Otevřená hlášení',
        closed_reports: 'Uzavřená hlášení',
        no_data_available: 'Nejsou k dispozici žádná data',
        expand: 'Zobrazit detaily',
        collapse: 'Skrýt detaily',
        subcategory: 'podkategorie',
        subcategories: 'podkategorie'
    },
    time: {
        days_ago: 'před {count} d',
        just_now: 'Právě teď',
        minutes_ago: 'před {count} min',
        hours_ago: 'před {count} h',
        yesterday: 'Včera',
        today: 'Dnes'
    },
    list: {
        showing: 'Zobrazuje se {visible} z {total} hlášení',
        showing_in_area: '{visible} v této oblasti, celkem {total}',
        showing_area_only: '{visible} v této oblasti',
        no_results: 'Nebyla nalezena žádná hlášení',
        no_filtered_results: 'Žádná hlášení neodpovídají zvoleným filtrům',
        load_more: 'Všechna hlášení načtena',
        load_more_button: 'Načíst další',
        newest_first: 'Nejnovější první',
        oldest_first: 'Nejstarší první',
        refresh: 'Obnovit',
        status_update: 'Stav aktualizován',
        location: 'Poloha',
        unpublished: 'Nezveřejněno',
        editable: 'Upravitelné'
    },
    error: {
        form_error_fallback: 'Při načítání formuláře došlo k chybě. Zkuste to prosím znovu.',
        404: {
            title: 'Stránka nebyla nalezena',
            description: 'Stránka, kterou hledáte, neexistuje nebo byla přesunuta.'
        },
        403: {
            title: 'Přístup odepřen',
            description: 'Nemáte oprávnění k zobrazení této stránky.'
        },
        500: {
            title: 'Něco se pokazilo',
            description: 'Došlo k neočekávané chybě. Zkuste to prosím znovu.'
        },
        fallback: {
            title: 'Chyba',
            description: 'Došlo k neočekávané chybě.'
        },
        actions: {
            back: 'Zpět',
            home: 'Zpět na úvod',
            retry: 'Zkusit znovu'
        }
    },
    errors: {
        general: 'Něco se pokazilo',
        search_failed: 'Hledání selhalo. Zkuste to znovu.',
        api: {
            rate_limit: 'Příliš mnoho požadavků. Chvíli počkejte a zkuste to znovu.',
            unauthorized: 'Nejste autorizováni. Přihlaste se prosím znovu.',
            forbidden: 'Přístup odepřen.',
            not_found: 'Zdroj nebyl nalezen.',
            server_error: 'Chyba serveru. Zkuste to prosím později.',
            default: 'Chyba API: {status}'
        },
        upload_failed: 'Nahrávání selhalo',
        location_error: 'Nelze určit polohu',
        network_error: 'Chyba sítě',
        geolocation: {
            title: 'Chyba polohy',
            permission_denied: 'Povolení polohy bylo zamítnuto. Povolte přístup v nastavení prohlížeče.',
            unavailable: 'Informace o poloze momentálně nejsou dostupné.',
            timeout: 'Požadavek na polohu vypršel.',
            unknown: 'Došlo k neznámé chybě polohy.'
        },
        try_again: 'Zkuste to prosím znovu',
        validation: {
            title: 'Omlouváme se, tento požadavek nelze zpracovat:',
            location_error_title: 'Chyba polohy',
            invalid_input: 'Neplatný vstup',
            duplicate_title: 'Nalezen duplikát',
            duplicate_found: 'Nalezeno podobné hlášení',
            duplicate_report: 'Podobné hlášení již bylo vytvořeno (č. {reportId})',
            duplicate_hint_title: 'Možný duplikát',
            duplicate_hint_message: 'V této oblasti může již existovat podobné hlášení. Pokud jde podle vás o nový problém, můžete ho přesto odeslat.',
            duplicate_existing_report: 'Existující hlášení: č. {reportId}',
            view_existing_report: 'Zobrazit existující hlášení',
            submit_anyway: 'Přesto odeslat',
            location_out_of_bounds: 'Vybraná poloha je mimo naši jurisdikci',
            required_field: '{field} je povinné',
            required_fields: 'Vyplňte prosím všechna povinná pole',
            please_review: 'Zkontrolujte prosím formulář a opravte chyby před odesláním.',
            file_size: 'Vybraný soubor je příliš velký (max. 10 MB)',
            file_type: 'Formát není podporován (povoleno: jpg, png, webp)',
            media_upload: 'Chyba při nahrávání obrázku',
            invalid_format: 'Neplatný formát pro {field}',
            photo_required: 'Pro tuto kategorii je vyžadována fotografie',
            consent_required: 'Přijměte prosím zásady ochrany osobních údajů'
        },
        rate_limit: {
            title: 'Překročen limit požadavků',
            general: 'Zkuste to prosím později.',
            with_time: 'Zkuste to prosím znovu za {seconds} sekund.'
        },
        network: 'Problém s připojením. Zkontrolujte prosím své internetové připojení',
        timeout: 'Časový limit vypršel. Zkuste to prosím znovu',
        upload: {
            title: 'Chyba nahrávání',
            invalid_type: 'Neplatný typ souboru. Nahrávejte prosím pouze obrázky.',
            file_too_large: 'Soubor je příliš velký. Maximální velikost je {size}.',
            file_too_large_raw: 'Soubor je příliš velký (maximum {size}). Vyberte prosím menší obrázek.',
            optimization_failed: 'Obrázek se nepodařilo zkomprimovat. Maximální velikost po kompresi: {size}.',
            dimensions_too_large: 'Rozměry obrázku jsou příliš velké. Maximum {width}x{height} pixelů.',
            invalid_image: 'Neplatný nebo poškozený obrázek.',
            failed: 'Nahrávání selhalo. Zkuste to prosím znovu.',
            limit_reached: 'Byl dosažen maximální počet {count} souborů.',
            remove_to_add: 'Odeberte fotografii, abyste mohli přidat novou',
            single_file_limit: 'Lze nahrát pouze jeden obrázek.',
            exact_file_limit: 'Lze nahrát maximálně {count} obrázků.'
        },
        submission_error: 'Chyba při odesílání nebo nahrávání obrázku.',
        unknown: 'Došlo k neznámé chybě.',
        pending_uploads: 'Počkejte prosím, dokud nebude dokončeno nahrávání.',
        incomplete_form: 'Vyplňte prosím všechna povinná pole.',
        page: {
            title: 'Chyba',
            not_found_title: 'Stránka nebyla nalezena',
            not_found_message: 'Omlouváme se, hledaná stránka neexistuje.',
            server_error_title: 'Chyba serveru',
            server_error_message: 'Omlouváme se, na serveru se něco pokazilo.',
            generic_title: 'Došlo k chybě',
            generic_message: 'Došlo k neočekávané chybě.',
            action_home: 'Zpět na úvod',
            action_back: 'Zpět',
            action_retry: 'Zkusit znovu',
            details: 'Detaily chyby'
        }
    },
    success: {
        report_submitted: 'Hlášení odesláno',
        report_submitted_description: 'Vaše hlášení bylo úspěšně odesláno a bude brzy zkontrolováno.',
        moderation_notice:
      'Vaše hlášení bude před zveřejněním zkontrolováno. Vaše referenční číslo:',
        submit_another: 'Odeslat další hlášení',
        auto_followed: 'Toto hlášení bylo automaticky přidáno mezi sledovaná hlášení',
        visibility_limitation_notice: 'Upozorňujeme, že ne všechna hlášení se na webu zobrazí veřejně. Pokud se vaše hlášení neaktualizuje v seznamu sledovaných, mohlo být městem přesto zpracováno. Sledujte e-mailové aktualizace stavu.',
        fun_facts: [
            'Každé vaše hlášení pomáhá zlepšit město pro život!',
            'Občanská hlášení pomohla opravit více než 10 000 problémů ve městech po celém světě.',
            'Průměrné hlášení je zkontrolováno do 24 hodin.',
            'Jste součástí komunity, které záleží na veřejném prostoru!',
            'Data z občanských hlášení pomáhají plánovačům měst dělat lepší rozhodnutí.',
            'Sledování hlášení vás automaticky informuje o postupu.',
            'Hlášení s fotografií se zpracovávají 3x rychleji než textová hlášení.',
            'Platformy občanské participace jako tato existují ve více než 50 zemích.',
            'Vaše zpětná vazba pomáhá určovat, které problémy se řeší jako první.',
            'Digitální hlášení zkrátilo dobu reakce až o 60 %.',
            'Aktivní občané vytvářejí silnější a odolnější komunity.',
            'AI analýza pomáhá přesněji zařadit vaše hlášení.',
            'Mobilní hlášení usnadňuje oznamování problémů přímo na místě.',
            'Děkujeme, že jste aktivním občanem!'
        ]
    },
    flag: {
        title: 'Nahlásit toto hlášení',
        description: 'Pomozte nám udržet kvalitu nahlášením nevhodného obsahu.',
        reason_label: 'Proč toto hlášení označujete?',
        reason_spam: 'Spam nebo reklama',
        reason_offensive: 'Urážlivý nebo nevhodný obsah',
        reason_personal: 'Obsahuje osobní údaje',
        reason_location: 'Špatná poloha',
        reason_other: 'Jiné',
        details_label: 'Další podrobnosti',
        details_placeholder: 'Popište prosím problém...',
        details_required: 'Uveďte prosím podrobnosti',
        submit: 'Odeslat',
        success: 'Děkujeme. Hlášení zkontrolujeme.',
        error: 'Nepodařilo se odeslat. Zkuste to prosím znovu.',
        already_flagged: 'Toto hlášení jste již označili.'
    },
    pwa: {
        install: {
            title: 'Nainstalovat aplikaci',
            button: 'Instalovat',
            not_now: 'Teď ne',
            description:
        'Kliknutím na ikonu instalace v adresním řádku prohlížeče tuto aplikaci nainstalujete.',
            share_button: 'Ikona sdílení',
            open_safari: 'Prohlížeč Safari',
            ios: {
                title: 'Přidat na plochu',
                safari_instructions:
          'Klepněte na {icon} a vyberte "Přidat na plochu".',
                other_instructions:
          'Pro instalaci otevřete prosím tento web v prohlížeči {browser}.'
            },
            chrome: {
                instructions:
          'Kliknutím na ikonu instalace {icon} v panelu nástrojů aplikaci nainstalujete.'
            },
            edge: {
                instructions:
          'Klikněte na ikonu instalace {icon} v adresním řádku.'
            },
            firefox: {
                instructions:
          'Klikněte na ikonu domů {icon} v adresním řádku.'
            }
        }
    },
    boundaries: {
        loading: 'Načítají se hranice...',
        error: 'Nelze ověřit hranice polohy. Zkuste to prosím později.',
        notLoaded: 'Hranice ještě nejsou načteny',
        outsideNonStrict: 'Poznámka: Vybraná poloha je mimo hranice {locationName}.',
        outsideStrict: 'Vybraná poloha je mimo hranice {locationName}. Vyberte prosím polohu uvnitř města.',
        validationUnavailable: 'Ověření hranic není dostupné. Vaše hlášení bude přijato, ale může být zkontrolováno.'
    },
    filters: {
        title: 'Filtry',
        status: {
            title: 'Stav'
        },
        time: {
            title: 'Čas',
            today: 'Dnes',
            week: 'Tento týden',
            month: 'Tento měsíc'
        },
        category: {
            title: 'Kategorie',
            other: 'Jiné'
        },
        actions: {
            more: 'Další filtry',
            expand: 'Další filtry',
            collapse: 'Méně',
            clear_all: 'Vymazat vše',
            active_count: '{count} aktivních filtrů',
            toggle: 'Filtry'
        }
    },
    privacy: {
        notice_text: 'Informace o ochraně soukromí najdete',
        notice_link_text: 'zde',
        modal: {
            title: 'Zásady ochrany osobních údajů',
            loading: 'Načítají se informace o ochraně soukromí...',
            retry: 'Zkusit znovu',
            noContent: 'Nejsou k dispozici žádné informace o ochraně soukromí.',
            lastUpdated: 'Naposledy aktualizováno',
            close: 'Zavřít'
        }
    },
    search: {
        placeholder: 'Hledat hlášení...',
        no_results_local: 'V aktuálním zobrazení nebyly nalezeny žádné výsledky',
        expand_to_server: 'Hledat ve všech hlášeních',
        expand_hint: 'Hledat mimo aktuální zobrazení',
        searching_server: 'Hledají se všechna hlášení...'
    },
    info: {
        welcome: {
            heading: 'Vítejte v {name}',
            headingGeneric: 'Vítejte',
            body: 'Pomocí této mapy můžete hlásit problémy nebo zjistit existující hlášení ve svém okolí.'
        },
        shortcuts: {
            aria_label: 'Rychlé akce',
            photo: {
                title: 'Fotka',
                description: 'Pořiďte fotku, AI udělá zbytek',
                aria_label: 'Vytvořit hlášení s fotkou'
            },
            classic: {
                title: 'Klasické',
                description: 'Popište a lokalizujte problém',
                aria_label: 'Vytvořit klasické hlášení'
            },
            following: {
                title: 'Sledovat',
                description: 'Zůstaňte informováni o pokroku',
                aria_label: 'Otevřít sledovaná hlášení'
            },
            list: {
                title: 'Prozkoumat',
                description: 'Zjistěte, co se děje ve vašem okolí',
                aria_label: 'Prozkoumat mapu a zobrazit seznam'
            }
        }
    },
    auth: {
        login: {
            title: 'Přihlášení',
            subtitle: 'Zadejte e-mail a obdržíte ověřovací kód',
            email_label: 'E-mailová adresa',
            email_hint: 'Pošleme vám šestimístný kód',
            email_placeholder: 'e-mailová adresa',
            send_code: 'Poslat ověřovací kód',
            disabled: {
                title: 'Přihlášení není dostupné',
                message: 'Přihlášení bez hesla zde není povoleno. Pokud potřebujete přístup, kontaktujte správce.',
                back_button: 'Zpět na úvod'
            }
        },
        verify: {
            email_label: 'E-mailová adresa',
            code_label: 'Ověřovací kód',
            code_hint: 'Zadejte šestimístný kód z e-mailu',
            code_placeholder: '123456',
            verify_button: 'Ověřit a přihlásit',
            back_button: 'Použít jiný e-mail',
            request_new: 'Vyžádat nový kód',
            resend_code: 'Znovu poslat kód',
            expires_in: 'Kód vyprší za {time}',
            expired_title: 'Kód vypršel',
            expired_message: 'Váš ověřovací kód vypršel. Vyžádejte si prosím nový.'
        },
        code_sent: {
            title: 'Kód odeslán',
            message: 'Poslali jsme šestimístný ověřovací kód na {email}'
        },
        error: {
            title: 'Chyba ověření',
            request_failed: 'Ověřovací kód se nepodařilo odeslat. Zkuste to prosím znovu.',
            verify_failed: 'Neplatný nebo vypršený ověřovací kód',
            sso_failed: 'Přihlášení se nezdařilo. Zkuste to prosím znovu.',
            network: 'Chyba sítě. Zkontrolujte prosím připojení.',
            logout_failed: 'Odhlášení se nezdařilo. Zkuste to prosím znovu.'
        },
        sso: {
            completing: 'Dokončování přihlášení...',
            method_label: 'Jednotné přihlášení',
            button_aria: 'Přihlásit se pomocí {provider} přes jednotné přihlášení'
        },
        user: {
            logged_in_as: 'Přihlášen jako',
            logout: 'Odhlásit'
        },
        welcome: {
            greeting: 'Dobrý den, {name}',
            sign_in: 'Přihlásit',
            sign_out: 'Odhlásit',
            user_avatar: 'Avatar uživatele'
        }
    },
    profile: {
        title: 'Profil',
        account: {
            title: 'Účet',
            roles: 'Role'
        },
        groups: {
            title: 'Skupiny'
        },
        appearance: {
            title: 'Vzhled',
            color_mode: 'Barevný režim',
            light: 'Světlý',
            dark: 'Tmavý',
            system: 'Systémový',
            theme_override: 'Vlastní barvy motivu',
            theme_override_description: 'Přepište výchozí motiv jurisdikce vlastními barvami',
            primary_color: 'Primární barva',
            secondary_color: 'Sekundární barva',
            neutral_color: 'Neutrální barva',
            reset_theme: 'Obnovit výchozí'
        },
        language: {
            title: 'Jazyk',
            select: 'Vybrat jazyk',
            save_failed: 'Jazykové nastavení se nepodařilo uložit. Zkuste to prosím znovu.'
        }
    },
    offline: {
        banner: {
            title: 'Jste offline',
            description: 'Hlášení budou uložena lokálně a synchronizována později.',
            pending: '{count} čekajících hlášení',
            dismiss: 'Zavřít',
            states: {
                offline: {
                    title: 'Jste offline',
                    description: 'Hlášení budou uložena lokálně'
                },
                syncing: {
                    title: 'Synchronizace...',
                    description: 'Počet odesílaných hlášení: {count}'
                },
                success: {
                    title: 'Počet odeslaných hlášení: {count}',
                    titleDefault: 'Synchronizace dokončena'
                },
                error: {
                    title: 'Selhalo: {count}',
                    description: 'Zkontrolujte a zkuste znovu'
                },
                pending: {
                    title: 'Hlášení připravena k odeslání'
                }
            },
            report: 'hlášení | hlášení',
            syncNow: 'Odeslat nyní'
        },
        toast: {
            went_offline: 'Připojení ztraceno',
            went_offline_description: 'Hlášení budou uložena lokálně.',
            back_online: 'Znovu online',
            back_online_description: 'Připojení obnoveno.',
            syncing: 'Synchronizace...',
            syncing_description: 'Počet synchronizovaných hlášení: {count}.',
            sync_complete: 'Synchronizace dokončena',
            sync_complete_description: 'Všechna hlášení byla úspěšně odeslána.',
            sync_failed: 'Synchronizace selhala',
            sync_failed_description: 'Nepodařilo se odeslat hlášení: {count}.'
        },
        status: {
            offline: 'Offline',
            syncing: 'Synchronizace...',
            pending: 'Čeká: {count}',
            synced: 'Synchronizováno'
        },
        sync: {
            title: 'Stav synchronizace',
            syncNow: 'Synchronizovat nyní',
            syncing: 'Synchronizace...',
            offlineWarning: 'Jste offline. Hlášení se synchronizují po obnovení připojení.',
            pendingCount: 'Čeká na synchronizaci: {count}',
            readyToSync: 'Připraveno k synchronizaci',
            waitingForConnection: 'Čeká se na připojení',
            failedItems: 'Neúspěšná odeslání',
            untitledRequest: 'Hlášení bez názvu',
            unknownError: 'Neznámá chyba',
            attempts: 'Počet pokusů: {count}',
            retry: 'Zkusit znovu',
            delete: 'Smazat',
            allSynced: 'Všechna hlášení synchronizována',
            lastSync: 'Poslední synchronizace',
            syncSuccess: 'Počet synchronizovaných hlášení: {count}',
            syncFailed: 'Počet hlášení se selháním synchronizace: {count}',
            retrySuccess: 'Hlášení bylo úspěšně synchronizováno',
            retryFailed: 'Hlášení se nepodařilo synchronizovat',
            itemDeleted: 'Hlášení odebráno z fronty',
            queuedSuccess: 'Hlášení uloženo',
            willSyncWhenOnline: 'Bude odesláno po obnovení připojení.',
            queueFailed: 'Hlášení se nepodařilo uložit na později'
        },
        failed: {
            title: 'Neúspěšná odeslání',
            description: 'Tato hlášení se nepodařilo odeslat a vyžadují vaši pozornost.',
            empty: 'Žádná neúspěšná odeslání',
            validation_error: 'Vyžaduje opravu',
            server_error: 'Chyba serveru',
            edit: 'Upravit',
            retry: 'Zkusit znovu',
            delete: 'Smazat',
            confirm_delete: 'Opravdu chcete toto hlášení smazat? Tuto akci nelze vrátit zpět.',
            untitled: 'Hlášení bez názvu',
            view_failed: 'Zobrazit selhání'
        },
        form: {
            unavailable_title: 'Formulář není offline dostupný',
            unavailable_description: 'Formulář hlášení vyžaduje internetové připojení. Připojte se prosím k internetu a zkuste to znovu.',
            retry: 'Zkusit znovu',
            go_back: 'Zpět',
            waiting_for_connection: 'Čeká se na připojení...'
        }
    },
    legal: {
        impressum: {
            title: 'Právní informace',
            heading: 'Právní informace',
            responsible_heading: 'Odpovědnost za obsah',
            responsible_text: '{name} odpovídá za obsah této platformy.'
        },
        privacy: {
            title: 'Zásady ochrany osobních údajů',
            heading: 'Zásady ochrany osobních údajů',
            intro: 'Ochrana vašich osobních údajů je pro nás důležitá. Vaše údaje zpracováváme výhradně na základě právních předpisů (GDPR).',
            controller_heading: 'Správce údajů',
            data_heading: 'Shromažďované údaje',
            data_text: 'Při používání této platformy se zpracovávají následující údaje: poloha hlášení, text popisu, nahrané fotografie a technické přístupové údaje (IP adresa, typ prohlížeče, čas přístupu).',
            rights_heading: 'Vaše práva',
            rights_text: 'Máte právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost údajů a námitku.'
        },
        terms: {
            title: 'Podmínky používání',
            heading: 'Podmínky používání',
            intro: 'Používáním této platformy souhlasíte s následujícími podmínkami.',
            purpose_heading: 'Účel',
            purpose_text: 'Tato platforma slouží k hlášení problémů ve veřejném prostoru. Hlášení jsou předávána odpovědnému orgánu.',
            obligations_heading: 'Povinnosti uživatele',
            obligations_text: 'Souhlasíte, že budete uvádět pouze pravdivé informace a nebudete nahrávat nezákonný obsah. Nahrané fotografie nesmí zobrazovat identifikovatelné osoby bez jejich souhlasu.',
            liability_heading: 'Odpovědnost',
            liability_text: '{name} nepřebírá odpovědnost za úplnost a správnost poskytnutých informací.'
        },
        email_label: 'E-mail',
        contact_label: 'Kontakt',
        platform: {
            heading: 'Provozovatel platformy',
            intro: 'Tuto platformu technicky provozuje:',
            description: 'Civic Patches GmbH poskytuje technickou infrastrukturu pro platformu Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Německo',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Provozovatel této mapy',
            not_configured: 'Provozovatel této mapy zatím neposkytl své právní informace. Provozovatelé veřejně dostupných online služeb mohou být povinni uvést tiráž a zásady ochrany osobních údajů.'
        },
        footer: {
            impressum: 'Právní informace',
            privacy: 'Ochrana soukromí',
            terms: 'Podmínky používání'
        },
        not_configured: 'Údaje provozovatele ještě nejsou nastaveny.'
    },
    demo_mode: {
        banner: {
            title: 'Demo prostředí',
            message: 'Hlášení zde nejsou předávána žádnému úřadu.',
            link_label: 'Navštívit mark-a-spot.com',
            minimize_label: 'Zmenšit demo upozornění',
            expand_label: 'Rozbalit demo upozornění'
        },
        reset: {
            title: 'Demo databáze',
            notice: 'Demo systém se každou hodinu obnoví.',
            countdown_label: 'Další reset za',
            countdown_aria: 'Další reset demo databáze za {time}'
        },
        modal: {
            title: 'Demo odeslání',
            body: 'Toto je demo. Vaše hlášení NEBUDE předáno obci. Pokračovat s demo odesláním?',
            confirm_label: 'Odeslat demo hlášení',
            cancel_label: 'Zrušit'
        },
        lite: {
            title: 'Pouze demo',
            heading: 'Demo prostředí',
            body: 'Toto je ukázka systému Mark-a-Spot. Odesílání přes zjednodušený formulář je zde zakázáno, aby skutečná hlášení nikdy omylem nedorazila na obec.',
            link_label: 'Navštívit mark-a-spot.com'
        }
    },
    print: {
        title: 'Hlášení',
        description: 'Popis',
        location: 'Poloha',
        media: 'Média',
        image_unavailable: 'Image unavailable',
        attributes: 'Další pole',
        status_history: 'Historie stavů',
        internal_fields: 'Interní informace',
        organisation: 'Oddělení',
        hazard_level: 'Úroveň rizika',
        hazard_category: 'Kategorie rizika',
        sentiment: 'Sentiment',
        printed_at: 'Vytištěno',
        showing_recent: 'Zobrazuje se {count} z {total} aktualizací'
    }
};
