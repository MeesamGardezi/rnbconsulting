/* =====================================================
   R&B Construction Consulting - Main JavaScript
   Fortune 500 Level Animations & Interactivity
   ===================================================== */

// NOTE: Firebase configuration is in firebase-config.js

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initParticleSystem();
    initMouseEffects();
    initAnimations();
    initSmoothScroll();
    initMagneticButtons();
    initTextSplitting();
    initParallaxEffects();
});

/* =====================================================
   Particle System - Floating Particles Background
   ===================================================== */

/* =====================================================
   Particle System - Floating Particles Background
   ===================================================== */

function initParticleSystem() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
    `;

    // Insert after background but before content
    const content = hero.querySelector('.hero-content');
    if (content) {
        hero.insertBefore(particleContainer, content);
    } else {
        hero.appendChild(particleContainer);
    }

    // Create canvas for connections
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
    `;
    particleContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Particle Config
    const config = {
        count: 80, // Increased density
        connectionDist: 140,
        mouseDist: 200,
        baseSpeed: 0.4,
        vibrationAmp: 0.5, // "Vibrating" amplitude
    };

    let width, height;
    function resizeCanvas() {
        width = hero.offsetWidth;
        height = hero.offsetHeight;
        canvas.width = width;
        canvas.height = height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking for interaction
    let mouse = { x: null, y: null };
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Create particles
    const particles = [];
    for (let i = 0; i < config.count; i++) {
        const isGold = Math.random() > 0.6;
        const size = Math.random() * 3 + 2;

        // Create DOM element for shiny dots (optional, but canvas is faster for lines. 
        // We will draw dots on canvas too for performance/sync, or keep DOM for simple dots).
        // Let's use pure Canvas for potential 100+ particles for better performance.
        // ACTUALLY: The previous code used DOM elements for dots. Let's switch to purely Canvas for "Fortune 500" performance.

        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * config.baseSpeed,
            vy: (Math.random() - 0.5) * config.baseSpeed,
            size: size,
            color: isGold ? 'rgba(184, 134, 11, ' : 'rgba(26, 26, 60, ', // partial rgba string
            baseOpacity: isGold ? 0.6 : 0.2,
            opacity: Math.random(),
            pulseSpeed: 0.02 + Math.random() * 0.03,
            angle: Math.random() * Math.PI * 2 // For sine wave vibration
        });
    }

    // Animation Loop
    let time = 0;
    function animate() {
        ctx.clearRect(0, 0, width, height);
        time += 0.01;

        particles.forEach(p => {
            // "Vibrating" motion: Add sine wave to position
            p.angle += 0.05;
            const vibrationX = Math.cos(p.angle) * config.vibrationAmp;
            const vibrationY = Math.sin(p.angle) * config.vibrationAmp;

            // Move particle
            p.x += p.vx + vibrationX * 0.1; // Add subtle vibration drift
            p.y += p.vy + vibrationY * 0.1;

            // Pulse opacity
            p.opacity = p.baseOpacity + Math.sin(time * 5 + p.angle) * 0.15;
            if (p.opacity < 0.1) p.opacity = 0.1;

            // Wrap around edges
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Mouse interaction (gentle repulsion/attraction)
            if (mouse.x != null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < config.mouseDist) {
                    const forceDirX = dx / dist;
                    const forceDirY = dy / dist;
                    const force = (config.mouseDist - dist) / config.mouseDist;
                    // Push away slightly
                    p.x -= forceDirX * force * 2;
                    p.y -= forceDirY * force * 2;
                }
            }

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.opacity + ')';
            ctx.fill();
        });

        // Draw connections
        // Optimization: Nested loop, but limited distance check
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < config.connectionDist) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(184, 134, 11, ${0.15 * (1 - dist / config.connectionDist)})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

/* =====================================================
   Mouse Effects - Cursor Trail & Interactive Elements
   ===================================================== */

