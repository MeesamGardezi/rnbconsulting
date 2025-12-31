/**
 * Admin Panel JavaScript
 * R&B Construction Consulting
 */

// =====================================================
// State Management
// =====================================================
const AdminState = {
    currentSection: 'dashboard',
    currentUser: null,
    posts: [],
    contacts: [],
    quotes: [],
    analytics: null,
    charts: {}
};

// =====================================================
// DOM Elements
// =====================================================
const Elements = {
    // Login
    loginScreen: document.getElementById('loginScreen'),
    adminDashboard: document.getElementById('adminDashboard'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),

    // Sidebar
    sidebarNav: document.querySelectorAll('.nav-item'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    logoutBtn: document.getElementById('logoutBtn'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    adminSidebar: document.getElementById('adminSidebar'),

    // Sections
    sections: document.querySelectorAll('.admin-section'),
    pageHeading: document.getElementById('pageHeading'),

    // Dashboard
    statVisitors: document.getElementById('statVisitors'),
    statPageViews: document.getElementById('statPageViews'),
    statBlogReads: document.getElementById('statBlogReads'),
    statPosts: document.getElementById('statPosts'),
    topPagesList: document.getElementById('topPagesList'),
    recentContactsList: document.getElementById('recentContactsList'),
    recentQuotesList: document.getElementById('recentQuotesList'),

    // Blog
    blogPostsBody: document.getElementById('blogPostsBody'),
    newPostBtn: document.getElementById('newPostBtn'),
    postEditorModal: document.getElementById('postEditorModal'),
    postEditorForm: document.getElementById('postEditorForm'),
    closeModal: document.getElementById('closeModal'),
    cancelPost: document.getElementById('cancelPost'),
    saveDraft: document.getElementById('saveDraft'),
    modalOverlay: document.getElementById('modalOverlay'),

    // Analytics
    analyticsPeriod: document.getElementById('analyticsPeriod'),
    analyticsTotalVisitors: document.getElementById('analyticsTotalVisitors'),
    analyticsTotalViews: document.getElementById('analyticsTotalViews'),
    analyticsTotalReads: document.getElementById('analyticsTotalReads'),
    analyticsAvgViews: document.getElementById('analyticsAvgViews'),
    analyticsTopPages: document.getElementById('analyticsTopPages'),
    analyticsTopPosts: document.getElementById('analyticsTopPosts'),

    // Contact & Quotes
    contactsList: document.getElementById('contactsList'),
    quotesList: document.getElementById('quotesList'),

    // Submission Modal
    submissionModal: document.getElementById('submissionModal'),
    submissionOverlay: document.getElementById('submissionOverlay'),
    closeSubmissionModal: document.getElementById('closeSubmissionModal'),
    submissionDetails: document.getElementById('submissionDetails'),
    submissionStatus: document.getElementById('submissionStatus'),
    updateSubmissionStatus: document.getElementById('updateSubmissionStatus'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// =====================================================
// Utility Functions
// =====================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    Elements.toastContainer.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => toast.remove(), 5000);
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function truncate(str, length = 50) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
}

// =====================================================
// Authentication (Server-side Session)
// =====================================================
async function initAuth() {
    // Check if already logged in
    try {
        const response = await fetch('/api/admin/session');
        const data = await response.json();

        if (data.authenticated) {
            AdminState.currentUser = data.user;
            showAdminDashboard();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Session check error:', error);
        showLoginScreen();
    }
}

function showLoginScreen() {
    Elements.loginScreen.style.display = 'flex';
    Elements.adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    Elements.loginScreen.style.display = 'none';
    Elements.adminDashboard.style.display = 'flex';

    // Update user info
    if (AdminState.currentUser) {
        Elements.userEmail.textContent = AdminState.currentUser.email;
        Elements.userName.textContent = AdminState.currentUser.name || AdminState.currentUser.email.split('@')[0];
    }

    // Load dashboard data
    loadDashboardData();
}

async function handleLogin(e) {
    e.preventDefault();

    const email = Elements.loginEmail.value;
    const password = Elements.loginPassword.value;

    Elements.loginError.textContent = '';

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            AdminState.currentUser = data.user;
            showAdminDashboard();
            showToast('Welcome back!');
        } else {
            Elements.loginError.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        Elements.loginError.textContent = 'An error occurred. Please try again.';
    }
}

async function handleLogout() {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        AdminState.currentUser = null;
        showLoginScreen();
        showToast('Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// =====================================================
// Navigation
// =====================================================
function initNavigation() {
    // Sidebar navigation
    Elements.sidebarNav.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navigateToSection(section);
        });
    });

    // View all links
    document.querySelectorAll('.view-all-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            navigateToSection(section);
        });
    });

    // Mobile menu toggle
    Elements.mobileMenuBtn?.addEventListener('click', () => {
        Elements.adminSidebar.classList.toggle('open');
    });

    // Sidebar toggle
    Elements.sidebarToggle?.addEventListener('click', () => {
        Elements.adminSidebar.classList.toggle('collapsed');
    });
}

