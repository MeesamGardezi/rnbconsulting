require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for cPanel/reverse proxy setups
if (isProduction) {
    app.set('trust proxy', 1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction, // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: isProduction ? 'strict' : 'lax'
    }
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rbconsulting.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// =====================================================
// Admin Authentication API Routes
// =====================================================

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        req.session.adminEmail = email;
        res.json({
            success: true,
            user: {
                email: email,
                name: email.split('@')[0]
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'Invalid email or password'
        });
    }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, error: 'Logout failed' });
        } else {
            res.json({ success: true });
        }
    });
});

// Check admin session
app.get('/api/admin/session', (req, res) => {
    if (req.session.isAdmin) {
        res.json({
            authenticated: true,
            user: {
                email: req.session.adminEmail,
                name: req.session.adminEmail.split('@')[0]
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Admin auth middleware for protected routes
const requireAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// =====================================================
// Page Routes
// =====================================================

const pages = ['about', 'services', 'blog', 'contact', 'careers', 'quote', 'faq', 'admin'];

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve each page
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    });
});

// Blog post detail page - serve blog-post.html for any /blog/:slug route
app.get('/blog/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog-post.html'));
});

// Handle 404 - serve a custom 404 page or redirect to home
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
        if (err) {
            res.redirect('/');
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏗️  R&B Construction Consulting server running at http://localhost:${PORT}`);
    console.log(`📧  Admin login: ${ADMIN_EMAIL}`);
    console.log(`🌐  Environment: ${isProduction ? 'Production' : 'Development'}`);
});
