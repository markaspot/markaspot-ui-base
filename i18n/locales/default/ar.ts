// locales/ar.ts
export default {
    locale: {
        code: 'ar-SA'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    nav: {
        map: 'الخريطة',
        dashboard: 'لوحة التحكم',
        back_to_frontend: 'العودة إلى الخريطة'
    },
    dashboard: {
        title: 'لوحة التحكم',
        welcome: 'مرحباً، {name}',
        nav: {
            dashboard: 'لوحة التحكم',
            requests: 'الطلبات',
            settings: 'الإعدادات',
            categories: 'الفئات',
            jurisdictions: 'الاختصاصات',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'اللغات',
            billing: 'الفواتير'
        },
        help: {
            docs: 'التوثيق',
            support: 'التواصل مع الدعم'
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
            profile: 'الملف الشخصي',
            logout: 'تسجيل الخروج'
        },
        jurisdiction: {
            current: 'مساحة العمل',
            citizenView: 'عرض المواطن',
            switchTo: 'التبديل إلى',
            blocked: 'محجوب',
            admin_section_header: 'جميع مساحات العمل (وصول المشرف)'
        },
        stats: {
            total: 'إجمالي الطلبات',
            pending: 'قيد الانتظار',
            in_progress: 'قيد المعالجة',
            resolved: 'تم الحل',
            my_groups: 'مجموعاتي',
            overall: 'الإجمالي'
        },
        recent_requests: 'الطلبات الأخيرة',
        view_all: 'عرض الكل',
        no_recent: 'لا توجد طلبات حديثة',
        wms: {
            title: 'طبقات الخريطة',
            attribution: 'البيانات: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'المعرف',
                media: 'الوسائط',
                category: 'الفئة',
                status: 'الحالة',
                created: 'تاريخ الإنشاء'
            }
        }
    },
    form: {
        body: 'الوصف',
        body_description: 'يرجى تقديم وصف مفصل',
        body_placeholder: 'أدخل الوصف...',
        category: 'الفئة',
        category_description: 'اختر الفئة المناسبة لبلاغك',
        category_placeholder: 'اختر فئة',
        category_disabled: {
            title: 'تم اختيار الفئة',
            description: 'لقد اخترت الفئة "{category}". هذه الفئة لها متطلبات خاصة أو لا تسمح بمزيد من التحرير.'
        },
        category_empty: 'لا توجد فئات متاحة',
        category_loading: 'جاري تحميل الفئات...',
        category_disabled_notice: 'هذه الفئة للمعلومات فقط. لا يمكن إرسال البلاغات.',
        category_description_loading: 'جاري تحميل الوصف...',
        category_description_error: 'خطأ في تحميل الوصف',
        email: 'البريد الإلكتروني',
        email_description: 'بريدك الإلكتروني للتواصل',
        email_placeholder: 'أدخل بريدك الإلكتروني',
        first_name: 'الاسم الأول',
        first_name_description: 'اسمك الأول',
        first_name_placeholder: 'أدخل اسمك الأول',
        last_name: 'اسم العائلة',
        last_name_description: 'اسم عائلتك',
        last_name_placeholder: 'أدخل اسم عائلتك',
        gdpr: 'اتفاقية حماية البيانات',
        gdpr_description: 'أوافق على معالجة بياناتي كما هو موضح في سياسة الخصوصية.',
        object_id: 'معرف الكائن',
        object_id_description: 'معرف الكائن المُبلَغ عنه',
        object_id_placeholder: 'أدخل معرف الكائن (مثل رقم العمود)',
        phone: 'رقم الهاتف',
        phone_description: 'رقم هاتفك للتواصل',
        phone_placeholder: 'أدخل رقم هاتفك',

        // الإبلاغ القائم على المرافق
        facility: 'مرفق',
        facility_plural: 'مرافق',
        facility_placeholder: 'اختر {label}',
        facility_required: '{label} مطلوب.',
        facility_unavailable: 'المرفق المحدد لم يعد متاحاً، يرجى الاختيار مجدداً.',
        facility_nearest_snapped: 'أقرب مرفق: {label}',
        facility_no_nearby: 'لا يوجد مرفق قريب، يرجى الاختيار يدوياً.',
        facility_use_my_location: 'استخدام موقعي',
        facility_locating: 'جارٍ تحديد الموقع…',
        facility_no_match: 'لا توجد منشأة تطابق بحثك.',
        facility_opens_in_new_tab: '(يفتح في علامة تبويب جديدة)',
        facility_deselected_map_pick: 'استخدام موقعك الخاص بدلاً من {label}',
        facility_tagged_with: 'في: {label}',

        imagelist: {
            empty: 'لا توجد صور متاحة لهذا النوع.'
        },
        back_to_report: 'العودة إلى نموذج البلاغ',
        requirements: {
            title: 'Still required',
            ready_to_submit: 'Ready to submit',
            photo: 'Upload a photo',
            category: 'Select a category',
            location: 'Provide location',
            description: 'Enter a description',
            email: 'Provide email address',
            privacy: 'Accept privacy policy',
            privacyBlock: 'استبدل الصورة الحساسة للخصوصية أو احذفها',
            conditional: 'depending on category'
        },
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'الوصف مطلوب',
        category_required: 'الفئة مطلوبة',
        email_required: 'البريد الإلكتروني مطلوب',
        email_format: 'صيغة البريد الإلكتروني غير صحيحة',
        first_name_required: 'الاسم الأول مطلوب',
        last_name_required: 'اسم العائلة مطلوب',
        gdpr_required: 'يجب الموافقة على شروط حماية البيانات',
        object_id_required: 'معرف الكائن مطلوب',
        phone_required: 'رقم الهاتف مطلوب',
        required_field: '{field} مطلوب'
    },
    feedback: {
        page_title: 'ملاحظات طلب الخدمة',
        error_title: 'خطأ في التحميل',
        invalid_request: 'طلب غير صالح أو منتهي الصلاحية',
        thank_you: 'شكراً لملاحظاتك!',
        submission_received: 'تم استلام ملاحظاتك بنجاح',
        loading: 'جاري تحميل الطلب...',
        title: 'ملاحظات لـ: {service}',
        description: 'يرجى تقديم ملاحظاتك',
        placeholder: 'أدخل ملاحظاتك هنا...',
        reopen_request: 'أرغب في إعادة فتح هذا الطلب',
        submitting: 'جاري الإرسال...',
        sending: 'جاري الإرسال...',
        submit: 'إرسال الملاحظات',
        existing_title: 'ملاحظاتك لـ: {service}',
        already_submitted: 'لقد قدمت ملاحظات لهذا الطلب بالفعل',
        missing_uuid: 'معرف الخدمة مفقود',
        success_notification: 'تم إرسال الملاحظات بنجاح',
        success_with_id: 'تم إرسال الملاحظات بنجاح للطلب #{id}',
        updated_successfully: 'تم تحديث الملاحظات بنجاح',
        added_to_list: 'تمت إضافة الطلب إلى قائمتك',
        submission_error: 'فشل إرسال الملاحظات',
        server_error: 'خطأ في الخادم: لا يمكن معالجة الملاحظات في الوقت الحالي',
        submission_failed: 'فشل إرسال الملاحظات. يرجى المحاولة لاحقاً',
        already_exists: 'توجد ملاحظات لهذا الطلب بالفعل',
        error_fetching_request: 'خطأ في تحميل تفاصيل الطلب',
        no_content: 'لا يوجد محتوى للملاحظات',
        refresh_complete: 'تم تحديث قائمة الطلبات',
        try_again: 'حاول مرة أخرى',
        format_unrecognized: 'تنسيق الطلب غير معروف',
        processing_error: 'خطأ في معالجة بيانات الطلب',
        your_feedback: 'ملاحظاتك',
        contact_preference: 'تفضيل التواصل',
        no_contact: 'بدون تواصل',
        email_contact: 'التواصل عبر البريد الإلكتروني',
        email_placeholder: 'عنوان بريدك الإلكتروني',
        set_status_open: 'تعيين الحالة إلى مفتوح',
        set_status_open_description: 'إذا كنت تريد منا إعادة النظر في هذا، يمكنك إعادة فتح هذا الطلب.',
        email_verification: 'التحقق من البريد الإلكتروني',
        email_verification_placeholder: 'البريد الإلكتروني من البلاغ الأصلي',
        email_verification_description: 'أدخل البريد الإلكتروني الذي استخدمته عند إنشاء البلاغ الأصلي.',
        email_mismatch: 'البريد الإلكتروني المدخل لا يتطابق مع البلاغ الأصلي.',
        unauthorized_access: 'وصول غير مصرح. يرجى التحقق من بريدك الإلكتروني.',
        not_eligible: 'هذا الطلب غير مؤهل للملاحظات حالياً',
        service_provider: {
            page_title: 'رد مقدم الخدمة',
            page_description: 'إرسال ملاحظات الإنجاز للطلبات المعينة',
            modal_title: 'رد مقدم الخدمة',
            dialog_description: 'نموذج رد مقدم الخدمة',
            title: 'إكمال المهمة',
            your_email: 'عنوان بريدك الإلكتروني',
            email_placeholder: 'provider{\'@\'}example.com',
            email_verification_note: 'أدخل بريدك الإلكتروني كمقدم خدمة للتحقق',
            completion_notes: 'ملاحظات الإنجاز',
            notes_placeholder: 'صف العمل الذي تم إنجازه...',
            mark_as_completed: 'وضع علامة مكتمل',
            mark_as_completed_description: 'تعيين حالة الطلب إلى مكتمل',
            submit_completion: 'إرسال الإنجاز',
            complete_request: 'إكمال المهمة',
            completing: 'جاري الإرسال...',
            completion_success: 'تم إرسال إنجاز الطلب بنجاح',
            submission_failed: 'فشل إرسال الإنجاز. يرجى المحاولة لاحقاً',
            server_error: 'خطأ في الخادم: لا يمكن معالجة الإنجاز في الوقت الحالي',
            completion_not_allowed: 'لا يمكن إكمال هذا الطلب في الوقت الحالي',
            email_verification_failed: 'فشل التحقق من البريد الإلكتروني. يرجى التحقق من عنوانك',
            already_completed: 'تم إكمال هذا الطلب بالفعل',
            loading: 'جاري تحميل الطلب...',
            try_again: 'حاول مرة أخرى',
            invalid_uuid: 'طلب غير صالح أو منتهي الصلاحية',
            load_error: 'خطأ في تحميل تفاصيل الطلب',
            error_fetching_request: 'خطأ في تحميل تفاصيل الطلب',
            completion_notes_required: 'يرجى تقديم ملاحظات الإنجاز',
            existing_completions: 'الإنجازات السابقة',
            reassignment_note: 'تم وضع علامة على هذا الطلب لإعادة التعيين ويمكنه استقبال إنجازات متعددة',
            mark_completed_description: 'Confirm that the work has been completed'
        },
        dialog_description: 'Feedback form dialog'
    },
    service_unavailable: {
        title: 'الخدمة غير متاحة مؤقتاً',
        message: 'لا يمكننا الاتصال بخدماتنا الآن. هذه المشكلة مؤقتة على الأرجح.',
        retry: 'نواجه حالياً صعوبات تقنية. يرجى المحاولة مرة أخرى بعد {seconds} ثانية.',
        auto_retry: 'إعادة المحاولة خلال {seconds} ثانية...',
        retry_now: 'حاول الآن',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    header: {
        logo_alt: 'الشعار',
        app_name: 'Mark-a-Spot',
        app_claim: 'بلاغك. حلنا.'
    },
    hiddenSection: {
        description: 'نظام الإبلاغ لدينا هو نظام للإبلاغ عن مشاكل البنية التحتية. يمكنك المتابعة مباشرة للإبلاغ عن المشاكل أو الانتقال إلى:',
        main_navigation: 'التنقل الرئيسي مع المعلومات وقائمة البلاغات والإحصائيات',
        map: 'خريطة تفاعلية مع علامات مرئية',
        map_navigation_hint: 'استخدم مفاتيح الأسهم ⬆️⬇️⬅️➡️ للتنقل بين علامات البلاغات، Enter ↩️ للاختيار، Escape ❌ لإلغاء الاختيار',
        action_button: 'الإبلاغ مباشرة',
        keyboard_navigation_hint: 'Use arrow keys to navigate, Enter to activate',
        skip_to_main_content: 'Skip to main content'
    },
    accessibility: {
        skip_to_main: 'الانتقال إلى المحتوى الرئيسي',
        skip_to_map: 'الانتقال إلى الخريطة',
        skip_to_navigation: 'الانتقال إلى التنقل',
        skip_to_form: 'الإبلاغ مباشرة',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'رجوع',
        not_classified: 'غير مصنف',
        no_value: 'لا توجد قيمة',
        close: 'إغلاق',
        loading: 'جاري التحميل...',
        error: 'خطأ',
        success: 'نجاح',
        submit: 'إرسال',
        cancel: 'إلغاء',
        required: 'مطلوب',
        save: 'حفظ',
        delete: 'حذف',
        edit: 'تحرير',
        clear: 'مسح',
        search: 'بحث',
        select: 'اختيار',
        on: 'تشغيل',
        off: 'إيقاف',
        toggle: 'تبديل',
        yesterday: 'أمس',
        did_you_know: 'هل تعلم؟',
        show_more: 'عرض المزيد',
        show_less: 'عرض أقل',
        learn_more: 'معرفة المزيد',
        learn_more_about: 'تعرف على المزيد حول {topic}',
        opens_in_new_tab: '(يفتح في علامة تبويب جديدة)',
        title: {
            classic: 'بلاغ كلاسيكي',
            photo: 'بلاغ بالصور'
        },
        buttons: {
            toggle_theme: 'تغيير المظهر',
            attribution: 'معلومات الخريطة',
            close: 'إغلاق'
        },
        navigation: 'لوحة التنقل',
        drawer_description: 'لوحة المحتوى والخيارات',
        resize_drawer: 'تغيير حجم اللوحة',
        drawer_position_n_of_total: 'الموضع {idx} من {total}',
        current: 'Current',
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'الموقع',
        field_gdpr: 'الموافقة على معالجة البيانات',
        field_e_mail: 'البريد الإلكتروني',
        field_category: 'الفئة',
        field_request_media: 'الصور',
        field_name: 'اسم العائلة',
        field_prename: 'الاسم الأول',
        field_first_name: 'الاسم الأول',
        field_first_name_placeholder: 'يرجى إدخال الاسم الأول',
        field_last_name: 'اسم العائلة',
        field_last_name_placeholder: 'يرجى إدخال اسم العائلة',
        field_phone: 'الهاتف',
        body: 'الوصف',
        field_add_data: 'المشاركة في المسابقة',
        field_terms_of_use: 'أوافق على الشروط والأحكام وسياسة الخصوصية.',
        field_address: 'العنوان',
        postal_code: 'الرمز البريدي',
        postal_code_placeholder: 'مثال: 10001',
        city: 'المدينة',
        city_placeholder: 'مثال: القاهرة',
        street_address: 'عنوان الشارع',
        street_address_placeholder: 'مثال: شارع الرئيسي 123'
    },
    competition: {
        intro: 'إذا كنت ترغب، شارك في السحب السنوي. لديك فرصة للفوز بجوائز جذابة ومكافآت نقدية نوزعها بين جميع المشاركين كشكر صغير.',
        disclaimer: 'موظفو الأقسام المسؤولة مستبعدون من المشاركة.',
        title: 'المشاركة في المسابقة',
        errors: {
            already_exists: 'مشاركة المسابقة موجودة بالفعل',
            duplicate_found: 'تم العثور على تكرار',
            duplicate_detail: 'تم بالفعل إنشاء مشاركة مسابقة لهذا البلاغ.',
            not_found: 'البلاغ غير موجود',
            not_found_detail: 'لم يتم العثور على البلاغ المرتبط.',
            save_failed: 'تعذر حفظ مشاركة المسابقة',
            submission_error: 'خطأ في الإرسال',
            submission_error_detail: 'لم يتم حفظ مشاركتك في المسابقة، لكن تم إرسال بلاغك بنجاح.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'معلومات',
                aria_label: 'تبويب المعلومات',
                panel_label: 'لوحة المعلومات'
            },
            list: {
                label: 'القائمة',
                aria_label: 'تبويب قائمة البلاغات',
                panel_label: 'لوحة قائمة البلاغات'
            },
            following: {
                label: 'المتابَعة',
                aria_label: 'تبويب البلاغات المتابعة',
                panel_label: 'لوحة البلاغات المتابعة'
            },
            stats: {
                label: 'الإحصائيات',
                aria_label: 'تبويب الإحصائيات',
                panel_label: 'لوحة الإحصائيات'
            }
        },
        main: 'التنقل الرئيسي',
        pages: 'تنقل الصفحات',
        browse_reports: 'تصفح البلاغات',
        back_to_form: 'العودة إلى النموذج',
        panel: {
            scrollable: 'منطقة قابلة للتمرير'
        },
        updates_count: '{count} تحديثات جديدة'
    },
    report: {
        form_types: 'أنواع البلاغات',
        how_to_help: 'كيفية إنشاء بلاغ',
        title: {
            photo: 'بلاغ بالصور',
            classic: 'بلاغ كلاسيكي',
            submit: 'إرسال البلاغ',
            edit: 'تحرير البلاغ',
            view: 'عرض البلاغ'
        },
        photo: {
            description: 'إنشاء بلاغ جديد مع صورة'
        },
        classic: {
            description: 'إنشاء بلاغ جديد بدون صورة'
        },
        status: {
            new: 'جديد',
            open: 'مفتوح',
            in_progress: 'قيد المعالجة',
            resolved: 'تم الحل',
            closed: 'مغلق',
            unknown: 'حالة غير معروفة'
        },
        form: {
            tabs: {
                photo: 'مع صورة',
                classic: 'كلاسيكي'
            },
            description: {
                label: 'الوصف',
                placeholder: 'يرجى وصف المشكلة...',
                ai_processing: 'الذكاء الاصطناعي يولد الوصف...',
                help: 'قدم أكبر قدر ممكن من التفاصيل'
            },
            category: {
                label: 'الفئة',
                placeholder: 'اختر فئة',
                loading: 'جاري تحميل الفئات...',
                error: 'خطأ في تحميل الفئات',
                empty: 'لا توجد فئات متاحة',
                help: 'اختيار الفئة (يتم تلقائياً)',
                description: 'وصف الفئة',
                description_loading: 'جاري تحميل الوصف...',
                description_error: 'خطأ في تحميل الوصف',
                disabled_notice: 'هذه الفئة للمعلومات فقط. لا يمكن الإرسال.'
            },
            location: {
                label: 'الموقع',
                placeholder: 'ابحث عن موقع...',
                selected: 'تم اختيار الموقع',
                clear: 'مسح الموقع',
                error: 'خطأ في الحصول على الموقع',
                help: 'أدخل عنواناً أو انقر على الخريطة',
                help_modal: 'أدخل عنواناً أو استخدم موقعك الحالي',
                current: 'استخدام الموقع الحالي',
                searching: 'جاري البحث...',
                pick_on_map: 'اختر على الخريطة',
                auto_detected: 'تم اكتشاف الموقع',
                complete_address: 'عنوان كامل',
                from_photo_exif: 'تم استخراج الموقع تلقائياً من بيانات الصورة',
                warning: 'تحذير الموقع',
                unknown_location: 'موقع غير معروف',
                suggestions: 'اقتراحات الموقع'
            },
            email: {
                label: 'البريد الإلكتروني للتحديثات',
                placeholder: 'أدخل بريدك الإلكتروني',
                help: 'سنرسل لك تحديثات حول بلاغك',
                subscribe: 'الاشتراك في التحديثات'
            },
            gdpr: {
                label: 'الموافقة على معالجة البيانات',
                description: 'أوافق على معالجة بياناتي وفقاً لسياسة الخصوصية.',
                required: 'يجب الموافقة للمتابعة',
                link: 'عرض سياسة الخصوصية'
            },
            media: {
                label: 'الصور',
                required: 'الصورة مطلوبة لهذه الفئة',
                upload: {
                    overall_progress: 'التقدم الإجمالي',
                    button: 'انقر للرفع',
                    or: ' أو',
                    drag: 'اسحب وأفلت',
                    drop_here: 'أفلت الملفات هنا للرفع',
                    restrictions: 'حتى {count} صور ({size} كحد أقصى، {types})',
                    restrictions_single: 'صورة واحدة ({size} كحد أقصى، {types})',
                    progress: 'تقدم الرفع',
                    started_sr: 'بدأ الرفع',
                    progress_sr: 'اكتمل الرفع بنسبة {progress}%',
                    success_sr: 'اكتمل الرفع بنجاح',
                    error_sr: 'فشل الرفع: {error}',
                    files_selected_sr: 'تم اختيار {count} ملف(ات) للرفع',
                    area_label: 'منطقة رفع الصور - انقر لاختيار الملفات أو اسحب وأفلت',
                    in_progress: 'جاري الرفع',
                    complete_sr: 'تم رفع الملف بنجاح.',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'معاينة الصورة',
                remove: 'إزالة الصورة',
                no_image_available: 'لا توجد صورة متاحة أو لم تُعرض لأسباب قانونية',
                progress: 'تقدم الرفع: {progress}%',
                limit_reached: 'تم الوصول للحد الأقصى {count} صور',
                privacy_notice: 'يرجى عدم تضمين أشخاص/لوحات أرقام في الصور',
                ai_analysis: 'التحليل عبر Azure AI (ألمانيا)',
                ai_analysis_tooltip: 'بالرفع تؤكد أن الصورة التقطت بشكل قانوني ولا تنتهك حقوق الآخرين.\n\nإذا كان الأشخاص أو لوحات الأرقام مرئية، يرجى إخفاءها قبل الرفع.\n\nالتحليل يخدم فقط لتصنيف بلاغك. يتم إرسال نسخة مصغرة بدون EXIF فقط إلى Azure OpenAI (ألمانيا)؛ الأصل لا يُرسل للخدمة.',
                offline_cached: 'Saved offline',
                ai_analysis_help: 'Information about AI analysis'
            },
            submit: {
                button: 'إرسال البلاغ',
                submitting: 'جاري الإرسال...',
                processing: 'جاري المعالجة...',
                success: 'تم إرسال البلاغ بنجاح',
                error: 'خطأ في إرسال البلاغ',
                loading: 'Loading form...'
            },
            loading: 'جاري تحميل نموذج البلاغ...',
            draft_saved: 'تم حفظ المسودة',
            modal_description: 'Create a new report'
        },
        ai: {
            label: 'ذ.ا.',
            powered: 'مدعوم بالذكاء الاصطناعي',
            analyzing: 'الذكاء الاصطناعي يحلل صورك...',
            started_sr: 'بدأ تحليل الذكاء الاصطناعي',
            complete_sr: 'اكتمل تحليل الذكاء الاصطناعي بنجاح',
            field_updated_sr: 'تم تحديث {field} بـ: {value}',
            analysis_complete_sr: 'اكتمل تحليل الذكاء الاصطناعي.',
            category_result_sr: 'تم اختيار الفئة: {category}.',
            description_result_sr: 'تم توليد الوصف: {description}',
            location_result_sr: 'تم العثور على الموقع: {location}.',
            category_hint: 'يبدو أن هذه الصورة لا تتطابق مع فئات تقاريرنا. يرجى اختيار فئة بنفسك.',
            processing: {
                analyzing: 'الاستعلام من الذكاء الاصطناعي...',
                location: 'فحص بيانات الصورة...',
                location_found: 'تم العثور على الموقع:',
                location_ai: 'البحث عن الموقع في الصورة...',
                location_not_found: 'لم يتم العثور على الموقع في بيانات الصورة.',
                location_complete: 'تم تحديد الموقع',
                category: 'تحديد الفئة...',
                category_found: 'تم تحديد الفئة:',
                category_not_matched: 'الفئة المقترحة من الذكاء الاصطناعي (تحتاج اختيار)',
                description: 'توليد الوصف...',
                description_complete: 'تم توليد الوصف',
                attributes_filled: 'تم ملء {count} حقل(حقول) إضافي(ة) مسبقاً',
                complete: 'اكتمل تحليل الذكاء الاصطناعي',
                error: 'خطأ أثناء تحليل الذكاء الاصطناعي',
                privacy_warning: 'تم اكتشاف مشكلة خصوصية'
            },
            privacy: {
                title: 'إشعار الخصوصية',
                description: 'ربما تم اكتشاف بيانات شخصية في صورتك ({issues}). سيتم مراجعة الصورة قبل النشر.',
                required: 'تم اكتشاف محتوى حساس للخصوصية في هذه الصورة ولا تتوفر إمكانية التمويه التلقائي له. لا يمكن استخدام هذه الصورة. يرجى استبدالها أو حذفها للمتابعة.',
                removePhoto: 'حذف الصورة',
                replace: 'استبدال الصورة',
                understood: 'المتابعة بهذه الصورة'
            },
            failed: {
                title: 'تحليل الصور غير متاح',
                description: 'سيتم مراجعة صورتك يدوياً قبل النشر. يمكنك إرسال بلاغك على أي حال.'
            },
            budget_exhausted_title: 'تم تخطي تحليل الذكاء الاصطناعي',
            budget_exhausted_submitted: 'تم استنفاد ميزانية تحليل الذكاء الاصطناعي لهذا الشهر. تم إرسال بلاغك بنجاح.'
        },
        buttons: {
            photo: 'بلاغ بالصور',
            classic: 'بلاغ كلاسيكي',
            follow: 'متابعة البلاغ',
            following: 'متابَع',
            share: 'مشاركة البلاغ',
            print: 'طباعة',
            flag: 'إبلاغ',
            flag_submitted: 'تم الإبلاغ بالفعل',
            copy_link: 'نسخ الرابط',
            link_copied: 'تم نسخ الرابط إلى الحافظة',
            email: 'البريد الإلكتروني',
            directions: 'الحصول على الاتجاهات'
        },
        following: {
            count: 'متابعة {count} بلاغ(ات)',
            mark_all_read: 'تحديد الكل كمقروء',
            no_reports: 'لا توجد بلاغات متابعة بعد',
            no_address: 'لا يوجد عنوان متاح',
            status_updated: 'تم تحديث الحالة',
            status_changed: 'تغيرت الحالة إلى:',
            awaiting_server: 'في انتظار التحديث',
            escalated_to: 'تم التحويل إلى {jurisdiction}',
            escalated_click: 'انقر للفتح في الجهة الجديدة',
            unavailable: 'هذا البلاغ غير متاح حالياً. يرجى التحقق من بريدك الإلكتروني أو الاتصال بنا.',
            date: {
                today: 'اليوم',
                tomorrow: 'غداً',
                yesterday: 'أمس',
                unknown: 'Unknown date'
            }
        }
    },
    map: {
        tap_to_load: 'انقر لعرض الخريطة',
        tap_to_select_location: 'انقر على الخريطة لاختيار الموقع',
        loading: 'جاري تحميل الخريطة...',
        loading_address: 'جاري تحميل العنوان...',
        retry_attempt: 'المحاولة {count}',
        confirm_location: 'تأكيد الموقع',
        add_report_here: 'إضافة بلاغ هنا',
        controls: {
            zoom_in: 'تكبير',
            zoom_out: 'تصغير',
            find_location: 'العثور على موقعي',
            toggle_heatmap: 'تبديل الخريطة الحرارية',
            toggle_language: 'تغيير اللغة',
            add_report_here: 'أبلغ هنا',
            adjust_tilt: 'ضبط الميل',
            degrees: '{count} درجات',
            layers: 'طبقات الخريطة',
            no_layers: 'لا توجد طبقات متاحة',
            geolocation: {
                label: 'الحصول على الموقع الحالي'
            },
            zoom: 'Zoom controls'
        },
        pick: {
            drag_hint: 'اسحب العلامة لضبط الموقع'
        },
        tooltip: {
            label: 'معلومات علامة الخريطة',
            opens_form_above: 'يفتح النموذج أعلاه',
            opens_modal: 'يفتح في نافذة حوار'
        },
        keyboard: {
            canvasInstructions: 'خريطة تفاعلية مع علامات البلاغات. مفاتيح الأسهم للتنقل بين العلامات، Shift+سهم لتحريك الخريطة، Enter للتحديد. اضغط Ctrl+= للتكبير، Ctrl+- للتصغير.',
            noFeatures: 'لا توجد علامات مرئية في العرض الحالي للخريطة. حاول التكبير أو تحريك الخريطة للعثور على علامات.',
            zoomedIntoCluster: 'تم التكبير إلى منطقة المجموعة. استخدم مفاتيح الأسهم للتنقل بين العلامات.',
            clusterFocused: 'مجموعة تحتوي على {count} بلاغ في التركيز. اضغط Enter للتوسيع. {position}',
            clusterExpanded: 'تم توسيع المجموعة إلى {count} بلاغ. {featureLabel}',
            markerFocused: 'بلاغ في التركيز: {name} في {address}{context}. اضغط Enter لفتح التفاصيل. {position}',
            expandedContext: ' (موسع من المجموعة)',
            untitledReport: 'بلاغ بدون عنوان',
            unknownLocation: 'الموقع',
            featurePosition: 'العنصر {current} من {total}.',
            pannedToExplore: 'تم تحريك الخريطة نحو {direction}. حرر Shift واستخدم مفاتيح الأسهم للتنقل بين العلامات.',
            pannedNoMarkers: 'تم تحريك الخريطة نحو {direction}. لم يتم العثور على علامات في هذا الاتجاه. استخدم مفاتيح الأسهم لمواصلة الاستكشاف.'
        }
    },
    detail: {
        location: 'الموقع',
        photos: 'الصور',
        description: 'الوصف',
        status_history: 'سجل الحالة',
        updates: 'التحديثات',
        no_updates: 'لا توجد تحديثات بعد',
        edit: 'تحرير',
        follow: {
            button: 'متابعة',
            following: 'متابَع',
            stop: 'إيقاف المتابعة',
            success: 'أنت الآن تتابع هذا البلاغ',
            error: 'خطأ في متابعة البلاغ',
            updating: 'جاري التحديث...'
        },
        unavailable: {
            title: 'البلاغ غير متاح',
            message: 'هذا البلاغ غير موجود أو لم يُنشر بعد. قد تستغرق البلاغات المُرسلة حديثاً بعض الوقت قبل ظهورها.'
        },
        dialog_description: 'View report details'
    },
    stats: {
        status_overview: 'الحالة',
        pie_chart: 'التوزيع',
        total_reports: 'إجمالي البلاغات',
        status_distribution: 'توزيع الحالة',
        category_distribution: 'توزيع الفئات',
        uncategorized: 'غير مصنف',
        showing_reports: 'عرض {visible} من {total} بلاغ',
        no_reports: 'لا توجد بلاغات متاحة',
        open_reports: 'البلاغات المفتوحة',
        closed_reports: 'البلاغات المغلقة',
        no_data_available: 'لا توجد بيانات متاحة',
        expand: 'عرض التفاصيل',
        collapse: 'إخفاء التفاصيل',
        subcategory: 'فئة فرعية',
        subcategories: 'فئات فرعية'
    },
    time: {
        days_ago: 'منذ {count} أيام',
        just_now: 'الآن',
        minutes_ago: 'منذ {count} دقائق',
        hours_ago: 'منذ {count} ساعات',
        yesterday: 'أمس',
        today: 'اليوم'
    },
    list: {
        showing: 'عرض {visible} من {total} بلاغ',
        showing_in_area: 'عرض {visible} في هذه المنطقة، {total} إجمالا',
        showing_area_only: 'عرض {visible} في هذه المنطقة',
        no_results: 'لم يتم العثور على بلاغات',
        no_filtered_results: 'لا توجد بلاغات تطابق معايير التصفية',
        load_more: 'تم تحميل جميع البلاغات',
        load_more_button: 'تحميل المزيد',
        newest_first: 'الأحدث أولاً',
        oldest_first: 'الأقدم أولاً',
        refresh: 'تحديث',
        status_update: 'تم تحديث الحالة',
        location: 'الموقع',
        unpublished: 'غير منشور',
        editable: 'قابل للتحرير'
    },
    errors: {
        general: 'حدث خطأ ما',
        search_failed: 'فشل البحث. يرجى المحاولة مرة أخرى.',
        api: {
            rate_limit: 'طلبات كثيرة جداً. يرجى الانتظار والمحاولة مرة أخرى.',
            unauthorized: 'غير مصرح. يرجى تسجيل الدخول مرة أخرى.',
            forbidden: 'الوصول مرفوض.',
            not_found: 'المورد غير موجود.',
            server_error: 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
            default: 'خطأ API: {status}'
        },
        upload_failed: 'فشل الرفع',
        location_error: 'تعذر تحديد الموقع',
        network_error: 'خطأ في الشبكة',
        geolocation: {
            title: 'خطأ في الموقع',
            permission_denied: 'تم رفض إذن الموقع. يرجى السماح بالوصول في إعدادات المتصفح.',
            unavailable: 'معلومات الموقع غير متوفرة حاليًا.',
            timeout: 'انتهت مهلة طلب الموقع.',
            unknown: 'حدث خطأ غير معروف في الموقع.'
        },
        try_again: 'حاول مرة أخرى',
        validation: {
            title: 'عذراً، لا يمكننا معالجة هذا الطلب:',
            location_error_title: 'خطأ في الموقع',
            invalid_input: 'إدخال غير صالح',
            duplicate_title: 'تم العثور على تكرار',
            duplicate_found: 'تم العثور على بلاغ مشابه',
            duplicate_report: 'تم بالفعل إنشاء بلاغ مشابه (رقم {reportId})',
            location_out_of_bounds: 'الموقع المحدد خارج نطاق اختصاصنا',
            required_field: '{field} مطلوب',
            required_fields: 'يرجى ملء جميع الحقول المطلوبة',
            please_review: 'يرجى مراجعة النموذج وتصحيح أي أخطاء قبل الإرسال.',
            file_size: 'الملف المحدد كبير جداً (الحد الأقصى 10 ميجابايت)',
            file_type: 'الصيغة غير مدعومة (المسموح: jpg, png, webp)',
            media_upload: 'خطأ في رفع الصورة',
            invalid_format: 'صيغة غير صالحة لـ {field}',
            photo_required: 'الصورة مطلوبة لهذه الفئة',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway',
            consent_required: 'Please accept the privacy policy'
        },
        rate_limit: {
            title: 'تم تجاوز حد الطلبات',
            general: 'يرجى المحاولة لاحقاً.',
            with_time: 'يرجى المحاولة مرة أخرى بعد {seconds} ثانية.'
        },
        network: 'مشكلة في الاتصال. يرجى التحقق من اتصال الإنترنت',
        timeout: 'انتهت المهلة. يرجى المحاولة مرة أخرى',
        upload: {
            invalid_type: 'نوع ملف غير صالح. يرجى رفع الصور فقط.',
            file_too_large: 'الملف كبير جداً. الحد الأقصى {size}.',
            dimensions_too_large: 'أبعاد الصورة كبيرة جداً. الحد الأقصى {width}x{height} بكسل.',
            invalid_image: 'ملف صورة غير صالح أو تالف.',
            failed: 'فشل الرفع. يرجى المحاولة مرة أخرى.',
            limit_reached: 'تم الوصول للحد الأقصى {count} ملفات.',
            remove_to_add: 'أزل صورة لإضافة أخرى',
            single_file_limit: 'يمكن رفع صورة واحدة فقط.',
            exact_file_limit: 'يمكن رفع {count} صور كحد أقصى.',
            title: 'Upload Error',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'خطأ في الإرسال أو رفع الصورة.',
        unknown: 'حدث خطأ غير معروف.',
        pending_uploads: 'يرجى الانتظار حتى اكتمال جميع عمليات الرفع.',
        incomplete_form: 'يرجى ملء جميع الحقول المطلوبة.',
        page: {
            title: 'خطأ',
            not_found_title: 'الصفحة غير موجودة',
            not_found_message: 'عذراً، الصفحة التي تبحث عنها غير موجودة.',
            server_error_title: 'خطأ في الخادم',
            server_error_message: 'عذراً، حدث خطأ في خادمنا.',
            generic_title: 'حدث خطأ',
            generic_message: 'حدث خطأ غير متوقع.',
            action_home: 'العودة للصفحة الرئيسية',
            action_back: 'رجوع',
            action_retry: 'حاول مرة أخرى',
            details: 'تفاصيل الخطأ'
        }
    },
    success: {
        report_submitted: 'تم إرسال البلاغ',
        report_submitted_description: 'تم إرسال بلاغك بنجاح وسيتم مراجعته قريباً.',
        moderation_notice: 'سيتم مراجعة بلاغك قبل النشر. رقمك المرجعي:',
        submit_another: 'إرسال بلاغ آخر',
        auto_followed: 'تمت إضافة هذا البلاغ تلقائياً إلى بلاغاتك المتابعة',
        visibility_limitation_notice: 'يرجى ملاحظة أنه لا تصبح جميع البلاغات مرئية للعامة عبر الموقع. إذا لم يتم تحديث بلاغك في قائمة البلاغات المتابعة، فربما تمت معالجته من قبل المدينة. تحقق من بريدك الإلكتروني للحصول على تحديثات الحالة.',
        fun_facts: [
            'كل بلاغ ترسله يساعد في جعل مدينتك مكاناً أفضل للعيش!',
            'ساعدت بلاغات المواطنين في إصلاح أكثر من 10,000 مشكلة في مدن حول العالم.',
            'تتم مراجعة البلاغ العادي خلال 24 ساعة.',
            'أنت جزء من مجتمع يهتم بالأماكن العامة!',
            'تساعد بيانات بلاغات المواطنين مخططي المدن في اتخاذ قرارات أفضل.',
            'متابعة بلاغاتك تبقيك على اطلاع تلقائياً بالتقدم.',
            'تتم معالجة بلاغات الصور أسرع 3 مرات من البلاغات النصية فقط.',
            'منصات مشاركة المواطنين مثل هذه موجودة في أكثر من 50 دولة.',
            'ملاحظاتك تساعد في تحديد أولويات المشاكل التي يتم إصلاحها أولاً.',
            'قللت الإبلاغات الرقمية أوقات الاستجابة بنسبة تصل إلى 60%.',
            'المواطنون النشطون يصنعون مجتمعات أقوى وأكثر مرونة.',
            'تحليل الذكاء الاصطناعي يساعد في تصنيف بلاغاتك بدقة أكبر.',
            'الإبلاغ عبر الجوال يسهل الإبلاغ عن المشاكل عند رؤيتها.',
            'شكراً لكونك مواطناً مشاركاً!'
        ]
    },
    flag: {
        title: 'الإبلاغ عن هذا البلاغ',
        description: 'ساعدنا في الحفاظ على الجودة بالإبلاغ عن المحتوى غير المناسب.',
        reason_label: 'لماذا تبلغ عن هذا البلاغ؟',
        reason_spam: 'بريد مزعج أو إعلان',
        reason_offensive: 'محتوى مسيء أو غير لائق',
        reason_personal: 'يحتوي على بيانات شخصية',
        reason_location: 'موقع خاطئ',
        reason_other: 'أخرى',
        details_label: 'تفاصيل إضافية',
        details_placeholder: 'يرجى وصف المشكلة...',
        details_required: 'يرجى تقديم التفاصيل',
        submit: 'إرسال',
        success: 'شكراً لك. سنراجع هذا البلاغ.',
        error: 'تعذر الإرسال. يرجى المحاولة مرة أخرى.',
        already_flagged: 'لقد أبلغت عن هذا البلاغ بالفعل.'
    },

    pwa: {
        install: {
            title: 'تثبيت التطبيق',
            button: 'تثبيت',
            not_now: 'ليس الآن',
            description: 'انقر على أيقونة التثبيت في شريط عنوان المتصفح لتثبيت هذا التطبيق.',
            share_button: 'أيقونة المشاركة',
            open_safari: 'متصفح Safari',
            ios: {
                title: 'إضافة إلى الشاشة الرئيسية',
                safari_instructions: 'اضغط على {icon} واختر "إضافة إلى الشاشة الرئيسية".',
                other_instructions: 'يرجى فتح هذا الموقع في {browser} للتثبيت.'
            },
            chrome: {
                instructions: 'انقر على أيقونة التثبيت {icon} في شريط الأدوات لتثبيت هذا التطبيق.'
            },
            edge: {
                instructions: 'انقر على أيقونة التثبيت {icon} في شريط العنوان.'
            },
            firefox: {
                instructions: 'انقر على أيقونة الصفحة الرئيسية {icon} في شريط العنوان.'
            }
        }
    },
    boundaries: {
        loading: 'جاري تحميل بيانات الحدود...',
        error: 'تعذر التحقق من حدود الموقع. يرجى المحاولة لاحقاً.',
        notLoaded: 'لم يتم تحميل الحدود بعد',
        outsideNonStrict: 'ملاحظة: الموقع المحدد خارج حدود {locationName}.',
        outsideStrict: 'الموقع المحدد خارج حدود {locationName}. يرجى اختيار موقع ضمن حدود المدينة.',
        validationUnavailable: 'التحقق من الحدود غير متاح. سيتم قبول بلاغك لكن قد تتم مراجعته.'
    },
    filters: {
        title: 'التصفية',
        status: {
            title: 'الحالة'
        },
        time: {
            title: 'الوقت',
            today: 'اليوم',
            week: 'هذا الأسبوع',
            month: 'هذا الشهر'
        },
        category: {
            title: 'الفئة',
            other: 'أخرى'
        },
        actions: {
            more: 'مزيد من التصفية',
            expand: 'مزيد من التصفية',
            collapse: 'أقل',
            clear_all: 'مسح الكل',
            active_count: '{count} تصفية نشطة',
            toggle: 'التصفية'
        }
    },
    privacy: {
        notice_text: 'يمكن العثور على معلومات الخصوصية',
        notice_link_text: 'هنا',
        modal: {
            title: 'سياسة الخصوصية',
            loading: 'جاري تحميل معلومات الخصوصية...',
            retry: 'حاول مرة أخرى',
            noContent: 'لا توجد معلومات خصوصية متاحة.',
            lastUpdated: 'آخر تحديث',
            close: 'إغلاق'
        }
    },
    search: {
        placeholder: 'البحث في البلاغات...',
        no_results_local: 'لم يتم العثور على نتائج في العرض الحالي',
        expand_to_server: 'البحث في جميع البلاغات',
        expand_hint: 'البحث خارج العرض الحالي',
        searching_server: 'جاري البحث في جميع البلاغات...'
    },
    info: {
        welcome: {
            heading: 'مرحبًا بك في {name}',
            headingGeneric: 'مرحبًا',
            body: 'استخدم هذه الخريطة للإبلاغ عن المشكلات أو الاطلاع على البلاغات الموجودة في منطقتك.'
        },
        shortcuts: {
            aria_label: 'إجراءات سريعة',
            photo: {
                title: 'صورة',
                description: 'التقط صورة، الذكاء الاصطناعي يتولى الباقي',
                aria_label: 'إنشاء بلاغ بصورة'
            },
            classic: {
                title: 'كلاسيكي',
                description: 'صِف المشكلة وحدد موقعها',
                aria_label: 'إنشاء بلاغ كلاسيكي'
            },
            following: {
                title: 'متابعة',
                description: 'ابقَ على اطلاع بالتقدم',
                aria_label: 'فتح البلاغات المتابعة'
            },
            list: {
                title: 'استكشاف',
                description: 'شاهد ما يحدث في منطقتك',
                aria_label: 'استكشاف الخريطة وعرض القائمة'
            }
        }
    },
    auth: {
        login: {
            title: 'تسجيل الدخول',
            subtitle: 'أدخل بريدك الإلكتروني لتلقي رمز التحقق',
            email_label: 'عنوان البريد الإلكتروني',
            email_hint: 'سنرسل لك رمزاً مكوناً من 6 أرقام',
            email_placeholder: 'عنوان البريد الإلكتروني',
            send_code: 'إرسال رمز التحقق',
            disabled: {
                title: 'تسجيل الدخول غير متاح',
                message: 'تسجيل الدخول بدون كلمة مرور غير مفعّل هنا. يرجى التواصل مع المسؤول إذا كنت بحاجة إلى وصول.',
                back_button: 'العودة إلى الرئيسية'
            }
        },
        verify: {
            email_label: 'عنوان البريد الإلكتروني',
            code_label: 'رمز التحقق',
            code_hint: 'أدخل الرمز المكون من 6 أرقام من بريدك الإلكتروني',
            code_placeholder: '123456',
            verify_button: 'التحقق وتسجيل الدخول',
            back_button: 'استخدام بريد إلكتروني مختلف',
            request_new: 'طلب رمز جديد',
            resend_code: 'إعادة إرسال الرمز',
            expires_in: 'ينتهي الرمز خلال {time}',
            expired_title: 'انتهت صلاحية الرمز',
            expired_message: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.'
        },
        code_sent: {
            title: 'تم إرسال الرمز',
            message: 'أرسلنا رمز تحقق مكوناً من 6 أرقام إلى {email}'
        },
        error: {
            title: 'خطأ في المصادقة',
            request_failed: 'فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى.',
            verify_failed: 'رمز تحقق غير صالح أو منتهي الصلاحية',
            sso_failed: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
            network: 'خطأ في الشبكة. يرجى التحقق من الاتصال.',
            logout_failed: 'فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.'
        },
        sso: {
            completing: 'جار إكمال تسجيل الدخول...',
            method_label: 'تسجيل الدخول الموحد',
            button_aria: 'تسجيل الدخول باستخدام {provider} عبر تسجيل الدخول الموحد'
        },
        user: {
            logged_in_as: 'تم تسجيل الدخول كـ',
            logout: 'تسجيل الخروج'
        },
        welcome: {
            greeting: 'مرحباً، {name}',
            sign_in: 'تسجيل الدخول',
            sign_out: 'تسجيل الخروج',
            user_avatar: 'User avatar'
        }
    },
    profile: {
        title: 'الملف الشخصي',
        account: {
            title: 'الحساب',
            roles: 'الأدوار'
        },
        groups: {
            title: 'المجموعات'
        },
        appearance: {
            title: 'المظهر',
            color_mode: 'وضع الألوان',
            light: 'فاتح',
            dark: 'داكن',
            system: 'النظام',
            theme_override: 'ألوان مخصصة للمظهر',
            theme_override_description: 'استبدل مظهر الاختصاص الافتراضي بتفضيلات الألوان الخاصة بك',
            primary_color: 'اللون الأساسي',
            secondary_color: 'اللون الثانوي',
            neutral_color: 'اللون المحايد',
            reset_theme: 'إعادة التعيين للافتراضي'
        },
        language: {
            title: 'اللغة',
            select: 'اختر اللغة',
            save_failed: 'تعذّر حفظ تفضيل اللغة. يرجى المحاولة مرة أخرى.'
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
            title: 'الصفحة غير موجودة',
            description: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
        },
        403: {
            title: 'الوصول مرفوض',
            description: 'ليس لديك صلاحية لعرض هذه الصفحة.'
        },
        500: {
            title: 'حدث خطأ ما',
            description: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
        },
        fallback: {
            title: 'خطأ',
            description: 'حدث خطأ غير متوقع.'
        },
        actions: {
            back: 'رجوع',
            home: 'العودة للرئيسية',
            retry: 'حاول مرة أخرى'
        }
    },
    legal: {
        impressum: {
            title: 'إشعار قانوني',
            heading: 'إشعار قانوني',
            responsible_heading: 'المسؤول عن المحتوى',
            responsible_text: '{name} مسؤول عن محتوى هذه المنصة.'
        },
        privacy: {
            title: 'سياسة الخصوصية',
            heading: 'سياسة الخصوصية',
            intro: 'حماية بياناتك الشخصية مهمة بالنسبة لنا. نحن نعالج بياناتك حصريًا على أساس الأحكام القانونية (GDPR).',
            controller_heading: 'مسؤول البيانات',
            data_heading: 'البيانات المجمعة',
            data_text: 'عند استخدام هذه المنصة، تتم معالجة البيانات التالية: بيانات موقع البلاغ، نص الوصف، الصور المرفوعة، وبيانات الوصول التقنية (عنوان IP، نوع المتصفح، وقت الوصول).',
            rights_heading: 'حقوقك',
            rights_text: 'لديك الحق في الوصول والتصحيح والحذف وتقييد المعالجة ونقل البيانات والاعتراض.'
        },
        terms: {
            title: 'شروط الاستخدام',
            heading: 'شروط الاستخدام',
            intro: 'باستخدام هذه المنصة، فإنك توافق على الشروط التالية.',
            purpose_heading: 'الغرض',
            purpose_text: 'تخدم هذه المنصة للإبلاغ عن المشكلات في الأماكن العامة. يتم إرسال البلاغات إلى الجهة المسؤولة.',
            obligations_heading: 'التزامات المستخدم',
            obligations_text: 'أنت توافق على تقديم معلومات صحيحة فقط وعدم رفع محتوى غير قانوني. يجب ألا تُظهر الصور المرفوعة أشخاصًا يمكن التعرف عليهم دون موافقتهم.',
            liability_heading: 'المسؤولية',
            liability_text: '{name} لا يتحمل أي مسؤولية عن اكتمال ودقة المعلومات المقدمة.'
        },
        email_label: 'البريد الإلكتروني',
        contact_label: 'الاتصال',
        platform: {
            heading: 'مشغل المنصة',
            intro: 'يتم تشغيل هذه المنصة تقنياً بواسطة:',
            description: 'توفر Civic Patches GmbH البنية التحتية التقنية لمنصة Mark-a-Spot.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, ألمانيا',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'مشغل هذه الخريطة',
            not_configured: 'لم يقدم مشغل هذه الخريطة معلوماته القانونية بعد. قد يكون مشغلو الخدمات عبر الإنترنت المتاحة للجمهور ملزمين بتقديم بصمة قانونية وسياسة خصوصية.'
        },
        footer: {
            impressum: 'إشعار قانوني',
            privacy: 'الخصوصية',
            terms: 'شروط الاستخدام'
        },
        not_configured: 'لم يتم تكوين بيانات المشغل بعد.'
    },
    demo_mode: {
        banner: {
            title: 'بيئة تجريبية',
            message: 'لا تُحال البلاغات من هنا إلى أي جهة مختصة.',
            link_label: 'زيارة mark-a-spot.com',
            minimize_label: 'تصغير التنبيه التجريبي',
            expand_label: 'توسيع التنبيه التجريبي'
        },
        reset: {
            title: 'قاعدة بيانات العرض التوضيحي',
            notice: 'تتم إعادة ضبط نظام العرض التوضيحي كل ساعة.',
            countdown_label: 'إعادة الضبط التالية خلال',
            countdown_aria: 'إعادة ضبط قاعدة بيانات العرض التوضيحي التالية خلال {time}'
        },
        modal: {
            title: 'إرسال تجريبي',
            body: 'هذا نظام تجريبي. لن يتم إحالة بلاغك إلى البلدية. هل تريد الاستمرار في الإرسال التجريبي؟',
            confirm_label: 'إرسال البلاغ التجريبي',
            cancel_label: 'إلغاء'
        },
        lite: {
            title: 'تجريبي فقط',
            heading: 'بيئة تجريبية',
            body: 'هذا عرض توضيحي لنظام Mark-a-Spot. الإرسال عبر النموذج المبسط معطل هنا حتى لا تصل البلاغات الحقيقية عن طريق الخطأ إلى أي بلدية.',
            link_label: 'زيارة mark-a-spot.com'
        }
    },
    print: {
        title: 'تقرير طلب الخدمة',
        description: 'الوصف',
        location: 'الموقع',
        media: 'الوسائط',
        image_unavailable: 'Image unavailable',
        attributes: 'حقول إضافية',
        status_history: 'سجل الحالة',
        internal_fields: 'معلومات داخلية',
        organisation: 'القسم',
        hazard_level: 'مستوى الخطر',
        hazard_category: 'فئة الخطر',
        sentiment: 'المشاعر',
        printed_at: 'طُبع في',
        showing_recent: 'عرض {count} من أصل {total} تحديث'
    }
};
