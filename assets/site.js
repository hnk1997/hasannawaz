/* Runtime for the static taschiba.com replica.
   Reproduces the behaviours the Framer bundle provided: the conic-gradient blob
   loop, scroll-triggered reveals, the auto-hiding nav, and the small widgets. */
(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------------------------------------------------- scroll restoration --
  // Browsers restore the previous scroll offset on reload, which dropped you
  // mid-page and fought the entrance animation. Opt out and start at the top,
  // but honour a real #anchor if the URL carries one.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  function startAtTop() {
    if (location.hash) return;
    // Runs before paint on reload; the rAF covers a late browser restore.
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      if (!location.hash) window.scrollTo(0, 0);
    });
  }

  // ------------------------------------------------------ page transition ---
  // The wipe itself lives in shared.css, ported verbatim from Framer's own
  // implementation. Here we only run it and then drop the mask, so #main is
  // not left compositing a full-page mask for the rest of the session.
  const PAGE_MS = 700;

  function startPageTransition() {
    const main = document.getElementById("main");
    if (!main) return;
    // The class ships in the markup so the very first paint is already masked.
    // Adding it from this deferred script instead would show the whole page,
    // then blank it, which read as a flash before the wipe. All we do here is
    // strip the mask once the animation is done.
    const done = () => main.classList.remove("hn-page-enter");
    if (reduced) return done();
    main.addEventListener("animationend", done, { once: true });
    setTimeout(done, PAGE_MS + 250);   // fallback if the event never fires
  }

  // ------------------------------------------------------------- the blob ---
  // Outer rings: rotate 0→360deg, 6s linear, loop.
  // Inner conics: scale 1→0.8, 3s linear, mirror.
  function startBlob() {
    const rings = $$('[data-framer-name="Blur, Rotate"], [data-framer-name="Blur, Rotate, Blend"]');
    const conics = $$('[data-framer-name="Conic"]');
    if (!rings.length && !conics.length) return;

    if (reduced) {
      rings.forEach((el) => (el.style.transform = "translate(-50%, -50%) rotate(0deg)"));
      conics.forEach((el) => (el.style.transform = "scale(1)"));
      return;
    }

    rings.forEach((el) => {
      el.style.willChange = "transform";
      el.animate(
        [
          { transform: "translate(-50%, -50%) rotate(0deg)" },
          { transform: "translate(-50%, -50%) rotate(360deg)" },
        ],
        { duration: 6000, easing: "linear", iterations: Infinity }
      );
    });

    conics.forEach((el) => {
      el.style.willChange = "transform";
      el.animate([{ transform: "scale(1)" }, { transform: "scale(0.8)" }], {
        duration: 3000,
        easing: "linear",
        iterations: Infinity,
        direction: "alternate",
      });
    });
  }

  // --------------------------------------------------------- appear/reveal --
  // Travel and timing for the entrance. A single eased curve reads far more
  // smoothly than stepping a numerically-integrated spring frame by frame.
  const REVEAL_Y = 32;
  const REVEAL_MS = 700;
  const REVEAL_EASE = "cubic-bezier(.16,1,.3,1)";
  const FADE_MS = 420;
  const FADE_EASE = "cubic-bezier(.4,0,.2,1)";

  // One observer for every watched element. Rect reads happen off the main
  // thread here, unlike the old per-element scroll polling.
  const supportsIO = typeof IntersectionObserver === "function";
  const pending = new Map();
  const io = supportsIO && new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const job = pending.get(entry.target);
        if (!job) continue;
        // An element taller than the viewport can never reach a high ratio, so
        // treat "intersecting at all" as enough for those.
        const tall = entry.boundingClientRect.height > innerHeight * 0.9;
        if (entry.intersectionRatio >= job.want || (entry.isIntersecting && (tall || job.want === 0))) {
          pending.delete(entry.target);
          io.unobserve(entry.target);
          job.fn();
        }
      }
    },
    { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
  );

  function whenVisible(el, threshold, fn) {
    if (!supportsIO) return fn();
    pending.set(el, { fn, want: Math.min(threshold, 0.99) });
    io.observe(el);
  }

  // Safety net. A document that is hidden for its whole lifetime never gets
  // observer callbacks, and nothing revealed may then be stuck at opacity 0.
  // Run anything already within the viewport whenever the page comes forward.
  function flushPending() {
    for (const [el, job] of Array.from(pending)) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        pending.delete(el);
        io.unobserve(el);
        job.fn();
      }
    }
  }
  addEventListener("visibilitychange", () => {
    if (!document.hidden) flushPending();
  });

  const inViewport = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  };

  // Anything already on screen when the page loads simply fades in where it
  // sits. Sliding the hero up from below on first paint is what read as the
  // page "starting a bit below"; only content scrolled to later gets the rise.
  function reveal(el, { y = REVEAL_Y, threshold = 0.5, delay = 0 } = {}) {
    const settle = () => {
      el.style.opacity = "1";
      el.style.transform = "none";
      el.style.willChange = "auto";
    };
    if (reduced) return settle();

    // The inactive breakpoint variant of each block is display:none and has no
    // box, so it would otherwise be treated as off-screen and wait on an
    // observer that can never fire. Show it outright.
    if (!el.offsetWidth && !el.offsetHeight) return settle();

    const atLoad = inViewport(el);
    const dy = atLoad ? 0 : Math.min(y, REVEAL_Y);

    el.style.willChange = dy ? "transform, opacity" : "opacity";
    if (dy) el.style.transform = `translate3d(0,${dy}px,0)`;

    const run = () => {
      el.animate(
        dy
          ? [
              { transform: `translate3d(0,${dy}px,0)`, opacity: 0 },
              { transform: "translate3d(0,0,0)", opacity: 1 },
            ]
          : [{ opacity: 0 }, { opacity: 1 }],
        {
          duration: dy ? REVEAL_MS : FADE_MS,
          delay,
          fill: "forwards",
          easing: dy ? REVEAL_EASE : FADE_EASE,
        }
      ).finished.then(settle, () => {});
    };

    // No observer needed for what is already visible -- run it straight away.
    if (atLoad) run();
    else whenVisible(el, threshold, run);
  }

  function startReveals() {
    // Framer plays appear-id animations as soon as the document is ready.
    $$("[data-framer-appear-id]").forEach((el) => reveal(el, { threshold: 0 }));
    // Elements marked by the build with scroll-reveal metadata.
    $$("[data-reveal]").forEach((el) => {
      const cfg = JSON.parse(el.getAttribute("data-reveal") || "{}");
      reveal(el, cfg);
    });
  }

  // -------------------------------------------------------------- nav bar ---
  // The nav slides away while scrolling down and returns on scroll up.
  function startNav() {
    const nav = $(".framer-13xxqtg-container") || $("[data-nav-bar]");
    if (!nav) return;
    let last = window.scrollY;
    let hidden = false;
    nav.style.transition = "transform .4s cubic-bezier(.2,.8,.2,1), opacity .4s cubic-bezier(.2,.8,.2,1)";
    addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        const down = y > last && y > 64;
        if (down !== hidden) {
          hidden = down;
          nav.style.opacity = hidden ? "0" : "1";
          nav.style.transform = hidden ? "translateY(-100%)" : "translateY(0)";
        }
        last = y;
      },
      { passive: true }
    );
  }

  // --------------------------------------------------------- copy-to-email --
  function startCopyEmail() {
    $$("[data-copy-email], .framer-copy-email").forEach((el) => {
      const label = $("[data-copy-email-label]", el) || el;
      const original = label.textContent;
      let resetTimer = null;
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        const value = el.getAttribute("data-copy-email") || "hello@hasannawaz.com";
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        el.setAttribute("data-copied", "true");
        label.textContent = "Copied!";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          el.removeAttribute("data-copied");
          label.textContent = original;
        }, 1600);
      });
    });
  }

  // ------------------------------------------------------- metric counters --
  function startCounters() {
    $$("[data-counter-to]").forEach((el) => {
      const raw = el.getAttribute("data-counter-to");
      const to = parseFloat(raw);
      if (Number.isNaN(to)) return;
      const suffix = el.getAttribute("data-counter-suffix") || "";
      const decimals = (raw.split(".")[1] || "").length;
      // Most stats are deltas (+59%, -40%), so "+" is the right default for
      // any positive value. A rate like "22% adoption" isn't a delta though,
      // so data-counter-prefix="" opts a specific stat out of the auto-sign.
      const prefix = el.hasAttribute("data-counter-prefix")
        ? el.getAttribute("data-counter-prefix")
        : to > 0 ? "+" : "";
      const target = $("[data-counter-el]", el) || el;
      const format = (v) => prefix + v.toFixed(decimals) + suffix;

      let started = false;
      const run = () => {
        if (started) return;
        started = true;
        if (reduced) {
          target.textContent = format(to);
          return;
        }
        const start = performance.now();
        const duration = 1400;
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          target.textContent = format(to * eased);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };

      target.textContent = format(0);
      whenVisible(el, 0.4, run);

      // A jump-scroll (anchor link, scrollTo, restored position) can carry the
      // element past the viewport without it ever meeting the threshold, which
      // would strand the number at zero. Snap it once it is above the fold.
      const snapIfPassed = () => {
        if (started) return true;
        if (el.getBoundingClientRect().bottom >= 0) return false;
        started = true;
        target.textContent = format(to);
        return true;
      };
      addEventListener("scroll", function onScroll() {
        if (snapIfPassed()) removeEventListener("scroll", onScroll);
      }, { passive: true });
    });
  }

  // -------------------------------------------------------- nested links ----
  // Framer routes clicks on [data-nested-link] through a synthetic anchor.
  function startNestedLinks() {
    const open = (href, rel, target) => {
      const a = document.createElement("a");
      a.href = href;
      a.rel = rel;
      a.target = target;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    $$("[data-nested-link]").forEach((el) => {
      const go = (ev) => {
        const href = el.getAttribute("href");
        if (!href) return;
        ev.preventDefault();
        ev.stopPropagation();
        const meta = /Mac|iPod|iPhone|iPad/u.test(navigator.userAgent) ? ev.metaKey : ev.ctrlKey;
        if (meta) return open(href, "", "_blank");
        open(href, el.getAttribute("rel") || "", el.getAttribute("target") || "");
      };
      el.addEventListener("click", go);
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") go(ev);
      });
    });
  }

  // ------------------------------------------------------- passcode gate ----
  function startGate() {
    const form = $("[data-passcode-gate]");
    if (!form) return;
    const input = $("input[name=password]", form);
    const toggle = $("[data-toggle-passcode]", form);
    toggle?.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      input.style.borderColor = "rgb(220, 38, 38)";
      input.value = "";
      setTimeout(() => (input.style.borderColor = "rgb(204, 204, 204)"), 1200);
    });
  }

  // ------------------------------------------------------------------ init --
  const init = () => {
    startAtTop();
    startPageTransition();
    startBlob();
    startReveals();
    startNav();
    startCopyEmail();
    startCounters();
    startNestedLinks();
    startGate();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