function navigateToSection(section) {
    AdminState.currentSection = section;

    // Update nav items
    Elements.sidebarNav.forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    // Update sections
    Elements.sections.forEach(sec => {
        sec.classList.toggle('active', sec.dataset.section === section);
    });

    // Update heading
    const headings = {
        dashboard: 'Dashboard',
        blog: 'Blog Posts',
        analytics: 'Analytics',
        contacts: 'Contact Forms',
        quotes: 'Quote Requests'
    };
    Elements.pageHeading.textContent = headings[section] || 'Dashboard';

    // Load section-specific data
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'blog':
            loadBlogPosts();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'quotes':
            loadQuotes();
            break;
    }

    // Close mobile menu
    Elements.adminSidebar.classList.remove('open');
}

// =====================================================
// Dashboard
// =====================================================
async function loadDashboardData() {
    try {
        // Load blog posts first (we use this for stats and blog reads)
        const posts = await RBFirebase.BlogService.getAllPosts();
        const publishedPosts = posts.filter(p => p.status === 'published');

        // Calculate total blog reads from all posts
        const totalBlogReads = posts.reduce((sum, post) => sum + (post.views || 0), 0);

        // Update stats
        Elements.statPosts.textContent = publishedPosts.length;
        Elements.statBlogReads.textContent = totalBlogReads.toLocaleString();

        // Load analytics summary
        const analytics = await RBFirebase.AnalyticsService.getAnalyticsSummary(30);

        if (analytics) {
            Elements.statVisitors.textContent = (analytics.totals.uniqueVisitors || 0).toLocaleString();
            Elements.statPageViews.textContent = (analytics.totals.pageViews || 0).toLocaleString();

            // Render top pages
            renderTopPages(analytics.topPages);

            // Render page views chart
            renderPageViewsChart(analytics.dailyStats);
        } else {
            // No analytics data yet
            Elements.statVisitors.textContent = '0';
            Elements.statPageViews.textContent = '0';
        }

        // Load recent contacts
        const contacts = await RBFirebase.ContactService.getSubmissions();
        renderRecentContacts(contacts.slice(0, 5));

        // Load recent quotes
        const quotes = await RBFirebase.QuoteService.getRequests();
        renderRecentQuotes(quotes.slice(0, 5));

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

function renderTopPages(pages) {
    if (!pages || pages.length === 0) {
        Elements.topPagesList.innerHTML = '<li class="empty">No data available</li>';
        return;
    }

    Elements.topPagesList.innerHTML = pages.map(page => `
        <li>
            <span class="page-path">${page.path}</span>
            <span class="page-views">${page.views.toLocaleString()} views</span>
        </li>
    `).join('');
}

function renderRecentContacts(contacts) {
    if (!contacts || contacts.length === 0) {
        Elements.recentContactsList.innerHTML = '<li class="empty">No submissions yet</li>';
        return;
    }

    // Store contacts in state for viewSubmission to access
    AdminState.contacts = contacts;

    Elements.recentContactsList.innerHTML = contacts.map(contact => `
        <li class="status-${contact.status || 'new'} clickable-item" onclick="viewSubmission('contact', '${contact.id}')">
            <div class="item-main">
                <span class="item-name">${contact.firstName} ${contact.lastName}</span>
                <span class="item-subject">${contact.subject || 'General Inquiry'}</span>
            </div>
            <span class="item-date">${formatDate(contact.createdAt)}</span>
        </li>
    `).join('');
}

function renderRecentQuotes(quotes) {
    if (!quotes || quotes.length === 0) {
        Elements.recentQuotesList.innerHTML = '<li class="empty">No requests yet</li>';
        return;
    }

    // Store quotes in state for viewSubmission to access
    AdminState.quotes = quotes;

    Elements.recentQuotesList.innerHTML = quotes.map(quote => `
        <li class="status-${quote.status || 'pending'} clickable-item" onclick="viewSubmission('quote', '${quote.id}')">
            <div class="item-main">
                <span class="item-name">${quote.company || quote.firstName + ' ' + quote.lastName}</span>
                <span class="item-subject">${quote.projectType || 'Not specified'}</span>
            </div>
            <span class="item-date">${formatDate(quote.createdAt)}</span>
        </li>
    `).join('');
}

function renderPageViewsChart(dailyStats) {
    const ctx = document.getElementById('pageViewsChart');
    if (!ctx) return;

    // Destroy existing chart
    if (AdminState.charts.pageViews) {
        AdminState.charts.pageViews.destroy();
    }

    // Prepare data (last 30 days)
    const labels = [];
    const data = [];

    if (dailyStats) {
        dailyStats.slice(0, 30).reverse().forEach(day => {
            labels.push(new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            data.push(day.pageViews || 0);
        });
    }

    AdminState.charts.pageViews = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Page Views',
                data,
                borderColor: '#b8860b',
                backgroundColor: 'rgba(184, 134, 11, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// =====================================================
// Blog Posts Management
// =====================================================
async function loadBlogPosts() {
    try {
        AdminState.posts = await RBFirebase.BlogService.getAllPosts();
        renderBlogPosts();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        showToast('Error loading blog posts', 'error');
    }
}

function renderBlogPosts() {
    if (!AdminState.posts || AdminState.posts.length === 0) {
        Elements.blogPostsBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">No blog posts yet. Create your first post!</td>
            </tr>
        `;
        return;
    }

    Elements.blogPostsBody.innerHTML = AdminState.posts.map(post => `
        <tr>
            <td>
                <div class="post-title-cell">
                    ${post.featured ? '<span class="featured-badge">★</span>' : ''}
                    <span>${truncate(post.title, 40)}</span>
                </div>
            </td>
            <td>${post.category || 'Uncategorized'}</td>
            <td>
                <span class="status-badge status-${post.status}">${post.status}</span>
            </td>
            <td>${(post.views || 0).toLocaleString()}</td>
            <td>${formatDate(post.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editPost('${post.id}')" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn delete" onclick="deletePost('${post.id}')" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openPostEditor(post = null) {
    const modal = Elements.postEditorModal;
    const form = Elements.postEditorForm;
    const title = document.getElementById('editorTitle');

    if (post) {
        title.textContent = 'Edit Blog Post';
        document.getElementById('postId').value = post.id;
        document.getElementById('postTitle').value = post.title || '';
        document.getElementById('postExcerpt').value = post.excerpt || '';
        document.getElementById('postContent').value = post.content || '';
        document.getElementById('postStatus').value = post.status || 'draft';
        document.getElementById('postCategory').value = post.category || '';
        document.getElementById('postReadTime').value = post.readTime || 5;
        document.getElementById('postFeatured').checked = post.featured || false;
        document.getElementById('postAuthor').value = post.author || '';
        document.getElementById('postImageUrl').value = post.featuredImage || '';

        // Show image preview if exists
        const preview = document.getElementById('imagePreview');
        if (post.featuredImage) {
            preview.innerHTML = `<img src="${post.featuredImage}" alt="Preview">`;
        } else {
            preview.innerHTML = '<span>Click to upload or drag and drop</span>';
        }
    } else {
        title.textContent = 'New Blog Post';
        form.reset();
        document.getElementById('postId').value = '';
        document.getElementById('imagePreview').innerHTML = '<span>Click to upload or drag and drop</span>';
    }

    modal.classList.add('active');
}

function closePostEditor() {
    Elements.postEditorModal.classList.remove('active');
}

async function savePost(status = 'published') {
    const postId = document.getElementById('postId').value;
    const postData = {
        title: document.getElementById('postTitle').value,
        excerpt: document.getElementById('postExcerpt').value,
        content: document.getElementById('postContent').value,
        status: status,
        category: document.getElementById('postCategory').value,
        readTime: parseInt(document.getElementById('postReadTime').value) || 5,
        featured: document.getElementById('postFeatured').checked,
        author: document.getElementById('postAuthor').value,
        featuredImage: document.getElementById('postImageUrl').value
    };

    try {
        if (postId) {
            // Update existing post
            await RBFirebase.BlogService.updatePost(postId, postData);
            showToast('Post updated successfully');
        } else {
            // Create new post
            await RBFirebase.BlogService.createPost(postData);
            showToast('Post created successfully');
        }

        closePostEditor();
        loadBlogPosts();
    } catch (error) {
        console.error('Error saving post:', error);
        showToast('Error saving post', 'error');
    }
}

window.editPost = async function (postId) {
    const post = AdminState.posts.find(p => p.id === postId);
    if (post) {
        openPostEditor(post);
    }
};

window.deletePost = async function (postId) {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        try {
            await RBFirebase.BlogService.deletePost(postId);
            showToast('Post deleted successfully');
            loadBlogPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast('Error deleting post', 'error');
        }
    }
};

// Image upload
function initImageUpload() {
    const imageInput = document.getElementById('postImage');
    const preview = document.getElementById('imagePreview');

    preview?.addEventListener('click', () => imageInput?.click());

    imageInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            preview.innerHTML = '<span>Uploading...</span>';

            try {
                const result = await RBFirebase.StorageService.uploadImage(file);
                if (result) {
                    document.getElementById('postImageUrl').value = result.url;
                    preview.innerHTML = `<img src="${result.url}" alt="Preview">`;
                    showToast('Image uploaded successfully');
                } else {
                    preview.innerHTML = '<span>Upload failed. Click to try again.</span>';
                    showToast('Image upload failed', 'error');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                preview.innerHTML = '<span>Upload failed. Click to try again.</span>';
                showToast('Image upload failed', 'error');
            }
        }
    });
}

// =====================================================
// Analytics
// =====================================================
async function loadAnalytics() {
    const days = parseInt(Elements.analyticsPeriod.value) || 30;

    try {
        const analytics = await RBFirebase.AnalyticsService.getAnalyticsSummary(days);
        AdminState.analytics = analytics;

        if (analytics) {
            // Update totals
            Elements.analyticsTotalVisitors.textContent = (analytics.totals.uniqueVisitors || 0).toLocaleString();
            Elements.analyticsTotalViews.textContent = (analytics.totals.pageViews || 0).toLocaleString();
            Elements.analyticsTotalReads.textContent = (analytics.totals.blogReads || 0).toLocaleString();

            const avgViews = analytics.dailyStats.length > 0
                ? Math.round((analytics.totals.pageViews || 0) / analytics.dailyStats.length)
                : 0;
            Elements.analyticsAvgViews.textContent = avgViews.toLocaleString();

            // Render top pages
            renderAnalyticsTopPages(analytics.topPages);

            // Render top posts
            renderAnalyticsTopPosts(analytics.topPosts);

            // Render traffic chart
            renderTrafficChart(analytics.dailyStats);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Error loading analytics', 'error');
    }
}

function renderAnalyticsTopPages(pages) {
    if (!pages || pages.length === 0) {
        Elements.analyticsTopPages.innerHTML = '<li class="empty">No data available</li>';
        return;
    }

    Elements.analyticsTopPages.innerHTML = pages.map((page, index) => `
        <li>
            <span class="rank">${index + 1}</span>
            <span class="page-path">${page.path}</span>
            <span class="page-views">${page.views.toLocaleString()}</span>
        </li>
    `).join('');
}

function renderAnalyticsTopPosts(posts) {
    if (!posts || posts.length === 0) {
        Elements.analyticsTopPosts.innerHTML = '<li class="empty">No data available</li>';
        return;
    }

    Elements.analyticsTopPosts.innerHTML = posts.map((post, index) => `
        <li>
            <span class="rank">${index + 1}</span>
            <span class="post-title">${truncate(post.title, 30)}</span>
            <span class="post-reads">${post.reads.toLocaleString()} reads</span>
        </li>
    `).join('');
}

function renderTrafficChart(dailyStats) {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) return;

    // Destroy existing chart
    if (AdminState.charts.traffic) {
        AdminState.charts.traffic.destroy();
    }

    // Prepare data
    const labels = [];
    const pageViewsData = [];
    const visitorsData = [];
    const readsData = [];

    if (dailyStats) {
        dailyStats.slice().reverse().forEach(day => {
            labels.push(new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            pageViewsData.push(day.pageViews || 0);
            visitorsData.push(day.uniqueVisitors || 0);
            readsData.push(day.blogReads || 0);
        });
    }

    AdminState.charts.traffic = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Page Views',
                    data: pageViewsData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Visitors',
                    data: visitorsData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Blog Reads',
                    data: readsData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// =====================================================
// Contacts
// =====================================================
async function loadContacts(filter = 'all') {
    try {
        AdminState.contacts = await RBFirebase.ContactService.getSubmissions();
        renderContacts(filter);
    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast('Error loading contacts', 'error');
    }
}

function renderContacts(filter = 'all') {
    let contacts = AdminState.contacts;

    if (filter !== 'all') {
        contacts = contacts.filter(c => c.status === filter);
    }

    if (!contacts || contacts.length === 0) {
        Elements.contactsList.innerHTML = '<div class="empty-state">No submissions found</div>';
        return;
    }

    Elements.contactsList.innerHTML = contacts.map(contact => `
        <div class="submission-card status-${contact.status || 'new'}" onclick="viewSubmission('contact', '${contact.id}')">
            <div class="submission-header">
                <span class="submission-name">${contact.firstName} ${contact.lastName}</span>
                <span class="submission-status status-${contact.status || 'new'}">${contact.status || 'new'}</span>
            </div>
            <div class="submission-email">${contact.email}</div>
            <div class="submission-subject">${contact.subject || 'General Inquiry'}</div>
            <div class="submission-preview">${truncate(contact.message, 100)}</div>
            <div class="submission-date">${formatDateTime(contact.createdAt)}</div>
        </div>
    `).join('');
}

// =====================================================
// Quotes
// =====================================================
async function loadQuotes(filter = 'all') {
    try {
        AdminState.quotes = await RBFirebase.QuoteService.getRequests();
        renderQuotes(filter);
    } catch (error) {
        console.error('Error loading quotes:', error);
        showToast('Error loading quotes', 'error');
    }
}

function renderQuotes(filter = 'all') {
    let quotes = AdminState.quotes;

    if (filter !== 'all') {
        quotes = quotes.filter(q => q.status === filter);
    }

    if (!quotes || quotes.length === 0) {
        Elements.quotesList.innerHTML = '<div class="empty-state">No quote requests found</div>';
        return;
    }

    Elements.quotesList.innerHTML = quotes.map(quote => `
        <div class="submission-card status-${quote.status || 'pending'}" onclick="viewSubmission('quote', '${quote.id}')">
            <div class="submission-header">
                <span class="submission-name">${quote.company || `${quote.firstName} ${quote.lastName}`}</span>
                <span class="submission-status status-${quote.status || 'pending'}">${quote.status || 'pending'}</span>
            </div>
            <div class="submission-email">${quote.email}</div>
            <div class="submission-details">
                <span class="detail-item">
                    <strong>Type:</strong> ${quote.projectType || 'Not specified'}
                </span>
                <span class="detail-item">
                    <strong>Value:</strong> ${quote.projectValue || 'Not specified'}
                </span>
            </div>
            <div class="submission-services">
                ${(quote.services || []).map(s => `<span class="service-tag">${s}</span>`).join('')}
            </div>
            <div class="submission-date">${formatDateTime(quote.createdAt)}</div>
        </div>
    `).join('');
}

// =====================================================
// View Submission
// =====================================================
let currentSubmission = { type: null, id: null };

window.viewSubmission = function (type, id) {
    currentSubmission = { type, id };

    let data;
    let statusOptions;

    if (type === 'contact') {
        data = AdminState.contacts.find(c => c.id === id);
        statusOptions = ['new', 'read', 'replied'];
    } else {
        data = AdminState.quotes.find(q => q.id === id);
        statusOptions = ['pending', 'reviewed', 'quoted', 'closed'];
    }

    if (!data) return;

    // Update status selector
    Elements.submissionStatus.innerHTML = statusOptions
        .map(s => `<option value="${s}" ${data.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`)
        .join('');

    // Render details
    let detailsHtml = '';

    if (type === 'contact') {
        detailsHtml = `
            <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">${data.firstName} ${data.lastName}</span>
            </div>
            <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
            </div>
            ${data.phone ? `
            <div class="detail-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
            </div>
            ` : ''}
            ${data.company ? `
            <div class="detail-row">
                <span class="label">Company:</span>
                <span class="value">${data.company}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="label">Subject:</span>
                <span class="value">${data.subject || 'General Inquiry'}</span>
            </div>
            <div class="detail-row full">
                <span class="label">Message:</span>
                <p class="message-content">${data.message || 'No message provided'}</p>
            </div>
            <div class="detail-row">
                <span class="label">Submitted:</span>
                <span class="value">${formatDateTime(data.createdAt)}</span>
            </div>
        `;
    } else {
        detailsHtml = `
            <div class="detail-row">
                <span class="label">Contact:</span>
                <span class="value">${data.firstName} ${data.lastName}</span>
            </div>
            <div class="detail-row">
                <span class="label">Company:</span>
                <span class="value">${data.company || 'Not specified'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
            </div>
            <div class="detail-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
            </div>
            <div class="detail-row">
                <span class="label">Project Type:</span>
                <span class="value">${data.projectType || 'Not specified'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Project Value:</span>
                <span class="value">${data.projectValue || 'Not specified'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Timeline:</span>
                <span class="value">${data.timeline || 'Not specified'}</span>
            </div>
            <div class="detail-row full">
                <span class="label">Services Needed:</span>
                <div class="services-list">
                    ${(data.services || []).map(s => `<span class="service-tag">${s}</span>`).join('') || 'None selected'}
                </div>
            </div>
            <div class="detail-row full">
                <span class="label">Project Description:</span>
                <p class="message-content">${data.projectDescription || 'No description provided'}</p>
            </div>
            ${data.challenges ? `
            <div class="detail-row full">
                <span class="label">Challenges:</span>
                <p class="message-content">${data.challenges}</p>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="label">Submitted:</span>
                <span class="value">${formatDateTime(data.createdAt)}</span>
            </div>
        `;
    }

    Elements.submissionDetails.innerHTML = detailsHtml;
    document.getElementById('submissionTitle').textContent = type === 'contact' ? 'Contact Submission' : 'Quote Request';
    Elements.submissionModal.classList.add('active');
};

async function updateSubmissionStatus() {
    const { type, id } = currentSubmission;
    const newStatus = Elements.submissionStatus.value;

    try {
        if (type === 'contact') {
            await RBFirebase.ContactService.updateStatus(id, newStatus);
            loadContacts();
        } else {
            await RBFirebase.QuoteService.updateStatus(id, newStatus);
            loadQuotes();
        }

        showToast('Status updated successfully');
        Elements.submissionModal.classList.remove('active');
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status', 'error');
    }
}

// =====================================================
// Filter Tabs
// =====================================================
function initFilterTabs() {
    document.querySelectorAll('.filter-tabs').forEach(tabs => {
        tabs.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const filter = tab.dataset.filter;
                const section = tab.closest('.admin-section').dataset.section;

                if (section === 'contacts') {
                    renderContacts(filter);
                } else if (section === 'quotes') {
                    renderQuotes(filter);
                }
            });
        });
    });
}

// =====================================================
// Event Listeners
// =====================================================
function initEventListeners() {
    // Login
    Elements.loginForm?.addEventListener('submit', handleLogin);
    Elements.logoutBtn?.addEventListener('click', handleLogout);

    // Blog editor
    Elements.newPostBtn?.addEventListener('click', () => openPostEditor());
    Elements.closeModal?.addEventListener('click', closePostEditor);
    Elements.modalOverlay?.addEventListener('click', closePostEditor);
    Elements.cancelPost?.addEventListener('click', closePostEditor);
    Elements.saveDraft?.addEventListener('click', () => savePost('draft'));
    Elements.postEditorForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        savePost('published');
    });

    // Submission modal
    Elements.closeSubmissionModal?.addEventListener('click', () => {
        Elements.submissionModal.classList.remove('active');
    });
    Elements.submissionOverlay?.addEventListener('click', () => {
        Elements.submissionModal.classList.remove('active');
    });
    Elements.updateSubmissionStatus?.addEventListener('click', updateSubmissionStatus);

    // Analytics period
    Elements.analyticsPeriod?.addEventListener('change', loadAnalytics);

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePostEditor();
            Elements.submissionModal?.classList.remove('active');
        }
    });
}

// =====================================================
// Initialize
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase first
    if (typeof RBFirebase !== 'undefined') {
        RBFirebase.initializeFirebase();
    }

    // Initialize admin panel
    initAuth();
    initNavigation();
    initEventListeners();
    initFilterTabs();
    initImageUpload();
});
