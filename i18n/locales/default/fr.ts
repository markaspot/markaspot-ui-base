export default {
    locale: {
        code: 'fr-FR'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    hazard: {
        levels: {
            unknown: 'Inconnu',
            minor: 'Mineur',
            moderate: 'Modéré',
            severe: 'Grave',
            extreme: 'Extrême'
        },
        categories: {
            Infra: 'Infrastructure',
            Transport: 'Transport',
            Safety: 'Sécurité publique',
            Env: 'Environnement',
            Fire: 'Incendie',
            Health: 'Santé',
            Geo: 'Géophysique',
            Met: 'Météorologique',
            Other: 'Autre'
        }
    },
    nav: {
        map: 'Carte',
        dashboard: 'Tableau de bord',
        back_to_frontend: 'Retour à la carte'
    },
    dashboard: {
        title: 'Tableau de bord',
        welcome: 'Bienvenue, {name}',
        nav: {
            dashboard: 'Tableau de bord',
            requests: 'Signalements',
            settings: 'Paramètres',
            categories: 'Catégories',
            jurisdictions: 'Juridictions',
            metrics: 'Métriques',
            status: 'Statut',
            languages: 'Langues',
            billing: 'Facturation'
        },
        help: {
            docs: 'Documentation',
            support: 'Contacter le support'
        },
        settings: {
            languages_title: 'Paramètres de langue',
            languages_description: 'Configurez les langues disponibles et la langue affichée par défaut aux visiteurs de cet espace de travail.',
            languages_available: 'Langues disponibles',
            languages_default: 'Langue par défaut',
            languages_saved: 'Paramètres de langue enregistrés.',
            languages_min_one: 'Au moins une langue doit être sélectionnée.'
        },
        user: {
            profile: 'Profil',
            logout: 'Déconnexion'
        },
        stats: {
            total: 'Total des signalements',
            pending: 'En attente',
            in_progress: 'En cours',
            resolved: 'Résolus',
            my_groups: 'Mes groupes',
            overall: 'Global'
        },
        recent_requests: 'Signalements récents',
        view_all: 'Voir tout',
        no_recent: 'Aucun signalement récent',
        wms: {
            title: 'Couches de carte',
            attribution: 'Données : GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Médias',
                category: 'Catégorie',
                status: 'Statut',
                created: 'Créé'
            }
        },
        jurisdiction: {
            current: 'Espace de travail',
            citizenView: 'Vue citoyen',
            switchTo: 'Passer à',
            blocked: 'bloqué',
            admin_section_header: 'Tous les espaces de travail (accès administrateur)'
        }
    },
    form: {
        body: 'Description',
        body_description: 'Veuillez fournir une description détaillée',
        body_placeholder: 'Entrez une description...',
        body_ai_description: 'Généré automatiquement à partir de votre photo. Vous pouvez modifier le texte.',
        body_ai_placeholder: 'Génération du texte à partir de la photo...',
        category: 'Catégorie',
        category_description: 'Sélectionnez la catégorie appropriée pour votre signalement',
        category_placeholder: 'Sélectionnez une catégorie',
        category_disabled: {
            title: 'Catégorie sélectionnée',
            description: 'Vous avez sélectionné la catégorie "{category}". Cette catégorie a des exigences spéciales ou ne permet pas d\'éditer le formulaire plus loin.'
        },
        category_empty: 'Aucune catégorie disponible',
        category_loading: 'Chargement des catégories...',
        category_disabled_notice: 'Cette catégorie est uniquement informative. Les soumissions ne sont pas possibles.',
        category_description_loading: 'Chargement de la description...',
        category_description_error: 'Erreur lors du chargement de la description',
        email: 'E-mail',
        email_description: 'Votre e-mail de contact',
        email_placeholder: 'Entrez votre adresse e-mail',
        first_name: 'Prénom',
        first_name_description: 'Votre prénom',
        first_name_placeholder: 'Entrez votre prénom',
        last_name: 'Nom de famille',
        last_name_description: 'Votre nom de famille',
        last_name_placeholder: 'Entrez votre nom de famille',
        gdpr: 'Accord de Protection des Données',
        gdpr_description: 'J\'accepte le traitement de mes données conformément à la politique de confidentialité.',
        object_id: 'Identifiant de l\'objet',
        object_id_description: 'Identifiant pour l\'objet signalé',
        object_id_placeholder: 'Entrez l\'identifiant de l\'objet (ex: numéro de poteau)',
        phone: 'Numéro de téléphone',
        phone_description: 'Votre numéro de téléphone de contact',
        phone_placeholder: 'Entrez votre numéro de téléphone',

        // Signalements basés sur les installations
        facility: 'Installation',
        facility_plural: 'Installations',
        facility_placeholder: 'Sélectionner {label}',
        facility_required: '{label} est obligatoire.',
        facility_unavailable: 'L\'installation sélectionnée n\'est plus disponible, veuillez en choisir une autre.',
        facility_nearest_snapped: 'Installation la plus proche : {label}',
        facility_no_nearby: 'Aucune installation à proximité, veuillez sélectionner manuellement.',
        facility_use_my_location: 'Utiliser ma position',
        facility_locating: 'Localisation en cours…',
        facility_no_match: 'Aucune installation ne correspond à votre recherche.',
        facility_opens_in_new_tab: '(s\'ouvre dans un nouvel onglet)',
        facility_deselected_map_pick: 'Votre position est utilisée à la place de {label}',
        facility_tagged_with: 'À : {label}',

        imagelist: {
            empty: 'Aucune image disponible pour ce type.'
        },
        requirements: {
            title: 'Encore requis',
            ready_to_submit: 'Prêt à soumettre',
            photo: 'Télécharger une photo',
            category: 'Sélectionner une catégorie',
            location: 'Indiquer l\'emplacement',
            description: 'Entrer une description',
            email: 'Indiquer l\'adresse e-mail',
            privacy: 'Accepter la politique de confidentialité',
            privacyBlock: 'Remplacer ou supprimer la photo sensible',
            conditional: 'selon la catégorie'
        },
        back_to_report: 'Retour au formulaire de signalement'
    },
    validation: {
        body_required: 'La description est requise',
        category_required: 'La catégorie est requise',
        email_required: 'L\'e-mail est requis',
        email_format: 'Format d\'e-mail invalide',
        first_name_required: 'Le prénom est requis',
        last_name_required: 'Le nom de famille est requis',
        gdpr_required: 'Vous devez accepter les conditions de protection des données',
        object_id_required: 'L\'identifiant de l\'objet est requis',
        phone_required: 'Le numéro de téléphone est requis',
        required_field: 'Le champ {field} est requis'
    },
    feedback: {
        page_title: 'Feedback sur la demande de service',
        error_title: 'Erreur de chargement',
        invalid_request: 'Demande de service invalide ou expirée',
        thank_you: 'Merci pour votre feedback !',
        submission_received: 'Votre feedback a été reçu avec succès',
        loading: 'Chargement de la demande de service...',
        title: 'Feedback pour : {service}',
        description: 'Veuillez fournir votre feedback',
        placeholder: 'Entrez votre feedback ici...',
        reopen_request: 'Je souhaite que cette demande de service soit rouverte',
        submitting: 'Envoi en cours...',
        submit: 'Envoyer le Feedback',
        existing_title: 'Votre feedback pour : {service}',
        already_submitted: 'Vous avez déjà envoyé un feedback pour cette demande de service',
        missing_uuid: 'ID de service manquant',
        success_notification: 'Feedback soumis avec succès',
        success_with_id: 'Feedback soumis avec succès pour la demande #{id}',
        updated_successfully: 'Feedback mis à jour avec succès',
        added_to_list: 'La demande de service a été ajoutée à votre liste',
        submission_error: 'Échec de la soumission du feedback',
        server_error: 'Erreur serveur : Le feedback n\'a pas pu être traité pour le moment',
        submission_failed: 'Échec de la soumission du feedback. Veuillez réessayer plus tard',
        already_exists: 'Un feedback existe déjà pour cette demande de service',
        error_fetching_request: 'Erreur lors du chargement des détails de la demande de service',
        no_content: 'Aucun contenu de feedback',
        refresh_complete: 'Liste des demandes actualisée',
        try_again: 'Réessayer',
        format_unrecognized: 'Format de demande de service non reconnu',
        processing_error: 'Erreur lors du traitement des données de la demande de service',
        your_feedback: 'Votre Feedback',
        contact_preference: 'Préférence de Contact',
        no_contact: 'Aucun Contact',
        email_contact: 'Contact par E-mail',
        email_placeholder: 'Votre adresse e-mail',
        set_status_open: 'Définir le statut sur ouvert',
        set_status_open_description: 'Si vous souhaitez que nous nous en occupions à nouveau, vous pouvez rouvrir cette demande de service.',
        email_verification: 'Vérification E-mail',
        email_verification_placeholder: 'Adresse e-mail du rapport original',
        email_verification_description: 'Entrez l\'adresse e-mail que vous avez utilisée lors de la création du rapport original.',
        email_mismatch: 'L\'adresse e-mail saisie ne correspond pas au rapport original.',
        unauthorized_access: 'Accès non autorisé. Veuillez vérifier votre adresse e-mail.',
        service_provider: {
            title: 'Terminer l\'Attribution',
            your_email: 'Votre Adresse E-mail',
            email_placeholder: 'Entrez votre adresse e-mail',
            email_verification_note: 'Veuillez entrer votre adresse e-mail enregistrée',
            completion_notes: 'Notes de Completion',
            notes_placeholder: 'Décrivez le travail effectué ici...',
            mark_as_completed: 'Marquer comme terminé',
            mark_completed_description: 'Marquer la demande comme terminée',
            completion_success: 'Attribution terminée avec succès !',
            complete_request: 'Terminer l\'Attribution',
            page_title: 'Réponse du prestataire',
            page_description: 'Soumettre les notes de clôture pour les demandes assignées',
            modal_title: 'Réponse du prestataire',
            dialog_description: 'Formulaire de réponse du prestataire',
            mark_as_completed_description: 'Définir le statut de la demande sur terminé',
            submit_completion: 'Soumettre la clôture',
            completing: 'Envoi en cours...',
            submission_failed: 'Échec de la soumission. Veuillez réessayer plus tard',
            server_error: 'Erreur serveur : la clôture n\'a pas pu être traitée pour le moment',
            completion_not_allowed: 'Cette demande ne peut pas être clôturée pour le moment',
            email_verification_failed: 'Vérification de l\'e-mail échouée. Veuillez vérifier votre adresse e-mail',
            already_completed: 'Cette demande a déjà été clôturée',
            loading: 'Chargement de la demande de service...',
            try_again: 'Réessayer',
            invalid_uuid: 'Demande de service invalide ou expirée',
            load_error: 'Erreur lors du chargement des détails de la demande',
            error_fetching_request: 'Erreur lors du chargement des détails de la demande de service',
            completion_notes_required: 'Veuillez fournir des notes de clôture',
            existing_completions: 'Clôtures précédentes',
            reassignment_note: 'Cette demande a été marquée pour réassignation et peut recevoir plusieurs clôtures'
        },
        sending: 'Envoi en cours...',
        not_eligible: 'Cette demande de service n\'est pas actuellement éligible pour un retour',
        dialog_description: 'Formulaire de feedback'
    },
    service_unavailable: {
        title: 'Service Temporairement Indisponible',
        message: 'Nous ne pouvons pas nous connecter à nos services pour le moment. Ce problème est probablement temporaire.',
        retry: 'Nous rencontrons actuellement des difficultés techniques. Veuillez réessayer dans {seconds} secondes.',
        auto_retry: 'Nouvelle tentative dans {seconds} secondes...',
        retry_now: 'Réessayer maintenant',
        try_later: 'Veuillez réessayer plus tard.',
        reload: 'Recharger'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Portail de Service Municipal',
        app_claim: 'Votre rapport. Notre solution.'
    },
    hiddenSection: {
        description: 'Notre outil de signalement est un système de déclaration des problèmes d’infrastructure. Vous pouvez soit signaler un problème directement, soit naviguer vers l’un des éléments suivants :',
        main_navigation: 'Navigation principale avec des informations, une liste de signalements et des statistiques',
        map: 'Carte avec des marqueurs visuels (accessibilité partielle)',
        action_button: 'Signaler directement',
        map_navigation_hint: 'Utilisez les touches fléchées ⬆️⬇️⬅️➡️ pour naviguer entre les marqueurs de rapport, ↩️ Entrée pour sélectionner, ❌ Échap pour effacer la sélection',
        keyboard_navigation_hint: 'Utilisez les touches fléchées ↑↓ pour naviguer, Entrée pour activer',
        skip_to_main_content: 'Aller au contenu principal'
    },
    accessibility: {
        skip_to_main: 'Aller au contenu principal',
        skip_to_map: 'Aller à la carte',
        skip_to_navigation: 'Aller à la navigation',
        skip_to_form: 'Signaler directement',
        leichte_sprache_indicator: 'Langue simplifiée - Des textes accessibles à tous'
    },
    common: {
        back: 'Retour',
        not_classified: 'Non classifié',
        no_value: 'Aucune valeur',
        close: 'Fermer',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        submit: 'Soumettre',
        cancel: 'Annuler',
        required: 'Requis',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        clear: 'Effacer',
        search: 'Rechercher',
        select: 'Sélectionner',
        on: 'Activé',
        off: 'Désactivé',
        toggle: 'Basculer',
        yesterday: 'Hier',
        title: {
            classic: 'Signalement classique',
            photo: 'Signalement photo'
        },
        buttons: {
            toggle_theme: 'Changer de thème',
            attribution: 'Attribution de la carte',
            close: 'Fermer'
        },
        navigation: 'Tiroir de navigation',
        drawer_description: 'Panneau de contenu et d\'options',
        resize_drawer: 'Redimensionner le panneau',
        drawer_position_n_of_total: 'position {idx} sur {total}',
        did_you_know: 'Le saviez-vous ?',
        show_more: 'Afficher plus',
        show_less: 'Afficher moins',
        learn_more: 'En savoir plus',
        learn_more_about: 'En savoir plus sur {topic}',
        opens_in_new_tab: '(s\'ouvre dans un nouvel onglet)',
        current: 'Actuel',
        share: 'Partager',
        copy_coordinates: 'Copier les coordonnées',
        open_in_maps: 'Ouvrir dans Maps'
    },
    fields: {
        field_geolocation: 'Emplacement',
        field_gdpr: 'Consentement au traitement des données',
        field_e_mail: 'E-mail',
        field_category: 'Catégorie',
        field_request_media: 'Photos',
        field_name: 'Nom de famille',
        field_prename: 'Prénom',
        field_first_name: 'Prénom',
        field_last_name: 'Nom de famille',
        field_first_name_placeholder: 'Entrez votre prénom',
        field_last_name_placeholder: 'Entrez votre nom de famille',
        field_phone: 'Téléphone',
        body: 'Description',
        field_add_data: 'Participation au concours',
        field_terms_of_use: 'J\'accepte les conditions d\'utilisation et la politique de confidentialité.',
        field_address: 'Adresse',
        postal_code: 'Code postal',
        postal_code_placeholder: 'ex. 75001',
        city: 'Ville',
        city_placeholder: 'ex. Paris',
        street_address: 'Adresse',
        street_address_placeholder: 'ex. Rue de la Paix 123'
    },
    competition: {
        intro: 'Si vous le souhaitez, participez à notre tirage au sort annuel. Vous avez la chance de remporter des prix attractifs et des récompenses en espèces que nous distribuons parmi tous les participants en guise de petit remerciement.',
        disclaimer: 'Les employés des départements responsables sont exclus de la participation.',
        title: 'Participation au concours',
        errors: {
            already_exists: 'L\'entrée du concours existe déjà',
            duplicate_found: 'Doublon trouvé',
            duplicate_detail: 'Une entrée de concours a déjà été créée pour ce rapport.',
            not_found: 'Rapport non trouvé',
            not_found_detail: 'Le rapport associé n\'a pas pu être trouvé.',
            save_failed: 'L\'entrée du concours n\'a pas pu être sauvegardée',
            submission_error: 'Erreur de soumission',
            submission_error_detail: 'Votre entrée de concours n\'a pas pu être sauvegardée, mais votre rapport a été soumis avec succès.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Onglet Informations',
                panel_label: 'Panneau d\'Informations'
            },
            list: {
                label: 'Liste',
                aria_label: 'Onglet liste des rapports',
                panel_label: 'Panneau liste des rapports'
            },
            following: {
                label: 'Suivant',
                aria_label: 'Onglet rapports suivis',
                panel_label: 'Panneau rapports suivis'
            },
            stats: {
                label: 'Statistiques',
                aria_label: 'Onglet Statistiques',
                panel_label: 'Panneau Statistiques'
            }
        },
        updates_count: '{count} nouvelle(s) mise(s) à jour',
        main: 'Navigation principale',
        pages: 'Navigation par pages',
        browse_reports: 'Parcourir les signalements',
        back_to_form: 'Retour au formulaire',
        panel: {
            scrollable: 'Zone défilante'
        }
    },
    report: {
        form_types: 'Types de signalement',
        how_to_help: 'Comment créer un signalement',
        title: {
            photo: 'Rapport Photo',
            classic: 'Rapport Classique',
            submit: 'Soumettre le Rapport',
            edit: 'Modifier le Rapport',
            view: 'Voir le Rapport'
        },
        status: {
            new: 'Nouveau',
            open: 'Ouvert',
            in_progress: 'En cours',
            resolved: 'Résolu',
            closed: 'Fermé',
            unknown: 'Statut Inconnu'
        },
        form: {
            description: {
                label: 'Description',
                placeholder: 'Veuillez décrire le problème...',
                ai_processing: 'L\'IA génère une description...',
                help: 'Fournissez autant de détails que possible'
            },
            category: {
                label: 'Catégorie',
                placeholder: 'Sélectionnez une catégorie',
                loading: 'Chargement des catégories...',
                error: 'Erreur lors du chargement des catégories',
                empty: 'Aucune catégorie disponible',
                help: 'Choisissez la catégorie la plus appropriée',
                description: 'Description de la catégorie',
                description_loading: 'Chargement de la description...',
                description_error: 'Erreur lors du chargement de la description',
                disabled_notice: 'Cette catégorie est uniquement à titre informatif. Les signalements ne sont pas possibles.'
            },
            location: {
                label: 'Emplacement',
                placeholder: 'Entrez rue et numéro...',
                selected: 'Emplacement sélectionné',
                clear: 'Effacer l\'emplacement',
                error: 'Erreur lors de la récupération de l\'emplacement',
                help: 'Astuce: Entrez rue et numéro pour des résultats précis',
                help_modal: 'Saisissez une adresse ou utilisez votre position actuelle',
                current: 'Utiliser l\'emplacement actuel',
                searching: 'Recherche...',
                pick_on_map: 'Choisir sur la carte',
                auto_detected: 'Emplacement détecté',
                complete_address: 'Adresse complète',
                from_photo_exif: 'Emplacement extrait automatiquement des métadonnées de la photo',
                warning: 'Avertissement de localisation',
                unknown_location: 'Emplacement inconnu',
                suggestions: 'Suggestions d\'emplacement'
            },
            email: {
                label: 'E-mail pour les mises à jour',
                placeholder: 'Entrez votre adresse e-mail',
                help: 'Nous vous enverrons des mises à jour concernant votre rapport',
                subscribe: 'S\'abonner aux mises à jour'
            },
            gdpr: {
                label: 'Consentement au traitement des données',
                description: 'J\'accepte le traitement de mes données conformément à la politique de confidentialité.',
                required: 'Vous devez accepter pour continuer',
                link: 'Voir la politique de confidentialité'
            },
            media: {
                label: 'Photos',
                required: 'Une photo est requise pour cette catégorie',
                upload: {
                    overall_progress: 'Progression totale',
                    button: 'Cliquez pour télécharger',
                    or: ' ou',
                    drag: 'glisser et déposer',
                    restrictions: 'Jusqu\'à {count} images ({size} max., {types})',
                    restrictions_single: 'Une seule image ({size} max., {types})',
                    drop_here: 'Déposez les fichiers ici pour les télécharger',
                    progress: 'Progression du téléchargement',
                    started_sr: 'Téléchargement démarré',
                    progress_sr: 'Téléchargement à {progress}%',
                    success_sr: 'Téléchargement terminé avec succès',
                    error_sr: 'Téléchargement échoué : {error}',
                    files_selected_sr: '{count} fichier(s) sélectionné(s) pour le téléchargement',
                    area_label: 'Zone de téléchargement de photo - cliquer pour sélectionner des fichiers ou glisser-déposer',
                    in_progress: 'Téléchargement en cours',
                    complete_sr: 'Le fichier a été téléchargé avec succès.',
                    description: 'Téléchargez des images en cliquant, en appuyant ou en faisant glisser les fichiers ici. Formats acceptés : JPEG, PNG, GIF.'
                },
                preview: 'Aperçu de l\'image',
                remove: 'Supprimer l\'image',
                no_image_available: 'Aucune image disponible ou non affichée pour des raisons légales',
                progress: 'Progression du téléchargement : {progress}%',
                limit_reached: 'Nombre maximum de {count} images atteint',
                privacy_notice: 'Pas de personnes/plaques d\'immatriculation SVP',
                ai_analysis: 'Analyse via Azure AI (Allemagne)',
                ai_analysis_tooltip: 'En téléchargeant, vous confirmez que la photo a été prise légalement et ne viole pas les droits de tiers. Si des personnes ou des plaques d\'immatriculation sont reconnaissables, veuillez les rendre méconnaissables avant le téléchargement. L\'analyse sert exclusivement à catégoriser votre rapport. Seule une copie réduite et sans EXIF est transmise à Azure OpenAI (Allemagne) ; l\'original n\'est pas envoyé au service.',
                offline_cached: 'Enregistré hors ligne',
                ai_analysis_help: 'Informations sur l\'analyse par IA'
            },
            submit: {
                button: 'Soumettre le Rapport',
                submitting: 'Soumission en cours...',
                processing: 'Traitement en cours...',
                success: 'Rapport soumis avec succès',
                error: 'Erreur lors de la soumission du rapport',
                loading: 'Chargement du formulaire...'
            },
            loading: 'Chargement du formulaire...',
            draft_saved: 'Brouillon sauvegardé',
            tabs: {
                photo: 'Avec photo',
                classic: 'Classique'
            },
            modal_description: 'Créer un nouveau signalement'
        },
        ai: {
            label: 'IA',
            powered: 'Propulsé par l\'IA',
            analyzing: 'L\'IA analyse vos photos...',
            processing: {
                analyzing: 'Demande à l\'IA...',
                location: 'Vérification des métadonnées de l\'image...',
                location_found: 'Emplacement trouvé :',
                location_ai: 'Recherche de l\'emplacement dans l\'image...',
                location_complete: 'Emplacement identifié',
                category: 'Identification de la catégorie...',
                category_found: 'Catégorie identifiée :',
                description: 'Génération de la description...',
                description_complete: 'Description générée',
                attributes_filled: '{count} champ(s) supplémentaire(s) pré-rempli(s)',
                complete: 'Analyse de l\'IA terminée',
                error: 'Erreur lors de l\'analyse par l\'IA',
                privacy_warning: 'Problème de confidentialité détecté',
                location_not_found: 'Emplacement introuvable dans les métadonnées de l\'image.',
                category_not_matched: 'Catégorie suggérée par l\'IA (sélection requise)'
            },
            privacy: {
                title: 'Avis de confidentialité',
                description: 'Des données personnelles ont peut-être été détectées sur votre photo ({issues}). La photo sera vérifiée avant publication.',
                required: 'Un contenu sensible pour la vie privée a été détecté sur cette photo et aucun floutage automatique n\'est disponible. La photo ne peut pas être utilisée. Remplacez-la ou supprimez-la pour continuer.',
                removePhoto: 'Supprimer la photo',
                replace: 'Remplacer la photo',
                understood: 'Continuer avec cette photo'
            },
            failed: {
                title: 'Analyse d\'image indisponible',
                description: 'Votre photo sera vérifiée manuellement avant publication. Vous pouvez tout de même envoyer votre signalement.'
            },
            started_sr: 'Analyse IA démarrée',
            complete_sr: 'Analyse IA terminée avec succès',
            field_updated_sr: '{field} a été mis à jour avec : {value}',
            analysis_complete_sr: 'Analyse IA terminée.',
            category_result_sr: 'Catégorie sélectionnée : {category}.',
            description_result_sr: 'Description générée : {description}',
            location_result_sr: 'Emplacement trouvé : {location}.',
            category_hint: 'Cette photo ne semble pas correspondre à nos catégories de signalement. Veuillez choisir une catégorie vous-même.',
            budget_exhausted_title: 'Analyse IA ignorée',
            budget_exhausted_submitted: 'Le budget d\'analyse IA pour ce mois est épuisé. Votre signalement a été envoyé avec succès.'
        },
        buttons: {
            photo: 'Rapport Photo',
            classic: 'Rapport Classique',
            follow: 'Suivre le Rapport',
            following: 'Suivant',
            share: 'Partager le Rapport',
            print: 'Imprimer',
            flag: 'Signaler',
            flag_submitted: 'Déjà signalé',
            copy_link: 'Copier le lien',
            link_copied: 'Lien copié dans le presse-papiers',
            email: 'E-mail',
            directions: 'Obtenir l\'itinéraire'
        },
        following: {
            count: 'Vous suivez {count} rapport(s)',
            mark_all_read: 'Marquer tout comme lu',
            no_reports: 'Aucun rapport suivi pour le moment',
            no_address: 'Aucune adresse disponible',
            status_updated: 'Statut mis à jour',
            status_changed: 'Statut changé en :',
            awaiting_server: 'En attente maj',
            escalated_to: 'Transféré à {jurisdiction}',
            escalated_click: 'Appuyez pour ouvrir dans la nouvelle juridiction',
            unavailable: 'Ce signalement n\'est actuellement pas disponible. Veuillez consulter vos e-mails ou nous contacter.',
            date: {
                today: 'Aujourd\'hui',
                tomorrow: 'Demain',
                yesterday: 'Hier',
                unknown: 'Date inconnue'
            }
        },
        photo: {
            description: 'Créer un nouveau signalement avec une photo'
        },
        classic: {
            description: 'Créer un nouveau signalement sans photo'
        }
    },
    map: {
        loading: 'Chargement de la carte...',
        controls: {
            zoom_in: 'Zoom avant',
            zoom_out: 'Zoom arrière',
            find_location: 'Trouver ma position',
            toggle_heatmap: 'Activer/Désactiver la carte de chaleur',
            toggle_language: 'Changer de langue',
            adjust_tilt: 'Ajuster l\'inclinaison',
            degrees: '{count} degrés',
            add_report_here: 'Signaler ici',
            layers: 'Couches de carte',
            no_layers: 'Aucune couche disponible',
            geolocation: {
                label: 'Obtenir la position actuelle'
            },
            zoom: 'Zoom controls'
        },
        tap_to_load: 'Appuyer pour afficher la carte',
        tap_to_select_location: 'Appuyer sur la carte pour sélectionner un emplacement',
        loading_address: 'Chargement de l\'adresse...',
        retry_attempt: 'Tentative {count}',
        confirm_location: 'Confirmer l\'emplacement',
        add_report_here: 'Signaler ici',
        pick: {
            drag_hint: 'Faites glisser le marqueur pour ajuster la position'
        },
        tooltip: {
            label: 'Informations sur le marqueur de carte',
            opens_form_above: 'Ouvre le formulaire au-dessus',
            opens_modal: 'Ouvre dans une fenêtre'
        },
        keyboard: {
            canvasInstructions: 'Carte interactive avec des marqueurs de signalements. Les touches fléchées naviguent entre les marqueurs, Maj+flèche déplace la carte, Entrée sélectionne. Appuyez sur Ctrl+= pour zoomer, Ctrl+- pour dézoomer.',
            noFeatures: 'Aucun marqueur visible dans la vue actuelle. Essayez de zoomer ou de déplacer la carte.',
            zoomedIntoCluster: 'Zoomé dans la zone du groupe. Utilisez les touches fléchées pour naviguer entre les marqueurs.',
            clusterFocused: 'Groupe de {count} signalements en focus. Appuyez sur Entrée pour développer. {position}',
            clusterExpanded: 'Groupe développé en {count} signalements. {featureLabel}',
            markerFocused: 'Signalement en focus : {name} à {address}{context}. Appuyez sur Entrée pour ouvrir les détails. {position}',
            expandedContext: ' (développé depuis le groupe)',
            untitledReport: 'Signalement sans titre',
            unknownLocation: 'emplacement',
            featurePosition: 'Élément {current} sur {total}.',
            pannedToExplore: 'Carte déplacée vers {direction}. Relâchez Maj et utilisez les touches fléchées pour naviguer.',
            pannedNoMarkers: 'Carte déplacée vers {direction}. Aucun marqueur trouvé dans cette direction. Utilisez les touches fléchées pour continuer.'
        }
    },
    detail: {
        location: 'Emplacement',
        photos: 'Photos',
        description: 'Description',
        status_history: 'Historique des Statuts',
        updates: 'Mises à jour',
        no_updates: 'Aucune mise à jour pour le moment',
        edit: 'Modifier',
        follow: {
            button: 'Suivre',
            following: 'Suivant',
            stop: 'Ne plus suivre',
            success: 'Vous suivez maintenant ce rapport',
            error: 'Erreur lors du suivi du rapport',
            updating: 'Mise à jour en cours...'
        },
        unavailable: {
            title: 'Signalement non disponible',
            message: 'Ce signalement n\'existe pas ou n\'a pas encore été publié. Les signalements récemment soumis peuvent prendre un moment avant d\'apparaître.'
        },
        dialog_description: 'Voir les détails du signalement'
    },
    stats: {
        status_overview: 'Statut',
        pie_chart: 'Répartition',
        total_reports: 'Total des Rapports',
        status_distribution: 'Répartition des Statuts',
        category_distribution: 'Répartition des Catégories',
        uncategorized: 'Non catégorisé',
        showing_reports: 'Affichage de {visible} sur {total} rapports',
        no_reports: 'Aucun rapport disponible',
        open_reports: 'Rapports Ouverts',
        closed_reports: 'Rapports Fermés',
        no_data_available: 'Aucune donnée disponible',
        expand: 'Afficher les détails',
        collapse: 'Masquer les détails',
        subcategory: 'sous-catégorie',
        subcategories: 'sous-catégories'
    },
    time: {
        days_ago: 'Il y a {count} jour(s)',
        just_now: 'À l\'instant',
        minutes_ago: 'Il y a {count} minute(s)',
        hours_ago: 'Il y a {count} heure(s)',
        yesterday: 'Hier',
        today: 'Aujourd\'hui'
    },
    list: {
        showing: 'Affichage de {visible} sur {total} rapports',
        showing_in_area: '{visible} dans cette zone, {total} au total',
        showing_area_only: '{visible} dans cette zone',
        no_results: 'Aucun rapport trouvé',
        no_filtered_results: 'Aucun rapport ne correspond à vos critères de filtre',
        load_more: 'Tous les rapports chargés',
        load_more_button: 'Charger plus',
        newest_first: 'Les plus récents en premier',
        oldest_first: 'Les plus anciens en premier',
        refresh: 'Rafraîchir',
        status_update: 'Statut mis à jour',
        location: 'Emplacement',
        unpublished: 'Non publié',
        editable: 'Modifiable'
    },
    errors: {
        general: 'Quelque chose s\'est mal passé',
        search_failed: 'La recherche a échoué. Veuillez réessayer.',
        upload_failed: 'Téléchargement échoué',
        location_error: 'Impossible de déterminer l\'emplacement',
        network_error: 'Erreur réseau',
        geolocation: {
            title: 'Erreur de localisation',
            permission_denied: 'Permission de localisation refusée. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.',
            unavailable: 'Les informations de localisation sont actuellement indisponibles.',
            timeout: 'La demande de localisation a expiré.',
            unknown: 'Une erreur de localisation inconnue s\'est produite.'
        },
        try_again: 'Veuillez réessayer',
        validation: {
            title: 'Veuillez corriger les erreurs suivantes :',
            location_error_title: 'Erreur d\'emplacement',
            invalid_input: 'Entrée invalide',
            duplicate_title: 'Duplicata trouvé',
            duplicate_found: 'Rapport similaire trouvé',
            duplicate_report: 'Un rapport similaire a déjà été créé (N° {reportId})',
            location_out_of_bounds: 'L\'emplacement spécifié est en dehors de notre zone de service',
            required_field: '{field} est requis',
            required_fields: 'Veuillez remplir tous les champs requis',
            file_size: 'Le fichier sélectionné est trop volumineux (max. 10 MB)',
            file_type: 'Le format n\'est pas pris en charge (autorisé: jpg, png, webp, jfif)',
            media_upload: 'Erreur lors du téléchargement de l\'image',
            invalid_format: 'Format invalide pour {field}',
            consent_required: 'Veuillez accepter la politique de confidentialité',
            please_review: 'Veuillez vérifier le formulaire et corriger les erreurs avant d\'envoyer.',
            photo_required: 'Une photo est requise pour cette catégorie',
            duplicate_hint_title: 'Doublon potentiel détecté',
            duplicate_hint_message: 'Un signalement similaire existe peut-être déjà dans cette zone. Vous pouvez tout de même soumettre si vous pensez qu\'il s\'agit d\'un nouveau problème.',
            duplicate_existing_report: 'Signalement existant : N° {reportId}',
            view_existing_report: 'Voir le signalement existant',
            submit_anyway: 'Envoyer quand même'
        },
        rate_limit: {
            title: 'Limite de débit dépassée',
            general: 'Veuillez réessayer plus tard.',
            with_time: 'Veuillez réessayer dans {seconds} secondes.'
        },
        network: 'Problème de connexion. Vérifiez votre connexion Internet',
        timeout: 'Délai dépassé. Veuillez réessayer',
        upload: {
            title: 'Téléchargement échoué',
            invalid_type: 'Type de fichier invalide. Veuillez télécharger uniquement des images.',
            file_too_large: 'Fichier trop volumineux. La taille maximale est de {size}.',
            dimensions_too_large: 'Dimensions de l\'image trop grandes. Maximum {width}x{height} pixels.',
            invalid_image: 'Fichier image invalide ou corrompu.',
            failed: 'Téléchargement échoué. Veuillez réessayer.',
            limit_reached: 'Nombre maximal de {count} fichiers atteint.',
            remove_to_add: 'Supprimez une photo pour en ajouter une nouvelle',
            single_file_limit: 'Une seule image peut être téléchargée.',
            exact_file_limit: 'Un maximum de {count} images peut être téléchargé.',
            file_too_large_raw: 'Fichier trop volumineux ({size} maximum). Veuillez choisir une image plus petite.',
            optimization_failed: 'L\'image n\'a pas pu être compressée. Taille maximale après compression : {size}.'
        },
        submission_error: 'Erreur lors de la soumission du rapport.',
        unknown: 'Une erreur inconnue est survenue.',
        pending_uploads: 'Veuillez patienter jusqu\'à ce que tous les téléchargements soient terminés.',
        incomplete_form: 'Veuillez remplir tous les champs requis.',
        api: {
            rate_limit: 'Trop de requêtes. Veuillez patienter un moment et réessayer.',
            unauthorized: 'Non autorisé. Veuillez vous reconnecter.',
            forbidden: 'Accès refusé.',
            not_found: 'Ressource introuvable.',
            server_error: 'Erreur serveur. Veuillez réessayer plus tard.',
            default: 'Erreur API : {status}'
        },
        page: {
            title: 'Erreur',
            not_found_title: 'Page introuvable',
            not_found_message: 'Désolé, la page que vous cherchez n\'existe pas.',
            server_error_title: 'Erreur serveur',
            server_error_message: 'Désolé, une erreur s\'est produite sur notre serveur.',
            generic_title: 'Une erreur est survenue',
            generic_message: 'Une erreur inattendue s\'est produite.',
            action_home: 'Retour à l\'accueil',
            action_back: 'Retour',
            action_retry: 'Réessayer',
            details: 'Détails de l\'erreur'
        }
    },
    success: {
        report_submitted: 'Rapport soumis',
        moderation_notice: 'Votre rapport sera examiné avant publication. Numéro de référence :',
        submit_another: 'Soumettre un autre rapport',
        auto_followed: 'Ce rapport a été automatiquement ajouté à vos rapports suivis',
        visibility_limitation_notice: 'Veuillez noter que tous les rapports ne deviennent pas visibles publiquement sur le site. Si votre rapport ne s\'actualise pas dans la liste des rapports suivis, il peut néanmoins avoir été traité par la ville. Vérifiez votre e-mail pour les mises à jour de statut.',
        report_submitted_description: 'Votre signalement a été envoyé avec succès et sera traité prochainement.',
        fun_facts: [
            '🌱 Chaque signalement soumis contribue à améliorer votre ville !',
            '🏙️ Les signalements citoyens ont permis de résoudre plus de 10 000 problèmes dans des villes du monde entier.',
            '⚡ En moyenne, un signalement est examiné en moins de 24 heures.',
            '🤝 Vous faites partie d\'une communauté qui se soucie des espaces publics !',
            '📊 Les données issues des signalements citoyens aident les urbanistes à prendre de meilleures décisions.',
            '🔄 Suivre vos signalements vous tient informé de l\'avancement automatiquement.',
            '🎯 Les signalements avec photo sont traités 3 fois plus vite que les textes seuls.',
            '🌍 Des plateformes de participation citoyenne comme celle-ci existent dans plus de 50 pays.',
            '💡 Vos retours aident à prioriser les problèmes à résoudre en premier.',
            '🚀 Le signalement numérique a réduit les délais de réponse de jusqu\'à 60 %.',
            '🏆 Les citoyens actifs renforcent la résilience de leurs communautés.',
            '🔍 L\'analyse par IA aide à catégoriser vos signalements plus précisément.',
            '📱 Le signalement mobile facilite la déclaration de problèmes au moment où vous les constatez.',
            '⭐ Merci d\'être un citoyen engagé !'
        ]
    },
    flag: {
        title: 'Signaler ce rapport',
        description: 'Aidez-nous à maintenir la qualité en signalant le contenu inapproprié.',
        reason_label: 'Pourquoi signalez-vous ce rapport ?',
        reason_spam: 'Spam ou publicité',
        reason_offensive: 'Contenu offensant ou inapproprié',
        reason_personal: 'Contient des données personnelles',
        reason_location: 'Mauvais emplacement',
        reason_other: 'Autre',
        details_label: 'Détails supplémentaires',
        details_placeholder: 'Veuillez décrire le problème...',
        details_required: 'Veuillez fournir des détails',
        submit: 'Envoyer',
        success: 'Merci. Nous examinerons ce rapport.',
        error: 'Impossible d\'envoyer. Veuillez réessayer.',
        already_flagged: 'Vous avez déjà signalé ce rapport.'
    },

    pwa: {
        install: {
            title: 'Installer l\'application',
            button: 'Installer',
            not_now: 'Plus tard',
            description: 'Cliquez sur l\'icône d\'installation dans la barre d\'adresse de votre navigateur pour installer cette application',
            share_button: 'icône de partage',
            open_safari: 'Navigateur Safari',
            ios: {
                title: 'Ajouter à l\'écran d\'accueil',
                safari_instructions: 'Appuyez sur le {icon} et sélectionnez "Ajouter à l\'écran d\'accueil"',
                other_instructions: 'Veuillez ouvrir ce site dans {browser} pour l\'installer'
            },
            chrome: {
                instructions: 'Cliquez sur l\'icône d\'installation {icon} dans la barre d\'outils pour installer cette application'
            },
            edge: {
                instructions: 'Cliquez sur l\'icône d\'installation {icon} dans la barre d\'adresse'
            },
            firefox: {
                instructions: 'Cliquez sur l\'icône d\'accueil {icon} dans la barre d\'adresse'
            }
        }
    },
    boundaries: {
        loading: 'Chargement des données de limites...',
        error: 'Impossible de valider les limites de l\'emplacement. Veuillez réessayer plus tard.',
        notLoaded: 'Limites pas encore chargées',
        outsideNonStrict: 'Remarque : L\'emplacement sélectionné est en dehors des limites de {locationName}.',
        outsideStrict: 'L\'emplacement sélectionné est en dehors des limites de {locationName}. Veuillez sélectionner un emplacement à l\'intérieur des limites de la ville.',
        validationUnavailable: 'Validation des limites indisponible. Votre rapport sera accepté mais pourrait être réexaminé.'
    },
    filters: {
        status: {
            title: 'Statut'
        },
        time: {
            title: 'Temps',
            today: 'Aujourd\'hui',
            week: 'Cette Semaine',
            month: 'Ce Mois'
        },
        category: {
            title: 'Catégorie',
            other: 'Autre'
        },
        actions: {
            more: 'Plus de Filtres',
            expand: 'Plus de Filtres',
            collapse: 'Moins',
            clear_all: 'Tout Effacer',
            active_count: '{count} filtres actifs',
            toggle: 'Filtres'
        },
        title: 'Filtres'
    },
    privacy: {
        notice_text: 'Informations sur la confidentialité',
        notice_link_text: 'ici',
        modal: {
            title: 'Politique de confidentialité',
            loading: 'Chargement des informations de confidentialité...',
            retry: 'Réessayer',
            noContent: 'Aucune information de confidentialité disponible.',
            lastUpdated: 'Dernière mise à jour',
            close: 'Fermer'
        }
    },
    search: {
        placeholder: 'Rechercher des signalements...',
        no_results_local: 'Aucun résultat dans la vue actuelle',
        expand_to_server: 'Rechercher tous les signalements',
        expand_hint: 'Rechercher au-delà de la vue actuelle',
        searching_server: 'Recherche de tous les signalements...'
    },
    info: {
        welcome: {
            heading: 'Bienvenue sur {name}',
            headingGeneric: 'Bienvenue',
            body: 'Utilisez cette carte pour signaler des problèmes ou consulter les signalements existants dans votre zone.'
        },
        shortcuts: {
            aria_label: 'Actions rapides',
            photo: {
                title: 'Photo',
                description: 'Prenez une photo, l\'IA fait le reste',
                aria_label: 'Créer un signalement avec photo'
            },
            classic: {
                title: 'Classique',
                description: 'Décrivez et localisez le problème',
                aria_label: 'Créer un signalement classique'
            },
            following: {
                title: 'Suivre',
                description: 'Restez informé de l\'avancement',
                aria_label: 'Ouvrir les signalements suivis'
            },
            list: {
                title: 'Explorer',
                description: 'Voyez ce qui se passe près de vous',
                aria_label: 'Explorer la carte et voir la liste'
            }
        }
    },
    profile: {
        title: 'Profil',
        account: {
            title: 'Compte',
            roles: 'Rôles'
        },
        groups: {
            title: 'Groupes'
        },
        appearance: {
            title: 'Apparence',
            color_mode: 'Mode couleur',
            light: 'Clair',
            dark: 'Sombre',
            system: 'Système',
            primary_color: 'Couleur principale',
            theme_override: 'Couleurs de thème personnalisées',
            theme_override_description: 'Remplacez le thème par défaut de la juridiction par vos propres préférences de couleur',
            secondary_color: 'Couleur secondaire',
            neutral_color: 'Couleur neutre',
            reset_theme: 'Rétablir par défaut'
        },
        language: {
            title: 'Langue',
            select: 'Sélectionner la langue',
            save_failed: 'Impossible d\'enregistrer la préférence de langue. Veuillez réessayer.'
        }
    },
    auth: {
        login: {
            title: 'Se connecter',
            subtitle: 'Entrez votre e-mail pour recevoir un code de vérification',
            email_label: 'Adresse e-mail',
            email_hint: 'Nous vous enverrons un code à 6 chiffres',
            email_placeholder: 'adresse e-mail',
            send_code: 'Envoyer le code de vérification',
            disabled: {
                title: 'Connexion non disponible',
                message: 'La connexion sans mot de passe n\'est pas activée ici. Veuillez contacter l\'administrateur si vous avez besoin d\'un accès.',
                back_button: 'Retour à l\'accueil'
            }
        },
        verify: {
            email_label: 'Adresse e-mail',
            code_label: 'Code de vérification',
            code_hint: 'Entrez le code à 6 chiffres reçu par e-mail',
            code_placeholder: '123456',
            verify_button: 'Vérifier et se connecter',
            back_button: 'Utiliser une autre adresse e-mail',
            request_new: 'Demander un nouveau code',
            resend_code: 'Renvoyer le code',
            expires_in: 'Le code expire dans {time}',
            expired_title: 'Code expiré',
            expired_message: 'Votre code de vérification a expiré. Veuillez en demander un nouveau.'
        },
        code_sent: {
            title: 'Code envoyé',
            message: 'Nous avons envoyé un code de vérification à 6 chiffres à {email}'
        },
        error: {
            title: 'Erreur d\'authentification',
            request_failed: 'Échec de l\'envoi du code de vérification. Veuillez réessayer.',
            verify_failed: 'Code de vérification invalide ou expiré',
            sso_failed: 'Échec de la connexion. Veuillez réessayer.',
            network: 'Erreur réseau. Veuillez vérifier votre connexion.',
            logout_failed: 'Échec de la déconnexion. Veuillez réessayer.'
        },
        sso: {
            completing: 'Connexion en cours...',
            method_label: 'Authentification unique',
            button_aria: 'Se connecter avec {provider} par authentification unique'
        },
        user: {
            logged_in_as: 'Connecté en tant que',
            logout: 'Se déconnecter'
        },
        welcome: {
            greeting: 'Bonjour, {name}',
            sign_in: 'Se connecter',
            sign_out: 'Se déconnecter',
            user_avatar: 'Avatar de l\'utilisateur'
        }
    },
    service_provider: {
        page_title: 'Réponse du prestataire',
        page_description: 'Soumettre les notes de clôture pour les demandes assignées',
        modal_title: 'Réponse du prestataire',
        dialog_description: 'Formulaire de réponse du prestataire',
        title: 'Terminer l\'attribution',
        your_email: 'Votre adresse e-mail',
        email_placeholder: 'prestataire{\'@\'}exemple.fr',
        email_verification_note: 'Entrez l\'adresse e-mail de votre compte prestataire pour vérification',
        completion_notes: 'Notes de clôture',
        notes_placeholder: 'Décrivez le travail effectué...',
        mark_as_completed: 'Marquer comme terminé',
        mark_as_completed_description: 'Définir le statut de la demande sur terminé',
        submit_completion: 'Soumettre la clôture',
        complete_request: 'Terminer l\'attribution',
        completing: 'Envoi en cours...',
        completion_success: 'Clôture de la demande soumise avec succès',
        submission_failed: 'Échec de la soumission. Veuillez réessayer plus tard',
        server_error: 'Erreur serveur : la clôture n\'a pas pu être traitée pour le moment',
        completion_not_allowed: 'Cette demande ne peut pas être clôturée pour le moment',
        email_verification_failed: 'Vérification de l\'e-mail échouée. Veuillez vérifier votre adresse e-mail',
        already_completed: 'Cette demande a déjà été clôturée',
        loading: 'Chargement de la demande de service...',
        try_again: 'Réessayer',
        invalid_uuid: 'Demande de service invalide ou expirée',
        load_error: 'Erreur lors du chargement des détails de la demande',
        error_fetching_request: 'Erreur lors du chargement des détails de la demande de service',
        completion_notes_required: 'Veuillez fournir des notes de clôture',
        existing_completions: 'Clôtures précédentes',
        reassignment_note: 'Cette demande a été marquée pour réassignation et peut recevoir plusieurs clôtures'
    },
    pages: {
        dialog_description: 'Voir le contenu de la page'
    },
    offline: {
        banner: {
            title: 'Vous êtes hors ligne',
            description: 'Les signalements seront enregistrés localement et synchronisés plus tard.',
            pending: '{count} signalement(s) en attente',
            dismiss: 'Fermer',
            states: {
                offline: {
                    title: 'Vous êtes hors ligne',
                    description: 'Les signalements seront enregistrés localement'
                },
                syncing: {
                    title: 'Synchronisation...',
                    description: 'Envoi de {count} signalement(s)'
                },
                success: {
                    title: '{count} signalement(s) envoyé(s)',
                    titleDefault: 'Synchronisation terminée'
                },
                error: {
                    title: '{count} échec(s)',
                    description: 'Vérifier et réessayer'
                },
                pending: {
                    title: 'Signalements prêts à envoyer'
                }
            },
            report: 'signalement | signalements',
            syncNow: 'Envoyer maintenant'
        },
        toast: {
            went_offline: 'Connexion perdue',
            went_offline_description: 'Les signalements seront enregistrés localement.',
            back_online: 'De retour en ligne',
            back_online_description: 'Connexion rétablie.',
            syncing: 'Synchronisation...',
            syncing_description: 'Synchronisation de {count} signalement(s).',
            sync_complete: 'Synchronisation terminée',
            sync_complete_description: 'Tous les signalements ont été envoyés avec succès.',
            sync_failed: 'Synchronisation échouée',
            sync_failed_description: '{count} signalement(s) n\'ont pas pu être envoyés.'
        },
        status: {
            offline: 'Hors ligne',
            syncing: 'Synchronisation...',
            pending: '{count} en attente',
            synced: 'Synchronisé'
        },
        sync: {
            title: 'État de la synchronisation',
            syncNow: 'Synchroniser maintenant',
            syncing: 'Synchronisation...',
            offlineWarning: 'Vous êtes hors ligne. Les signalements se synchroniseront à la reconnexion.',
            pendingCount: '{count} signalement(s) en attente de synchronisation',
            readyToSync: 'Prêt à synchroniser',
            waitingForConnection: 'En attente de connexion',
            failedItems: 'Envois échoués',
            untitledRequest: 'Signalement sans titre',
            unknownError: 'Erreur inconnue',
            attempts: '{count} tentative(s)',
            retry: 'Réessayer',
            delete: 'Supprimer',
            allSynced: 'Tous les signalements synchronisés',
            lastSync: 'Dernière synchronisation',
            syncSuccess: '{count} signalement(s) synchronisé(s) avec succès',
            syncFailed: '{count} signalement(s) n\'ont pas pu être synchronisés',
            retrySuccess: 'Signalement synchronisé avec succès',
            retryFailed: 'Échec de la synchronisation du signalement',
            itemDeleted: 'Signalement retiré de la file d\'attente',
            queuedSuccess: 'Signalement enregistré',
            willSyncWhenOnline: 'Sera envoyé à la reconnexion.',
            queueFailed: 'Impossible d\'enregistrer le signalement pour plus tard'
        },
        failed: {
            title: 'Envois échoués',
            description: 'Ces signalements n\'ont pas pu être envoyés et nécessitent votre attention.',
            empty: 'Aucun envoi échoué',
            validation_error: 'Correction requise',
            server_error: 'Erreur serveur',
            edit: 'Modifier',
            retry: 'Réessayer',
            delete: 'Supprimer',
            confirm_delete: 'Voulez-vous vraiment supprimer ce signalement ? Cette action est irréversible.',
            untitled: 'Signalement sans titre',
            view_failed: 'Voir les échecs'
        },
        form: {
            unavailable_title: 'Formulaire indisponible hors ligne',
            unavailable_description: 'Le formulaire de signalement nécessite une connexion internet. Veuillez vous connecter et réessayer.',
            retry: 'Réessayer',
            go_back: 'Retour',
            waiting_for_connection: 'En attente de connexion...'
        }
    },
    sentiment: {
        frustrated: 'Frustré',
        neutral: 'Neutre',
        positive: 'Positif'
    },
    contact: {
        title: 'Contact',
        dialog_description: 'Formulaire de contact',
        name: 'Nom',
        name_placeholder: 'Votre nom',
        email: 'E-mail',
        email_placeholder: 'Votre adresse e-mail',
        message: 'Message',
        message_placeholder: 'Votre message...',
        copy_label: 'M\'envoyer une copie par e-mail',
        gdpr_label: 'J\'accepte le traitement de mes données',
        gdpr_required: 'Veuillez accepter le traitement des données',
        submit: 'Envoyer le message',
        sending: 'Envoi en cours...',
        success_title: 'Message envoyé',
        success_message: 'Merci pour votre message. Nous vous répondrons dans les meilleurs délais.',
        submission_failed: 'Le message n\'a pas pu être envoyé. Veuillez réessayer plus tard.',
        flood_error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        required_field: '{field} est requis',
        invalid_email: 'Veuillez saisir une adresse e-mail valide',
        close: 'Fermer',
        new_message: 'Nouveau message'
    },
    error: {
        form_error_fallback: 'Une erreur s\'est produite lors du chargement du formulaire. Veuillez réessayer.',
        404: {
            title: 'Page introuvable',
            description: 'La page que vous recherchez n\'existe pas ou a été déplacée.'
        },
        403: {
            title: 'Accès refusé',
            description: 'Vous n\'avez pas la permission d\'accéder à cette page.'
        },
        500: {
            title: 'Une erreur est survenue',
            description: 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
        },
        fallback: {
            title: 'Erreur',
            description: 'Une erreur inattendue s\'est produite.'
        },
        actions: {
            back: 'Retour',
            home: 'Retour à l\'accueil',
            retry: 'Réessayer'
        }
    },
    legal: {
        impressum: {
            title: 'Mentions légales',
            heading: 'Mentions légales',
            responsible_heading: 'Responsable du contenu',
            responsible_text: '{name} est responsable du contenu de cette plateforme.'
        },
        privacy: {
            title: 'Politique de confidentialité',
            heading: 'Politique de confidentialité',
            intro: 'La protection de vos données personnelles est importante pour nous. Nous traitons vos données exclusivement sur la base des dispositions légales (RGPD).',
            controller_heading: 'Responsable du traitement',
            data_heading: 'Données collectées',
            data_text: 'Lors de l\'utilisation de cette plateforme, les données suivantes sont traitées : données de localisation du signalement, texte descriptif, photos téléchargées et données techniques d\'accès (adresse IP, type de navigateur, heure d\'accès).',
            rights_heading: 'Vos droits',
            rights_text: 'Vous disposez d\'un droit d\'accès, de rectification, d\'effacement, de limitation du traitement, de portabilité des données et d\'opposition.'
        },
        terms: {
            title: 'Conditions d\'utilisation',
            heading: 'Conditions d\'utilisation',
            intro: 'En utilisant cette plateforme, vous acceptez les conditions suivantes.',
            purpose_heading: 'Objet',
            purpose_text: 'Cette plateforme sert à signaler des problèmes dans l\'espace public. Les signalements sont transmis à l\'autorité compétente.',
            obligations_heading: 'Obligations de l\'utilisateur',
            obligations_text: 'Vous vous engagez à fournir uniquement des informations véridiques et à ne pas télécharger de contenu illégal. Les photos téléchargées ne doivent pas montrer de personnes identifiables sans leur consentement.',
            liability_heading: 'Responsabilité',
            liability_text: '{name} n\'assume aucune responsabilité quant à l\'exhaustivité et l\'exactitude des informations fournies.'
        },
        email_label: 'E-mail',
        contact_label: 'Contact',
        platform: {
            heading: 'Opérateur de la plateforme',
            intro: 'Cette plateforme est techniquement exploitée par :',
            description: 'Civic Patches GmbH fournit l\'infrastructure technique de la plateforme Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Allemagne',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Opérateur de cette carte',
            not_configured: 'L\'opérateur de cette carte n\'a pas encore fourni ses informations légales. Les opérateurs de services en ligne accessibles au public peuvent être tenus de fournir des mentions légales et une politique de confidentialité.'
        },
        footer: {
            impressum: 'Mentions légales',
            privacy: 'Confidentialité',
            terms: 'Conditions d\'utilisation'
        },
        not_configured: 'Les données de l\'opérateur ne sont pas encore configurées.'
    },
    demo_mode: {
        banner: {
            title: 'Instance de démonstration',
            message: 'Les signalements saisis ici ne sont transmis à aucune autorité.',
            link_label: 'Visiter mark-a-spot.com',
            minimize_label: 'Réduire l’avertissement de démonstration',
            expand_label: 'Afficher l’avertissement de démonstration'
        },
        reset: {
            title: 'Base de données de démonstration',
            notice: 'Le système de démonstration est réinitialisé toutes les heures.',
            countdown_label: 'Prochaine réinitialisation dans',
            countdown_aria: 'Prochaine réinitialisation de la base de données de démonstration dans {time}'
        },
        modal: {
            title: 'Soumission de démonstration',
            body: 'Il s\'agit d\'une démo. Votre signalement NE SERA PAS transmis à la commune. Continuer avec la soumission de démonstration ?',
            confirm_label: 'Soumettre le signalement de démo',
            cancel_label: 'Annuler'
        },
        lite: {
            title: 'Démonstration uniquement',
            heading: 'Instance de démonstration',
            body: 'Ceci est une démonstration de Mark-a-Spot. Les soumissions via le formulaire simplifié sont désactivées ici afin que de vrais signalements n\'atteignent jamais accidentellement une commune.',
            link_label: 'Visiter mark-a-spot.com'
        }
    },
    print: {
        title: 'Rapport de demande de service',
        description: 'Description',
        location: 'Localisation',
        media: 'Médias',
        image_unavailable: 'Image unavailable',
        attributes: 'Champs supplémentaires',
        status_history: 'Historique des statuts',
        internal_fields: 'Informations internes',
        organisation: 'Service',
        hazard_level: 'Niveau de danger',
        hazard_category: 'Catégorie de danger',
        sentiment: 'Ressenti',
        printed_at: 'Imprimé le',
        showing_recent: 'Affichage de {count} sur {total} mises à jour'
    }
};
