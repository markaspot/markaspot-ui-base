// locales/pt.ts
export default {
    locale: {
        code: 'pt-PT'
    },
    meta: {
        description: 'Frontend Mark-a-Spot'
    },
    nav: {
        map: 'Mapa',
        dashboard: 'Painel',
        back_to_frontend: 'Voltar ao Mapa'
    },
    dashboard: {
        title: 'Painel',
        welcome: 'Bem-vindo, {name}',
        nav: {
            dashboard: 'Painel',
            requests: 'Solicitações',
            settings: 'Configurações',
            categories: 'Categorias',
            jurisdictions: 'Jurisdições',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'Idiomas',
            billing: 'Faturação'
        },
        help: {
            docs: 'Documentação',
            support: 'Contactar suporte'
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
            profile: 'Perfil',
            logout: 'Sair'
        },
        jurisdiction: {
            current: 'Espaço de Trabalho',
            citizenView: 'Visão do Cidadão',
            switchTo: 'Mudar para',
            blocked: 'bloqueado',
            admin_section_header: 'Todos os espaços de trabalho (acesso de administrador)'
        },
        stats: {
            total: 'Total de Solicitações',
            pending: 'Pendente',
            in_progress: 'Em Andamento',
            resolved: 'Resolvido',
            my_groups: 'Meus Grupos',
            overall: 'Geral'
        },
        recent_requests: 'Solicitações Recentes',
        view_all: 'Ver Tudo',
        no_recent: 'Nenhuma solicitação recente',
        wms: {
            title: 'Camadas do mapa',
            attribution: 'Dados: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Mídia',
                category: 'Categoria',
                status: 'Estado',
                created: 'Criado'
            }
        }
    },
    form: {
        body: 'Descrição',
        body_description: 'Por favor, forneça uma descrição detalhada',
        body_placeholder: 'Insira uma descrição...',
        category: 'Categoria',
        category_description: 'Selecione a categoria apropriada para o seu relatório',
        category_placeholder: 'Selecione uma categoria',
        category_disabled: {
            title: 'Categoria Selecionada',
            description: 'Você selecionou a categoria "{category}". Esta categoria tem requisitos especiais ou não permite mais edições no formulário.'
        },
        category_empty: 'Nenhuma categoria disponível',
        category_loading: 'Carregando categorias...',
        category_disabled_notice: 'Esta categoria é apenas informativa. Não é possível enviar relatórios.',
        category_description_loading: 'Carregando descrição...',
        category_description_error: 'Erro ao carregar a descrição',
        email: 'E-mail',
        email_description: 'Seu e-mail de contato',
        email_placeholder: 'Insira seu endereço de e-mail',
        first_name: 'Nome',
        first_name_description: 'Seu primeiro nome',
        first_name_placeholder: 'Insira seu primeiro nome',
        last_name: 'Sobrenome',
        last_name_description: 'Seu sobrenome',
        last_name_placeholder: 'Insira seu sobrenome',
        gdpr: 'Acordo de Proteção de Dados',
        gdpr_description: 'Concordo com o processamento dos meus dados conforme descrito na política de privacidade.',
        object_id: 'ID do Objeto',
        object_id_description: 'Identificador para o objeto relatado',
        object_id_placeholder: 'Insira o ID do objeto (ex: número do poste)',
        phone: 'Número de Telefone',
        phone_description: 'Seu número de telefone de contato',
        phone_placeholder: 'Insira seu número de telefone',

        // Relatórios baseados em instalações
        facility: 'Instalação',
        facility_plural: 'Instalações',
        facility_placeholder: 'Selecionar {label}',
        facility_required: '{label} é obrigatório.',
        facility_unavailable: 'A instalação selecionada não está mais disponível, selecione novamente.',
        facility_nearest_snapped: 'Instalação mais próxima: {label}',
        facility_no_nearby: 'Nenhuma instalação próxima, selecione manualmente.',
        facility_use_my_location: 'Usar minha localização',
        facility_locating: 'A localizar…',
        facility_no_match: 'Nenhuma instalação corresponde à sua pesquisa.',
        facility_opens_in_new_tab: '(abre num novo separador)',
        facility_deselected_map_pick: 'Usando a sua localização em vez de {label}',
        facility_tagged_with: 'Em: {label}',

        imagelist: {
            empty: 'Nenhuma imagem disponível para este tipo.'
        },
        back_to_report: 'Voltar ao formulário de relatório',
        requirements: {
            title: 'Still required',
            ready_to_submit: 'Ready to submit',
            photo: 'Upload a photo',
            category: 'Select a category',
            location: 'Provide location',
            description: 'Enter a description',
            email: 'Provide email address',
            privacy: 'Accept privacy policy',
            privacyBlock: 'Substitua ou remova a foto com conteúdo sensível à privacidade',
            conditional: 'depending on category'
        },
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'Descrição é obrigatória',
        category_required: 'Categoria é obrigatória',
        email_required: 'E-mail é obrigatório',
        email_format: 'Formato de e-mail inválido',
        first_name_required: 'Nome é obrigatório',
        last_name_required: 'Sobrenome é obrigatório',
        gdpr_required: 'Você deve aceitar os termos de proteção de dados',
        object_id_required: 'ID do objeto é obrigatório',
        phone_required: 'Número de telefone é obrigatório',
        required_field: '{field} é obrigatório'
    },
    feedback: {
        page_title: 'Feedback da Solicitação de Serviço',
        error_title: 'Erro ao Carregar',
        invalid_request: 'Solicitação de serviço inválida ou expirada',
        thank_you: 'Obrigado pelo seu feedback!',
        submission_received: 'Seu feedback foi recebido com sucesso',
        loading: 'Carregando solicitação de serviço...',
        title: 'Feedback para: {service}',
        description: 'Por favor, forneça seu feedback',
        placeholder: 'Insira seu feedback aqui...',
        reopen_request: 'Gostaria que esta solicitação de serviço fosse reaberta',
        submitting: 'Enviando...',
        sending: 'Enviando...',
        submit: 'Enviar Feedback',
        existing_title: 'Seu feedback para: {service}',
        already_submitted: 'Você já enviou feedback para esta solicitação de serviço',
        missing_uuid: 'ID de serviço ausente',
        success_notification: 'Feedback enviado com sucesso',
        success_with_id: 'Feedback enviado com sucesso para a solicitação #{id}',
        updated_successfully: 'Feedback atualizado com sucesso',
        added_to_list: 'A solicitação de serviço foi adicionada à sua lista',
        submission_error: 'Falha ao enviar feedback',
        server_error: 'Erro no servidor: O feedback não pôde ser processado neste momento',
        submission_failed: 'Falha ao enviar feedback. Por favor, tente novamente mais tarde',
        already_exists: 'Feedback já existe para esta solicitação de serviço',
        error_fetching_request: 'Erro ao carregar os detalhes da solicitação de serviço',
        no_content: 'Sem conteúdo de feedback',
        refresh_complete: 'Lista de solicitações atualizada',
        try_again: 'Tentar novamente',
        format_unrecognized: 'Formato de solicitação de serviço não reconhecido',
        processing_error: 'Erro ao processar dados da solicitação de serviço',
        your_feedback: 'Seu Feedback',
        contact_preference: 'Preferência de Contato',
        no_contact: 'Sem Contato',
        email_contact: 'Contato por E-mail',
        email_placeholder: 'Seu endereço de e-mail',
        set_status_open: 'Definir Status como Aberto',
        set_status_open_description: 'Caso você queira que analisemos isso novamente, você pode reabrir esta solicitação de serviço.',
        email_verification: 'Verificação de E-mail',
        email_verification_placeholder: 'Endereço de e-mail do relatório original',
        email_verification_description: 'Insira o endereço de e-mail que você usou ao criar o relatório original.',
        email_mismatch: 'O endereço de e-mail inserido não corresponde ao relatório original.',
        unauthorized_access: 'Acesso não autorizado. Por favor, verifique seu endereço de e-mail.',
        not_eligible: 'Esta solicitação de serviço não é elegível para feedback no momento',
        service_provider: {
            page_title: 'Resposta do Prestador de Serviços',
            page_description: 'Enviar notas de conclusão para solicitações de serviço atribuídas',
            modal_title: 'Resposta do Prestador de Serviços',
            dialog_description: 'Diálogo do formulário de resposta do prestador de serviços',
            title: 'Concluir Atribuição',
            your_email: 'Seu Endereço de E-mail',
            email_placeholder: 'prestador{\'@\'}exemplo.com',
            email_verification_note: 'Insira seu e-mail de prestador de serviços para verificação',
            completion_notes: 'Notas de Conclusão',
            notes_placeholder: 'Descreva o trabalho que foi concluído...',
            mark_as_completed: 'Marcar como Concluído',
            mark_as_completed_description: 'Definir o status da solicitação como concluído',
            submit_completion: 'Enviar Conclusão',
            complete_request: 'Concluir Atribuição',
            completing: 'Enviando...',
            completion_success: 'Conclusão da solicitação de serviço enviada com sucesso',
            submission_failed: 'Falha ao enviar conclusão. Por favor, tente novamente mais tarde',
            server_error: 'Erro no servidor: A conclusão não pôde ser processada neste momento',
            completion_not_allowed: 'Esta solicitação não pode ser concluída neste momento',
            email_verification_failed: 'Verificação de e-mail falhou. Por favor, verifique seu endereço de e-mail',
            already_completed: 'Esta solicitação já foi concluída',
            loading: 'Carregando solicitação de serviço...',
            try_again: 'Tentar novamente',
            invalid_uuid: 'Solicitação de serviço inválida ou expirada',
            load_error: 'Erro ao carregar detalhes da solicitação de serviço',
            error_fetching_request: 'Erro ao carregar os detalhes da solicitação de serviço',
            completion_notes_required: 'Por favor, forneça notas de conclusão',
            existing_completions: 'Conclusões Anteriores',
            reassignment_note: 'Esta solicitação foi marcada para reatribuição e pode receber várias conclusões',
            mark_completed_description: 'Confirm that the work has been completed'
        },
        dialog_description: 'Feedback form dialog'
    },
    service_unavailable: {
        title: 'Serviço Temporariamente Indisponível',
        message: 'Não conseguimos conectar aos nossos serviços agora. Este problema é provavelmente temporário.',
        retry: 'Estamos enfrentando dificuldades técnicas no momento. Por favor, tente novamente em {seconds} segundos.',
        auto_retry: 'Tentando novamente em {seconds} segundos...',
        retry_now: 'Tentar Agora',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    header: {
        logo_alt: 'Logotipo',
        app_name: 'Mark-a-Spot',
        app_claim: 'Seu relatório. Nossa solução.'
    },
    hiddenSection: {
        description: 'Nosso relator de problemas é um sistema de relatórios para problemas de infraestrutura. Você pode prosseguir diretamente com o relato de problemas ou navegar para o seguinte:',
        main_navigation: 'Navegação principal com informações, uma lista de relatórios e estatísticas',
        map: 'Mapa interativo com marcadores visuais',
        map_navigation_hint: 'Use as teclas de seta ⬆️⬇️⬅️➡️ para navegar entre os marcadores de relatório, ↩️ Enter para selecionar, ❌ Escape para limpar a seleção',
        action_button: 'Relatar diretamente',
        keyboard_navigation_hint: 'Use arrow keys to navigate, Enter to activate',
        skip_to_main_content: 'Skip to main content'
    },
    accessibility: {
        skip_to_main: 'Pular para o conteúdo principal',
        skip_to_map: 'Pular para o mapa',
        skip_to_navigation: 'Pular para a navegação',
        skip_to_form: 'Relatar diretamente',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'Voltar',
        not_classified: 'Não classificado',
        no_value: 'Sem valor',
        close: 'Fechar',
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        submit: 'Enviar',
        cancel: 'Cancelar',
        required: 'Obrigatório',
        save: 'Salvar',
        delete: 'Excluir',
        edit: 'Editar',
        clear: 'Limpar',
        search: 'Pesquisar',
        select: 'Selecionar',
        on: 'Ligado',
        off: 'Desligado',
        toggle: 'Alternar',
        yesterday: 'Ontem',
        did_you_know: 'Você sabia?',
        show_more: 'Mostrar mais',
        show_less: 'Mostrar menos',
        learn_more: 'Saber mais',
        learn_more_about: 'Saber mais sobre {topic}',
        opens_in_new_tab: '(abre num novo separador)',
        title: {
            classic: 'Relatório Clássico',
            photo: 'Relatório com Foto'
        },
        buttons: {
            toggle_theme: 'Alternar tema',
            attribution: 'Atribuição do mapa',
            close: 'Fechar'
        },
        navigation: 'Gaveta de navegação',
        drawer_description: 'Painel de conteúdo e opções',
        resize_drawer: 'Redimensionar painel',
        drawer_position_n_of_total: 'posição {idx} de {total}',
        current: 'Current',
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'Localização',
        field_gdpr: 'Consentimento de Processamento de Dados',
        field_e_mail: 'E-mail',
        field_category: 'Categoria',
        field_request_media: 'Fotos',
        field_name: 'Sobrenome',
        field_prename: 'Nome',
        field_first_name: 'Nome',
        field_first_name_placeholder: 'Por favor, insira o nome',
        field_last_name: 'Sobrenome',
        field_last_name_placeholder: 'Por favor, insira o sobrenome',
        field_phone: 'Telefone',
        body: 'Descrição',
        field_add_data: 'Participação no Concurso',
        field_terms_of_use: 'Aceito os termos e condições e a política de privacidade.',
        field_address: 'Endereço',
        postal_code: 'Código Postal',
        postal_code_placeholder: 'ex: 10001',
        city: 'Cidade',
        city_placeholder: 'ex: Nova Iorque',
        street_address: 'Endereço',
        street_address_placeholder: 'ex: Rua Principal 123'
    },
    competition: {
        intro: 'Se desejar, participe do nosso sorteio anual. Você tem a chance de ganhar prêmios atraentes e recompensas em dinheiro que distribuímos entre todos os participantes como um pequeno agradecimento.',
        disclaimer: 'Funcionários dos departamentos responsáveis estão excluídos da participação.',
        title: 'Participação no Concurso',
        errors: {
            already_exists: 'A entrada no concurso já existe',
            duplicate_found: 'Duplicata encontrada',
            duplicate_detail: 'Uma entrada no concurso já foi criada para este relatório.',
            not_found: 'Relatório não encontrado',
            not_found_detail: 'O relatório associado não pôde ser encontrado.',
            save_failed: 'Não foi possível salvar a entrada no concurso',
            submission_error: 'Erro de envio',
            submission_error_detail: 'Sua entrada no concurso não pôde ser salva, mas seu relatório foi enviado com sucesso.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Info',
                aria_label: 'Aba de informações',
                panel_label: 'Painel de informações'
            },
            list: {
                label: 'Lista',
                aria_label: 'Aba de lista de relatórios',
                panel_label: 'Painel de lista de relatórios'
            },
            following: {
                label: 'Seguindo',
                aria_label: 'Aba de relatórios seguidos',
                panel_label: 'Painel de relatórios seguidos'
            },
            stats: {
                label: 'Estatísticas',
                aria_label: 'Aba de estatísticas',
                panel_label: 'Painel de estatísticas'
            }
        },
        main: 'Navegação principal',
        pages: 'Navegação de página',
        browse_reports: 'Navegar Relatórios',
        back_to_form: 'Voltar ao Formulário',
        panel: {
            scrollable: 'Área rolável'
        },
        updates_count: '{count} novas atualizações'
    },
    report: {
        form_types: 'Tipos de relatório',
        how_to_help: 'Como criar uma ocorrência',
        title: {
            photo: 'Relatório com Foto',
            classic: 'Relatório Clássico',
            submit: 'Enviar Relatório',
            edit: 'Editar Relatório',
            view: 'Ver Relatório'
        },
        photo: {
            description: 'Criar um novo relatório com uma foto'
        },
        classic: {
            description: 'Criar um novo relatório sem uma foto'
        },
        status: {
            new: 'Novo',
            open: 'Aberto',
            in_progress: 'Em Andamento',
            resolved: 'Resolvido',
            closed: 'Fechado',
            unknown: 'Status Desconhecido'
        },
        form: {
            tabs: {
                photo: 'Com Foto',
                classic: 'Clássico'
            },
            description: {
                label: 'Descrição',
                placeholder: 'Por favor, descreva o problema...',
                ai_processing: 'A IA está gerando uma descrição...',
                help: 'Forneça o máximo de detalhes possível'
            },
            category: {
                label: 'Categoria',
                placeholder: 'Selecione uma categoria',
                loading: 'Carregando categorias...',
                error: 'Erro ao carregar categorias',
                empty: 'Nenhuma categoria disponível',
                help: 'Seleção de categoria (feita automaticamente)',
                description: 'Descrição da Categoria',
                description_loading: 'Carregando descrição...',
                description_error: 'Erro ao carregar descrição',
                disabled_notice: 'Esta categoria é apenas para informação. Envios não são possíveis.'
            },
            location: {
                label: 'Localização',
                placeholder: 'Pesquisar uma localização...',
                selected: 'Localização selecionada',
                clear: 'Limpar localização',
                error: 'Erro ao obter localização',
                help: 'Insira um endereço ou clique no mapa',
                help_modal: 'Insira um endereço ou use sua localização atual',
                current: 'Usar localização atual',
                searching: 'Pesquisando...',
                pick_on_map: 'Escolher no mapa',
                auto_detected: 'Localização detectada',
                complete_address: 'Endereço completo',
                from_photo_exif: 'Localização extraída automaticamente dos metadados da foto',
                warning: 'Aviso de localização',
                unknown_location: 'Localização desconhecida',
                suggestions: 'Sugestões de localização'
            },
            email: {
                label: 'E-mail para Atualizações',
                placeholder: 'Insira seu endereço de e-mail',
                help: 'Enviaremos atualizações sobre seu relatório',
                subscribe: 'Inscrever-se para atualizações'
            },
            gdpr: {
                label: 'Consentimento de Processamento de Dados',
                description: 'Concordo com o processamento dos meus dados de acordo com a política de privacidade.',
                required: 'Você deve concordar para continuar',
                link: 'Ver Política de Privacidade'
            },
            media: {
                label: 'Fotos',
                required: 'Uma foto é necessária para esta categoria',
                upload: {
                    overall_progress: 'Progresso Geral',
                    button: 'Clique para enviar',
                    or: ' ou',
                    drag: 'arraste e solte',
                    drop_here: 'Solte arquivos aqui para enviar',
                    restrictions: 'Até {count} imagens ({size} máx., {types})',
                    restrictions_single: 'Uma imagem ({size} máx., {types})',
                    progress: 'Progresso do envio',
                    started_sr: 'Envio iniciado',
                    progress_sr: 'Envio {progress}% completo',
                    success_sr: 'Envio concluído com sucesso',
                    error_sr: 'Envio falhou: {error}',
                    files_selected_sr: '{count} arquivo(s) selecionado(s) para envio',
                    area_label: 'Área de envio de fotos - clique para selecionar arquivos ou arraste e solte',
                    in_progress: 'Envio em andamento',
                    complete_sr: 'O arquivo foi enviado com sucesso.',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'Visualização da imagem',
                remove: 'Remover imagem',
                no_image_available: 'Nenhuma imagem disponível ou não exibida por motivos legais',
                progress: 'Progresso do envio: {progress}%',
                limit_reached: 'Número máximo de {count} imagens atingido',
                privacy_notice: 'Por favor, sem pessoas/placas nas fotos',
                ai_analysis: 'Análise via Azure AI (Alemanha)',
                ai_analysis_tooltip: 'Ao enviar, você confirma que a foto foi tirada legalmente e não viola direitos de terceiros.\n\nSe pessoas ou placas forem reconhecíveis, por favor, torne-as irreconhecíveis antes do envio.\n\nA análise serve exclusivamente para categorizar seu relatório. Apenas uma cópia reduzida, livre de EXIF, é transmitida para o Azure OpenAI (Alemanha); o original não é enviado para o serviço.',
                offline_cached: 'Saved offline',
                ai_analysis_help: 'Information about AI analysis'
            },
            submit: {
                button: 'Enviar Relatório',
                submitting: 'Enviando...',
                processing: 'Processando...',
                success: 'Relatório enviado com sucesso',
                error: 'Erro ao enviar relatório',
                loading: 'Loading form...'
            },
            loading: 'Carregando formulário de relatório...',
            draft_saved: 'Rascunho salvo',
            modal_description: 'Create a new report'
        },
        ai: {
            label: 'IA',
            powered: 'Alimentado por IA',
            analyzing: 'A IA está analisando suas fotos...',
            started_sr: 'Análise de IA iniciada',
            complete_sr: 'Análise de IA concluída com sucesso',
            field_updated_sr: '{field} foi atualizado com: {value}',
            analysis_complete_sr: 'Análise de IA completa.',
            category_result_sr: 'Categoria selecionada: {category}.',
            description_result_sr: 'Descrição gerada: {description}',
            location_result_sr: 'Localização encontrada: {location}.',
            category_hint: 'Esta foto não parece corresponder às nossas categorias de relatório. Por favor, escolha você mesmo uma categoria.',
            processing: {
                analyzing: 'Perguntando à IA...',
                location: 'Verificando metadados da imagem...',
                location_found: 'Localização encontrada:',
                location_ai: 'Procurando localização na imagem...',
                location_not_found: 'Localização não encontrada nos metadados da imagem.',
                location_complete: 'Localização identificada',
                category: 'Identificando categoria...',
                category_found: 'Categoria identificada:',
                category_not_matched: 'Categoria sugerida pela IA (precisa de seleção)',
                description: 'Gerando descrição...',
                description_complete: 'Descrição gerada',
                attributes_filled: '{count} campo(s) adicional(ais) pré-preenchido(s)',
                complete: 'Análise de IA completa',
                error: 'Erro durante a análise de IA',
                privacy_warning: 'Problema de privacidade detectado'
            },
            privacy: {
                title: 'Aviso de privacidade',
                description: 'Dados pessoais podem ter sido detectados na sua foto ({issues}). A foto será verificada antes da publicação.',
                required: 'Foi detectado conteúdo sensível à privacidade nesta foto para o qual não está disponível o desfoque automático. A foto não pode ser utilizada. Substitua-a ou remova-a para continuar.',
                removePhoto: 'Remover foto',
                replace: 'Substituir foto',
                understood: 'Continuar com esta foto'
            },
            failed: {
                title: 'Análise de imagem indisponível',
                description: 'A sua foto será verificada manualmente antes da publicação. Pode enviar o seu relatório normalmente.'
            },
            budget_exhausted_title: 'Análise de IA ignorada',
            budget_exhausted_submitted: 'O orçamento de análise de IA para este mês foi atingido. O seu relatório foi enviado com sucesso.'
        },
        buttons: {
            photo: 'Relatório com Foto',
            classic: 'Relatório Clássico',
            follow: 'Seguir Relatório',
            following: 'Seguindo',
            share: 'Compartilhar Relatório',
            print: 'Imprimir',
            flag: 'Denunciar',
            flag_submitted: 'Já denunciado',
            copy_link: 'Copiar link',
            link_copied: 'Link copiado para a área de transferência',
            email: 'E-mail',
            directions: 'Obter Direções'
        },
        following: {
            count: 'Seguindo {count} relatório(s)',
            mark_all_read: 'Marcar tudo como lido',
            no_reports: 'Nenhum relatório seguido ainda',
            no_address: 'Nenhum endereço disponível',
            status_updated: 'Status atualizado',
            status_changed: 'Status alterado para:',
            awaiting_server: 'Aguardando atualização',
            escalated_to: 'Encaminhado para {jurisdiction}',
            escalated_click: 'Toque para abrir na nova jurisdição',
            unavailable: 'Este relatório não está disponível no momento. Verifique seu e-mail para detalhes ou entre em contato conosco.',
            date: {
                today: 'Hoje',
                tomorrow: 'Amanhã',
                yesterday: 'Ontem',
                unknown: 'Unknown date'
            }
        }
    },
    map: {
        tap_to_load: 'Toque para mostrar o mapa',
        tap_to_select_location: 'Toque no mapa para selecionar a localização',
        loading: 'Carregando mapa...',
        loading_address: 'Carregando endereço...',
        retry_attempt: 'Tentativa {count}',
        confirm_location: 'Confirmar localização',
        add_report_here: 'Adicionar relatório aqui',
        controls: {
            zoom_in: 'Aumentar zoom',
            zoom_out: 'Diminuir zoom',
            find_location: 'Encontrar minha localização',
            toggle_heatmap: 'Alternar mapa de calor',
            toggle_language: 'Alterar idioma',
            add_report_here: 'Relatar aqui',
            adjust_tilt: 'Ajustar inclinação',
            degrees: '{count} graus',
            layers: 'Camadas do mapa',
            no_layers: 'Nenhuma camada disponível',
            geolocation: {
                label: 'Obter localização atual'
            },
            zoom: 'Zoom controls'
        },
        pick: {
            drag_hint: 'Arraste o marcador para ajustar a posição'
        },
        tooltip: {
            label: 'Informações do marcador do mapa',
            opens_form_above: 'Abre o formulário acima',
            opens_modal: 'Abre em diálogo'
        },
        keyboard: {
            canvasInstructions: 'Mapa interativo com marcadores de relatórios. As teclas de seta navegam entre marcadores, Shift+seta move o mapa, Enter seleciona. Pressione Ctrl+= para ampliar, Ctrl+- para reduzir.',
            noFeatures: 'Nenhum marcador visível na vista atual. Tente ampliar ou mover o mapa para encontrar marcadores.',
            zoomedIntoCluster: 'Vista ampliada na área do grupo. Use as teclas de seta para navegar entre os marcadores.',
            clusterFocused: 'Grupo com {count} relatórios em foco. Pressione Enter para expandir. {position}',
            clusterExpanded: 'Grupo expandido em {count} relatórios. {featureLabel}',
            markerFocused: 'Relatório em foco: {name} em {address}{context}. Pressione Enter para abrir os detalhes. {position}',
            expandedContext: ' (expandido do grupo)',
            untitledReport: 'Relatório sem título',
            unknownLocation: 'localização',
            featurePosition: 'Elemento {current} de {total}.',
            pannedToExplore: 'Mapa movido para {direction}. Solte Shift e use as teclas de seta para navegar pelos marcadores.',
            pannedNoMarkers: 'Mapa movido para {direction}. Nenhum marcador encontrado nessa direção. Use as teclas de seta para continuar explorando.'
        }
    },
    detail: {
        location: 'Localização',
        photos: 'Fotos',
        description: 'Descrição',
        status_history: 'Histórico de Status',
        updates: 'Atualizações',
        no_updates: 'Nenhuma atualização ainda',
        edit: 'Editar',
        follow: {
            button: 'Seguir',
            following: 'Seguindo',
            stop: 'Parar de seguir',
            success: 'Você agora está seguindo este relatório',
            error: 'Erro ao seguir relatório',
            updating: 'Atualizando...'
        },
        unavailable: {
            title: 'Relatório não disponível',
            message: 'Este relatório não existe ou ainda não foi publicado. Relatórios recém-enviados podem demorar um momento para aparecer.'
        },
        dialog_description: 'View report details'
    },
    stats: {
        status_overview: 'Status',
        pie_chart: 'Distribuição',
        total_reports: 'Total de Relatórios',
        status_distribution: 'Distribuição de Status',
        category_distribution: 'Distribuição de Categoria',
        uncategorized: 'Sem categoria',
        showing_reports: 'Mostrando {visible} de {total} relatórios',
        no_reports: 'Nenhum relatório disponível',
        open_reports: 'Relatórios Abertos',
        closed_reports: 'Relatórios Fechados',
        no_data_available: 'Nenhum dado disponível',
        expand: 'Mostrar detalhes',
        collapse: 'Ocultar detalhes',
        subcategory: 'subcategoria',
        subcategories: 'subcategorias'
    },
    time: {
        days_ago: '{count} dias atrás',
        just_now: 'Agora mesmo',
        minutes_ago: '{count} minutos atrás',
        hours_ago: '{count} horas atrás',
        yesterday: 'Ontem',
        today: 'Hoje'
    },
    list: {
        showing: 'Mostrando {visible} de {total} relatórios',
        showing_in_area: '{visible} nesta área, {total} no total',
        showing_area_only: '{visible} nesta área',
        no_results: 'Nenhum relatório encontrado',
        no_filtered_results: 'Nenhum relatório corresponde aos seus critérios de filtro',
        load_more: 'Todos os relatórios carregados',
        load_more_button: 'Carregar mais',
        newest_first: 'Mais novos primeiro',
        oldest_first: 'Mais antigos primeiro',
        refresh: 'Atualizar',
        status_update: 'Status atualizado',
        location: 'Localização',
        unpublished: 'Não publicado',
        editable: 'Editável'
    },
    errors: {
        general: 'Algo deu errado',
        search_failed: 'A pesquisa falhou. Por favor, tente novamente.',
        api: {
            rate_limit: 'Muitas solicitações. Por favor, aguarde um momento e tente novamente.',
            unauthorized: 'Não autorizado. Por favor, faça login novamente.',
            forbidden: 'Acesso negado.',
            not_found: 'Recurso não encontrado.',
            server_error: 'Erro no servidor. Por favor, tente novamente mais tarde.',
            default: 'Erro da API: {status}'
        },
        upload_failed: 'Envio falhou',
        location_error: 'Não foi possível determinar a localização',
        network_error: 'Erro de rede',
        geolocation: {
            title: 'Erro de localização',
            permission_denied: 'Permissão de localização negada. Por favor, permita o acesso nas configurações do navegador.',
            unavailable: 'As informações de localização não estão disponíveis no momento.',
            timeout: 'A solicitação de localização expirou.',
            unknown: 'Ocorreu um erro de localização desconhecido.'
        },
        try_again: 'Por favor, tente novamente',
        validation: {
            title: 'Desculpe, não podemos processar esta solicitação:',
            location_error_title: 'Erro de Localização',
            invalid_input: 'Entrada Inválida',
            duplicate_title: 'Duplicata Encontrada',
            duplicate_found: 'Relatório semelhante encontrado',
            duplicate_report: 'Um relatório semelhante já foi criado (Nº {reportId})',
            location_out_of_bounds: 'A localização selecionada está fora da nossa jurisdição',
            required_field: '{field} é obrigatório',
            required_fields: 'Por favor, preencha todos os campos obrigatórios',
            please_review: 'Por favor, revise o formulário e corrija quaisquer erros antes de enviar.',
            file_size: 'O arquivo selecionado é muito grande (máx. 10 MB)',
            file_type: 'O formato não é suportado (permitido: jpg, png, webp)',
            media_upload: 'Erro ao enviar imagem',
            invalid_format: 'Formato inválido para {field}',
            photo_required: 'Uma foto é necessária para esta categoria',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway',
            consent_required: 'Please accept the privacy policy'
        },
        rate_limit: {
            title: 'Limite de Taxa Excedido',
            general: 'Por favor, tente novamente mais tarde.',
            with_time: 'Por favor, tente novamente em {seconds} segundos.'
        },
        network: 'Problema de conexão. Por favor, verifique sua conexão com a internet',
        timeout: 'Tempo esgotado. Por favor, tente novamente',
        upload: {
            invalid_type: 'Tipo de arquivo inválido. Por favor, envie apenas imagens.',
            file_too_large: 'Arquivo muito grande. O tamanho máximo é {size}.',
            dimensions_too_large: 'Dimensões da imagem muito grandes. Máximo {width}x{height} pixels.',
            invalid_image: 'Arquivo de imagem inválido ou corrompido.',
            failed: 'Envio falhou. Por favor, tente novamente.',
            limit_reached: 'Número máximo de {count} arquivos atingido.',
            remove_to_add: 'Remova uma foto para adicionar uma nova',
            single_file_limit: 'Apenas uma imagem pode ser enviada.',
            exact_file_limit: 'No máximo {count} imagens podem ser enviadas.',
            title: 'Upload Error',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'Erro ao enviar ou carregar a imagem.',
        unknown: 'Ocorreu um erro desconhecido.',
        pending_uploads: 'Por favor, aguarde até que todos os envios estejam completos.',
        incomplete_form: 'Por favor, preencha todos os campos obrigatórios.',
        page: {
            title: 'Erro',
            not_found_title: 'Página não encontrada',
            not_found_message: 'Desculpe, a página que você está procurando não existe.',
            server_error_title: 'Erro no servidor',
            server_error_message: 'Desculpe, algo deu errado em nosso servidor.',
            generic_title: 'Ocorreu um erro',
            generic_message: 'Ocorreu um erro inesperado.',
            action_home: 'Voltar ao início',
            action_back: 'Voltar',
            action_retry: 'Tentar novamente',
            details: 'Detalhes do erro'
        }
    },
    success: {
        report_submitted: 'Relatório enviado',
        report_submitted_description: 'Seu relatório foi enviado com sucesso e será revisado em breve.',
        moderation_notice: 'Seu relatório será revisado antes de ser publicado. Seu número de referência:',
        submit_another: 'Enviar outro relatório',
        auto_followed: 'Este relatório foi adicionado automaticamente aos seus relatórios seguidos',
        visibility_limitation_notice: 'Observe que nem todos os relatórios se tornam publicamente visíveis através do site. Se o seu relatório não for atualizado na lista de relatórios seguidos, ele ainda pode ter sido processado pela cidade. Verifique seu e-mail para atualizações de status.',
        fun_facts: [
            '🌱 Cada relatório que você envia ajuda a tornar sua cidade um lugar melhor para se viver!',
            '🏙️ Relatórios de cidadãos ajudaram a corrigir mais de 10.000 problemas em cidades de todo o mundo.',
            '⚡ O relatório médio é revisado dentro de 24 horas.',
            '🤝 Você faz parte de uma comunidade que se preocupa com os espaços públicos!',
            '📊 Dados de relatórios de cidadãos ajudam os planejadores urbanos a tomar decisões melhores.',
            '🔄 Seguir seus relatórios mantém você atualizado sobre o progresso automaticamente.',
            '🎯 Relatórios com fotos são processados 3 vezes mais rápido do que relatórios apenas de texto.',
            '🌍 Plataformas de engajamento cidadão como esta existem em mais de 50 países.',
            '💡 Seu feedback ajuda a priorizar quais problemas são corrigidos primeiro.',
            '🚀 Relatórios digitais reduziram os tempos de resposta em até 60%.',
            '🏆 Cidadãos ativos tornam as comunidades mais fortes e resilientes.',
            '🔍 A análise de IA ajuda a categorizar seus relatórios com mais precisão.',
            '📱 Relatórios móveis facilitam o relato de problemas assim que você os vê.',
            '⭐ Obrigado por ser um cidadão engajado!'
        ]
    },
    flag: {
        title: 'Denunciar este relatório',
        description: 'Ajude-nos a manter a qualidade denunciando conteúdo inapropriado.',
        reason_label: 'Por que está denunciando este relatório?',
        reason_spam: 'Spam ou publicidade',
        reason_offensive: 'Conteúdo ofensivo ou inapropriado',
        reason_personal: 'Contém dados pessoais',
        reason_location: 'Localização errada',
        reason_other: 'Outro',
        details_label: 'Detalhes adicionais',
        details_placeholder: 'Descreva o problema...',
        details_required: 'Forneça detalhes',
        submit: 'Enviar',
        success: 'Obrigado. Analisaremos este relatório.',
        error: 'Não foi possível enviar. Tente novamente.',
        already_flagged: 'Você já denunciou este relatório.'
    },

    pwa: {
        install: {
            title: 'Instalar App',
            button: 'Instalar',
            not_now: 'Agora Não',
            description: 'Clique no ícone de instalação na barra de endereços do seu navegador para instalar este aplicativo.',
            share_button: 'Ícone de compartilhar',
            open_safari: 'Navegador Safari',
            ios: {
                title: 'Adicionar à Tela Inicial',
                safari_instructions: 'Toque no {icon} e selecione "Adicionar à Tela Inicial".',
                other_instructions: 'Por favor, abra este site no {browser} para instalar.'
            },
            chrome: {
                instructions: 'Clique no ícone de instalação {icon} na barra de ferramentas para instalar este aplicativo.'
            },
            edge: {
                instructions: 'Clique no ícone de instalação {icon} na barra de endereços.'
            },
            firefox: {
                instructions: 'Clique no ícone da página inicial {icon} na barra de endereços.'
            }
        }
    },
    boundaries: {
        loading: 'Carregando dados de limites...',
        error: 'Não foi possível validar os limites de localização. Por favor, tente novamente mais tarde.',
        notLoaded: 'Limites ainda não carregados',
        outsideNonStrict: 'Nota: A localização selecionada está fora dos limites de {locationName}.',
        outsideStrict: 'A localização selecionada está fora dos limites de {locationName}. Por favor, selecione uma localização dentro dos limites da cidade.',
        validationUnavailable: 'Validação de limites indisponível. Seu relatório será aceito, mas pode ser revisado.'
    },
    filters: {
        title: 'Filtros',
        status: {
            title: 'Status'
        },
        time: {
            title: 'Tempo',
            today: 'Hoje',
            week: 'Esta Semana',
            month: 'Este Mês'
        },
        category: {
            title: 'Categoria',
            other: 'Outro'
        },
        actions: {
            more: 'Mais Filtros',
            expand: 'Mais Filtros',
            collapse: 'Menos',
            clear_all: 'Limpar Tudo',
            active_count: '{count} filtros ativos',
            toggle: 'Filtros'
        }
    },
    privacy: {
        notice_text: 'Informações sobre privacidade podem ser encontradas',
        notice_link_text: 'aqui',
        modal: {
            title: 'Política de Privacidade',
            loading: 'Carregando informações de privacidade...',
            retry: 'Tentar Novamente',
            noContent: 'Nenhuma informação de privacidade disponível.',
            lastUpdated: 'Última atualização',
            close: 'Fechar'
        }
    },
    search: {
        placeholder: 'Pesquisar relatórios...',
        no_results_local: 'Nenhum resultado encontrado na visualização atual',
        expand_to_server: 'Pesquisar todos os relatórios',
        expand_hint: 'Pesquisar além da visualização atual',
        searching_server: 'Pesquisando todos os relatórios...'
    },
    info: {
        welcome: {
            heading: 'Bem-vindo a {name}',
            headingGeneric: 'Bem-vindo',
            body: 'Use este mapa para reportar problemas ou conhecer os relatórios existentes na sua área.'
        },
        shortcuts: {
            aria_label: 'Ações rápidas',
            photo: {
                title: 'Foto',
                description: 'Tire uma foto, a IA faz o resto',
                aria_label: 'Criar um relatório com foto'
            },
            classic: {
                title: 'Clássico',
                description: 'Descreva e localize o problema',
                aria_label: 'Criar um relatório clássico'
            },
            following: {
                title: 'Seguir',
                description: 'Mantenha-se informado sobre o progresso',
                aria_label: 'Abrir relatórios seguidos'
            },
            list: {
                title: 'Explorar',
                description: 'Veja o que está acontecendo perto de você',
                aria_label: 'Explorar o mapa e ver a lista'
            }
        }
    },
    auth: {
        login: {
            title: 'Entrar',
            subtitle: 'Insira seu e-mail para receber um código de verificação',
            email_label: 'Endereço de E-mail',
            email_hint: 'Enviaremos um código de 6 dígitos',
            email_placeholder: 'endereço de e-mail',
            send_code: 'Enviar Código de Verificação',
            disabled: {
                title: 'Início de sessão não disponível',
                message: 'O início de sessão sem palavra-passe não está ativado aqui. Contacte o administrador se precisar de acesso.',
                back_button: 'Voltar ao início'
            }
        },
        verify: {
            email_label: 'Endereço de E-mail',
            code_label: 'Código de Verificação',
            code_hint: 'Insira o código de 6 dígitos do seu e-mail',
            code_placeholder: '123456',
            verify_button: 'Verificar e Entrar',
            back_button: 'Usar E-mail Diferente',
            request_new: 'Solicitar Novo Código',
            resend_code: 'Reenviar Código',
            expires_in: 'O código expira em {time}',
            expired_title: 'Código Expirado',
            expired_message: 'Seu código de verificação expirou. Por favor, solicite um novo.'
        },
        code_sent: {
            title: 'Código Enviado',
            message: 'Enviamos um código de verificação de 6 dígitos para {email}'
        },
        error: {
            title: 'Erro de Autenticação',
            request_failed: 'Falha ao enviar código de verificação. Por favor, tente novamente.',
            verify_failed: 'Código de verificação inválido ou expirado',
            sso_failed: 'Falha ao iniciar sessão. Por favor, tente novamente.',
            network: 'Erro de rede. Por favor, verifique sua conexão.',
            logout_failed: 'Falha ao sair. Por favor, tente novamente.'
        },
        sso: {
            completing: 'A concluir início de sessão...',
            method_label: 'Início de sessão único',
            button_aria: 'Iniciar sessão com {provider} através de início de sessão único'
        },
        user: {
            logged_in_as: 'Conectado como',
            logout: 'Sair'
        },
        welcome: {
            greeting: 'Olá, {name}',
            sign_in: 'Entrar',
            sign_out: 'Sair',
            user_avatar: 'User avatar'
        }
    },
    profile: {
        title: 'Perfil',
        account: {
            title: 'Conta',
            roles: 'Funções'
        },
        groups: {
            title: 'Grupos'
        },
        appearance: {
            title: 'Aparência',
            color_mode: 'Modo de Cor',
            light: 'Claro',
            dark: 'Escuro',
            system: 'Sistema',
            theme_override: 'Cores de Tema Personalizadas',
            theme_override_description: 'Substitua o tema padrão da jurisdição com suas próprias preferências de cor',
            primary_color: 'Cor Primária',
            secondary_color: 'Cor Secundária',
            neutral_color: 'Cor Neutra',
            reset_theme: 'Redefinir para Padrão'
        },
        language: {
            title: 'Idioma',
            select: 'Selecionar Idioma',
            save_failed: 'Não foi possível guardar a preferência de idioma. Por favor, tente novamente.'
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
            title: 'Página não encontrada',
            description: 'A página que procura não existe ou foi movida.'
        },
        403: {
            title: 'Acesso negado',
            description: 'Não tem permissão para ver esta página.'
        },
        500: {
            title: 'Algo correu mal',
            description: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
        },
        fallback: {
            title: 'Erro',
            description: 'Ocorreu um erro inesperado.'
        },
        actions: {
            back: 'Voltar',
            home: 'Ir para o início',
            retry: 'Tentar novamente'
        }
    },
    legal: {
        impressum: {
            title: 'Aviso legal',
            heading: 'Aviso legal',
            responsible_heading: 'Responsável pelo conteúdo',
            responsible_text: '{name} é responsável pelo conteúdo desta plataforma.'
        },
        privacy: {
            title: 'Política de privacidade',
            heading: 'Política de privacidade',
            intro: 'A proteção dos seus dados pessoais é importante para nós. Processamos os seus dados exclusivamente com base em disposições legais (RGPD).',
            controller_heading: 'Responsável pelo tratamento',
            data_heading: 'Dados recolhidos',
            data_text: 'Ao utilizar esta plataforma, os seguintes dados são processados: dados de localização do relatório, texto descritivo, fotos carregadas e dados técnicos de acesso (endereço IP, tipo de navegador, hora de acesso).',
            rights_heading: 'Os seus direitos',
            rights_text: 'Tem o direito de acesso, retificação, apagamento, limitação do tratamento, portabilidade dos dados e oposição.'
        },
        terms: {
            title: 'Termos de utilização',
            heading: 'Termos de utilização',
            intro: 'Ao utilizar esta plataforma, aceita os seguintes termos.',
            purpose_heading: 'Finalidade',
            purpose_text: 'Esta plataforma serve para comunicar problemas em espaços públicos. Os relatórios são encaminhados para a autoridade responsável.',
            obligations_heading: 'Obrigações do utilizador',
            obligations_text: 'Compromete-se a fornecer apenas informações verdadeiras e a não carregar conteúdo ilegal. As fotos carregadas não devem mostrar pessoas identificáveis sem o seu consentimento.',
            liability_heading: 'Responsabilidade',
            liability_text: '{name} não assume qualquer responsabilidade pela completude e exatidão das informações fornecidas.'
        },
        email_label: 'E-mail',
        contact_label: 'Contacto',
        platform: {
            heading: 'Operador da plataforma',
            intro: 'Esta plataforma é tecnicamente operada por:',
            description: 'A Civic Patches GmbH fornece a infraestrutura técnica para a plataforma Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Alemanha',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Operador deste mapa',
            not_configured: 'O operador deste mapa ainda não forneceu as suas informações legais. Os operadores de serviços online acessíveis ao público podem ser obrigados a fornecer um aviso legal e uma política de privacidade.'
        },
        footer: {
            impressum: 'Aviso legal',
            privacy: 'Privacidade',
            terms: 'Termos de utilização'
        },
        not_configured: 'Os dados do operador ainda não estão configurados.'
    },
    demo_mode: {
        banner: {
            title: 'Instância de demonstração',
            message: 'Os relatos enviados aqui não são encaminhados para nenhuma autoridade.',
            link_label: 'Visitar mark-a-spot.com',
            minimize_label: 'Minimizar aviso de demo',
            expand_label: 'Expandir aviso de demo'
        },
        reset: {
            title: 'Base de dados demo',
            notice: 'O sistema demo é reposto a cada hora.',
            countdown_label: 'Próxima reposição em',
            countdown_aria: 'Próxima reposição da base de dados demo em {time}'
        },
        modal: {
            title: 'Envio de demonstração',
            body: 'Esta é uma demonstração. O seu relatório NÃO será encaminhado para o município. Continuar com o envio de demonstração?',
            confirm_label: 'Enviar relatório de demo',
            cancel_label: 'Cancelar'
        },
        lite: {
            title: 'Apenas demonstração',
            heading: 'Instância de demonstração',
            body: 'Esta é uma demonstração do Mark-a-Spot. Os envios através do formulário simplificado estão desativados aqui para que relatórios reais nunca cheguem acidentalmente a um município.',
            link_label: 'Visitar mark-a-spot.com'
        }
    },
    print: {
        title: 'Relatório de pedido de serviço',
        description: 'Descrição',
        location: 'Localização',
        media: 'Anexos',
        image_unavailable: 'Image unavailable',
        attributes: 'Campos adicionais',
        status_history: 'Histórico de estado',
        internal_fields: 'Informações internas',
        organisation: 'Departamento',
        hazard_level: 'Nível de risco',
        hazard_category: 'Categoria de risco',
        sentiment: 'Sentimento',
        printed_at: 'Impresso em',
        showing_recent: 'A mostrar {count} de {total} atualizações'
    }
};
