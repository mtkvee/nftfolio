# NFTfolio

A modern NFT trade journal and gallery built with Next.js, TypeScript, Tailwind CSS, Firebase Authentication, and Cloud Firestore.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a Firebase project in the Firebase Console.

3. Add a Web app in Firebase and copy its config values.

4. In `Authentication > Sign-in method`, enable `Email/Password`.

5. In `Firestore Database`, create a database in Native mode.

6. Copy `.env.example` to `.env.local` and fill in your Firebase web app config:
```bash
cp .env.example .env.local
```

7. Start the app locally:
```bash
npm run dev
```

## Environment Variables

The app expects these client-side Firebase variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=
```

## Auth Model

NFTfolio uses a two-screen auth panel:
- default screen: `Log in`
- secondary screen: `Create account`

### Login
Users enter:
- `Username`
- `Password`

Internally, NFTfolio reads `users/{username}`, resolves the stored email, then signs in with Firebase Email/Password Auth.

### Create Account
Users enter:
- `Email`
- `Username`
- `Password`

NFTfolio:
1. normalizes and validates the username
2. checks whether `users/{username}` already exists
3. creates the Firebase Auth user with the provided email + password
4. creates a Firestore profile document in `users/{username}`
5. returns the user to the login screen after account creation succeeds

Username rules:
- trimmed and lowercased
- required
- 3 to 20 characters
- only lowercase letters, numbers, dots, hyphens, and underscores

## Firestore Collections

### users
Document ID = normalized username

Fields:
- `uid`
- `username`
- `email`
- `createdAt`

This collection is used for username lookup, uniqueness checks, and account profile storage. The app reads `users/{username}` before sign-in and before account creation.

### nfts
Fields:
- `userId`
- `name`
- `collection`
- `image`
- `buyPrice`
- `sellPrice`
- `buyDate`
- `sellDate`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

All NFT reads and writes are scoped to the signed-in user's `uid`.

## Recommended Development Firestore Rules

Use these rules while you are getting signup working locally or on a staging deployment. They allow username lookup and user-profile creation before the session is fully established, while keeping NFT records authenticated and user-scoped.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }

    match /nfts/{docId} {
      allow read, update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid;

      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Notes:
- The current code reads `users/{username}`. If your rules reference a different collection, signup will fail with a permission error.
- `users` is public for reads and temporary creates only so the app can resolve username availability before sign-in.
- `nfts` remains fully user-scoped.
- Tighten `users` create rules before production if you move signup behind a server action or another trusted flow.

## Firebase App Check

The codebase includes an optional App Check bootstrap in [lib/firebase.ts](/q:/flipfolio/lib/firebase.ts).

To enable App Check later:
1. Open Firebase Console.
2. Go to `App Check`.
3. Register your web app.
4. Choose a web provider such as reCAPTCHA v3.
5. Add the site key to `.env.local` as `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`.
6. Redeploy the app.

## Deployment on Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add the same `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel project settings.
4. If App Check is enabled, also add `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`.
5. Deploy.

## Features

- Two-screen username/password auth flow
- Firebase Email/Password Authentication under the hood
- Unique username reservation via Firestore `users/{username}` documents
- User-isolated Firestore-backed NFT CRUD
- Gallery page with search and filters
- Dedicated NFT details page
- Profit/Loss, ROI, and holding duration calculations
- Responsive light marketplace-style UI
