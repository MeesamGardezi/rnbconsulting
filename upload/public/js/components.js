/* =====================================================
   R&B Construction Consulting - Shared Components
   Reusable Header and Footer Components
   ===================================================== */

// Navigation Component
const NavigationComponent = {
    render(currentPage = '') {
        return `
        <nav class="navbar" id="navbar">
            <div class="nav-container">
                <a href="/" class="nav-logo">
                    <span class="logo-text">R&B</span>
                    <span class="logo-subtext">Construction Consulting</span>
                </a>

                <ul class="nav-links" id="navLinks">
                    <li><a href="/about" class="${currentPage === 'about' ? 'active' : ''}">About</a></li>
                    <li><a href="/services" class="${currentPage === 'services' ? 'active' : ''}">Services</a></li>
                    <li><a href="/blog" class="${currentPage === 'blog' ? 'active' : ''}">Blog</a></li>
                    <li><a href="/faq" class="${currentPage === 'faq' ? 'active' : ''}">FAQ</a></li>
                    <li><a href="/careers" class="${currentPage === 'careers' ? 'active' : ''}">Careers</a></li>
                </ul>

                <div class="nav-actions">
                    <a href="/contact" class="nav-link-contact ${currentPage === 'contact' ? 'active' : ''}">Contact</a>
                    <a href="/quote" class="nav-cta">Request a Quote</a>
                </div>

                <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
                    <span class="hamburger"></span>
                </button>
            </div>

            <!-- Mobile Menu -->
            <div class="mobile-menu" id="mobileMenu">
                <div class="mobile-menu-content">
                    <a href="/" class="mobile-link">Home</a>
                    <a href="/about" class="mobile-link ${currentPage === 'about' ? 'active' : ''}">About</a>
                    <a href="/services" class="mobile-link ${currentPage === 'services' ? 'active' : ''}">Services</a>
                    <a href="/blog" class="mobile-link ${currentPage === 'blog' ? 'active' : ''}">Blog</a>
                    <a href="/faq" class="mobile-link ${currentPage === 'faq' ? 'active' : ''}">FAQ</a>
                    <a href="/careers" class="mobile-link ${currentPage === 'careers' ? 'active' : ''}">Careers</a>
                    <a href="/contact" class="mobile-link ${currentPage === 'contact' ? 'active' : ''}">Contact</a>
                    <a href="/quote" class="mobile-cta">Request a Quote</a>
                </div>
            </div>
        </nav>
        `;
    },

    init() {
        const navToggle = document.getElementById('navToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const navbar = document.getElementById('navbar');

        // Mobile menu toggle
        if (navToggle && mobileMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });

            // Close menu when clicking a link
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            });
        }

        // Navbar scroll effect
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    }
};

// Footer Component
const FooterComponent = {
    render() {
        return `
        <footer class="footer" id="footer">
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-brand">
                        <a href="/" class="footer-logo">
                            <span class="logo-text">R&B</span>
                            <span class="logo-subtext">Construction Consulting</span>
                        </a>
                        <p class="footer-tagline">Structure. Control. Execution.</p>
                        <div class="footer-social">
                            <a href="#" aria-label="LinkedIn" class="social-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                    <rect x="2" y="9" width="4" height="12"></rect>
                                    <circle cx="4" cy="4" r="2"></circle>
                                </svg>
                            </a>
                            <a href="#" aria-label="Twitter" class="social-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div class="footer-links">
                        <h4 class="footer-heading">Company</h4>
                        <ul>
                            <li><a href="/about">About Us</a></li>
                            <li><a href="/services">Services</a></li>
                            <li><a href="/careers">Careers</a></li>
                            <li><a href="/blog">Blog</a></li>
                        </ul>
                    </div>

                    <div class="footer-links">
                        <h4 class="footer-heading">Resources</h4>
                        <ul>
                            <li><a href="/faq">FAQ</a></li>
                            <li><a href="/quote">Request Quote</a></li>
                            <li><a href="/contact">Contact</a></li>
                        </ul>
                    </div>

                    <div class="footer-contact">
                        <h4 class="footer-heading">Contact</h4>
                        <ul>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="1.5" class="footer-icon">
                                    <path
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href="mailto:info@rnbconsulting.org">info@rnbconsulting.org</a>
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="1.5" class="footer-icon">
                                    <path
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <a href="tel:+18456160149">(845) 616-0149</a>
                            </li>
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="1.5" class="footer-icon">
                                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>United States</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="footer-bottom">
                    <p class="copyright">&copy; ${new Date().getFullYear()} R&B Construction Consulting. All rights reserved.</p>
                    <div class="footer-legal">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
        `;
    }
};

// Page Header Component (for inner pages)
const PageHeaderComponent = {
    render(title, subtitle = '', breadcrumb = []) {
        let breadcrumbHTML = '';
        if (breadcrumb.length > 0) {
            breadcrumbHTML = `
                <nav class="breadcrumb">
                    <a href="/">Home</a>
                    ${breadcrumb.map((item, i) =>
                i === breadcrumb.length - 1
                    ? `<span class="separator">/</span><span class="current">${item.label}</span>`
                    : `<span class="separator">/</span><a href="${item.href}">${item.label}</a>`
            ).join('')}
                </nav>
            `;
        }

        return `
        <section class="page-header">
            <div class="page-header-background">
                <div class="grain-overlay"></div>
            </div>
            <div class="container">
                <div class="page-header-content">
                    ${breadcrumbHTML}
                    <h1 class="page-title">${title}</h1>
                    ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
                </div>
            </div>
        </section>
        `;
    }
};

// Export components
window.RBComponents = {
    NavigationComponent,
    FooterComponent,
    PageHeaderComponent
};
