/* ═══════ CONFIG ═══════ */
const WEB3_KEY = "YOUR_ACCESS_KEY_HERE"; // Get free key at web3forms.com
const SHEETS_URL = ""; // Optional: Google Apps Script deployment URL

/* ═══════ DATA ═══════ */
const PROJECTS = [
  {
    num: "01",
    title: "GitHub Contribution Art",
    cat: "Open Source",
    year: "2025",
    badge: "5+ Stars",
    desc: "Custom GitHub contribution patterns. 12+ users. Sub-2 minutes for Triggering Workflow. 98% time reduction.",
    tech: ["Node.js", "Express", "MongoDB", "Next.js" , "SVG", "REST API"],
    stats: [
      { v: "5+", l: "Stars" },
      { v: "12+", l: "Users" },
      { v: "<2min", l: "Speed" },
    ],
    img: "../assets/images/GitHUb-Contribution-Art-Generator-Preview.png",
    longDesc:
      "Open-source tool for custom GitHub contribution art. <strong>Sub-2min Trigger Workflow</strong>. Scalable MongoDB schema with pattern versioning and user template management.",
    bullets: [
      "Sub-2min Trigger Workflow for complex patterns",
      "Scalable MongoDB schema with versioning",
      "5+ stars and active community in 3 months",
      "12+ active users generating art daily",
    ],
    detailStats: [
      { v: "100+", l: "Stars" },
      { v: "500+", l: "Users" },
      { v: "<200ms", l: "Speed" },
      { v: "90%", l: "Saved" },
    ],
  },
  {
    num: "02",
    title: "JSClimateNow",
    cat: "Weather App",
    year: "2025",
    badge: "98/100 Lighthouse",
    desc: "98/100 Lighthouse. 60% bandwidth reduction via intelligent caching. Offline-capable with localStorage.",
    tech: ["JavaScript ES6+", "OpenWeather API", "LocalStorage"],
    stats: [
      { v: "98/100", l: "Lighthouse" },
      { v: "-60%", l: "Bandwidth" },
    ],
    img: "../assets/images/Js-Climate-Preview.png",
    longDesc:
      "Feature-rich weather app with <strong>98/100 Lighthouse performance score</strong>. Intelligent caching and query throttling reduced bandwidth by 60%.",
    bullets: [
      "60% bandwidth reduction via intelligent caching",
      "Dynamic multi-location sorting and comparison",
      "Mobile-first with offline localStorage fallback",
      "Custom data-driven weather visualizations",
    ],
    detailStats: [
      { v: "98/100", l: "Lighthouse" },
      { v: "-60%", l: "Bandwidth" },
      { v: "Offline", l: "Capable" },
      { v: "5+", l: "Breakpoints" },
    ],
  },
  {
    num: "03",
    title: "Recipe Book Platform",
    cat: "Front-End",
    year: "2025",
    badge: "Full CRUD",
    desc: "Infinite Addition of the recipe Possible by user Also having functionality of searching and filtering",
    tech: ["HTML", "CSS", "Bootstrap", "JavaScript", "Vercel"],
    stats: [
      { v: "<40ms", l: "Search" },
      { v: "90%", l: "Faster" },
    ],
    img: "../assets/images/Recipe-book-Preview.png",
    longDesc:
      "Full CRUD recipe platform. <strong>Infinite Addition of the recipe</strong>. Possible by user Also having functionality of searching and filtering.",
    bullets: [
      "90% faster queries via indexing and aggregation pipelines",
      "Very fast and furious searching and filtering",
      "Responsive grid across 5+ device breakpoints",
      "Full CRUD with Local Storage management",
    ],
    detailStats: [
      { v: "<40ms", l: "Search" },
      { v: "90%", l: "Faster" },
      { v: "infinite", l: "Recipes" },
      { v: "CRUD", l: "Complete" },
    ],
  },
];

const TECHS = [
  "Git",
  "GitHub",
  "JavaScript ES6+",
  "Node.js",
  "Express.js",
  "MongoDB",
  "Vercel",
  "Netlify",
  "Render",
  "Tailwind CSS",
  "MySQL",
  "C",
  "C++",
  "Python",
  "Figma",
  "Docker",
  "Vite",
  "JWT Auth",
  "Visual Studio Code",
  "Qoder",
  "Trea",
  "Cursor",
  "NPM",
  "Yarn",
  "Bun",
  "Virtual Task Automation",
];

