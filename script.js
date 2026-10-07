/* =====================================================================
   دانیال مرادی — Personal Brand Site
   script.js
   فهرست مطالب:
   1. Utilities
   2. Loading Screen
   3. Custom Cursor
   4. Header / Mobile Navigation
   5. Theme Toggle (Dark / Light)
   6. Active Nav Link on Scroll
   7. GSAP Scroll Reveal Animations
   8. Hero Mouse Parallax + Magnetic Tilt (ID Card)
   9. Typing Effect (Role Rotator)
   10. Animated Number Counters
   11. Magnetic Buttons
   12. Ripple Effect
   13. Portfolio Filter
   14. Contact Form Validation
   15. Back to Top + Misc
   ===================================================================== */

(() => {
  "use strict";

  /* -------------------------------------------------------------------
     1. Utilities
     ------------------------------------------------------------------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";

  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* -------------------------------------------------------------------
     2. Loading Screen
     ------------------------------------------------------------------- */
  const initLoader = () => {
    const loader = $(".loader");
    const fill = $(".loader__bar-fill");
    const percentEl = $(".loader__percent");
    if (!loader) return;

    let progress = 0;
    const tick = () => {
      progress += Math.random() * 18 + 6;
      if (progress >= 100) progress = 100;
      if (fill) fill.style.width = progress + "%";
      if (percentEl) percentEl.textContent = Math.floor(progress) + "%";

      if (progress < 100) {
        window.requestAnimationFrame(() => setTimeout(tick, 90));
      } else {
        setTimeout(() => {
          loader.classList.add("is-hidden");
          document.body.classList.add("is-loaded");
          document.documentElement.classList.add("reveal-ready");
          runEntranceAnimation();
        }, 250);
      }
    };

    window.addEventListener("load", () => tick());
    // Safety net in case the load event already fired
    setTimeout(() => {
      if (!loader.classList.contains("is-hidden")) tick();
    }, 600);
  };

  /* -------------------------------------------------------------------
     3. Custom Cursor
     ------------------------------------------------------------------- */
  const initCursor = () => {
    const dot = $(".cursor-dot");
    const ring = $(".cursor-ring");
    if (!dot || !ring || window.matchMedia("(pointer: coarse)").matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    };
    animateRing();

    $$("a, button, input, textarea, .filter-btn, [data-cursor-hover]").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-active"));
    });
  };

  /* -------------------------------------------------------------------
     4. Header / Mobile Navigation
     ------------------------------------------------------------------- */
  const initHeaderNav = () => {
    const header = $(".site-header");
    const toggle = $(".nav-toggle");
    const nav = $(".nav");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
      });

      $$(".nav__link").forEach((link) => {
        link.addEventListener("click", () => {
          nav.classList.remove("is-open");
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  };

  /* -------------------------------------------------------------------
     5. Theme Toggle
     ------------------------------------------------------------------- */
  const initThemeToggle = () => {
    const root = document.documentElement;
    const toggle = $(".theme-toggle");
    const stored = localStorage.getItem("dm-theme");

    if (stored) {
      root.setAttribute("data-theme", stored);
    }

    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = current === "light" ? "dark" : "light";
      if (next === "dark") {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", "light");
      }
      localStorage.setItem("dm-theme", next);
    });
  };

  /* -------------------------------------------------------------------
     6. Active Nav Link on Scroll
     ------------------------------------------------------------------- */
  const initScrollSpy = () => {
    const sections = $$("main section[id]");
    const links = $$(".nav__link");
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            links.forEach((link) => {
              link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  };

  /* -------------------------------------------------------------------
     7. GSAP Scroll Reveal Animations
     ------------------------------------------------------------------- */
  const runEntranceAnimation = () => {
    if (!hasGSAP || prefersReducedMotion) {
      document.body.classList.add("js-fallback");
      return;
    }

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .to(".hero__status", { opacity: 1, y: 0, duration: 0.6 })
      .to(".hero__title .line", { opacity: 1, y: 0, stagger: 0.12, duration: 0.9 }, "-=0.35")
      .to(".hero__lead", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5")
      .to(".hero__cta", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5")
      .to(".hero__meta", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5")
      .to(".id-card", { opacity: 1, y: 0, scale: 1, duration: 1 }, "-=0.9");
  };

  const initScrollReveal = () => {
    if (!hasGSAP || prefersReducedMotion) {
      document.body.classList.add("js-fallback");
      return;
    }

    $$("[data-reveal]").forEach((el) => {
      if (el.closest(".hero")) return; // hero handled by entrance timeline
      gsap.fromTo(
        el,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
          },
        }
      );
    });

    // Staggered card groups
    $$("[data-reveal-group]").forEach((group) => {
      const items = $$(":scope > *", group);
      gsap.fromTo(
        items,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: group,
            start: "top 85%",
          },
        }
      );
    });
  };

  /* -------------------------------------------------------------------
     8. Hero Mouse Parallax + ID Card Tilt
     ------------------------------------------------------------------- */
  const initParallax = () => {
    const hero = $(".hero");
    const idCard = $(".id-card");
    const shapes = $$(".floating-shape");
    if (!hero || window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion) return;

    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;

      if (idCard) {
        const rotateX = (py * -8).toFixed(2);
        const rotateY = (px * 10).toFixed(2);
        idCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }

      shapes.forEach((shape, i) => {
        const depth = (i + 1) * 14;
        shape.style.transform = `translate(${px * depth}px, ${py * depth}px)`;
      });
    });

    hero.addEventListener("mouseleave", () => {
      if (idCard) idCard.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
    });
  };

  /* -------------------------------------------------------------------
     9. Typing Effect — Role Rotator
     ------------------------------------------------------------------- */
  const initTypingEffect = () => {
    const el = $("[data-typing]");
    if (!el) return;

    let roles;
    try {
      roles = JSON.parse(el.getAttribute("data-typing"));
    } catch (err) {
      roles = ["Creative Developer"];
    }

    if (prefersReducedMotion) {
      el.textContent = roles[0];
      return;
    }

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const type = () => {
      const current = roles[roleIndex];
      if (!deleting) {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(type, 1400);
          return;
        }
      } else {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }
      setTimeout(type, deleting ? 35 : 65);
    };
    type();
  };

  /* -------------------------------------------------------------------
     10. Animated Number Counters
     ------------------------------------------------------------------- */
  const initCounters = () => {
    const counters = $$("[data-counter]");
    if (!counters.length) return;

    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute("data-counter"));
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 1600;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((el) => observer.observe(el));

    // Skill bars
    $$("[data-skill-level]").forEach((bar) => {
      const observer2 = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const level = entry.target.getAttribute("data-skill-level");
              const fill = entry.target.querySelector(".skill-card__bar-fill");
              if (fill) fill.style.width = level + "%";
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      observer2.observe(bar);
    });
  };

  /* -------------------------------------------------------------------
     11. Magnetic Buttons
     ------------------------------------------------------------------- */
  const initMagnetic = () => {
    if (window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion) return;

    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.28}px, ${y * 0.35}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0, 0)";
      });
    });
  };

  /* -------------------------------------------------------------------
     12. Ripple Effect
     ------------------------------------------------------------------- */
  const initRipple = () => {
    $$(".btn, .filter-btn, .social-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = e.clientX - rect.left - size / 2 + "px";
        ripple.style.top = e.clientY - rect.top - size / 2 + "px";
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      });
    });
  };

  /* -------------------------------------------------------------------
     13. Portfolio Filter
     ------------------------------------------------------------------- */
  const initPortfolioFilter = () => {
    const buttons = $$(".filter-btn");
    const cards = $$(".project-card");
    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const filter = btn.getAttribute("data-filter");

        cards.forEach((card) => {
          const match = filter === "all" || card.getAttribute("data-category") === filter;
          if (hasGSAP && !prefersReducedMotion) {
            gsap.to(card, {
              opacity: match ? 1 : 0,
              scale: match ? 1 : 0.92,
              duration: 0.35,
              onComplete: () => {
                card.style.display = match ? "" : "none";
              },
            });
          } else {
            card.style.display = match ? "" : "none";
          }
        });
      });
    });
  };

  /* -------------------------------------------------------------------
     14. Contact Form Validation
     ------------------------------------------------------------------- */
  const initContactForm = () => {
    const form = $("#contact-form");
    if (!form) return;

    const fields = {
      name: $("#field-name"),
      email: $("#field-email"),
      subject: $("#field-subject"),
      message: $("#field-message"),
    };
    const status = $(".form-status", form);

    const showError = (field, message) => {
      const errorEl = field.closest(".form-group").querySelector(".form-error");
      if (errorEl) errorEl.textContent = message;
    };

    const clearErrors = () => {
      $$(".form-error", form).forEach((el) => (el.textContent = ""));
    };

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors();
      let valid = true;

      if (!fields.name.value.trim()) {
        showError(fields.name, "لطفاً نام خود را وارد کنید.");
        valid = false;
      }
      if (!fields.email.value.trim() || !isValidEmail(fields.email.value.trim())) {
        showError(fields.email, "لطفاً یک ایمیل معتبر وارد کنید.");
        valid = false;
      }
      if (!fields.subject.value.trim()) {
        showError(fields.subject, "موضوع پیام را مشخص کنید.");
        valid = false;
      }
      if (!fields.message.value.trim() || fields.message.value.trim().length < 10) {
        showError(fields.message, "پیام باید حداقل ۱۰ کاراکتر باشد.");
        valid = false;
      }

      if (!valid) {
        status.textContent = "لطفاً خطاهای فرم را بررسی کنید.";
        status.classList.remove("is-success");
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "در حال ارسال...";
      submitBtn.disabled = true;

      // Placeholder submit — replace with a real endpoint integration.
      setTimeout(() => {
        status.textContent = "پیام شما با موفقیت ارسال شد. به‌زودی پاسخ داده می‌شود.";
        status.classList.add("is-success");
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        form.reset();
      }, 900);
    });
  };

  /* -------------------------------------------------------------------
     15. Back to Top + Misc
     ------------------------------------------------------------------- */
  const initMisc = () => {
    const backToTop = $(".back-to-top");
    if (backToTop) {
      backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      });
    }

    const yearEl = $("#current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Smooth scroll for in-page anchors (fallback for older browsers)
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const targetId = anchor.getAttribute("href");
        if (targetId.length < 2) return;
        const target = $(targetId);
        if (!target) return;
        e.preventDefault();
        const headerOffset = 90;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      });
    });
  };

  /* -------------------------------------------------------------------
     Init
     ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initCursor();
    initHeaderNav();
    initThemeToggle();
    initScrollSpy();
    initScrollReveal();
    initParallax();
    initTypingEffect();
    initCounters();
    initMagnetic();
    initRipple();
    initPortfolioFilter();
    initContactForm();
    initMisc();
  });
})();
