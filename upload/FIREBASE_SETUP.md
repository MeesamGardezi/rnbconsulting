# Firebase Setup Guide for R&B Construction Consulting

This guide will help you set up Firebase for the R&B Construction Consulting website.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or select an existing one)
3. Enter a project name (e.g., "rb-construction-consulting")
4. Enable/disable Google Analytics as desired
5. Click **"Create project"**

## Step 2: Register Your Web App

1. In your project, click the **web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "RB Website")
3. Optionally enable Firebase Hosting (we're using Node.js Express instead)
4. Click **"Register app"**
5. Copy the `firebaseConfig` object (you'll need this later):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Step 3: Enable Authentication

1. Go to **Build > Authentication** in the sidebar
2. Click **"Get started"**
3. Click on **"Email/Password"** under "Native providers"
4. Enable **Email/Password** sign-in
5. Click **"Save"**

## Step 4: Create Admin User

1. In Authentication, go to the **"Users"** tab
2. Click **"Add user"**
3. Enter your admin email and a strong password
4. Click **"Add user"**
5. **Copy the User UID** (you'll need this for the admin configuration)

## Step 5: Set Up Firestore Database

1. Go to **Build > Firestore Database** in the sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll set custom rules)
4. Select a location close to your users
5. Click **"Enable"**

### Create the Admins Collection

1. In Firestore, click **"Start collection"**
2. Collection ID: `admins`
3. Document ID: Use the **User UID** from Step 4
4. Add a field:
   - Field name: `email`
   - Type: `string`
   - Value: Your admin email
5. Click **"Save"**

### Create the Categories Collection (Optional)

1. Click **"Start collection"**
2. Collection ID: `categories`
3. Add documents for each category:
   - `{ name: "Project Management", slug: "project-management" }`
   - `{ name: "Estimating", slug: "estimating" }`
   - `{ name: "Scheduling", slug: "scheduling" }`
   - `{ name: "Industry Trends", slug: "industry-trends" }`
   - `{ name: "Operations", slug: "operations" }`

### Set Firestore Security Rules

1. Go to **Rules** tab in Firestore
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin check function
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Blog posts - public read published, admin write
    match /blog_posts/{postId} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow write: if isAdmin();
    }
    
    // Categories - public read, admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Analytics - write by anyone, read by admin only
    match /analytics/{docId} {
      allow write: if true;
      allow read: if isAdmin();
    }
    
    match /daily_stats/{docId} {
      allow write: if true;
      allow read: if isAdmin();
    }
    
    match /visitors/{docId} {
      allow write: if true;
      allow read: if isAdmin();
    }
    
    // Contact & Quote submissions - write by anyone, read by admin
    match /contact_submissions/{docId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
    
    match /quote_requests/{docId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
    
    // Admins collection - admin only read their own record
    match /admins/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only manage through Firebase Console
    }
  }
}
```

3. Click **"Publish"**

## Step 6: Set Up Firebase Storage

1. Go to **Build > Storage** in the sidebar
2. Click **"Get started"**
3. Choose **"Start in production mode"**
4. Select a location
5. Click **"Done"**

### Set Storage Security Rules

1. Go to **Rules** tab in Storage
2. Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /blog-images/{allPaths=**} {
      // Anyone can read blog images
      allow read: if true;
      // Only authenticated admins can write
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

### Configure CORS for Image Preloading

For the smart image preloading system to work (hover-triggered preloading like McMaster-Carr), you need to configure CORS for Firebase Storage:

1. Install Google Cloud SDK if you haven't: [Install gcloud CLI](https://cloud.google.com/sdk/docs/install)

2. Authenticate with your Google account:
```bash
gcloud auth login
```

3. Set your project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

4. Apply the CORS configuration (from the project root):
```bash
gsutil cors set firebase-cors.json gs://YOUR_BUCKET_NAME.appspot.com
```

Replace `YOUR_BUCKET_NAME` with your Firebase Storage bucket name (found in Firebase Console > Storage).

**Example:**
```bash
gsutil cors set firebase-cors.json gs://rnbconsulting-1.firebasestorage.app
```

5. Verify CORS is set:
```bash
gsutil cors get gs://YOUR_BUCKET_NAME.appspot.com
```

**Note:** The `firebase-cors.json` file in the project root contains the CORS configuration that allows any origin to read images. This is required for the image preloader to work correctly with the `crossorigin="anonymous"` attribute on image tags.

## Step 7: Update Your Configuration

1. Open `public/js/firebase-config.js`
2. Find the `firebaseConfig` object at the top
3. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Step 8: Test Your Setup

1. Start your server: `npm start`
2. Go to `http://localhost:3000/admin`
3. Log in with the admin email and password you created
4. You should see the admin dashboard

## Collections Reference

| Collection | Purpose |
|------------|---------|
| `admins` | Stores admin user IDs for access control |
| `blog_posts` | Blog post content and metadata |
| `categories` | Blog post categories |
| `analytics` | Page view and event tracking |
| `daily_stats` | Daily aggregated statistics |
| `visitors` | Unique visitor tracking |
| `contact_submissions` | Contact form submissions |
| `quote_requests` | Quote request form data |

## Troubleshooting

### Login Not Working
- Verify Email/Password authentication is enabled
- Check that the user exists in Authentication > Users
- Ensure the user's UID is in the `admins` collection

### Permission Denied Errors
- Check that Firestore rules are published correctly
- Verify the admin document exists with the correct UID
- Make sure you're logged in before accessing admin features

### Images Not Uploading
- Verify Storage rules are configured correctly
- Check that the user is authenticated
- Ensure the file size isn't too large (limit is ~5MB for free tier)

## Support

If you encounter issues, check:
1. Browser console for error messages
2. Firebase Console > Firestore > Monitoring for failed requests
3. Firebase Console > Authentication > Users for login issues
