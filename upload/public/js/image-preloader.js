/**
 * R&B Construction Consulting - Smart Image Preloader
 * =====================================================
 * McMaster-Carr style predictive image loading system
 * 
 * Features:
 * - Hover-triggered preloading with debounce
 * - Memory cache to avoid duplicate requests
 * - Session storage for cross-page persistence
 * - Cost-conscious: no duplicate Firebase storage reads
 * - Priority hints for optimal loading
 * - Intersection Observer for viewport proximity
 */

const ImagePreloader = (function () {
    'use strict';

    // =====================================================
    // Configuration
    // =====================================================
    const CONFIG = {
        // Debounce delay before starting preload (ms)
        // Set to 0 for INSTANT preloading on hover
        hoverDebounceMs: 0,

        // Maximum number of images to keep in memory cache
        maxMemoryCacheSize: 50,

        // Session storage key for tracking preloaded URLs
        sessionStorageKey: 'rb_preloaded_images',

        // Maximum URLs to track in session storage
        maxSessionUrls: 100,

        // Whether to use low priority for preloads (saves bandwidth)
        useLowPriority: true,

        // CORS mode for Firebase Storage images
        crossOrigin: 'anonymous',

        // Image types that can be preloaded
        supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],

        // Firebase Storage domains for CORS handling
        firebaseStorageDomains: [
            'firebasestorage.googleapis.com',
            'storage.googleapis.com'
        ]
    };

    // =====================================================
    // State
    // =====================================================

    // In-memory cache of preloaded images (Map: url -> Image)
    const memoryCache = new Map();

    // Set of URLs currently being preloaded
    const pendingLoads = new Set();

    // Track hover timers for debouncing
    const hoverTimers = new WeakMap();

    // Track observed elements
    const observedElements = new WeakSet();

    // =====================================================
    // Session Storage Management
    // =====================================================

    /**
     * Get previously preloaded URLs from session storage
     * These images are likely still in browser cache
     */
    function getSessionPreloadedUrls() {
        try {
            const stored = sessionStorage.getItem(CONFIG.sessionStorageKey);
            if (stored) {
                return new Set(JSON.parse(stored));
            }
        } catch (e) {
            console.warn('ImagePreloader: Session storage read error', e);
        }
        return new Set();
    }

    /**
     * Add URL to session storage tracking
     */
    function addToSessionStorage(url) {
        try {
            const urls = getSessionPreloadedUrls();
            urls.add(url);

            // Trim if exceeds max size (FIFO)
            const urlArray = Array.from(urls);
            if (urlArray.length > CONFIG.maxSessionUrls) {
                const trimmed = urlArray.slice(-CONFIG.maxSessionUrls);
                sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(trimmed));
            } else {
                sessionStorage.setItem(CONFIG.sessionStorageKey, JSON.stringify(urlArray));
            }
        } catch (e) {
            console.warn('ImagePreloader: Session storage write error', e);
        }
    }

    /**
     * Check if URL was already preloaded in this session
     */
    function isPreloadedInSession(url) {
        return getSessionPreloadedUrls().has(url);
    }

    // =====================================================
    // URL Utilities
    // =====================================================

    /**
     * Check if URL is from Firebase Storage (needs CORS handling)
     */
    function isFirebaseStorageUrl(url) {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return CONFIG.firebaseStorageDomains.some(domain =>
                urlObj.hostname.includes(domain)
            );
        } catch {
            return false;
        }
    }

    /**
     * Normalize URL for consistent caching
     */
    function normalizeUrl(url) {
        if (!url) return null;

        // Remove query parameters that don't affect the image
        // (Firebase Storage URLs have tokens, keep those)
        return url.trim();
    }

    /**
     * Check if image is already in memory or pending
     */
    function isAlreadyPreloaded(url) {
        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) return true;

        return (
            memoryCache.has(normalizedUrl) ||
            pendingLoads.has(normalizedUrl) ||
            isPreloadedInSession(normalizedUrl)
        );
    }

    // =====================================================
    // Core Preloading Logic
    // =====================================================

    /**
     * Preload a single image
     * @param {string} url - Image URL to preload
     * @param {Object} options - Additional options
     * @returns {Promise<HTMLImageElement|null>}
     */
    function preloadImage(url, options = {}) {
        const normalizedUrl = normalizeUrl(url);

        if (!normalizedUrl) {
            return Promise.resolve(null);
        }

        // Skip if already preloaded or pending
        if (isAlreadyPreloaded(normalizedUrl)) {
            console.log(`ImagePreloader: Skipping (cached) ${normalizedUrl.substring(0, 60)}...`);
            return Promise.resolve(memoryCache.get(normalizedUrl) || null);
        }

        // Mark as pending
        pendingLoads.add(normalizedUrl);

        return new Promise((resolve) => {
            const img = new Image();

            // Note: We don't set crossorigin for Firebase Storage URLs because
            // Firebase CORS isn't configured. The image will still preload fine
            // and be cached by the browser, just not accessible via canvas.

            // Use low priority fetch if supported and configured
            if (CONFIG.useLowPriority && 'fetchPriority' in img) {
                img.fetchPriority = 'low';
            }

            // Handle successful load
            img.onload = () => {
                pendingLoads.delete(normalizedUrl);

                // Add to memory cache (with size limit)
                if (memoryCache.size >= CONFIG.maxMemoryCacheSize) {
                    // Remove oldest entry (first in map)
                    const firstKey = memoryCache.keys().next().value;
                    memoryCache.delete(firstKey);
                }
                memoryCache.set(normalizedUrl, img);

                // Track in session storage
                addToSessionStorage(normalizedUrl);

                console.log(`ImagePreloader: ✓ Preloaded ${normalizedUrl.substring(0, 60)}...`);
                resolve(img);
            };

            // Handle error (silent fail - don't block anything)
            img.onerror = () => {
                pendingLoads.delete(normalizedUrl);
                console.warn(`ImagePreloader: ✗ Failed to preload ${normalizedUrl.substring(0, 60)}...`);
                resolve(null);
            };

            // Start loading
            img.src = normalizedUrl;
        });
    }

    /**
     * Preload multiple images
     * @param {string[]} urls - Array of image URLs
     * @returns {Promise<(HTMLImageElement|null)[]>}
     */
    function preloadImages(urls) {
        if (!Array.isArray(urls)) {
            return Promise.resolve([]);
        }

        return Promise.all(
            urls.filter(url => url && !isAlreadyPreloaded(url))
                .map(url => preloadImage(url))
        );
    }

    // =====================================================
    // Hover-Triggered Preloading (McMaster-Carr Style)
    // =====================================================

    /**
     * Extract image URL from a blog card/article element
     * @param {HTMLElement} element - The card element
     * @returns {string|null}
     */
    function extractImageUrl(element) {
        // Try common image locations
        const img = element.querySelector('img');
        if (img) {
            // Prefer data-src (lazy loading) or src
            return img.dataset.src || img.src || null;
        }

        // Check for background image
        const bgElements = element.querySelectorAll('[style*="background"]');
        for (const el of bgElements) {
            const match = el.style.backgroundImage?.match(/url\(['"]?([^'")+]+)['"]?\)/);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Extract blog post data from card element (including full post image)
     * @param {HTMLElement} element - The card element
     * @returns {Object}
     */
    function extractBlogPostData(element) {
        const data = {
            imageUrl: extractImageUrl(element),
            postId: element.dataset?.postId || null,
            slug: element.dataset?.slug || null
        };

        // Try to find the full article URL for prediction
        const link = element.querySelector('a[href*="/blog/"]') ||
            element.closest('a[href*="/blog/"]');
        if (link) {
            data.articleUrl = link.href;
            // Extract slug from URL
            const urlParts = link.href.split('/blog/');
            if (urlParts[1]) {
                data.slug = urlParts[1].split('/')[0].split('?')[0];
            }
        }

        return data;
    }

    /**
     * Attach hover preloading to a single element
     * @param {HTMLElement} element - Element to attach preloading to
     * @param {Object} options - Configuration options
     */
    function attachHoverPreload(element, options = {}) {
        if (!element || observedElements.has(element)) {
            return;
        }

        const {
            extractUrl = extractImageUrl,
            debounceMs = CONFIG.hoverDebounceMs,
            onPreloadStart = null,
            onPreloadComplete = null
        } = options;

        // Track that we've set up this element
        observedElements.add(element);

        // Mouse enter - INSTANT preload (no delay when debounceMs is 0)
        element.addEventListener('mouseenter', () => {
            const url = typeof extractUrl === 'function'
                ? extractUrl(element)
                : element.dataset?.preloadUrl;

            if (!url || isAlreadyPreloaded(url)) {
                return;
            }

            // INSTANT preloading - no debounce
            if (debounceMs === 0) {
                if (onPreloadStart) onPreloadStart(element, url);
                preloadImage(url).then(img => {
                    if (onPreloadComplete) onPreloadComplete(element, url, img);
                });
                return;
            }

            // Clear any existing timer (for debounced mode)
            const existingTimer = hoverTimers.get(element);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            // Debounced preload
            const timer = setTimeout(() => {
                if (onPreloadStart) onPreloadStart(element, url);
                preloadImage(url).then(img => {
                    if (onPreloadComplete) onPreloadComplete(element, url, img);
                });
            }, debounceMs);

            hoverTimers.set(element, timer);
        });

        // Mouse leave - cancel pending preload (only matters for debounced mode)
        element.addEventListener('mouseleave', () => {
            const timer = hoverTimers.get(element);
            if (timer) {
                clearTimeout(timer);
                hoverTimers.delete(element);
            }
        });
    }

    /**
     * Attach hover preloading to all matching elements
     * @param {string} selector - CSS selector for elements
     * @param {Object} options - Configuration options
     */
    function attachToSelector(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => attachHoverPreload(el, options));
        console.log(`ImagePreloader: Attached to ${elements.length} elements matching "${selector}"`);
    }

    // =====================================================
    // Blog-Specific Preloading
    // =====================================================

    /**
     * Initialize blog card preloading
     * This attaches hover listeners to blog cards on both homepage and blog page
     */
    function initBlogCardPreloading() {
        // Selectors for blog cards across the site
        const blogCardSelectors = [
            '.blog-card',           // Homepage blog cards
            '.article-card',        // Blog page article cards  
            '.featured-article',    // Featured article in blog hero
            '[data-preload-image]'  // Generic opt-in elements
        ];

        blogCardSelectors.forEach(selector => {
            attachToSelector(selector, {
                extractUrl: (element) => {
                    // Get the featured/thumbnail image
                    const img = element.querySelector('img');
                    if (!img) return null;

                    // If it's a low-res placeholder, try to get higher res
                    const src = img.dataset.src || img.src;

                    // For Unsplash images, we might want to preload larger size
                    // But for Firebase Storage, always use the actual URL
                    if (isFirebaseStorageUrl(src)) {
                        return src;
                    }

                    return src;
                },
                debounceMs: CONFIG.hoverDebounceMs,
                onPreloadComplete: (element, url, img) => {
                    // Add a class to indicate preload complete (for CSS transitions)
                    element.classList.add('image-preloaded');
                }
            });
        });

        // Set up mutation observer for dynamically loaded content
        setupMutationObserver(blogCardSelectors);
    }

    /**
     * Set up mutation observer for dynamically added elements
     */
    function setupMutationObserver(selectors) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;

                    // Check if the added node matches our selectors
                    selectors.forEach(selector => {
                        if (node.matches && node.matches(selector)) {
                            attachHoverPreload(node, {
                                extractUrl: extractImageUrl,
                                debounceMs: CONFIG.hoverDebounceMs
                            });
                        }

                        // Check children
                        const children = node.querySelectorAll?.(selector);
                        if (children) {
                            children.forEach(child => {
                                attachHoverPreload(child, {
                                    extractUrl: extractImageUrl,
                                    debounceMs: CONFIG.hoverDebounceMs
                                });
                            });
                        }
                    });
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    // =====================================================
    // Intersection Observer - Proximity Preloading
    // =====================================================

    /**
     * Preload images as user scrolls near them
     * More aggressive than hover, but still cost-conscious
     */
    function initProximityPreloading(options = {}) {
        const {
            selector = '.blog-card img, .article-card img',
            rootMargin = '200px', // Preload when within 200px of viewport
            threshold = 0
        } = options;

        if (!('IntersectionObserver' in window)) {
            console.log('ImagePreloader: IntersectionObserver not supported');
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const url = img.dataset.src || img.src;

                    if (url && !isAlreadyPreloaded(url)) {
                        // Low priority preload for proximity
                        preloadImage(url);
                    }

                    // Unobserve after preloading
                    observer.unobserve(img);
                }
            });
        }, { rootMargin, threshold });

        // Observe all matching images
        document.querySelectorAll(selector).forEach(img => {
            observer.observe(img);
        });

        return observer;
    }

    // =====================================================
    // Link Prefetching (for blog post pages)
    // =====================================================

    /**
     * When hovering on a blog card, prefetch the blog post page
     * This makes navigation feel instant
     */
    function initLinkPrefetching() {
        // Only if prefetch is supported
        if (!document.createElement('link').relList?.supports?.('prefetch')) {
            console.log('ImagePreloader: Link prefetch not supported');
            return;
        }

        const prefetchedUrls = new Set();

        document.addEventListener('mouseenter', (e) => {
            // Ensure e.target is an Element with closest method
            if (!e.target || typeof e.target.closest !== 'function') return;

            const card = e.target.closest('.blog-card, .article-card, .featured-article');
            if (!card) return;

            const link = card.querySelector('a[href]') ||
                (card.tagName === 'A' ? card : null) ||
                card.closest('a[href]');

            if (!link) return;

            const href = link.href;
            if (!href || prefetchedUrls.has(href)) return;

            // Only prefetch internal blog links
            if (!href.includes('/blog/')) return;

            // Create prefetch link (debounced)
            setTimeout(() => {
                // Check if still hovering
                if (!card.matches(':hover')) return;

                const prefetchLink = document.createElement('link');
                prefetchLink.rel = 'prefetch';
                prefetchLink.href = href;
                prefetchLink.as = 'document';
                document.head.appendChild(prefetchLink);

                prefetchedUrls.add(href);
                console.log(`ImagePreloader: Prefetching page ${href}`);
            }, 200); // Slightly longer debounce for page prefetch

        }, true);
    }

    // =====================================================
    // Cache Management
    // =====================================================

    /**
     * Get cached image
     */
    function getCached(url) {
        return memoryCache.get(normalizeUrl(url)) || null;
    }

    /**
     * Clear memory cache
     */
    function clearMemoryCache() {
        memoryCache.clear();
        pendingLoads.clear();
        console.log('ImagePreloader: Memory cache cleared');
    }

    /**
     * Clear session storage cache
     */
    function clearSessionCache() {
        try {
            sessionStorage.removeItem(CONFIG.sessionStorageKey);
            console.log('ImagePreloader: Session cache cleared');
        } catch (e) {
            console.warn('ImagePreloader: Failed to clear session cache', e);
        }
    }

    /**
     * Get cache statistics
     */
    function getCacheStats() {
        return {
            memoryCacheSize: memoryCache.size,
            pendingLoads: pendingLoads.size,
            sessionCacheSize: getSessionPreloadedUrls().size,
            maxMemoryCache: CONFIG.maxMemoryCacheSize,
            maxSessionCache: CONFIG.maxSessionUrls
        };
    }

    // =====================================================
    // Initialization
    // =====================================================

    /**
     * Initialize all preloading features
     */
    function init() {
        // Wait for DOM if needed
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        console.log('ImagePreloader: Initializing...');

        // Initialize blog card hover preloading
        initBlogCardPreloading();

        // Initialize link prefetching
        initLinkPrefetching();

        // Log initial state
        const stats = getCacheStats();
        console.log(`ImagePreloader: Ready. Session cache has ${stats.sessionCacheSize} previously loaded images.`);
    }

    // =====================================================
    // Public API
    // =====================================================
    return {
        // Core methods
        init,
        preloadImage,
        preloadImages,

        // Hover attachment
        attachHoverPreload,
        attachToSelector,

        // Blog-specific
        initBlogCardPreloading,

        // Proximity preloading
        initProximityPreloading,

        // Link prefetching
        initLinkPrefetching,

        // Cache management
        getCached,
        clearMemoryCache,
        clearSessionCache,
        getCacheStats,

        // Utilities
        isAlreadyPreloaded,
        extractImageUrl,
        extractBlogPostData,

        // Configuration access (read-only)
        get config() { return { ...CONFIG }; }
    };
})();

// Auto-initialize
ImagePreloader.init();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImagePreloader;
}
