import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard, copyViaExecCommand } from '~/utils/clipboard';

// happy-dom does not implement document.execCommand, so install a controllable
// stub for the legacy fallback path. Tests set its return/throw behaviour.
function stubExecCommand(impl: () => boolean): ReturnType<typeof vi.fn> {
    const execCommand = vi.fn(impl);
    (document as unknown as { execCommand: typeof execCommand }).execCommand = execCommand;
    return execCommand;
}

function clearExecCommand(): void {
    delete (document as unknown as { execCommand?: unknown }).execCommand;
}

describe('copyTextToClipboard', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        clearExecCommand();
        document.body.innerHTML = '';
    });

    it('uses the async Clipboard API when available', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { clipboard: { writeText } });

        const result = await copyTextToClipboard('https://example.test/x');

        expect(result).toBe(true);
        expect(writeText).toHaveBeenCalledWith('https://example.test/x');
    });

    it('falls back to execCommand when the Clipboard API rejects', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('denied'));
        vi.stubGlobal('navigator', { clipboard: { writeText } });
        const execCommand = stubExecCommand(() => true);

        const result = await copyTextToClipboard('fallback-text');

        expect(result).toBe(true);
        expect(writeText).toHaveBeenCalled();
        expect(execCommand).toHaveBeenCalledWith('copy');
    });

    it('falls back to execCommand when the Clipboard API is missing', async () => {
        vi.stubGlobal('navigator', {});
        const execCommand = stubExecCommand(() => true);

        const result = await copyTextToClipboard('no-clipboard');

        expect(result).toBe(true);
        expect(execCommand).toHaveBeenCalledWith('copy');
    });

    it('returns false when every path fails', async () => {
        vi.stubGlobal('navigator', {});
        stubExecCommand(() => false);

        const result = await copyTextToClipboard('nope');

        expect(result).toBe(false);
    });
});

describe('copyViaExecCommand', () => {
    let selectSpy: ReturnType<typeof vi.fn>;
    let setSelectionRangeSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        selectSpy = vi.fn();
        setSelectionRangeSpy = vi.fn();
        // happy-dom does not always implement select()/setSelectionRange();
        // spy on the prototype so the auto-select assertions are reliable.
        vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(selectSpy);
        vi.spyOn(HTMLTextAreaElement.prototype, 'setSelectionRange').mockImplementation(setSelectionRangeSpy);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        clearExecCommand();
        document.body.innerHTML = '';
    });

    it('auto-selects the textarea content before copying', () => {
        stubExecCommand(() => true);

        const result = copyViaExecCommand('select-me');

        expect(result).toBe(true);
        expect(selectSpy).toHaveBeenCalled();
        expect(setSelectionRangeSpy).toHaveBeenCalledWith(0, 'select-me'.length);
    });

    it('removes the temporary textarea from the DOM afterwards', () => {
        stubExecCommand(() => true);

        copyViaExecCommand('cleanup');

        expect(document.querySelector('textarea')).toBeNull();
    });

    it('returns false when execCommand throws', () => {
        stubExecCommand(() => {
            throw new Error('blocked');
        });

        expect(copyViaExecCommand('boom')).toBe(false);
        // Cleanup still happens even on the throwing path.
        expect(document.querySelector('textarea')).toBeNull();
    });
});
