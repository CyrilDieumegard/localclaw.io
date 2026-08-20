(() => {
    'use strict';

    const picker = document.querySelector('[data-model-run-options]');
    if (!picker) return;

    const status = picker.querySelector('.run-copy-status');
    let statusTimer = null;

    const fallbackCopy = value => {
        const input = document.createElement('textarea');
        input.value = value;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand('copy');
        input.remove();
        return copied;
    };

    const copy = async value => {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
            return true;
        }
        return fallbackCopy(value);
    };

    const announce = (message, button) => {
        clearTimeout(statusTimer);
        status.textContent = message;
        picker.querySelectorAll('.run-option.is-copied').forEach(option => option.classList.remove('is-copied'));
        if (button) button.classList.add('is-copied');
        statusTimer = window.setTimeout(() => {
            status.textContent = '';
            if (button) button.classList.remove('is-copied');
        }, 5000);
    };

    picker.addEventListener('click', async event => {
        const button = event.target.closest('[data-copy-command]');
        if (!button) return;
        const command = button.getAttribute('data-copy-command');
        if (!command) return;

        try {
            const copied = await copy(command);
            announce(copied ? `Copied: ${command}` : `Copy this command: ${command}`, copied ? button : null);
        } catch (error) {
            announce(`Copy this command: ${command}`, null);
        }
    });
})();
