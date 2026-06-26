// locales/nl.ts
export default {
    locale: {
        code: 'nl-NL'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    hazard: {
        levels: {
            unknown: 'Onbekend',
            minor: 'Gering',
            moderate: 'Matig',
            severe: 'Ernstig',
            extreme: 'Extreem'
        },
        categories: {
            Infra: 'Infrastructuur',
            Transport: 'Vervoer',
            Safety: 'Openbare veiligheid',
            Env: 'Milieu',
            Fire: 'Brand',
            Health: 'Gezondheid',
            Geo: 'Geofysisch',
            Met: 'Meteorologisch',
            Other: 'Overig'
        }
    },
    nav: {
        map: 'Kaart',
        dashboard: 'Dashboard',
        back_to_frontend: 'Terug naar kaart'
    },
    dashboard: {
        title: 'Dashboard',
        welcome: 'Welkom, {name}',
        nav: {
            dashboard: 'Dashboard',
            requests: 'Meldingen',
            settings: 'Instellingen',
            categories: 'Categorieën',
            jurisdictions: 'Jurisdicties',
            metrics: 'Statistieken',
            status: 'Status',
            languages: 'Talen',
            billing: 'Facturering'
        },
        help: {
            docs: 'Documentatie',
            support: 'Contact opnemen met support'
        },
        settings: {
            languages_title: 'Taalinstellingen',
            languages_description: 'Configureer welke talen beschikbaar zijn en welke taal standaard wordt weergegeven voor bezoekers van deze werkruimte.',
            languages_available: 'Beschikbare talen',
            languages_default: 'Standaardtaal',
            languages_saved: 'Taalinstellingen opgeslagen.',
            languages_min_one: 'Er moet ten minste één taal geselecteerd zijn.'
        },
        user: {
            profile: 'Profiel',
            logout: 'Uitloggen'
        },
        jurisdiction: {
            current: 'Werkruimte',
            citizenView: 'Burgerweergave',
            switchTo: 'Schakel naar',
            blocked: 'geblokkeerd',
            admin_section_header: 'Alle werkruimtes (beheerderstoegang)'
        },
        stats: {
            total: 'Totaal meldingen',
            pending: 'In afwachting',
            in_progress: 'In behandeling',
            resolved: 'Opgelost',
            my_groups: 'Mijn groepen',
            overall: 'Totaal'
        },
        recent_requests: 'Recente meldingen',
        view_all: 'Bekijk alle',
        no_recent: 'Geen recente meldingen',
        wms: {
            title: 'Kaartlagen',
            attribution: 'Gegevens: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Media',
                category: 'Categorie',
                status: 'Status',
                created: 'Aangemaakt'
            }
        }
    },
    form: {
        body: 'Beschrijving',
        body_description: 'Geef een gedetailleerde beschrijving',
        body_placeholder: 'Voer een beschrijving in...',
        category: 'Categorie',
        category_description: 'Selecteer de juiste categorie voor uw melding',
        category_placeholder: 'Selecteer een categorie',
        category_disabled: {
            title: 'Categorie geselecteerd',
            description: 'U hebt de categorie "{category}" geselecteerd. Deze categorie heeft speciale vereisten of staat geen verdere formulierbewerking toe.'
        },
        category_empty: 'Geen categorieën beschikbaar',
        category_loading: 'Categorieën worden geladen...',
        category_disabled_notice: 'Deze categorie is alleen ter informatie. Meldingen zijn niet mogelijk.',
        category_description_loading: 'Beschrijving wordt geladen...',
        category_description_error: 'Fout bij laden van beschrijving',
        email: 'E-mail',
        email_description: 'Uw contactadres',
        email_placeholder: 'Voer uw e-mailadres in',
        first_name: 'Voornaam',
        first_name_description: 'Uw voornaam',
        first_name_placeholder: 'Voer uw voornaam in',
        last_name: 'Achternaam',
        last_name_description: 'Uw achternaam',
        last_name_placeholder: 'Voer uw achternaam in',
        gdpr: 'Gegevensbeschermingsovereenkomst',
        gdpr_description: 'Ik ga akkoord met de verwerking van mijn gegevens zoals beschreven in het privacybeleid.',
        object_id: 'Object-ID',
        object_id_description: 'Identificatie van het gemelde object',
        object_id_placeholder: 'Voer object-ID in (bijv. paalnummer)',
        phone: 'Telefoonnummer',
        phone_description: 'Uw contacttelefoonnummer',
        phone_placeholder: 'Voer uw telefoonnummer in',

        // Meldingen op basis van faciliteiten
        facility: 'Faciliteit',
        facility_plural: 'Faciliteiten',
        facility_placeholder: '{label} selecteren',
        facility_required: '{label} is verplicht.',
        facility_unavailable: 'De geselecteerde faciliteit is niet meer beschikbaar, selecteer opnieuw.',
        facility_nearest_snapped: 'Dichtstbijzijnde faciliteit: {label}',
        facility_no_nearby: 'Geen faciliteit in de buurt, selecteer handmatig.',
        facility_use_my_location: 'Mijn locatie gebruiken',
        facility_locating: 'Locatie bepalen…',
        facility_no_match: 'Geen faciliteit komt overeen met uw zoekopdracht.',
        facility_opens_in_new_tab: '(opent in nieuw tabblad)',
        facility_deselected_map_pick: 'Eigen locatie gebruikt in plaats van {label}',
        facility_tagged_with: 'Bij: {label}',

        imagelist: {
            empty: 'Geen afbeeldingen beschikbaar voor dit type.'
        },
        back_to_report: 'Terug naar meldingsformulier',
        requirements: {
            title: 'Nog vereist',
            ready_to_submit: 'Klaar om te verzenden',
            photo: 'Upload een foto',
            category: 'Selecteer een categorie',
            location: 'Geef een locatie op',
            description: 'Voer een beschrijving in',
            email: 'Geef een e-mailadres op',
            privacy: 'Accepteer het privacybeleid',
            privacyBlock: 'Vervang of verwijder de privacygevoelige foto',
            conditional: 'afhankelijk van categorie'
        },
        body_ai_description: 'Automatisch gegenereerd op basis van uw foto. U kunt de tekst bewerken.',
        body_ai_placeholder: 'Tekst wordt gegenereerd op basis van foto...'
    },
    validation: {
        body_required: 'Beschrijving is verplicht',
        category_required: 'Categorie is verplicht',
        email_required: 'E-mail is verplicht',
        email_format: 'Ongeldig e-mailformaat',
        first_name_required: 'Voornaam is verplicht',
        last_name_required: 'Achternaam is verplicht',
        gdpr_required: 'U moet akkoord gaan met de gegevensbeschermingsvoorwaarden',
        object_id_required: 'Object-ID is verplicht',
        phone_required: 'Telefoonnummer is verplicht',
        required_field: '{field} is verplicht'
    },
    feedback: {
        page_title: 'Feedback melding',
        error_title: 'Laadfout',
        invalid_request: 'Ongeldige of verlopen melding',
        thank_you: 'Bedankt voor uw feedback!',
        submission_received: 'Uw feedback is succesvol ontvangen',
        loading: 'Melding laden...',
        title: 'Feedback voor: {service}',
        description: 'Geef uw feedback',
        placeholder: 'Voer hier uw feedback in...',
        reopen_request: 'Ik wil dat deze melding opnieuw wordt geopend',
        submitting: 'Verzenden...',
        sending: 'Verzenden...',
        submit: 'Feedback verzenden',
        existing_title: 'Uw feedback voor: {service}',
        already_submitted: 'U hebt al feedback ingediend voor deze melding',
        missing_uuid: 'Ontbrekend meldings-ID',
        success_notification: 'Feedback succesvol verzonden',
        success_with_id: 'Feedback succesvol verzonden voor melding #{id}',
        updated_successfully: 'Feedback succesvol bijgewerkt',
        added_to_list: 'De melding is toegevoegd aan uw lijst',
        submission_error: 'Feedback verzenden mislukt',
        server_error: 'Serverfout: De feedback kon op dit moment niet worden verwerkt',
        submission_failed: 'Feedback verzenden mislukt. Probeer het later opnieuw',
        already_exists: 'Feedback bestaat al voor deze melding',
        error_fetching_request: 'Fout bij laden van meldingsgegevens',
        no_content: 'Geen feedbackinhoud',
        refresh_complete: 'Meldingslijst vernieuwd',
        try_again: 'Opnieuw proberen',
        format_unrecognized: 'Meldingsformaat niet herkend',
        processing_error: 'Fout bij verwerken meldingsgegevens',
        your_feedback: 'Uw feedback',
        contact_preference: 'Contactvoorkeur',
        no_contact: 'Geen contact',
        email_contact: 'Contact per e-mail',
        email_placeholder: 'Uw e-mailadres',
        set_status_open: 'Status op open zetten',
        set_status_open_description: 'Als u wilt dat we hier opnieuw naar kijken, kunt u deze melding heropenen.',
        email_verification: 'E-mailverificatie',
        email_verification_placeholder: 'E-mailadres van de oorspronkelijke melding',
        email_verification_description: 'Voer het e-mailadres in dat u gebruikte bij het maken van de oorspronkelijke melding.',
        email_mismatch: 'Het ingevoerde e-mailadres komt niet overeen met de oorspronkelijke melding.',
        unauthorized_access: 'Ongeautoriseerde toegang. Controleer uw e-mailadres.',
        not_eligible: 'Deze melding komt momenteel niet in aanmerking voor feedback',
        service_provider: {
            page_title: 'Reactie dienstverlener',
            page_description: 'Dien voltooiingsnotities in voor toegewezen meldingen',
            modal_title: 'Reactie dienstverlener',
            dialog_description: 'Formulier reactie dienstverlener',
            title: 'Opdracht voltooien',
            your_email: 'Uw e-mailadres',
            email_placeholder: 'aanbieder{\'@\'}voorbeeld.nl',
            email_verification_note: 'Voer uw e-mailadres van de dienstverlener in ter verificatie',
            completion_notes: 'Voltooiingsnotities',
            notes_placeholder: 'Beschrijf het uitgevoerde werk...',
            mark_as_completed: 'Markeren als voltooid',
            mark_as_completed_description: 'Zet de meldingsstatus op voltooid',
            submit_completion: 'Voltooiing indienen',
            complete_request: 'Opdracht voltooien',
            completing: 'Verzenden...',
            completion_success: 'Voltooiing melding succesvol ingediend',
            submission_failed: 'Voltooiing indienen mislukt. Probeer het later opnieuw',
            server_error: 'Serverfout: De voltooiing kon op dit moment niet worden verwerkt',
            completion_not_allowed: 'Deze melding kan op dit moment niet worden voltooid',
            email_verification_failed: 'E-mailverificatie mislukt. Controleer uw e-mailadres',
            already_completed: 'Deze melding is al voltooid',
            loading: 'Melding laden...',
            try_again: 'Opnieuw proberen',
            invalid_uuid: 'Ongeldige of verlopen melding',
            load_error: 'Fout bij laden meldingsgegevens',
            error_fetching_request: 'Fout bij laden van meldingsgegevens',
            completion_notes_required: 'Voer voltooiingsnotities in',
            existing_completions: 'Eerdere voltooiingen',
            reassignment_note: 'Deze melding is gemarkeerd voor hertoewijzing en kan meerdere voltooiingen ontvangen',
            mark_completed_description: 'Bevestig dat het werk is afgerond'
        },
        dialog_description: 'Feedbackformulier dialoogvenster'
    },
    service_unavailable: {
        title: 'Service tijdelijk niet beschikbaar',
        message: 'We kunnen momenteel geen verbinding maken met onze services. Dit probleem is waarschijnlijk tijdelijk.',
        retry: 'We ondervinden momenteel technische problemen. Probeer het over {seconds} seconden opnieuw.',
        auto_retry: 'Opnieuw proberen over {seconds} seconden...',
        retry_now: 'Nu opnieuw proberen',
        try_later: 'Probeer het later opnieuw.',
        reload: 'Opnieuw laden'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Uw melding. Onze oplossing.'
    },
    hiddenSection: {
        description: 'Ons meldingssysteem is bedoeld voor het rapporteren van infrastructuurproblemen. U kunt direct doorgaan met het melden van problemen of navigeren naar:',
        main_navigation: 'Hoofdnavigatie met informatie, een lijst met meldingen en statistieken',
        map: 'Interactieve kaart met visuele markeringen',
        map_navigation_hint: 'Gebruik pijltoetsen ⬆️⬇️⬅️➡️ om tussen meldingsmarkeringen te navigeren, Enter ↩️ om te selecteren, Escape ❌ om selectie te wissen',
        action_button: 'Direct melden',
        keyboard_navigation_hint: 'Gebruik pijltoetsen om te navigeren, Enter om te activeren',
        skip_to_main_content: 'Naar hoofdinhoud'
    },
    accessibility: {
        skip_to_main: 'Naar hoofdinhoud',
        skip_to_map: 'Naar kaart',
        skip_to_navigation: 'Naar navigatie',
        skip_to_form: 'Direct melden',
        leichte_sprache_indicator: 'Eenvoudige taal - Begrijpelijke teksten voor iedereen'
    },
    common: {
        back: 'Terug',
        not_classified: 'Niet geclassificeerd',
        no_value: 'Geen waarde',
        close: 'Sluiten',
        loading: 'Laden...',
        error: 'Fout',
        success: 'Succes',
        submit: 'Verzenden',
        cancel: 'Annuleren',
        required: 'Verplicht',
        save: 'Opslaan',
        delete: 'Verwijderen',
        edit: 'Bewerken',
        clear: 'Wissen',
        search: 'Zoeken',
        select: 'Selecteren',
        on: 'Aan',
        off: 'Uit',
        toggle: 'Schakelen',
        yesterday: 'Gisteren',
        did_you_know: 'Wist u dat?',
        show_more: 'Meer tonen',
        show_less: 'Minder tonen',
        learn_more: 'Meer informatie',
        learn_more_about: 'Meer informatie over {topic}',
        opens_in_new_tab: '(opent in nieuw tabblad)',
        title: {
            classic: 'Klassieke melding',
            photo: 'Fotomelding'
        },
        buttons: {
            toggle_theme: 'Thema wisselen',
            attribution: 'Kaartbronvermelding',
            close: 'Sluiten'
        },
        navigation: 'Navigatiepaneel',
        drawer_description: 'Inhoud- en optiepaneel',
        resize_drawer: 'Paneel aanpassen',
        drawer_position_n_of_total: 'positie {idx} van {total}',
        current: 'Huidig',
        share: 'Delen',
        copy_coordinates: 'Coördinaten kopiëren',
        open_in_maps: 'Openen in Kaarten'
    },
    fields: {
        field_geolocation: 'Locatie',
        field_gdpr: 'Toestemming gegevensverwerking',
        field_e_mail: 'E-mail',
        field_category: 'Categorie',
        field_request_media: 'Foto\'s',
        field_name: 'Achternaam',
        field_prename: 'Voornaam',
        field_first_name: 'Voornaam',
        field_first_name_placeholder: 'Voer voornaam in',
        field_last_name: 'Achternaam',
        field_last_name_placeholder: 'Voer achternaam in',
        field_phone: 'Telefoon',
        body: 'Beschrijving',
        field_add_data: 'Wedstrijddeelname',
        field_terms_of_use: 'Ik accepteer de algemene voorwaarden en het privacybeleid.',
        field_address: 'Adres',
        postal_code: 'Postcode',
        postal_code_placeholder: 'bijv. 1000 AB',
        city: 'Stad',
        city_placeholder: 'bijv. Amsterdam',
        street_address: 'Straatnaam',
        street_address_placeholder: 'bijv. Hoofdstraat 123'
    },
    competition: {
        intro: 'Als u wilt, neem deel aan onze jaarlijkse loting. U maakt kans op aantrekkelijke prijzen en geldprijzen die we als klein bedankje verdelen onder alle deelnemers.',
        disclaimer: 'Medewerkers van de verantwoordelijke afdelingen zijn uitgesloten van deelname.',
        title: 'Wedstrijddeelname',
        errors: {
            already_exists: 'Wedstrijdinzending bestaat al',
            duplicate_found: 'Duplicaat gevonden',
            duplicate_detail: 'Er is al een wedstrijdinzending aangemaakt voor deze melding.',
            not_found: 'Melding niet gevonden',
            not_found_detail: 'De bijbehorende melding kon niet worden gevonden.',
            save_failed: 'Wedstrijdinzending kon niet worden opgeslagen',
            submission_error: 'Verzendfout',
            submission_error_detail: 'Uw wedstrijdinzending kon niet worden opgeslagen, maar uw melding is succesvol verzonden.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Informatietabblad',
                panel_label: 'Informatiepaneel'
            },
            list: {
                label: 'Lijst',
                aria_label: 'Meldingslijsttabblad',
                panel_label: 'Meldingslijstpaneel'
            },
            following: {
                label: 'Volgend',
                aria_label: 'Gevolgde meldingen tabblad',
                panel_label: 'Gevolgde meldingen paneel'
            },
            stats: {
                label: 'Statistieken',
                aria_label: 'Statistiekentabblad',
                panel_label: 'Statistiekenpaneel'
            }
        },
        main: 'Hoofdnavigatie',
        pages: 'Paginanavigatie',
        browse_reports: 'Meldingen bekijken',
        back_to_form: 'Terug naar formulier',
        panel: {
            scrollable: 'Scrollbaar gebied'
        },
        updates_count: '{count} nieuwe updates'
    },
    report: {
        form_types: 'Meldingstypen',
        how_to_help: 'Zo maakt u een melding',
        title: {
            photo: 'Fotomelding',
            classic: 'Klassieke melding',
            submit: 'Melding verzenden',
            edit: 'Melding bewerken',
            view: 'Melding bekijken'
        },
        photo: {
            description: 'Maak een nieuwe melding met een foto'
        },
        classic: {
            description: 'Maak een nieuwe melding zonder foto'
        },
        status: {
            new: 'Nieuw',
            open: 'Open',
            in_progress: 'In behandeling',
            resolved: 'Opgelost',
            closed: 'Gesloten',
            unknown: 'Onbekende status'
        },
        form: {
            tabs: {
                photo: 'Met foto',
                classic: 'Klassiek'
            },
            description: {
                label: 'Beschrijving',
                placeholder: 'Beschrijf het probleem...',
                ai_processing: 'AI genereert een beschrijving...',
                help: 'Geef zo veel mogelijk details'
            },
            category: {
                label: 'Categorie',
                placeholder: 'Selecteer een categorie',
                loading: 'Categorieën laden...',
                error: 'Fout bij laden categorieën',
                empty: 'Geen categorieën beschikbaar',
                help: 'Categorieselectie (automatisch uitgevoerd)',
                description: 'Categoriebeschrijving',
                description_loading: 'Beschrijving laden...',
                description_error: 'Fout bij laden beschrijving',
                disabled_notice: 'Deze categorie is alleen ter informatie. Inzendingen zijn niet mogelijk.'
            },
            location: {
                label: 'Locatie',
                placeholder: 'Zoek een locatie...',
                selected: 'Locatie geselecteerd',
                clear: 'Locatie wissen',
                error: 'Fout bij ophalen locatie',
                help: 'Voer een adres in of klik op de kaart',
                help_modal: 'Voer een adres in of gebruik uw huidige locatie',
                current: 'Gebruik huidige locatie',
                searching: 'Zoeken...',
                pick_on_map: 'Kies op kaart',
                auto_detected: 'Locatie gedetecteerd',
                complete_address: 'Volledig adres',
                from_photo_exif: 'Locatie automatisch geëxtraheerd uit fotometadata',
                warning: 'Locatiewaarschuwing',
                unknown_location: 'Onbekende locatie',
                suggestions: 'Locatiesuggesties'
            },
            email: {
                label: 'E-mail voor updates',
                placeholder: 'Voer uw e-mailadres in',
                help: 'We sturen u updates over uw melding',
                subscribe: 'Abonneer op updates'
            },
            gdpr: {
                label: 'Toestemming gegevensverwerking',
                description: 'Ik ga akkoord met de verwerking van mijn gegevens volgens het privacybeleid.',
                required: 'U moet akkoord gaan om door te gaan',
                link: 'Bekijk privacybeleid'
            },
            media: {
                label: 'Foto\'s',
                required: 'Een foto is verplicht voor deze categorie',
                upload: {
                    overall_progress: 'Totale voortgang',
                    button: 'Klik om te uploaden',
                    or: ' of',
                    drag: 'sleep en plaats',
                    drop_here: 'Plaats bestanden hier om te uploaden',
                    restrictions: 'Tot {count} afbeeldingen ({size} max., {types})',
                    restrictions_single: 'Eén afbeelding ({size} max., {types})',
                    progress: 'Uploadvoortgang',
                    started_sr: 'Upload gestart',
                    progress_sr: 'Upload {progress}% voltooid',
                    success_sr: 'Upload succesvol voltooid',
                    error_sr: 'Upload mislukt: {error}',
                    files_selected_sr: '{count} bestand(en) geselecteerd voor upload',
                    area_label: 'Foto-uploadgebied - klik om bestanden te selecteren of sleep en plaats',
                    in_progress: 'Upload bezig',
                    complete_sr: 'Bestand is succesvol geüpload.',
                    description: 'Upload afbeeldingen door te klikken, tikken of bestanden hierheen te slepen. Ondersteunde formaten: JPEG, PNG, GIF.'
                },
                preview: 'Afbeeldingsvoorbeeld',
                remove: 'Afbeelding verwijderen',
                no_image_available: 'Geen afbeelding beschikbaar of niet weergegeven om juridische redenen',
                progress: 'Uploadvoortgang: {progress}%',
                limit_reached: 'Maximum aantal van {count} afbeeldingen bereikt',
                privacy_notice: 'Geen personen/kentekens in foto\'s a.u.b.',
                ai_analysis: 'Analyse via Azure AI (Duitsland)',
                ai_analysis_tooltip: 'Door te uploaden bevestigt u dat de foto legaal is genomen en geen rechten van derden schendt.\n\nAls personen of kentekens herkenbaar zijn, maak ze dan onherkenbaar voor upload.\n\nDe analyse dient uitsluitend om uw melding te categoriseren. Alleen een verkleinde, EXIF-vrije kopie wordt verzonden naar Azure OpenAI (Duitsland); het origineel wordt niet naar de service verzonden.',
                offline_cached: 'Offline opgeslagen',
                ai_analysis_help: 'Informatie over AI-analyse'
            },
            submit: {
                button: 'Melding verzenden',
                submitting: 'Verzenden...',
                processing: 'Verwerken...',
                success: 'Melding succesvol verzonden',
                error: 'Fout bij verzenden melding',
                loading: 'Formulier laden...'
            },
            loading: 'Meldingsformulier laden...',
            draft_saved: 'Concept opgeslagen',
            modal_description: 'Nieuwe melding aanmaken'
        },
        ai: {
            label: 'AI',
            powered: 'AI-aangedreven',
            analyzing: 'AI analyseert uw foto\'s...',
            started_sr: 'AI-analyse gestart',
            complete_sr: 'AI-analyse succesvol voltooid',
            field_updated_sr: '{field} is bijgewerkt met: {value}',
            analysis_complete_sr: 'AI-analyse voltooid.',
            category_result_sr: 'Categorie geselecteerd: {category}.',
            description_result_sr: 'Beschrijving gegenereerd: {description}',
            location_result_sr: 'Locatie gevonden: {location}.',
            category_hint: 'Deze foto lijkt niet overeen te komen met onze meldingscategorieën. Kies zelf een categorie.',
            processing: {
                analyzing: 'AI bevragen...',
                location: 'Afbeeldingsmetadata controleren...',
                location_found: 'Locatie gevonden:',
                location_ai: 'Locatie zoeken in afbeelding...',
                location_not_found: 'Locatie niet gevonden in afbeeldingsmetadata.',
                location_complete: 'Locatie geïdentificeerd',
                category: 'Categorie identificeren...',
                category_found: 'Categorie geïdentificeerd:',
                category_not_matched: 'Door AI voorgestelde categorie (selectie nodig)',
                description: 'Beschrijving genereren...',
                description_complete: 'Beschrijving gegenereerd',
                attributes_filled: '{count} extra veld(en) vooringevuld',
                complete: 'AI-analyse voltooid',
                error: 'Fout tijdens AI-analyse',
                privacy_warning: 'Privacyprobleem gedetecteerd'
            },
            privacy: {
                title: 'Privacymelding',
                description: 'Er zijn mogelijk persoonsgegevens gedetecteerd op uw foto ({issues}). De foto wordt voor publicatie gecontroleerd.',
                required: 'Op deze foto is privacygevoelige inhoud gedetecteerd waarvoor geen automatisch onherkenbaarmaken beschikbaar is. De foto kan niet worden gebruikt. Vervang hem of verwijder hem om door te gaan.',
                removePhoto: 'Foto verwijderen',
                replace: 'Foto vervangen',
                understood: 'Doorgaan met deze foto'
            },
            failed: {
                title: 'Beeldanalyse niet beschikbaar',
                description: 'Uw foto wordt handmatig gecontroleerd voor publicatie. U kunt uw melding gewoon indienen.'
            },
            budget_exhausted_title: 'AI-analyse overgeslagen',
            budget_exhausted_submitted: 'Het AI-analysebudget voor deze maand is bereikt. Uw melding is succesvol ingediend.'
        },
        buttons: {
            photo: 'Fotomelding',
            classic: 'Klassieke melding',
            follow: 'Melding volgen',
            following: 'Volgend',
            share: 'Melding delen',
            print: 'Afdrukken',
            flag: 'Melden',
            flag_submitted: 'Reeds gemeld',
            copy_link: 'Link kopiëren',
            link_copied: 'Link gekopieerd naar klembord',
            email: 'E-mail',
            directions: 'Routebeschrijving'
        },
        following: {
            count: '{count} melding(en) volgend',
            mark_all_read: 'Alles als gelezen markeren',
            no_reports: 'Nog geen gevolgde meldingen',
            no_address: 'Geen adres beschikbaar',
            status_updated: 'Status bijgewerkt',
            status_changed: 'Status gewijzigd naar:',
            awaiting_server: 'Wachten op update',
            escalated_to: 'Doorgestuurd naar {jurisdiction}',
            escalated_click: 'Tik om te openen in het nieuwe rechtsgebied',
            unavailable: 'Deze melding is momenteel niet beschikbaar. Controleer uw e-mail voor details of neem contact met ons op.',
            date: {
                today: 'Vandaag',
                tomorrow: 'Morgen',
                yesterday: 'Gisteren',
                unknown: 'Onbekende datum'
            }
        }
    },
    map: {
        tap_to_load: 'Tik om kaart te tonen',
        tap_to_select_location: 'Tik op kaart om locatie te selecteren',
        loading: 'Kaart laden...',
        loading_address: 'Adres laden...',
        retry_attempt: 'Poging {count}',
        confirm_location: 'Locatie bevestigen',
        add_report_here: 'Melding hier toevoegen',
        controls: {
            zoom_in: 'Inzoomen',
            zoom_out: 'Uitzoomen',
            find_location: 'Mijn locatie zoeken',
            toggle_heatmap: 'Heatmap wisselen',
            toggle_language: 'Taal wijzigen',
            add_report_here: 'Hier melden',
            adjust_tilt: 'Kanteling aanpassen',
            degrees: '{count} graden',
            layers: 'Kaartlagen',
            no_layers: 'Geen lagen beschikbaar',
            geolocation: {
                label: 'Huidige locatie ophalen'
            },
            zoom: 'Zoom controls'
        },
        pick: {
            drag_hint: 'Sleep markering om positie aan te passen'
        },
        tooltip: {
            label: 'Informatie over kaartmarkering',
            opens_form_above: 'Opent formulier hierboven',
            opens_modal: 'Opent in dialoogvenster'
        },
        keyboard: {
            canvasInstructions: 'Interactive map with report markers. Arrow keys navigate between markers, Shift+Arrow keys pan map to explore, Enter to select. Press Ctrl+= to zoom in, Ctrl+- to zoom out.',
            noFeatures: 'No features visible in current map view. Try zooming in or panning to find markers.',
            zoomedIntoCluster: 'Zoomed into cluster area. Use arrow keys to navigate markers.',
            clusterFocused: 'Focused on cluster with {count} reports. Press Enter to expand. {position}',
            clusterExpanded: 'Cluster expanded into {count} reports. {featureLabel}',
            markerFocused: 'Focused on report: {name} at {address}{context}. Press Enter to open details. {position}',
            expandedContext: ' (expanded from cluster)',
            untitledReport: 'Untitled report',
            unknownLocation: 'location',
            featurePosition: 'Feature {current} of {total}.',
            pannedToExplore: 'Panned map {direction} to explore. Release Shift and use arrow keys to navigate markers.',
            pannedNoMarkers: 'Panned map {direction}. No markers found in this direction - use arrow keys to continue exploring.'
        }
    },
    detail: {
        location: 'Locatie',
        photos: 'Foto\'s',
        description: 'Beschrijving',
        status_history: 'Statusgeschiedenis',
        updates: 'Updates',
        no_updates: 'Nog geen updates',
        edit: 'Bewerken',
        follow: {
            button: 'Volgen',
            following: 'Volgend',
            stop: 'Stoppen met volgen',
            success: 'U volgt nu deze melding',
            error: 'Fout bij volgen melding',
            updating: 'Bijwerken...'
        },
        unavailable: {
            title: 'Melding niet beschikbaar',
            message: 'Deze melding bestaat niet of is nog niet gepubliceerd. Nieuw ingediende meldingen kunnen even duren voordat ze verschijnen.'
        },
        dialog_description: 'Meldingsdetails bekijken'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Verdeling',
        total_reports: 'Totaal meldingen',
        status_distribution: 'Statusverdeling',
        category_distribution: 'Categorieverdeling',
        uncategorized: 'Ongecategoriseerd',
        showing_reports: '{visible} van {total} meldingen weergegeven',
        no_reports: 'Geen meldingen beschikbaar',
        open_reports: 'Open meldingen',
        closed_reports: 'Gesloten meldingen',
        no_data_available: 'Geen gegevens beschikbaar',
        expand: 'Details tonen',
        collapse: 'Details verbergen',
        subcategory: 'subcategorie',
        subcategories: 'subcategorieën'
    },
    time: {
        days_ago: '{count} dagen geleden',
        just_now: 'Zojuist',
        minutes_ago: '{count} minuten geleden',
        hours_ago: '{count} uur geleden',
        yesterday: 'Gisteren',
        today: 'Vandaag'
    },
    list: {
        showing: '{visible} van {total} meldingen weergegeven',
        showing_in_area: '{visible} in dit gebied, {total} totaal',
        showing_area_only: '{visible} in dit gebied',
        no_results: 'Geen meldingen gevonden',
        no_filtered_results: 'Geen meldingen voldoen aan uw filtercriteria',
        load_more: 'Alle meldingen geladen',
        load_more_button: 'Meer laden',
        newest_first: 'Nieuwste eerst',
        oldest_first: 'Oudste eerst',
        refresh: 'Vernieuwen',
        status_update: 'Status bijgewerkt',
        location: 'Locatie',
        unpublished: 'Niet gepubliceerd',
        editable: 'Bewerkbaar'
    },
    errors: {
        general: 'Er ging iets mis',
        search_failed: 'Zoekopdracht mislukt. Probeer het opnieuw.',
        api: {
            rate_limit: 'Te veel verzoeken. Wacht even en probeer het opnieuw.',
            unauthorized: 'Niet geautoriseerd. Log opnieuw in.',
            forbidden: 'Toegang geweigerd.',
            not_found: 'Bron niet gevonden.',
            server_error: 'Serverfout. Probeer het later opnieuw.',
            default: 'API-fout: {status}'
        },
        upload_failed: 'Upload mislukt',
        location_error: 'Kan locatie niet bepalen',
        network_error: 'Netwerkfout',
        geolocation: {
            title: 'Locatiefout',
            permission_denied: 'Locatietoegang geweigerd. Sta toegang toe in uw browserinstellingen.',
            unavailable: 'Locatie-informatie is momenteel niet beschikbaar.',
            timeout: 'Locatieverzoek is verlopen.',
            unknown: 'Er is een onbekende locatiefout opgetreden.'
        },
        try_again: 'Probeer het opnieuw',
        validation: {
            title: 'Sorry, we kunnen dit verzoek niet verwerken:',
            location_error_title: 'Locatiefout',
            invalid_input: 'Ongeldige invoer',
            duplicate_title: 'Duplicaat gevonden',
            duplicate_found: 'Vergelijkbare melding gevonden',
            duplicate_report: 'Een vergelijkbare melding is al aangemaakt (Nr. {reportId})',
            location_out_of_bounds: 'De geselecteerde locatie ligt buiten onze jurisdictie',
            required_field: '{field} is verplicht',
            required_fields: 'Vul alle verplichte velden in',
            please_review: 'Controleer het formulier en corrigeer eventuele fouten voor verzending.',
            file_size: 'Het geselecteerde bestand is te groot (max. 10 MB)',
            file_type: 'Het formaat wordt niet ondersteund (toegestaan: jpg, png, webp)',
            media_upload: 'Fout bij uploaden afbeelding',
            invalid_format: 'Ongeldig formaat voor {field}',
            photo_required: 'Een foto is verplicht voor deze categorie',
            duplicate_hint_title: 'Mogelijk duplicaat gevonden',
            duplicate_hint_message: 'In dit gebied bestaat mogelijk al een vergelijkbare melding. U kunt toch indienen als u denkt dat het een nieuw probleem is.',
            duplicate_existing_report: 'Bestaande melding: Nr. {reportId}',
            view_existing_report: 'Bestaande melding bekijken',
            submit_anyway: 'Toch indienen',
            consent_required: 'Accepteer het privacybeleid'
        },
        rate_limit: {
            title: 'Limiet overschreden',
            general: 'Probeer het later opnieuw.',
            with_time: 'Probeer het over {seconds} seconden opnieuw.'
        },
        network: 'Verbindingsprobleem. Controleer uw internetverbinding',
        timeout: 'Time-out. Probeer het opnieuw',
        upload: {
            invalid_type: 'Ongeldig bestandstype. Upload alleen afbeeldingen.',
            file_too_large: 'Bestand te groot. Maximale grootte is {size}.',
            dimensions_too_large: 'Afbeeldingsafmetingen te groot. Maximaal {width}x{height} pixels.',
            invalid_image: 'Ongeldig of beschadigd afbeeldingsbestand.',
            failed: 'Upload mislukt. Probeer het opnieuw.',
            limit_reached: 'Maximum aantal van {count} bestanden bereikt.',
            remove_to_add: 'Verwijder een foto om een nieuwe toe te voegen',
            single_file_limit: 'Er kan slechts één afbeelding worden geüpload.',
            exact_file_limit: 'Er kunnen maximaal {count} afbeeldingen worden geüpload.',
            title: 'Uploadfout',
            file_too_large_raw: 'Bestand te groot ({size} maximum). Kies een kleinere afbeelding.',
            optimization_failed: 'Afbeelding kon niet worden gecomprimeerd. Maximale grootte na compressie: {size}.'
        },
        submission_error: 'Fout bij verzenden of uploaden van de afbeelding.',
        unknown: 'Er is een onbekende fout opgetreden.',
        pending_uploads: 'Wacht tot alle uploads zijn voltooid.',
        incomplete_form: 'Vul alle verplichte velden in.',
        page: {
            title: 'Fout',
            not_found_title: 'Pagina niet gevonden',
            not_found_message: 'Sorry, de pagina die u zoekt bestaat niet.',
            server_error_title: 'Serverfout',
            server_error_message: 'Sorry, er is iets misgegaan op onze server.',
            generic_title: 'Fout opgetreden',
            generic_message: 'Er is een onverwachte fout opgetreden.',
            action_home: 'Terug naar home',
            action_back: 'Ga terug',
            action_retry: 'Opnieuw proberen',
            details: 'Foutdetails'
        }
    },
    success: {
        report_submitted: 'Melding verzonden',
        report_submitted_description: 'Uw melding is succesvol verzonden en wordt binnenkort beoordeeld.',
        moderation_notice: 'Uw melding wordt beoordeeld voor publicatie. Uw referentienummer:',
        submit_another: 'Nog een melding indienen',
        auto_followed: 'Deze melding is automatisch toegevoegd aan uw gevolgde meldingen',
        visibility_limitation_notice: 'Let op: niet alle meldingen worden publiekelijk zichtbaar via de website. Als uw melding niet bijwerkt in de gevolgde meldingen, kan deze alsnog door de gemeente zijn verwerkt. Controleer uw e-mail voor statusupdates.',
        fun_facts: [
            'Elke melding die u indient, helpt uw stad een betere plek maken om te wonen!',
            'Burgermeldingen hebben geholpen om meer dan 10.000 problemen wereldwijd op te lossen.',
            'De gemiddelde melding wordt binnen 24 uur beoordeeld.',
            'U maakt deel uit van een gemeenschap die geeft om openbare ruimtes!',
            'Gegevens van burgermeldingen helpen stadsplanners betere beslissingen te nemen.',
            'Door meldingen te volgen blijft u automatisch op de hoogte van de voortgang.',
            'Fotomeldingen worden 3x sneller verwerkt dan meldingen zonder foto.',
            'Burgerparticipatieplatforms zoals deze bestaan in meer dan 50 landen.',
            'Uw feedback helpt prioriteren welke problemen eerst worden opgelost.',
            'Digitaal melden heeft reactietijden tot 60% verkort.',
            'Actieve burgers maken sterkere, veerkrachtigere gemeenschappen.',
            'AI-analyse helpt uw meldingen nauwkeuriger te categoriseren.',
            'Mobiel melden maakt het gemakkelijk om problemen te melden zodra u ze ziet.',
            'Bedankt dat u een betrokken burger bent!'
        ]
    },
    flag: {
        title: 'Deze melding rapporteren',
        description: 'Help ons de kwaliteit te bewaken door ongepaste inhoud te melden.',
        reason_label: 'Waarom meldt u deze melding?',
        reason_spam: 'Spam of reclame',
        reason_offensive: 'Aanstootgevende of ongepaste inhoud',
        reason_personal: 'Bevat persoonsgegevens',
        reason_location: 'Verkeerde locatie',
        reason_other: 'Anders',
        details_label: 'Aanvullende details',
        details_placeholder: 'Beschrijf het probleem...',
        details_required: 'Geef alstublieft details',
        submit: 'Verzenden',
        success: 'Bedankt. We zullen deze melding beoordelen.',
        error: 'Kon niet verzenden. Probeer het opnieuw.',
        already_flagged: 'U heeft deze melding al gemeld.'
    },

    pwa: {
        install: {
            title: 'App installeren',
            button: 'Installeren',
            not_now: 'Niet nu',
            description: 'Klik op het installatiepictogram in de adresbalk van uw browser om deze app te installeren.',
            share_button: 'Deelpictogram',
            open_safari: 'Safari-browser',
            ios: {
                title: 'Toevoegen aan beginscherm',
                safari_instructions: 'Tik op {icon} en selecteer "Zet op beginscherm".',
                other_instructions: 'Open deze site in {browser} om te installeren.'
            },
            chrome: {
                instructions: 'Klik op het installatiepictogram {icon} in de werkbalk om deze app te installeren.'
            },
            edge: {
                instructions: 'Klik op het installatiepictogram {icon} in de adresbalk.'
            },
            firefox: {
                instructions: 'Klik op het home-pictogram {icon} in de adresbalk.'
            }
        }
    },
    boundaries: {
        loading: 'Grensgegevens laden...',
        error: 'Kan locatiegrenzen niet valideren. Probeer het later opnieuw.',
        notLoaded: 'Grenzen nog niet geladen',
        outsideNonStrict: 'Let op: Geselecteerde locatie ligt buiten de grenzen van {locationName}.',
        outsideStrict: 'Geselecteerde locatie ligt buiten de grenzen van {locationName}. Selecteer een locatie binnen de stadsgrenzen.',
        validationUnavailable: 'Grensvalidatie niet beschikbaar. Uw melding wordt geaccepteerd maar kan worden gecontroleerd.'
    },
    filters: {
        title: 'Filters',
        status: {
            title: 'Status'
        },
        time: {
            title: 'Tijd',
            today: 'Vandaag',
            week: 'Deze week',
            month: 'Deze maand'
        },
        category: {
            title: 'Categorie',
            other: 'Overig'
        },
        actions: {
            more: 'Meer filters',
            expand: 'Meer filters',
            collapse: 'Minder',
            clear_all: 'Alles wissen',
            active_count: '{count} filters actief',
            toggle: 'Filters'
        }
    },
    privacy: {
        notice_text: 'Informatie over privacy vindt u',
        notice_link_text: 'hier',
        modal: {
            title: 'Privacybeleid',
            loading: 'Privacy-informatie laden...',
            retry: 'Opnieuw proberen',
            noContent: 'Geen privacy-informatie beschikbaar.',
            lastUpdated: 'Laatst bijgewerkt',
            close: 'Sluiten'
        }
    },
    search: {
        placeholder: 'Meldingen zoeken...',
        no_results_local: 'Geen resultaten gevonden in huidige weergave',
        expand_to_server: 'Alle meldingen doorzoeken',
        expand_hint: 'Zoeken buiten huidige weergave',
        searching_server: 'Alle meldingen doorzoeken...'
    },
    info: {
        welcome: {
            heading: 'Welkom bij {name}',
            headingGeneric: 'Welkom',
            body: 'Gebruik deze kaart om problemen te melden of bestaande meldingen in uw omgeving te bekijken.'
        },
        shortcuts: {
            aria_label: 'Snelle acties',
            photo: {
                title: 'Foto',
                description: 'Maak een foto, de AI doet de rest',
                aria_label: 'Een fotomelding maken'
            },
            classic: {
                title: 'Klassiek',
                description: 'Beschrijf en lokaliseer het probleem',
                aria_label: 'Een klassieke melding maken'
            },
            following: {
                title: 'Volgen',
                description: 'Blijf op de hoogte van de voortgang',
                aria_label: 'Gevolgde meldingen openen'
            },
            list: {
                title: 'Verkennen',
                description: 'Zie wat er in uw buurt gebeurt',
                aria_label: 'De kaart verkennen en de lijst bekijken'
            }
        }
    },
    auth: {
        login: {
            title: 'Inloggen',
            subtitle: 'Voer uw e-mail in om een verificatiecode te ontvangen',
            email_label: 'E-mailadres',
            email_hint: 'We sturen u een 6-cijferige code',
            email_placeholder: 'e-mailadres',
            send_code: 'Verificatiecode verzenden',
            disabled: {
                title: 'Aanmelden niet beschikbaar',
                message: 'Wachtwoordloos aanmelden is hier niet ingeschakeld. Neem contact op met de beheerder als u toegang nodig heeft.',
                back_button: 'Terug naar home'
            }
        },
        verify: {
            email_label: 'E-mailadres',
            code_label: 'Verificatiecode',
            code_hint: 'Voer de 6-cijferige code uit uw e-mail in',
            code_placeholder: '123456',
            verify_button: 'Verifiëren en inloggen',
            back_button: 'Andere e-mail gebruiken',
            request_new: 'Nieuwe code aanvragen',
            resend_code: 'Code opnieuw verzenden',
            expires_in: 'Code verloopt over {time}',
            expired_title: 'Code verlopen',
            expired_message: 'Uw verificatiecode is verlopen. Vraag een nieuwe aan.'
        },
        code_sent: {
            title: 'Code verzonden',
            message: 'We hebben een 6-cijferige verificatiecode verzonden naar {email}'
        },
        error: {
            title: 'Authenticatiefout',
            request_failed: 'Verificatiecode verzenden mislukt. Probeer het opnieuw.',
            verify_failed: 'Ongeldige of verlopen verificatiecode',
            sso_failed: 'Aanmelden mislukt. Probeer het opnieuw.',
            network: 'Netwerkfout. Controleer uw verbinding.',
            logout_failed: 'Uitloggen mislukt. Probeer het opnieuw.'
        },
        sso: {
            completing: 'Aanmelden afronden...',
            method_label: 'Single sign-on',
            button_aria: 'Aanmelden met {provider} via single sign-on'
        },
        user: {
            logged_in_as: 'Ingelogd als',
            logout: 'Uitloggen'
        },
        welcome: {
            greeting: 'Hallo, {name}',
            sign_in: 'Inloggen',
            sign_out: 'Uitloggen',
            user_avatar: 'Gebruikersavatar'
        }
    },
    profile: {
        title: 'Profiel',
        account: {
            title: 'Account',
            roles: 'Rollen'
        },
        groups: {
            title: 'Groepen'
        },
        appearance: {
            title: 'Weergave',
            color_mode: 'Kleurmodus',
            light: 'Licht',
            dark: 'Donker',
            system: 'Systeem',
            theme_override: 'Aangepaste themakleuren',
            theme_override_description: 'Overschrijf het standaard jurisdictiethema met uw eigen kleurvoorkeuren',
            primary_color: 'Primaire kleur',
            secondary_color: 'Secundaire kleur',
            neutral_color: 'Neutrale kleur',
            reset_theme: 'Naar standaard'
        },
        language: {
            title: 'Taal',
            select: 'Selecteer taal',
            save_failed: 'Taalvoorkeur kon niet worden opgeslagen. Probeer het opnieuw.'
        }
    },
    service_provider: {
        page_title: 'Reactie dienstverlener',
        page_description: 'Dien voltooiingsnotities in voor toegewezen meldingen',
        modal_title: 'Reactie dienstverlener',
        dialog_description: 'Formulier reactie dienstverlener',
        title: 'Opdracht voltooien',
        your_email: 'Uw e-mailadres',
        email_placeholder: 'aanbieder{\'@\'}voorbeeld.nl',
        email_verification_note: 'Voer uw e-mailadres van de dienstverlener in ter verificatie',
        completion_notes: 'Voltooiingsnotities',
        notes_placeholder: 'Beschrijf het uitgevoerde werk...',
        mark_as_completed: 'Markeren als voltooid',
        mark_as_completed_description: 'Zet de meldingsstatus op voltooid',
        submit_completion: 'Voltooiing indienen',
        complete_request: 'Opdracht voltooien',
        completing: 'Verzenden...',
        completion_success: 'Voltooiing melding succesvol ingediend',
        submission_failed: 'Voltooiing indienen mislukt. Probeer het later opnieuw',
        server_error: 'Serverfout: De voltooiing kon op dit moment niet worden verwerkt',
        completion_not_allowed: 'Deze melding kan op dit moment niet worden voltooid',
        email_verification_failed: 'E-mailverificatie mislukt. Controleer uw e-mailadres',
        already_completed: 'Deze melding is al voltooid',
        loading: 'Melding laden...',
        try_again: 'Opnieuw proberen',
        invalid_uuid: 'Ongeldige of verlopen melding',
        load_error: 'Fout bij laden meldingsgegevens',
        error_fetching_request: 'Fout bij laden van meldingsgegevens',
        completion_notes_required: 'Voer voltooiingsnotities in',
        existing_completions: 'Eerdere voltooiingen',
        reassignment_note: 'Deze melding is gemarkeerd voor hertoewijzing en kan meerdere voltooiingen ontvangen'
    },
    pages: {
        dialog_description: 'Pagina-inhoud bekijken'
    },
    offline: {
        banner: {
            title: 'U bent offline',
            description: 'Meldingen worden lokaal opgeslagen en later gesynchroniseerd.',
            pending: '{count} melding(en) in wachtrij',
            dismiss: 'Sluiten',
            states: {
                offline: {
                    title: 'U bent offline',
                    description: 'Meldingen worden lokaal opgeslagen'
                },
                syncing: {
                    title: 'Synchroniseren...',
                    description: '{count} melding(en) verzenden'
                },
                success: {
                    title: '{count} melding(en) verzonden',
                    titleDefault: 'Synchronisatie voltooid'
                },
                error: {
                    title: '{count} mislukt',
                    description: 'Controleer en probeer opnieuw'
                },
                pending: {
                    title: 'Meldingen klaar om te verzenden'
                }
            },
            report: 'melding | meldingen',
            syncNow: 'Nu verzenden'
        },
        toast: {
            went_offline: 'Verbinding verbroken',
            went_offline_description: 'Meldingen worden lokaal opgeslagen.',
            back_online: 'Weer online',
            back_online_description: 'Verbinding hersteld.',
            syncing: 'Synchroniseren...',
            syncing_description: '{count} melding(en) synchroniseren.',
            sync_complete: 'Synchronisatie voltooid',
            sync_complete_description: 'Alle meldingen zijn succesvol verzonden.',
            sync_failed: 'Synchronisatie mislukt',
            sync_failed_description: '{count} melding(en) konden niet worden verzonden.'
        },
        status: {
            offline: 'Offline',
            syncing: 'Synchroniseren...',
            pending: '{count} in wachtrij',
            synced: 'Gesynchroniseerd'
        },
        sync: {
            title: 'Synchronisatiestatus',
            syncNow: 'Nu synchroniseren',
            syncing: 'Synchroniseren...',
            offlineWarning: 'U bent offline. Meldingen worden gesynchroniseerd zodra de verbinding is hersteld.',
            pendingCount: '{count} melding(en) wachten op synchronisatie',
            readyToSync: 'Klaar om te synchroniseren',
            waitingForConnection: 'Wachten op verbinding',
            failedItems: 'Mislukte verzendingen',
            untitledRequest: 'Melding zonder titel',
            unknownError: 'Onbekende fout',
            attempts: '{count} poging(en)',
            retry: 'Opnieuw proberen',
            delete: 'Verwijderen',
            allSynced: 'Alle meldingen gesynchroniseerd',
            lastSync: 'Laatste synchronisatie',
            syncSuccess: '{count} melding(en) succesvol gesynchroniseerd',
            syncFailed: '{count} melding(en) konden niet worden gesynchroniseerd',
            retrySuccess: 'Melding succesvol gesynchroniseerd',
            retryFailed: 'Synchroniseren van melding mislukt',
            itemDeleted: 'Melding verwijderd uit wachtrij',
            queuedSuccess: 'Melding opgeslagen',
            willSyncWhenOnline: 'Wordt verzonden zodra de verbinding is hersteld.',
            queueFailed: 'Melding kon niet worden opgeslagen voor later'
        },
        failed: {
            title: 'Mislukte verzendingen',
            description: 'Deze meldingen konden niet worden verzonden en vereisen uw aandacht.',
            empty: 'Geen mislukte verzendingen',
            validation_error: 'Correctie vereist',
            server_error: 'Serverfout',
            edit: 'Bewerken',
            retry: 'Opnieuw proberen',
            delete: 'Verwijderen',
            confirm_delete: 'Weet u zeker dat u deze melding wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
            untitled: 'Melding zonder titel',
            view_failed: 'Mislukte bekijken'
        },
        form: {
            unavailable_title: 'Formulier niet beschikbaar offline',
            unavailable_description: 'Het meldingsformulier vereist een internetverbinding om te laden. Maak verbinding met het internet en probeer het opnieuw.',
            retry: 'Opnieuw proberen',
            go_back: 'Terug',
            waiting_for_connection: 'Wachten op verbinding...'
        }
    },
    sentiment: {
        frustrated: 'Gefrustreerd',
        neutral: 'Neutraal',
        positive: 'Positief'
    },
    contact: {
        title: 'Contact',
        dialog_description: 'Contactformulier',
        name: 'Naam',
        name_placeholder: 'Uw naam',
        email: 'E-mail',
        email_placeholder: 'Uw e-mailadres',
        message: 'Bericht',
        message_placeholder: 'Uw bericht...',
        copy_label: 'Stuur een kopie naar mijn e-mailadres',
        gdpr_label: 'Ik ga akkoord met de verwerking van mijn gegevens',
        gdpr_required: 'Ga akkoord met de gegevensverwerking',
        submit: 'Bericht verzenden',
        sending: 'Verzenden...',
        success_title: 'Bericht verzonden',
        success_message: 'Bedankt voor uw bericht. We nemen zo spoedig mogelijk contact met u op.',
        submission_failed: 'Bericht kon niet worden verzonden. Probeer het later opnieuw.',
        flood_error: 'Te veel verzoeken. Probeer het later opnieuw.',
        required_field: '{field} is verplicht',
        invalid_email: 'Voer een geldig e-mailadres in',
        close: 'Sluiten',
        new_message: 'Nieuw bericht'
    },
    error: {
        form_error_fallback: 'Er is een fout opgetreden bij het laden van het formulier. Probeer het opnieuw.',
        404: {
            title: 'Pagina niet gevonden',
            description: 'De pagina die je zoekt bestaat niet of is verplaatst.'
        },
        403: {
            title: 'Toegang geweigerd',
            description: 'Je hebt geen toestemming om deze pagina te bekijken.'
        },
        500: {
            title: 'Er is iets misgegaan',
            description: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.'
        },
        fallback: {
            title: 'Fout',
            description: 'Er is een onverwachte fout opgetreden.'
        },
        actions: {
            back: 'Terug',
            home: 'Naar de startpagina',
            retry: 'Opnieuw proberen'
        }
    },
    legal: {
        impressum: {
            title: 'Juridische kennisgeving',
            heading: 'Juridische kennisgeving',
            responsible_heading: 'Verantwoordelijk voor de inhoud',
            responsible_text: '{name} is verantwoordelijk voor de inhoud van dit platform.'
        },
        privacy: {
            title: 'Privacybeleid',
            heading: 'Privacybeleid',
            intro: 'De bescherming van uw persoonsgegevens is belangrijk voor ons. Wij verwerken uw gegevens uitsluitend op basis van wettelijke bepalingen (AVG).',
            controller_heading: 'Verwerkingsverantwoordelijke',
            data_heading: 'Verzamelde gegevens',
            data_text: 'Bij het gebruik van dit platform worden de volgende gegevens verwerkt: locatiegegevens van de melding, beschrijvingstekst, geüploade foto\'s en technische toegangsgegevens (IP-adres, browsertype, tijdstip van toegang).',
            rights_heading: 'Uw rechten',
            rights_text: 'U heeft het recht op inzage, rectificatie, wissing, beperking van de verwerking, gegevensoverdraagbaarheid en bezwaar.'
        },
        terms: {
            title: 'Gebruiksvoorwaarden',
            heading: 'Gebruiksvoorwaarden',
            intro: 'Door dit platform te gebruiken, stemt u in met de volgende voorwaarden.',
            purpose_heading: 'Doel',
            purpose_text: 'Dit platform dient voor het melden van problemen in de openbare ruimte. Meldingen worden doorgestuurd naar de verantwoordelijke instantie.',
            obligations_heading: 'Verplichtingen van de gebruiker',
            obligations_text: 'U stemt ermee in alleen waarheidsgetrouwe informatie te verstrekken en geen illegale inhoud te uploaden. Geüploade foto\'s mogen geen herkenbare personen tonen zonder hun toestemming.',
            liability_heading: 'Aansprakelijkheid',
            liability_text: '{name} aanvaardt geen aansprakelijkheid voor de volledigheid en juistheid van de verstrekte informatie.'
        },
        email_label: 'E-mail',
        contact_label: 'Contact',
        platform: {
            heading: 'Platformbeheerder',
            intro: 'Dit platform wordt technisch beheerd door:',
            description: 'Civic Patches GmbH levert de technische infrastructuur voor het Mark-a-Spot platform.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Duitsland',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Beheerder van deze kaart',
            not_configured: 'De beheerder van deze kaart heeft nog geen juridische informatie verstrekt. Beheerders van openbaar toegankelijke online diensten zijn mogelijk verplicht een colofon en privacyverklaring te verstrekken.'
        },
        footer: {
            impressum: 'Juridische kennisgeving',
            privacy: 'Privacy',
            terms: 'Gebruiksvoorwaarden'
        },
        not_configured: 'De gegevens van de beheerder zijn nog niet geconfigureerd.'
    },
    demo_mode: {
        banner: {
            title: 'Demo-omgeving',
            message: 'Meldingen die hier worden ingevoerd, worden niet doorgestuurd naar een gemeente.',
            link_label: 'mark-a-spot.com bezoeken',
            minimize_label: 'Demo-melding verkleinen',
            expand_label: 'Demo-melding uitklappen'
        },
        reset: {
            title: 'Demo-database',
            notice: 'Het demosysteem wordt elk uur gereset.',
            countdown_label: 'Volgende reset over',
            countdown_aria: 'Volgende reset van de demo-database over {time}'
        },
        modal: {
            title: 'Demo-inzending',
            body: 'Dit is een demo. Uw melding wordt NIET doorgestuurd naar de gemeente. Doorgaan met de demo-inzending?',
            confirm_label: 'Demo-melding versturen',
            cancel_label: 'Annuleren'
        },
        lite: {
            title: 'Alleen demo',
            heading: 'Demo-omgeving',
            body: 'Dit is een demonstratie van Mark-a-Spot. Inzendingen via het lite-formulier zijn hier uitgeschakeld zodat echte meldingen nooit per ongeluk een gemeente bereiken.',
            link_label: 'mark-a-spot.com bezoeken'
        }
    },
    print: {
        title: 'Rapport serviceverzoek',
        description: 'Beschrijving',
        location: 'Locatie',
        media: 'Media',
        image_unavailable: 'Image unavailable',
        attributes: 'Aanvullende velden',
        status_history: 'Statusgeschiedenis',
        internal_fields: 'Interne informatie',
        organisation: 'Afdeling',
        hazard_level: 'Gevaarsniveau',
        hazard_category: 'Gevaarscategorie',
        sentiment: 'Sentiment',
        printed_at: 'Afgedrukt op',
        showing_recent: '{count} van {total} updates weergegeven'
    }
};
