/**
 * Firebase Configuration for R&B Construction Consulting
 * =====================================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication (Email/Password for admin)
 * 4. Enable Firestore Database
 * 5. Enable Storage
 * 6. Go to Project Settings > General > Your apps > Add web app
 * 7. Copy the config values below
 * 8. Set up Firestore rules (see bottom of this file)
 */

// Firebase Configuration for R&B Construction Consulting
const firebaseConfig = {
    apiKey: "AIzaSyDTtokMb4gePV59jmrGzG4YR5Pa-ejXYKE",
    authDomain: "rnbconsulting-1.firebaseapp.com",
    projectId: "rnbconsulting-1",
    storageBucket: "rnbconsulting-1.firebasestorage.app",
    messagingSenderId: "580535883652",
    appId: "1:580535883652:web:ae596327a278598a906fd1",
    measurementId: "G-6S399429VV"
};

// Initialize Firebase
let db = null;
let storage = null;
let auth = null;
let analytics = null;

function initializeFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded. Some features will be unavailable.');
            return false;
        }

        // Initialize Firebase app if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Initialize services
        db = firebase.firestore();

        // Only initialize storage if the SDK is loaded
        if (typeof firebase.storage === 'function') {
            storage = firebase.storage();
        }

        // Only initialize auth if the SDK is loaded
        if (typeof firebase.auth === 'function') {
            auth = firebase.auth();
        }

        // Initialize Analytics if available
        if (firebase.analytics) {
            analytics = firebase.analytics();
        }

        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// =====================================================
