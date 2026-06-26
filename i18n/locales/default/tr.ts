// locales/tr.ts
export default {
    locale: {
        code: 'tr-TR'
    },
    meta: {
        description: 'Mark-a-Spot Frontend'
    },
    nav: {
        map: 'Harita',
        dashboard: 'Yönetim Paneli',
        back_to_frontend: 'Haritaya dön'
    },
    dashboard: {
        title: 'Yönetim Paneli',
        welcome: 'Hoş geldiniz, {name}',
        nav: {
            dashboard: 'Yönetim Paneli',
            requests: 'Raporlar',
            settings: 'Ayarlar',
            categories: 'Kategoriler',
            jurisdictions: 'Yetki Alanları',
            metrics: 'Metrics',
            status: 'Status',
            languages: 'Diller',
            billing: 'Faturalama'
        },
        help: {
            docs: 'Belgeler',
            support: 'Destek ile iletişime geç'
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
            logout: 'Çıkış'
        },
        stats: {
            total: 'Toplam Rapor',
            pending: 'Beklemede',
            in_progress: 'İşlemde',
            resolved: 'Çözüldü',
            my_groups: 'Gruplarım',
            overall: 'Genel'
        },
        recent_requests: 'Son Raporlar',
        view_all: 'Tümünü Gör',
        no_recent: 'Son rapor yok',
        wms: {
            title: 'Harita Katmanları',
            attribution: 'Veri: GDI Stadt Bonn'
        },
        requests: {
            columns: {
                id: 'ID',
                media: 'Medya',
                category: 'Kategori',
                status: 'Durum',
                created: 'Oluşturulma'
            }
        },
        jurisdiction: {
            current: 'Workspace',
            citizenView: 'Citizen View',
            switchTo: 'Switch to',
            blocked: 'engellendi',
            admin_section_header: 'Tüm çalışma alanları (yönetici erişimi)'
        }
    },
    form: {
        body: 'Açıklama',
        body_description: 'Lütfen detaylı bir açıklama girin',
        body_placeholder: 'Açıklama girin...',
        category: 'Kategori',
        category_description: 'Bildiriminiz için uygun kategoriyi seçin',
        category_placeholder: 'Bir kategori seçin',
        category_disabled: {
            title: 'Kategori Seçildi',
            description: '"{category}" kategorisini seçtiniz. Bu kategorinin özel gereksinimleri vardır veya formun daha fazla düzenlenmesine izin vermez.'
        },
        category_empty: 'Kullanılabilir kategori yok',
        category_loading: 'Kategoriler yükleniyor...',
        category_disabled_notice: 'Bu kategori yalnızca bilgi amaçlıdır. Gönderi yapılamaz.',
        category_description_loading: 'Açıklama yükleniyor...',
        category_description_error: 'Açıklama yüklenirken hata oluştu',
        email: 'E-posta',
        email_description: 'İletişim e-postanız',
        email_placeholder: 'E-posta adresinizi girin',
        first_name: 'Adı',
        first_name_description: 'Adınız',
        first_name_placeholder: 'Adınızı girin',
        last_name: 'Soyadı',
        last_name_description: 'Soyadınız',
        last_name_placeholder: 'Soyadınızı girin',
        gdpr: 'Veri Koruma Onayı',
        gdpr_description: 'Verilerimin gizlilik politikasında belirtildiği şekilde işlenmesini kabul ediyorum.',
        object_id: 'Nesne Kimliği',
        object_id_description: 'Bildirilen nesne için tanımlayıcı',
        object_id_placeholder: 'Nesne kimliğini girin (örn. direk numarası)',
        phone: 'Telefon Numarası',
        phone_description: 'İletişim telefon numaranız',
        phone_placeholder: 'Telefon numaranızı girin',

        // Tesise dayalı bildirimler
        facility: 'Tesis',
        facility_plural: 'Tesisler',
        facility_placeholder: '{label} seçin',
        facility_required: '{label} gereklidir.',
        facility_unavailable: 'Seçilen tesis artık mevcut değil, lütfen tekrar seçin.',
        facility_nearest_snapped: 'En yakın tesis: {label}',
        facility_no_nearby: 'Yakında tesis yok, lütfen manuel olarak seçin.',
        facility_use_my_location: 'Konumumu kullan',
        facility_locating: 'Konum belirleniyor…',
        facility_no_match: 'Aramanızla eşleşen tesis bulunamadı.',
        facility_opens_in_new_tab: '(yeni sekmede açılır)',
        facility_deselected_map_pick: 'Kendi konumunuz {label} yerine kullanılıyor',
        facility_tagged_with: 'Konum: {label}',

        imagelist: {
            empty: 'Bu tür için kullanılabilir görsel yok.'
        },
        requirements: {
            title: 'Hala gerekli',
            ready_to_submit: 'Göndermeye hazır',
            photo: 'Fotoğraf yükle',
            category: 'Kategori seç',
            location: 'Konum belirt',
            description: 'Açıklama gir',
            email: 'E-posta adresi belirt',
            privacy: 'Gizlilik politikasını kabul et',
            privacyBlock: 'Gizlilik açısından hassas fotoğrafı değiştir veya kaldır',
            conditional: 'kategoriye bağlı'
        },
        back_to_report: 'Back to report form',
        body_ai_description: 'Auto-generated from your photo. You can edit the text.',
        body_ai_placeholder: 'Generating text from photo...'
    },
    validation: {
        body_required: 'Açıklama gereklidir',
        category_required: 'Kategori gereklidir',
        email_required: 'E-posta gereklidir',
        email_format: 'Geçersiz e-posta formatı',
        first_name_required: 'Adı gereklidir',
        last_name_required: 'Soyadı gereklidir',
        gdpr_required: 'Veri koruma şartlarını kabul etmelisiniz',
        object_id_required: 'Nesne kimliği gereklidir',
        phone_required: 'Telefon numarası gereklidir',
        required_field: '{field} gereklidir'
    },
    feedback: {
        page_title: 'Servis Talebi Geri Bildirimi',
        error_title: 'Yükleme Hatası',
        invalid_request: 'Geçersiz veya süresi dolmuş servis talebi',
        thank_you: 'Geri bildiriminiz için teşekkür ederiz!',
        submission_received: 'Geri bildiriminiz başarıyla alındı',
        loading: 'Servis talebi yükleniyor...',
        title: 'Geri Bildirim: {service}',
        description: 'Lütfen geri bildiriminizi sağlayın',
        placeholder: 'Geri bildiriminizi buraya girin...',
        reopen_request: 'Bu servis talebinin yeniden açılmasını istiyorum',
        submitting: 'Gönderiliyor...',
        submit: 'Geri Bildirimi Gönder',
        existing_title: 'Geri bildiriminiz: {service}',
        already_submitted: 'Bu servis talebi için zaten geri bildirim gönderdiniz',
        missing_uuid: 'Eksik servis ID\'si',
        success_notification: 'Geri bildirim başarıyla gönderildi',
        success_with_id: '#{id} numaralı talep için geri bildirim başarıyla gönderildi',
        updated_successfully: 'Geri bildirim başarıyla güncellendi',
        added_to_list: 'Servis talebi listenize eklendi',
        submission_error: 'Geri bildirim gönderilemedi',
        server_error: 'Sunucu hatası: Geri bildirim şu anda işlenemiyor',
        submission_failed: 'Geri bildirim gönderilemedi. Lütfen daha sonra tekrar deneyin',
        already_exists: 'Bu servis talebi için zaten geri bildirim mevcut',
        error_fetching_request: 'Servis talebi detayları yüklenirken hata oluştu',
        no_content: 'Geri bildirim içeriği yok',
        refresh_complete: 'Talep listesi yenilendi',
        try_again: 'Tekrar deneyin',
        format_unrecognized: 'Servis talebi formatı tanınmıyor',
        processing_error: 'Servis talebi verilerini işlerken hata oluştu',
        your_feedback: 'Geri Bildiriminiz',
        contact_preference: 'İletişim Tercihi',
        no_contact: 'İletişim Yok',
        email_contact: 'E-posta ile İletişim',
        email_placeholder: 'E-posta adresiniz',
        set_status_open: 'Durumu açık olarak ayarla',
        set_status_open_description: 'Bu konuyla tekrar ilgilenmemizi istiyorsanız, bu servis talebini yeniden açabilirsiniz.',
        email_verification: 'E-posta Doğrulama',
        email_verification_placeholder: 'Orijinal rapordan e-posta adresi',
        email_verification_description: 'Orijinal raporu oluştururken kullandığınız e-posta adresini girin.',
        email_mismatch: 'Girilen e-posta adresi orijinal raporla eşleşmiyor.',
        unauthorized_access: 'Yetkisiz erişim. Lütfen e-posta adresinizi kontrol edin.',
        service_provider: {
            title: 'Görev Tamamlama',
            your_email: 'E-posta Adresiniz',
            email_placeholder: 'E-posta adresinizi girin',
            email_verification_note: 'Lütfen kayıtlı e-posta adresinizi girin',
            completion_notes: 'Tamamlama Notları',
            notes_placeholder: 'Gerçekleştirilen işi burada açıklayın...',
            mark_as_completed: 'Tamamlandı olarak işaretle',
            mark_completed_description: 'Talebi tamamlandı olarak işaretle',
            completion_success: 'Görev başarıyla tamamlandı!',
            complete_request: 'Görevi Tamamla',
            page_title: 'Service Provider Response',
            page_description: 'Submit completion notes for assigned service requests',
            modal_title: 'Service Provider Response',
            dialog_description: 'Service provider response form dialog',
            mark_as_completed_description: 'Set the request status to completed',
            submit_completion: 'Submit Completion',
            completing: 'Submitting...',
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
        sending: 'Sending...',
        not_eligible: 'This service request is not currently eligible for feedback',
        dialog_description: 'Feedback form dialog'
    },
    service_unavailable: {
        title: 'Servis Geçici Olarak Kullanılamıyor',
        message: 'Şu anda servislerimize bağlanılamıyor. Bu sorun muhtemelen geçicidir.',
        retry: 'Şu anda teknik zorluklar yaşıyoruz. Lütfen {seconds} saniye içinde tekrar deneyin.',
        auto_retry: '{seconds} saniye içinde tekrar deneniyor...',
        retry_now: 'Şimdi Dene',
        try_later: 'Please try again later.',
        reload: 'Reload'
    },
    header: {
        logo_alt: 'Logo',
        app_name: 'Şehir Hizmet Portalı',
        app_claim: 'Raporunuz. Çözümümüz.'
    },
    hiddenSection: {
        description: 'Sorun bildiricimiz, altyapı sorunları için bir bildirim sistemidir. Sorun bildirmeye doğrudan devam edebilir veya aşağıdakilere gidebilirsiniz:',
        main_navigation: 'Bilgiler, bildirim listesi ve istatistiklerin bulunduğu ana gezinme',
        map: 'Görsel işaretleyicilere sahip etkileşimli harita',
        map_navigation_hint: 'Rapor işaretleyicileri arasında gezinmek için ⬆️⬇️⬅️➡️ ok tuşlarını, seçmek için ↩️ Enter, seçimi temizlemek için ❌ Escape tuşunu kullanın',
        action_button: 'Doğrudan bildir',
        keyboard_navigation_hint: 'Gezinmek için ↑↓ ok tuşlarını, etkinleştirmek için Enter tuşunu kullanın',
        skip_to_main_content: 'Ana içeriğe atla'
    },
    accessibility: {
        skip_to_main: 'Ana içeriğe atla',
        skip_to_map: 'Haritaya atla',
        skip_to_navigation: 'Navigasyona atla',
        skip_to_form: 'Doğrudan bildir',
        leichte_sprache_indicator: 'Easy Language - Simple texts for everyone'
    },
    common: {
        back: 'Geri',
        not_classified: 'Sınıflandırılmamış',
        no_value: 'Değer yok',
        close: 'Kapat',
        loading: 'Yükleniyor...',
        error: 'Hata',
        success: 'Başarılı',
        submit: 'Gönder',
        cancel: 'İptal',
        required: 'Gerekli',
        save: 'Kaydet',
        delete: 'Sil',
        edit: 'Düzenle',
        clear: 'Temizle',
        search: 'Ara',
        select: 'Seç',
        on: 'Açık',
        off: 'Kapalı',
        toggle: 'Değiştir',
        yesterday: 'Dün',
        title: {
            classic: 'Klasik Rapor',
            photo: 'Fotoğraf Raporu'
        },
        buttons: {
            toggle_theme: 'Tema Değiştir',
            attribution: 'Harita atıfı',
            close: 'Kapat'
        },
        navigation: 'Navigasyon çekmecesi',
        drawer_description: 'İçerik ve seçenek paneli',
        resize_drawer: 'Paneli yeniden boyutlandır',
        drawer_position_n_of_total: '{idx}. konum, toplam {total}',
        did_you_know: 'Did you know?',
        show_more: 'Show more',
        show_less: 'Daha az göster',
        learn_more: 'Daha fazla bilgi',
        learn_more_about: '{topic} hakkında daha fazla bilgi',
        opens_in_new_tab: '(yeni sekmede açılır)',
        current: 'Current',
        share: 'Share',
        copy_coordinates: 'Copy coordinates',
        open_in_maps: 'Open in Maps'
    },
    fields: {
        field_geolocation: 'Konum',
        field_gdpr: 'Veri İşleme Onayı',
        field_e_mail: 'E-posta',
        field_category: 'Kategori',
        field_request_media: 'Fotoğraflar',
        field_name: 'Soyadı',
        field_prename: 'Adı',
        field_first_name: 'Adı',
        field_last_name: 'Soyadı',
        field_first_name_placeholder: 'Adınızı girin',
        field_last_name_placeholder: 'Soyadınızı girin',
        field_phone: 'Telefon',
        body: 'Açıklama',
        field_add_data: 'Çekilişe Katılım',
        field_terms_of_use: 'Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.',
        field_address: 'Adres',
        postal_code: 'Posta kodu',
        postal_code_placeholder: 'örn. 34000',
        city: 'Şehir',
        city_placeholder: 'örn. İstanbul',
        street_address: 'Sokak adresi',
        street_address_placeholder: 'örn. Ana Cadde 123'
    },
    competition: {
        intro: 'İsterseniz, yıllık çekilişimize katılın. Tüm katılımcılar arasında küçük bir teşekkür olarak dağıttığımız cazip ödüller ve nakit ödüller kazanma şansınız var.',
        disclaimer: 'Sorumlu departmanların çalışanları katılımdan hariçtir.',
        title: 'Yarışma Katılımı',
        errors: {
            already_exists: 'Yarışma girişi zaten mevcut',
            duplicate_found: 'Kopya bulundu',
            duplicate_detail: 'Bu rapor için zaten bir yarışma girişi oluşturulmuş.',
            not_found: 'Rapor bulunamadı',
            not_found_detail: 'İlişkili rapor bulunamadı.',
            save_failed: 'Yarışma girişi kaydedilemedi',
            submission_error: 'Gönderim hatası',
            submission_error_detail: 'Yarışma girişiniz kaydedilemedi, ancak raporunuz başarıyla gönderildi.'
        }
    },
    navigation: {
        tabs: {
            info: {
                label: 'Bilgi',
                aria_label: 'Bilgi sekmesi',
                panel_label: 'Bilgi paneli'
            },
            list: {
                label: 'Liste',
                aria_label: 'Rapor listesi sekmesi',
                panel_label: 'Rapor listesi paneli'
            },
            following: {
                label: 'Takip',
                aria_label: 'Takip edilen raporlar sekmesi',
                panel_label: 'Takip edilen raporlar paneli'
            },
            stats: {
                label: 'İstatistikler',
                aria_label: 'İstatistikler sekmesi',
                panel_label: 'İstatistikler paneli'
            }
        },
        updates_count: '{count} yeni güncelleme',
        main: 'Main navigation',
        pages: 'Page navigation',
        browse_reports: 'Browse Reports',
        back_to_form: 'Back to Form',
        panel: {
            scrollable: 'Scrollable area'
        }
    },
    report: {
        form_types: 'Rapor türleri',
        how_to_help: 'Rapor nasıl oluşturulur',
        title: {
            photo: 'Foto Raporu',
            classic: 'Klasik Rapor',
            submit: 'Rapor Gönder',
            edit: 'Raporu Düzenle',
            view: 'Raporu Görüntüle'
        },
        status: {
            new: 'Yeni',
            open: 'Açık',
            in_progress: 'Devam Ediyor',
            resolved: 'Çözüldü',
            closed: 'Kapalı',
            unknown: 'Bilinmeyen Durum'
        },
        form: {
            description: {
                label: 'Açıklama',
                placeholder: 'Sorunu lütfen açıklayın...',
                ai_processing: 'Yapay zeka açıklama oluşturuyor...',
                help: 'Olabildiğince çok ayrıntı sağlayın'
            },
            category: {
                label: 'Kategori',
                placeholder: 'Bir kategori seçin',
                loading: 'Kategoriler yükleniyor...',
                error: 'Kategoriler yüklenirken hata oluştu',
                empty: 'Kullanılabilir kategori yok',
                help: 'En uygun kategoriyi seçin',
                description: 'Kategori Açıklaması',
                description_loading: 'Açıklama yükleniyor...',
                description_error: 'Açıklama yüklenirken hata oluştu',
                disabled_notice: 'Bu kategori yalnızca bilgi amaçlıdır. Başvuru yapılamaz.'
            },
            location: {
                label: 'Konum',
                placeholder: 'Sokak adı ve kapı numarası girin...',
                selected: 'Konum seçildi',
                clear: 'Konumu temizle',
                error: 'Konum alınırken hata oluştu',
                help: 'İpucu: Kesin sonuçlar için sokak adı ve kapı numarası girin',
                help_modal: 'Bir adres girin veya mevcut konumunuzu kullanın',
                current: 'Mevcut konumu kullan',
                searching: 'Aranıyor...',
                pick_on_map: 'Pick on map',
                auto_detected: 'Location detected',
                complete_address: 'Tam adres',
                from_photo_exif: 'Konum fotoğraf meta verilerinden otomatik olarak çıkarıldı',
                warning: 'Konum uyarısı',
                unknown_location: 'Bilinmeyen konum',
                suggestions: 'Konum önerileri'
            },
            email: {
                label: 'Güncellemeler için E-posta',
                placeholder: 'E-posta adresinizi girin',
                help: 'Raporunuz hakkında güncellemeler göndereceğiz',
                subscribe: 'Güncellemeleri abone ol'
            },
            gdpr: {
                label: 'Veri İşleme Onayı',
                description: 'Veri gizliliği politikasına uygun olarak verilerimin işlenmesini kabul ediyorum.',
                required: 'Devam etmek için kabul etmelisiniz',
                link: 'Gizlilik Politikasını Görüntüle'
            },
            media: {
                label: 'Fotoğraflar',
                required: 'Bu kategori için fotoğraf gereklidir',
                upload: {
                    overall_progress: 'Genel İlerleme',
                    button: 'Yüklemek için tıklayın',
                    or: ' veya',
                    drag: 'sürükleyip bırakın',
                    restrictions: '{count} resime kadar ({size} maks., {types})',
                    restrictions_single: 'Bir resim ({size} maks., {types})',
                    drop_here: 'Drop files here to upload',
                    progress: 'Upload progress',
                    started_sr: 'Upload started',
                    progress_sr: 'Upload {progress}% complete',
                    success_sr: 'Upload completed successfully',
                    error_sr: 'Upload failed: {error}',
                    files_selected_sr: '{count} file(s) selected for upload',
                    area_label: 'Upload photo area - click to select files or drag and drop',
                    in_progress: 'Upload in progress',
                    complete_sr: 'File has been uploaded successfully.',
                    description: 'Upload images by clicking, tapping, or dragging files here. Supported formats: JPEG, PNG, GIF.'
                },
                preview: 'Resim önizlemesi',
                remove: 'Resmi kaldır',
                no_image_available: 'Resim mevcut değil veya yasal nedenlerle gösterilmiyor',
                progress: 'Yükleme ilerlemesi: {progress}%',
                limit_reached: 'Maksimum {count} resim sayısına ulaşıldı',
                privacy_notice: 'Lütfen kişi/plaka fotoğrafı çekmeyin',
                ai_analysis: 'Azure AI (Almanya) ile analiz',
                ai_analysis_tooltip: 'Yükleyerek fotoğrafın yasal olarak çekildiğini ve üçüncü taraf haklarını ihlal etmediğini onaylıyorsunuz. Kişiler veya plakalar tanınabilirse, lütfen yüklemeden önce tanınmaz hale getirin. Analiz yalnızca raporunuzu kategorize etmeye yarar. Azure OpenAI (Almanya) üzerine yalnızca küçültülmüş, EXIF-siz kopya gönderilir; orijinal servise gönderilmez.',
                offline_cached: 'Saved offline',
                ai_analysis_help: 'Information about AI analysis'
            },
            submit: {
                button: 'Rapor Gönder',
                submitting: 'Gönderiliyor...',
                processing: 'İşleniyor...',
                success: 'Rapor başarıyla gönderildi',
                error: 'Rapor gönderilirken hata oluştu',
                loading: 'Loading form...'
            },
            loading: 'Form yükleniyor...',
            draft_saved: 'Taslak kaydedildi',
            tabs: {
                photo: 'With Photo',
                classic: 'Classic'
            },
            modal_description: 'Create a new report'
        },
        ai: {
            label: 'Yapay Zeka',
            powered: 'Yapay Zeka Destekli',
            analyzing: 'Yapay zeka fotoğraflarınızı analiz ediyor...',
            processing: {
                analyzing: 'Yapay zekaya soruluyor...',
                location: 'Görüntü meta verileri kontrol ediliyor...',
                location_found: 'Konum bulundu:',
                location_ai: 'Görüntüde konum aranıyor...',
                location_complete: 'Konum belirlendi',
                category: 'Kategori tanımlanıyor...',
                category_found: 'Kategori tanımlandı:',
                description: 'Açıklama oluşturuluyor...',
                description_complete: 'Açıklama oluşturuldu',
                attributes_filled: '{count} ek alan otomatik dolduruldu',
                complete: 'Yapay zeka analizi tamamlandı',
                error: 'Yapay zeka analizinde hata oluştu',
                privacy_warning: 'Gizlilik sorunu tespit edildi',
                location_not_found: 'Location not found in image metadata.',
                category_not_matched: 'Category suggested by AI (needs selection)'
            },
            privacy: {
                title: 'Gizlilik bildirimi',
                description: 'Fotoğrafınızda kişisel veriler tespit edilmiş olabilir ({issues}). Fotoğraf yayınlanmadan önce incelenecektir.',
                required: 'Bu fotoğrafta gizlilik açısından kritik içerik tespit edildi ve otomatik bulanıklaştırma mevcut değil. Fotoğraf kullanılamaz. Devam etmek için değiştirin veya kaldırın.',
                removePhoto: 'Fotoğrafı kaldır',
                replace: 'Fotoğrafı değiştir',
                understood: 'Bu fotoğrafla devam et'
            },
            failed: {
                title: 'Görüntü analizi kullanılamıyor',
                description: 'Fotoğrafınız yayınlanmadan önce manuel olarak incelenecektir. Raporunuzu yine de gönderebilirsiniz.'
            },
            started_sr: 'AI analysis started',
            complete_sr: 'AI analysis completed successfully',
            field_updated_sr: '{field} has been updated with: {value}',
            analysis_complete_sr: 'AI analysis complete.',
            category_result_sr: 'Category selected: {category}.',
            description_result_sr: 'Description generated: {description}',
            location_result_sr: 'Location found: {location}.',
            category_hint: 'Bu fotoğraf raporlama kategorilerimizle eşleşmiyor gibi görünüyor. Lütfen kendiniz bir kategori seçin.',
            budget_exhausted_title: 'Yapay zeka analizi atlandı',
            budget_exhausted_submitted: 'Bu ay için yapay zeka analiz bütçesi tükendi. Raporunuz başarıyla gönderildi.'
        },
        buttons: {
            photo: 'Foto Raporu',
            classic: 'Klasik Rapor',
            follow: 'Raporu Takip Et',
            following: 'Takip Ediyor',
            share: 'Raporu Paylaş',
            print: 'Yazdır',
            flag: 'Bildir',
            flag_submitted: 'Zaten bildirildi',
            copy_link: 'Bağlantıyı kopyala',
            link_copied: 'Bağlantı panoya kopyalandı',
            email: 'E-posta',
            directions: 'Yol Tarifi Al'
        },
        following: {
            count: '{count} raporu takip ediyorsunuz',
            mark_all_read: 'Tümünü okundu olarak işaretle',
            no_reports: 'Henüz takip edilen rapor yok',
            no_address: 'Adres mevcut değil',
            status_updated: 'Durum güncellendi',
            status_changed: 'Durum değişti:',
            awaiting_server: 'Güncelleme bekleniyor',
            escalated_to: '{jurisdiction} birimine yönlendirildi',
            escalated_click: 'Yeni yetki alanında açmak için dokunun',
            unavailable: 'Bu rapor şu anda mevcut değil. Lütfen e-postanızı kontrol edin veya bize ulaşın.',
            date: {
                today: 'Bugün',
                tomorrow: 'Yarın',
                yesterday: 'Dün',
                unknown: 'Unknown date'
            }
        },
        photo: {
            description: 'Create a new report with a photo'
        },
        classic: {
            description: 'Create a new report without a photo'
        }
    },
    map: {
        loading: 'Harita yükleniyor...',
        controls: {
            zoom_in: 'Yakınlaştır',
            zoom_out: 'Uzaklaştır',
            find_location: 'Konumumu Bul',
            toggle_heatmap: 'Isı Haritasını Aç/Kapa',
            toggle_language: 'Dili Değiştir',
            adjust_tilt: 'Eğim Ayarla',
            degrees: '{count} derece',
            add_report_here: 'Buraya rapor ekle',
            layers: 'Harita katmanları',
            no_layers: 'Kullanılabilir katman yok',
            geolocation: {
                label: 'Mevcut konumu al'
            },
            zoom: 'Zoom controls'
        },
        tap_to_load: 'Tap to show map',
        tap_to_select_location: 'Tap on map to select location',
        loading_address: 'Loading address...',
        retry_attempt: 'Attempt {count}',
        confirm_location: 'Confirm location',
        add_report_here: 'Add report here',
        pick: {
            drag_hint: 'Drag marker to adjust position'
        },
        tooltip: {
            label: 'Harita işaretçisi bilgisi',
            opens_form_above: 'Formu üstte açar',
            opens_modal: 'İletişim kutusunda açılır'
        },
        keyboard: {
            canvasInstructions: 'Rapor işaretçili interaktif harita. Ok tuşları işaretçiler arasında gezinir, Shift+ok tuşu haritayı kaydırır, Enter seçer. Yakınlaştırmak için Ctrl+=, uzaklaştırmak için Ctrl+- tuşlarına basın.',
            noFeatures: 'Mevcut harita görünümünde görünür işaretçi yok. İşaretçileri bulmak için yakınlaştırmayı veya kaydırmayı deneyin.',
            zoomedIntoCluster: 'Küme alanına yakınlaştırıldı. İşaretçiler arasında gezinmek için ok tuşlarını kullanın.',
            clusterFocused: '{count} raporlu küme odakta. Genişletmek için Enter tuşuna basın. {position}',
            clusterExpanded: 'Küme {count} rapora genişledi. {featureLabel}',
            markerFocused: 'Rapor odakta: {address} adresinde {name}{context}. Ayrıntıları açmak için Enter tuşuna basın. {position}',
            expandedContext: ' (kümeden genişletildi)',
            untitledReport: 'Başlıksız rapor',
            unknownLocation: 'konum',
            featurePosition: '{total} öğeden {current}. öğe.',
            pannedToExplore: 'Harita {direction} yönüne kaydırıldı. Shift tuşunu bırakın ve işaretçilerde gezinmek için ok tuşlarını kullanın.',
            pannedNoMarkers: 'Harita {direction} yönüne kaydırıldı. Bu yönde işaretçi bulunamadı. Keşfetmeye devam etmek için ok tuşlarını kullanın.'
        }
    },
    detail: {
        location: 'Konum',
        photos: 'Fotoğraflar',
        description: 'Açıklama',
        status_history: 'Durum Geçmişi',
        updates: 'Güncellemeler',
        no_updates: 'Henüz güncelleme yok',
        edit: 'Düzenle',
        follow: {
            button: 'Takip Et',
            following: 'Takip Ediyor',
            stop: 'Takip etmeyi bırak',
            success: 'Artık bu raporu takip ediyorsunuz',
            error: 'Raporu takip ederken hata oluştu',
            updating: 'Güncelleniyor...'
        },
        unavailable: {
            title: 'Rapor mevcut değil',
            message: 'Bu rapor mevcut değil veya henüz yayınlanmamış. Yeni gönderilen raporların görünmesi biraz zaman alabilir.'
        },
        dialog_description: 'View report details'
    },
    stats: {
        status_overview: 'Durum',
        pie_chart: 'Dağılım',
        total_reports: 'Toplam Raporlar',
        status_distribution: 'Durum Dağılımı',
        category_distribution: 'Kategori Dağılımı',
        uncategorized: 'Kategorize Edilmemiş',
        showing_reports: '{visible} / {total} rapor gösteriliyor',
        no_reports: 'Hiçbir rapor mevcut değil',
        open_reports: 'Açık Raporlar',
        closed_reports: 'Kapalı Raporlar',
        no_data_available: 'Veri yok',
        expand: 'Show details',
        collapse: 'Hide details',
        subcategory: 'subcategory',
        subcategories: 'subcategories'
    },
    time: {
        days_ago: '{count} gün önce',
        just_now: 'Az önce',
        minutes_ago: '{count} dakika önce',
        hours_ago: '{count} saat önce',
        yesterday: 'Dün',
        today: 'Bugün'
    },
    list: {
        showing: '{visible} / {total} rapordan gösteriliyor',
        showing_in_area: 'Bu alanda {visible}, toplam {total}',
        showing_area_only: 'Bu alanda {visible}',
        no_results: 'Rapor bulunamadı',
        no_filtered_results: 'Filtre kriterlerinizle eşleşen rapor bulunamadı',
        load_more: 'Tüm raporlar yüklendi',
        load_more_button: 'Daha fazla yükle',
        newest_first: 'En yeniler önce',
        oldest_first: 'En eski önce',
        refresh: 'Yenile',
        status_update: 'Durum güncellendi',
        location: 'Konum',
        unpublished: 'Yayınlanmamış',
        editable: 'Editable'
    },
    errors: {
        general: 'Bir şeyler yanlış gitti',
        search_failed: 'Arama başarısız oldu. Lütfen tekrar deneyin.',
        upload_failed: 'Yükleme başarısız oldu',
        location_error: 'Konum belirlenemedi',
        network_error: 'Ağ hatası',
        geolocation: {
            title: 'Konum Hatası',
            permission_denied: 'Konum izni reddedildi. Lütfen tarayıcı ayarlarınızdan erişime izin verin.',
            unavailable: 'Konum bilgisi şu anda kullanılamıyor.',
            timeout: 'Konum isteği zaman aşımına uğradı.',
            unknown: 'Bilinmeyen bir konum hatası oluştu.'
        },
        try_again: 'Lütfen tekrar deneyin',
        validation: {
            title: 'Lütfen aşağıdaki hataları düzeltin:',
            location_error_title: 'Konum Hatası',
            invalid_input: 'Geçersiz Giriş',
            duplicate_title: 'Kopya Bulundu',
            duplicate_found: 'Benzer rapor bulundu',
            duplicate_report: 'Benzer bir rapor zaten oluşturuldu (No. {reportId})',
            location_out_of_bounds: 'Belirtilen konum hizmet alanımızın dışında',
            required_field: '{field} gereklidir',
            required_fields: 'Lütfen tüm gerekli alanları doldurun',
            file_size: 'Seçilen dosya çok büyük (maks. 10 MB)',
            file_type: 'Biçim desteklenmiyor (izin verilenler: jpg, png, webp, jfif)',
            media_upload: 'Resim yüklenirken hata oluştu',
            invalid_format: '{field} için geçersiz format',
            consent_required: 'Gizlilik politikasını kabul etmeniz gerekiyor',
            please_review: 'Please review the form and correct any errors before submitting.',
            photo_required: 'A photo is required for this category',
            duplicate_hint_title: 'Possible Duplicate Found',
            duplicate_hint_message: 'A similar report may already exist in this area. You can still submit if you believe this is a new issue.',
            duplicate_existing_report: 'Existing report: No. {reportId}',
            view_existing_report: 'View Existing Report',
            submit_anyway: 'Submit Anyway'
        },
        rate_limit: {
            title: 'Hız sınırı aşıldı',
            general: 'Lütfen daha sonra tekrar deneyin.',
            with_time: 'Lütfen {seconds} saniye içinde tekrar deneyin.'
        },
        network: 'Bağlantı sorunu. İnternet bağlantınızı kontrol edin',
        timeout: 'Zaman aşımı. Lütfen tekrar deneyin',
        upload: {
            title: 'Yükleme başarısız oldu',
            invalid_type: 'Geçersiz dosya türü. Lütfen yalnızca resim yükleyin.',
            file_too_large: 'Dosya çok büyük. Maksimum boyut {size}.',
            dimensions_too_large: 'Resim boyutları çok büyük. Maksimum {width}x{height} piksel.',
            invalid_image: 'Geçersiz veya bozuk resim dosyası.',
            failed: 'Yükleme başarısız oldu. Lütfen tekrar deneyin.',
            limit_reached: 'Maksimum {count} dosya sayısına ulaşıldı.',
            remove_to_add: 'Yeni bir fotoğraf eklemek için bir fotoğrafı kaldırın',
            single_file_limit: 'Yalnızca bir resim yüklenebilir.',
            exact_file_limit: 'En fazla {count} resim yüklenebilir.',
            file_too_large_raw: 'File too large ({size} maximum). Please choose a smaller image.',
            optimization_failed: 'Image could not be compressed. Maximum size after compression: {size}.'
        },
        submission_error: 'Rapor gönderilirken veya resim yüklenirken hata oluştu.',
        unknown: 'Bilinmeyen bir hata oluştu.',
        pending_uploads: 'Tüm yüklemelerin tamamlanmasını bekleyin.',
        incomplete_form: 'Lütfen tüm gerekli alanları doldurun.',
        api: {
            rate_limit: 'Too many requests. Please wait a moment and try again.',
            unauthorized: 'Not authorized. Please sign in again.',
            forbidden: 'Access denied.',
            not_found: 'Resource not found.',
            server_error: 'Server error. Please try again later.',
            default: 'API Error: {status}'
        },
        page: {
            title: 'Error',
            not_found_title: 'Page not found',
            not_found_message: 'Sorry, the page you are looking for does not exist.',
            server_error_title: 'Server error',
            server_error_message: 'Sorry, something went wrong on our server.',
            generic_title: 'Error occurred',
            generic_message: 'An unexpected error has occurred.',
            action_home: 'Return to home',
            action_back: 'Go back',
            action_retry: 'Try again',
            details: 'Error details'
        }
    },
    success: {
        report_submitted: 'Rapor gönderildi',
        moderation_notice: 'Raporunuz yayınlanmadan önce incelenecektir. Referans numarası:',
        submit_another: 'Başka bir rapor gönder',
        auto_followed: 'Bu rapor otomatik olarak takip ettiğiniz raporlara eklendi',
        visibility_limitation_notice: 'Lütfen tüm raporların web sitesinde herkese açık görünmeyebileceğini unutmayın. Raporunuz takip edilen raporlar listesinde güncellenmiyorsa, yine de şehir tarafından işlenmiş olabilir. Durum güncellemeleri için e-postanızı kontrol edin.',
        report_submitted_description: 'Your report has been successfully submitted and will be reviewed shortly.',
        fun_facts: [
            '🌱 Every report you submit helps make your city a better place to live!',
            '🏙️ Citizen reports have helped fix over 10,000 issues in cities worldwide.',
            '⚡ The average report gets reviewed within 24 hours.',
            '🤝 You\'re part of a community that cares about public spaces!',
            '📊 Data from citizen reports helps city planners make better decisions.',
            '🔄 Following your reports keeps you updated on progress automatically.',
            '🎯 Photo reports are processed 3x faster than text-only reports.',
            '🌍 Citizen engagement platforms like this exist in over 50 countries.',
            '💡 Your feedback helps prioritize which issues get fixed first.',
            '🚀 Digital reporting has reduced response times by up to 60%.',
            '🏆 Active citizens make stronger, more resilient communities.',
            '🔍 AI analysis helps categorize your reports more accurately.',
            '📱 Mobile reporting makes it easy to report issues as you see them.',
            '⭐ Thank you for being an engaged citizen!'
        ]
    },
    flag: {
        title: 'Bu raporu bildir',
        description: 'Uygunsuz içerikleri bildirerek kaliteyi korumamıza yardımcı olun.',
        reason_label: 'Bu raporu neden bildiriyorsunuz?',
        reason_spam: 'Spam veya reklam',
        reason_offensive: 'Saldırgan veya uygunsuz içerik',
        reason_personal: 'Kişisel veri içeriyor',
        reason_location: 'Yanlış konum',
        reason_other: 'Diğer',
        details_label: 'Ek ayrıntılar',
        details_placeholder: 'Lütfen sorunu açıklayın...',
        details_required: 'Lütfen ayrıntı sağlayın',
        submit: 'Gönder',
        success: 'Teşekkürler. Bu raporu inceleyeceğiz.',
        error: 'Gönderilemedi. Lütfen tekrar deneyin.',
        already_flagged: 'Bu raporu zaten bildirdiniz.'
    },

    pwa: {
        install: {
            title: 'Uygulamayı Yükle',
            button: 'Yükle',
            not_now: 'Şimdi değil',
            description: 'Bu uygulamayı yüklemek için tarayıcınızın adres çubuğundaki yükleme simgesine tıklayın',
            share_button: 'paylaş simgesi',
            open_safari: 'Safari tarayıcısı',
            ios: {
                title: 'Ana Ekrana Ekle',
                safari_instructions: ' {icon} simgesine dokunun ve "Ana Ekrana Ekle"yi seçin',
                other_instructions: 'Lütfen bu siteyi {browser}da açın ve yükleyin'
            },
            chrome: {
                instructions: 'Bu uygulamayı yüklemek için araç çubuğundaki {icon} yükleme simgesine tıklayın'
            },
            edge: {
                instructions: 'Adres çubuğundaki {icon} yükleme simgesine tıklayın'
            },
            firefox: {
                instructions: 'Adres çubuğundaki {icon} ana simgesine tıklayın'
            }
        }
    },
    boundaries: {
        loading: 'Sınır verileri yükleniyor...',
        error: 'Konum sınırları doğrulanamıyor. Lütfen daha sonra tekrar deneyin.',
        notLoaded: 'Sınırlar henüz yüklenmedi',
        outsideNonStrict: 'Not: Seçilen konum {locationName} sınırlarının dışında.',
        outsideStrict: 'Seçilen konum {locationName} sınırlarının dışındadır. Lütfen şehir sınırları içinde bir konum seçin.',
        validationUnavailable: 'Sınır doğrulaması kullanılamıyor. Raporunuz kabul edilecek ancak incelenebilir.'
    },
    filters: {
        status: {
            title: 'Durum'
        },
        time: {
            title: 'Zaman',
            today: 'Bugün',
            week: 'Bu Hafta',
            month: 'Bu Ay'
        },
        category: {
            title: 'Kategori',
            other: 'Diğer'
        },
        actions: {
            more: 'Daha Fazla Filtre',
            expand: 'Daha Fazla Filtre',
            collapse: 'Daha Az',
            clear_all: 'Tümünü Temizle',
            active_count: '{count} filtre aktif',
            toggle: 'Filtreler'
        },
        title: 'Filters'
    },
    privacy: {
        notice_text: 'Gizlilik bilgilerini bulabileceğiniz yer',
        notice_link_text: 'burada',
        modal: {
            title: 'Privacy Policy',
            loading: 'Loading privacy information...',
            retry: 'Retry',
            noContent: 'No privacy information available.',
            lastUpdated: 'Last updated',
            close: 'Close'
        }
    },
    search: {
        placeholder: 'Raporları ara...',
        no_results_local: 'Mevcut görünümde sonuç bulunamadı',
        expand_to_server: 'Tüm raporlarda ara',
        expand_hint: 'Mevcut görünümün ötesinde ara',
        searching_server: 'Tüm raporlar aranıyor...'
    },
    info: {
        welcome: {
            heading: '{name}\'e hoş geldiniz',
            headingGeneric: 'Hoş geldiniz',
            body: 'Sorunları bildirmek veya bölgenizdeki mevcut bildirimleri öğrenmek için bu haritayı kullanın.'
        },
        shortcuts: {
            aria_label: 'Hızlı eylemler',
            photo: {
                title: 'Fotoğraf',
                description: 'Bir fotoğraf çekin, gerisini yapay zeka halletsin',
                aria_label: 'Fotoğraflı bildirim oluştur'
            },
            classic: {
                title: 'Klasik',
                description: 'Sorunu tanımlayın ve konumunu belirtin',
                aria_label: 'Klasik bildirim oluştur'
            },
            following: {
                title: 'Takip Et',
                description: 'İlerlemeden haberdar olun',
                aria_label: 'Takip edilen bildirimleri aç'
            },
            list: {
                title: 'Keşfet',
                description: 'Yakınınızda neler olduğunu görün',
                aria_label: 'Haritayı keşfet ve listeyi görüntüle'
            }
        }
    },
    profile: {
        title: 'Profil',
        account: {
            title: 'Hesap',
            roles: 'Roller'
        },
        groups: {
            title: 'Gruplar'
        },
        appearance: {
            title: 'Görünüm',
            color_mode: 'Renk modu',
            light: 'Açık',
            dark: 'Koyu',
            system: 'Sistem',
            primary_color: 'Ana renk',
            theme_override: 'Custom Theme Colors',
            theme_override_description: 'Override the default jurisdiction theme with your own color preferences',
            secondary_color: 'Secondary Color',
            neutral_color: 'Neutral Color',
            reset_theme: 'Reset to Default'
        },
        language: {
            title: 'Dil',
            select: 'Dil seçin',
            save_failed: 'Dil tercihiniz kaydedilemedi. Lütfen tekrar deneyin.'
        }
    },
    auth: {
        login: {
            title: 'Sign In',
            subtitle: 'Enter your email to receive a verification code',
            email_label: 'Email Address',
            email_hint: 'We will send you a 6-digit code',
            email_placeholder: 'email address',
            send_code: 'Send Verification Code',
            disabled: {
                title: 'Giriş mevcut değil',
                message: 'Şifresiz giriş burada etkin değil. Erişime ihtiyacınız varsa lütfen yöneticiyle iletişime geçin.',
                back_button: 'Ana sayfaya dön'
            }
        },
        verify: {
            email_label: 'Email Address',
            code_label: 'Verification Code',
            code_hint: 'Enter the 6-digit code from your email',
            code_placeholder: '123456',
            verify_button: 'Verify & Sign In',
            back_button: 'Use Different Email',
            request_new: 'Request New Code',
            resend_code: 'Resend Code',
            expires_in: 'Code expires in {time}',
            expired_title: 'Code Expired',
            expired_message: 'Your verification code has expired. Please request a new one.'
        },
        code_sent: {
            title: 'Code Sent',
            message: 'We sent a 6-digit verification code to {email}'
        },
        error: {
            title: 'Authentication Error',
            request_failed: 'Failed to send verification code. Please try again.',
            verify_failed: 'Invalid or expired verification code',
            sso_failed: 'Oturum açma başarısız. Lütfen tekrar deneyin.',
            network: 'Network error. Please check your connection.',
            logout_failed: 'Failed to log out. Please try again.'
        },
        sso: {
            completing: 'Oturum açma tamamlanıyor...',
            method_label: 'Tek oturum açma',
            button_aria: '{provider} ile tek oturum açma kullanarak oturum aç'
        },
        user: {
            logged_in_as: 'Signed in as',
            logout: 'Sign Out'
        },
        welcome: {
            greeting: 'Hello, {name}',
            sign_in: 'Giriş yap',
            sign_out: 'Sign Out',
            user_avatar: 'User avatar'
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
            title: 'Sayfa bulunamadı',
            description: 'Aradığınız sayfa mevcut değil veya taşınmış.'
        },
        403: {
            title: 'Erişim reddedildi',
            description: 'Bu sayfayı görüntüleme izniniz yok.'
        },
        500: {
            title: 'Bir şeyler ters gitti',
            description: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
        },
        fallback: {
            title: 'Hata',
            description: 'Beklenmeyen bir hata oluştu.'
        },
        actions: {
            back: 'Geri',
            home: 'Ana sayfaya dön',
            retry: 'Tekrar dene'
        }
    },
    legal: {
        impressum: {
            title: 'Yasal bildirim',
            heading: 'Yasal bildirim',
            responsible_heading: 'İçerikten sorumlu',
            responsible_text: '{name} bu platformun içeriğinden sorumludur.'
        },
        privacy: {
            title: 'Gizlilik politikası',
            heading: 'Gizlilik politikası',
            intro: 'Kişisel verilerinizin korunması bizim için önemlidir. Verilerinizi yalnızca yasal düzenlemeler (KVKK/GDPR) temelinde işliyoruz.',
            controller_heading: 'Veri sorumlusu',
            data_heading: 'Toplanan veriler',
            data_text: 'Bu platformu kullanırken şu veriler işlenir: bildirimin konum verileri, açıklama metni, yüklenen fotoğraflar ve teknik erişim verileri (IP adresi, tarayıcı türü, erişim zamanı).',
            rights_heading: 'Haklarınız',
            rights_text: 'Erişim, düzeltme, silme, işlemeyi kısıtlama, veri taşınabilirliği ve itiraz hakkına sahipsiniz.'
        },
        terms: {
            title: 'Kullanım koşulları',
            heading: 'Kullanım koşulları',
            intro: 'Bu platformu kullanarak aşağıdaki koşulları kabul etmiş olursunuz.',
            purpose_heading: 'Amaç',
            purpose_text: 'Bu platform kamusal alanlardaki sorunları bildirmek için kullanılır. Bildirimler sorumlu makama iletilir.',
            obligations_heading: 'Kullanıcı yükümlülükleri',
            obligations_text: 'Yalnızca doğru bilgi vermeyi ve yasadışı içerik yüklememeyi kabul edersiniz. Yüklenen fotoğraflarda tanınabilir kişiler onayları olmadan gösterilmemelidir.',
            liability_heading: 'Sorumluluk',
            liability_text: '{name} sağlanan bilgilerin eksiksizliği ve doğruluğu konusunda herhangi bir sorumluluk kabul etmez.'
        },
        email_label: 'E-posta',
        contact_label: 'İletişim',
        platform: {
            heading: 'Platform işletmecisi',
            intro: 'Bu platform teknik olarak şu kuruluş tarafından işletilmektedir:',
            description: 'Civic Patches GmbH, Mark-a-Spot platformu için teknik altyapıyı sağlar.',
            name: 'Civic Patches GmbH',
            address: 'Pingsdorfer Straße 88-92, 50321 Brühl, Almanya',
            web: 'https://civicpatches.de'
        },
        operator: {
            heading: 'Bu haritanın işletmecisi',
            not_configured: 'Bu haritanın işletmecisi henüz yasal bilgilerini sağlamamıştır. Kamuya açık çevrimiçi hizmetlerin işletmecileri, bir yasal bildirim ve gizlilik politikası sunmakla yükümlü olabilir.'
        },
        footer: {
            impressum: 'Yasal bildirim',
            privacy: 'Gizlilik',
            terms: 'Kullanım koşulları'
        },
        not_configured: 'İşletmeci verileri henüz yapılandırılmadı.'
    },
    demo_mode: {
        banner: {
            title: 'Demo ortamı',
            message: 'Buradan girilen bildirimler hiçbir kuruma iletilmez.',
            link_label: 'mark-a-spot.com\'u ziyaret et',
            minimize_label: 'Demo uyarısını küçült',
            expand_label: 'Demo uyarısını genişlet'
        },
        reset: {
            title: 'Demo veritabanı',
            notice: 'Demo sistemi her saat sıfırlanır.',
            countdown_label: 'Sonraki sıfırlama',
            countdown_aria: 'Demo veritabanının sonraki sıfırlanmasına {time} kaldı'
        },
        modal: {
            title: 'Demo gönderimi',
            body: 'Bu bir demoadır. Bildiriminiz belediyeye İLETİLMEYECEKTİR. Demo gönderimiyle devam edilsin mi?',
            confirm_label: 'Demo bildirimini gönder',
            cancel_label: 'İptal'
        },
        lite: {
            title: 'Yalnızca demo',
            heading: 'Demo ortamı',
            body: 'Bu, Mark-a-Spot\'un bir demonstrasyonudur. Gerçek bildirimlerin yanlışlıkla bir belediyeye ulaşmaması için basit form üzerinden gönderim burada devre dışı bırakılmıştır.',
            link_label: 'mark-a-spot.com\'u ziyaret et'
        }
    },
    print: {
        title: 'Hizmet talebi raporu',
        description: 'Açıklama',
        location: 'Konum',
        media: 'Ekler',
        image_unavailable: 'Image unavailable',
        attributes: 'Ek alanlar',
        status_history: 'Durum geçmişi',
        internal_fields: 'Dahili bilgiler',
        organisation: 'Birim',
        hazard_level: 'Tehlike seviyesi',
        hazard_category: 'Tehlike kategorisi',
        sentiment: 'Duygu durumu',
        printed_at: 'Yazdırıldı',
        showing_recent: '{count} / {total} güncelleme gösteriliyor'
    }
};
