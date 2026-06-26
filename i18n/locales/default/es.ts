// locales/es.ts
export default {
    locale: {
        code: 'es-ES'
    },
    meta: {
        description: 'Frontend de Mark-a-Spot'
    },
    hazard: {
        levels: {
            unknown: 'Desconocido',
            minor: 'Menor',
            moderate: 'Moderado',
            severe: 'Grave',
            extreme: 'Extremo'
        },
        categories: {
            Infra: 'Infraestructura',
            Transport: 'Transporte',
            Safety: 'Seguridad pública',
            Env: 'Medioambiental',
            Fire: 'Incendio',
            Health: 'Salud',
            Geo: 'Geofísico',
            Met: 'Meteorológico',
            Other: 'Otro'
        }
    },
    sentiment: {
        frustrated: 'Frustrado',
        neutral: 'Neutral',
        positive: 'Positivo'
    },
    nav: {
        map: 'Mapa',
        dashboard: 'Panel',
        back_to_frontend: 'Volver al Mapa'
    },
    dashboard: {
        title: 'Panel',
        welcome: 'Bienvenido, {name}',
        nav: {
            dashboard: 'Panel',
            requests: 'Solicitudes',
            settings: 'Configuración',
            categories: 'Categorías',
            jurisdictions: 'Jurisdicciones',
            metrics: 'Métricas',
            status: 'Estado',
            languages: 'Idiomas',
            billing: 'Facturación'
        },
        help: {
            docs: 'Documentación',
            support: 'Contactar con soporte'
        },
        settings: {
            languages_title: 'Configuración de idiomas',
            languages_description: 'Configure qué idiomas están disponibles y cuál se muestra por defecto para los visitantes de este espacio de trabajo.',
            languages_available: 'Idiomas disponibles',
            languages_default: 'Idioma por defecto',
            languages_saved: 'Configuración de idiomas guardada.',
            languages_min_one: 'Debe seleccionarse al menos un idioma.'
        },
        user: {
            profile: 'Perfil',
            logout: 'Cerrar sesión'
        },
        jurisdiction: {
            current: 'Espacio de trabajo',
            citizenView: 'Vista ciudadana',
            switchTo: 'Cambiar a',
            blocked: 'bloqueado',
            admin_section_header: 'Todos los espacios de trabajo (acceso de administrador)'
        },
        stats: {
            total: 'Solicitudes totales',
            pending: 'Pendientes',
            in_progress: 'En curso',
            resolved: 'Resuelto',
            my_groups: 'Mis grupos',
            overall: 'General'
        },
        recent_requests: 'Solicitudes recientes',
        view_all: 'Ver todo',
        no_recent: 'No hay solicitudes recientes',
        wms: {
            title: 'Capas del mapa',
            attribution: 'Datos: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Medios',
                category: 'Categoría',
                status: 'Estado',
                created: 'Creado'
            }
        }
    },
    form: {
        body: 'Descripción',
        body_description: 'Por favor, proporcione una descripción detallada',
        body_placeholder: 'Ingrese una descripción...',
        category: 'Categoría',
        category_description: 'Seleccione la categoría apropiada para su informe',
        category_placeholder: 'Seleccione una categoría',
        category_disabled: {
            title: 'Categoría seleccionada',
            description: 'Ha seleccionado la categoría "{category}". Esta categoría tiene requisitos especiales o no permite más ediciones del formulario.'
        },
        category_empty: 'No hay categorías disponibles',
        category_loading: 'Cargando categorías...',
        category_disabled_notice: 'Esta categoría es solo informativa. No se pueden realizar envíos.',
        category_description_loading: 'Cargando descripción...',
        category_description_error: 'Error al cargar la descripción',
        email: 'Correo electrónico',
        email_description: 'Su correo electrónico de contacto',
        email_placeholder: 'Ingrese su dirección de correo electrónico',
        first_name: 'Nombre',
        first_name_description: 'Su nombre',
        first_name_placeholder: 'Ingrese su nombre',
        last_name: 'Apellido',
        last_name_description: 'Su apellido',
        last_name_placeholder: 'Ingrese su apellido',
        gdpr: 'Acuerdo de protección de datos',
        gdpr_description: 'Estoy de acuerdo con el procesamiento de mis datos como se describe en la política de privacidad.',
        object_id: 'ID del objeto',
        object_id_description: 'Identificador del objeto reportado',
        object_id_placeholder: 'Ingrese ID del objeto (ej., número de poste)',
        phone: 'Número de teléfono',
        phone_description: 'Su número de teléfono de contacto',
        phone_placeholder: 'Ingrese su número de teléfono',

        // Informes basados en instalaciones
        facility: 'Instalación',
        facility_plural: 'Instalaciones',
        facility_placeholder: 'Seleccionar {label}',
        facility_required: '{label} es obligatorio.',
        facility_unavailable: 'La instalación seleccionada ya no está disponible, seleccione de nuevo.',
        facility_nearest_snapped: 'Instalación más cercana: {label}',
        facility_no_nearby: 'No hay instalaciones cercanas, seleccione manualmente.',
        facility_use_my_location: 'Usar mi ubicación',
        facility_locating: 'Localizando…',
        facility_no_match: 'Ninguna instalación coincide con tu búsqueda.',
        facility_opens_in_new_tab: '(se abre en pestaña nueva)',
        facility_deselected_map_pick: 'Usando tu propia ubicación en lugar de {label}',
        facility_tagged_with: 'En: {label}',

        imagelist: {
            empty: 'No hay imágenes disponibles para este tipo.'
        },
        back_to_report: 'Volver al formulario de informe',
        requirements: {
            title: 'Aún pendiente',
            ready_to_submit: 'Listo para enviar',
            photo: 'Sube una foto',
            category: 'Selecciona una categoría',
            location: 'Indica la ubicación',
            description: 'Escribe una descripción',
            email: 'Proporciona tu correo electrónico',
            privacy: 'Acepta la política de privacidad',
            privacyBlock: 'Sustituye o elimina la foto con contenido sensible',
            conditional: 'según la categoría'
        },
        body_ai_description: 'Generado automáticamente a partir de tu foto. Puedes editar el texto.',
        body_ai_placeholder: 'Generando texto a partir de la foto...'
    },
    validation: {
        body_required: 'Se requiere una descripción',
        category_required: 'Se requiere una categoría',
        email_required: 'Se requiere un correo electrónico',
        email_format: 'Formato de correo electrónico inválido',
        first_name_required: 'Se requiere el nombre',
        last_name_required: 'Se requiere el apellido',
        gdpr_required: 'Debe aceptar los términos de protección de datos',
        object_id_required: 'Se requiere el ID del objeto',
        phone_required: 'Se requiere el número de teléfono',
        required_field: '{field} es obligatorio'
    },
    feedback: {
        page_title: 'Comentarios de solicitud de servicio',
        error_title: 'Error de carga',
        invalid_request: 'Solicitud de servicio inválida o caducada',
        thank_you: '¡Gracias por sus comentarios!',
        submission_received: 'Sus comentarios han sido recibidos con éxito',
        loading: 'Cargando solicitud de servicio...',
        title: 'Comentarios para: {service}',
        description: 'Por favor proporcione sus comentarios',
        placeholder: 'Ingrese sus comentarios aquí...',
        reopen_request: 'Me gustaría que esta solicitud de servicio fuera reabierta',
        submitting: 'Enviando...',
        sending: 'Enviando...',
        submit: 'Enviar comentarios',
        existing_title: 'Sus comentarios para: {service}',
        already_submitted: 'Ya ha enviado comentarios para esta solicitud de servicio',
        missing_uuid: 'Falta ID de servicio',
        success_notification: 'Comentarios enviados con éxito',
        success_with_id: 'Comentarios enviados con éxito para la solicitud #{id}',
        updated_successfully: 'Comentarios actualizados con éxito',
        added_to_list: 'La solicitud de servicio ha sido añadida a su lista',
        submission_error: 'Error al enviar comentarios',
        server_error: 'Error del servidor: Los comentarios no se pudieron procesar en este momento',
        submission_failed: 'Error al enviar comentarios. Por favor intente más tarde',
        already_exists: 'Los comentarios ya existen para esta solicitud de servicio',
        error_fetching_request: 'Error cargando los detalles de la solicitud de servicio',
        no_content: 'Sin contenido de comentarios',
        refresh_complete: 'Lista de solicitudes actualizada',
        try_again: 'Inténtelo de nuevo',
        format_unrecognized: 'Formato de solicitud de servicio no reconocido',
        processing_error: 'Error procesando datos de solicitud de servicio',
        your_feedback: 'Sus comentarios',
        contact_preference: 'Preferencia de contacto',
        no_contact: 'Sin contacto',
        email_contact: 'Contacto por correo electrónico',
        email_placeholder: 'Su dirección de correo electrónico',
        set_status_open: 'Establecer estado como abierto',
        set_status_open_description: 'En caso de que desee que revisemos esto nuevamente, puede reabrir esta solicitud de servicio.',
        email_verification: 'Verificación de correo electrónico',
        email_verification_placeholder: 'Dirección de correo electrónico del informe original',
        email_verification_description: 'Ingrese la dirección de correo electrónico que utilizó al crear el informe original.',
        email_mismatch: 'La dirección de correo electrónico ingresada no coincide con el informe original.',
        unauthorized_access: 'Acceso no autorizado. Por favor verifique su dirección de correo electrónico.',
        not_eligible: 'Esta solicitud de servicio no es elegible actualmente para comentarios',
        service_provider: {
            page_title: 'Respuesta del proveedor de servicios',
            page_description: 'Enviar notas de finalización para solicitudes de servicio asignadas',
            modal_title: 'Respuesta del proveedor de servicios',
            dialog_description: 'Diálogo del formulario de respuesta del proveedor de servicios',
            title: 'Completar asignación',
            your_email: 'Su dirección de correo electrónico',
            email_placeholder: 'proveedor{\'@\'}ejemplo.com',
            email_verification_note: 'Ingrese su correo electrónico de proveedor de servicios para verificación',
            completion_notes: 'Notas de finalización',
            notes_placeholder: 'Describa el trabajo que se ha completado...',
            mark_as_completed: 'Marcar como completado',
            mark_as_completed_description: 'Establecer el estado de la solicitud como completado',
            submit_completion: 'Enviar finalización',
            complete_request: 'Completar asignación',
            completing: 'Enviando...',
            completion_success: 'Finalización de solicitud de servicio enviada con éxito',
            submission_failed: 'Error al enviar finalización. Por favor intente más tarde',
            server_error: 'Error del servidor: La finalización no se pudo procesar en este momento',
            completion_not_allowed: 'Esta solicitud no se puede completar en este momento',
            email_verification_failed: 'Verificación de correo electrónico fallida. Por favor verifique su dirección de correo electrónico',
            already_completed: 'Esta solicitud ya ha sido completada',
            loading: 'Cargando solicitud de servicio...',
            try_again: 'Inténtelo de nuevo',
            invalid_uuid: 'Solicitud de servicio inválida o caducada',
            load_error: 'Error cargando detalles de solicitud de servicio',
            error_fetching_request: 'Error cargando los detalles de la solicitud de servicio',
            completion_notes_required: 'Por favor proporcione notas de finalización',
            existing_completions: 'Finalizaciones anteriores',
            reassignment_note: 'Esta solicitud ha sido marcada para reasignación y puede recibir múltiples finalizaciones',
            mark_completed_description: 'Confirmar que el trabajo ha sido completado'
        },
        dialog_description: 'Diálogo del formulario de comentarios'
    },
    service_unavailable: {
        title: 'Servicio temporalmente no disponible',
        message: 'No podemos conectar con nuestros servicios en este momento. Este problema es probablemente temporal.',
        retry: 'Estamos experimentando dificultades técnicas. Por favor intente nuevamente en {seconds} segundos.',
        auto_retry: 'Reintentando en {seconds} segundos...',
        retry_now: 'Reintentar ahora',
        try_later: 'Por favor, inténtelo de nuevo más tarde.',
        reload: 'Recargar'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Su informe. Nuestra solución.'
    },
    hiddenSection: {
        description: 'Nuestro reportero de problemas es un sistema de informes para problemas de infraestructura. Puede proceder directamente a informar problemas o navegar a lo siguiente:',
        main_navigation: 'Navegación principal con información, una lista de informes y estadísticas',
        map: 'Mapa interactivo con marcadores visuales',
        map_navigation_hint: 'Use las teclas de flecha ⬆️⬇️⬅️➡️ para navegar entre marcadores de informe, ↩️ Enter para seleccionar, ❌ Escape para borrar selección',
        action_button: 'Informar directamente',
        keyboard_navigation_hint: 'Use las teclas de flecha para navegar, Enter para activar',
        skip_to_main_content: 'Saltar al contenido principal'
    },
    accessibility: {
        skip_to_main: 'Saltar al contenido principal',
        skip_to_map: 'Saltar al mapa',
        skip_to_navigation: 'Saltar a la navegación',
        skip_to_form: 'Informar directamente',
        leichte_sprache_indicator: 'Lectura fácil: textos sencillos para todos'
    },
    common: {
        back: 'Atrás',
        not_classified: 'No clasificado',
        no_value: 'Sin valor',
        close: 'Cerrar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        submit: 'Enviar',
        cancel: 'Cancelar',
        required: 'Requerido',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        clear: 'Limpiar',
        search: 'Buscar',
        select: 'Seleccionar',
        on: 'Activado',
        off: 'Desactivado',
        toggle: 'Alternar',
        yesterday: 'Ayer',
        did_you_know: '¿Sabía qué?',
        show_more: 'Mostrar más',
        show_less: 'Mostrar menos',
        learn_more: 'Más información',
        learn_more_about: 'Más información sobre {topic}',
        opens_in_new_tab: '(se abre en pestaña nueva)',
        title: {
            classic: 'Informe clásico',
            photo: 'Informe con foto'
        },
        buttons: {
            toggle_theme: 'Cambiar tema',
            attribution: 'Atribución del mapa',
            close: 'Cerrar'
        },
        navigation: 'Cajón de navegación',
        drawer_description: 'Panel de contenido y opciones',
        resize_drawer: 'Ajustar panel',
        drawer_position_n_of_total: 'posición {idx} de {total}',
        current: 'Actual',
        share: 'Compartir',
        copy_coordinates: 'Copiar coordenadas',
        open_in_maps: 'Abrir en Mapas'
    },
    fields: {
        field_geolocation: 'Ubicación',
        field_gdpr: 'Consentimiento de procesamiento de datos',
        field_e_mail: 'Correo electrónico',
        field_category: 'Categoría',
        field_request_media: 'Fotos',
        field_name: 'Apellido',
        field_prename: 'Nombre',
        field_first_name: 'Nombre',
        field_first_name_placeholder: 'Por favor ingrese nombre',
        field_last_name: 'Apellido',
        field_last_name_placeholder: 'Por favor ingrese apellido',
        field_phone: 'Teléfono',
        body: 'Descripción',
        field_add_data: 'Participación en el concurso',
        field_terms_of_use: 'Acepto los términos y condiciones y la política de privacidad.',
        field_address: 'Dirección',
        postal_code: 'Código postal',
        postal_code_placeholder: 'ej. 10001',
        city: 'Ciudad',
        city_placeholder: 'ej. Nueva York',
        street_address: 'Dirección',
        street_address_placeholder: 'ej. Calle Principal 123'
    },
    competition: {
        intro: 'Si lo desea, participe en nuestro sorteo anual. Tiene la oportunidad de ganar premios atractivos y recompensas en efectivo que distribuimos entre todos los participantes como un pequeño agradecimiento.',
        disclaimer: 'Los empleados de los departamentos responsables están excluidos de la participación.',
        title: 'Participación en el concurso',
        errors: {
            already_exists: 'La entrada al concurso ya existe',
            duplicate_found: 'Duplicado encontrado',
            duplicate_detail: 'Ya se ha creado una entrada al concurso para este informe.',
            not_found: 'Informe no encontrado',
            not_found_detail: 'No se pudo encontrar el informe asociado.',
            save_failed: 'No se pudo guardar la entrada al concurso',
            submission_error: 'Error de envío',
            submission_error_detail: 'Su entrada al concurso no se pudo guardar, pero su informe se envió con éxito.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Pestaña de información',
                panel_label: 'Panel de información'
            },
            list: {
                label: 'Lista',
                aria_label: 'Pestaña de lista de informes',
                panel_label: 'Panel de lista de informes'
            },
            following: {
                label: 'Siguiendo',
                aria_label: 'Pestaña de informes seguidos',
                panel_label: 'Panel de informes seguidos'
            },
            stats: {
                label: 'Estadísticas',
                aria_label: 'Pestaña de estadísticas',
                panel_label: 'Panel de estadísticas'
            }
        },
        main: 'Navegación principal',
        pages: 'Navegación de página',
        browse_reports: 'Explorar informes',
        back_to_form: 'Volver al formulario',
        panel: {
            scrollable: 'Área desplazable'
        },
        updates_count: '{count} nuevas actualizaciones'
    },
    report: {
        form_types: 'Tipos de informe',
        how_to_help: 'Cómo crear una incidencia',
        title: {
            photo: 'Informe con foto',
            classic: 'Informe clásico',
            submit: 'Enviar informe',
            edit: 'Editar informe',
            view: 'Ver informe'
        },
        photo: {
            description: 'Crear un nuevo informe con una foto'
        },
        classic: {
            description: 'Crear un nuevo informe sin una foto'
        },
        status: {
            new: 'Nuevo',
            open: 'Abierto',
            in_progress: 'En curso',
            resolved: 'Resuelto',
            closed: 'Cerrado',
            unknown: 'Estado desconocido'
        },
        form: {
            tabs: {
                photo: 'Con foto',
                classic: 'Clásico'
            },
            description: {
                label: 'Descripción',
                placeholder: 'Por favor describa el problema...',
                ai_processing: 'IA está generando una descripción...',
                help: 'Proporcione tanto detalle como sea posible'
            },
            category: {
                label: 'Categoría',
                placeholder: 'Seleccione una categoría',
                loading: 'Cargando categorías...',
                error: 'Error cargando categorías',
                empty: 'No hay categorías disponibles',
                help: 'Selección de categoría (hecha automáticamente)',
                description: 'Descripción de categoría',
                description_loading: 'Cargando descripción...',
                description_error: 'Error cargando descripción',
                disabled_notice: 'Esta categoría es solo para información. No es posible realizar envíos.'
            },
            location: {
                label: 'Ubicación',
                placeholder: 'Buscar una ubicación...',
                selected: 'Ubicación seleccionada',
                clear: 'Borrar ubicación',
                error: 'Error obteniendo ubicación',
                help: 'Ingrese una dirección o haga clic en el mapa',
                help_modal: 'Ingrese una dirección o use su ubicación actual',
                current: 'Usar ubicación actual',
                searching: 'Buscando...',
                pick_on_map: 'Seleccionar en el mapa',
                auto_detected: 'Ubicación detectada',
                complete_address: 'Dirección completa',
                from_photo_exif: 'Ubicación extraída automáticamente de los metadatos de la foto',
                warning: 'Aviso de ubicación',
                unknown_location: 'Ubicación desconocida',
                suggestions: 'Sugerencias de ubicación'
            },
            email: {
                label: 'Correo electrónico para actualizaciones',
                placeholder: 'Ingrese su dirección de correo electrónico',
                help: 'Le enviaremos actualizaciones sobre su informe',
                subscribe: 'Suscribirse a actualizaciones'
            },
            gdpr: {
                label: 'Consentimiento de procesamiento de datos',
                description: 'Acepto el procesamiento de mis datos de acuerdo con la política de privacidad.',
                required: 'Debe aceptar para continuar',
                link: 'Ver política de privacidad'
            },
            media: {
                label: 'Fotos',
                required: 'Se requiere una foto para esta categoría',
                upload: {
                    overall_progress: 'Progreso general',
                    button: 'Haga clic para subir',
                    or: ' o',
                    drag: 'arrastre y suelte',
                    drop_here: 'Suelte archivos aquí para subir',
                    restrictions: 'Hasta {count} imágenes ({size} máx., {types})',
                    restrictions_single: 'Una imagen ({size} máx., {types})',
                    progress: 'Progreso de subida',
                    started_sr: 'Subida iniciada',
                    progress_sr: 'Subida {progress}% completa',
                    success_sr: 'Subida completada con éxito',
                    error_sr: 'Subida fallida: {error}',
                    files_selected_sr: '{count} archivo(s) seleccionado(s) para subir',
                    area_label: 'Área de subida de fotos - haga clic para seleccionar archivos o arrastre y suelte',
                    in_progress: 'Subida en curso',
                    complete_sr: 'El archivo se ha subido con éxito.',
                    description: 'Sube imágenes haciendo clic, tocando o arrastrando archivos aquí. Formatos admitidos: JPEG, PNG, GIF.'
                },
                preview: 'Vista previa de imagen',
                remove: 'Eliminar imagen',
                no_image_available: 'No hay imagen disponible o no se muestra por razones legales',
                progress: 'Progreso de subida: {progress}%',
                limit_reached: 'Número máximo de {count} imágenes alcanzado',
                privacy_notice: 'Por favor, sin personas/placas en las fotos',
                ai_analysis: 'Análisis vía Azure AI (Alemania)',
                ai_analysis_tooltip: 'Al subir, confirma que la foto fue tomada legalmente y no viola los derechos de terceros.\n\nSi hay personas o placas reconocibles, por favor hágales irreconocibles antes de subir.\n\nEl análisis sirve exclusivamente para categorizar su informe. Solo se transmite una copia reducida, libre de EXIF a Azure OpenAI (Alemania); el original no se envía al servicio.',
                offline_cached: 'Guardado sin conexión',
                ai_analysis_help: 'Información sobre el análisis de IA'
            },
            submit: {
                button: 'Enviar informe',
                submitting: 'Enviando...',
                processing: 'Procesando...',
                success: 'Informe enviado con éxito',
                error: 'Error enviando informe',
                loading: 'Cargando formulario...'
            },
            loading: 'Cargando formulario de informe...',
            draft_saved: 'Borrador guardado',
            modal_description: 'Crear un nuevo informe'
        },
        ai: {
            label: 'IA',
            powered: 'Impulsado por IA',
            analyzing: 'IA está analizando sus fotos...',
            started_sr: 'Análisis de IA iniciado',
            complete_sr: 'Análisis de IA completado con éxito',
            field_updated_sr: '{field} ha sido actualizado con: {value}',
            analysis_complete_sr: 'Análisis de IA completo.',
            category_result_sr: 'Categoría seleccionada: {category}.',
            description_result_sr: 'Descripción generada: {description}',
            location_result_sr: 'Ubicación encontrada: {location}.',
            category_hint: 'Esta foto no parece coincidir con nuestras categorías de reporte. Por favor, elige tú mismo una categoría.',
            processing: {
                analyzing: 'Preguntando a la IA...',
                location: 'Comprobando metadatos de imagen...',
                location_found: 'Ubicación encontrada:',
                location_ai: 'Buscando ubicación en imagen...',
                location_not_found: 'Ubicación no encontrada en metadatos de imagen.',
                location_complete: 'Ubicación identificada',
                category: 'Identificando categoría...',
                category_found: 'Categoría identificada:',
                category_not_matched: 'Categoría sugerida por IA (necesita selección)',
                description: 'Generando descripción...',
                description_complete: 'Descripción generada',
                attributes_filled: '{count} campo(s) adicional(es) completado(s) automáticamente',
                complete: 'Análisis de IA completo',
                error: 'Error durante análisis de IA',
                privacy_warning: 'Problema de privacidad detectado'
            },
            privacy: {
                title: 'Aviso de privacidad',
                description: 'Se han detectado posibles datos personales en su foto ({issues}). La foto será revisada antes de su publicación.',
                required: 'Se ha detectado contenido sensible para la privacidad en esta foto y no hay ocultación automática disponible. La foto no puede utilizarse. Sustitúyala o elimínela para continuar.',
                removePhoto: 'Eliminar foto',
                replace: 'Reemplazar foto',
                understood: 'Continuar con esta foto'
            },
            failed: {
                title: 'Análisis de imagen no disponible',
                description: 'Su foto será revisada manualmente antes de la publicación. Puede enviar su informe de todos modos.'
            },
            budget_exhausted_title: 'Análisis de IA omitido',
            budget_exhausted_submitted: 'El presupuesto de análisis de IA para este mes se ha agotado. Su informe fue enviado correctamente.'
        },
        buttons: {
            photo: 'Informe con foto',
            classic: 'Informe clásico',
            follow: 'Seguir informe',
            following: 'Siguiendo',
            share: 'Compartir informe',
            print: 'Imprimir',
            flag: 'Denunciar',
            flag_submitted: 'Ya denunciado',
            copy_link: 'Copiar enlace',
            link_copied: 'Enlace copiado al portapapeles',
            email: 'Correo electrónico',
            directions: 'Obtener indicaciones'
        },
        following: {
            count: 'Siguiendo {count} informe(s)',
            mark_all_read: 'Marcar todo como leído',
            no_reports: 'Aún no hay informes seguidos',
            no_address: 'No hay dirección disponible',
            status_updated: 'Estado actualizado',
            status_changed: 'Estado cambiado a:',
            awaiting_server: 'Esperando actualización',
            escalated_to: 'Reenviado a {jurisdiction}',
            escalated_click: 'Toque para abrir en la nueva jurisdicción',
            unavailable: 'Este reporte no está disponible actualmente. Por favor, revise su correo electrónico o contáctenos.',
            date: {
                today: 'Hoy',
                tomorrow: 'Mañana',
                yesterday: 'Ayer',
                unknown: 'Fecha desconocida'
            }
        }
    },
    map: {
        tap_to_load: 'Toque para mostrar mapa',
        tap_to_select_location: 'Toque en el mapa para seleccionar ubicación',
        loading: 'Cargando mapa...',
        loading_address: 'Cargando dirección...',
        retry_attempt: 'Intento {count}',
        confirm_location: 'Confirmar ubicación',
        add_report_here: 'Añadir informe aquí',
        controls: {
            zoom_in: 'Acercar',
            zoom_out: 'Alejar',
            find_location: 'Encontrar mi ubicación',
            toggle_heatmap: 'Alternar mapa de calor',
            toggle_language: 'Cambiar idioma',
            add_report_here: 'Informar aquí',
            adjust_tilt: 'Ajustar inclinación',
            degrees: '{count} grados',
            layers: 'Capas del mapa',
            no_layers: 'No hay capas disponibles',
            geolocation: {
                label: 'Obtener ubicación actual'
            },
            zoom: 'Controles de zoom'
        },
        pick: {
            drag_hint: 'Arrastre el marcador para ajustar la posición'
        },
        tooltip: {
            label: 'Información del marcador del mapa',
            opens_form_above: 'Abre formulario arriba',
            opens_modal: 'Abre en diálogo'
        },
        keyboard: {
            canvasInstructions: 'Mapa interactivo con marcadores de informes. Las teclas de flecha navegan entre marcadores, Mayús+flecha desplaza el mapa, Intro selecciona. Pulse Ctrl+= para acercar, Ctrl+- para alejar.',
            noFeatures: 'No hay marcadores visibles en la vista actual. Pruebe a acercar o desplazar el mapa.',
            zoomedIntoCluster: 'Acercado al área del grupo. Use las teclas de flecha para navegar entre marcadores.',
            clusterFocused: 'Grupo con {count} informes enfocado. Pulse Intro para expandir. {position}',
            clusterExpanded: 'Grupo expandido en {count} informes. {featureLabel}',
            markerFocused: 'Informe enfocado: {name} en {address}{context}. Pulse Intro para abrir detalles. {position}',
            expandedContext: ' (expandido desde grupo)',
            untitledReport: 'Informe sin título',
            unknownLocation: 'ubicación',
            featurePosition: 'Elemento {current} de {total}.',
            pannedToExplore: 'Mapa desplazado {direction}. Suelte Mayús y use las teclas de flecha para navegar.',
            pannedNoMarkers: 'Mapa desplazado {direction}. No se encontraron marcadores en esta dirección. Use las teclas de flecha para seguir explorando.'
        }
    },
    detail: {
        location: 'Ubicación',
        photos: 'Fotos',
        description: 'Descripción',
        status_history: 'Historial de estado',
        updates: 'Actualizaciones',
        no_updates: 'Aún no hay actualizaciones',
        edit: 'Editar',
        follow: {
            button: 'Seguir',
            following: 'Siguiendo',
            stop: 'Dejar de seguir',
            success: 'Ahora está siguiendo este informe',
            error: 'Error siguiendo informe',
            updating: 'Actualizando...'
        },
        unavailable: {
            title: 'Informe no disponible',
            message: 'Este informe no existe o aún no ha sido publicado. Los informes recién enviados pueden tardar un momento en aparecer.'
        },
        dialog_description: 'Ver detalles del informe'
    },
    stats: {
        status_overview: 'Estado',
        pie_chart: 'Distribución',
        total_reports: 'Informes totales',
        status_distribution: 'Distribución de estado',
        category_distribution: 'Distribución de categoría',
        uncategorized: 'Sin categorizar',
        showing_reports: 'Mostrando {visible} de {total} informes',
        no_reports: 'No hay informes disponibles',
        open_reports: 'Informes abiertos',
        closed_reports: 'Informes cerrados',
        no_data_available: 'No hay datos disponibles',
        expand: 'Mostrar detalles',
        collapse: 'Ocultar detalles',
        subcategory: 'subcategoría',
        subcategories: 'subcategorías'
    },
    time: {
        days_ago: 'hace {count} días',
        just_now: 'Justo ahora',
        minutes_ago: 'hace {count} minutos',
        hours_ago: 'hace {count} horas',
        yesterday: 'Ayer',
        today: 'Hoy'
    },
    list: {
        showing: 'Mostrando {visible} de {total} informes',
        showing_in_area: '{visible} en esta zona, {total} en total',
        showing_area_only: '{visible} en esta zona',
        no_results: 'No se encontraron informes',
        no_filtered_results: 'No hay informes que coincidan con sus criterios de filtro',
        load_more: 'Todos los informes cargados',
        load_more_button: 'Cargar más',
        newest_first: 'Más nuevos primero',
        oldest_first: 'Más antiguos primero',
        refresh: 'Actualizar',
        status_update: 'Estado actualizado',
        location: 'Ubicación',
        unpublished: 'No publicado',
        editable: 'Editable'
    },
    errors: {
        general: 'Algo salió mal',
        search_failed: 'La búsqueda falló. Por favor, inténtelo de nuevo.',
        api: {
            rate_limit: 'Demasiadas solicitudes. Por favor espere un momento e intente de nuevo.',
            unauthorized: 'No autorizado. Por favor inicie sesión de nuevo.',
            forbidden: 'Acceso denegado.',
            not_found: 'Recurso no encontrado.',
            server_error: 'Error del servidor. Por favor intente más tarde.',
            default: 'Error de API: {status}'
        },
        upload_failed: 'Subida fallida',
        location_error: 'No se puede determinar la ubicación',
        network_error: 'Error de red',
        geolocation: {
            title: 'Error de ubicación',
            permission_denied: 'Permiso de ubicación denegado. Por favor, permita el acceso en la configuración de su navegador.',
            unavailable: 'La información de ubicación no está disponible actualmente.',
            timeout: 'La solicitud de ubicación ha expirado.',
            unknown: 'Se ha producido un error de ubicación desconocido.'
        },
        try_again: 'Por favor intente de nuevo',
        validation: {
            title: 'Lo sentimos, no podemos procesar esta solicitud:',
            location_error_title: 'Error de ubicación',
            invalid_input: 'Entrada inválida',
            duplicate_title: 'Duplicado encontrado',
            duplicate_found: 'Informe similar encontrado',
            duplicate_report: 'Ya se ha creado un informe similar (No. {reportId})',
            location_out_of_bounds: 'La ubicación seleccionada está fuera de nuestra jurisdicción',
            required_field: '{field} es obligatorio',
            required_fields: 'Por favor complete todos los campos requeridos',
            please_review: 'Por favor revise el formulario y corrija cualquier error antes de enviar.',
            file_size: 'El archivo seleccionado es demasiado grande (máx. 10 MB)',
            file_type: 'El formato no es compatible (permitido: jpg, png, webp)',
            media_upload: 'Error subiendo imagen',
            invalid_format: 'Formato inválido para {field}',
            photo_required: 'Se requiere una foto para esta categoría',
            duplicate_hint_title: 'Posible duplicado encontrado',
            duplicate_hint_message: 'Es posible que ya exista un informe similar en esta zona. Puedes enviarlo igualmente si crees que se trata de un problema nuevo.',
            duplicate_existing_report: 'Informe existente: n.º {reportId}',
            view_existing_report: 'Ver informe existente',
            submit_anyway: 'Enviar de todos modos',
            consent_required: 'Por favor, acepta la política de privacidad'
        },
        rate_limit: {
            title: 'Límite de tasa excedido',
            general: 'Por favor intente más tarde.',
            with_time: 'Por favor intente de nuevo en {seconds} segundos.'
        },
        network: 'Problema de conexión. Por favor verifique su conexión a internet',
        timeout: 'Tiempo de espera agotado. Por favor intente de nuevo',
        upload: {
            invalid_type: 'Tipo de archivo inválido. Por favor suba solo imágenes.',
            file_too_large: 'Archivo demasiado grande. El tamaño máximo es {size}.',
            dimensions_too_large: 'Dimensiones de imagen demasiado grandes. Máximo {width}x{height} píxeles.',
            invalid_image: 'Archivo de imagen inválido o corrupto.',
            failed: 'Subida fallida. Por favor intente de nuevo.',
            limit_reached: 'Número máximo de {count} archivos alcanzado.',
            remove_to_add: 'Elimine una foto para añadir una nueva',
            single_file_limit: 'Solo se puede subir una imagen.',
            exact_file_limit: 'Se pueden subir un máximo de {count} imágenes.',
            title: 'Error al subir',
            file_too_large_raw: 'Archivo demasiado grande ({size} máximo). Elige una imagen más pequeña.',
            optimization_failed: 'No se pudo comprimir la imagen. Tamaño máximo tras compresión: {size}.'
        },
        submission_error: 'Error enviando o subiendo la imagen.',
        unknown: 'Ocurrió un error desconocido.',
        pending_uploads: 'Por favor espere hasta que todas las subidas estén completas.',
        incomplete_form: 'Por favor complete todos los campos requeridos.',
        page: {
            title: 'Error',
            not_found_title: 'Página no encontrada',
            not_found_message: 'Lo sentimos, la página que busca no existe.',
            server_error_title: 'Error del servidor',
            server_error_message: 'Lo sentimos, algo salió mal en nuestro servidor.',
            generic_title: 'Ocurrió un error',
            generic_message: 'Ha ocurrido un error inesperado.',
            action_home: 'Volver al inicio',
            action_back: 'Ir atrás',
            action_retry: 'Intentar de nuevo',
            details: 'Detalles del error'
        }
    },
    success: {
        report_submitted: 'Informe enviado',
        report_submitted_description: 'Su informe ha sido enviado con éxito y será revisado en breve.',
        moderation_notice: 'Su informe será revisado antes de publicarse. Su número de referencia:',
        submit_another: 'Enviar otro informe',
        auto_followed: 'Este informe se ha añadido automáticamente a sus informes seguidos',
        visibility_limitation_notice: 'Tenga en cuenta que no todos los informes se vuelven públicamente visibles a través del sitio web. Si su informe no se actualiza en la lista de informes seguidos, es posible que aún haya sido procesado por la ciudad. Verifique su correo electrónico para actualizaciones de estado.',
        fun_facts: [
            '🌱 ¡Cada informe que envía ayuda a hacer de su ciudad un mejor lugar para vivir!',
            '🏙️ Los informes ciudadanos han ayudado a solucionar más de 10,000 problemas en ciudades de todo el mundo.',
            '⚡ El informe promedio se revisa dentro de las 24 horas.',
            '🤝 ¡Eres parte de una comunidad que se preocupa por los espacios públicos!',
            '📊 Los datos de los informes ciudadanos ayudan a los planificadores urbanos a tomar mejores decisiones.',
            '🔄 Seguir sus informes le mantiene actualizado sobre el progreso automáticamente.',
            '🎯 Los informes con fotos se procesan 3 veces más rápido que los informes solo de texto.',
            '🌍 Existen plataformas de participación ciudadana como esta en más de 50 países.',
            '💡 Sus comentarios ayudan a priorizar qué problemas se solucionan primero.',
            '🚀 Los informes digitales han reducido los tiempos de respuesta hasta en un 60%.',
            '🏆 Los ciudadanos activos hacen comunidades más fuertes y resilientes.',
            '🔍 El análisis de IA ayuda a categorizar sus informes con mayor precisión.',
            '📱 Los informes móviles facilitan informar problemas tal como los ve.',
            '⭐ ¡Gracias por ser un ciudadano comprometido!'
        ]
    },
    flag: {
        title: 'Denunciar este informe',
        description: 'Ayúdenos a mantener la calidad reportando contenido inapropiado.',
        reason_label: '¿Por qué denuncia este informe?',
        reason_spam: 'Spam o publicidad',
        reason_offensive: 'Contenido ofensivo o inapropiado',
        reason_personal: 'Contiene datos personales',
        reason_location: 'Ubicación incorrecta',
        reason_other: 'Otro',
        details_label: 'Detalles adicionales',
        details_placeholder: 'Por favor describa el problema...',
        details_required: 'Por favor proporcione detalles',
        submit: 'Enviar',
        success: 'Gracias. Revisaremos este informe.',
        error: 'No se pudo enviar. Por favor intente de nuevo.',
        already_flagged: 'Ya ha denunciado este informe.'
    },

    pwa: {
        install: {
            title: 'Instalar aplicación',
            button: 'Instalar',
            not_now: 'Ahora no',
            description: 'Haga clic en el icono de instalación en la barra de direcciones de su navegador para instalar esta aplicación.',
            share_button: 'Icono de compartir',
            open_safari: 'Navegador Safari',
            ios: {
                title: 'Añadir a pantalla de inicio',
                safari_instructions: 'Toque el {icon} y seleccione "Añadir a pantalla de inicio".',
                other_instructions: 'Por favor abra este sitio en {browser} para instalar.'
            },
            chrome: {
                instructions: 'Haga clic en el icono de instalación {icon} en la barra de herramientas para instalar esta aplicación.'
            },
            edge: {
                instructions: 'Haga clic en el icono de instalación {icon} en la barra de direcciones.'
            },
            firefox: {
                instructions: 'Haga clic en el icono de inicio {icon} en la barra de direcciones.'
            }
        }
    },
    boundaries: {
        loading: 'Cargando datos de límites...',
        error: 'No se pueden validar los límites de ubicación. Por favor intente más tarde.',
        notLoaded: 'Límites aún no cargados',
        outsideNonStrict: 'Nota: La ubicación seleccionada está fuera de los límites de {locationName}.',
        outsideStrict: 'La ubicación seleccionada está fuera de los límites de {locationName}. Por favor seleccione una ubicación dentro de los límites de la ciudad.',
        validationUnavailable: 'Validación de límites no disponible. Su informe será aceptado pero puede ser revisado.'
    },
    filters: {
        title: 'Filtros',
        status: {
            title: 'Estado'
        },
        time: {
            title: 'Tiempo',
            today: 'Hoy',
            week: 'Esta semana',
            month: 'Este mes'
        },
        category: {
            title: 'Categoría',
            other: 'Otro'
        },
        actions: {
            more: 'Más filtros',
            expand: 'Más filtros',
            collapse: 'Menos',
            clear_all: 'Borrar todo',
            active_count: '{count} filtros activos',
            toggle: 'Filtros'
        }
    },
    privacy: {
        notice_text: 'Puede encontrar información sobre privacidad',
        notice_link_text: 'aquí',
        modal: {
            title: 'Política de privacidad',
            loading: 'Cargando información de privacidad...',
            retry: 'Reintentar',
            noContent: 'No hay información de privacidad disponible.',
            lastUpdated: 'Última actualización',
            close: 'Cerrar'
        }
    },
    search: {
        placeholder: 'Buscar informes...',
        no_results_local: 'No se encontraron resultados en la vista actual',
        expand_to_server: 'Buscar todos los informes',
        expand_hint: 'Buscar más allá de la vista actual',
        searching_server: 'Buscando todos los informes...'
    },
    info: {
        welcome: {
            heading: 'Bienvenido a {name}',
            headingGeneric: 'Bienvenido',
            body: 'Usa este mapa para reportar problemas o conocer los informes existentes en tu área.'
        },
        shortcuts: {
            aria_label: 'Acciones rápidas',
            photo: {
                title: 'Foto',
                description: 'Toma una foto, la IA hace el resto',
                aria_label: 'Crear un informe con foto'
            },
            classic: {
                title: 'Clásico',
                description: 'Describe y localiza el problema',
                aria_label: 'Crear un informe clásico'
            },
            following: {
                title: 'Seguir',
                description: 'Mantente informado del progreso',
                aria_label: 'Abrir informes seguidos'
            },
            list: {
                title: 'Explorar',
                description: 'Descubre qué pasa cerca de ti',
                aria_label: 'Explorar el mapa y ver la lista'
            }
        }
    },
    auth: {
        login: {
            title: 'Iniciar sesión',
            subtitle: 'Ingrese su correo electrónico para recibir un código de verificación',
            email_label: 'Dirección de correo electrónico',
            email_hint: 'Le enviaremos un código de 6 dígitos',
            email_placeholder: 'dirección de correo electrónico',
            send_code: 'Enviar código de verificación',
            disabled: {
                title: 'Inicio de sesión no disponible',
                message: 'El inicio de sesión sin contraseña no está activado aquí. Póngase en contacto con el administrador si necesita acceso.',
                back_button: 'Volver al inicio'
            }
        },
        verify: {
            email_label: 'Dirección de correo electrónico',
            code_label: 'Código de verificación',
            code_hint: 'Ingrese el código de 6 dígitos de su correo electrónico',
            code_placeholder: '123456',
            verify_button: 'Verificar e iniciar sesión',
            back_button: 'Usar correo electrónico diferente',
            request_new: 'Solicitar nuevo código',
            resend_code: 'Reenviar código',
            expires_in: 'El código expira en {time}',
            expired_title: 'Código expirado',
            expired_message: 'Su código de verificación ha expirado. Por favor solicite uno nuevo.'
        },
        code_sent: {
            title: 'Código enviado',
            message: 'Enviamos un código de verificación de 6 dígitos a {email}'
        },
        error: {
            title: 'Error de autenticación',
            request_failed: 'Error al enviar el código de verificación. Por favor intente de nuevo.',
            verify_failed: 'Código de verificación inválido o expirado',
            sso_failed: 'Error al iniciar sesión. Por favor intente de nuevo.',
            network: 'Error de red. Por favor verifique su conexión.',
            logout_failed: 'Error al cerrar sesión. Por favor intente de nuevo.'
        },
        sso: {
            completing: 'Completando inicio de sesión...',
            method_label: 'Inicio de sesión único',
            button_aria: 'Iniciar sesión con {provider} mediante inicio de sesión único'
        },
        user: {
            logged_in_as: 'Iniciado sesión como',
            logout: 'Cerrar sesión'
        },
        welcome: {
            greeting: 'Hola, {name}',
            sign_in: 'Iniciar sesión',
            sign_out: 'Cerrar sesión',
            user_avatar: 'Avatar del usuario'
        }
    },
    profile: {
        title: 'Perfil',
        account: {
            title: 'Cuenta',
            roles: 'Roles'
        },
        groups: {
            title: 'Grupos'
        },
        appearance: {
            title: 'Apariencia',
            color_mode: 'Modo de color',
            light: 'Claro',
            dark: 'Oscuro',
            system: 'Sistema',
            theme_override: 'Colores de tema personalizados',
            theme_override_description: 'Anule el tema predeterminado de la jurisdicción con sus propias preferencias de color',
            primary_color: 'Color primario',
            secondary_color: 'Color secundario',
            neutral_color: 'Color neutral',
            reset_theme: 'Restablecer a predeterminado'
        },
        language: {
            title: 'Idioma',
            select: 'Seleccionar idioma',
            save_failed: 'No se pudo guardar la preferencia de idioma. Por favor, inténtalo de nuevo.'
        }
    },
    service_provider: {
        page_title: 'Respuesta del proveedor de servicios',
        page_description: 'Enviar notas de finalización para solicitudes asignadas',
        modal_title: 'Respuesta del proveedor de servicios',
        dialog_description: 'Diálogo del formulario de respuesta del proveedor de servicios',
        title: 'Completar asignación',
        your_email: 'Su dirección de correo electrónico',
        email_placeholder: 'proveedor{\'@\'}ejemplo.com',
        email_verification_note: 'Introduzca su correo de proveedor de servicios para verificación',
        completion_notes: 'Notas de finalización',
        notes_placeholder: 'Describa el trabajo que se ha realizado...',
        mark_as_completed: 'Marcar como completado',
        mark_as_completed_description: 'Establecer el estado de la solicitud como completado',
        submit_completion: 'Enviar finalización',
        complete_request: 'Completar asignación',
        completing: 'Enviando...',
        completion_success: 'Finalización de solicitud enviada con éxito',
        submission_failed: 'Error al enviar la finalización. Por favor, inténtelo más tarde',
        server_error: 'Error del servidor: no se pudo procesar la finalización en este momento',
        completion_not_allowed: 'Esta solicitud no puede completarse en este momento',
        email_verification_failed: 'Verificación de correo fallida. Por favor, compruebe su dirección de correo',
        already_completed: 'Esta solicitud ya ha sido completada',
        loading: 'Cargando solicitud de servicio...',
        try_again: 'Intentar de nuevo',
        invalid_uuid: 'Solicitud de servicio no válida o caducada',
        load_error: 'Error al cargar los detalles de la solicitud',
        error_fetching_request: 'Error al cargar los detalles de la solicitud de servicio',
        completion_notes_required: 'Por favor, proporcione notas de finalización',
        existing_completions: 'Finalizaciones anteriores',
        reassignment_note: 'Esta solicitud ha sido marcada para reasignación y puede recibir múltiples finalizaciones'
    },
    pages: {
        dialog_description: 'Ver contenido de la página'
    },
    offline: {
        banner: {
            title: 'Estás sin conexión',
            description: 'Los informes se guardarán localmente y se sincronizarán más tarde.',
            pending: '{count} informe(s) pendiente(s)',
            dismiss: 'Cerrar',
            states: {
                offline: {
                    title: 'Estás sin conexión',
                    description: 'Los informes se guardarán localmente'
                },
                syncing: {
                    title: 'Sincronizando...',
                    description: 'Enviando {count} informe(s)'
                },
                success: {
                    title: '{count} informe(s) enviado(s)',
                    titleDefault: 'Sincronización completada'
                },
                error: {
                    title: '{count} fallido(s)',
                    description: 'Revisar y reintentar'
                },
                pending: {
                    title: 'Informes listos para enviar'
                }
            },
            report: 'informe | informes',
            syncNow: 'Enviar ahora'
        },
        toast: {
            went_offline: 'Conexión perdida',
            went_offline_description: 'Los informes se guardarán localmente.',
            back_online: 'De vuelta en línea',
            back_online_description: 'Conexión restaurada.',
            syncing: 'Sincronizando...',
            syncing_description: 'Sincronizando {count} informe(s).',
            sync_complete: 'Sincronización completada',
            sync_complete_description: 'Todos los informes se han enviado correctamente.',
            sync_failed: 'Sincronización fallida',
            sync_failed_description: '{count} informe(s) no se pudieron enviar.'
        },
        status: {
            offline: 'Sin conexión',
            syncing: 'Sincronizando...',
            pending: '{count} pendiente(s)',
            synced: 'Sincronizado'
        },
        sync: {
            title: 'Estado de sincronización',
            syncNow: 'Sincronizar ahora',
            syncing: 'Sincronizando...',
            offlineWarning: 'Estás sin conexión. Los informes se sincronizarán cuando se restaure la conexión.',
            pendingCount: '{count} informe(s) esperando sincronización',
            readyToSync: 'Listo para sincronizar',
            waitingForConnection: 'Esperando conexión',
            failedItems: 'Envíos fallidos',
            untitledRequest: 'Solicitud sin título',
            unknownError: 'Error desconocido',
            attempts: '{count} intento(s)',
            retry: 'Reintentar',
            delete: 'Eliminar',
            allSynced: 'Todos los informes sincronizados',
            lastSync: 'Última sincronización',
            syncSuccess: '{count} informe(s) sincronizado(s) correctamente',
            syncFailed: '{count} informe(s) no se pudieron sincronizar',
            retrySuccess: 'Informe sincronizado correctamente',
            retryFailed: 'Error al sincronizar el informe',
            itemDeleted: 'Informe eliminado de la cola',
            queuedSuccess: 'Informe guardado',
            willSyncWhenOnline: 'Se enviará cuando se restaure la conexión.',
            queueFailed: 'Error al guardar el informe para más tarde'
        },
        failed: {
            title: 'Envíos fallidos',
            description: 'Estos informes no se pudieron enviar y requieren tu atención.',
            empty: 'No hay envíos fallidos',
            validation_error: 'Necesita corrección',
            server_error: 'Error del servidor',
            edit: 'Editar',
            retry: 'Reintentar',
            delete: 'Eliminar',
            confirm_delete: '¿Estás seguro de que quieres eliminar este informe? Esta acción no se puede deshacer.',
            untitled: 'Informe sin título',
            view_failed: 'Ver fallidos'
        },
        form: {
            unavailable_title: 'Formulario no disponible sin conexión',
            unavailable_description: 'El formulario de informe requiere conexión a internet para cargarse. Por favor, conéctate a internet e inténtalo de nuevo.',
            retry: 'Reintentar',
            go_back: 'Volver',
            waiting_for_connection: 'Esperando conexión...'
        }
    },
    contact: {
        title: 'Contacto',
        dialog_description: 'Formulario de contacto',
        name: 'Nombre',
        name_placeholder: 'Su nombre',
        email: 'Correo electrónico',
        email_placeholder: 'Su dirección de correo electrónico',
        message: 'Mensaje',
        message_placeholder: 'Su mensaje...',
        copy_label: 'Enviarme una copia a mi correo electrónico',
        gdpr_label: 'Acepto el tratamiento de mis datos',
        gdpr_required: 'Por favor, acepte el tratamiento de datos',
        submit: 'Enviar mensaje',
        sending: 'Enviando...',
        success_title: 'Mensaje enviado',
        success_message: 'Gracias por su mensaje. Le responderemos lo antes posible.',
        submission_failed: 'No se pudo enviar el mensaje. Por favor, inténtelo más tarde.',
        flood_error: 'Demasiadas solicitudes. Por favor, inténtelo más tarde.',
        required_field: '{field} es obligatorio',
        invalid_email: 'Por favor, introduzca una dirección de correo electrónico válida',
        close: 'Cerrar',
        new_message: 'Nuevo mensaje'
    },
    error: {
        form_error_fallback: 'Se ha producido un error al cargar el formulario. Por favor, inténtelo de nuevo.',
        404: {
            title: 'Página no encontrada',
            description: 'La página que buscas no existe o ha sido movida.'
        },
        403: {
            title: 'Acceso denegado',
            description: 'No tienes permiso para ver esta página.'
        },
        500: {
            title: 'Algo salió mal',
            description: 'Se produjo un error inesperado. Por favor, inténtalo de nuevo.'
        },
        fallback: {
            title: 'Error',
            description: 'Se produjo un error inesperado.'
        },
        actions: {
            back: 'Volver',
            home: 'Ir al inicio',
            retry: 'Reintentar'
        }
    },
    legal: {
        impressum: {
            title: 'Aviso legal',
            heading: 'Aviso legal',
            responsible_heading: 'Responsable del contenido',
            responsible_text: '{name} es responsable del contenido de esta plataforma.'
        },
        privacy: {
            title: 'Política de privacidad',
            heading: 'Política de privacidad',
            intro: 'La protección de sus datos personales es importante para nosotros. Procesamos sus datos exclusivamente sobre la base de disposiciones legales (RGPD).',
            controller_heading: 'Responsable del tratamiento',
            data_heading: 'Datos recopilados',
            data_text: 'Al utilizar esta plataforma se procesan los siguientes datos: datos de ubicación del informe, texto descriptivo, fotos subidas y datos técnicos de acceso (dirección IP, tipo de navegador, hora de acceso).',
            rights_heading: 'Sus derechos',
            rights_text: 'Usted tiene derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad de datos y oposición.'
        },
        terms: {
            title: 'Condiciones de uso',
            heading: 'Condiciones de uso',
            intro: 'Al utilizar esta plataforma, usted acepta las siguientes condiciones.',
            purpose_heading: 'Finalidad',
            purpose_text: 'Esta plataforma sirve para informar sobre problemas en espacios públicos. Los informes se envían a la autoridad responsable.',
            obligations_heading: 'Obligaciones del usuario',
            obligations_text: 'Usted se compromete a proporcionar solo información veraz y a no subir contenido ilegal. Las fotos subidas no deben mostrar personas identificables sin su consentimiento.',
            liability_heading: 'Responsabilidad',
            liability_text: '{name} no asume ninguna responsabilidad por la integridad y exactitud de la información proporcionada.'
        },
        email_label: 'Correo electrónico',
        contact_label: 'Contacto',
        platform: {
            heading: 'Operador de la plataforma',
            intro: 'Esta plataforma es operada técnicamente por:',
            description: 'Civic Patches GmbH proporciona la infraestructura técnica para la plataforma Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Alemania',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operador de este mapa',
            not_configured: 'El operador de este mapa aún no ha proporcionado su información legal. Los operadores de servicios en línea de acceso público pueden estar obligados a proporcionar un aviso legal y una política de privacidad.'
        },
        footer: {
            impressum: 'Aviso legal',
            privacy: 'Privacidad',
            terms: 'Condiciones de uso'
        },
        not_configured: 'Los datos del operador aún no están configurados.'
    },
    demo_mode: {
        banner: {
            title: 'Instancia de demostración',
            message: 'Los informes enviados aquí no se reenvían a ninguna autoridad.',
            link_label: 'Visitar mark-a-spot.com',
            minimize_label: 'Minimizar aviso de demo',
            expand_label: 'Ampliar aviso de demo'
        },
        reset: {
            title: 'Base de datos demo',
            notice: 'El sistema demo se restablece cada hora.',
            countdown_label: 'Próximo reinicio en',
            countdown_aria: 'Próximo reinicio de la base de datos demo en {time}'
        },
        modal: {
            title: 'Envío de demostración',
            body: 'Esto es una demo. Su informe NO será remitido al ayuntamiento. ¿Continuar con el envío de demostración?',
            confirm_label: 'Enviar informe de demo',
            cancel_label: 'Cancelar'
        },
        lite: {
            title: 'Solo demostración',
            heading: 'Instancia de demostración',
            body: 'Esta es una demostración de Mark-a-Spot. Los envíos a través del formulario simplificado están desactivados aquí para que los informes reales nunca lleguen accidentalmente a un ayuntamiento.',
            link_label: 'Visitar mark-a-spot.com'
        }
    },
    print: {
        title: 'Informe de solicitud de servicio',
        description: 'Descripción',
        location: 'Ubicación',
        media: 'Archivos adjuntos',
        image_unavailable: 'Image unavailable',
        attributes: 'Campos adicionales',
        status_history: 'Historial de estado',
        internal_fields: 'Información interna',
        organisation: 'Departamento',
        hazard_level: 'Nivel de peligro',
        hazard_category: 'Categoría de peligro',
        sentiment: 'Sentimiento',
        printed_at: 'Impreso',
        showing_recent: 'Mostrando {count} de {total} actualizaciones'
    }
};
