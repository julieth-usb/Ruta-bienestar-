/* ============================================================
   RUTA BIENESTAR · PWA opcional
   Instalación discreta + service worker + modo app.
   Nunca bloquea el uso normal de la web.
   ============================================================ */

(function () {
  "use strict";

  var DISMISS_KEY = "ruta-install-dismissed";
  var deferredPrompt = null;
  var promptEl = document.getElementById("installPrompt");
  var headerBtn = document.getElementById("installBtn");
  var sheet = document.getElementById("installSheet");
  var backdrop = document.getElementById("installBackdrop");
  var lastFocus = null;

  function isStandalone() {
    return (
      document.documentElement.classList.contains("app-mode") ||
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isDismissed() {
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function rememberDismissal() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch (error) {
      /* Sin persistencia disponible. */
    }
  }

  function hideInstallUI() {
    if (promptEl) promptEl.hidden = true;
    if (headerBtn) headerBtn.hidden = true;
  }

  function showInstallUI() {
    if (isStandalone() || isDismissed()) return;
    if (headerBtn) headerBtn.hidden = false;
    if (promptEl) {
      window.clearTimeout(showInstallUI.timer);
      showInstallUI.timer = window.setTimeout(function () {
        if (!isDismissed() && !isStandalone()) promptEl.hidden = false;
      }, 2600);
    }
  }

  function detectPlatform() {
    var ua = window.navigator.userAgent || "";
    var ios = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    var android = /Android/i.test(ua);
    return ios ? "ios" : android ? "android" : "desktop";
  }

  function openSheet() {
    if (!sheet || !backdrop) return;
    var platform = detectPlatform();
    Array.prototype.forEach.call(sheet.querySelectorAll("[data-guide]"), function (block) {
      block.classList.toggle("is-visible", block.getAttribute("data-guide") === platform);
    });
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    sheet.inert = false;
    sheet.removeAttribute("inert");
    var close = sheet.querySelector("[data-install-close]");
    if (close) close.focus();
  }

  function closeSheet() {
    if (!sheet || !backdrop) return;
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    sheet.inert = true;
    sheet.setAttribute("inert", "");
    backdrop.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function requestInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (choice) {
        if (choice && choice.outcome === "accepted") {
          hideInstallUI();
        } else {
          rememberDismissal();
          hideInstallUI();
        }
        deferredPrompt = null;
      }).catch(function () {
        deferredPrompt = null;
      });
      return;
    }
    openSheet();
  }

  /* ---------- Eventos del navegador ---------- */
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showInstallUI();
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    hideInstallUI();
  });

  window.addEventListener("load", function () {
    if (isStandalone()) {
      hideInstallUI();
      return;
    }
    if (window.matchMedia("(display-mode: browser)").matches && isDismissed()) {
      hideInstallUI();
    }
    if (headerBtn) headerBtn.hidden = !deferredPrompt;
  });

  /* ---------- Controles ---------- */
  document.addEventListener("click", function (event) {
    var accept = event.target.closest("[data-install-accept]");
    var dismiss = event.target.closest("[data-install-dismiss]");
    var help = event.target.closest("[data-install-help], #installBtn");
    var close = event.target.closest("[data-install-close]");
    var backdropClick = event.target === backdrop;

    if (accept) requestInstall();
    if (dismiss) {
      rememberDismissal();
      hideInstallUI();
    }
    if (help) {
      if (deferredPrompt) requestInstall();
      else openSheet();
    }
    if (close || backdropClick) closeSheet();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sheet && sheet.classList.contains("is-open")) closeSheet();
  });

  /* ---------- Service worker ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* La app funciona igual sin conexión al service worker. */
      });
    });
  }
})();