// Authentication Service
// =====================================================
const AuthService = {
    // Sign in admin user
    async signIn(email, password) {
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    getCurrentUser() {
        return auth ? auth.currentUser : null;
    },

    // Listen to auth state changes
    onAuthStateChanged(callback) {
        if (auth) {
            return auth.onAuthStateChanged(callback);
        }
        return () => { };
    },

    // Check if user is admin (you can customize this)
    async isAdmin(user) {
        if (!user || !db) return false;
        try {
            const adminDoc = await db.collection('admins').doc(user.uid).get();
            return adminDoc.exists;
        } catch (error) {
            console.error('Admin check error:', error);
            return false;
        }
    }
};

// =====================================================
// Blog Service - CRUD Operations
// =====================================================
const BlogService = {
    // Collection reference
    get collection() {
        return db ? db.collection('blog_posts') : null;
    },

    // Get all published blog posts
    async getPosts(limit = 10, category = null) {
        if (!this.collection) {
            console.warn('BlogService: Firestore not initialized');
            return [];
        }

        try {
            // Simple query - just get published posts
            let query = this.collection.where('status', '==', 'published');

            if (category && category !== 'all') {
                query = query.where('category', '==', category);
            }

            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort client-side by createdAt (newest first)
            posts.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            console.log(`Blog posts loaded: ${posts.length}`);
            return posts;
        } catch (error) {
            console.error('Error fetching posts:', error);
            return [];
        }
    },

    // Get all posts (including drafts) for admin
    async getAllPosts() {
        if (!this.collection) return [];
        try {
            const snapshot = await this.collection
                .orderBy('createdAt', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching all posts:', error);
            return [];
        }
    },

    // Get single post by ID
    async getPostById(id) {
        if (!this.collection) return null;
        try {
            const doc = await this.collection.doc(id).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching post:', error);
            return null;
        }
    },

    // Get post by slug
    async getPostBySlug(slug) {
        if (!this.collection) return null;
        try {
            const snapshot = await this.collection
                .where('slug', '==', slug)
                .limit(1)
                .get();
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching post by slug:', error);
            return null;
        }
    },

    // Get featured posts
    async getFeaturedPosts(limit = 3) {
        if (!this.collection) return [];
        try {
            const snapshot = await this.collection
                .where('status', '==', 'published')
                .where('featured', '==', true)
                .orderBy('publishedAt', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching featured posts:', error);
            return [];
        }
    },

    // Create new blog post
    async createPost(postData) {
        if (!this.collection) return null;
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const slug = this.generateSlug(postData.title);

            const post = {
                ...postData,
                slug,
                createdAt: timestamp,
                updatedAt: timestamp,
                publishedAt: postData.status === 'published' ? timestamp : null,
                views: 0,
                readCount: 0
            };

            const docRef = await this.collection.add(post);
            return { id: docRef.id, ...post };
        } catch (error) {
            console.error('Error creating post:', error);
            return null;
        }
    },

    // Update blog post
    async updatePost(id, postData) {
        if (!this.collection) return false;
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();

            const updates = {
                ...postData,
                updatedAt: timestamp
            };

            // If publishing for first time
            if (postData.status === 'published') {
                const existingPost = await this.getPostById(id);
                if (existingPost && !existingPost.publishedAt) {
                    updates.publishedAt = timestamp;
                }
            }

            // Update slug if title changed
            if (postData.title) {
                updates.slug = this.generateSlug(postData.title);
            }

            await this.collection.doc(id).update(updates);
            return true;
        } catch (error) {
            console.error('Error updating post:', error);
            return false;
        }
    },

    // Delete blog post
    async deletePost(id) {
        if (!this.collection) return false;
        try {
            await this.collection.doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting post:', error);
            return false;
        }
    },

    // Increment view count
    async incrementViews(id) {
        if (!this.collection) return;
        try {
            await this.collection.doc(id).update({
                views: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    },

    // Increment read count (when article is fully read)
    async incrementReadCount(id) {
        if (!this.collection) return;
        try {
            await this.collection.doc(id).update({
                readCount: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing read count:', error);
        }
    },

    // Get categories
    async getCategories() {
        if (!db) return [];
        try {
            const snapshot = await db.collection('categories').orderBy('name').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    // Generate URL-friendly slug
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
};

// =====================================================
// Analytics Service - Track Page Views & Events
// =====================================================
const AnalyticsService = {
    // Collection reference
    get collection() {
        return db ? db.collection('analytics') : null;
    },

    // Track page view
    async trackPageView(pagePath, pageTitle) {
        if (!this.collection) return;
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const today = new Date().toISOString().split('T')[0];

            // Get visitor info
            const visitorData = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                referrer: document.referrer || 'direct'
            };

            // Add page view event
            await this.collection.add({
                type: 'page_view',
                path: pagePath,
                title: pageTitle,
                date: today,
                timestamp,
                ...visitorData
            });

            // Update daily stats
            await this.updateDailyStats(today, 'pageViews');

            // Track with Firebase Analytics if available
            if (analytics) {
                analytics.logEvent('page_view', {
                    page_path: pagePath,
                    page_title: pageTitle
                });
            }
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    },

    // Track unique visitor
    async trackVisitor() {
        if (!db) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const visitorId = this.getVisitorId();

            // Check if already tracked today
            const visitRef = db.collection('visitors').doc(`${visitorId}_${today}`);
            const visitDoc = await visitRef.get();

            if (!visitDoc.exists) {
                await visitRef.set({
                    visitorId,
                    date: today,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent,
                    language: navigator.language
                });

                // Update daily unique visitors count
                await this.updateDailyStats(today, 'uniqueVisitors');
            }
        } catch (error) {
            console.error('Error tracking visitor:', error);
        }
    },

    // Track blog read
    async trackBlogRead(postId, postTitle) {
        if (!this.collection) return;
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const today = new Date().toISOString().split('T')[0];

            await this.collection.add({
                type: 'blog_read',
                postId,
                postTitle,
                date: today,
                timestamp
            });

            // Update daily stats
            await this.updateDailyStats(today, 'blogReads');

            // Increment post read count
            BlogService.incrementReadCount(postId);
        } catch (error) {
            console.error('Error tracking blog read:', error);
        }
    },

    // Update daily statistics
    async updateDailyStats(date, field) {
        if (!db) return;
        try {
            const statsRef = db.collection('daily_stats').doc(date);
            await statsRef.set({
                [field]: firebase.firestore.FieldValue.increment(1),
                date
            }, { merge: true });
        } catch (error) {
            console.error('Error updating daily stats:', error);
        }
    },

    // Get analytics summary for admin dashboard
    async getAnalyticsSummary(days = 30) {
        if (!db) return null;
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const startDateStr = startDate.toISOString().split('T')[0];

            // Get daily stats
            const statsSnapshot = await db.collection('daily_stats')
                .where('date', '>=', startDateStr)
                .orderBy('date', 'desc')
                .get();

            const dailyStats = statsSnapshot.docs.map(doc => doc.data());

            // Calculate totals
            const totals = dailyStats.reduce((acc, day) => ({
                pageViews: (acc.pageViews || 0) + (day.pageViews || 0),
                uniqueVisitors: (acc.uniqueVisitors || 0) + (day.uniqueVisitors || 0),
                blogReads: (acc.blogReads || 0) + (day.blogReads || 0)
            }), {});

            // OPTIMIZED: Get all analytics events for the period in one query
            // and filter locally to avoid needing composite indexes (type + date)
            const analyticsSnapshot = await this.collection
                .where('date', '>=', startDateStr)
                .get();

            const pageCounts = {};
            const blogCounts = {};
            const blogTitles = {};

            analyticsSnapshot.docs.forEach(doc => {
                const data = doc.data();

                if (data.type === 'page_view') {
                    const path = data.path;
                    pageCounts[path] = (pageCounts[path] || 0) + 1;
                } else if (data.type === 'blog_read') {
                    const postId = data.postId;
                    blogCounts[postId] = (blogCounts[postId] || 0) + 1;
                    if (data.postTitle) {
                        blogTitles[postId] = data.postTitle;
                    }
                }
            });

            const topPages = Object.entries(pageCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([path, views]) => ({ path, views }));

            const topPosts = Object.entries(blogCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([postId, reads]) => ({
                    postId,
                    title: blogTitles[postId],
                    reads
                }));

            return {
                totals,
                dailyStats,
                topPages,
                topPosts
            };
        } catch (error) {
            console.error('Error getting analytics summary:', error);
            return null;
        }
    },

    // Get or create visitor ID
    getVisitorId() {
        let visitorId = localStorage.getItem('rb_visitor_id');
        if (!visitorId) {
            visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('rb_visitor_id', visitorId);
        }
        return visitorId;
    }
};

// =====================================================
// Storage Service - Image Uploads
// =====================================================
const StorageService = {
    // Upload image for blog post
    async uploadImage(file, folder = 'blog-images') {
        if (!storage) return null;
        try {
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const storageRef = storage.ref(`${folder}/${fileName}`);

            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            return {
                url: downloadURL,
                path: `${folder}/${fileName}`,
                name: file.name,
                size: file.size,
                type: file.type
            };
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    },

    // Delete image
    async deleteImage(path) {
        if (!storage) return false;
        try {
            const storageRef = storage.ref(path);
            await storageRef.delete();
            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }
};

// =====================================================
// Contact & Quote Services
// =====================================================
const ContactService = {
    async submit(formData) {
        if (!db) return null;
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await db.collection('contact_submissions').add({
                ...formData,
                status: 'new',
                createdAt: timestamp
            });
            return docRef.id;
        } catch (error) {
            console.error('Error submitting contact form:', error);
            return null;
        }
    },

    async getSubmissions(status = null) {
        if (!db) return [];
        try {
            let query = db.collection('contact_submissions').orderBy('createdAt', 'desc');
            if (status) {
                query = query.where('status', '==', status);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching contact submissions:', error);
            return [];
        }
    },

    async updateStatus(id, status) {
        if (!db) return false;
        try {
            await db.collection('contact_submissions').doc(id).update({ status });
            return true;
        } catch (error) {
            console.error('Error updating contact status:', error);
            return false;
        }
    }
};

const QuoteService = {
    async submit(formData) {
        if (!db) return null;
        try {
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await db.collection('quote_requests').add({
                ...formData,
                status: 'pending',
                createdAt: timestamp
            });
            return docRef.id;
        } catch (error) {
            console.error('Error submitting quote request:', error);
            return null;
        }
    },

    async getRequests(status = null) {
        if (!db) return [];
        try {
            let query = db.collection('quote_requests').orderBy('createdAt', 'desc');
            if (status) {
                query = query.where('status', '==', status);
            }
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching quote requests:', error);
            return [];
        }
    },

    async updateStatus(id, status) {
        if (!db) return false;
        try {
            await db.collection('quote_requests').doc(id).update({ status });
            return true;
        } catch (error) {
            console.error('Error updating quote status:', error);
            return false;
        }
    }
};

// =====================================================
// Export all services
// =====================================================
window.RBFirebase = {
    initializeFirebase,
    AuthService,
    BlogService,
    AnalyticsService,
    StorageService,
    ContactService,
    QuoteService,
    getDb: () => db,
    getStorage: () => storage,
    getAuth: () => auth
};

// Auto-initialize on DOM ready and track analytics
document.addEventListener('DOMContentLoaded', () => {
    const initialized = initializeFirebase();

    if (initialized) {
        // Track page view
        AnalyticsService.trackPageView(window.location.pathname, document.title);

        // Track unique visitor
        AnalyticsService.trackVisitor();
    }
});

/**
 * =====================================================
 * FIRESTORE SECURITY RULES
 * =====================================================
 * Copy these rules to your Firebase Console > Firestore > Rules
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Admin check function
 *     function isAdmin() {
 *       return request.auth != null && 
 *         exists(/databases/$(database)/documents/admins/$(request.auth.uid));
 *     }
 *     
 *     // Blog posts - public read, admin write
 *     match /blog_posts/{postId} {
 *       allow read: if resource.data.status == 'published' || isAdmin();
 *       allow write: if isAdmin();
 *     }
 *     
 *     // Categories - public read, admin write
 *     match /categories/{categoryId} {
 *       allow read: if true;
 *       allow write: if isAdmin();
 *     }
 *     
 *     // Analytics - write by anyone, read by admin only
 *     match /analytics/{docId} {
 *       allow write: if true;
 *       allow read: if isAdmin();
 *     }
 *     
 *     match /daily_stats/{docId} {
 *       allow write: if true;
 *       allow read: if isAdmin();
 *     }
 *     
 *     match /visitors/{docId} {
 *       allow write: if true;
 *       allow read: if isAdmin();
 *     }
 *     
 *     // Contact & Quote submissions - write by anyone, read by admin
 *     match /contact_submissions/{docId} {
 *       allow create: if true;
 *       allow read, update, delete: if isAdmin();
 *     }
 *     
 *     match /quote_requests/{docId} {
 *       allow create: if true;
 *       allow read, update, delete: if isAdmin();
 *     }
 *     
 *     // Admins collection - admin only
 *     match /admins/{userId} {
 *       allow read: if request.auth != null && request.auth.uid == userId;
 *       allow write: if false; // Manage through Firebase Console only
 *     }
 *   }
 * }
 */