/* ═══════ RENDER ═══════ */
document.getElementById("ldT").innerHTML = "SHIVAM BHADORIYA"
  .split("")
  .map((c) => (c === " " ? "<span>&nbsp;</span>" : `<span>${c}</span>`))
  .join("");

document.getElementById("marqT").innerHTML = Array(2)
  .fill(
    TECHS.map(
      (t) =>
        `<span class="marquee-item">${t}<span class="marquee-dot"></span></span>`,
    ).join(""),
  )
  .join("");

document.getElementById("projTrack").innerHTML = PROJECTS.map(
  (p, i) => `
<article class="project-card" data-index="${i}" onclick="openOverlay(${i})" role="button" tabindex="0" aria-label="View ${p.title} case study">
  <div class="project-card-img">
    ${p.badge ? `<div class="project-badge">${p.badge}</div>` : ""}<div class="project-arrow"><svg class="icon icon-sm"><use href="#i-arrow-up-right"/></svg></div>
    <img src="${p.img}" alt="${p.title} - ${p.cat} project by Shivam Bhadoriya" loading="lazy" width="1000" height="750">
  </div>
  <div class="project-info">
    <div class="project-cat">${p.cat} &middot; ${p.year}</div>
    <h3 class="project-title">${p.title}</h3>
    <p class="project-desc">${p.desc}</p>
    <div class="project-stats">${p.stats.map((s) => `<div class="project-stat-item"><h5>${s.v}</h5><small>${s.l}</small></div>`).join("")}</div>
    <div class="project-tags">${p.tech.map((t) => `<span class="project-tag">${t}</span>`).join("")}</div>
  </div>
</article>`,
).join("");

/* ═══════ LENIS SMOOTH SCROLL ═══════ */
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({
  duration: 1.3,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  touchMultiplier: 2,
});
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

/* ═══════ PRELOADER ═══════ */
gsap
  .timeline()
  .to("#ldT span", {
    y: 0,
    opacity: 1,
    duration: 0.7,
    stagger: 0.03,
    ease: "power4.out",
    delay: 0.4,
  })
  .to("#ldSub", { opacity: 1, duration: 0.4 }, "-=.3")
  .to("#ldBar", { opacity: 1, duration: 0.3 }, "-=.1")
  .to("#ldFill", { width: "100%", duration: 1.8, ease: "power2.inOut" })
  .to({}, { duration: 0.3 })
  .to("#ldCv", {
    scaleY: 1,
    duration: 0.5,
    ease: "power4.inOut",
    transformOrigin: "bottom",
  })
  .set("#ld .ld-inner", { opacity: 0 })
  .to("#ldCv", {
    scaleY: 0,
    duration: 0.5,
    ease: "power4.inOut",
    transformOrigin: "top",
    onComplete() {
      document.getElementById("ld").style.display = "none";
      document.body.classList.add("ready");
      document.getElementById("grain").style.opacity = "1";
      lenis.start();
      heroAnimation();
      setTimeout(initScrollEffects, 100);
    },
  });

/* ═══════ HERO ANIMATION ═══════ */
function heroAnimation() {
  gsap
    .timeline({ defaults: { ease: "power4.out" } })
    .to("#hTag", { opacity: 1, y: 0, duration: 0.8 })
    .to(".hero-t .wd", { y: 0, duration: 1.3, stagger: 0.1 }, "-=.5")
    .to("#hDesc", { opacity: 1, y: 0, duration: 1 }, "-=.8")
    .to("#hCta", { opacity: 1, y: 0, duration: 1 }, "-=.7")
    .to("#hScr", { opacity: 1, duration: 0.5 }, "-=.3");
}

/* ═══════════════════════════════════════════════
           ALL SCROLL EFFECTS
        ═══════════════════════════════════════════════ */
