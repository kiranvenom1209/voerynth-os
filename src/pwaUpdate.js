import { registerSW } from 'virtual:pwa-register';

let reloadRequested = false;

export const registerAppUpdates = () => {
    registerSW({
        immediate: true,
        onNeedRefresh() {
            if (reloadRequested) return;
            reloadRequested = true;
            window.location.reload();
        },
        onRegisteredSW(_swUrl, registration) {
            if (!registration) return;
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);
        },
    });
};
