/* =====================================================
   R&B Construction Consulting - Email Service
   SMTP (sending) and IMAP (receiving) email functionality
   ===================================================== */

const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

// SMTP Transporter for sending emails
let smtpTransporter = null;

// IMAP connection for receiving emails
let imapConnection = null;

/**
 * Initialize SMTP transporter
 */
function initializeSMTP() {
    const config = {
        host: process.env.SMTP_HOST || 'rnbconsulting.org',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || 'info@rnbconsulting.org',
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false // Accept self-signed certificates
        }
    };

    if (!config.auth.pass || config.auth.pass === 'YOUR_EMAIL_PASSWORD_HERE') {
        console.warn('⚠️  SMTP password not configured. Email sending will not work.');
        return null;
    }

    smtpTransporter = nodemailer.createTransport(config);
    console.log('📧 SMTP transporter initialized');
    return smtpTransporter;
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @param {string} options.replyTo - Reply-to address (optional)
 */
async function sendEmail(options) {
    if (!smtpTransporter) {
        smtpTransporter = initializeSMTP();
    }

    if (!smtpTransporter) {
        throw new Error('SMTP not configured. Please set SMTP_PASSWORD in .env file.');
    }

    const mailOptions = {
        from: `"R&B Construction Consulting" <${process.env.SMTP_USER || 'info@rnbconsulting.org'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || undefined,
        replyTo: options.replyTo || undefined
    };

    try {
        const info = await smtpTransporter.sendMail(mailOptions);
        console.log('📤 Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email send error:', error);
        throw error;
    }
}

/**
 * Verify SMTP connection
 */
async function verifySMTP() {
    if (!smtpTransporter) {
        smtpTransporter = initializeSMTP();
    }

    if (!smtpTransporter) {
        return { success: false, error: 'SMTP not configured' };
    }

    try {
        await smtpTransporter.verify();
        return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get IMAP configuration
 */
function getImapConfig() {
    return {
        user: process.env.IMAP_USER || 'info@rnbconsulting.org',
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST || 'rnbconsulting.org',
        port: parseInt(process.env.IMAP_PORT) || 993,
        tls: process.env.IMAP_SECURE === 'true',
        tlsOptions: {
            rejectUnauthorized: false // Accept self-signed certificates
        }
    };
}

/**
 * Fetch emails from inbox
 * @param {Object} options - Fetch options
 * @param {number} options.limit - Maximum number of emails to fetch
 * @param {string} options.folder - Folder to fetch from (default: INBOX)
 * @param {boolean} options.unseen - Only fetch unseen emails
 */
async function fetchEmails(options = {}) {
    const { limit = 20, folder = 'INBOX', unseen = false } = options;
    const config = getImapConfig();

    if (!config.password || config.password === 'YOUR_EMAIL_PASSWORD_HERE') {
        throw new Error('IMAP not configured. Please set IMAP_PASSWORD in .env file.');
    }

    return new Promise((resolve, reject) => {
        const imap = new Imap(config);
        const emails = [];

        imap.once('ready', () => {
            imap.openBox(folder, true, (err, box) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                // Build search criteria
                const searchCriteria = unseen ? ['UNSEEN'] : ['ALL'];

                imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }

                    if (!results || results.length === 0) {
                        imap.end();
                        return resolve([]);
                    }

                    // Get the most recent emails
                    const fetchIds = results.slice(-limit).reverse();
                    const fetch = imap.fetch(fetchIds, {
                        bodies: '',
                        struct: true
                    });

                    fetch.on('message', (msg, seqno) => {
                        let uid = null;
                        let flags = [];

                        msg.on('body', (stream, info) => {
                            simpleParser(stream, (err, parsed) => {
                                if (err) {
                                    console.error('Parse error:', err);
                                    return;
                                }

                                emails.push({
                                    seqno,
                                    uid,
                                    flags,
                                    from: parsed.from?.value?.[0] || {},
                                    to: parsed.to?.value || [],
                                    subject: parsed.subject || '(No Subject)',
                                    date: parsed.date,
                                    text: parsed.text || '',
                                    html: parsed.html || '',
                                    attachments: (parsed.attachments || []).map(att => ({
                                        filename: att.filename,
                                        contentType: att.contentType,
                                        size: att.size
                                    }))
                                });
                            });
                        });

                        msg.once('attributes', (attrs) => {
                            uid = attrs.uid;
                            flags = attrs.flags;
                        });
                    });

                    fetch.once('error', (err) => {
                        imap.end();
                        reject(err);
                    });

                    fetch.once('end', () => {
                        // Give parsers time to complete
                        setTimeout(() => {
                            imap.end();
                            // Sort by date descending
                            emails.sort((a, b) => new Date(b.date) - new Date(a.date));
                            resolve(emails);
                        }, 500);
                    });
                });
            });
        });

        imap.once('error', (err) => {
            reject(err);
        });

        imap.connect();
    });
}

/**
 * Get folder list
 */
async function getFolders() {
    const config = getImapConfig();

    if (!config.password || config.password === 'YOUR_EMAIL_PASSWORD_HERE') {
        throw new Error('IMAP not configured. Please set IMAP_PASSWORD in .env file.');
    }

    return new Promise((resolve, reject) => {
        const imap = new Imap(config);

        imap.once('ready', () => {
            imap.getBoxes((err, boxes) => {
                imap.end();
                if (err) return reject(err);

                const folders = [];
                const parseBoxes = (boxList, prefix = '') => {
                    for (const name in boxList) {
                        const fullName = prefix ? `${prefix}${boxList[name].delimiter}${name}` : name;
                        folders.push({
                            name: fullName,
                            displayName: name,
                            hasChildren: !!boxList[name].children
                        });
                        if (boxList[name].children) {
                            parseBoxes(boxList[name].children, fullName);
                        }
                    }
                };

                parseBoxes(boxes);
                resolve(folders);
            });
        });

        imap.once('error', (err) => {
            reject(err);
        });

        imap.connect();
    });
}

/**
 * Mark email as read
 * @param {number} uid - Email UID
 * @param {string} folder - Folder name
 */
async function markAsRead(uid, folder = 'INBOX') {
    const config = getImapConfig();

    if (!config.password) {
        throw new Error('IMAP not configured');
    }

    return new Promise((resolve, reject) => {
        const imap = new Imap(config);

        imap.once('ready', () => {
            imap.openBox(folder, false, (err, box) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                imap.addFlags(uid, ['\\Seen'], (err) => {
                    imap.end();
                    if (err) return reject(err);
                    resolve({ success: true });
                });
            });
        });

        imap.once('error', (err) => {
            reject(err);
        });

        imap.connect();
    });
}

/**
 * Check email configuration status
 */
function getEmailStatus() {
    const smtpConfigured = process.env.SMTP_PASSWORD && process.env.SMTP_PASSWORD !== 'YOUR_EMAIL_PASSWORD_HERE';
    const imapConfigured = process.env.IMAP_PASSWORD && process.env.IMAP_PASSWORD !== 'YOUR_EMAIL_PASSWORD_HERE';

    return {
        smtp: {
            configured: smtpConfigured,
            host: process.env.SMTP_HOST || 'rnbconsulting.org',
            port: process.env.SMTP_PORT || '465',
            user: process.env.SMTP_USER || 'info@rnbconsulting.org'
        },
        imap: {
            configured: imapConfigured,
            host: process.env.IMAP_HOST || 'rnbconsulting.org',
            port: process.env.IMAP_PORT || '993',
            user: process.env.IMAP_USER || 'info@rnbconsulting.org'
        }
    };
}

module.exports = {
    initializeSMTP,
    sendEmail,
    verifySMTP,
    fetchEmails,
    getFolders,
    markAsRead,
    getEmailStatus
};