function initScrollEffects() {
  // 1. HERO PARALLAX — Each line different speed
  gsap.to("#hl1", {
    y: -120,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1,
    },
  });
  gsap.to("#hl2", {
    y: -220,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1,
    },
  });
  gsap.to("#hl3", {
    y: -320,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1,
    },
  });
  gsap.to("#hDesc", {
    y: -80,
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "20% top",
      end: "80% top",
      scrub: 1,
    },
  });
  gsap.to("#hCta", {
    y: -60,
    opacity: 0,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "20% top",
      end: "70% top",
      scrub: 1,
    },
  });

  // 2. SHOWCASE IMAGE ZOOM-OUT
  gsap.to("#scFrame", {
    width: "75vw",
    height: "70vh",
    borderRadius: 24,
    ease: "none",
    scrollTrigger: {
      trigger: "#showcase",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
    },
  });
  gsap.to("#scFrame img", {
    scale: 1,
    filter: "brightness(.7)",
    ease: "none",
    scrollTrigger: {
      trigger: "#showcase",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
    },
  });

  // 3. HORIZONTAL SCROLL PROJECTS
  const projWrap = document.getElementById("projWrap");
  const projTrack = document.getElementById("projTrack");
  const totalW = projTrack.scrollWidth;
  gsap.to(projTrack, {
    x: () => -(totalW - innerWidth + 60),
    ease: "none",
    scrollTrigger: {
      trigger: projWrap,
      start: "top top",
      end: () => `+=${totalW * 1.2}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
  document.querySelectorAll(".project-card-img img").forEach((img) => {
    gsap.to(img, {
      x: -40,
      ease: "none",
      scrollTrigger: {
        trigger: projWrap,
        start: "top top",
        end: () => `+=${totalW}`,
        scrub: 1,
      },
    });
  });

  // 4. ABOUT IMAGE CLIP-PATH REVEAL
  gsap.to("#aboutImg", {
    clipPath: "inset(0 0% 0 0)",
    ease: "power2.inOut",
    duration: 1.5,
    scrollTrigger: {
      trigger: "#aboutImg",
      start: "top 80%",
      once: true,
      onEnter() {
        document.getElementById("aboutImg").classList.add("revealed");
      },
    },
  });
  gsap.to("#aboutGlow", {
    clipPath: "inset(0 0% 0 0)",
    ease: "power2.inOut",
    duration: 1.5,
    delay: 0.2,
    scrollTrigger: { trigger: "#aboutImg", start: "top 80%", once: true },
  });
  gsap.to("#aboutImg img", {
    y: -60,
    ease: "none",
    scrollTrigger: {
      trigger: ".about-sec",
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
  });

  // 5. SKILLS STAGGERED 3D REVEAL
  gsap.utils.toArray("#skGrid .skill-cell").forEach((c, i) => {
    gsap.fromTo(
      c,
      { opacity: 0, scale: 0.85, rotateX: 15, y: 60 },
      {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        y: 0,
        duration: 1,
        delay: i * 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: c, start: "top 92%", once: true },
      },
    );
  });

  // 6. WHY CARDS — ROTATE + RISE
  gsap.utils.toArray("#whyGrid .why-card").forEach((c, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    gsap.fromTo(
      c,
      { opacity: 0, y: 80, rotate: dir * 5, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 1,
        delay: i * 0.06,
        ease: "power3.out",
        scrollTrigger: { trigger: c, start: "top 92%", once: true },
      },
    );
  });

  // 7. GENERAL REVEALS
  gsap.utils.toArray(".rv").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 45 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      },
    );
  });

  // 8. STAT COUNTERS
  document.querySelectorAll("[data-c]").forEach((el) => {
    const t = +el.dataset.c,
      s = el.dataset.s || "";
    gsap.to(
      { v: 0 },
      {
        v: t,
        duration: 2.5,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onUpdate() {
          el.textContent = Math.round(this.targets()[0].v) + s;
        },
      },
    );
  });

  // 9. ORB PARALLAX
  gsap.to(".o1", {
    y: 200,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
    },
  });
  gsap.to(".o2", {
    y: -150,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
    },
  });
  gsap.to(".o3", {
    y: 100,
    x: -100,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
    },
  });

  // 10. ROTATING BADGE
  gsap.to("#rBadge svg", {
    rotation: 360,
    ease: "none",
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
    },
  });
}

/* ═══════ CURSOR ═══════ */
(function () {
  const d = document.getElementById("cDot"),
    r = document.getElementById("cRing"),
    l = document.getElementById("cLbl");
  if (!d) return;
  let mx = -100,
    my = -100,
    rx = -100,
    ry = -100;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
  });
  (function loop() {
    rx += (mx - rx) * 0.08;
    ry += (my - ry) * 0.08;
    d.style.transform = `translate(${mx}px,${my}px)translate(-50%,-50%)`;
    r.style.transform = `translate(${rx}px,${ry}px)translate(-50%,-50%)`;
    l.style.transform = `translate(${rx}px,${ry}px)translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  function add(sel, cls) {
    document.querySelectorAll(sel).forEach((el) => {
      el.addEventListener("mouseenter", () => {
        r.classList.add(cls);
        if (cls === "v") l.style.opacity = "1";
      });
      el.addEventListener("mouseleave", () => {
        r.classList.remove(cls);
        if (cls === "v") l.style.opacity = "0";
      });
    });
  }
  add(
    "a,button,.skill-tag,.contact-info-card,.info-card,.why-card,.project-tag,.stat-item",
    "h",
  );
  add(".project-card,.showcase-frame", "v");
})();

/* ═══════ MAGNETIC ═══════ */
(function () {
  if (matchMedia("(pointer:coarse)").matches) return;
  document.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * 0.35,
        y: (e.clientY - r.top - r.height / 2) * 0.35,
        duration: 0.3,
        ease: "power3.out",
      });
    });
    el.addEventListener("mouseleave", () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,.35)" }),
    );
  });
})();

