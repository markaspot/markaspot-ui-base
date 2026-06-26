// locales/uk.ts
export default {
    locale: {
        code: 'uk-UA'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    nav: {
        map: 'Карта',
        dashboard: 'Панель',
        back_to_frontend: 'Назад до карти'
    },
    dashboard: {
        title: 'Панель',
        welcome: 'Вітаємо, {name}',
        nav: {
            dashboard: 'Панель',
            requests: 'Звернення',
            settings: 'Налаштування',
            categories: 'Категорії',
            jurisdictions: 'Юрисдикції',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'Мови',
            billing: 'Рахунки'
        },
        help: {
            docs: 'Документація',
            support: 'Зв\'язатися з підтримкою'
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
            profile: 'Профіль',
            logout: 'Вийти'
        },
        jurisdiction: {
            current: 'Робоча область',
            citizenView: 'Вигляд громадянина',
            switchTo: 'Переключити на',
            blocked: 'заблоковано',
            admin_section_header: 'Всі робочі простори (доступ адміністратора)'
        },
        stats: {
            total: 'Всього звернень',
            pending: 'Очікують',
            in_progress: 'В обробці',
            resolved: 'Вирішено',
            my_groups: 'Мої групи',
            overall: 'Загалом'
        },
        recent_requests: 'Останні звернення',
        view_all: 'Переглянути всі',
        no_recent: 'Немає останніх звернень',
        wms: {
            title: 'Шари карти',
            attribution: 'Дані: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Медіа',
                category: 'Категорія',
                status: 'Статус',
                created: 'Створено'
            }
        }
    },
    form: {
        body: 'Опис',
        body_description: 'Будь ласка, надайте детальний опис',
        body_placeholder: 'Введіть опис...',
        category: 'Категорія',
        category_description: 'Виберіть відповідну категорію для вашого звернення',
        category_placeholder: 'Виберіть категорію',
        category_disabled: {
            title: 'Категорію обрано',
            description: 'Ви обрали категорію "{category}". Ця категорія має особливі вимоги або не дозволяє подальше редагування форми.'
        },
        category_empty: 'Категорії недоступні',
        category_loading: 'Завантаження категорій...',
        category_disabled_notice: 'Ця категорія лише для інформації. Подання неможливі.',
        category_description_loading: 'Завантаження опису...',
        category_description_error: 'Помилка завантаження опису',
        email: 'Електронна пошта',
        email_description: 'Ваша контактна електронна адреса',
        email_placeholder: 'Введіть вашу електронну адресу',
        first_name: 'Ім\'я',
        first_name_description: 'Ваше ім\'я',
        first_name_placeholder: 'Введіть ваше ім\'я',
        last_name: 'Прізвище',
        last_name_description: 'Ваше прізвище',
        last_name_placeholder: 'Введіть ваше прізвище',
        gdpr: 'Згода на обробку даних',
        gdpr_description: 'Я погоджуюся з обробкою моїх даних відповідно до політики конфіденційності.',
        object_id: 'ID об\'єкта',
        object_id_description: 'Ідентифікатор об\'єкта, про який повідомляється',
        object_id_placeholder: 'Введіть ID об\'єкта (напр., номер стовпа)',
        phone: 'Номер телефону',
        phone_description: 'Ваш контактний номер телефону',
        phone_placeholder: 'Введіть ваш номер телефону',

        // Звернення на основі об'єктів
        facility: 'Об\'єкт',
        facility_plural: 'Об\'єкти',
        facility_placeholder: 'Оберіть {label}',
        facility_required: '{label} є обов\'язковим.',
        facility_unavailable: 'Вибраний об\'єкт більше недоступний, будь ласка, оберіть інший.',
        facility_nearest_snapped: 'Найближчий об\'єкт: {label}',
        facility_no_nearby: 'Поруч немає об\'єктів, будь ласка, оберіть вручну.',
        facility_use_my_location: 'Використати моє місцезнаходження',
        facility_locating: 'Визначення місцезнаходження…',
        facility_no_match: 'Жоден об\'єкт не відповідає вашому пошуку.',
        facility_opens_in_new_tab: '(відкривається в новій вкладці)',
        facility_deselected_map_pick: 'Використовується ваша геопозиція замість {label}',
        facility_tagged_with: 'Об\'єкт: {label}',

        imagelist: {
            empty: 'Немає зображень для цього типу.'
        },
        back_to_report: 'Назад до форми звернення',
        requirements: {
            title: 'Still required',
            ready_to_submit: 'Ready to submit',
            photo: 'Upload a photo',
            category: 'Select a category',
            location: 'Provide location',
            description: 'Enter a description',
            email: 'Provide email address',
            privacy: 'Accept privacy policy',
            privacyBlock: 'Замініть або видаліть фото з конфіденційним вмістом',
            conditional: 'depending on category'
        },
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'Опис є обов\'язковим',
        category_required: 'Категорія є обов\'язковою',
        email_required: 'Електронна пошта є обов\'язковою',
        email_format: 'Невірний формат електронної пошти',
        first_name_required: 'Ім\'я є обов\'язковим',
        last_name_required: 'Прізвище є обов\'язковим',
        gdpr_required: 'Ви повинні погодитися з умовами захисту даних',
        object_id_required: 'ID об\'єкта є обов\'язковим',
        phone_required: 'Номер телефону є обов\'язковим',
        required_field: '{field} є обов\'язковим'
    },
    feedback: {
        page_title: 'Відгук на звернення',
        error_title: 'Помилка завантаження',
        invalid_request: 'Недійсне або прострочене звернення',
        thank_you: 'Дякуємо за ваш відгук!',
        submission_received: 'Ваш відгук успішно отримано',
        loading: 'Завантаження звернення...',
        title: 'Відгук для: {service}',
        description: 'Будь ласка, залиште ваш відгук',
        placeholder: 'Введіть ваш відгук тут...',
        reopen_request: 'Я хотів би, щоб це звернення було відкрито знову',
        submitting: 'Надсилання...',
        sending: 'Надсилання...',
        submit: 'Надіслати відгук',
        existing_title: 'Ваш відгук для: {service}',
        already_submitted: 'Ви вже надіслали відгук для цього звернення',
        missing_uuid: 'Відсутній ID звернення',
        success_notification: 'Відгук успішно надіслано',
        success_with_id: 'Відгук успішно надіслано для звернення #{id}',
        updated_successfully: 'Відгук успішно оновлено',
        added_to_list: 'Звернення додано до вашого списку',
        submission_error: 'Не вдалося надіслати відгук',
        server_error: 'Помилка сервера: Відгук не може бути оброблено в даний момент',
        submission_failed: 'Не вдалося надіслати відгук. Спробуйте пізніше',
        already_exists: 'Відгук для цього звернення вже існує',
        error_fetching_request: 'Помилка завантаження деталей звернення',
        no_content: 'Немає вмісту відгуку',
        refresh_complete: 'Список звернень оновлено',
        try_again: 'Спробувати знову',
        format_unrecognized: 'Формат звернення не розпізнано',
        processing_error: 'Помилка обробки даних звернення',
        your_feedback: 'Ваш відгук',
        contact_preference: 'Бажаний спосіб зв\'язку',
        no_contact: 'Без контакту',
        email_contact: 'Зв\'язок електронною поштою',
        email_placeholder: 'Ваша електронна адреса',
        set_status_open: 'Встановити статус "відкрито"',
        set_status_open_description: 'Якщо ви хочете, щоб ми знову розглянули це, ви можете повторно відкрити це звернення.',
        email_verification: 'Підтвердження електронної пошти',
        email_verification_placeholder: 'Електронна адреса з оригінального звернення',
        email_verification_description: 'Введіть електронну адресу, яку ви використовували при створенні оригінального звернення.',
        email_mismatch: 'Введена електронна адреса не збігається з оригінальним зверненням.',
        unauthorized_access: 'Несанкціонований доступ. Перевірте вашу електронну адресу.',
        not_eligible: 'Це звернення наразі не підлягає відгуку',
        service_provider: {
            page_title: 'Відповідь надавача послуг',
            page_description: 'Надішліть нотатки про виконання для призначених звернень',
            modal_title: 'Відповідь надавача послуг',
            dialog_description: 'Форма відповіді надавача послуг',
            title: 'Завершити завдання',
            your_email: 'Ваша електронна адреса',
            email_placeholder: 'provider{\'@\'}example.com',
            email_verification_note: 'Введіть вашу електронну адресу надавача послуг для підтвердження',
            completion_notes: 'Нотатки про виконання',
            notes_placeholder: 'Опишіть виконану роботу...',
            mark_as_completed: 'Позначити як виконано',
            mark_as_completed_description: 'Встановити статус звернення на "виконано"',
            submit_completion: 'Надіслати виконання',
            complete_request: 'Завершити завдання',
            completing: 'Надсилання...',
            completion_success: 'Виконання звернення успішно надіслано',
            submission_failed: 'Не вдалося надіслати виконання. Спробуйте пізніше',
            server_error: 'Помилка сервера: Виконання не може бути оброблено в даний момент',
            completion_not_allowed: 'Це звернення не може бути завершено в даний момент',
            email_verification_failed: 'Підтвердження електронної пошти не вдалося. Перевірте вашу електронну адресу',
            already_completed: 'Це звернення вже виконано',
            loading: 'Завантаження звернення...',
            try_again: 'Спробувати знову',
            invalid_uuid: 'Недійсне або прострочене звернення',
            load_error: 'Помилка завантаження деталей звернення',
            error_fetching_request: 'Помилка завантаження деталей звернення',
            completion_notes_required: 'Будь ласка, надайте нотатки про виконання',
            existing_completions: 'Попередні виконання',
            reassignment_note: 'Це звернення позначено для повторного призначення і може отримати декілька виконань',
            mark_completed_description: 'Confirm that the work has been completed'
        },
        dialog_description: 'Feedback form dialog'
    },
    service_unavailable: {
        title: 'Сервіс тимчасово недоступний',
        message: 'Ми не можемо підключитися до наших сервісів зараз. Ця проблема, ймовірно, тимчасова.',
        retry: 'Наразі ми маємо технічні труднощі. Спробуйте ще раз через {seconds} секунд.',
        auto_retry: 'Повторна спроба через {seconds} секунд...',
        retry_now: 'Спробувати зараз',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    header: {
        logo_alt: 'Логотип',
        app_name: 'Mark-a-Spot',
        app_claim: 'Ваше звернення. Наше рішення.'
    },
    hiddenSection: {
        description: 'Наш засіб повідомлення про проблеми - це система звітування про інфраструктурні проблеми. Ви можете перейти безпосередньо до звітування або перейти до:',
        main_navigation: 'Головна навігація з інформацією, списком звернень та статистикою',
        map: 'Інтерактивна карта з візуальними маркерами',
        map_navigation_hint: 'Використовуйте стрілки ⬆️⬇️⬅️➡️ для навігації між маркерами, Enter ↩️ для вибору, Escape ❌ для скасування вибору',
        action_button: 'Повідомити безпосередньо',
        keyboard_navigation_hint: 'Use arrow keys to navigate, Enter to activate',
        skip_to_main_content: 'Skip to main content'
    },
    accessibility: {
        skip_to_main: 'Перейти до основного вмісту',
        skip_to_map: 'Перейти до карти',
        skip_to_navigation: 'Перейти до навігації',
        skip_to_form: 'Повідомити безпосередньо',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'Назад',
        not_classified: 'Не класифіковано',
        no_value: 'Немає значення',
        close: 'Закрити',
        loading: 'Завантаження...',
        error: 'Помилка',
        success: 'Успіх',
        submit: 'Надіслати',
        cancel: 'Скасувати',
        required: 'Обов\'язково',
        save: 'Зберегти',
        delete: 'Видалити',
        edit: 'Редагувати',
        clear: 'Очистити',
        search: 'Пошук',
        select: 'Вибрати',
        on: 'Увімкнено',
        off: 'Вимкнено',
        toggle: 'Перемкнути',
        yesterday: 'Вчора',
        did_you_know: 'Чи знаєте ви?',
        show_more: 'Показати більше',
        show_less: 'Показати менше',
        learn_more: 'Дізнатися більше',
        learn_more_about: 'Дізнатися більше про {topic}',
        opens_in_new_tab: '(відкривається в новій вкладці)',
        title: {
            classic: 'Класичне звернення',
            photo: 'Звернення з фото'
        },
        buttons: {
            toggle_theme: 'Змінити тему',
            attribution: 'Інформація про карту',
            close: 'Закрити'
        },
        navigation: 'Панель навігації',
        drawer_description: 'Панель з вмістом та опціями',
        resize_drawer: 'Змінити розмір панелі',
        drawer_position_n_of_total: 'позиція {idx} з {total}',
        current: 'Current',
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'Місцезнаходження',
        field_gdpr: 'Згода на обробку даних',
        field_e_mail: 'Електронна пошта',
        field_category: 'Категорія',
        field_request_media: 'Фотографії',
        field_name: 'Прізвище',
        field_prename: 'Ім\'я',
        field_first_name: 'Ім\'я',
        field_first_name_placeholder: 'Будь ласка, введіть ім\'я',
        field_last_name: 'Прізвище',
        field_last_name_placeholder: 'Будь ласка, введіть прізвище',
        field_phone: 'Телефон',
        body: 'Опис',
        field_add_data: 'Участь у конкурсі',
        field_terms_of_use: 'Я приймаю умови використання та політику конфіденційності.',
        field_address: 'Адреса',
        postal_code: 'Поштовий індекс',
        postal_code_placeholder: 'напр. 01001',
        city: 'Місто',
        city_placeholder: 'напр. Київ',
        street_address: 'Вулиця',
        street_address_placeholder: 'напр. вул. Головна 123'
    },
    competition: {
        intro: 'Якщо бажаєте, візьміть участь у нашому щорічному розіграші. Ви маєте шанс виграти привабливі призи та грошові винагороди, які ми розподіляємо серед усіх учасників як маленьку подяку.',
        disclaimer: 'Працівники відповідальних відділів виключені з участі.',
        title: 'Участь у конкурсі',
        errors: {
            already_exists: 'Заявка на конкурс вже існує',
            duplicate_found: 'Знайдено дублікат',
            duplicate_detail: 'Заявку на конкурс для цього звернення вже створено.',
            not_found: 'Звернення не знайдено',
            not_found_detail: 'Пов\'язане звернення не вдалося знайти.',
            save_failed: 'Не вдалося зберегти заявку на конкурс',
            submission_error: 'Помилка надсилання',
            submission_error_detail: 'Вашу заявку на конкурс не вдалося зберегти, але ваше звернення було успішно надіслано.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Інфо',
                aria_label: 'Вкладка інформації',
                panel_label: 'Панель інформації'
            },
            list: {
                label: 'Список',
                aria_label: 'Вкладка списку звернень',
                panel_label: 'Панель списку звернень'
            },
            following: {
                label: 'Відстежувані',
                aria_label: 'Вкладка відстежуваних звернень',
                panel_label: 'Панель відстежуваних звернень'
            },
            stats: {
                label: 'Статистика',
                aria_label: 'Вкладка статистики',
                panel_label: 'Панель статистики'
            }
        },
        main: 'Головна навігація',
        pages: 'Навігація сторінок',
        browse_reports: 'Переглянути звернення',
        back_to_form: 'Назад до форми',
        panel: {
            scrollable: 'Область прокрутки'
        },
        updates_count: '{count} нових оновлень'
    },
    report: {
        form_types: 'Типи звернень',
        how_to_help: 'Як створити звернення',
        title: {
            photo: 'Звернення з фото',
            classic: 'Класичне звернення',
            submit: 'Надіслати звернення',
            edit: 'Редагувати звернення',
            view: 'Переглянути звернення'
        },
        photo: {
            description: 'Створити нове звернення з фотографією'
        },
        classic: {
            description: 'Створити нове звернення без фотографії'
        },
        status: {
            new: 'Нове',
            open: 'Відкрито',
            in_progress: 'В обробці',
            resolved: 'Вирішено',
            closed: 'Закрито',
            unknown: 'Невідомий статус'
        },
        form: {
            tabs: {
                photo: 'З фото',
                classic: 'Класичне'
            },
            description: {
                label: 'Опис',
                placeholder: 'Будь ласка, опишіть проблему...',
                ai_processing: 'ШІ генерує опис...',
                help: 'Надайте якомога більше деталей'
            },
            category: {
                label: 'Категорія',
                placeholder: 'Виберіть категорію',
                loading: 'Завантаження категорій...',
                error: 'Помилка завантаження категорій',
                empty: 'Немає доступних категорій',
                help: 'Вибір категорії (виконується автоматично)',
                description: 'Опис категорії',
                description_loading: 'Завантаження опису...',
                description_error: 'Помилка завантаження опису',
                disabled_notice: 'Ця категорія лише для інформації. Подання неможливе.'
            },
            location: {
                label: 'Місцезнаходження',
                placeholder: 'Шукати місцезнаходження...',
                selected: 'Місцезнаходження вибрано',
                clear: 'Очистити місцезнаходження',
                error: 'Помилка отримання місцезнаходження',
                help: 'Введіть адресу або клацніть на карті',
                help_modal: 'Введіть адресу або використайте поточне місцезнаходження',
                current: 'Використати поточне місцезнаходження',
                searching: 'Пошук...',
                pick_on_map: 'Вибрати на карті',
                auto_detected: 'Місцезнаходження виявлено',
                complete_address: 'Повна адреса',
                from_photo_exif: 'Місцезнаходження автоматично витягнуто з метаданих фото',
                warning: 'Попередження про місцезнаходження',
                unknown_location: 'Невідоме місцезнаходження',
                suggestions: 'Пропозиції місцезнаходження'
            },
            email: {
                label: 'Email для оновлень',
                placeholder: 'Введіть вашу електронну адресу',
                help: 'Ми надсилатимемо вам оновлення щодо вашого звернення',
                subscribe: 'Підписатися на оновлення'
            },
            gdpr: {
                label: 'Згода на обробку даних',
                description: 'Я погоджуюся на обробку моїх даних відповідно до політики конфіденційності.',
                required: 'Ви повинні погодитися, щоб продовжити',
                link: 'Переглянути політику конфіденційності'
            },
            media: {
                label: 'Фотографії',
                required: 'Фотографія є обов\'язковою для цієї категорії',
                upload: {
                    overall_progress: 'Загальний прогрес',
                    button: 'Клацніть для завантаження',
                    or: ' або',
                    drag: 'перетягніть',
                    drop_here: 'Перетягніть файли сюди для завантаження',
                    restrictions: 'До {count} зображень ({size} макс., {types})',
                    restrictions_single: 'Одне зображення ({size} макс., {types})',
                    progress: 'Прогрес завантаження',
                    started_sr: 'Завантаження розпочато',
                    progress_sr: 'Завантаження виконано на {progress}%',
                    success_sr: 'Завантаження успішно завершено',
                    error_sr: 'Завантаження не вдалося: {error}',
                    files_selected_sr: '{count} файл(ів) вибрано для завантаження',
                    area_label: 'Область завантаження фото - клацніть для вибору файлів або перетягніть',
                    in_progress: 'Завантаження триває',
                    complete_sr: 'Файл успішно завантажено.',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'Попередній перегляд зображення',
                remove: 'Видалити зображення',
                no_image_available: 'Зображення недоступне або не відображається з правових причин',
                progress: 'Прогрес завантаження: {progress}%',
                limit_reached: 'Досягнуто максимальну кількість {count} зображень',
                privacy_notice: 'Будь ласка, не додавайте людей/номерні знаки на фото',
                ai_analysis: 'Аналіз через Azure AI (Німеччина)',
                ai_analysis_tooltip: 'Завантажуючи, ви підтверджуєте, що фото зроблено законно і не порушує права третіх осіб.\n\nЯкщо люди або номерні знаки розпізнаються, зробіть їх нерозпізнаваними перед завантаженням.\n\nАналіз служить виключно для категоризації вашого звернення. Тільки зменшена копія без EXIF передається до Azure OpenAI (Німеччина); оригінал не надсилається до сервісу.',
                offline_cached: 'Saved offline',
                ai_analysis_help: 'Information about AI analysis'
            },
            submit: {
                button: 'Надіслати звернення',
                submitting: 'Надсилання...',
                processing: 'Обробка...',
                success: 'Звернення успішно надіслано',
                error: 'Помилка надсилання звернення',
                loading: 'Loading form...'
            },
            loading: 'Завантаження форми звернення...',
            draft_saved: 'Чернетку збережено',
            modal_description: 'Create a new report'
        },
        ai: {
            label: 'ШІ',
            powered: 'На основі ШІ',
            analyzing: 'ШІ аналізує ваші фотографії...',
            started_sr: 'Аналіз ШІ розпочато',
            complete_sr: 'Аналіз ШІ успішно завершено',
            field_updated_sr: '{field} оновлено: {value}',
            analysis_complete_sr: 'Аналіз ШІ завершено.',
            category_result_sr: 'Обрано категорію: {category}.',
            description_result_sr: 'Згенеровано опис: {description}',
            location_result_sr: 'Знайдено місцезнаходження: {location}.',
            category_hint: 'Схоже, це фото не відповідає нашим категоріям звернень. Будь ласка, оберіть категорію самостійно.',
            processing: {
                analyzing: 'Запит до ШІ...',
                location: 'Перевірка метаданих зображення...',
                location_found: 'Місцезнаходження знайдено:',
                location_ai: 'Пошук місцезнаходження на зображенні...',
                location_not_found: 'Місцезнаходження не знайдено в метаданих зображення.',
                location_complete: 'Місцезнаходження ідентифіковано',
                category: 'Визначення категорії...',
                category_found: 'Категорію визначено:',
                category_not_matched: 'Категорія, запропонована ШІ (потребує вибору)',
                description: 'Генерація опису...',
                description_complete: 'Опис згенеровано',
                attributes_filled: '{count} додаткове(их) поле(ів) попередньо заповнено',
                complete: 'Аналіз ШІ завершено',
                error: 'Помилка під час аналізу ШІ',
                privacy_warning: 'Виявлено проблему конфіденційності'
            },
            privacy: {
                title: 'Повідомлення про конфіденційність',
                description: 'На вашому фото можливо виявлено персональні дані ({issues}). Фото буде перевірено перед публікацією.',
                required: 'На цьому фото виявлено вміст, критичний для конфіденційності, для якого автоматичне розмиття недоступне. Фото не може бути використано. Замініть або видаліть його, щоб продовжити.',
                removePhoto: 'Видалити фото',
                replace: 'Замінити фото',
                understood: 'Продовжити з цим фото'
            },
            failed: {
                title: 'Аналіз зображення недоступний',
                description: 'Ваше фото буде перевірено вручну перед публікацією. Ви все одно можете надіслати своє звернення.'
            },
            budget_exhausted_title: 'ШI-аналіз пропущено',
            budget_exhausted_submitted: 'Бюджет ШI-аналізу за цей місяць вичерпано. Ваше звернення було успішно надіслано.'
        },
        buttons: {
            photo: 'Звернення з фото',
            classic: 'Класичне звернення',
            follow: 'Відстежувати звернення',
            following: 'Відстежується',
            share: 'Поділитися зверненням',
            print: 'Друкувати',
            flag: 'Поскаржитися',
            flag_submitted: 'Вже повідомлено',
            copy_link: 'Копіювати посилання',
            link_copied: 'Посилання скопійовано до буфера обміну',
            email: 'Електронна пошта',
            directions: 'Прокласти маршрут'
        },
        following: {
            count: 'Відстежується {count} звернень',
            mark_all_read: 'Позначити всі як прочитані',
            no_reports: 'Ще немає відстежуваних звернень',
            no_address: 'Адреса недоступна',
            status_updated: 'Статус оновлено',
            status_changed: 'Статус змінено на:',
            awaiting_server: 'Очікування оновлення',
            escalated_to: 'Переспрямовано до {jurisdiction}',
            escalated_click: 'Натисніть, щоб відкрити в новій юрисдикції',
            unavailable: 'Це повідомлення наразі недоступне. Будь ласка, перевірте електронну пошту або зв\'яжіться з нами.',
            date: {
                today: 'Сьогодні',
                tomorrow: 'Завтра',
                yesterday: 'Вчора',
                unknown: 'Unknown date'
            }
        }
    },
    map: {
        tap_to_load: 'Торкніться, щоб показати карту',
        tap_to_select_location: 'Торкніться карти, щоб вибрати місцезнаходження',
        loading: 'Завантаження карти...',
        loading_address: 'Завантаження адреси...',
        retry_attempt: 'Спроба {count}',
        confirm_location: 'Підтвердити місцезнаходження',
        add_report_here: 'Додати звернення тут',
        controls: {
            zoom_in: 'Збільшити',
            zoom_out: 'Зменшити',
            find_location: 'Знайти моє місцезнаходження',
            toggle_heatmap: 'Перемкнути теплову карту',
            toggle_language: 'Змінити мову',
            add_report_here: 'Повідомити тут',
            adjust_tilt: 'Налаштувати нахил',
            degrees: '{count} градусів',
            layers: 'Шари карти',
            no_layers: 'Немає доступних шарів',
            geolocation: {
                label: 'Отримати поточне місцезнаходження'
            },
            zoom: 'Zoom controls'
        },
        pick: {
            drag_hint: 'Перетягніть маркер для налаштування позиції'
        },
        tooltip: {
            label: 'Інформація про маркер карти',
            opens_form_above: 'Відкриває форму вище',
            opens_modal: 'Відкривається в діалоговому вікні'
        },
        keyboard: {
            canvasInstructions: 'Інтерактивна карта з маркерами звернень. Клавіші зі стрілками переміщаються між маркерами, Shift+стрілка переміщає карту, Enter вибирає. Натисніть Ctrl+= для збільшення, Ctrl+- для зменшення.',
            noFeatures: 'У поточному вигляді карти немає видимих маркерів. Спробуйте збільшити масштаб або перемістити карту.',
            zoomedIntoCluster: 'Збільшено область кластера. Використовуйте клавіші зі стрілками для переміщення між маркерами.',
            clusterFocused: 'Кластер з {count} зверненнями у фокусі. Натисніть Enter для розгортання. {position}',
            clusterExpanded: 'Кластер розгорнуто у {count} звернень. {featureLabel}',
            markerFocused: 'Звернення у фокусі: {name} за адресою {address}{context}. Натисніть Enter для відкриття деталей. {position}',
            expandedContext: ' (розгорнуто з кластера)',
            untitledReport: 'Звернення без назви',
            unknownLocation: 'місцезнаходження',
            featurePosition: 'Елемент {current} з {total}.',
            pannedToExplore: 'Карта переміщена {direction}. Відпустіть Shift і використовуйте клавіші зі стрілками для навігації.',
            pannedNoMarkers: 'Карта переміщена {direction}. Маркерів у цьому напрямку не знайдено. Використовуйте клавіші зі стрілками для продовження дослідження.'
        }
    },
    detail: {
        location: 'Місцезнаходження',
        photos: 'Фотографії',
        description: 'Опис',
        status_history: 'Історія статусу',
        updates: 'Оновлення',
        no_updates: 'Ще немає оновлень',
        edit: 'Редагувати',
        follow: {
            button: 'Стежити',
            following: 'Відстежується',
            stop: 'Припинити відстеження',
            success: 'Тепер ви відстежуєте це звернення',
            error: 'Помилка відстеження звернення',
            updating: 'Оновлення...'
        },
        unavailable: {
            title: 'Звернення недоступне',
            message: 'Це звернення не існує або ще не було опубліковано. Нещодавно подані звернення можуть з\'явитися через деякий час.'
        },
        dialog_description: 'View report details'
    },
    stats: {
        status_overview: 'Статус',
        pie_chart: 'Розподіл',
        total_reports: 'Всього звернень',
        status_distribution: 'Розподіл за статусом',
        category_distribution: 'Розподіл за категорією',
        uncategorized: 'Без категорії',
        showing_reports: 'Показано {visible} з {total} звернень',
        no_reports: 'Немає доступних звернень',
        open_reports: 'Відкриті звернення',
        closed_reports: 'Закриті звернення',
        no_data_available: 'Дані недоступні',
        expand: 'Показати деталі',
        collapse: 'Приховати деталі',
        subcategory: 'підкатегорія',
        subcategories: 'підкатегорії'
    },
    time: {
        days_ago: '{count} днів тому',
        just_now: 'Щойно',
        minutes_ago: '{count} хвилин тому',
        hours_ago: '{count} годин тому',
        yesterday: 'Вчора',
        today: 'Сьогодні'
    },
    list: {
        showing: 'Показано {visible} з {total} звернень',
        showing_in_area: '{visible} у цій області, загалом {total}',
        showing_area_only: '{visible} у цій області',
        no_results: 'Звернень не знайдено',
        no_filtered_results: 'Жодне звернення не відповідає критеріям фільтра',
        load_more: 'Всі звернення завантажено',
        load_more_button: 'Завантажити більше',
        newest_first: 'Спочатку найновіші',
        oldest_first: 'Спочатку найстаріші',
        refresh: 'Оновити',
        status_update: 'Статус оновлено',
        location: 'Місцезнаходження',
        unpublished: 'Не опубліковано',
        editable: 'Редаговане'
    },
    errors: {
        general: 'Щось пішло не так',
        search_failed: 'Пошук не вдався. Будь ласка, спробуйте ще раз.',
        api: {
            rate_limit: 'Забагато запитів. Зачекайте і спробуйте знову.',
            unauthorized: 'Не авторизовано. Увійдіть знову.',
            forbidden: 'Доступ заборонено.',
            not_found: 'Ресурс не знайдено.',
            server_error: 'Помилка сервера. Спробуйте пізніше.',
            default: 'Помилка API: {status}'
        },
        upload_failed: 'Завантаження не вдалося',
        location_error: 'Не вдається визначити місцезнаходження',
        network_error: 'Помилка мережі',
        geolocation: {
            title: 'Помилка геолокації',
            permission_denied: 'Доступ до місцезнаходження заборонено. Будь ласка, дозвольте доступ у налаштуваннях браузера.',
            unavailable: 'Інформація про місцезнаходження наразі недоступна.',
            timeout: 'Час очікування визначення місцезнаходження вичерпано.',
            unknown: 'Виникла невідома помилка геолокації.'
        },
        try_again: 'Спробуйте знову',
        validation: {
            title: 'Вибачте, ми не можемо обробити цей запит:',
            location_error_title: 'Помилка місцезнаходження',
            invalid_input: 'Невірні дані',
            duplicate_title: 'Знайдено дублікат',
            duplicate_found: 'Знайдено подібне звернення',
            duplicate_report: 'Подібне звернення вже створено (№ {reportId})',
            location_out_of_bounds: 'Вибране місцезнаходження знаходиться за межами нашої юрисдикції',
            required_field: '{field} є обов\'язковим',
            required_fields: 'Заповніть усі обов\'язкові поля',
            please_review: 'Перевірте форму та виправте помилки перед надсиланням.',
            file_size: 'Вибраний файл занадто великий (макс. 10 МБ)',
            file_type: 'Формат не підтримується (дозволено: jpg, png, webp)',
            media_upload: 'Помилка завантаження зображення',
            invalid_format: 'Невірний формат для {field}',
            photo_required: 'Фотографія є обов\'язковою для цієї категорії',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway',
            consent_required: 'Please accept the privacy policy'
        },
        rate_limit: {
            title: 'Перевищено ліміт запитів',
            general: 'Спробуйте пізніше.',
            with_time: 'Спробуйте знову через {seconds} секунд.'
        },
        network: 'Проблема з підключенням. Перевірте інтернет-з\'єднання',
        timeout: 'Час очікування вичерпано. Спробуйте знову',
        upload: {
            invalid_type: 'Невірний тип файлу. Завантажуйте лише зображення.',
            file_too_large: 'Файл занадто великий. Максимальний розмір {size}.',
            dimensions_too_large: 'Розміри зображення занадто великі. Максимум {width}x{height} пікселів.',
            invalid_image: 'Невірний або пошкоджений файл зображення.',
            failed: 'Завантаження не вдалося. Спробуйте знову.',
            limit_reached: 'Досягнуто максимальну кількість {count} файлів.',
            remove_to_add: 'Видаліть фото, щоб додати нове',
            single_file_limit: 'Можна завантажити лише одне зображення.',
            exact_file_limit: 'Можна завантажити максимум {count} зображень.',
            title: 'Upload Error',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'Помилка надсилання або завантаження зображення.',
        unknown: 'Сталася невідома помилка.',
        pending_uploads: 'Зачекайте, поки всі завантаження завершаться.',
        incomplete_form: 'Заповніть усі обов\'язкові поля.',
        page: {
            title: 'Помилка',
            not_found_title: 'Сторінку не знайдено',
            not_found_message: 'Вибачте, сторінка, яку ви шукаєте, не існує.',
            server_error_title: 'Помилка сервера',
            server_error_message: 'Вибачте, щось пішло не так на нашому сервері.',
            generic_title: 'Сталася помилка',
            generic_message: 'Сталася неочікувана помилка.',
            action_home: 'Повернутися на головну',
            action_back: 'Назад',
            action_retry: 'Спробувати знову',
            details: 'Деталі помилки'
        }
    },
    success: {
        report_submitted: 'Звернення надіслано',
        report_submitted_description: 'Ваше звернення успішно надіслано і незабаром буде розглянуто.',
        moderation_notice: 'Ваше звернення буде перевірено перед публікацією. Ваш номер:',
        submit_another: 'Надіслати ще одне звернення',
        auto_followed: 'Це звернення автоматично додано до ваших відстежуваних звернень',
        visibility_limitation_notice: 'Зверніть увагу, що не всі звернення стають публічно видимими на сайті. Якщо ваше звернення не оновлюється у списку відстежуваних, воно все одно могло бути оброблене містом. Перевірте свою електронну пошту для оновлень статусу.',
        fun_facts: [
            'Кожне звернення, яке ви надсилаєте, допомагає зробити ваше місто кращим місцем для життя!',
            'Звернення громадян допомогли вирішити понад 10 000 проблем у містах по всьому світу.',
            'Середнє звернення розглядається протягом 24 годин.',
            'Ви частина спільноти, яка піклується про громадські простори!',
            'Дані зі звернень громадян допомагають міським планувальникам приймати кращі рішення.',
            'Відстеження звернень автоматично інформує вас про прогрес.',
            'Звернення з фото обробляються в 3 рази швидше, ніж текстові.',
            'Платформи громадської участі, подібні до цієї, існують у понад 50 країнах.',
            'Ваш відгук допомагає визначити пріоритети вирішення проблем.',
            'Цифрове звітування скоротило час реагування до 60%.',
            'Активні громадяни створюють міцніші, більш стійкі громади.',
            'Аналіз ШІ допомагає точніше категоризувати ваші звернення.',
            'Мобільне звітування дозволяє легко повідомляти про проблеми, коли ви їх бачите.',
            'Дякуємо за те, що ви активний громадянин!'
        ]
    },
    flag: {
        title: 'Поскаржитися на це звернення',
        description: 'Допоможіть нам підтримувати якість, повідомляючи про неприйнятний вміст.',
        reason_label: 'Чому ви скаржитесь на це звернення?',
        reason_spam: 'Спам або реклама',
        reason_offensive: 'Образливий або неприйнятний вміст',
        reason_personal: 'Містить персональні дані',
        reason_location: 'Неправильне розташування',
        reason_other: 'Інше',
        details_label: 'Додаткові деталі',
        details_placeholder: 'Будь ласка, опишіть проблему...',
        details_required: 'Будь ласка, надайте деталі',
        submit: 'Надіслати',
        success: 'Дякуємо. Ми перевіримо це звернення.',
        error: 'Не вдалося надіслати. Спробуйте ще раз.',
        already_flagged: 'Ви вже поскаржились на це звернення.'
    },

    pwa: {
        install: {
            title: 'Встановити додаток',
            button: 'Встановити',
            not_now: 'Не зараз',
            description: 'Клацніть на іконку встановлення в адресному рядку браузера, щоб встановити цей додаток.',
            share_button: 'Іконка поділитися',
            open_safari: 'Браузер Safari',
            ios: {
                title: 'Додати на головний екран',
                safari_instructions: 'Натисніть {icon} і виберіть "На Початковий екран".',
                other_instructions: 'Відкрийте цей сайт у {browser} для встановлення.'
            },
            chrome: {
                instructions: 'Клацніть на іконку встановлення {icon} на панелі інструментів, щоб встановити цей додаток.'
            },
            edge: {
                instructions: 'Клацніть на іконку встановлення {icon} в адресному рядку.'
            },
            firefox: {
                instructions: 'Клацніть на іконку домашньої сторінки {icon} в адресному рядку.'
            }
        }
    },
    boundaries: {
        loading: 'Завантаження даних меж...',
        error: 'Не вдається перевірити межі місцезнаходження. Спробуйте пізніше.',
        notLoaded: 'Межі ще не завантажено',
        outsideNonStrict: 'Примітка: Вибране місцезнаходження знаходиться за межами {locationName}.',
        outsideStrict: 'Вибране місцезнаходження знаходиться за межами {locationName}. Виберіть місцезнаходження в межах міста.',
        validationUnavailable: 'Перевірка меж недоступна. Ваше звернення буде прийнято, але може бути перевірено.'
    },
    filters: {
        title: 'Фільтри',
        status: {
            title: 'Статус'
        },
        time: {
            title: 'Час',
            today: 'Сьогодні',
            week: 'Цього тижня',
            month: 'Цього місяця'
        },
        category: {
            title: 'Категорія',
            other: 'Інше'
        },
        actions: {
            more: 'Більше фільтрів',
            expand: 'Більше фільтрів',
            collapse: 'Менше',
            clear_all: 'Очистити все',
            active_count: '{count} фільтрів активно',
            toggle: 'Фільтри'
        }
    },
    privacy: {
        notice_text: 'Інформацію про конфіденційність можна знайти',
        notice_link_text: 'тут',
        modal: {
            title: 'Політика конфіденційності',
            loading: 'Завантаження інформації про конфіденційність...',
            retry: 'Спробувати знову',
            noContent: 'Інформація про конфіденційність недоступна.',
            lastUpdated: 'Останнє оновлення',
            close: 'Закрити'
        }
    },
    search: {
        placeholder: 'Пошук звернень...',
        no_results_local: 'Результатів у поточному вигляді не знайдено',
        expand_to_server: 'Шукати всі звернення',
        expand_hint: 'Шукати за межами поточного вигляду',
        searching_server: 'Пошук усіх звернень...'
    },
    info: {
        welcome: {
            heading: 'Ласкаво просимо до {name}',
            headingGeneric: 'Ласкаво просимо',
            body: 'Використовуйте цю карту для повідомлення про проблеми або перегляду існуючих звернень у вашому районі.'
        },
        shortcuts: {
            aria_label: 'Швидкі дії',
            photo: {
                title: 'Фото',
                description: 'Зробіть фото, ШІ зробить решту',
                aria_label: 'Створити звернення з фото'
            },
            classic: {
                title: 'Класичне',
                description: 'Опишіть і вкажіть місце проблеми',
                aria_label: 'Створити класичне звернення'
            },
            following: {
                title: 'Стежити',
                description: 'Будьте в курсі прогресу',
                aria_label: 'Відкрити звернення, за якими стежите'
            },
            list: {
                title: 'Дослідити',
                description: 'Подивіться, що відбувається поруч',
                aria_label: 'Дослідити карту та переглянути список'
            }
        }
    },
    auth: {
        login: {
            title: 'Увійти',
            subtitle: 'Введіть вашу електронну адресу, щоб отримати код підтвердження',
            email_label: 'Електронна адреса',
            email_hint: 'Ми надішлемо вам 6-значний код',
            email_placeholder: 'електронна адреса',
            send_code: 'Надіслати код підтвердження',
            disabled: {
                title: 'Вхід недоступний',
                message: 'Вхід без пароля тут не активовано. Зверніться до адміністратора, якщо вам потрібен доступ.',
                back_button: 'На головну'
            }
        },
        verify: {
            email_label: 'Електронна адреса',
            code_label: 'Код підтвердження',
            code_hint: 'Введіть 6-значний код з вашої електронної пошти',
            code_placeholder: '123456',
            verify_button: 'Підтвердити та увійти',
            back_button: 'Використати іншу адресу',
            request_new: 'Запросити новий код',
            resend_code: 'Надіслати код повторно',
            expires_in: 'Код закінчується через {time}',
            expired_title: 'Код закінчився',
            expired_message: 'Ваш код підтвердження закінчився. Запросіть новий.'
        },
        code_sent: {
            title: 'Код надіслано',
            message: 'Ми надіслали 6-значний код підтвердження на {email}'
        },
        error: {
            title: 'Помилка автентифікації',
            request_failed: 'Не вдалося надіслати код підтвердження. Спробуйте знову.',
            verify_failed: 'Невірний або прострочений код підтвердження',
            sso_failed: 'Не вдалося увійти. Спробуйте знову.',
            network: 'Помилка мережі. Перевірте з\'єднання.',
            logout_failed: 'Не вдалося вийти. Спробуйте знову.'
        },
        sso: {
            completing: 'Завершення входу...',
            method_label: 'Єдиний вхід',
            button_aria: 'Увійти через {provider} за допомогою єдиного входу'
        },
        user: {
            logged_in_as: 'Увійшли як',
            logout: 'Вийти'
        },
        welcome: {
            greeting: 'Привіт, {name}',
            sign_in: 'Увійти',
            sign_out: 'Вийти',
            user_avatar: 'User avatar'
        }
    },
    profile: {
        title: 'Профіль',
        account: {
            title: 'Обліковий запис',
            roles: 'Ролі'
        },
        groups: {
            title: 'Групи'
        },
        appearance: {
            title: 'Зовнішній вигляд',
            color_mode: 'Режим кольору',
            light: 'Світлий',
            dark: 'Темний',
            system: 'Системний',
            theme_override: 'Власні кольори теми',
            theme_override_description: 'Замініть стандартну тему юрисдикції власними уподобаннями кольорів',
            primary_color: 'Основний колір',
            secondary_color: 'Додатковий колір',
            neutral_color: 'Нейтральний колір',
            reset_theme: 'Скинути за замовчуванням'
        },
        language: {
            title: 'Мова',
            select: 'Вибрати мову',
            save_failed: 'Не вдалося зберегти мовні налаштування. Будь ласка, спробуйте ще раз.'
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
            title: 'Сторінку не знайдено',
            description: 'Сторінка, яку ви шукаєте, не існує або була переміщена.'
        },
        403: {
            title: 'Доступ заборонено',
            description: 'У вас немає дозволу на перегляд цієї сторінки.'
        },
        500: {
            title: 'Щось пішло не так',
            description: 'Сталася непередбачена помилка. Будь ласка, спробуйте ще раз.'
        },
        fallback: {
            title: 'Помилка',
            description: 'Сталася непередбачена помилка.'
        },
        actions: {
            back: 'Назад',
            home: 'На головну',
            retry: 'Спробувати ще раз'
        }
    },
    legal: {
        impressum: {
            title: 'Правова інформація',
            heading: 'Правова інформація',
            responsible_heading: 'Відповідальний за вміст',
            responsible_text: '{name} несе відповідальність за вміст цієї платформи.'
        },
        privacy: {
            title: 'Політика конфіденційності',
            heading: 'Політика конфіденційності',
            intro: 'Захист ваших персональних даних є важливим для нас. Ми обробляємо ваші дані виключно на підставі правових норм (GDPR).',
            controller_heading: 'Контролер даних',
            data_heading: 'Зібрані дані',
            data_text: 'При використанні цієї платформи обробляються такі дані: дані про місцезнаходження звернення, текст опису, завантажені фото та технічні дані доступу (IP-адреса, тип браузера, час доступу).',
            rights_heading: 'Ваші права',
            rights_text: 'Ви маєте право на доступ, виправлення, видалення, обмеження обробки, перенесення даних та заперечення.'
        },
        terms: {
            title: 'Умови використання',
            heading: 'Умови використання',
            intro: 'Використовуючи цю платформу, ви погоджуєтесь з наступними умовами.',
            purpose_heading: 'Мета',
            purpose_text: 'Ця платформа призначена для повідомлення про проблеми у громадських місцях. Звернення передаються відповідальному органу.',
            obligations_heading: 'Обов\'язки користувача',
            obligations_text: 'Ви зобов\'язуєтесь надавати лише правдиву інформацію та не завантажувати незаконний вміст. Завантажені фото не повинні показувати впізнаваних осіб без їхньої згоди.',
            liability_heading: 'Відповідальність',
            liability_text: '{name} не несе відповідальності за повноту та точність наданої інформації.'
        },
        email_label: 'Електронна пошта',
        contact_label: 'Контакт',
        platform: {
            heading: 'Оператор платформи',
            intro: 'Ця платформа технічно обслуговується:',
            description: 'Civic Patches GmbH забезпечує технічну інфраструктуру для платформи Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Німеччина',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Оператор цієї карти',
            not_configured: 'Оператор цієї карти ще не надав свою правову інформацію. Оператори загальнодоступних онлайн-сервісів можуть бути зобов\'язані надати правову інформацію та політику конфіденційності.'
        },
        footer: {
            impressum: 'Правова інформація',
            privacy: 'Конфіденційність',
            terms: 'Умови використання'
        },
        not_configured: 'Дані оператора ще не налаштовані.'
    },
    demo_mode: {
        banner: {
            title: 'Демо-середовище',
            message: 'Повідомлення, введені тут, не передаються жодному органу влади.',
            link_label: 'Відвідати mark-a-spot.com',
            minimize_label: 'Згорнути демо-повідомлення',
            expand_label: 'Розгорнути демо-повідомлення'
        },
        reset: {
            title: 'Демо-база даних',
            notice: 'Демо-система скидається щогодини.',
            countdown_label: 'Наступне скидання через',
            countdown_aria: 'Наступне скидання демо-бази даних через {time}'
        },
        modal: {
            title: 'Демо-відправлення',
            body: 'Це демо. Ваше повідомлення НЕ буде передане до органу місцевого самоврядування. Продовжити з демо-відправленням?',
            confirm_label: 'Надіслати демо-повідомлення',
            cancel_label: 'Скасувати'
        },
        lite: {
            title: 'Лише демо',
            heading: 'Демо-середовище',
            body: 'Це демонстрація Mark-a-Spot. Надсилання через спрощену форму тут вимкнено, щоб реальні повідомлення ніколи випадково не потрапили до органу місцевого самоврядування.',
            link_label: 'Відвідати mark-a-spot.com'
        }
    },
    print: {
        title: 'Звіт про запит на обслуговування',
        description: 'Опис',
        location: 'Місцезнаходження',
        media: 'Вкладення',
        image_unavailable: 'Image unavailable',
        attributes: 'Додаткові поля',
        status_history: 'Історія статусів',
        internal_fields: 'Внутрішня інформація',
        organisation: 'Відділ',
        hazard_level: 'Рівень небезпеки',
        hazard_category: 'Категорія небезпеки',
        sentiment: 'Тональність',
        printed_at: 'Надруковано',
        showing_recent: 'Показано {count} з {total} оновлень'
    }
};
