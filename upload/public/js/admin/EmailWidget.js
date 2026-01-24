/**
 * Email Widget
 * Handles email functionality for the admin panel
 */
window.EmailWidget = {
    init: function () {
        this.initEventListeners();
    },

    load: async function () {
        // First check email configuration status
        await this.checkStatus();

        // If configured, load emails and folders concurrently for better performance
        if (AdminState.emailStatus?.smtp?.configured || AdminState.emailStatus?.imap?.configured) {
            // Load folders in background (don't await) so emails show up immediately
            this.loadFolders();
            // Load emails immediately (defaults to INBOX)
            await this.loadEmails();
        }
    },

    checkStatus: async function () {
        try {
            const response = await fetch('/api/email/status');
            const status = await response.json();
            AdminState.emailStatus = status;

            this.renderStatusBanner(status);
        } catch (error) {
            console.error('Error checking email status:', error);
            this.renderStatusBanner({ smtp: { configured: false }, imap: { configured: false } });
        }
    },

    renderStatusBanner: function (status) {
        if (!Elements.emailStatusBanner) return;

        const isSmtpConfigured = status.smtp?.configured;
        const isImapConfigured = status.imap?.configured;

        if (isSmtpConfigured && isImapConfigured) {
            Elements.emailStatusBanner.style.display = 'none';
        } else {
            Elements.emailStatusBanner.style.display = 'block';
            Elements.emailStatusBanner.className = 'email-status-banner not-configured';
            Elements.emailStatusBanner.innerHTML = `
                <div class="status-not-configured">
                    <p><strong>⚠️ Email not configured</strong></p>
                    <p>To enable email functionality, add your email password to the <code>.env</code> file:</p>
                    <p><code>SMTP_PASSWORD=your_email_password</code></p>
                    <p><code>IMAP_PASSWORD=your_email_password</code></p>
                </div>
            `;
        }
    },

    loadFolders: async function () {
        if (!Elements.folderList) return;

        try {
            const response = await fetch('/api/email/folders');
            const data = await response.json();

            if (data.success && data.folders) {
                this.renderFolderList(data.folders);
            }
        } catch (error) {
            console.error('Error loading folders:', error);
            // Fallback to static list if API fails
            this.renderFolderList([
                { name: 'INBOX', displayName: 'Inbox' },
                { name: 'INBOX.Sent', displayName: 'Sent' }
            ]);
        }
    },

    renderFolderList: function (folders) {
        if (!Elements.folderList) return;

        // Standard folders mapping
        const standardFolders = {
            'inbox': { icon: 'inbox', label: 'Inbox', order: 1 },
            'sent': { icon: 'send', label: 'Sent', order: 2 },
            'drafts': { icon: 'file', label: 'Drafts', order: 3 },
            'trash': { icon: 'trash', label: 'Trash', order: 4 },
            'junk': { icon: 'alert-triangle', label: 'Junk', order: 5 },
            'spam': { icon: 'alert-triangle', label: 'Spam', order: 5 },
            'archive': { icon: 'archive', label: 'Archive', order: 6 }
        };

        // Helper to get folder info
        const getFolderInfo = (folder) => {
            const name = folder.name;
            const displayName = folder.displayName || name;
            const lowerName = displayName.toLowerCase();

            // Check if it matches a standard folder
            for (const [key, info] of Object.entries(standardFolders)) {
                if (lowerName.includes(key)) {
                    return { ...info, name, displayName: info.label };
                }
            }

            // Default
            return { icon: 'folder', label: displayName, order: 100, name };
        };

        // Process and sort folders
        const processedFolders = folders.map(getFolderInfo).sort((a, b) => a.order - b.order);

        Elements.folderList.innerHTML = processedFolders.map(folder => `
            <li class="${AdminState.currentFolder === folder.name ? 'active' : ''}" data-folder="${folder.name}">
                ${this.getFolderIcon(folder.icon)}
                <span>${folder.displayName}</span>
            </li>
        `).join('');

        // Re-attach event listeners
        Elements.folderList.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                Elements.folderList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                item.classList.add('active');
                const folderName = item.dataset.folder;
                this.loadEmails(folderName);
            });
        });
    },

    getFolderIcon: function (iconName) {
        const icons = {
            'inbox': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
            'send': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
            'file': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
            'trash': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
            'alert-triangle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            'archive': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>',
            'folder': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
        };
        return icons[iconName] || icons['folder'];
    },

    loadEmails: async function (folder = AdminState.currentFolder) {
        if (!Elements.emailList) return;

        Elements.emailList.innerHTML = '<div class="loading-state">Loading emails...</div>';

        try {
            const response = await fetch(`/api/email/inbox?folder=${encodeURIComponent(folder)}&limit=30`);
            const data = await response.json();

            if (data.success) {
                AdminState.emails = data.emails || [];
                AdminState.currentFolder = folder;
                this.renderEmailList();
            } else {
                Elements.emailList.innerHTML = `<div class="empty-state">${data.error || 'Failed to load emails'}</div>`;
                // Trigger load folders in case folder name is invalid
                if (data.error && data.error.includes('nonexistent')) {
                    this.loadFolders();
                }
            }
        } catch (error) {
            console.error('Error loading emails:', error);
            Elements.emailList.innerHTML = '<div class="empty-state">Unable to load emails. Please check your configuration.</div>';
        }
    },

    renderEmailList: function () {
        if (!Elements.emailList) return;

        if (!AdminState.emails || AdminState.emails.length === 0) {
            Elements.emailList.innerHTML = '<div class="empty-state">No emails found</div>';
            return;
        }

        Elements.emailList.innerHTML = AdminState.emails.map((email, index) => {
            const fromName = email.from?.name || email.from?.address || 'Unknown';
            const isUnread = email.flags && !email.flags.includes('\\Seen');
            const date = email.date ? new Date(email.date) : null;
            const dateStr = date ? this.formatEmailDate(date) : '';
            const preview = (email.text || '').replace(/\n/g, ' ').substring(0, 100);

            return `
                <div class="email-item ${isUnread ? 'unread' : ''} ${AdminState.currentEmail === index ? 'active' : ''}" 
                     onclick="EmailWidget.selectEmail(${index})">
                    <div class="email-item-header">
                        <span class="email-item-from">${truncate(fromName, 25)}</span>
                        <span class="email-item-date">${dateStr}</span>
                    </div>
                    <div class="email-item-subject">${email.subject || '(No Subject)'}</div>
                    <div class="email-item-preview">${truncate(preview, 80)}</div>
                </div>
            `;
        }).join('');
    },

    selectEmail: function (index) {
        AdminState.currentEmail = index;
        const email = AdminState.emails[index];

        // Update list selection
        document.querySelectorAll('.email-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Show email preview
        this.renderEmailPreview(email);
    },

    renderEmailPreview: function (email) {
        if (!Elements.emailPreview || !email) return;

        const fromName = email.from?.name || email.from?.address || 'Unknown';
        const fromEmail = email.from?.address || '';
        const toAddresses = email.to?.map(t => t.address).join(', ') || '';
        const date = email.date ? new Date(email.date) : null;
        const dateStr = date ? date.toLocaleString() : '';

        let attachmentsHtml = '';
        if (email.attachments && email.attachments.length > 0) {
            attachmentsHtml = `
                <div class="email-attachments">
                    <h4>Attachments (${email.attachments.length})</h4>
                    <div class="attachment-list">
                        ${email.attachments.map(att => `
                            <div class="attachment-item">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <span>${att.filename}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        Elements.emailPreview.innerHTML = `
            <div class="email-preview-header">
                <h3 class="email-preview-subject">${email.subject || '(No Subject)'}</h3>
                <div class="email-preview-meta">
                    <p><strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
                    <p><strong>To:</strong> ${toAddresses}</p>
                    <p><strong>Date:</strong> ${dateStr}</p>
                </div>
            </div>
            <div class="email-preview-body">
                ${email.html ? email.html : '<pre>' + (email.text || 'No content') + '</pre>'}
            </div>
            ${attachmentsHtml}
            <div class="email-preview-actions">
                <button class="btn btn-primary" onclick="EmailWidget.replyToEmail('${fromEmail}', '${(email.subject || '').replace(/'/g, "\\'")}')">
                    Reply
                </button>
                <button class="btn btn-secondary" onclick="EmailWidget.forwardEmail(${AdminState.currentEmail})">
                    Forward
                </button>
            </div>
        `;
    },

    formatEmailDate: function (date) {
        const now = new Date();
        const diff = now - date;
        const dayMs = 24 * 60 * 60 * 1000;

        if (diff < dayMs) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diff < 7 * dayMs) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    },

    replyToEmail: function (toEmail, subject) {
        this.openComposeModal();
        if (Elements.emailTo) Elements.emailTo.value = toEmail;
        if (Elements.emailSubject) Elements.emailSubject.value = subject.startsWith('Re:') ? subject : 'Re: ' + subject;
        document.getElementById('composeTitle').textContent = 'Reply';
    },

    forwardEmail: function (index) {
        const email = AdminState.emails[index];
        if (!email) return;

        this.openComposeModal();
        if (Elements.emailSubject) {
            Elements.emailSubject.value = email.subject?.startsWith('Fwd:') ? email.subject : 'Fwd: ' + (email.subject || '');
        }
        if (Elements.emailBody) {
            const originalText = email.text || '';
            Elements.emailBody.value = `\n\n---------- Forwarded message ----------\nFrom: ${email.from?.address || ''}\nDate: ${email.date ? new Date(email.date).toLocaleString() : ''}\nSubject: ${email.subject || ''}\n\n${originalText}`;
        }
        document.getElementById('composeTitle').textContent = 'Forward';
    },

    openComposeModal: function () {
        if (Elements.composeEmailModal) {
            Elements.composeEmailModal.classList.add('active');
        }
        document.getElementById('composeTitle').textContent = 'Compose Email';
    },

    closeComposeModal: function () {
        if (Elements.composeEmailModal) {
            Elements.composeEmailModal.classList.remove('active');
        }
        Elements.composeEmailForm?.reset();
    },

    sendEmail: async function (e) {
        e.preventDefault();

        const to = Elements.emailTo?.value;
        const subject = Elements.emailSubject?.value;
        const text = Elements.emailBody?.value;

        if (!to || !subject || !text) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const sendBtn = document.getElementById('sendEmailBtn');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = 'Sending...';
        sendBtn.disabled = true;

        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ to, subject, text })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Email sent successfully!');
                EmailWidget.closeComposeModal();

                // If currently viewing Sent folder (or similar), refresh the list to show the new email
                if (AdminState.currentFolder && AdminState.currentFolder.toLowerCase().includes('sent')) {
                    // Slight delay to allow IMAP append to finish
                    setTimeout(() => EmailWidget.loadEmails(), 1500);
                }
            } else {
                showToast(data.error || 'Failed to send email', 'error');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            showToast('Failed to send email', 'error');
        } finally {
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
        }
    },

    initEventListeners: function () {
        // Compose modal
        Elements.composeEmailBtn?.addEventListener('click', () => this.openComposeModal());
        Elements.closeComposeModal?.addEventListener('click', () => this.closeComposeModal());
        Elements.composeEmailOverlay?.addEventListener('click', () => this.closeComposeModal());
        Elements.cancelCompose?.addEventListener('click', () => this.closeComposeModal());

        // Use bind to ensure 'this' is correct in the event handler
        Elements.composeEmailForm?.addEventListener('submit', this.sendEmail.bind(this));

        // Refresh emails
        Elements.refreshEmailBtn?.addEventListener('click', () => this.loadEmails());

        // Note: Folder selection listeners are attached in renderFolderList
    }
};

// Aliases for global access if needed by onclick
window.selectEmail = (index) => EmailWidget.selectEmail(index);
window.replyToEmail = (to, subject) => EmailWidget.replyToEmail(to, subject);
window.forwardEmail = (index) => EmailWidget.forwardEmail(index);

