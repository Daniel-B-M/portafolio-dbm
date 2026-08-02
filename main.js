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

  function boot() {
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
