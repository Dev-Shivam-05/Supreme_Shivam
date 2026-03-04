/* =============================================
   ADMIN FORTRESS — JAVASCRIPT
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- PRELOADER ---------- */
  const preloader = document.getElementById("preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      setTimeout(() => preloader.classList.add("hidden"), 400);
    });
    setTimeout(() => preloader.classList.add("hidden"), 2500);
  }

  /* ---------- CUSTOM CURSOR ---------- */
  const dot = document.querySelector(".cursor-dot");
  const outline = document.querySelector(".cursor-outline");
  if (dot && outline && window.innerWidth > 1024) {
    let mouseX = 0,
      mouseY = 0,
      outX = 0,
      outY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top = mouseY + "px";
    });
    (function animateCursor() {
      outX += (mouseX - outX) * 0.12;
      outY += (mouseY - outY) * 0.12;
      outline.style.left = outX + "px";
      outline.style.top = outY + "px";
      requestAnimationFrame(animateCursor);
    })();
    document
      .querySelectorAll(
        "a, button, .sidebar-link, .action-btn, .inbox-item, .topbar-btn, .social-link",
      )
      .forEach((el) => {
        el.addEventListener("mouseenter", () => {
          outline.style.width = "56px";
          outline.style.height = "56px";
          outline.style.borderColor = "rgba(0,255,136,0.6)";
          dot.style.transform = "translate(-50%,-50%) scale(0.5)";
        });
        el.addEventListener("mouseleave", () => {
          outline.style.width = "36px";
          outline.style.height = "36px";
          outline.style.borderColor = "rgba(0,255,136,0.35)";
          dot.style.transform = "translate(-50%,-50%) scale(1)";
        });
      });
  }

  /* ---------- PARTICLES ---------- */
  const canvas = document.getElementById("particles-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w,
      h,
      particles = [];
    const COUNT = 50;
    const MAX_D = 100;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    class P {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.r = Math.random() * 1.5 + 0.3;
        this.a = Math.random() * 0.3 + 0.05;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,136,${this.a})`;
        ctx.fill();
      }
    }
    for (let i = 0; i < COUNT; i++) particles.push(new P());
    (function anim() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      for (let i = 0; i < particles.length; i++)
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x,
            dy = particles[i].y - particles[j].y,
            d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_D) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,255,136,${0.04 * (1 - d / MAX_D)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      requestAnimationFrame(anim);
    })();
  }

  /* ---------- SIDEBAR TOGGLE ---------- */
  const sidebar = document.querySelector(".admin-sidebar");
  const sidebarOverlay = document.querySelector(".sidebar-overlay");
  const burgerBtn = document.querySelector(".topbar-burger");
  const closeBtn = document.querySelector(".sidebar-close");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (burgerBtn) burgerBtn.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

  /* ---------- COUNTER ANIMATION ---------- */
  const counters = document.querySelectorAll(".counter");
  if (counters.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.dataset.counted) {
            entry.target.dataset.counted = "true";
            const target = +entry.target.dataset.target;
            const suffix = entry.target.dataset.suffix || "";
            let current = 0;
            const inc = target / 60;
            const timer = setInterval(() => {
              current += inc;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              entry.target.textContent =
                Math.floor(current).toLocaleString() + suffix;
            }, 25);
          }
        });
      },
      { threshold: 0.5 },
    );
    counters.forEach((c) => obs.observe(c));
  }

  /* ---------- SPARKLINE ANIMATION ---------- */
  const sparklines = document.querySelectorAll(".stat-card-sparkline");
  sparklines.forEach((sl) => {
    const bars = sl.querySelectorAll(".sparkline-bar");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bars.forEach((bar) => {
              const h = bar.dataset.height;
              setTimeout(() => {
                bar.style.height = h;
              }, Math.random() * 500);
            });
          }
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(sl);
  });

  /* ---------- SCROLL REVEAL ---------- */
  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    revealElements.forEach((el) => revealObs.observe(el));
  }

  /* ---------- MODAL SYSTEM ---------- */
  const modalBackdrop = document.querySelector(".admin-modal-backdrop");
  const openModalBtns = document.querySelectorAll("[data-open-modal]");
  const closeModalBtns = document.querySelectorAll("[data-close-modal]");

  openModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (modalBackdrop) modalBackdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (modalBackdrop) modalBackdrop.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------- INBOX ITEM CLICK ---------- */
  const inboxItems = document.querySelectorAll(".inbox-item");
  const inboxDetails = document.querySelectorAll(".inbox-detail-view");

  inboxItems.forEach((item) => {
    item.addEventListener("click", () => {
      inboxItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      item.classList.remove("unread");

      const targetId = item.dataset.message;
      if (inboxDetails.length) {
        inboxDetails.forEach((d) => (d.style.display = "none"));
        const targetDetail = document.querySelector(`#${targetId}`);
        if (targetDetail) targetDetail.style.display = "flex";
      }
    });
  });

  /* ---------- LOGIN FORM ---------- */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const btn = this.querySelector(".login-btn");
      const originalText = btn.innerHTML;
      btn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Access Granted';
        btn.style.background = "linear-gradient(135deg, #059669, #10b981)";
        setTimeout(() => {
          window.location.href = "admin-dashboard.html";
        }, 1000);
      }, 2000);
    });
  }

  /* ---------- DELETE CONFIRMATION ---------- */
  document.querySelectorAll(".action-btn.delete").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const row = this.closest("tr");
      if (row) {
        row.style.background = "rgba(239,68,68,0.05)";
        row.style.opacity = "0.5";
        row.style.transform = "translateX(20px)";
        row.style.transition = "all 0.4s";
        setTimeout(() => {
          row.style.height = row.offsetHeight + "px";
          row.style.overflow = "hidden";
          requestAnimationFrame(() => {
            row.style.height = "0";
            row.style.padding = "0";
            row.style.margin = "0";
            row.style.border = "none";
          });
          setTimeout(() => row.remove(), 400);
        }, 300);
      }
    });
  });

  /* ---------- ACTIVE SIDEBAR LINK ---------- */
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const currentPage =
    window.location.pathname.split("/").pop() || "admin-dashboard.html";
  sidebarLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
    }
  });

  /* ---------- REALTIME CLOCK ---------- */
  const clockEl = document.getElementById("realtime-clock");
  if (clockEl) {
    function updateClock() {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }
});
