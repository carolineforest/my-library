// Shows "Update available, tap to refresh" when a new version is deployed.
// The app never reloads by itself, so nothing I'm typing gets lost.
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Check for a new version whenever the app comes back to the screen,
      // and every hour while it's open.
      const check = () => registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      setInterval(check, 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;
  return (
    <button type="button" className="toast" onClick={() => updateServiceWorker(true)}>
      Update available, tap to refresh
    </button>
  );
}
