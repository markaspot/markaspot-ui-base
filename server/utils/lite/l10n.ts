export type LocaleKey = 'en' | 'de' | 'fr' | 'nl' | 'tr';

// Right-to-left locales. Only the direction hint is needed here; no
// translations are wired yet because these locales are not in the lite
// dictionary. The mechanism is in place so adding ar/he/fa translations
// later automatically enables `dir="rtl"` in the HTML element.
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

/**
 * Returns `"rtl"` for right-to-left locales, `"ltr"` otherwise.
 * Used to set the `dir` attribute on the root `<html>` element.
 */
export function getTextDirection(locale: string): 'rtl' | 'ltr' {
    return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

// Minimal i18n dictionary (fixed at build) for lite route.
export const L10N: Record<LocaleKey, Record<string, string>> = {
    en: {
        title: 'Emergency Report',
        intro: 'Low-bandwidth, no-JS form for submitting a report. This page avoids heavy maps, UI kits, and client bundles.',
        category: 'Category',
        category_placeholder: 'Select a category',
        description: 'Description',
        description_placeholder: 'Please describe the issue...',
        latitude: 'Latitude',
        longitude: 'Longitude',
        location_search: 'Find address (optional)',
        use_current_location: 'Use current location',
        email: 'Email for Updates',
        first_name: 'First Name',
        last_name: 'Last Name',
        gdpr: 'I agree to the processing of my data according to the privacy policy.',
        submit: 'Submit Report',
        switch_to_full_site: 'Switch to full site',
        note: 'Note: This route intentionally ships zero framework JS and minimal CSS for reliability on slow, metered connections.',
        submit_error_title: 'Submission failed',
        submit_error_generic: 'We could not submit your report. Please try again or use the full site.',
        submit_success_title: 'Report submitted',
        submit_success_body: 'Thank you. Your report was submitted successfully.',
        submit_request_id: 'Request ID'
    },
    de: {
        title: 'Notfall-Meldung',
        intro: 'Schmalbandiges, JS-freies Formular zum Melden. Keine schweren Karten, UI-Bibliotheken oder Client-Bundles.',
        category: 'Kategorie',
        category_placeholder: 'Kategorie auswählen',
        description: 'Beschreibung',
        description_placeholder: 'Bitte beschreiben Sie das Problem...',
        latitude: 'Breitengrad',
        longitude: 'Längengrad',
        location_search: 'Adresse suchen (optional)',
        use_current_location: 'Aktuellen Standort verwenden',
        email: 'E-Mail für Updates',
        first_name: 'Vorname',
        last_name: 'Nachname',
        gdpr: 'Ich stimme der Verarbeitung meiner Daten gemäß der Datenschutzerklärung zu.',
        submit: 'Meldung senden',
        switch_to_full_site: 'Zur vollständigen Website',
        note: '',
        submit_error_title: 'Übermittlung fehlgeschlagen',
        submit_error_generic: 'Ihre Meldung konnte nicht übermittelt werden. Bitte versuchen Sie es erneut oder nutzen Sie die vollständige Website.',
        submit_success_title: 'Meldung eingereicht',
        submit_success_body: 'Vielen Dank. Ihre Meldung wurde erfolgreich übermittelt.',
        submit_request_id: 'Vorgangsnummer'
    },
    fr: {
        title: 'Rapport d\'urgence',
        intro: 'Formulaire a faible bande passante, sans JS. Pas de cartes lourdes, UI ou bundles client.',
        category: 'Categorie',
        category_placeholder: 'Selectionner une categorie',
        description: 'Description',
        description_placeholder: 'Veuillez decrire le probleme...',
        latitude: 'Latitude',
        longitude: 'Longitude',
        location_search: 'Rechercher une adresse (optionnel)',
        use_current_location: 'Utiliser la position actuelle',
        email: 'E-mail pour les mises a jour',
        first_name: 'Prenom',
        last_name: 'Nom',
        gdpr: 'J\'accepte le traitement de mes donnees conformement a la politique de confidentialite.',
        submit: 'Soumettre le rapport',
        switch_to_full_site: 'Aller au site complet',
        note: 'Remarque : aucune JS de framework et CSS minimale pour les connexions lentes/metrees.',
        submit_error_title: 'Echec de la soumission',
        submit_error_generic: 'Nous n\'avons pas pu soumettre votre rapport. Veuillez reessayer ou utiliser le site complet.',
        submit_success_title: 'Rapport soumis',
        submit_success_body: 'Merci. Votre rapport a ete soumis avec succes.',
        submit_request_id: 'Numero de demande'
    },
    nl: {
        title: 'Noodmelding',
        intro: 'Formulier met laag bandverbruik en zonder JavaScript voor het indienen van een melding. Deze pagina laadt geen zware kaarten, UI-bibliotheken of client-bundles.',
        category: 'Categorie',
        category_placeholder: 'Selecteer een categorie',
        description: 'Omschrijving',
        description_placeholder: 'Beschrijf het probleem...',
        latitude: 'Breedtegraad',
        longitude: 'Lengtegraad',
        location_search: 'Adres zoeken (optioneel)',
        use_current_location: 'Huidige locatie gebruiken',
        email: 'E-mailadres voor updates',
        first_name: 'Voornaam',
        last_name: 'Achternaam',
        gdpr: 'Ik ga akkoord met de verwerking van mijn gegevens conform het privacybeleid.',
        submit: 'Melding indienen',
        switch_to_full_site: 'Naar volledige site',
        note: '',
        submit_error_title: 'Indienen mislukt',
        submit_error_generic: 'Uw melding kon niet worden ingediend. Probeer het opnieuw of gebruik de volledige site.',
        submit_success_title: 'Melding ingediend',
        submit_success_body: 'Bedankt. Uw melding is succesvol ingediend.',
        submit_request_id: 'Zaaknummer'
    },
    tr: {
        title: 'Acil Durum Bildirimi',
        intro: 'Dusuk bant genisligi, JS\'siz bildirim formu. Agir harita, arayuz ve istemci paketleri yuklenmez.',
        category: 'Kategori',
        category_placeholder: 'Kategori secin',
        description: 'Aciklama',
        description_placeholder: 'Lutfen sorunu aciklayin...',
        latitude: 'Enlem',
        longitude: 'Boylam',
        location_search: 'Adres ara (istege bagli)',
        use_current_location: 'Mevcut konumu kullan',
        email: 'Guncellemeler icin e-posta',
        first_name: 'Ad',
        last_name: 'Soyad',
        gdpr: 'Verilerimin gizlilik politikasina gore islenmesini kabul ediyorum.',
        submit: 'Raporu gonder',
        switch_to_full_site: 'Tam siteye gec',
        note: 'Not: Bu rota, yavas/olculü baglantilarda framework JS yuklemez ve en az CSS kullanir.',
        submit_error_title: 'Gonderim basarisiz',
        submit_error_generic: 'Raporunuz gonderilemedi. Lutfen tekrar deneyin veya tam siteyi kullanin.',
        submit_success_title: 'Rapor gonderildi',
        submit_success_body: 'Tesekkurler. Raporunuz basariyla gonderildi.',
        submit_request_id: 'Talep numarasi'
    }
};

export function getTranslator(locale: string) {
    const validLocale = (locale in L10N ? locale : 'en') as LocaleKey;
    return (key: string) => (L10N[validLocale] && L10N[validLocale][key]) || L10N.en[key] || key;
}
