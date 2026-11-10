/* ============================================================
   RUTA BIENESTAR · Lógica del prototipo interactivo
   Universidad Simón Bolívar · Parcial 2 · 2026
   Datos, citas y respuestas simuladas con fines académicos.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Datos base ---------- */
  var SERVICES = Array.isArray(window.RUTA_SERVICES) ? window.RUTA_SERVICES : [];
  var BY_ID = {};
  SERVICES.forEach(function (service) { BY_ID[service.id] = service; });

  var STORE_KEY = "ruta-bienestar-v2";
  var DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var BASE_TIMES = ["7:00 a. m.", "9:00 a. m.", "10:00 a. m.", "2:00 p. m.", "3:30 p. m.", "5:00 p. m."];

  var DEFAULT_QUICK = [
    "Me está yendo mal en una materia",
    "Necesito apoyo económico",
    "Me siento ansioso/a",
    "Hablar con una persona"
  ];

  var NEED_ICONS = {
    "Académico": "book",
    "Emocional": "heart",
    "Económico": "wallet",
    "Profesional": "compass",
    "Emprendimiento": "rocket",
    "Inclusión": "accessibility",
    "Cultura": "users",
    "Salud": "shield"
  };

  var HOME_BY_NEED = {
    "Académico": ["academico"],
    "Emocional": ["psicologia"],
    "Económico": ["becas"],
    "Profesional": ["profesional"],
    "Emprendimiento": ["emprendimiento"],
    "Inclusión": ["inclusion"],
    "Cultura": ["cultura"],
    "Salud": ["salud"]
  };

  /* ---------- Utilidades ---------- */
  function $(selector, context) {
    return (context || document).querySelector(selector);
  }
  function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }
  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function norm(value) {
    return String(value == null ? "" : value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }
  function cap(value) {
    var text = String(value || "");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  function pad(value) {
    return String(value).padStart(2, "0");
  }
  function parseISO(iso) {
    return new Date(iso + "T12:00:00");
  }
  function isoOf(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }
  function longDate(iso) {
    try {
      return cap(new Intl.DateTimeFormat("es-CO", {
        weekday: "long", day: "numeric", month: "long"
      }).format(parseISO(iso)));
    } catch (error) {
      return iso;
    }
  }
  function todayLong() {
    try {
      return cap(new Intl.DateTimeFormat("es-CO", {
        weekday: "long", day: "numeric", month: "long"
      }).format(new Date()));
    } catch (error) {
      return "Hoy";
    }
  }
  function shortDate(iso) {
    var date = parseISO(iso);
    return DAYS[date.getDay()] + " " + date.getDate() + " " + MONTHS[date.getMonth()];
  }
  function nowLabel() {
    try {
      return new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(new Date());
    } catch (error) {
      return "9:41";
    }
  }
  function initials(name) {
    var parts = String(name || "Estudiante").trim().split(/\s+/).filter(Boolean);
    var value = (parts[0] ? parts[0].charAt(0) : "E") + (parts[1] ? parts[1].charAt(0) : "");
    return value.toUpperCase();
  }
  function svcIcon(service) {
    return '<span class="svc-icon" data-tone="' + esc(service.tone) + '">' + icon(service.icon) + "</span>";
  }
  function nextDates(count) {
    var dates = [];
    var cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    var offset = 1;
    while (dates.length < count && offset < 24) {
      var next = new Date(cursor.getTime());
      next.setDate(cursor.getDate() + offset);
      if (next.getDay() !== 0) {
        dates.push({
          iso: isoOf(next),
          day: DAYS[next.getDay()],
          number: next.getDate(),
          month: MONTHS[next.getMonth()]
        });
      }
      offset += 1;
    }
    return dates;
  }

  /* ---------- Estado ---------- */
  function defaultState() {
    return {
      profile: {
        name: "Julieth",
        semester: "5",
        modality: "Presencial",
        faculty: "Ingeniería Industrial",
        needs: ["Académico", "Emocional", "Económico"]
      },
      saved: ["psicologia", "becas"],
      appointments: [],
      steps: { onboarding: true, explored: true, saved: true, booked: false, attended: false },
      mood: null,
      notificationsRead: false,
      onboardingDone: true
    };
  }

  function normalizeState(raw) {
    var base = defaultState();
    if (!raw || typeof raw !== "object") return base;
    var merged = Object.assign({}, base, raw);
    merged.profile = Object.assign({}, base.profile, raw.profile || {});
    if (!Array.isArray(merged.profile.needs)) merged.profile.needs = base.profile.needs.slice();
    merged.steps = Object.assign({}, base.steps, raw.steps || {});
    if (!Array.isArray(merged.saved)) merged.saved = base.saved.slice();
    if (!Array.isArray(merged.appointments)) merged.appointments = [];
    return merged;
  }

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (error) {
      /* El prototipo sigue funcionando sin persistencia. */
    }
  }

  var state = normalizeState(readStore());

  var ui = {
    current: "home",
    history: [],
    serviceId: "academico",
    query: "",
    filter: "todos",
    routeTab: "citas",
    booking: null,
    lastAppointment: null,
    onbStep: 0,
    draft: null,
    chatSeeded: false,
    chatTimer: null,
    toastTimer: null,
    sheetTimer: null
  };

  /* ---------- Navegación ---------- */
  function goTo(screen, options) {
    options = options || {};
    var sheet = $("#notificationsSheet");
    if (sheet && !sheet.hidden) closeNotifications();
    var target = document.getElementById("screen-" + screen);
    if (!target) {
      screen = "home";
      target = document.getElementById("screen-home");
    }

    if (screen !== ui.current && options.push !== false) {
      ui.history.push(ui.current);
    }
    ui.current = screen;

    if (screen === "home") renderHome();
    if (screen === "explorar") renderExplore();
    if (screen === "detalle") renderDetail(options.serviceId || ui.serviceId);
    if (screen === "agendar" && !options.keepBooking) {
      startBooking(options.serviceId || ui.serviceId, options);
    }
    if (screen === "confirmacion") {
      renderConfirm(ui.lastAppointment || state.appointments[0]);
    }
    if (screen === "ruta") renderRoute();
    if (screen === "onboarding") {
      if (!options.keepDraft) {
        ui.onbStep = 0;
        ui.draft = cloneProfile();
      }
      renderOnboarding();
    }
    if (screen === "sami") ensureChat();

    $$(".screen").forEach(function (section) {
      section.classList.toggle("is-active", section === target);
    });

    if (!options.keepScroll) {
      var scrollable = target.querySelector(".screen-scroll");
      if (scrollable) scrollable.scrollTop = 0;
      if (screen === "sami") scrollChat();
    }

    updateNavigation();
  }

  function backFrom() {
    if (ui.current === "onboarding") {
      if (ui.onbStep > 0) {
        ui.onbStep -= 1;
        renderOnboarding();
      } else {
        goTo("home");
      }
      return;
    }
    var previous = ui.history.pop();
    goTo(previous || "home", { push: false });
  }

  function openService(id, book) {
    if (!BY_ID[id]) return;
    ui.serviceId = id;
    if (!state.steps.explored) {
      state.steps.explored = true;
      saveState();
    }
    if (book) {
      goTo("agendar", { serviceId: id });
    } else {
      goTo("detalle", { serviceId: id });
    }
  }

  function updateNavigation() {
    $$(".nav-item").forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.screen === ui.current);
    });
    $$(".screen-picker .chip").forEach(function (chip) {
      chip.classList.toggle("is-active", chip.dataset.screen === ui.current);
    });
    $$("#demoDock [data-screen]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.screen === ui.current);
    });
  }

  /* ---------- Inicio ---------- */
  function routeProgress() {
    var keys = ["onboarding", "explored", "saved", "booked", "attended"];
    return keys.filter(function (key) { return !!state.steps[key]; }).length;
  }

  function pickHomeServices() {
    var ids = [];
    (state.profile.needs || []).forEach(function (need) {
      (HOME_BY_NEED[need] || []).forEach(function (id) {
        if (ids.indexOf(id) === -1) ids.push(id);
      });
    });
    ["academico", "psicologia", "becas", "profesional", "inclusion"].forEach(function (id) {
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    return ids.slice(0, 2).map(function (id) { return BY_ID[id]; }).filter(Boolean);
  }

  function renderHome() {
    updateProfileUI();
    var today = $("#todayLabel");
    if (today) today.textContent = todayLong();

    var list = $("#homeServices");
    if (list) {
      list.innerHTML = pickHomeServices().map(function (service) {
        return '<button class="service-mini" data-service="' + esc(service.id) + '">' +
          svcIcon(service) +
          '<span class="service-mini-copy"><strong>' + esc(service.name) + "</strong><span>" +
          esc(service.category + " · " + service.duration) + "</span></span>" +
          '<svg class="icon chev" aria-hidden="true"><use href="#i-chevron-right"/></svg>' +
          "</button>";
      }).join("");
    }

    var done = routeProgress();
    var progress = $("#homeProgress");
    if (progress) progress.textContent = done + "/5";
    var bar = $("#homeProgressBar i");
    if (bar) bar.style.width = (done * 20) + "%";

    $$(".mood").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.mood === state.mood);
    });
    if (state.mood) setMood(state.mood, true);
    else {
      var response = $("#moodResponse");
      if (response) response.hidden = true;
    }

    syncNotificationBadges();
  }

  function updateProfileUI() {
    var name = state.profile.name || "Estudiante";
    var nameSlot = $("#userName");
    if (nameSlot) nameSlot.textContent = name;
    var letters = initials(name);
    $$(".avatar").forEach(function (avatar) { avatar.textContent = letters; });
  }

  function syncNotificationBadges() {
    $$(".badge").forEach(function (badge) {
      badge.hidden = !!state.notificationsRead;
      var button = badge.closest("button");
      if (button) {
        button.setAttribute(
          "aria-label",
          badge.hidden ? "Ver notificaciones" : "Ver notificaciones, " + badge.textContent + " sin leer"
        );
      }
    });
  }

  function setMood(mood, silent) {
    state.mood = mood;
    if (!silent) saveState();

    $$(".mood").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.mood === mood);
    });

    var copy = {
      bien: {
        text: "<strong>Qué bueno leer eso.</strong> Aprovecha el impulso: revisa tu ruta y descubre un servicio que todavía no conozcas.",
        actions: '<button data-screen="explorar">Explorar servicios</button><button data-screen="ruta">Ver mi ruta</button>'
      },
      cansado: {
        text: "<strong>Descansar también es parte de estudiar.</strong> Si llevas días así, una pausa activa o hablar con alguien puede ayudar.",
        actions: '<button data-book-service="cultura">Ver cultura y deporte</button><button data-screen="sami">Hablar con Sami</button>'
      },
      ansioso: {
        text: "<strong>Gracias por decirlo.</strong> No tienes que esperar a estar al límite. El apoyo psicológico es gratuito y confidencial.",
        actions: '<button data-book-service="psicologia">Agendar apoyo psicológico</button><button data-screen="sami">Hablar con Sami</button>'
      },
      hablar: {
        text: "<strong>Estoy aquí para escucharte.</strong> Puedes contarme lo que pasa o pedir una cita con una persona del equipo.",
        actions: '<button data-screen="sami">Abrir Sami</button><button data-book-service="psicologia">Pedir una cita</button>'
      }
    };

    var selected = copy[mood];
    if (!selected) return;
    $("#moodText").innerHTML = selected.text;
    $("#moodActions").innerHTML = selected.actions;
    $("#moodResponse").hidden = false;
  }

  /* ---------- Explorar ---------- */
  function searchable(service) {
    return norm([
      service.name, service.category, service.short, service.description,
      service.keywords, (service.tags || []).join(" "), (service.forYou || []).join(" ")
    ].join(" "));
  }

  function renderExplore() {
    var query = norm(ui.query);
    var filtered = SERVICES.filter(function (service) {
      var matchesCategory = ui.filter === "todos" || service.category === ui.filter;
      var matchesQuery = !query || searchable(service).indexOf(query) !== -1;
      return matchesCategory && matchesQuery;
    });

    var count = $("#resultCount");
    if (count) count.textContent = filtered.length + (filtered.length === 1 ? " servicio" : " servicios");

    var list = $("#serviceList");
    if (list) {
      list.innerHTML = filtered.map(function (service) {
        return '<button class="service-card" data-service="' + esc(service.id) + '" aria-label="Abrir ficha de ' + esc(service.name) + '">' +
          svcIcon(service) +
          '<span class="svc-copy">' +
            '<span class="svc-cat">' + esc(service.category) + "</span>" +
            "<strong>" + esc(service.name) + "</strong>" +
            '<span class="svc-desc">' + esc(service.short) + "</span>" +
          "</span>" +
          '<span class="svc-arrow">' + icon("chevron-right") + "</span>" +
          "</button>";
      }).join("");
    }

    var empty = $("#emptyState");
    if (empty) empty.hidden = filtered.length > 0;
    var clear = $("#clearSearch");
    if (clear) clear.hidden = !ui.query;
    $$(".filter").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.filter === ui.filter);
    });
  }

  /* ---------- Detalle ---------- */
  function renderDetail(id) {
    var service = BY_ID[id] || SERVICES[0];
    if (!service) return;
    ui.serviceId = service.id;
    var saved = state.saved.indexOf(service.id) !== -1;

    var tags = (service.tags || []).slice(0, 2);
    var hero = '<div class="detail-hero">' +
      '<div class="detail-top">' +
        '<button class="icon-btn" data-back aria-label="Volver">' + icon("chevron-left") + "</button>" +
        '<div class="detail-top-actions">' +
          '<button class="icon-btn" data-action="share-service" aria-label="Compartir servicio">' + icon("external") + "</button>" +
          '<button class="icon-btn" data-action="save-service" aria-label="' + (saved ? "Quitar de guardados" : "Guardar servicio") + '">' +
            icon(saved ? "bookmark-fill" : "bookmark") +
          "</button>" +
        "</div>" +
      "</div>" +
      '<div class="detail-title">' +
        '<span class="svc-cat">' + esc(service.category) + "</span>" +
        "<h2>" + esc(service.name) + "</h2>" +
        '<div class="detail-badges">' + tags.map(function (tag) {
          return "<span>" + icon("check") + esc(tag) + "</span>";
        }).join("") + "</div>" +
      "</div>" +
    "</div>";

    var body = '<div class="detail-body">' +
      '<p class="detail-lead">' + esc(service.short) + "</p>" +
      '<div class="quick-facts">' +
        '<div class="quick-fact">' + icon("clock") + "<strong>" + esc(service.duration) + "</strong><span>Duración</span></div>" +
        '<div class="quick-fact">' + icon(service.modality === "Presencial" ? "map-pin" : "video") + "<strong>" + esc(service.modality) + "</strong><span>Modalidad</span></div>" +
        '<div class="quick-fact">' + icon("calendar") + "<strong>" + esc(service.requires) + "</strong><span>Acceso</span></div>" +
      "</div>" +
      '<div class="detail-accordion">' +
        '<details class="detail-acc">' +
          "<summary><span>" + icon("book") + "De qué se trata</span>" + icon("chevron-right") + "</summary>" +
          '<div class="acc-body"><p class="detail-desc">' + esc(service.description) + "</p></div>" +
        "</details>" +
        '<details class="detail-acc">' +
          "<summary><span>" + icon("heart") + "Te sirve si…</span>" + icon("chevron-right") + "</summary>" +
          '<div class="acc-body"><ul class="check-list">' +
            (service.forYou || []).map(function (item) {
              return "<li>" + icon("check") + "<span>" + esc(item) + "</span></li>";
            }).join("") +
          "</ul></div>" +
        "</details>" +
        '<details class="detail-acc">' +
          "<summary><span>" + icon("route") + "Cómo funciona</span>" + icon("chevron-right") + "</summary>" +
          '<div class="acc-body"><ol class="step-list">' +
            (service.steps || []).map(function (step, index) {
              return "<li><b>" + (index + 1) + "</b><p>" + esc(step) + "</p></li>";
            }).join("") +
          "</ol></div>" +
        "</details>" +
        '<details class="detail-acc">' +
          "<summary><span>" + icon("map-pin") + "Dónde y cuándo</span>" + icon("chevron-right") + "</summary>" +
          '<div class="acc-body"><div class="info-panel">' +
            '<div class="info-row">' + icon("clock") + "<div><strong>Horario</strong><span>" + esc(service.schedule) + "</span></div></div>" +
            '<div class="info-row">' + icon("map-pin") + "<div><strong>Lugar</strong><span>" + esc(service.place) + "</span></div></div>" +
            '<div class="info-row">' + icon("mail") + "<div><strong>Contacto</strong><span>" + esc(service.contact) + "</span></div></div>" +
          "</div></div>" +
        "</details>" +
        '<details class="detail-acc">' +
          "<summary><span>" + icon("info") + "Ten en cuenta</span>" + icon("chevron-right") + "</summary>" +
          '<div class="acc-body"><p class="detail-note">' + esc(service.note) + "</p></div>" +
        "</details>" +
      "</div>" +
      '<div class="privacy-box">' + icon("shield") +
        "<p>Lo que compartes es confidencial. Sami es un prototipo y no reemplaza la atención de un profesional.</p>" +
      "</div>" +
    "</div>";

    $("#detailScroll").innerHTML = hero + body;
    $("#detailCta").innerHTML =
      '<button class="cta-icon' + (saved ? " is-saved" : "") + '" data-action="save-service" aria-label="' +
        (saved ? "Quitar de guardados" : "Guardar servicio") + '">' + icon(saved ? "bookmark-fill" : "bookmark") + "</button>" +
      '<button class="btn btn-primary" data-action="start-booking">' + esc(service.cta) + " " + icon("arrow-right") + "</button>";
  }

  function syncSaveButtons() {
    var saved = state.saved.indexOf(ui.serviceId) !== -1;
    $$('[data-action="save-service"]').forEach(function (button) {
      button.classList.toggle("is-saved", saved);
      button.setAttribute("aria-label", saved ? "Quitar de guardados" : "Guardar servicio");
      var use = button.querySelector("use");
      if (use) use.setAttribute("href", saved ? "#i-bookmark-fill" : "#i-bookmark");
    });
  }

  function toggleSaved() {
    var id = ui.serviceId;
    var index = state.saved.indexOf(id);
    var service = BY_ID[id];
    if (index === -1) {
      state.saved.push(id);
      showToast("Guardado en Mi ruta.");
    } else {
      state.saved.splice(index, 1);
      showToast("Se quitó de tus guardados.");
    }
    state.steps.saved = state.saved.length > 0;
    saveState();
    syncSaveButtons();
  }

  /* ---------- Agendar ---------- */
  function startBooking(serviceId, options) {
    options = options || {};
    var service = BY_ID[serviceId] || SERVICES[0];
    if (!service) return;
    var dates = nextDates(6);
    var canVirtual = norm(service.modality).indexOf("virtual") !== -1;
    var booking = {
      serviceId: service.id,
      dates: dates,
      date: dates[0].iso,
      modality: options.modality || (canVirtual ? "Virtual" : "Presencial"),
      first: true,
      rescheduleId: options.rescheduleId || null,
      time: null
    };
    booking.time = firstAvailableTime(booking, booking.date);
    ui.booking = booking;
    ui.serviceId = service.id;
    paintBooking();
  }

  function slotsFor(booking, dateISO) {
    var index = booking.dates.findIndex(function (date) { return date.iso === dateISO; });
    if (index < 0) index = 0;
    return BASE_TIMES.map(function (time, position) {
      return { time: time, disabled: ((index * 5 + position) % 7) === 5 };
    });
  }

  function firstAvailableTime(booking, dateISO) {
    var slots = slotsFor(booking, dateISO);
    for (var i = 0; i < slots.length; i += 1) {
      if (!slots[i].disabled) return slots[i].time;
    }
    return slots[0].time;
  }

  function paintBooking() {
    var booking = ui.booking;
    if (!booking) return;
    var service = BY_ID[booking.serviceId];
    if (!service) return;
    var canVirtual = norm(service.modality).indexOf("virtual") !== -1;
    var canPresencial = norm(service.modality).indexOf("presencial") !== -1;

    $("#bookingScroll").innerHTML =
      '<div class="booking-head">' +
        '<button class="icon-btn" data-back aria-label="Volver">' + icon("chevron-left") + "</button>" +
        "<div><strong>" + (booking.rescheduleId ? "Reprogramar cita" : "Agendar cita") + "</strong><span>" + esc(service.name) + "</span></div>" +
      "</div>" +
      '<div class="booking-body">' +
        '<div class="booking-service">' + svcIcon(service) + "<div><strong>" + esc(service.name) + "</strong><span>" +
          esc(service.category + " · " + service.duration) + "</span></div></div>" +
        '<span class="booking-label">Modalidad</span>' +
        '<div class="segmented" id="modalityGroup">' +
          '<button type="button" data-modality="Virtual"' + (canVirtual ? "" : " disabled") + ">" + icon("video") + " Virtual</button>" +
          '<button type="button" data-modality="Presencial"' + (canPresencial ? "" : " disabled") + ">" + icon("map-pin") + " Presencial</button>" +
        "</div>" +
        '<span class="booking-label">Elige el día</span>' +
        '<div class="date-scroll" id="dateGroup">' +
          booking.dates.map(function (date) {
            return '<button type="button" class="date-btn' + (date.iso === booking.date ? " is-active" : "") + '" data-date="' + date.iso + '">' +
              "<span>" + date.day + "</span><strong>" + date.number + "</strong><small>" + date.month.toUpperCase() + "</small></button>";
          }).join("") +
        "</div>" +
        '<span class="booking-label">Elige la hora</span>' +
        '<div class="time-grid" id="timeGroup"></div>' +
        '<span class="booking-label">¿Es tu primera vez en este servicio?</span>' +
        '<div class="chip-select" id="firstGroup">' +
          '<button type="button" data-first="true">Sí, es mi primera vez</button>' +
          '<button type="button" data-first="false">Ya he venido antes</button>' +
        "</div>" +
        '<p class="booking-note">' + icon("shield") + " Tus datos se usan solo para gestionar la cita. Recibirás el recordatorio por WhatsApp y podrás cambiarla desde Mi ruta.</p>" +
      "</div>";

    paintBookingTimes();
    paintBookingSelection();
  }

  function paintBookingTimes() {
    var booking = ui.booking;
    var group = $("#timeGroup");
    if (!booking || !group) return;
    group.innerHTML = slotsFor(booking, booking.date).map(function (slot) {
      return '<button type="button" class="time-btn' + (slot.time === booking.time ? " is-active" : "") + '" data-time="' +
        esc(slot.time) + '"' + (slot.disabled ? " disabled" : "") + ">" + esc(slot.time) + "</button>";
    }).join("");
  }

  function paintBookingSelection() {
    var booking = ui.booking;
    if (!booking) return;
    $$("#dateGroup [data-date]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.date === booking.date);
    });
    $$("#timeGroup [data-time]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.time === booking.time);
    });
    $$("#modalityGroup [data-modality]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.modality === booking.modality);
    });
    $$("#firstGroup [data-first]").forEach(function (button) {
      button.classList.toggle("is-active", String(booking.first) === button.dataset.first);
    });

    $("#bookingAction").innerHTML =
      '<button class="btn btn-primary" data-action="confirm-booking">Confirmar cita · ' +
        esc(shortDate(booking.date)) + ", " + esc(booking.time) + "</button>" +
      "<small>Recibirás un recordatorio por WhatsApp.</small>";
  }

  function confirmBooking() {
    var booking = ui.booking;
    if (!booking) return;
    var service = BY_ID[booking.serviceId];
    if (!service) return;

    var appointment = {
      id: booking.rescheduleId || ("ap-" + Date.now()),
      code: "RB-" + String(Math.floor(1000 + Math.random() * 9000)),
      serviceId: service.id,
      date: booking.date,
      time: booking.time,
      modality: booking.modality,
      first: booking.first,
      createdAt: new Date().toISOString()
    };

    if (booking.rescheduleId) {
      var index = state.appointments.findIndex(function (item) { return item.id === booking.rescheduleId; });
      if (index >= 0) state.appointments[index] = appointment;
      else state.appointments.unshift(appointment);
    } else {
      state.appointments.unshift(appointment);
    }

    state.steps.booked = true;
    saveState();
    ui.lastAppointment = appointment;
    goTo("confirmacion");
    showToast("Cita confirmada. Te enviaremos el recordatorio por WhatsApp.");
  }

  function renderConfirm(appointment) {
    var container = $("#confirmScroll");
    if (!container) return;
    if (!appointment) {
      container.innerHTML = '<div class="confirm-body"><div class="route-empty"><p>Todavía no tienes una cita. Agenda una cuando quieras.</p>' +
        '<button data-screen="explorar">Explorar servicios</button></div></div>';
      return;
    }
    var service = BY_ID[appointment.serviceId];
    if (!service) return;
    var date = parseISO(appointment.date);

    container.innerHTML =
      '<div class="confirm-hero">' +
        '<span class="confirm-check">' + icon("check") + "</span>" +
        "<h2>Tu cita quedó agendada</h2>" +
        "<p>Te esperamos. Te enviaremos un recordatorio y podrás gestionarla desde Mi ruta.</p>" +
      "</div>" +
      '<div class="confirm-body">' +
        '<div class="ticket">' +
          '<div class="ticket-top">' +
            '<div class="ticket-service">' + svcIcon(service) + "<div><strong>" + esc(service.name) + "</strong><span>" +
              esc(service.category) + "</span></div></div>" +
            '<div class="ticket-grid">' +
              '<div class="ticket-item">' + icon("calendar") + "<div><small>Fecha</small><strong>" + esc(longDate(appointment.date)) + "</strong></div></div>" +
              '<div class="ticket-item">' + icon("clock") + "<div><small>Hora</small><strong>" + esc(appointment.time) + "</strong></div></div>" +
              '<div class="ticket-item">' + icon("video") + "<div><small>Modalidad</small><strong>" + esc(appointment.modality) + "</strong></div></div>" +
              '<div class="ticket-item">' + icon("map-pin") + "<div><small>Lugar</small><strong>" + esc(service.place.replace(" · Sede Cúcuta", "")) + "</strong></div></div>" +
            "</div>" +
          "</div>" +
          '<div class="ticket-code"><div><small>Código de la cita</small><strong>' + esc(appointment.code) + "</strong></div>" +
            '<span class="qr-fake">' + icon("qr") + "</span></div>" +
        "</div>" +
        '<div class="reminder-row">' + icon("whatsapp") +
          "<span><strong>Recordatorio por WhatsApp</strong>Te avisaremos un día antes. Podrás confirmar o cancelar.</span>" +
        "</div>" +
        '<div class="confirm-actions">' +
          '<button class="btn btn-primary" data-action="download-ics">' + icon("calendar") + " Agregar a mi calendario</button>" +
          '<button class="btn btn-secondary" data-screen="ruta">Ver en Mi ruta</button>' +
          '<button class="confirm-link" data-screen="home">Volver al inicio</button>' +
        "</div>" +
      "</div>";
  }

  /* ---------- Calendario (.ics) ---------- */
  function parseTime(label) {
    var match = String(label).match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i);
    if (!match) return { hours: 9, minutes: 0 };
    var hours = Number(match[1]);
    var minutes = Number(match[2]);
    if (match[3].toLowerCase() === "p" && hours < 12) hours += 12;
    if (match[3].toLowerCase() === "a" && hours === 12) hours = 0;
    return { hours: hours, minutes: minutes };
  }

  function icsStamp(date) {
    return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) +
      "T" + pad(date.getHours()) + pad(date.getMinutes()) + "00";
  }

  function icsEscape(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function downloadICS() {
    var appointment = ui.lastAppointment || state.appointments[0];
    if (!appointment) {
      showToast("Primero agenda una cita.");
      return;
    }
    var service = BY_ID[appointment.serviceId];
    if (!service) return;
    var time = parseTime(appointment.time);
    var start = parseISO(appointment.date);
    start.setHours(time.hours, time.minutes, 0, 0);
    var numbers = String(service.duration).match(/\d+/g) || ["45"];
    var minutes = Number(numbers[numbers.length - 1]);
    var end = new Date(start.getTime() + minutes * 60000);

    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ruta Bienestar//Prototipo academico//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + appointment.code + "@rutabienestar.unisimon.edu.co",
      "DTSTAMP:" + icsStamp(new Date()),
      "DTSTART:" + icsStamp(start),
      "DTEND:" + icsStamp(end),
      "SUMMARY:" + icsEscape("Ruta Bienestar · " + service.name),
      "DESCRIPTION:" + icsEscape("Cita simulada del prototipo Ruta Bienestar. Código: " + appointment.code + ". Modalidad: " + appointment.modality + "."),
      "LOCATION:" + icsEscape(service.place),
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    var blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "ruta-bienestar-" + appointment.code + ".ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast("Archivo .ics descargado. Puedes abrirlo en tu calendario.");
  }

  /* ---------- Mi ruta ---------- */
  function renderRoute() {
    var done = routeProgress();
    var upcoming = state.appointments.length;

    var overview = '<div class="route-overview">' +
      '<div class="route-overview-top"><span class="pill-light">Tu ruta</span><span class="route-count">' +
        done + "<span>/5</span></span></div>" +
      "<h3>" + (done >= 5 ? "Tu red de apoyo está activa." : "Vas construyendo tu red de apoyo.") + "</h3>" +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="' + done + '" aria-label="' + done + ' de 5 pasos completados"><i style="width:' + (done * 20) + '%"></i></div>' +
      '<div class="route-overview-foot"><span>' + done + " de 5 pasos completados</span><strong>" + (done * 20) + "%</strong></div>" +
    "</div>";

    var tabs = '<div class="route-tabs" role="group" aria-label="Secciones de Mi ruta">' +
      '<button type="button" data-route-tab="citas" aria-pressed="' + (ui.routeTab === "citas" ? "true" : "false") + '" class="' + (ui.routeTab === "citas" ? "is-active" : "") + '">Citas · ' + upcoming + "</button>" +
      '<button type="button" data-route-tab="pasos" aria-pressed="' + (ui.routeTab === "pasos" ? "true" : "false") + '" class="' + (ui.routeTab === "pasos" ? "is-active" : "") + '">Mis pasos</button>' +
      '<button type="button" data-route-tab="guardados" aria-pressed="' + (ui.routeTab === "guardados" ? "true" : "false") + '" class="' + (ui.routeTab === "guardados" ? "is-active" : "") + '">Guardados · ' + state.saved.length + "</button>" +
    "</div>";

    var panel = "";
    if (ui.routeTab === "citas") panel = routeAppointments();
    if (ui.routeTab === "pasos") panel = routeSteps();
    if (ui.routeTab === "guardados") panel = routeSaved();

    var profile = '<div class="profile-note">' + icon("shield") +
      "<p><strong>Tu perfil:</strong> " + esc(state.profile.semester) + "º semestre · " + esc(state.profile.modality) +
      " · " + esc(state.profile.faculty) + ". <button data-screen=\"onboarding\" style=\"color:inherit;font-weight:800;text-decoration:underline\">Editar</button></p>" +
    "</div>";

    $("#routeContent").innerHTML = overview + tabs + panel + profile;
  }

  function routeAppointments() {
    if (!state.appointments.length) {
      return '<div class="route-empty"><p><strong>Aún no tienes citas.</strong><br>Agenda la primera y aquí verás la fecha, el lugar y los recordatorios.</p>' +
        '<button data-book-service="psicologia">Agendar mi primera cita</button></div>';
    }

    return '<div class="checklist">' + state.appointments.map(function (appointment) {
      var service = BY_ID[appointment.serviceId];
      if (!service) return "";
      var date = parseISO(appointment.date);
      return '<article class="appointment-card">' +
        '<div class="appointment-head">' +
          '<span class="date-tile"><span>' + MONTHS[date.getMonth()].toUpperCase() + "</span><strong>" + date.getDate() + "</strong></span>" +
          '<div class="appointment-copy"><strong>' + esc(service.name) + "</strong>" +
            "<span>" + esc(longDate(appointment.date)) + " · " + esc(appointment.time) + "</span>" +
            "<span>" + esc(appointment.modality) + " · Código " + esc(appointment.code) + "</span></div>" +
          '<span class="status-pill">Confirmada</span>' +
        "</div>" +
        '<div class="appointment-actions">' +
          '<button type="button" data-action="reschedule" data-id="' + esc(appointment.id) + '">Reprogramar</button>' +
          '<button type="button" data-action="cancel" data-id="' + esc(appointment.id) + '">Cancelar</button>' +
        "</div>" +
      "</article>";
    }).join("") + "</div>";
  }

  function routeSteps() {
    var steps = [
      { key: "onboarding", title: "Completa tu perfil", copy: "Semestre, modalidad y necesidades." },
      { key: "explored", title: "Explora un servicio", copy: "Encuentra apoyo por situación de vida." },
      { key: "saved", title: "Guarda un servicio", copy: "Tenlo a mano para cuando lo necesites." },
      { key: "booked", title: "Agenda tu primera cita", copy: "Elige día, hora y modalidad." },
      { key: "attended", title: "Asiste y cuéntanos", copy: "Tu experiencia mejora el servicio." }
    ];

    return '<div class="checklist">' + steps.map(function (step) {
      var complete = !!state.steps[step.key];
      return '<div class="check-item">' +
        '<span class="check-circle' + (complete ? " is-done" : "") + '">' + icon(complete ? "check" : "clock") + "</span>" +
        "<div><strong>" + esc(step.title) + "</strong><span>" + esc(step.copy) + "</span></div>" +
        (complete ? icon("check") : "") +
      "</div>";
    }).join("") + "</div>" +
    (state.steps.booked && !state.steps.attended
      ? '<button class="confirm-link" data-action="mark-attended">Ya asistí a mi cita</button>'
      : "");
  }

  function routeSaved() {
    if (!state.saved.length) {
      return '<div class="route-empty"><p><strong>No tienes servicios guardados.</strong><br>Guarda los que te interesen para encontrarlos rápido.</p>' +
        '<button data-screen="explorar">Explorar servicios</button></div>';
    }
    return '<div class="checklist">' + state.saved.map(function (id) {
      var service = BY_ID[id];
      if (!service) return "";
      return '<button class="saved-item" data-service="' + esc(service.id) + '">' + svcIcon(service) +
        "<div><strong>" + esc(service.name) + "</strong><span>" + esc(service.category) + " · " + esc(service.short) + "</span></div>" +
        icon("chevron-right") + "</button>";
    }).join("") + "</div>";
  }

  /* ---------- Sami ---------- */
  function ensureChat() {
    if (ui.chatSeeded) return;
    var scroll = $("#chatScroll");
    if (!scroll) return;
    scroll.innerHTML = '<div class="chat-day">Hoy</div>';
    appendChat("sami",
      "Hola, <strong>" + esc(state.profile.name) + "</strong>. Soy <strong>Sami</strong>, tu asistente de Bienestar. " +
      "Puedo ayudarte a encontrar el servicio que necesitas o agendar una cita. ¿Qué está pasando hoy?"
    );
    setQuickReplies(DEFAULT_QUICK);
    ui.chatSeeded = true;
  }

  function appendChat(role, html) {
    var scroll = $("#chatScroll");
    if (!scroll) return;
    var wrapper = document.createElement("div");
    wrapper.className = "msg" + (role === "user" ? " msg--user" : "");
    wrapper.innerHTML =
      (role === "user" ? "" : '<span class="msg-avatar">' + icon("sparkles") + "</span>") +
      '<div class="msg-bubble">' + html + '<span class="msg-time">' + esc(nowLabel()) + "</span></div>";
    scroll.appendChild(wrapper);
    scrollChat();
  }

  function scrollChat() {
    var scroll = $("#chatScroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  function setQuickReplies(items) {
    var container = $("#quickReplies");
    if (!container) return;
    container.innerHTML = (items || []).map(function (item) {
      return '<button type="button" data-quick="' + esc(item) + '">' + esc(item) + "</button>";
    }).join("");
  }

  function showTyping() {
    hideTyping();
    var scroll = $("#chatScroll");
    if (!scroll) return;
    var wrapper = document.createElement("div");
    wrapper.className = "msg";
    wrapper.id = "typingMessage";
    wrapper.innerHTML = '<span class="msg-avatar">' + icon("sparkles") + "</span>" +
      '<span class="typing" aria-label="Sami está escribiendo"><i></i><i></i><i></i></span>';
    scroll.appendChild(wrapper);
    scrollChat();
  }

  function hideTyping() {
    var typing = $("#typingMessage");
    if (typing) typing.remove();
  }

  function detectService(text) {
    var key = norm(text);
    var rules = [
      { id: "psicologia", re: /ansiedad|ansios|triste|depres|estres|estresado|emocion|salud mental|psicolog|panico|soledad|me siento solo|me siento sola|prioritaria|urgencia/ },
      { id: "becas", re: /beca|auxilio|dinero|plata|matricula|econom|descuento|pagar|financi|sostenimiento/ },
      { id: "academico", re: /materia|examen|parcial|tutor|monitoria|estudiar|nota|clase|profesor|profesora|perdi|perdí|refuerzo|academ|asesor/ },
      { id: "profesional", re: /futuro|carrera|empleo|trabajo|hoja de vida|entrevista|practica|posgrado|graduar|vocacion/ },
      { id: "emprendimiento", re: /emprend|negocio|idea|startup|innov|proyecto/ },
      { id: "inclusion", re: /inclusion|discapac|ajuste|diversidad|barrera|genero|condicion/ },
      { id: "cultura", re: /deporte|cultura|arte|musica|teatro|danza|recrea|tiempo libre|torneo|pausa activa/ },
      { id: "salud", re: /salud|medic|enfermer|aliment|sueno|dieta|cuerpo|sexual/ }
    ];
    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].re.test(key)) return BY_ID[rules[i].id];
    }
    return null;
  }

  function chatServiceCard(service) {
    return '<div class="msg-card">' +
      '<div class="msg-card-head">' + svcIcon(service) +
        "<div><strong>" + esc(service.name) + "</strong><span>" + esc(service.category + " · " + service.duration) + "</span></div>" +
      "</div>" +
      '<div class="msg-card-actions">' +
        '<button type="button" data-service="' + esc(service.id) + '">Ver ficha</button>' +
        '<button type="button" data-book-service="' + esc(service.id) + '">Agendar</button>' +
      "</div>" +
    "</div>";
  }

  function replyFor(text) {
    var key = norm(text);
    var service = detectService(text);
    var wantsBooking = /cita|agendar|agenda|reservar|cupo/.test(key);

    if (/suicid|matarme|hacerme dano|no quiero vivir|quitarme la vida|autolesion|me quiero morir|emergencia/.test(key)) {
      return {
        html: "<strong>Lo que sientes importa y no tienes que enfrentarlo solo o sola.</strong><br>" +
          "Si estás en peligro o pensando en hacerte daño, llama ahora al <strong>123</strong> o a la <strong>Línea 106</strong>. " +
          "En la U, el apoyo psicológico tiene atención prioritaria y es confidencial." +
          (BY_ID.psicologia ? chatServiceCard(BY_ID.psicologia) : ""),
        quick: ["Quiero una cita prioritaria", "Hablar con una persona"]
      };
    }

    if (/persona|humano|asesor real|hablar con alguien|psicologo real|derivar/.test(key)) {
      return {
        html: "Puedo conectarte con una persona del equipo de Bienestar. En el piloto, este botón abriría WhatsApp con una persona real; " +
          "la atención es de lunes a viernes, 8:00 a. m. a 5:00 p. m." +
          '<div class="msg-card"><div class="msg-card-head"><span class="svc-icon" data-tone="mint">' + icon("users") + "</span>" +
          "<div><strong>Continuar con una persona</strong><span>Equipo de Bienestar · Lun–vie</span></div></div>" +
          '<div class="msg-card-actions"><button type="button" data-action="human-handoff">Abrir WhatsApp</button>' +
          '<button type="button" data-quick="Quiero agendar una cita">Agendar cita</button></div></div>',
        quick: ["Ver apoyo psicológico", "Volver al inicio"]
      };
    }

    if (/^(hola|holi|buenas|buen dia|hey|que tal)/.test(key)) {
      return {
        html: "¡Hola! Cuéntame con tus palabras qué está pasando. Puedo orientarte con lo académico, lo emocional, lo económico o tu futuro profesional.",
        quick: DEFAULT_QUICK
      };
    }

    if (/gracias|muchas gracias|listo|perfecto/.test(key)) {
      return {
        html: "Con gusto. Recuerda que puedes volver cuando quieras: tu ruta queda guardada y Sami está disponible 24/7.",
        quick: ["Ver mi ruta", "Explorar servicios", "Hablar con una persona"]
      };
    }

    if (service && wantsBooking) {
      return {
        html: "Perfecto. Te llevo a elegir día y hora con <strong>" + esc(service.name) + "</strong>. La cita es gratuita.",
        quick: ["Ver todos los servicios", "Hablar con una persona"]
      };
    }

    if (service) {
      return {
        html: "Entiendo. Para eso te puede ayudar <strong>" + esc(service.name) + "</strong>. Es gratuito y puedes agendar cuando quieras." +
          chatServiceCard(service),
        quick: ["Quiero agendar una cita", "Ver otros servicios", "Hablar con una persona"]
      };
    }

    if (wantsBooking) {
      return {
        html: "Claro. ¿Sobre qué servicio quieres agendar? Puedes decírmelo o elegir una opción.",
        quick: ["Psicología", "Asesoría académica", "Becas y auxilios"]
      };
    }

    if (/servicios|opciones|directorio|que tienes|que ofrecen/.test(key)) {
      return {
        html: "En Ruta Bienestar hay 8 servicios gratuitos: académico, psicológico, económico, profesional, emprendimiento, inclusión, cultura y salud. " +
          "Puedes verlos todos en Explorar o decirme qué necesitas." +
          '<div class="msg-actions"><button type="button" data-screen="explorar">Abrir Explorar</button></div>',
        quick: DEFAULT_QUICK
      };
    }

    return {
      html: "Puedo orientarte con temas académicos, emocionales, económicos, de futuro profesional o de comunidad. " +
        "Cuéntame con tus palabras qué necesitas, o elige una opción.",
      quick: DEFAULT_QUICK
    };
  }

  function applyChatAction(service, wantsBooking) {
    if (service && wantsBooking) {
      setTimeout(function () {
        ui.serviceId = service.id;
        goTo("agendar", { serviceId: service.id });
      }, 350);
    }
  }

  function sendUserMessage(text, options) {
    options = options || {};
    var value = String(text || "").trim();
    if (!value) return;

    ensureChat();
    appendChat("user", esc(value));
    var input = $("#chatInput");
    if (input) input.value = "";

    var key = norm(value);
    var service = detectService(value);
    var wantsBooking = /cita|agendar|agenda|reservar|cupo/.test(key);
    var reply = replyFor(value);

    function deliver() {
      hideTyping();
      appendChat("sami", reply.html);
      setQuickReplies(reply.quick || DEFAULT_QUICK);
      applyChatAction(service, wantsBooking);
    }

    if (options.instant) {
      if (ui.chatTimer) window.clearTimeout(ui.chatTimer);
      deliver();
      return;
    }

    if (ui.chatTimer) window.clearTimeout(ui.chatTimer);
    showTyping();
    ui.chatTimer = window.setTimeout(deliver, 560);
  }

  /* ---------- Onboarding ---------- */
  function cloneProfile() {
    return {
      name: state.profile.name,
      semester: state.profile.semester,
      modality: state.profile.modality,
      faculty: state.profile.faculty,
      needs: (state.profile.needs || []).slice()
    };
  }

  function renderOnboarding() {
    var draft = ui.draft || cloneProfile();
    ui.draft = draft;
    var body = $("#onbBody");
    if (!body) return;

    var bar = $("#onbBar");
    if (bar) bar.style.width = [25, 50, 75, 100][Math.min(ui.onbStep, 3)] + "%";

    if (ui.onbStep === 0) {
      var returning = state.onboardingDone;
      body.innerHTML = '<div class="onb-hero">' +
        '<span class="onb-mark"><svg class="logo-mark" aria-hidden="true"><use href="#logo-mark"/></svg></span>' +
        '<span class="onb-eyebrow">' + (returning ? "Tu perfil" : "Bienvenido/a a Ruta Bienestar") + "</span>" +
        "<h2>" + (returning ? "Ajusta tu <em>ruta</em>." : "Tu U te <em>escucha</em>.") + "</h2>" +
        '<p class="onb-lead">' + (returning
          ? "Actualiza tus datos para que las recomendaciones y los recordatorios sean más útiles para ti."
          : "En 60 segundos te mostramos los apoyos que ya existen para ti. Sin papeleo, sin adivinar dependencias y sin tener que contar todo.") + "</p>" +
        '<ul class="onb-points">' +
          "<li><span>" + icon("check") + "</span>Servicios gratuitos y confidenciales.</li>" +
          "<li><span>" + icon("check") + "</span>Recomendaciones según tu momento.</li>" +
          "<li><span>" + icon("check") + "</span>Puedes cambiarlo cuando quieras.</li>" +
        "</ul>" +
        '<div class="onb-actions">' +
          '<button class="btn btn-primary" data-onb="start">' + (returning ? "Editar mi perfil (60 s)" : "Empezar (60 s)") + "</button>" +
          '<button class="onb-link" data-onb="skip">Ahora no, solo quiero explorar</button>' +
        "</div>" +
      "</div>";
      return;
    }

    if (ui.onbStep === 1) {
      body.innerHTML = '<div class="onb-step-head">' +
        '<span class="onb-eyebrow">Paso 1 de 3</span>' +
        "<h2>Cuéntanos de ti</h2>" +
        "<p>Estos datos se quedan en tu dispositivo. No se comparten con nadie.</p>" +
      "</div>" +
      '<div class="field"><label for="onbName">¿Cómo te llamas?</label>' +
        '<input id="onbName" type="text" maxlength="40" autocomplete="given-name" value="' + esc(draft.name) + '" placeholder="Tu nombre"></div>' +
      '<div class="field"><label for="onbSemester">Semestre</label><select id="onbSemester">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (number) {
          return '<option value="' + number + '"' + (String(draft.semester) === String(number) ? " selected" : "") + ">" + number + "º semestre</option>";
        }).join("") + "</select></div>" +
      '<div class="field"><label>Modalidad</label><div class="onb-seg" id="onbModality">' +
        ["Presencial", "Virtual", "Híbrida"].map(function (item) {
          return '<button type="button" data-onb-modality="' + item + '" class="' + (draft.modality === item ? "is-active" : "") + '">' + item + "</button>";
        }).join("") + "</div></div>" +
      '<div class="field"><label for="onbFaculty">Programa</label><select id="onbFaculty">' +
        ["Ingeniería Industrial", "Ingeniería de Sistemas", "Administración de Empresas", "Contaduría Pública", "Derecho", "Psicología", "Comunicación Social", "Otra"].map(function (item) {
          return '<option value="' + item + '"' + (draft.faculty === item ? " selected" : "") + ">" + item + "</option>";
        }).join("") + "</select></div>" +
      '<div class="onb-actions"><button class="btn btn-primary" data-onb="next">Continuar</button></div>';
      return;
    }

    if (ui.onbStep === 2) {
      body.innerHTML = '<div class="onb-step-head">' +
        '<span class="onb-eyebrow">Paso 2 de 3</span>' +
        "<h2>¿Qué apoyo te interesa?</h2>" +
        "<p>Elige todo lo que aplique. No es una etiqueta: es una forma de mostrarte lo que sí existe.</p>" +
      "</div>" +
      '<div class="onb-chips">' +
        Object.keys(NEED_ICONS).map(function (need) {
          return '<button type="button" class="onb-chip' + (draft.needs.indexOf(need) !== -1 ? " is-active" : "") +
            '" data-need="' + esc(need) + '">' + icon(NEED_ICONS[need]) + esc(need) + "</button>";
        }).join("") +
      "</div>" +
      '<div class="onb-summary"><span>Tu selección</span><strong id="needsSummary">' + esc(needsSummary(draft.needs)) + "</strong></div>" +
      '<div class="onb-actions">' +
        '<button class="btn btn-primary" data-onb="next">Ver mi ruta</button>' +
        '<button class="onb-link" data-onb="skip">Prefiero no decirlo</button>' +
      "</div>";
      return;
    }

    body.innerHTML = '<div class="onb-success">' +
      '<span class="onb-success-icon">' + icon("check") + "</span>" +
      '<span class="onb-eyebrow">Tu ruta está lista</span>' +
      "<h2>Empieza hoy, <em>" + esc(draft.name.split(/\s+/)[0] || "estudiante") + "</em>.</h2>" +
      "<p>Ya sabemos qué apoyos mostrarte primero. Puedes cambiarlo desde Mi ruta cuando quieras.</p>" +
      '<div class="onb-summary"><span>Tu perfil</span><strong>' +
        esc(draft.semester + "º semestre · " + draft.modality + " · " + draft.faculty) + "<br>" +
        esc(needsSummary(draft.needs)) + "</strong></div>" +
      '<div class="onb-actions">' +
        '<button class="onb-link" data-onb="finish">Ir a mi inicio</button>' +
        '<button class="onb-link" data-onb="finish-explore">Explorar servicios</button>' +
      "</div>" +
    "</div>";
  }

  function needsSummary(needs) {
    if (!needs || !needs.length) return "Sin preferencias por ahora";
    return "Te interesa: " + needs.join(" · ");
  }

  function syncDraftFromForm() {
    if (!ui.draft) ui.draft = cloneProfile();
    var name = $("#onbName");
    var semester = $("#onbSemester");
    var faculty = $("#onbFaculty");
    if (name) ui.draft.name = name.value;
    if (semester) ui.draft.semester = semester.value;
    if (faculty) ui.draft.faculty = faculty.value;
  }

  function handleOnb(action) {
    if (!ui.draft) ui.draft = cloneProfile();
    if (action === "start") {
      ui.onbStep = 1;
      renderOnboarding();
      return;
    }
    if (action === "next") {
      if (ui.onbStep === 1) {
        syncDraftFromForm();
        if (!ui.draft.name.trim()) {
          showToast("Escribe tu nombre para personalizar la ruta.");
          var input = $("#onbName");
          if (input) input.focus();
          return;
        }
        ui.draft.name = ui.draft.name.trim();
        ui.onbStep = 2;
        renderOnboarding();
      } else if (ui.onbStep === 2) {
        saveDraftProfile();
        ui.onbStep = 3;
        renderOnboarding();
      }
      return;
    }
    if (action === "skip") {
      state.onboardingDone = true;
      state.steps.onboarding = true;
      saveState();
      goTo("home");
      showToast("Puedes personalizar tu ruta cuando quieras desde tu perfil.");
      return;
    }
    if (action === "finish" || action === "finish-explore") {
      if (ui.onbStep === 3) saveDraftProfile();
      state.onboardingDone = true;
      state.steps.onboarding = true;
      saveState();
      updateProfileUI();
      if (action === "finish-explore") {
        goTo("explorar");
        showToast("Tu ruta se actualizó. Estos apoyos son para ti.");
      } else {
        goTo("home");
        showToast("Tu ruta se actualizó. Bienvenido/a.");
      }
    }
  }

  function saveDraftProfile() {
    if (!ui.draft) return;
    state.profile = {
      name: ui.draft.name.trim() || "Estudiante",
      semester: ui.draft.semester || "1",
      modality: ui.draft.modality || "Presencial",
      faculty: ui.draft.faculty || "Otra",
      needs: (ui.draft.needs || []).slice()
    };
    state.onboardingDone = true;
    state.steps.onboarding = true;
    saveState();
    updateProfileUI();
  }

  /* ---------- Notificaciones ---------- */
  function openNotifications() {
    var sheet = $("#notificationsSheet");
    var backdrop = $("#sheetBackdrop");
    if (!sheet || !backdrop) return;
    if (ui.sheetTimer) window.clearTimeout(ui.sheetTimer);
    sheet.hidden = false;
    sheet.inert = false;
    sheet.removeAttribute("inert");
    backdrop.hidden = false;
    sheet.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(function () {
      sheet.classList.add("is-open");
      backdrop.classList.add("is-open");
    });
    state.notificationsRead = true;
    saveState();
    syncNotificationBadges();
  }

  function closeNotifications() {
    var sheet = $("#notificationsSheet");
    var backdrop = $("#sheetBackdrop");
    if (!sheet || !backdrop) return;
    sheet.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    sheet.inert = true;
    sheet.setAttribute("inert", "");
    ui.sheetTimer = window.setTimeout(function () {
      sheet.hidden = true;
      backdrop.hidden = true;
    }, 280);
  }

  /* ---------- Toast ---------- */
  function showToast(message, duration) {
    var toast = $("#toast");
    if (!toast) return;
    if (ui.toastTimer) window.clearTimeout(ui.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    ui.toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, duration || 3000);
  }

  /* ---------- Demo ---------- */
  function enterDemo() {
    document.body.classList.add("demo-mode");
    window.scrollTo(0, 0);
    ui.history = [];
    goTo("home", { push: false });
    updateNavigation();
  }

  function exitDemo() {
    document.body.classList.remove("demo-mode");
    var stage = $("#prototipo");
    if (stage) stage.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetAll() {
    try {
      window.localStorage.removeItem(STORE_KEY);
    } catch (error) {
      /* Sin persistencia disponible. */
    }
    state = defaultState();
    ui.history = [];
    ui.serviceId = "academico";
    ui.query = "";
    ui.filter = "todos";
    ui.routeTab = "citas";
    ui.booking = null;
    ui.lastAppointment = null;
    ui.onbStep = 0;
    ui.draft = null;
    ui.chatSeeded = false;
    if (ui.chatTimer) window.clearTimeout(ui.chatTimer);
    var chat = $("#chatScroll");
    if (chat) chat.innerHTML = "";
    var search = $("#serviceSearch");
    if (search) search.value = "";
    setQuickReplies([]);
    closeNotifications();
    renderHome();
    renderExplore();
    renderRoute();
    goTo("home", { push: false });
    showToast("Demo reiniciado con los datos de ejemplo.");
  }

  /* ---------- Acciones ---------- */
  function handleAction(action, element) {
    if (action === "focus-demo") {
      enterDemo();
      return;
    }
    if (action === "exit-demo") {
      exitDemo();
      return;
    }
    if (action === "reset-demo") {
      resetAll();
      return;
    }
    if (action === "notifications") {
      openNotifications();
      return;
    }
    if (action === "close-sheet") {
      closeNotifications();
      return;
    }
    if (action === "sami-info") {
      showToast("Sami usa una base de conocimiento revisada por Bienestar. Si detecta riesgo, deriva a una persona. En este prototipo las respuestas son simuladas.", 5600);
      return;
    }
    if (action === "save-service") {
      toggleSaved();
      return;
    }
    if (action === "share-service") {
      var service = BY_ID[ui.serviceId];
      var text = service ? service.name + " · Ruta Bienestar USB" : "Ruta Bienestar USB";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + " — " + window.location.href).catch(function () {});
      }
      showToast("Enlace del servicio copiado.");
      return;
    }
    if (action === "start-booking") {
      goTo("agendar", { serviceId: ui.serviceId });
      return;
    }
    if (action === "confirm-booking") {
      confirmBooking();
      return;
    }
    if (action === "download-ics") {
      downloadICS();
      return;
    }
    if (action === "human-handoff") {
      showToast("En el piloto, este botón abriría WhatsApp con una persona de Bienestar (lun–vie, 8:00 a. m. – 5:00 p. m.).", 5200);
      return;
    }
    if (action === "reschedule") {
      var appointment = state.appointments.filter(function (item) { return item.id === element.dataset.id; })[0];
      if (appointment) {
        goTo("agendar", {
          serviceId: appointment.serviceId,
          rescheduleId: appointment.id,
          modality: appointment.modality
        });
      }
      return;
    }
    if (action === "cancel") {
      state.appointments = state.appointments.filter(function (item) { return item.id !== element.dataset.id; });
      state.steps.booked = state.appointments.length > 0;
      if (!state.steps.booked) state.steps.attended = false;
      saveState();
      renderRoute();
      showToast("Cita cancelada. Puedes agendar de nuevo cuando quieras.");
      return;
    }
    if (action === "mark-attended") {
      state.steps.attended = true;
      saveState();
      renderRoute();
      showToast("Gracias por contarnos. Tu ruta avanzó un paso.");
    }
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("click", function (event) {
    var back = event.target.closest("[data-back]");
    if (back) {
      backFrom();
      return;
    }

    var onb = event.target.closest("[data-onb]");
    if (onb) {
      handleOnb(onb.dataset.onb);
      return;
    }

    var actionElement = event.target.closest("[data-action]");
    if (actionElement) {
      handleAction(actionElement.dataset.action, actionElement);
      return;
    }

    var screenElement = event.target.closest("[data-screen]:not(.screen)");
    if (screenElement) {
      event.preventDefault();
      goTo(screenElement.dataset.screen);
      return;
    }

    var bookElement = event.target.closest("[data-book-service]");
    if (bookElement) {
      openService(bookElement.dataset.bookService, true);
      return;
    }

    var serviceElement = event.target.closest("[data-service]");
    if (serviceElement) {
      openService(serviceElement.dataset.service, false);
      return;
    }

    var goElement = event.target.closest("[data-go-service]");
    if (goElement) {
      openService(goElement.dataset.goService, false);
      return;
    }

    var filter = event.target.closest("[data-filter]");
    if (filter) {
      ui.filter = filter.dataset.filter;
      renderExplore();
      return;
    }

    var mood = event.target.closest("[data-mood]");
    if (mood) {
      setMood(mood.dataset.mood);
      return;
    }

    var need = event.target.closest("[data-need]");
    if (need) {
      if (!ui.draft) ui.draft = cloneProfile();
      var value = need.dataset.need;
      var index = ui.draft.needs.indexOf(value);
      if (index === -1) ui.draft.needs.push(value);
      else ui.draft.needs.splice(index, 1);
      need.classList.toggle("is-active");
      var summary = $("#needsSummary");
      if (summary) summary.textContent = needsSummary(ui.draft.needs);
      return;
    }

    var onbModality = event.target.closest("[data-onb-modality]");
    if (onbModality) {
      if (!ui.draft) ui.draft = cloneProfile();
      ui.draft.modality = onbModality.dataset.onbModality;
      $$("#onbModality [data-onb-modality]").forEach(function (button) {
        button.classList.toggle("is-active", button === onbModality);
      });
      return;
    }

    var routeTab = event.target.closest("[data-route-tab]");
    if (routeTab) {
      ui.routeTab = routeTab.dataset.routeTab;
      renderRoute();
      return;
    }

    var dateButton = event.target.closest("[data-date]");
    if (dateButton && ui.booking) {
      ui.booking.date = dateButton.dataset.date;
      var slots = slotsFor(ui.booking, ui.booking.date);
      var currentValid = slots.some(function (slot) { return slot.time === ui.booking.time && !slot.disabled; });
      if (!currentValid) ui.booking.time = firstAvailableTime(ui.booking, ui.booking.date);
      paintBookingTimes();
      paintBookingSelection();
      return;
    }

    var timeButton = event.target.closest("[data-time]");
    if (timeButton && ui.booking) {
      if (timeButton.disabled) return;
      ui.booking.time = timeButton.dataset.time;
      paintBookingSelection();
      return;
    }

    var modality = event.target.closest("[data-modality]");
    if (modality && ui.booking) {
      if (modality.disabled) return;
      ui.booking.modality = modality.dataset.modality;
      paintBookingSelection();
      return;
    }

    var firstTime = event.target.closest("[data-first]");
    if (firstTime && ui.booking) {
      ui.booking.first = firstTime.dataset.first === "true";
      paintBookingSelection();
      return;
    }

    var quick = event.target.closest("[data-quick]");
    if (quick) {
      sendUserMessage(quick.dataset.quick);
    }
  });

  document.addEventListener("input", function (event) {
    if (event.target.id === "serviceSearch") {
      ui.query = event.target.value;
      renderExplore();
    }
    if (event.target.id === "onbName" && ui.draft) {
      ui.draft.name = event.target.value;
    }
  });

  document.addEventListener("change", function (event) {
    if (!ui.draft) return;
    if (event.target.id === "onbSemester") ui.draft.semester = event.target.value;
    if (event.target.id === "onbFaculty") ui.draft.faculty = event.target.value;
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    var sheet = $("#notificationsSheet");
    if (sheet && sheet.classList.contains("is-open")) {
      closeNotifications();
      return;
    }
    if (document.body.classList.contains("demo-mode")) exitDemo();
  });

  /* ---------- Inicialización ---------- */
  function init() {
    var search = $("#serviceSearch");
    if (search) {
      search.addEventListener("search", function () {
        ui.query = search.value;
        renderExplore();
      });
    }

    var clear = $("#clearSearch");
    if (clear) {
      clear.addEventListener("click", function () {
        ui.query = "";
        if (search) {
          search.value = "";
          search.focus();
        }
        renderExplore();
      });
    }

    var form = $("#chatForm");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = $("#chatInput");
        if (!input) return;
        sendUserMessage(input.value);
        input.value = "";
      });
    }

    var backdrop = $("#sheetBackdrop");
    if (backdrop) {
      backdrop.addEventListener("click", closeNotifications);
    }

    var onbBack = $("#onbBack");
    if (onbBack) {
      onbBack.addEventListener("click", function () {
        if (ui.onbStep > 0) {
          ui.onbStep -= 1;
          renderOnboarding();
        } else {
          goTo("home");
        }
      });
    }

    var onbSkip = $("#onbSkip");
    if (onbSkip) {
      onbSkip.addEventListener("click", function () {
        handleOnb("skip");
      });
    }

    renderHome();
    renderExplore();
    renderRoute();
    updateNavigation();
    syncNotificationBadges();

    try {
      var requested = new URLSearchParams(window.location.search).get("screen");
      if (requested && $$(".screen").some(function (screen) { return screen.dataset.screen === requested; })) {
        goTo(requested, { push: false });
      }
    } catch (error) {
      /* La navegación por enlace directo es opcional. */
    }

    document.documentElement.dataset.rutaReady = "1";
  }

  /* API para capturas automatizadas y revisión. */
  window.RutaBienestar = {
    goTo: goTo,
    openService: function (id) { openService(id, false); },
    book: function (id) { openService(id, true); },
    confirm: confirmBooking,
    chat: function (text) { sendUserMessage(text, { instant: true }); },
    mood: function (value) { setMood(value); },
    notifications: openNotifications,
    closeNotifications: closeNotifications,
    reset: resetAll,
    demo: enterDemo,
    state: function () { return JSON.parse(JSON.stringify(state)); },
    screens: function () { return $$(".screen").map(function (screen) { return screen.dataset.screen; }); }
  };

  init();
})();
