/**
 * Copy text to the clipboard with a legacy fallback.
 *
 * The async Clipboard API (`navigator.clipboard.writeText`) requires a secure
 * context (https or localhost) and is unavailable in some embedded/insecure
 * previews. When it is missing or rejects, we fall back to the classic hidden
 * `<textarea>` + `document.execCommand('copy')` approach.
 *
 * On the fallback path the textarea content is selected first so that, even if
 * the synchronous copy is blocked by the browser, the user can complete the
 * copy with a single Cmd/Ctrl+C keystroke (the selection survives the focus
 * restore).
 *
 * @returns `true` when the text was copied, `false` when every path failed.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
    // Preferred path: async Clipboard API in a secure context.
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to the legacy path below.
        }
    }

    return copyViaExecCommand(text);
}

/**
 * Legacy clipboard copy via a hidden, off-screen textarea and
 * `document.execCommand('copy')`. Selects the content so a manual Cmd/Ctrl+C
 * works as a last resort if the synchronous copy is blocked.
 *
 * Exported for direct unit testing of the fallback branch.
 */
export function copyViaExecCommand(text: string): boolean {
    if (typeof document === 'undefined') {
        return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Keep the textarea out of view and out of the layout flow while still
    // being focusable/selectable.
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';

    const previouslyFocused = document.activeElement as HTMLElement | null;

    document.body.appendChild(textarea);
    textarea.focus();
    // Auto-select the content so Cmd/Ctrl+C copies it in one keystroke if the
    // programmatic copy below is rejected by the browser.
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    }

    document.body.removeChild(textarea);
    // Restore focus to wherever the user was so we do not steal it.
    previouslyFocused?.focus?.();

    return copied;
}
