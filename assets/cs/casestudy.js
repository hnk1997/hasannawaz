/* ------------------------------------------------------------
   Hasan Nawaz — homepage behaviour
   ------------------------------------------------------------ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- image skeleton loading ----------
     .is-img-loaded lifts the shimmer/opacity-0 state set in CSS. Images
     already served from cache report .complete === true synchronously,
     before a 'load' event would ever fire — checking that first avoids
     every cached image sitting invisible forever waiting on an event
     that already happened. */
  var skeletonImgs = document.querySelectorAll('img');
  Array.prototype.forEach.call(skeletonImgs, function (img) {
    if (img.complete) {
      img.classList.add('is-img-loaded');
    } else {
      img.addEventListener('load', function () { img.classList.add('is-img-loaded'); });
      img.addEventListener('error', function () { img.classList.add('is-img-loaded'); });
    }
  });

  /* ---------- mobile menu ----------
     Full-screen overlay, Apple-style — lock page scroll behind it
     while it's open, same as the sheet apple.com's menu opens into. */
  var burger = document.getElementById('burger');
  var links = document.querySelector('.nav__links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      document.body.classList.toggle('nav-open', open);
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        document.body.classList.remove('nav-open');
      }
    });
  }

  /* ---------- hero headline rotator ----------
     Sequential, non-overlapping ticker: the outgoing line fully drifts
     up and fades out first; only once that finishes does the incoming
     line start drifting up from below and fading in. The two phases
     never run at the same time, so there's no moment with both lines
     partially visible — same spring easing throughout (--spring-fade /
     .hero__line in style.css) for a smooth, single-direction feel. */
  var lines = Array.prototype.slice.call(document.querySelectorAll('.hero__line'));
  var icons = Array.prototype.slice.call(document.querySelectorAll('.hero__icon'));
  var PHASE_MS = 450;   // matches the .hero__line transition duration
  var DWELL_MS = 2200;  // full cycle: exit, then enter, then hold — quick enough that a hiring manager skimming for a few seconds still sees all three lines

  if (lines.length > 1 && !reduced) {
    var i = 0;
    setInterval(function () {
      var outgoing = lines[i];
      var outgoingIcon = icons[i];
      var incomingIdx = (i + 1) % lines.length;
      outgoing.classList.remove('is-active');
      outgoing.classList.add('is-leaving');
      if (outgoingIcon) {
        outgoingIcon.classList.remove('is-active');
        outgoingIcon.classList.add('is-leaving');
      }

      setTimeout(function () {
        outgoing.classList.remove('is-leaving');
        if (outgoingIcon) outgoingIcon.classList.remove('is-leaving');
        i = incomingIdx;
        lines[i].classList.add('is-active');
        if (icons[i]) icons[i].classList.add('is-active');
      }, PHASE_MS);
    }, DWELL_MS);
  }

  /* ---------- Apple-style appear on page load ---------- */
  var hero = document.querySelector('.hero');
  if (hero) {
    if (reduced) {
      hero.classList.add('is-loaded');
      if (icons[0]) icons[0].classList.add('is-active');
    } else {
      // A short setTimeout (rather than requestAnimationFrame) so the
      // trigger still fires promptly even if the tab isn't foregrounded
      // yet when this script runs — rAF callbacks are paused in that case.
      setTimeout(function () {
        hero.classList.add('is-loaded');
        // the first icon starts with no .is-active class in the HTML
        // (unlike the first .hero__line) so this triggers the same
        // spring pop-in transition it gets on every later rotation,
        // instead of just appearing instantly at full size.
        if (icons[0]) icons[0].classList.add('is-active');
      }, 30);
    }
  }

  /* ---------- scroll reveal ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduced) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- animated stat counters ---------- */
  var nums = document.querySelectorAll('.stat__num[data-count], .cs-statcard__num[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1000;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = prefix + (0).toFixed(decimals) + suffix;
    requestAnimationFrame(frame);
  }

  if (nums.length) {
    if (!('IntersectionObserver' in window) || reduced) {
      // leave the static markup value in place
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      Array.prototype.forEach.call(nums, function (el) { cio.observe(el); });
    }
  }

  /* ---------- click email to copy, instead of opening a mail client ---------- */
  var emailLinks = document.querySelectorAll('.js-copy-email');
  Array.prototype.forEach.call(emailLinks, function (el) {
    var label = el.querySelector('.js-copy-email-label');
    var originalLabel = label ? label.textContent : null;
    var originalAriaLabel = el.getAttribute('aria-label');
    var resetTimer = null;
    // icon-only links (e.g. the footer mail icon) have no text label to
    // swap, so a small "Copied" tooltip is created on demand instead —
    // otherwise the click looks like it did nothing.
    var tip = null;

    el.addEventListener('click', function (e) {
      var email = el.getAttribute('data-email');
      if (!email || !navigator.clipboard) return; // fall back to mailto:
      e.preventDefault();
      navigator.clipboard.writeText(email).then(function () {
        clearTimeout(resetTimer);
        if (label) {
          label.textContent = 'Copied';
        } else {
          if (!tip) {
            tip = document.createElement('span');
            tip.className = 'js-copy-email__tip';
            tip.textContent = 'Copied';
            el.appendChild(tip);
          }
        }
        el.setAttribute('aria-label', 'Email copied');
        el.classList.add('is-copied');
        resetTimer = setTimeout(function () {
          if (label) label.textContent = originalLabel;
          if (originalAriaLabel) el.setAttribute('aria-label', originalAriaLabel);
          else el.removeAttribute('aria-label');
          el.classList.remove('is-copied');
        }, 1800);
      });
    });
  });
})();
