(function () {
  "use strict";

  var $  = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktopScroll = function () { return matchMedia("(min-width: 960px)").matches; };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  /* ---------- Nav: solid background once scrolled ---------- */
  function initNavSolid() {
    var nav = $(".nav");
    var track = $("[data-hscroll]");
    if (!nav) return;
    function check() {
      var scrolled = isDesktopScroll() && track ? track.scrollLeft > 40 : scrollY > 40;
      nav.classList.toggle("is-scrolled", scrolled);
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    if (track) track.addEventListener("scroll", check, { passive: true });
  }

  /* ---------- Mobile hamburger nav ---------- */
  function initMobileNav() {
    var burger = $("[data-nav-burger]");
    var panel = $("[data-nav-mobile]");
    if (!burger || !panel) return;
    function close() {
      burger.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("nav-open");
    }
    function open() {
      burger.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("nav-open");
    }
    burger.addEventListener("click", function () {
      var isOpen = burger.getAttribute("aria-expanded") === "true";
      if (isOpen) close(); else open();
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    window.__closeMobileNav = close;
  }

  /* ---------- Smooth anchor navigation (nav links + scroll hints) ---------- */
  function initAnchorNav() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        inline: "start",
        block: "start"
      });
      if (typeof window.__closeMobileNav === "function") window.__closeMobileNav();
    });
  }

  /* ---------- Active nav tab (scroll-spy) ---------- */
  function initScrollSpy() {
    var links = $$("[data-nav-link]");
    var panels = $$("[data-panel]");
    var track = $("[data-hscroll]");
    if (!links.length || !panels.length) return;

    var observer = null;
    function build() {
      if (observer) observer.disconnect();
      var root = isDesktopScroll() && track ? track : null;
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.intersectionRatio > 0.55) {
            var id = "#" + entry.target.id;
            links.forEach(function (l) {
              l.classList.toggle("is-active", l.getAttribute("href") === id);
            });
          }
        });
      }, { root: root, threshold: [0.55] });
      panels.forEach(function (p) { observer.observe(p); });
    }

    build();
    var to;
    window.addEventListener("resize", function () {
      clearTimeout(to);
      to = setTimeout(build, 300);
    });
  }

  /* ---------- Horizontal wheel-to-scroll (desktop only) ---------- */
  function initHorizontalWheel() {
    var track = $("[data-hscroll]");
    if (!track) return;
    track.addEventListener("wheel", function (e) {
      if (!isDesktopScroll()) return;
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      track.scrollBy({ left: e.deltaY * 1.2, behavior: "auto" });
    }, { passive: false });
  }

  /* ---------- Left/right edge navigation arrows ---------- */
  function initHscrollArrows() {
    var track = $("[data-hscroll]");
    var prevBtn = $("[data-hscroll-prev]");
    var nextBtn = $("[data-hscroll-next]");
    if (!track || !prevBtn || !nextBtn) return;
    var panels = $$("[data-panel]");

    function currentIndex() {
      var mid = track.scrollLeft + track.clientWidth / 2;
      var idx = 0;
      panels.forEach(function (p, i) {
        if (p.offsetLeft <= mid) idx = i;
      });
      return idx;
    }

    function update() {
      if (!isDesktopScroll()) return;
      var atStart = track.scrollLeft <= 2;
      var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      prevBtn.classList.toggle("is-hidden", atStart);
      nextBtn.classList.toggle("is-hidden", atEnd);
    }

    function goTo(index) {
      if (!panels[index]) return;
      panels[index].scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        inline: "start",
        block: "start"
      });
    }

    prevBtn.addEventListener("click", function () { goTo(currentIndex() - 1); });
    nextBtn.addEventListener("click", function () { goTo(currentIndex() + 1); });

    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------- Skills stagger animation: replays every time it's scrolled into view ---------- */
  function initSkillsAnimation() {
    var el = $(".skills-row");
    var track = $("[data-hscroll]");
    if (!el) return;

    var observer = null;
    function build() {
      if (observer) observer.disconnect();
      var root = isDesktopScroll() && track ? track : null;
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          el.classList.toggle("is-revealed", entry.isIntersecting);
        });
      }, { root: root, threshold: 0.3 });
      observer.observe(el);
    }

    build();
    var to;
    window.addEventListener("resize", function () {
      clearTimeout(to);
      to = setTimeout(build, 300);
    });
  }

  /* ---------- Land on #about by default (Resume sits before it in the DOM) ---------- */
  function initInitialPosition() {
    var target = location.hash ? document.querySelector(location.hash) : null;
    if (!target) target = $("#about");
    if (!target) return;
    target.scrollIntoView({ behavior: "auto", inline: "start", block: "start" });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var els = $$("[data-reveal], [data-reveal-mask]");
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      els.forEach(function (el) {
        if (!el.classList.contains("is-revealed") && el.getBoundingClientRect().top < innerHeight) {
          el.classList.add("is-revealed");
        }
      });
    }, 6000);
  }

  /* ---------- Gallery lightbox ---------- */
  function initLightbox() {
    var lightbox = $("[data-lightbox]");
    if (!lightbox) return;
    var imgEl = $("[data-lightbox-img]", lightbox);
    var closeBtn = $("[data-lightbox-close]", lightbox);
    var prevBtn = $("[data-lightbox-prev]", lightbox);
    var nextBtn = $("[data-lightbox-next]", lightbox);

    var currentGroup = [];
    var currentIndex = 0;
    var lastFocused = null;

    function show(index) {
      if (!currentGroup.length) return;
      currentIndex = (index + currentGroup.length) % currentGroup.length;
      var item = currentGroup[currentIndex];
      imgEl.src = item.src;
      imgEl.alt = item.alt || "";
    }

    function open(group, index) {
      currentGroup = group;
      lastFocused = document.activeElement;
      show(index);
      lightbox.setAttribute("aria-hidden", "false");
      closeBtn.focus();
    }

    function close() {
      lightbox.setAttribute("aria-hidden", "true");
      imgEl.src = "";
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    $$("[data-gallery]").forEach(function (gallery) {
      var thumbs = $$("[data-gallery-item]", gallery);
      var group = thumbs.map(function (btn) {
        var img = $("img", btn);
        return { src: img.src, alt: img.alt };
      });
      thumbs.forEach(function (btn, i) {
        btn.addEventListener("click", function () { open(group, i); });
      });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(currentIndex - 1); });
    nextBtn.addEventListener("click", function () { show(currentIndex + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (lightbox.getAttribute("aria-hidden") === "true") return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(currentIndex - 1);
      if (e.key === "ArrowRight") show(currentIndex + 1);
    });
  }

  /* ---------- YouTube IFrame API: grayscale toggle + scroll-safe shield ---------- */
  function initYTPlayers() {
    var iframes = $$("iframe[id^='yt-player-']");
    if (!iframes.length) return;
    var players = {};

    // Shield sits over the iframe so wheel/scroll keeps working on hover;
    // a click starts playback and hands control over to the real YouTube UI.
    $$("[data-video-shield]").forEach(function (shield) {
      shield.addEventListener("click", function () {
        var frame = shield.closest(".video-frame");
        var iframe = frame ? frame.querySelector("iframe[id^='yt-player-']") : null;
        var player = iframe ? players[iframe.id] : null;
        if (player && typeof player.playVideo === "function") {
          player.playVideo();
        }
      });
    });

    // Load the YouTube IFrame API script
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    // YouTube API calls this global function when ready
    window.onYouTubeIframeAPIReady = function () {
      iframes.forEach(function (iframe) {
        var frame = iframe.closest(".video-frame");
        players[iframe.id] = new YT.Player(iframe.id, {
          events: {
            onStateChange: function (event) {
              if (!frame) return;
              if (event.data === YT.PlayerState.PLAYING) {
                frame.classList.add("video-frame--playing");
              } else if (
                event.data === YT.PlayerState.PAUSED ||
                event.data === YT.PlayerState.ENDED
              ) {
                frame.classList.remove("video-frame--playing");
              }
            }
          }
        });
      });
    };
  }

  /* ---------- i18n Internationalization ---------- */
  var translations = {
    en: {
      skip_link: "Skip to content",
      nav_resume: "Resume",
      nav_about: "About",
      nav_contact: "Contact",
      resume_kicker: "Resume",
      resume_exp_title: "Experience",
      resume_role_freepik: "3D Modeling Team Lead",
      resume_edu_title: "Education",
      resume_present: "Present",
      resume_degree: "Multimedia Engineer",
      resume_unad: "UNAD University",
      resume_course: "Unity Developer",
      resume_sw_title: "Software",
      resume_skills_title: "Skills",
      skills_team_mgmt: "Team Management",
      skills_workflow_opt: "Workflows Optimization",
      skills_ai_tools: "AI tools",
      resume_lang_title: "Languages",
      lang_spanish: "Spanish",
      lang_spanish_level: "Native",
      lang_english: "English",
      cv_download: "Download CV ↓",
      cv_href: "assets/cv/CV-Daniel-Bonilla-Unity-Dev-EN.pdf",
      about_kicker: "Portfolio · 2026",
      about_role: "Unity Dev",
      about_bio: "Unity Developer passionate about gameplay programming and interactive experiences. I specialize in C#, Unity, and object-oriented programming, always striving to build clean systems, solve technical challenges, and keep learning with every project.",
      about_portrait_label: "Unity Dev · Daniel Bonilla",
      project_01_index: "Project · 01",
      p1_tagline: "A 2D video game about depression and hope.",
      p1_desc: "An arcade experience where every single thought can draw you closer to hope or plunge you into the void.",
      p1_task_1: "Gameplay Mechanics and Systems Design",
      p1_task_2: "Sound Implementation (SFX and Music)",
      p1_task_3: "Environmental Level Design (Parallax)",
      p1_task_4: "UI Implementation",
      p1_view_project: "View Project →",
      project_code: "Code →",
      project_02_index: "Project · 02",
      p2_tagline: "3D simulation of a medieval tavern",
      p2_desc: "A medieval tavern simulation game built in Unity, featuring a system for mixing drinks and delivering orders.",
      p2_task_1: "Recipe and Drink Mixing System Design",
      p2_task_2: "NPC AI Implementation",
      p2_task_3: "Dynamic Customer Spawn System",
      p2_task_4: "Game State Machine Implementation",
      p2_view_project: "View Project →",
      project_03_index: "Project · 03",
      p3_tagline: "Web-based 3D model visualizer",
      p3_desc: "An interactive 3D viewer that leverages advanced rendering techniques to deliver high-performance graphics and fluid web interactivity.",
      p3_task_1: "Developed an interactive 3D model web viewer",
      p3_task_2: "Implemented an optimized rendering pipeline",
      p3_task_3: "Integrated 3D model loading and display",
      p3_task_4: "Designed and implemented UI/UX for the viewer",
      p3_view_project: "View Project →",
      contact_kicker: "Contact",
      contact_headline: "Let's work<br>together.",
      contact_note: "Open to collaborations, freelance projects, and full-time opportunities.",
      contact_email: "Email. danielbonilla0542@gmail.com",
      contact_phone: "Phone. +57 315 517 0055"
    },
    es: {
      skip_link: "Saltar al contenido",
      nav_resume: "Resumen",
      nav_about: "Sobre mí",
      nav_contact: "Contacto",
      resume_kicker: "Resumen",
      resume_exp_title: "Experiencia",
      resume_role_freepik: "Líder de Equipo de Modelado 3D",
      resume_edu_title: "Educación",
      resume_present: "Presente",
      resume_degree: "Ingeniería Multimedia",
      resume_unad: "Universidad UNAD",
      resume_course: "Desarrollador Unity",
      resume_sw_title: "Software",
      resume_skills_title: "Habilidades",
      skills_team_mgmt: "Gestión de Equipos",
      skills_workflow_opt: "Optimización de Flujos",
      skills_ai_tools: "Herramientas de IA",
      resume_lang_title: "Idiomas",
      lang_spanish: "Español",
      lang_spanish_level: "Nativo",
      lang_english: "Inglés",
      cv_download: "Descargar CV ↓",
      cv_href: "assets/cv/CV-Daniel-Bonilla-Unity-Dev-ES.pdf",
      about_kicker: "Portafolio · 2026",
      about_role: "Dev Unity",
      about_bio: "Desarrollador Unity apasionado por la programación de gameplay y las experiencias interactivas. Me especializo en C#, Unity y programación orientada a objetos, buscando siempre construir sistemas limpios, resolver desafíos técnicos y seguir aprendiendo en cada proyecto.",
      about_portrait_label: "Dev Unity · Daniel Bonilla",
      project_01_index: "Proyecto · 01",
      p1_tagline: "Un videojuego 2D sobre la depresión y la esperanza.",
      p1_desc: "Una experiencia arcade donde cada pensamiento puede acercarte a la esperanza o sumergirte en el vacío.",
      p1_task_1: "Diseño de mecánicas de gameplay y sistemas",
      p1_task_2: "Implementación de sonido (SFX y Música)",
      p1_task_3: "Diseño de niveles y entorno (Parallax)",
      p1_task_4: "Implementación de interfaz de usuario (UI)",
      p1_view_project: "Ver Proyecto →",
      project_code: "Código →",
      project_02_index: "Proyecto · 02",
      p2_tagline: "Simulación 3D de una taberna medieval",
      p2_desc: "Juego de simulación de taberna medieval desarrollado en Unity, con un sistema de preparación de bebidas y entrega de pedidos.",
      p2_task_1: "Diseño de sistema de recetas y mezcla de bebidas",
      p2_task_2: "Implementación de IA para NPCs",
      p2_task_3: "Sistema de generación dinámica de clientes",
      p2_task_4: "Implementación de máquina de estados del juego",
      p2_view_project: "Ver Proyecto →",
      project_03_index: "Proyecto · 03",
      p3_tagline: "Visualizador web de modelos 3D",
      p3_desc: "Un visualizador 3D interactivo que aprovecha técnicas avanzadas de renderizado para ofrecer gráficos de alto rendimiento e interactividad web fluida.",
      p3_task_1: "Desarrollo de un visualizador web interactivo de modelos 3D",
      p3_task_2: "Implementación de un pipeline de renderizado optimizado",
      p3_task_3: "Integración de carga y visualización de modelos 3D",
      p3_task_4: "Diseño e implementación de la UI/UX para el visualizador",
      p3_view_project: "Ver Proyecto →",
      contact_kicker: "Contacto",
      contact_headline: "Trabajemos<br>juntos.",
      contact_note: "Abierto a colaboraciones, proyectos freelance y oportunidades a tiempo completo.",
      contact_email: "Correo. danielbonilla0542@gmail.com",
      contact_phone: "Teléfono. +57 315 517 0055"
    }
  };

  function setLanguage(lang) {
    if (!translations[lang]) return;
    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var translation = translations[lang][key];
      if (translation !== undefined) {
        if (translation.indexOf("<") !== -1) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    $$("[data-i18n-href]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-href");
      var href = translations[lang][key];
      if (href) el.setAttribute("href", href);
    });

    $$("[data-lang-btn]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang-btn") === lang);
    });

    try {
      localStorage.setItem("pref-lang", lang);
    } catch (e) {}
  }

  function initI18n() {
    var stored = null;
    try {
      stored = localStorage.getItem("pref-lang");
    } catch (e) {}

    var initialLang = stored || (navigator.language && navigator.language.startsWith("es") ? "es" : "en");

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-lang-btn]");
      if (btn) {
        var lang = btn.getAttribute("data-lang-btn");
        setLanguage(lang);
      }
    });

    setLanguage(initialLang);
  }

  function boot() {
    safe(initI18n, "initI18n");
    safe(initInitialPosition, "initInitialPosition");
    safe(initNavSolid, "initNavSolid");
    safe(initMobileNav, "initMobileNav");
    safe(initAnchorNav, "initAnchorNav");
    safe(initScrollSpy, "initScrollSpy");
    safe(initHorizontalWheel, "initHorizontalWheel");
    safe(initHscrollArrows, "initHscrollArrows");
    safe(initSkillsAnimation, "initSkillsAnimation");
    safe(initReveals, "initReveals");
    safe(initLightbox, "initLightbox");
    safe(initYTPlayers, "initYTPlayers");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
