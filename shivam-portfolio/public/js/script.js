        /* =============================================
SHIVAM BHADORIYA — PORTFOLIO MASTER JS
============================================= */

        document.addEventListener('DOMContentLoaded', () => {

            /* ---------- PRELOADER ---------- */
            const preloader = document.getElementById('preloader');
            if (preloader) {
                window.addEventListener('load', () => {
                    setTimeout(() => preloader.classList.add('hidden'), 600);
                });
                setTimeout(() => preloader.classList.add('hidden'), 3000);
            }

            /* ---------- CUSTOM CURSOR ---------- */
            const dot = document.querySelector('.cursor-dot');
            const outline = document.querySelector('.cursor-outline');
            if (dot && outline && window.innerWidth > 1024) {
                let mouseX = 0, mouseY = 0;
                let outX = 0, outY = 0;
                window.addEventListener('mousemove', e => {
                    mouseX = e.clientX; mouseY = e.clientY;
                    dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px';
                });
                (function animateCursor() {
                    outX += (mouseX - outX) * 0.12;
                    outY += (mouseY - outY) * 0.12;
                    outline.style.left = outX + 'px'; outline.style.top = outY + 'px';
                    requestAnimationFrame(animateCursor);
                })();
                document.querySelectorAll('a, button, .btn-glow-green, .btn-glow-purple, .project-card, .filter-btn, .social-link').forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        outline.style.width = '56px'; outline.style.height = '56px';
                        outline.style.borderColor = 'rgba(0,255,136,0.6)';
                        dot.style.transform = 'translate(-50%,-50%) scale(0.5)';
                    });
                    el.addEventListener('mouseleave', () => {
                        outline.style.width = '36px'; outline.style.height = '36px';
                        outline.style.borderColor = 'rgba(0,255,136,0.35)';
                        dot.style.transform = 'translate(-50%,-50%) scale(1)';
                    });
                });
            }

            /* ---------- PARTICLE SYSTEM ---------- */
            const canvas = document.getElementById('particles-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                let w, h, particles = [];
                const PARTICLE_COUNT = 80;
                const MAX_DIST = 120;

                function resize() {
                    w = canvas.width = window.innerWidth;
                    h = canvas.height = window.innerHeight;
                }
                resize();
                window.addEventListener('resize', resize);

                class Particle {
                    constructor() { this.reset(); }
                    reset() {
                        this.x = Math.random() * w;
                        this.y = Math.random() * h;
                        this.vx = (Math.random() - 0.5) * 0.4;
                        this.vy = (Math.random() - 0.5) * 0.4;
                        this.r = Math.random() * 1.8 + 0.5;
                        this.alpha = Math.random() * 0.4 + 0.1;
                    }
                    update() {
                        this.x += this.vx; this.y += this.vy;
                        if (this.x < 0 || this.x > w) this.vx *= -1;
                        if (this.y < 0 || this.y > h) this.vy *= -1;
                    }
                    draw() {
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(0,255,136,${this.alpha})`;
                        ctx.fill();
                    }
                }

                for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

                function animateParticles() {
                    ctx.clearRect(0, 0, w, h);
                    particles.forEach(p => { p.update(); p.draw(); });
                    for (let i = 0; i < particles.length; i++) {
                        for (let j = i + 1; j < particles.length; j++) {
                            const dx = particles[i].x - particles[j].x;
                            const dy = particles[i].y - particles[j].y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < MAX_DIST) {
                                ctx.beginPath();
                                ctx.moveTo(particles[i].x, particles[i].y);
                                ctx.lineTo(particles[j].x, particles[j].y);
                                ctx.strokeStyle = `rgba(0,255,136,${0.06 * (1 - dist / MAX_DIST)})`;
                                ctx.lineWidth = 0.5;
                                ctx.stroke();
                            }
                        }
                    }
                    requestAnimationFrame(animateParticles);
                }
                animateParticles();
            }

            /* ---------- TYPING EFFECT ---------- */
            const typingEl = document.querySelector('.typing-text');
            if (typingEl) {
                const phrases = [
                    'Full Stack Developer',
                    'Backend Architect',
                    'Open Source Contributor',
                    'MongoDB & Node.js Expert',
                    'Problem Solver'
                ];
                let phraseIdx = 0, charIdx = 0, deleting = false;
                function typeEffect() {
                    const current = phrases[phraseIdx];
                    if (deleting) {
                        typingEl.textContent = current.substring(0, charIdx--);
                        if (charIdx < 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; setTimeout(typeEffect, 400); return; }
                    } else {
                        typingEl.textContent = current.substring(0, charIdx++);
                        if (charIdx > current.length) { deleting = true; setTimeout(typeEffect, 1800); return; }
                    }
                    setTimeout(typeEffect, deleting ? 35 : 70);
                }
                setTimeout(typeEffect, 1000);
            }

            /* ---------- NAVBAR SCROLL ---------- */
            const navbar = document.querySelector('.navbar-custom');
            if (navbar) {
                window.addEventListener('scroll', () => {
                    navbar.classList.toggle('scrolled', window.scrollY > 60);
                });
            }

            /* ---------- SCROLL REVEAL ---------- */
            const revealElements = document.querySelectorAll('.reveal');
            if (revealElements.length) {
                const revealObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('active');
                        }
                    });
                }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
                revealElements.forEach(el => revealObserver.observe(el));
            }

            /* ---------- COUNTER ANIMATION ---------- */
            const counters = document.querySelectorAll('.counter');
            if (counters.length) {
                const counterObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !entry.target.dataset.counted) {
                            entry.target.dataset.counted = 'true';
                            const target = +entry.target.dataset.target;
                            const suffix = entry.target.dataset.suffix || '';
                            let current = 0;
                            const increment = target / 60;
                            const timer = setInterval(() => {
                                current += increment;
                                if (current >= target) { current = target; clearInterval(timer); }
                                entry.target.textContent = Math.floor(current) + suffix;
                            }, 25);
                        }
                    });
                }, { threshold: 0.5 });
                counters.forEach(c => counterObserver.observe(c));
            }

            /* ---------- SKILL BARS ---------- */
            const skillBars = document.querySelectorAll('.skill-bar-inner');
            if (skillBars.length) {
                const skillObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.width = entry.target.dataset.width;
                        }
                    });
                }, { threshold: 0.3 });
                skillBars.forEach(bar => skillObserver.observe(bar));
            }

            /* ---------- FILTER BUTTONS ---------- */
            const filterBtns = document.querySelectorAll('.filter-btn');
            const projectCards = document.querySelectorAll('.project-filter-item');
            if (filterBtns.length && projectCards.length) {
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        const filter = btn.dataset.filter;
                        projectCards.forEach(card => {
                            if (filter === 'all' || card.dataset.category === filter) {
                                card.style.display = 'block';
                                setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 50);
                            } else {
                                card.style.opacity = '0'; card.style.transform = 'translateY(20px)';
                                setTimeout(() => { card.style.display = 'none'; }, 400);
                            }
                        });
                    });
                });
            }

            /* ---------- SMOOTH SCROLL (NAV LINKS) ---------- */
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });

            /* ---------- ACTIVE NAV LINK ---------- */
            const navLinks = document.querySelectorAll('.navbar-custom .nav-link:not(.nav-cta)');
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                    link.classList.add('active');
                }
            });

            /* ---------- FORM HANDLING ---------- */
            const contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const btn = this.querySelector('.submit-btn');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                    btn.disabled = true;
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-check"></i> Sent Successfully!';
                        btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            btn.style.background = '';
                            btn.disabled = false;
                            contactForm.reset();
                        }, 2500);
                    }, 2000);
                });
            }

            /* ---------- NAVBAR COLLAPSE ON CLICK (mobile) ---------- */
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse) {
                document.querySelectorAll('.navbar-nav .nav-link:not(.nav-cta)').forEach(link => {
                    link.addEventListener('click', () => {
                        if (window.innerWidth < 992) {
                            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                            if (bsCollapse) bsCollapse.hide();
                        }
                    });
                });
            }

            /* ---------- TILT EFFECT ON HERO IMAGE ---------- */
            const tiltBox = document.querySelector('.hero-image-box');
            if (tiltBox && window.innerWidth > 1024) {
                tiltBox.addEventListener('mousemove', e => {
                    const rect = tiltBox.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    tiltBox.style.transform = `perspective(1000px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg)`;
                });
                tiltBox.addEventListener('mouseleave', () => {
                    tiltBox.style.transform = 'perspective(1000px) rotateY(-8deg) rotateX(5deg)';
                });
            }

        });