/* ═══════ MARQUEE ═══════ */
(function () {
  const t = document.getElementById("marqT");
  if (!t) return;
  let pos = 0,
    spd = 0.5,
    ls = 0;
  addEventListener("scroll", () => {
    spd = 0.5 + Math.abs(scrollY - ls) * 0.1;
    ls = scrollY;
  });
  (function tick() {
    spd += (0.5 - spd) * 0.02;
    pos -= spd;
    if (Math.abs(pos) >= t.scrollWidth / 2) pos = 0;
    t.style.transform = `translate3d(${pos}px,0,0)`;
    requestAnimationFrame(tick);
  })();
})();

/* ═══════ NAV ═══════ */
(function () {
  const n = document.getElementById("nav");
  let l = 0;
  addEventListener("scroll", () => {
    const s = scrollY;
    n.classList.toggle("u", s > l && s > 400);
    n.classList.toggle("s", s > 80);
    l = s;
  });
})();

/* ═══════ MOBILE MENU ═══════ */
(function () {
  const b = document.getElementById("ham"),
    m = document.getElementById("mob");
  b.addEventListener("click", () => {
    b.classList.toggle("on");
    m.classList.toggle("on");
    m.classList.contains("on") ? lenis.stop() : lenis.start();
  });
  m.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      b.classList.remove("on");
      m.classList.remove("on");
      lenis.start();
    }),
  );
})();

/* ═══════ SCROLL PROGRESS ═══════ */
addEventListener("scroll", () =>
  gsap.set("#prog", {
    scaleX: scrollY / (document.documentElement.scrollHeight - innerHeight),
  }),
);

/* ═══════ ROTATING BADGE VISIBILITY ═══════ */
addEventListener("scroll", () =>
  document
    .getElementById("rBadge")
    .classList.toggle("show", scrollY > innerHeight),
);

/* ═══════ ANCHORS ═══════ */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute("href"));
    if (t) lenis.scrollTo(t);
  });
});

/* ═══════ OUTLINE HOVER ═══════ */
(function () {
  const e = document.querySelector(".ol");
  if (!e) return;
  e.addEventListener("mouseenter", () => {
    e.style.cssText = "-webkit-text-stroke:0;color:var(--tx)";
  });
  e.addEventListener("mouseleave", () => {
    e.style.cssText = "-webkit-text-stroke:1.5px var(--tx);color:transparent";
  });
})();

