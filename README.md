# 🏠 Amar Basha

A simple Firebase + GitHub Pages rental management starter.

## Included
- Bangla / English toggle
- Tenant registration and login
- Tenant dashboard
- Rent, service charge, other expense and due
- Live notices
- Payment history
- Personal statement with "🏠 AMAR BASHAR HISHAB" watermark
- Admin dashboard
- Tenant editing
- Payment recording
- Notice publishing
- Admin tenant report with "🏠 AMAR BASHA" watermark
- Responsive mobile/desktop UI

## 1. Create Firebase project
Create a project at Firebase Console and add a Web App.

Enable:
- Authentication → Sign-in method → Email/Password
- Firestore Database

Copy your Web App config into `firebase-config.js`.

## 2. Create your first Admin
Register normally once. Then in Firestore:
Collection: `users`
Document ID: your Firebase Authentication UID
Change:
`role: "tenant"` → `role: "admin"`

Keep this admin account private.

## 3. Firestore security rules
Use rules like the following as a starting point. Review them before production use.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    match /users/{userId} {
      allow read: if signedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if signedIn() && request.auth.uid == userId;
      allow update: if signedIn() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();

      match /payments/{paymentId} {
        allow read: if signedIn() && (request.auth.uid == userId || isAdmin());
        allow write: if isAdmin();
      }
    }

    match /notices/{noticeId} {
      allow read: if signedIn();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

## 4. GitHub Pages
Upload all files to a GitHub repository, then:
Settings → Pages → Deploy from branch → `main` / root.

## Important
This starter intentionally does not create Firebase Authentication accounts from the Admin dashboard. Creating accounts for other people securely requires a trusted backend / Firebase Admin SDK or a server-side function. Tenants can register themselves, after which the Admin can edit their rent/account values.

For real production use, add stronger validation, password reset, audit logs, and tighter Firestore rules.
