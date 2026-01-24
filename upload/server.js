require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const emailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for cPanel/reverse proxy setups
if (isProduction) {
    app.set('trust proxy', 1);
}

// CORS configuration - allow cross-origin requests for Firebase Storage images
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true
}));

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
// Email API Routes (Protected)
// =====================================================

// Get email configuration status
app.get('/api/email/status', requireAdmin, (req, res) => {
    const status = emailService.getEmailStatus();
    res.json(status);
});

// Verify SMTP connection
app.post('/api/email/verify-smtp', requireAdmin, async (req, res) => {
    try {
        const result = await emailService.verifySMTP();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch emails from inbox
app.get('/api/email/inbox', requireAdmin, async (req, res) => {
    try {
        const { limit = 20, folder = 'INBOX', unseen = false } = req.query;
        const emails = await emailService.fetchEmails({
            limit: parseInt(limit),
            folder,
            unseen: unseen === 'true'
        });
        res.json({ success: true, emails });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get email folders
app.get('/api/email/folders', requireAdmin, async (req, res) => {
    try {
        const folders = await emailService.getFolders();
        res.json({ success: true, folders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send email
app.post('/api/email/send', requireAdmin, async (req, res) => {
    try {
        const { to, subject, text, html, replyTo } = req.body;

        if (!to || !subject || !text) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, subject, text'
            });
        }

        const result = await emailService.sendEmail({ to, subject, text, html, replyTo });
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark email as read
app.post('/api/email/mark-read', requireAdmin, async (req, res) => {
    try {
        const { uid, folder = 'INBOX' } = req.body;

        if (!uid) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: uid'
            });
        }

        const result = await emailService.markAsRead(uid, folder);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reply to a contact or quote submission
app.post('/api/email/reply', requireAdmin, async (req, res) => {
    try {
        const { to, subject, message, originalSubject } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, message'
            });
        }

        const emailSubject = subject || `Re: ${originalSubject || 'Your inquiry to R&B Construction Consulting'}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">R&B Construction Consulting</h1>
                </div>
                <div style="padding: 30px; background: #fff;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <div style="padding: 20px; background: #f8f9fa; text-align: center; font-size: 12px; color: #666;">
                    <p style="margin: 0;">R&B Construction Consulting</p>
                    <p style="margin: 5px 0;">📧 info@rnbconsulting.org | 📞 (845) 616-0149</p>
                </div>
            </div>
        `;

        const result = await emailService.sendEmail({
            to,
            subject: emailSubject,
            text: message,
            html
        });

        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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

// Initialize email service on startup
emailService.initializeSMTP();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏗️  R&B Construction Consulting server running at http://localhost:${PORT}`);
    console.log(`📧  Admin login: ${ADMIN_EMAIL}`);
    console.log(`🌐  Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`📬  Email status:`, emailService.getEmailStatus().smtp.configured ? 'Configured' : 'Not configured');
});

