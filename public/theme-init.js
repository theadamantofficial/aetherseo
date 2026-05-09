(() => {
  const storageKey = "aether-site-theme-mode";
  const consentKey = "aether-cookie-consent=accepted";
  const hasConsent = document.cookie.split("; ").includes(consentKey);
  let mode = "auto";

  if (hasConsent) {
    try {
      const storedMode = window.localStorage.getItem(storageKey);
      mode = storedMode === "light" || storedMode === "dark" || storedMode === "auto"
        ? storedMode
        : "auto";
    } catch {}
  }

  const hour = new Date().getHours();
  const resolvedTheme = mode === "auto"
    ? (hour >= 7 && hour < 19 ? "light" : "dark")
    : mode;

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
})();