/* ═══════ OVERLAY ═══════ */
function openOverlay(i) {
  const p = PROJECTS[i],
    ov = document.getElementById("overlay"),
    inner = document.getElementById("overlayInner");
  inner.innerHTML = `<p style="font-family:var(--fm);font-size:.55rem;color:var(--tx3);letter-spacing:.15em;margin-bottom:1rem">${p.cat} &middot; ${p.year}</p>
    <h2>${p.title}</h2><div class="overlay-hero"><img src="${p.img}" alt="${p.title} case study" loading="lazy"></div><p>${p.longDesc}</p>
    <ul>${p.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
    <div class="overlay-stats">${p.detailStats.map((s) => `<div class="overlay-stat"><h4>${s.v}</h4><span>${s.l}</span></div>`).join("")}</div>
    <p><strong>Stack:</strong> ${p.tech.join(" &middot; ")}</p>
    <div style="display:flex;gap:.8rem;margin-top:1.5rem;flex-wrap:wrap">
      <a href="https://github.com/Dev-Shivam-05" target="_blank" rel="noopener noreferrer" class="btn btn-outline">GitHub <svg class="icon icon-sm"><use href="#i-arrow-up-right"/></svg></a>
      <a href="#contact" class="btn btn-primary" onclick="document.getElementById('overlay').classList.remove('on');lenis.start()">Let's Discuss <svg class="icon icon-sm"><use href="#i-arrow"/></svg></a></div>`;
  ov.classList.add("on");
  ov.scrollTop = 0;
  lenis.stop();
}
document.getElementById("overlayClose").addEventListener("click", () => {
  document.getElementById("overlay").classList.remove("on");
  lenis.start();
});

/* ═══════ CONTACT FORM — EMAIL + SHEETS ═══════ */
async function submitContact() {
  const name = document.getElementById("fName").value.trim();
  const email = document.getElementById("fEmail").value.trim();
  const subject = document.getElementById("fSubject").value.trim();
  const message = document.getElementById("fMsg").value.trim();
  const btn = document.getElementById("formBtn");
  const msg = document.getElementById("formMsg");

  if (!name || !email || !message) {
    msg.className = "form-message err";
    msg.textContent = "Please fill all required fields.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.className = "form-message err";
    msg.textContent = "Please enter a valid email address.";
    return;
  }

  btn.textContent = "Sending...";
  btn.style.pointerEvents = "none";
  msg.className = "form-message";
  msg.textContent = "";

  try {
    if (WEB3_KEY && WEB3_KEY !== "YOUR_ACCESS_KEY_HERE") {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3_KEY,
          name,
          email,
          subject: subject || "New Portfolio Contact",
          message,
          from_name: "Portfolio Website",
          replyto: email,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Email delivery failed");
    }
    if (SHEETS_URL) {
      fetch(SHEETS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          name,
          email,
          subject,
          message,
        }),
      }).catch(() => {});
    }
    btn.classList.add("success");
    btn.innerHTML =
      'Message Sent <svg class="icon icon-sm" style="margin-left:.3rem"><use href="#i-check"/></svg>';
    btn.style.pointerEvents = "";
    msg.className = "form-message ok";
    msg.textContent = "Thank you! I'll respond within 24 hours.";
    document.getElementById("contactForm").reset();
    setTimeout(() => {
      btn.innerHTML =
        'Send Message <svg class="icon icon-sm" style="margin-left:.3rem"><use href="#i-arrow"/></svg>';
      btn.classList.remove("success");
      msg.textContent = "";
    }, 5000);
  } catch (err) {
    btn.innerHTML = "Opening Email...";
    btn.style.pointerEvents = "";
    msg.className = "form-message err";
    msg.textContent = "Redirecting to email client...";
    window.open(
      `mailto:shivambhadoriya1605@gmail.com?subject=${encodeURIComponent(subject || "Portfolio Contact")}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`,
      "_blank",
    );
    setTimeout(() => {
      btn.innerHTML =
        'Send Message <svg class="icon icon-sm" style="margin-left:.3rem"><use href="#i-arrow"/></svg>';
      msg.textContent = "";
    }, 4000);
  }
}