function initMouseEffects() {
    // Custom cursor
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = `
        <div class="cursor-dot"></div>
        <div class="cursor-ring"></div>
    `;
    document.body.appendChild(cursor);

    // Add cursor styles
    const cursorStyles = document.createElement('style');
    cursorStyles.textContent = `
        .custom-cursor {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 9999;
            mix-blend-mode: difference;
        }
        
        .cursor-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #b8860b;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: transform 0.1s ease;
        }
        
        .cursor-ring {
            position: absolute;
            width: 40px;
            height: 40px;
            border: 2px solid rgba(184, 134, 11, 0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.15s ease-out;
        }
        
        .custom-cursor.hovering .cursor-dot {
            transform: translate(-50%, -50%) scale(2);
            background: #fff;
        }
        
        .custom-cursor.hovering .cursor-ring {
            width: 60px;
            height: 60px;
            border-color: rgba(255, 255, 255, 0.8);
        }
        
        .custom-cursor.clicking .cursor-ring {
            width: 30px;
            height: 30px;
        }

        @media (max-width: 768px) {
            .custom-cursor {
                display: none;
            }
        }
    `;
    document.head.appendChild(cursorStyles);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth cursor follow
    function updateCursor() {
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Hover effects on interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .service-card, .industry-card, .value-card');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });

    // Click effect
    document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
    document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));

    // Mouse glow effect on hero
    const hero = document.querySelector('.hero');
    if (hero) {
        const glowEffect = document.createElement('div');
        glowEffect.className = 'mouse-glow';
        glowEffect.style.cssText = `
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(184, 134, 11, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: 2;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        hero.appendChild(glowEffect);

        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            glowEffect.style.left = (e.clientX - rect.left) + 'px';
            glowEffect.style.top = (e.clientY - rect.top) + 'px';
            glowEffect.style.opacity = '1';
        });

        hero.addEventListener('mouseleave', () => {
            glowEffect.style.opacity = '0';
        });
    }
}

/* =====================================================
   Magnetic Buttons Effect
   ===================================================== */

function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn, .nav-cta');

    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translate(0, 0)';
        });
    });
}

/* =====================================================
   Text Splitting for Character Animations
   ===================================================== */

function initTextSplitting() {
    const headline = document.querySelector('.hero-headline');
    if (!headline) return;

    // Add shimmer effect to accent text
    const accentSpan = headline.querySelector('.text-accent');
    if (accentSpan) {
        accentSpan.style.cssText = `
            background: linear-gradient(90deg, #b8860b, #d4a853, #b8860b);
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s ease-in-out infinite;
        `;
    }

    // Add shimmer keyframes
    const shimmerStyle = document.createElement('style');
    shimmerStyle.textContent = `
        @keyframes shimmer {
            0%, 100% { background-position: 0% center; }
            50% { background-position: 200% center; }
        }
    `;
    document.head.appendChild(shimmerStyle);
}

/* =====================================================
   Parallax Effects
   ===================================================== */

function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.service-card, .industry-card, .value-card');

    parallaxElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            // Only apply 3D effect if card has finished entrance animation
            if (!el.classList.contains('animated')) return;

            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        el.addEventListener('mouseleave', () => {
            if (!el.classList.contains('animated')) return;
            el.style.transform = '';
        });
    });

    // Scroll-based parallax for sections
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;

        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
}

/* =====================================================
   Navigation
   ===================================================== */

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}

/* =====================================================
   GSAP Animations - Fixed to prevent transform conflicts
   ===================================================== */

function initAnimations() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined') {
        console.log('GSAP not loaded, skipping animations');
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Set all elements to visible immediately
        document.querySelectorAll('.hero-headline, .hero-subtext, .hero-ctas, .service-card, .industry-card, .value-card, .cta-content').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.classList.add('animated');
        });
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance - Epic staggered animation
    const heroTimeline = gsap.timeline({ delay: 0.2 });

    heroTimeline
        .to('.hero-headline', {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power4.out'
        })
        .to('.hero-subtext', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.6')
        .to('.hero-ctas', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, '-=0.4');

    // Service cards - adds 'animated' class when done to enable parallax
    gsap.utils.toArray('.service-card').forEach((card, index) => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: 'back.out(1.2)',
            onComplete: () => card.classList.add('animated')
        });
    });

    // Industry cards - fade and scale
    gsap.utils.toArray('.industry-card').forEach((card, index) => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 1,
            scale: 1,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'power2.out',
            onComplete: () => card.classList.add('animated')
        });
    });

    // Value cards with slide animation
    gsap.utils.toArray('.value-card').forEach((card, index) => {
        gsap.to(card, {
            scrollTrigger: {
                trigger: '.values-grid',
                start: 'top 75%',
                toggleActions: 'play none none none'
            },
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            delay: index * 0.15,
            ease: 'power3.out',
            onComplete: () => card.classList.add('animated')
        });
    });

    // CTA section with scale
    gsap.to('.cta-content', {
        scrollTrigger: {
            trigger: '.cta-section',
            start: 'top 75%',
            toggleActions: 'play none none none'
        },
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out'
    });

    // Section titles
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'power3.out'
        });
    });

    gsap.utils.toArray('.section-subtitle').forEach(subtitle => {
        gsap.from(subtitle, {
            scrollTrigger: {
                trigger: subtitle,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: 0.2,
            ease: 'power2.out'
        });
    });

    // Continuous floating animation for icons
    gsap.utils.toArray('.service-icon, .industry-icon, .value-icon').forEach((icon, index) => {
        gsap.to(icon, {
            y: -5,
            duration: 2 + Math.random(),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: index * 0.2
        });
    });
}

/* =====================================================
   Smooth Scrolling
   ===================================================== */

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                const navbarHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                // Smooth scroll with easing
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                const duration = 1000;
                let start = null;

                function animation(currentTime) {
                    if (start === null) start = currentTime;
                    const timeElapsed = currentTime - start;
                    const progress = Math.min(timeElapsed / duration, 1);

                    // Easing function
                    const ease = progress < 0.5
                        ? 4 * progress * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                    window.scrollTo(0, startPosition + distance * ease);

                    if (timeElapsed < duration) {
                        requestAnimationFrame(animation);
                    }
                }

                requestAnimationFrame(animation);
            }
        });
    });
}

/* =====================================================
   Performance Monitoring
   ===================================================== */

window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`🏗️ R&B Construction Consulting loaded in ${loadTime.toFixed(2)}ms`);
    console.log('✨ Premium animations initialized');
});
