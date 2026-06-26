// locales/fi.ts
export default {
    locale: {
        code: 'fi-FI'
    },
    meta: {
        description: 'Mark-a-Spot-käyttöliittymä'
    },
    // CAP (Common Alerting Protocol) hazard severity levels and categories
    // https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html
    hazard: {
        levels: {
            unknown: 'Tuntematon',
            minor: 'Vähäinen',
            moderate: 'Kohtalainen',
            severe: 'Vakava',
            extreme: 'Äärimmäinen'
        },
        categories: {
            Infra: 'Infrastruktuuri',
            Transport: 'Liikenne',
            Safety: 'Yleinen turvallisuus',
            Env: 'Ympäristö',
            Fire: 'Tulipalo',
            Health: 'Terveys',
            Geo: 'Geofysikaalinen',
            Met: 'Meteorologinen',
            Other: 'Muu'
        }
    },
    // AI-detected sentiment from service request descriptions
    sentiment: {
        frustrated: 'Turhautunut',
        neutral: 'Neutraali',
        positive: 'Myönteinen'
    },
    nav: {
        map: 'Kartta',
        dashboard: 'Hallintapaneeli',
        back_to_frontend: 'Takaisin karttaan'
    },
    dashboard: {
        title: 'Hallintapaneeli',
        welcome: 'Tervetuloa, {name}',
        nav: {
            dashboard: 'Hallintapaneeli',
            requests: 'Ilmoitukset',
            metrics: 'Mittarit',
            settings: 'Asetukset',
            categories: 'Kategoriat',
            status: 'Tila',
            jurisdictions: 'Toimialueet',
            languages: 'Kielet',
            billing: 'Laskutus'
        },
        help: {
            docs: 'Dokumentaatio',
            support: 'Ota yhteyttä tukeen'
        },
        settings: {
            languages_title: 'Kieliasetukset',
            languages_description: 'Määritä, mitkä kielet ovat käytettävissä ja mikä kieli näytetään oletuksena tämän työtilan kävijöille.',
            languages_available: 'Käytettävissä olevat kielet',
            languages_default: 'Oletuskieli',
            languages_saved: 'Kieliasetukset tallennettu.',
            languages_min_one: 'Vähintään yksi kieli on valittava.'
        },
        user: {
            profile: 'Profiili',
            logout: 'Kirjaudu ulos'
        },
        jurisdiction: {
            current: 'Työtila',
            citizenView: 'Kansalaisnäkymä',
            switchTo: 'Vaihda kohteeseen',
            blocked: 'estetty',
            admin_section_header: 'Kaikki työtilat (järjestelmänvalvojan käyttöoikeus)'
        },
        stats: {
            total: 'Ilmoitukset yhteensä',
            pending: 'Odottaa',
            in_progress: 'Käsittelyssä',
            resolved: 'Ratkaistu',
            my_groups: 'Omat ryhmät',
            overall: 'Yhteensä'
        },
        recent_requests: 'Viimeisimmät ilmoitukset',
        view_all: 'Näytä kaikki',
        no_recent: 'Ei viimeisimpiä ilmoituksia',
        wms: {
            title: 'Karttatasot',
            attribution: 'Tiedot: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Mediatiedostot',
                category: 'Kategoria',
                status: 'Tila',
                created: 'Luotu'
            }
        }
    },
    form: {
        // Form field labels
        body: 'Kuvaus',
        body_description: 'Anna mahdollisimman tarkka kuvaus',
        body_placeholder: 'Kirjoita kuvaus...',
        body_ai_description: 'Luotu automaattisesti kuvastasi. Voit muokata tekstiä.',
        body_ai_placeholder: 'Luodaan tekstiä kuvasta...',

        category: 'Kategoria',
        category_description: 'Valitse ilmoitukselle sopiva kategoria',
        category_placeholder: 'Valitse kategoria',
        category_disabled: {
            title: 'Kategoria valittu',
            description: 'Olet valinnut kategorian "{category}". Tällä kategorialla on erityisvaatimuksia tai se ei salli lomakkeen lisämuokkausta.'
        },
        category_empty: 'Kategorioita ei ole saatavilla',
        category_loading: 'Ladataan kategorioita...',
        category_disabled_notice: 'Tämä kategoria on vain tiedoksi. Lähettäminen ei ole mahdollista.',
        category_description_loading: 'Ladataan kuvausta...',
        category_description_error: 'Kuvauksen lataaminen epäonnistui',

        email: 'Sähköposti',
        email_description: 'Yhteyssähköpostisi',
        email_placeholder: 'Kirjoita sähköpostiosoitteesi',

        first_name: 'Etunimi',
        first_name_description: 'Etunimesi',
        first_name_placeholder: 'Kirjoita etunimesi',

        last_name: 'Sukunimi',
        last_name_description: 'Sukunimesi',
        last_name_placeholder: 'Kirjoita sukunimesi',

        gdpr: 'Tietosuojasopimus',
        gdpr_description: 'Hyväksyn tietojeni käsittelyn tietosuojaselosteen mukaisesti.',

        object_id: 'Kohteen tunnus',
        object_id_description: 'Ilmoitetun kohteen tunniste',
        object_id_placeholder: 'Anna kohteen tunnus (esim. pylvään numero)',

        phone: 'Puhelinnumero',
        phone_description: 'Yhteyspuhelinnumerosi',
        phone_placeholder: 'Kirjoita puhelinnumerosi',

        // Kohteeseen perustuva ilmoittaminen
        facility: 'Kohde',
        facility_plural: 'Kohteet',
        facility_placeholder: 'Valitse {label}',
        facility_required: '{label} on pakollinen.',
        facility_unavailable: 'Valittu kohde ei ole enää saatavilla, valitse uudelleen.',
        facility_nearest_snapped: 'Lähin kohde: {label}',
        facility_no_nearby: 'Lähistöllä ei ole kohteita, valitse manuaalisesti.',
        facility_use_my_location: 'Käytä sijaintiani',
        facility_locating: 'Haetaan sijaintia…',
        facility_no_match: 'Mikään kohde ei vastaa hakuasi.',
        facility_opens_in_new_tab: '(avautuu uuteen välilehteen)',
        facility_deselected_map_pick: 'Käytetään omaa sijaintiasi kohteen {label} sijaan',
        facility_tagged_with: 'Kohde: {label}',

        // Imagelist
        imagelist: {
            empty: 'Tälle tyypille ei ole kuvia saatavilla.'
        },

        // Form-first mode
        back_to_report: 'Takaisin ilmoituslomakkeeseen',

        // Form requirements indicator
        requirements: {
            title: 'Vielä tarvitaan',
            ready_to_submit: 'Valmis lähetettäväksi',
            photo: 'Lataa valokuva',
            category: 'Valitse kategoria',
            location: 'Anna sijainti',
            description: 'Kirjoita kuvaus',
            email: 'Anna sähköpostiosoite',
            privacy: 'Hyväksy tietosuojaseloste',
            privacyBlock: 'Korvaa tai poista tietosuojaongelmainen kuva',
            conditional: 'kategoriasta riippuen'
        }
    },
    validation: {
        // Validation error messages
        body_required: 'Kuvaus on pakollinen',
        category_required: 'Kategoria on pakollinen',
        email_required: 'Sähköposti on pakollinen',
        email_format: 'Sähköpostin muoto ei kelpaa',
        first_name_required: 'Etunimi on pakollinen',
        last_name_required: 'Sukunimi on pakollinen',
        gdpr_required: 'Sinun on hyväksyttävä tietosuojakäytännöt',
        object_id_required: 'Kohteen tunnus on pakollinen',
        phone_required: 'Puhelinnumero on pakollinen',
        required_field: '{field} on pakollinen'
    },
    feedback: {
        page_title: 'Palvelupyynnön palaute',
        error_title: 'Latausvirhe',
        invalid_request: 'Virheellinen tai vanhentunut palvelupyyntö',
        thank_you: 'Kiitos palautteestasi!',
        submission_received: 'Palautteesi on vastaanotettu onnistuneesti',
        loading: 'Ladataan palvelupyyntöä...',
        title: 'Palaute palvelusta: {service}',
        description: 'Anna palautteesi',
        placeholder: 'Kirjoita palautteesi tähän...',
        reopen_request: 'Haluan, että tämä palvelupyyntö avataan uudelleen',
        submitting: 'Lähetetään...',
        sending: 'Lähetetään...',
        submit: 'Lähetä palaute',
        existing_title: 'Palautteesi palvelusta: {service}',
        already_submitted: 'Olet jo antanut palautetta tästä palvelupyynnöstä',
        missing_uuid: 'Palvelutunnus puuttuu',
        success_notification: 'Palaute lähetetty onnistuneesti',
        success_with_id: 'Palaute lähetetty onnistuneesti pyynnölle #{id}',
        updated_successfully: 'Palaute päivitetty onnistuneesti',
        added_to_list: 'Palvelupyyntö on lisätty listaasi',
        submission_error: 'Palautteen lähettäminen epäonnistui',
        server_error: 'Palvelinvirhe: palautetta ei voitu käsitellä tällä hetkellä',
        submission_failed: 'Palautteen lähettäminen epäonnistui. Yritä myöhemmin uudelleen',
        already_exists: 'Tälle palvelupyynnölle on jo annettu palaute',
        error_fetching_request: 'Palvelupyynnön tietojen lataaminen epäonnistui',
        no_content: 'Ei palautesisältöä',
        refresh_complete: 'Pyyntölista päivitetty',
        try_again: 'Yritä uudelleen',
        format_unrecognized: 'Palvelupyynnön muotoa ei tunnistettu',
        processing_error: 'Palvelupyynnön tietojen käsittely epäonnistui',
        your_feedback: 'Palautteesi',
        contact_preference: 'Yhteydenottotapa',
        no_contact: 'Ei yhteydenottoa',
        email_contact: 'Yhteydenotto sähköpostitse',
        email_placeholder: 'Sähköpostiosoitteesi',
        set_status_open: 'Aseta tilaksi avoin',
        set_status_open_description: 'Jos haluat, että tarkastelemme asiaa uudelleen, voit avata tämän palvelupyynnön uudelleen.',
        email_verification: 'Sähköpostin vahvistus',
        email_verification_placeholder: 'Alkuperäisen ilmoituksen sähköpostiosoite',
        email_verification_description: 'Kirjoita sähköpostiosoite, jota käytit alkuperäisen ilmoituksen luomisessa.',
        email_mismatch: 'Annettu sähköpostiosoite ei vastaa alkuperäistä ilmoitusta.',
        unauthorized_access: 'Luvaton käyttö. Tarkista sähköpostiosoitteesi.',
        not_eligible: 'Tälle palvelupyynnölle ei voi tällä hetkellä antaa palautetta',
        dialog_description: 'Palautelomakkeen valintaikkuna',
        service_provider: {
            // Page and modal titles
            page_title: 'Palveluntarjoajan vastaus',
            page_description: 'Lähetä valmistumismerkinnät osoitetuille palvelupyynnöille',
            modal_title: 'Palveluntarjoajan vastaus',
            dialog_description: 'Palveluntarjoajan vastauslomakkeen valintaikkuna',

            // Form fields
            title: 'Viimeistele tehtävä',
            your_email: 'Sähköpostiosoitteesi',
            email_placeholder: 'provider{\'@\'}example.com',
            email_verification_note: 'Kirjoita palveluntarjoajan sähköpostiosoitteesi vahvistusta varten',
            completion_notes: 'Valmistumismerkinnät',
            notes_placeholder: 'Kuvaile tehty työ...',
            mark_as_completed: 'Merkitse valmiiksi',
            mark_as_completed_description: 'Aseta pyynnön tilaksi valmis',
            mark_completed_description: 'Vahvista, että työ on valmis',

            // Buttons
            submit_completion: 'Lähetä valmistumisilmoitus',
            complete_request: 'Viimeistele tehtävä',
            completing: 'Lähetetään...',

            // Success and error messages
            completion_success: 'Palvelupyynnön valmistumisilmoitus lähetetty onnistuneesti',
            submission_failed: 'Valmistumisilmoituksen lähettäminen epäonnistui. Yritä myöhemmin uudelleen',
            server_error: 'Palvelinvirhe: valmistumisilmoitusta ei voitu käsitellä tällä hetkellä',
            completion_not_allowed: 'Tätä pyyntöä ei voi merkitä valmiiksi tällä hetkellä',
            email_verification_failed: 'Sähköpostin vahvistus epäonnistui. Tarkista sähköpostiosoitteesi',
            already_completed: 'Tämä pyyntö on jo merkitty valmiiksi',

            // Loading and validation
            loading: 'Ladataan palvelupyyntöä...',
            try_again: 'Yritä uudelleen',
            invalid_uuid: 'Virheellinen tai vanhentunut palvelupyyntö',
            load_error: 'Palvelupyynnön tietojen lataaminen epäonnistui',
            error_fetching_request: 'Palvelupyynnön tietojen lataaminen epäonnistui',
            completion_notes_required: 'Anna valmistumismerkinnät',

            // Multiple completions
            existing_completions: 'Aiemmat valmistumiset',
            reassignment_note: 'Tämä pyyntö on merkitty uudelleenosoitettavaksi ja voi vastaanottaa useita valmistumisilmoituksia'
        }
    },
    service_provider: {
        page_title: 'Palveluntarjoajan vastaus',
        page_description: 'Lähetä valmistumismerkinnät osoitetuille palvelupyynnöille',
        modal_title: 'Palveluntarjoajan vastaus',
        dialog_description: 'Palveluntarjoajan vastauslomakkeen valintaikkuna',
        title: 'Viimeistele tehtävä',
        your_email: 'Sähköpostiosoitteesi',
        email_placeholder: 'provider{\'@\'}example.com',
        email_verification_note: 'Kirjoita palveluntarjoajan sähköpostiosoitteesi vahvistusta varten',
        completion_notes: 'Valmistumismerkinnät',
        notes_placeholder: 'Kuvaile tehty työ...',
        mark_as_completed: 'Merkitse valmiiksi',
        mark_as_completed_description: 'Aseta pyynnön tilaksi valmis',
        submit_completion: 'Lähetä valmistumisilmoitus',
        complete_request: 'Viimeistele tehtävä',
        completing: 'Lähetetään...',
        completion_success: 'Palvelupyynnön valmistumisilmoitus lähetetty onnistuneesti',
        submission_failed: 'Valmistumisilmoituksen lähettäminen epäonnistui. Yritä myöhemmin uudelleen',
        server_error: 'Palvelinvirhe: valmistumisilmoitusta ei voitu käsitellä tällä hetkellä',
        completion_not_allowed: 'Tätä pyyntöä ei voi merkitä valmiiksi tällä hetkellä',
        email_verification_failed: 'Sähköpostin vahvistus epäonnistui. Tarkista sähköpostiosoitteesi',
        already_completed: 'Tämä pyyntö on jo merkitty valmiiksi',
        loading: 'Ladataan palvelupyyntöä...',
        try_again: 'Yritä uudelleen',
        invalid_uuid: 'Virheellinen tai vanhentunut palvelupyyntö',
        load_error: 'Palvelupyynnön tietojen lataaminen epäonnistui',
        error_fetching_request: 'Palvelupyynnön tietojen lataaminen epäonnistui',
        completion_notes_required: 'Anna valmistumismerkinnät',
        existing_completions: 'Aiemmat valmistumiset',
        reassignment_note: 'Tämä pyyntö on merkitty uudelleenosoitettavaksi ja voi vastaanottaa useita valmistumisilmoituksia'
    },
    contact: {
        title: 'Yhteystiedot',
        dialog_description: 'Yhteydenottolomake',
        name: 'Nimi',
        name_placeholder: 'Nimesi',
        email: 'Sähköposti',
        email_placeholder: 'Sähköpostiosoitteesi',
        message: 'Viesti',
        message_placeholder: 'Viestisi...',
        copy_label: 'Lähetä kopio sähköpostiini',
        gdpr_label: 'Hyväksyn tietojeni käsittelyn',
        gdpr_required: 'Hyväksy tietojen käsittely',
        submit: 'Lähetä viesti',
        sending: 'Lähetetään...',
        success_title: 'Viesti lähetetty',
        success_message: 'Kiitos viestistäsi. Palaamme asiaan mahdollisimman pian.',
        submission_failed: 'Viestiä ei voitu lähettää. Yritä myöhemmin uudelleen.',
        flood_error: 'Liian monta pyyntöä. Yritä myöhemmin uudelleen.',
        required_field: '{field} on pakollinen',
        invalid_email: 'Kirjoita kelvollinen sähköpostiosoite',
        close: 'Sulje',
        new_message: 'Uusi viesti'
    },
    service_unavailable: {
        title: 'Palvelu tilapäisesti poissa käytöstä',
        message: 'Palveluihimme ei saada juuri nyt yhteyttä. Kyse on todennäköisesti tilapäisestä ongelmasta.',
        retry: 'Palvelussa on teknisiä ongelmia. Yritä uudelleen {seconds} sekunnin kuluttua.',
        auto_retry: 'Yritetään uudelleen {seconds} sekunnin kuluttua...',
        retry_now: 'Kokeile nyt',
        try_later: 'Yritä myöhemmin uudelleen.',
        reload: 'Lataa uudelleen'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Sinun ilmoituksesi. Meidän ratkaisumme.'
    },
    hiddenSection: {
        description:
          'Ilmoituspalvelumme on infrastruktuuriongelmien ilmoitusjärjestelmä. Voit siirtyä suoraan ilmoittamaan ongelmasta tai käyttää seuraavia:',
        main_navigation:
          'Päänavigaatio, jossa on tietoja, ilmoituslista ja tilastoja',
        map:
          'Interaktiivinen kartta visuaalisilla merkeillä',
        map_navigation_hint:
          'Käytä nuolinäppäimiä ⬆️⬇️⬅️➡️ ilmoitusmerkkien välillä liikkumiseen, ↩️ Enter valintaan ja ❌ Escape valinnan tyhjentämiseen',
        action_button:
          'Ilmoita suoraan',
        keyboard_navigation_hint: 'Liiku nuolinäppäimillä ja aktivoi Enter-näppäimellä',
        skip_to_main_content: 'Siirry pääsisältöön'
    },
    accessibility: {
        skip_to_main: 'Siirry pääsisältöön',
        skip_to_map: 'Siirry karttaan',
        skip_to_navigation: 'Siirry navigaatioon',
        skip_to_form: 'Ilmoita suoraan',
        leichte_sprache_indicator: 'Selkokieli, yksinkertaiset tekstit kaikille'
    },
    common: {
        back: 'Takaisin',
        not_classified: 'Ei luokiteltu',
        no_value: 'Ei arvoa',
        close: 'Sulje',
        loading: 'Ladataan...',
        error: 'Virhe',
        success: 'Onnistui',
        submit: 'Lähetä',
        cancel: 'Peruuta',
        required: 'Pakollinen',
        save: 'Tallenna',
        delete: 'Poista',
        edit: 'Muokkaa',
        clear: 'Tyhjennä',
        search: 'Etsi',
        select: 'Valitse',
        on: 'Päällä',
        off: 'Pois',
        toggle: 'Vaihda',
        yesterday: 'Eilen',
        did_you_know: 'Tiesitkö?',
        show_more: 'Näytä lisää',
        show_less: 'Näytä vähemmän',
        learn_more: 'Lue lisää',
        learn_more_about: 'Lue lisää aiheesta {topic}',
        opens_in_new_tab: '(avautuu uuteen välilehteen)',
        title: {
            classic: 'Perinteinen ilmoitus',
            photo: 'Valokuvailmoitus'
        },
        buttons: {
            toggle_theme: 'Vaihda teemaa',
            attribution: 'Kartan tekijätiedot',
            close: 'Sulje'
        },
        navigation: 'Navigointipaneeli',
        drawer_description: 'Sisältö- ja asetuspaneeli',
        resize_drawer: 'Muuta paneelin kokoa',
        drawer_position_n_of_total: 'sijainti {idx} / {total}',
        share: 'Jaa',
        copy_coordinates: 'Kopioi koordinaatit',
        open_in_maps: 'Avaa kartoissa',
        current: 'Nykyinen'
    },
    fields: {
        field_geolocation: 'Sijainti',
        field_gdpr: 'Suostumus tietojen käsittelyyn',
        field_e_mail: 'Sähköposti',
        field_category: 'Kategoria',
        field_request_media: 'Valokuvat',
        field_name: 'Sukunimi',
        field_prename: 'Etunimi',
        field_first_name: 'Etunimi',
        field_first_name_placeholder: 'Kirjoita etunimi',
        field_last_name: 'Sukunimi',
        field_last_name_placeholder: 'Kirjoita sukunimi',
        field_phone: 'Puhelin',
        body: 'Kuvaus',
        field_add_data: 'Arvontaan osallistuminen',
        field_terms_of_use: 'Hyväksyn käyttöehdot ja tietosuojaselosteen.',
        field_address: 'Osoite',
        postal_code: 'Postinumero',
        postal_code_placeholder: 'esim. 10001',
        city: 'Kaupunki',
        city_placeholder: 'esim. New York',
        street_address: 'Katuosoite',
        street_address_placeholder: 'esim. Main Street 123'
    },
    competition: {
        intro: 'Voit halutessasi osallistua vuosittaiseen arvontaamme. Sinulla on mahdollisuus voittaa palkintoja ja rahapalkintoja, jotka jaamme osallistujien kesken pienenä kiitoksena.',
        disclaimer: 'Vastuullisten osastojen työntekijät eivät voi osallistua.',
        title: 'Arvontaan osallistuminen',
        errors: {
            already_exists: 'Arvontaan osallistuminen on jo olemassa',
            duplicate_found: 'Kaksoiskappale löytyi',
            duplicate_detail: 'Tälle ilmoitukselle on jo luotu arvontaan osallistuminen.',
            not_found: 'Ilmoitusta ei löytynyt',
            not_found_detail: 'Liittyvää ilmoitusta ei löytynyt.',
            save_failed: 'Arvontaan osallistumista ei voitu tallentaa',
            submission_error: 'Lähetysvirhe',
            submission_error_detail: 'Arvontaan osallistumistasi ei voitu tallentaa, mutta ilmoituksesi lähetettiin onnistuneesti.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Tiedot',
                aria_label: 'Tietovälilehti',
                panel_label: 'Tietopaneeli'
            },
            list: {
                label: 'Lista',
                aria_label: 'Ilmoituslistan välilehti',
                panel_label: 'Ilmoituslistan paneeli'
            },
            following: {
                label: 'Seurataan',
                aria_label: 'Seurattujen ilmoitusten välilehti',
                panel_label: 'Seurattujen ilmoitusten paneeli'
            },
            stats: {
                label: 'Tilastot',
                aria_label: 'Tilastovälilehti',
                panel_label: 'Tilastopaneeli'
            }
        },
        main: 'Päänavigaatio',
        pages: 'Sivunavigaatio',
        browse_reports: 'Selaa ilmoituksia',
        back_to_form: 'Takaisin lomakkeeseen',
        panel: {
            scrollable: 'Vieritettävä alue'
        },
        updates_count: '{count} uutta päivitystä'
    },
    report: {
        form_types: 'Ilmoitustyypit',
        how_to_help: 'Kuinka tehdä ilmoitus',
        title: {
            photo: 'Valokuvailmoitus',
            classic: 'Perinteinen ilmoitus',
            submit: 'Lähetä ilmoitus',
            edit: 'Muokkaa ilmoitusta',
            view: 'Näytä ilmoitus'
        },
        photo: {
            description: 'Luo uusi ilmoitus valokuvalla'
        },
        classic: {
            description: 'Luo uusi ilmoitus ilman valokuvaa'
        },
        status: {
            new: 'Uusi',
            open: 'Avoin',
            in_progress: 'Käsittelyssä',
            resolved: 'Ratkaistu',
            closed: 'Suljettu',
            unknown: 'Tuntematon tila'
        },
        form: {
            modal_description: 'Luo uusi ilmoitus',
            tabs: {
                photo: 'Valokuvalla',
                classic: 'Perinteinen'
            },
            description: {
                label: 'Kuvaus',
                placeholder: 'Kuvaile ongelma...',
                ai_processing: 'Tekoäly luo kuvausta...',
                help: 'Anna mahdollisimman paljon yksityiskohtia'
            },
            category: {
                label: 'Kategoria',
                placeholder: 'Valitse kategoria',
                loading: 'Ladataan kategorioita...',
                error: 'Kategorioiden lataaminen epäonnistui',
                empty: 'Kategorioita ei ole saatavilla',
                help: 'Kategoria valitaan automaattisesti',
                description: 'Kategorian kuvaus',
                description_loading: 'Ladataan kuvausta...',
                description_error: 'Kuvauksen lataaminen epäonnistui',
                disabled_notice: 'Tämä kategoria on vain tiedoksi. Lähettäminen ei ole mahdollista.'
            },
            location: {
                label: 'Sijainti',
                placeholder: 'Etsi sijaintia...',
                selected: 'Sijainti valittu',
                clear: 'Tyhjennä sijainti',
                error: 'Sijainnin hakeminen epäonnistui',
                help: 'Kirjoita osoite tai napsauta karttaa',
                help_modal: 'Syötä osoite tai käytä nykyistä sijaintiasi',
                current: 'Käytä nykyistä sijaintia',
                searching: 'Etsitään...',
                pick_on_map: 'Valitse kartalta',
                auto_detected: 'Sijainti tunnistettu',
                complete_address: 'Täydellinen osoite',
                from_photo_exif: 'Sijainti poimittiin automaattisesti kuvan metatiedoista',
                warning: 'Sijaintivaroitus',
                unknown_location: 'Tuntematon sijainti',
                suggestions: 'Sijaintiehdotukset'
            },
            email: {
                label: 'Sähköposti päivityksiä varten',
                placeholder: 'Kirjoita sähköpostiosoitteesi',
                help: 'Lähetämme sinulle päivityksiä ilmoituksestasi',
                subscribe: 'Tilaa päivitykset'
            },
            gdpr: {
                label: 'Suostumus tietojen käsittelyyn',
                description:
          'Hyväksyn tietojeni käsittelyn tietosuojaselosteen mukaisesti.',
                required: 'Sinun on hyväksyttävä jatkaaksesi',
                link: 'Näytä tietosuojaseloste'
            },
            media: {
                label: 'Valokuvat',
                required: 'Tässä kategoriassa valokuva on pakollinen',
                upload: {
                    overall_progress: 'Kokonaisedistyminen',
                    button: 'Lataa napsauttamalla',
                    or: ' tai',
                    drag: 'vedä ja pudota',
                    drop_here: 'Pudota tiedostot tähän ladataksesi',
                    restrictions: 'Enintään {count} kuvaa (enintään {size}, {types})',
                    restrictions_single: 'Yksi kuva (enintään {size}, {types})',
                    progress: 'Latauksen edistyminen',
                    started_sr: 'Lataus aloitettu',
                    progress_sr: 'Lataus {progress} % valmis',
                    success_sr: 'Lataus valmistui onnistuneesti',
                    error_sr: 'Lataus epäonnistui: {error}',
                    files_selected_sr: '{count} tiedostoa valittu lähetettäväksi',
                    description: 'Lataa kuvia napsauttamalla, napauttamalla tai vetämällä tiedostoja tähän. Tuetut muodot: JPEG, PNG, GIF.',
                    area_label: 'Valokuvien latausalue, valitse tiedostot napsauttamalla tai vedä ja pudota',
                    in_progress: 'Lataus käynnissä',
                    complete_sr: 'Tiedosto on ladattu onnistuneesti.'
                },
                preview: 'Kuvan esikatselu',
                remove: 'Poista kuva',
                no_image_available: 'Kuvaa ei ole saatavilla tai sitä ei näytetä oikeudellisista syistä',
                progress: 'Latauksen edistyminen: {progress} %',
                limit_reached: 'Kuvien enimmäismäärä {count} on saavutettu',
                privacy_notice: 'Älä sisällytä kuviin henkilöitä tai rekisterikilpiä',
                offline_cached: 'Tallennettu offline-tilassa',
                ai_analysis: 'Analyysi Azure AI:lla (Saksa)',
                ai_analysis_help: 'Tietoa tekoälyanalyysistä',
                ai_analysis_tooltip: 'Lataamalla vahvistat, että kuva on otettu lainmukaisesti eikä loukkaa kolmansien osapuolten oikeuksia.\n\nJos henkilöt tai rekisterikilvet ovat tunnistettavissa, tee ne tunnistamattomiksi ennen lataamista.\n\nAnalyysiä käytetään vain ilmoituksesi luokitteluun. Azure OpenAI:lle (Saksa) lähetetään vain pienennetty, EXIF-tiedoista puhdistettu kopio; alkuperäistä kuvaa ei lähetetä palveluun.'
            },
            submit: {
                button: 'Lähetä ilmoitus',
                submitting: 'Lähetetään...',
                processing: 'Käsitellään...',
                success: 'Ilmoitus lähetetty onnistuneesti',
                error: 'Ilmoituksen lähettäminen epäonnistui',
                loading: 'Ladataan lomaketta...'
            },
            loading: 'Ladataan ilmoituslomaketta...',
            draft_saved: 'Luonnos tallennettu'
        },
        ai: {
            label: 'AI',
            powered: 'Tekoälyn tukema',
            analyzing: 'Tekoäly analysoi valokuviasi...',
            started_sr: 'Tekoälyanalyysi aloitettu',
            complete_sr: 'Tekoälyanalyysi valmistui onnistuneesti',
            field_updated_sr: '{field} on päivitetty arvolla: {value}',
            analysis_complete_sr: 'Tekoälyanalyysi valmis.',
            category_result_sr: 'Kategoria valittu: {category}.',
            description_result_sr: 'Kuvaus luotu: {description}',
            location_result_sr: 'Sijainti löytyi: {location}.',
            category_hint: 'Tämä kuva ei näytä vastaavan ilmoituskategorioitamme. Valitse kategoria itse.',
            processing: {
                analyzing: 'Kysytään tekoälyltä...',
                location: 'Tarkistetaan kuvan metatietoja...',
                location_found: 'Sijainti löytyi:',
                location_ai: 'Etsitään sijaintia kuvasta...',
                location_not_found: 'Sijaintia ei löytynyt kuvan metatiedoista.',
                location_complete: 'Sijainti tunnistettu',
                category: 'Tunnistetaan kategoriaa...',
                category_found: 'Kategoria tunnistettu:',
                category_not_matched: 'Tekoäly ehdotti kategoriaa (vaatii valinnan)',
                description: 'Luodaan kuvausta...',
                description_complete: 'Kuvaus luotu',
                attributes_filled: '{count} lisäkenttä esitäytetty',
                complete: 'Tekoälyanalyysi valmis',
                error: 'Virhe tekoälyanalyysissä',
                privacy_warning: 'Tietosuojaan liittyvä huoli havaittu'
            },
            privacy: {
                title: 'Tietosuojahuomautus',
                description: 'Kuvastasi on voitu havaita henkilötietoja ({issues}). Kuva tarkistetaan ennen julkaisua.',
                required: 'Kuvasta havaittiin tietosuojan kannalta arkaluonteista sisältöä, eikä automaattista sumentamista ole käytettävissä. Kuvaa ei voida käyttää. Korvaa se toisella kuvalla tai poista se jatkaaksesi.',
                removePhoto: 'Poista kuva',
                replace: 'Vaihda kuva',
                understood: 'Jatka tällä kuvalla'
            },
            failed: {
                title: 'Kuva-analyysi ei ole käytettävissä',
                description: 'Kuvasi tarkistetaan manuaalisesti ennen julkaisua. Voit silti lähettää ilmoituksesi.'
            },
            budget_exhausted_title: 'Tekoälyanalyysi ohitettu',
            budget_exhausted_submitted: 'Tekoälyanalyysin kuukausibudjetti on käytetty. Ilmoituksesi lähetettiin onnistuneesti.'
        },
        buttons: {
            photo: 'Valokuvailmoitus',
            classic: 'Perinteinen ilmoitus',
            follow: 'Seuraa ilmoitusta',
            following: 'Seurataan',
            share: 'Jaa ilmoitus',
            print: 'Tulosta',
            flag: 'Ilmianna',
            flag_submitted: 'Jo ilmiannettu',
            copy_link: 'Kopioi linkki',
            link_copied: 'Linkki kopioitu leikepöydälle',
            email: 'Sähköposti',
            directions: 'Hae reittiohjeet'
        },
        following: {
            count: 'Seurataan {count} ilmoitusta',
            mark_all_read: 'Merkitse kaikki luetuiksi',
            no_reports: 'Ei vielä seurattuja ilmoituksia',
            no_address: 'Osoitetta ei ole saatavilla',
            status_updated: 'Tila päivitetty',
            status_changed: 'Tilaksi muutettu:',
            awaiting_server: 'Odotetaan päivitystä',
            escalated_to: 'Välitetty kohteeseen {jurisdiction}',
            escalated_click: 'Napauta avataksesi uudella toimialueella',
            unavailable: 'Tämä ilmoitus ei ole tällä hetkellä saatavilla. Tarkista lisätiedot sähköpostistasi tai ota yhteyttä meihin.',
            date: {
                today: 'Tänään',
                tomorrow: 'Huomenna',
                yesterday: 'Eilen',
                unknown: 'Tuntematon päivämäärä'
            }
        }
    },
    map: {
        tap_to_load: 'Näytä kartta napauttamalla',
        tap_to_select_location: 'Valitse sijainti napauttamalla karttaa',
        loading: 'Ladataan karttaa...',
        loading_address: 'Ladataan osoitetta...',
        retry_attempt: 'Yritys {count}',
        confirm_location: 'Vahvista sijainti',
        add_report_here: 'Lisää ilmoitus tähän',
        controls: {
            zoom: 'Zoomaussäätimet',
            zoom_in: 'Lähennä',
            zoom_out: 'Loitonna',
            find_location: 'Etsi sijaintini',
            toggle_heatmap: 'Vaihda lämpökartta',
            toggle_language: 'Vaihda kieltä',
            add_report_here: 'Ilmoita tästä',
            adjust_tilt: 'Säädä kallistusta',
            degrees: '{count} astetta',
            layers: 'Karttatasot',
            no_layers: 'Ei karttatasoja saatavilla',
            geolocation: {
                label: 'Hae nykyinen sijainti'
            }
        },
        pick: {
            drag_hint: 'Säädä sijaintia vetämällä merkkiä'
        },
        tooltip: {
            label: 'Karttatunnisteen tiedot',
            opens_form_above: 'Avaa lomakkeen yläpuolella',
            opens_modal: 'Avaa valintaikkunassa'
        },
        keyboard: {
            canvasInstructions: 'Interaktiivinen kartta ilmoitusmerkeillä. Nuolinäppäimet liikkuvat merkkien välillä, Vaihto+nuoli siirtää karttaa, Enter valitsee. Paina Ctrl+= lähentääksesi, Ctrl+- loitontaaksesi.',
            noFeatures: 'Ei merkkejä näkyvissä nykyisessä karttanäkymässä. Kokeile lähentää tai siirtää karttaa.',
            zoomedIntoCluster: 'Lähennytty ryhmän alueelle. Käytä nuolinäppäimiä merkkien välillä liikkumiseen.',
            clusterFocused: 'Ryhmässä {count} ilmoitusta. Paina Enter laajentaaksesi. {position}',
            clusterExpanded: 'Ryhmä laajennettu {count} ilmoitukseksi. {featureLabel}',
            markerFocused: 'Ilmoitus valittu: {name} osoitteessa {address}{context}. Paina Enter avataksesi tiedot. {position}',
            expandedContext: ' (laajennettu ryhmästä)',
            untitledReport: 'Nimetön ilmoitus',
            unknownLocation: 'sijainti',
            featurePosition: 'Merkki {current}/{total}.',
            pannedToExplore: 'Karttaa siirretty suuntaan {direction}. Vapauta Vaihto ja käytä nuolinäppäimiä merkkien selailuun.',
            pannedNoMarkers: 'Karttaa siirretty suuntaan {direction}. Merkkejä ei löydy tähän suuntaan. Jatka selailua nuolinäppäimillä.'
        }
    },
    detail: {
        dialog_description: 'Näytä ilmoituksen tiedot',
        location: 'Sijainti',
        photos: 'Valokuvat',
        description: 'Kuvaus',
        status_history: 'Tilahistoria',
        updates: 'Päivitykset',
        no_updates: 'Ei vielä päivityksiä',
        edit: 'Muokkaa',
        follow: {
            button: 'Seuraa',
            following: 'Seurataan',
            stop: 'Lopeta seuraaminen',
            success: 'Seuraat nyt tätä ilmoitusta',
            error: 'Virhe ilmoituksen seuraamisessa',
            updating: 'Päivitetään...'
        },
        unavailable: {
            title: 'Ilmoitus ei ole saatavilla',
            message: 'Tätä ilmoitusta ei ole olemassa tai sitä ei ole vielä julkaistu. Äskettäin lähetetyt ilmoitukset voivat kestää hetken ennen kuin ne näkyvät.'
        }
    },
    pages: {
        dialog_description: 'Näytä sivun sisältö'
    },
    stats: {
        status_overview: 'Tila',
        pie_chart: 'Jakauma',
        total_reports: 'Ilmoituksia yhteensä',
        status_distribution: 'Tilojen jakauma',
        category_distribution: 'Kategorioiden jakauma',
        uncategorized: 'Luokittelematon',
        showing_reports: 'Näytetään {visible} / {total} ilmoitusta',
        no_reports: 'Ilmoituksia ei ole saatavilla',
        open_reports: 'Avoimet ilmoitukset',
        closed_reports: 'Suljetut ilmoitukset',
        no_data_available: 'Tietoja ei ole saatavilla',
        expand: 'Näytä tiedot',
        collapse: 'Piilota tiedot',
        subcategory: 'alakategoria',
        subcategories: 'alakategoriat'
    },
    time: {
        days_ago: '{count} päivää sitten',
        just_now: 'Juuri nyt',
        minutes_ago: '{count} minuuttia sitten',
        hours_ago: '{count} tuntia sitten',
        yesterday: 'Eilen',
        today: 'Tänään'
    },
    list: {
        showing: 'Näytetään {visible} / {total} ilmoitusta',
        showing_in_area: 'Näytetään {visible} tällä alueella, yhteensä {total}',
        showing_area_only: 'Näytetään {visible} tällä alueella',
        no_results: 'Ilmoituksia ei löytynyt',
        no_filtered_results: 'Yksikään ilmoitus ei vastaa suodatusehtoja',
        load_more: 'Kaikki ilmoitukset ladattu',
        load_more_button: 'Lataa lisää',
        newest_first: 'Uusimmat ensin',
        oldest_first: 'Vanhimmat ensin',
        refresh: 'Päivitä',
        status_update: 'Tila päivitetty',
        location: 'Sijainti',
        unpublished: 'Julkaisematon',
        editable: 'Muokattavissa'
    },
    error: {
        form_error_fallback: 'Lomakkeen lataamisessa tapahtui virhe. Yritä uudelleen.',
        404: {
            title: 'Sivua ei löydy',
            description: 'Etsimääsi sivua ei ole olemassa tai se on siirretty.'
        },
        403: {
            title: 'Pääsy estetty',
            description: 'Sinulla ei ole oikeutta tarkastella tätä sivua.'
        },
        500: {
            title: 'Jotain meni pieleen',
            description: 'Tapahtui odottamaton virhe. Yritä uudelleen.'
        },
        fallback: {
            title: 'Virhe',
            description: 'Tapahtui odottamaton virhe.'
        },
        actions: {
            back: 'Takaisin',
            home: 'Etusivulle',
            retry: 'Yritä uudelleen'
        }
    },
    errors: {
        general: 'Jotain meni pieleen',
        search_failed: 'Haku epäonnistui. Yritä uudelleen.',
        api: {
            rate_limit: 'Liian monta pyyntöä. Odota hetki ja yritä uudelleen.',
            unauthorized: 'Ei valtuutusta. Kirjaudu uudelleen sisään.',
            forbidden: 'Pääsy estetty.',
            not_found: 'Resurssia ei löytynyt.',
            server_error: 'Palvelinvirhe. Yritä myöhemmin uudelleen.',
            default: 'API-virhe: {status}'
        },
        upload_failed: 'Lataus epäonnistui',
        location_error: 'Sijaintia ei voitu määrittää',
        network_error: 'Verkkovirhe',
        geolocation: {
            title: 'Sijaintivirhe',
            permission_denied: 'Sijaintilupa evätty. Salli käyttö selaimen asetuksista.',
            unavailable: 'Sijaintitiedot eivät ole tällä hetkellä käytettävissä.',
            timeout: 'Sijaintipyyntö aikakatkaistiin.',
            unknown: 'Tapahtui tuntematon sijaintivirhe.'
        },
        try_again: 'Yritä uudelleen',
        validation: {
            title: 'Valitettavasti emme voi käsitellä tätä pyyntöä:',
            location_error_title: 'Sijaintivirhe',
            invalid_input: 'Virheellinen syöte',
            duplicate_title: 'Kaksoiskappale löytyi',
            duplicate_found: 'Samankaltainen ilmoitus löytyi',
            duplicate_report: 'Samankaltainen ilmoitus on jo luotu (nro {reportId})',
            duplicate_hint_title: 'Mahdollinen kaksoiskappale löytyi',
            duplicate_hint_message: 'Tällä alueella saattaa jo olla samankaltainen ilmoitus. Voit silti lähettää, jos kyseessä on mielestäsi uusi ongelma.',
            duplicate_existing_report: 'Olemassa oleva ilmoitus: nro {reportId}',
            view_existing_report: 'Näytä olemassa oleva ilmoitus',
            submit_anyway: 'Lähetä silti',
            location_out_of_bounds: 'Valittu sijainti on toimialueemme ulkopuolella',
            required_field: '{field} on pakollinen',
            required_fields: 'Täytä kaikki pakolliset kentät',
            please_review: 'Tarkista lomake ja korjaa virheet ennen lähettämistä.',
            file_size: 'Valittu tiedosto on liian suuri (enintään 10 Mt)',
            file_type: 'Muotoa ei tueta (sallitut: jpg, png, webp)',
            media_upload: 'Kuvan lataaminen epäonnistui',
            invalid_format: 'Kentän {field} muoto ei kelpaa',
            photo_required: 'Tässä kategoriassa valokuva on pakollinen',
            consent_required: 'Hyväksy tietosuojaseloste'
        },
        rate_limit: {
            title: 'Pyyntörajat ylitetty',
            general: 'Yritä myöhemmin uudelleen.',
            with_time: 'Yritä uudelleen {seconds} sekunnin kuluttua.'
        },
        network: 'Yhteysongelma. Tarkista internetyhteytesi',
        timeout: 'Aikakatkaisu. Yritä uudelleen',
        upload: {
            title: 'Latausvirhe',
            invalid_type: 'Virheellinen tiedostotyyppi. Lataa vain kuvia.',
            file_too_large: 'Tiedosto on liian suuri. Enimmäiskoko on {size}.',
            file_too_large_raw: 'Tiedosto on liian suuri (enintään {size}). Valitse pienempi kuva.',
            optimization_failed: 'Kuvaa ei voitu pakata. Enimmäiskoko pakkaamisen jälkeen: {size}.',
            dimensions_too_large: 'Kuvan mitat ovat liian suuret. Enintään {width}x{height} pikseliä.',
            invalid_image: 'Virheellinen tai vioittunut kuvatiedosto.',
            failed: 'Lataus epäonnistui. Yritä uudelleen.',
            limit_reached: 'Tiedostojen enimmäismäärä {count} on saavutettu.',
            remove_to_add: 'Poista kuva lisätäksesi uuden',
            single_file_limit: 'Vain yksi kuva voidaan ladata.',
            exact_file_limit: 'Enintään {count} kuvaa voidaan ladata.'
        },
        submission_error: 'Virhe ilmoituksen lähettämisessä tai kuvan lataamisessa.',
        unknown: 'Tapahtui tuntematon virhe.',
        pending_uploads: 'Odota, että kaikki lataukset valmistuvat.',
        incomplete_form: 'Täytä kaikki pakolliset kentät.',
        page: {
            title: 'Virhe',
            not_found_title: 'Sivua ei löydy',
            not_found_message: 'Valitettavasti etsimääsi sivua ei ole olemassa.',
            server_error_title: 'Palvelinvirhe',
            server_error_message: 'Valitettavasti palvelimellamme tapahtui virhe.',
            generic_title: 'Tapahtui virhe',
            generic_message: 'Tapahtui odottamaton virhe.',
            action_home: 'Palaa etusivulle',
            action_back: 'Palaa takaisin',
            action_retry: 'Yritä uudelleen',
            details: 'Virheen tiedot'
        }
    },
    success: {
        report_submitted: 'Ilmoitus lähetetty',
        report_submitted_description: 'Ilmoituksesi on lähetetty onnistuneesti ja tarkistetaan pian.',
        moderation_notice:
      'Ilmoituksesi tarkistetaan ennen julkaisua. Viitenumerosi:',
        submit_another: 'Lähetä toinen ilmoitus',
        auto_followed: 'Tämä ilmoitus on lisätty automaattisesti seurattuihin ilmoituksiisi',
        visibility_limitation_notice: 'Huomaa, että kaikki ilmoitukset eivät tule julkisesti näkyviin verkkosivustolle. Jos ilmoituksesi ei päivity seurattujen ilmoitusten listassa, kaupunki on silti voinut käsitellä sen. Tarkista tilapäivitykset sähköpostistasi.',
        fun_facts: [
            '🌱 Jokainen lähettämäsi ilmoitus auttaa tekemään kaupungistasi paremman paikan asua.',
            '🏙️ Asukasilmoitukset ovat auttaneet korjaamaan yli 10 000 ongelmaa kaupungeissa ympäri maailmaa.',
            '⚡ Ilmoitus tarkistetaan keskimäärin 24 tunnin kuluessa.',
            '🤝 Olet osa yhteisöä, joka välittää julkisista tiloista.',
            '📊 Asukasilmoitusten tiedot auttavat kaupunkisuunnittelijoita tekemään parempia päätöksiä.',
            '🔄 Seuraamalla ilmoituksiasi saat automaattisesti tietoa etenemisestä.',
            '🎯 Valokuvailmoitukset käsitellään kolme kertaa nopeammin kuin pelkät teksti-ilmoitukset.',
            '🌍 Tällaisia kansalaisosallistumisen alustoja käytetään yli 50 maassa.',
            '💡 Palautteesi auttaa priorisoimaan, mitkä ongelmat korjataan ensin.',
            '🚀 Digitaalinen ilmoittaminen on lyhentänyt vasteaikoja jopa 60 prosenttia.',
            '🏆 Aktiiviset asukkaat tekevät yhteisöistä vahvempia ja kestävämpiä.',
            '🔍 Tekoälyanalyysi auttaa luokittelemaan ilmoituksesi tarkemmin.',
            '📱 Mobiili-ilmoittaminen tekee ongelmista ilmoittamisen helpoksi heti, kun huomaat ne.',
            '⭐ Kiitos aktiivisuudestasi.'
        ]
    },
    flag: {
        title: 'Ilmianna tämä ilmoitus',
        description: 'Auta meitä ylläpitämään laatua ilmoittamalla sopimattomasta sisällöstä.',
        reason_label: 'Miksi ilmiannat tämän ilmoituksen?',
        reason_spam: 'Roskaposti tai mainonta',
        reason_offensive: 'Loukkaava tai sopimaton sisältö',
        reason_personal: 'Sisältää henkilötietoja',
        reason_location: 'Väärä sijainti',
        reason_other: 'Muu',
        details_label: 'Lisätiedot',
        details_placeholder: 'Kuvaile ongelma...',
        details_required: 'Anna lisätietoja',
        submit: 'Lähetä',
        success: 'Kiitos. Tarkistamme tämän ilmoituksen.',
        error: 'Lähetys epäonnistui. Yritä uudelleen.',
        already_flagged: 'Olet jo ilmiantanut tämän ilmoituksen.'
    },

    pwa: {
        install: {
            title: 'Asenna sovellus',
            button: 'Asenna',
            not_now: 'Ei nyt',
            description:
        'Asenna sovellus napsauttamalla selaimen osoiterivin asennuskuvaketta.',
            share_button: 'Jakokuvake',
            open_safari: 'Safari-selain',
            ios: {
                title: 'Lisää aloitusnäyttöön',
                safari_instructions:
          'Napauta {icon} ja valitse "Lisää aloitusnäyttöön".',
                other_instructions:
          'Avaa tämä sivusto selaimessa {browser} asentaaksesi sen.'
            },
            chrome: {
                instructions:
          'Asenna sovellus napsauttamalla työkalupalkin asennuskuvaketta {icon}.'
            },
            edge: {
                instructions:
          'Napsauta osoiterivin asennuskuvaketta {icon}.'
            },
            firefox: {
                instructions:
          'Napsauta osoiterivin kotikuvaketta {icon}.'
            }
        }
    },
    boundaries: {
        loading: 'Ladataan aluerajatietoja...',
        error: 'Aluerajoja ei voitu tarkistaa. Yritä myöhemmin uudelleen.',
        notLoaded: 'Aluerajoja ei ole vielä ladattu',
        outsideNonStrict: 'Huomautus: valittu sijainti on alueen {locationName} rajojen ulkopuolella.',
        outsideStrict: 'Valittu sijainti on alueen {locationName} rajojen ulkopuolella. Valitse sijainti kaupungin rajojen sisältä.',
        validationUnavailable: 'Aluerajojen tarkistus ei ole käytettävissä. Ilmoituksesi hyväksytään, mutta se voidaan tarkistaa.'
    },
    filters: {
        title: 'Suodattimet',
        status: {
            title: 'Tila'
        },
        time: {
            title: 'Aika',
            today: 'Tänään',
            week: 'Tällä viikolla',
            month: 'Tässä kuussa'
        },
        category: {
            title: 'Kategoria',
            other: 'Muu'
        },
        actions: {
            more: 'Lisää suodattimia',
            expand: 'Lisää suodattimia',
            collapse: 'Vähemmän',
            clear_all: 'Tyhjennä kaikki',
            active_count: '{count} suodatinta aktiivisena',
            toggle: 'Suodattimet'
        }
    },
    privacy: {
        notice_text: 'Tietosuojatiedot löytyvät',
        notice_link_text: 'täältä',
        modal: {
            title: 'Tietosuojaseloste',
            loading: 'Ladataan tietosuojatietoja...',
            retry: 'Yritä uudelleen',
            noContent: 'Tietosuojatietoja ei ole saatavilla.',
            lastUpdated: 'Viimeksi päivitetty',
            close: 'Sulje'
        }
    },
    search: {
        placeholder: 'Etsi ilmoituksia...',
        no_results_local: 'Nykyisestä näkymästä ei löytynyt tuloksia',
        expand_to_server: 'Etsi kaikista ilmoituksista',
        expand_hint: 'Etsi nykyisen näkymän ulkopuolelta',
        searching_server: 'Etsitään kaikista ilmoituksista...'
    },
    info: {
        welcome: {
            heading: 'Tervetuloa {name}',
            headingGeneric: 'Tervetuloa',
            body: 'Käytä tätä karttaa ilmoittaaksesi ongelmista tai löytääksesi olemassa olevia ilmoituksia alueeltasi.'
        },
        shortcuts: {
            aria_label: 'Pikatoiminnot',
            photo: {
                title: 'Valokuva',
                description: 'Ota kuva, tekoäly hoitaa loput',
                aria_label: 'Luo valokuvailmoitus'
            },
            classic: {
                title: 'Perinteinen',
                description: 'Kuvaile ja paikanna ongelma',
                aria_label: 'Luo perinteinen ilmoitus'
            },
            following: {
                title: 'Seuraa',
                description: 'Pysy ajan tasalla edistymisestä',
                aria_label: 'Avaa seuratut ilmoitukset'
            },
            list: {
                title: 'Tutki',
                description: 'Katso mitä tapahtuu lähelläsi',
                aria_label: 'Tutki karttaa ja katso luettelo'
            }
        }
    },
    auth: {
        login: {
            title: 'Kirjaudu sisään',
            subtitle: 'Kirjoita sähköpostisi saadaksesi vahvistuskoodin',
            email_label: 'Sähköpostiosoite',
            email_hint: 'Lähetämme sinulle 6-numeroisen koodin',
            email_placeholder: 'sähköpostiosoite',
            send_code: 'Lähetä vahvistuskoodi',
            disabled: {
                title: 'Kirjautuminen ei ole käytettävissä',
                message: 'Salasanaton kirjautuminen ei ole käytössä täällä. Ota yhteyttä ylläpitäjään, jos tarvitset pääsyn.',
                back_button: 'Takaisin etusivulle'
            }
        },
        verify: {
            email_label: 'Sähköpostiosoite',
            code_label: 'Vahvistuskoodi',
            code_hint: 'Kirjoita sähköpostista saamasi 6-numeroinen koodi',
            code_placeholder: '123456',
            verify_button: 'Vahvista ja kirjaudu sisään',
            back_button: 'Käytä toista sähköpostia',
            request_new: 'Pyydä uusi koodi',
            resend_code: 'Lähetä koodi uudelleen',
            expires_in: 'Koodi vanhenee {time} kuluttua',
            expired_title: 'Koodi vanhentui',
            expired_message: 'Vahvistuskoodisi on vanhentunut. Pyydä uusi koodi.'
        },
        code_sent: {
            title: 'Koodi lähetetty',
            message: 'Lähetimme 6-numeroisen vahvistuskoodin osoitteeseen {email}'
        },
        error: {
            title: 'Todennusvirhe',
            request_failed: 'Vahvistuskoodin lähettäminen epäonnistui. Yritä uudelleen.',
            verify_failed: 'Virheellinen tai vanhentunut vahvistuskoodi',
            sso_failed: 'Sisäänkirjautuminen epäonnistui. Yritä uudelleen.',
            network: 'Verkkovirhe. Tarkista yhteytesi.',
            logout_failed: 'Uloskirjautuminen epäonnistui. Yritä uudelleen.'
        },
        sso: {
            completing: 'Viimeistellään sisäänkirjautumista...',
            method_label: 'Kertakirjautuminen',
            button_aria: 'Kirjaudu palvelulla {provider} kertakirjautumisen kautta'
        },
        user: {
            logged_in_as: 'Kirjautuneena käyttäjänä',
            logout: 'Kirjaudu ulos'
        },
        welcome: {
            greeting: 'Hei, {name}',
            sign_in: 'Kirjaudu sisään',
            sign_out: 'Kirjaudu ulos',
            user_avatar: 'Käyttäjän avatar'
        }
    },
    profile: {
        title: 'Profiili',
        account: {
            title: 'Tili',
            roles: 'Roolit'
        },
        groups: {
            title: 'Ryhmät'
        },
        appearance: {
            title: 'Ulkoasu',
            color_mode: 'Väritila',
            light: 'Vaalea',
            dark: 'Tumma',
            system: 'Järjestelmä',
            theme_override: 'Mukautetut teemavärit',
            theme_override_description: 'Ohita toimialueen oletusteema omilla väriasetuksillasi',
            primary_color: 'Ensisijainen väri',
            secondary_color: 'Toissijainen väri',
            neutral_color: 'Neutraali väri',
            reset_theme: 'Palauta oletus'
        },
        language: {
            title: 'Kieli',
            select: 'Valitse kieli',
            save_failed: 'Kieliasetuksen tallentaminen epäonnistui. Yritä uudelleen.'
        }
    },
    offline: {
        banner: {
            title: 'Olet offline-tilassa',
            description: 'Ilmoitukset tallennetaan paikallisesti ja synkronoidaan myöhemmin.',
            pending: '{count} ilmoitusta odottaa',
            dismiss: 'Sulje',
            states: {
                offline: {
                    title: 'Olet offline-tilassa',
                    description: 'Ilmoitukset tallennetaan paikallisesti'
                },
                syncing: {
                    title: 'Synkronoidaan...',
                    description: 'Lähetetään {count} ilmoitusta'
                },
                success: {
                    title: '{count} ilmoitusta lähetetty',
                    titleDefault: 'Synkronointi valmis'
                },
                error: {
                    title: '{count} epäonnistui',
                    description: 'Tarkista ja yritä uudelleen'
                },
                pending: {
                    title: 'Ilmoitukset valmiina lähetettäväksi'
                }
            },
            report: 'ilmoitus | ilmoitusta',
            syncNow: 'Lähetä nyt'
        },
        toast: {
            went_offline: 'Yhteys katkesi',
            went_offline_description: 'Ilmoitukset tallennetaan paikallisesti.',
            back_online: 'Takaisin verkossa',
            back_online_description: 'Yhteys palautui.',
            syncing: 'Synkronoidaan...',
            syncing_description: 'Synkronoidaan {count} ilmoitusta.',
            sync_complete: 'Synkronointi valmis',
            sync_complete_description: 'Kaikki ilmoitukset on lähetetty onnistuneesti.',
            sync_failed: 'Synkronointi epäonnistui',
            sync_failed_description: '{count} ilmoitusta ei voitu lähettää.'
        },
        status: {
            offline: 'Ei yhteyttä',
            syncing: 'Synkronoidaan...',
            pending: '{count} odottaa',
            synced: 'Synkronoitu'
        },
        sync: {
            title: 'Synkronoinnin tila',
            syncNow: 'Synkronoi nyt',
            syncing: 'Synkronoidaan...',
            offlineWarning: 'Olet offline-tilassa. Ilmoitukset synkronoidaan, kun yhteys palautuu.',
            pendingCount: '{count} ilmoitusta odottaa synkronointia',
            readyToSync: 'Valmis synkronoitavaksi',
            waitingForConnection: 'Odotetaan yhteyttä',
            failedItems: 'Epäonnistuneet lähetykset',
            untitledRequest: 'Nimetön ilmoitus',
            unknownError: 'Tuntematon virhe',
            attempts: '{count} yritystä',
            retry: 'Yritä uudelleen',
            delete: 'Poista',
            allSynced: 'Kaikki ilmoitukset synkronoitu',
            lastSync: 'Viimeisin synkronointi',
            syncSuccess: '{count} ilmoitusta synkronoitu onnistuneesti',
            syncFailed: '{count} ilmoitusta ei synkronoitunut',
            retrySuccess: 'Ilmoitus synkronoitu onnistuneesti',
            retryFailed: 'Ilmoituksen synkronointi epäonnistui',
            itemDeleted: 'Ilmoitus poistettu jonosta',
            queuedSuccess: 'Ilmoitus tallennettu',
            willSyncWhenOnline: 'Lähetetään, kun yhteys palautuu.',
            queueFailed: 'Ilmoituksen tallentaminen myöhempää lähetystä varten epäonnistui'
        },
        failed: {
            title: 'Epäonnistuneet lähetykset',
            description: 'Näitä ilmoituksia ei voitu lähettää ja ne vaativat huomiotasi.',
            empty: 'Ei epäonnistuneita lähetyksiä',
            validation_error: 'Vaatii korjauksen',
            server_error: 'Palvelinvirhe',
            edit: 'Muokkaa',
            retry: 'Yritä uudelleen',
            delete: 'Poista',
            confirm_delete: 'Haluatko varmasti poistaa tämän ilmoituksen? Tätä ei voi perua.',
            untitled: 'Nimetön ilmoitus',
            view_failed: 'Näytä epäonnistunut'
        },
        form: {
            unavailable_title: 'Lomake ei ole käytettävissä offline-tilassa',
            unavailable_description: 'Ilmoituslomakkeen lataaminen vaatii internetyhteyden. Yhdistä internetiin ja yritä uudelleen.',
            retry: 'Yritä uudelleen',
            go_back: 'Palaa takaisin',
            waiting_for_connection: 'Odotetaan yhteyttä...'
        }
    },
    legal: {
        impressum: {
            title: 'Oikeudellinen ilmoitus',
            heading: 'Oikeudellinen ilmoitus',
            responsible_heading: 'Sisällöstä vastaava',
            responsible_text: '{name} vastaa tämän alustan sisällöstä.'
        },
        privacy: {
            title: 'Tietosuojaseloste',
            heading: 'Tietosuojaseloste',
            intro: 'Henkilötietojesi suoja on meille tärkeää. Käsittelemme tietojasi vain lainsäädännön perusteella (GDPR).',
            controller_heading: 'Rekisterinpitäjä',
            data_heading: 'Kerättävät tiedot',
            data_text: 'Tätä alustaa käytettäessä käsitellään seuraavia tietoja: ilmoituksen sijaintitiedot, kuvausteksti, ladatut valokuvat ja tekniset käyttötiedot (IP-osoite, selaintyyppi, käyttöaika).',
            rights_heading: 'Oikeutesi',
            rights_text: 'Sinulla on oikeus saada pääsy tietoihin, oikaista, poistaa ja rajoittaa käsittelyä sekä oikeus tietojen siirrettävyyteen ja vastustamiseen.'
        },
        terms: {
            title: 'Käyttöehdot',
            heading: 'Käyttöehdot',
            intro: 'Käyttämällä tätä alustaa hyväksyt seuraavat ehdot.',
            purpose_heading: 'Tarkoitus',
            purpose_text: 'Tämä alusta on tarkoitettu julkisten tilojen ongelmien ilmoittamiseen. Ilmoitukset välitetään vastuulliselle viranomaiselle.',
            obligations_heading: 'Käyttäjän velvollisuudet',
            obligations_text: 'Sitoudut antamaan vain totuudenmukaisia tietoja etkä lataamaan laitonta sisältöä. Ladatut kuvat eivät saa näyttää tunnistettavia henkilöitä ilman heidän suostumustaan.',
            liability_heading: 'Vastuu',
            liability_text: '{name} ei vastaa annettujen tietojen täydellisyydestä tai oikeellisuudesta.'
        },
        email_label: 'Sähköposti',
        contact_label: 'Yhteystiedot',
        platform: {
            heading: 'Alustan ylläpitäjä',
            intro: 'Tätä alustaa ylläpitää teknisesti:',
            description: 'Civic Patches GmbH tarjoaa Mark-a-Spot-alustan teknisen infrastruktuurin.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Germany',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Tämän kartan ylläpitäjä',
            not_configured: 'Tämän kartan ylläpitäjä ei ole vielä antanut oikeudellisia tietojaan. Julkisesti käytettävien verkkopalvelujen ylläpitäjiltä voidaan edellyttää oikeudellista ilmoitusta ja tietosuojaselostetta.'
        },
        footer: {
            impressum: 'Oikeudellinen ilmoitus',
            privacy: 'Tietosuoja',
            terms: 'Käyttöehdot'
        },
        not_configured: 'Ylläpitäjän tietoja ei ole vielä määritetty.'
    },
    demo_mode: {
        banner: {
            title: 'Demoympäristö',
            message: 'Täällä tehdyt ilmoitukset eivät välity viranomaisille.',
            link_label: 'Vieraile mark-a-spot.com',
            minimize_label: 'Pienennä demohuomautus',
            expand_label: 'Avaa demohuomautus'
        },
        reset: {
            title: 'Demotietokanta',
            notice: 'Demojärjestelmä palautetaan tunnin välein.',
            countdown_label: 'Seuraava palautus',
            countdown_aria: 'Seuraava demotietokannan palautus {time} kuluttua'
        },
        modal: {
            title: 'Demolomake',
            body: 'Tämä on demo. Ilmoitustasi EI lähetetä kunnalle. Jatketaanko demolähetystä?',
            confirm_label: 'Lähetä demoilmoitus',
            cancel_label: 'Peruuta'
        },
        lite: {
            title: 'Vain demo',
            heading: 'Demoympäristö',
            body: 'Tämä on Mark-a-Spotin esittely. Lähettäminen yksinkertaisella lomakkeella on poistettu käytöstä täällä, jotta oikeat ilmoitukset eivät vahingossa päädy kunnalle.',
            link_label: 'Vieraile mark-a-spot.com'
        }
    },
    print: {
        title: 'Palvelupyyntöraportti',
        description: 'Kuvaus',
        location: 'Sijainti',
        media: 'Liitetiedostot',
        image_unavailable: 'Image unavailable',
        attributes: 'Lisäkentät',
        status_history: 'Tilahistoria',
        internal_fields: 'Sisäiset tiedot',
        organisation: 'Osasto',
        hazard_level: 'Vaarataso',
        hazard_category: 'Vaarakategoria',
        sentiment: 'Mieliala',
        printed_at: 'Tulostettu',
        showing_recent: 'Näytetään {count} / {total} päivitystä'
    }
};
