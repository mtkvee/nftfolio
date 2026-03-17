# NFTfolio

A modern NFT trade journal and gallery built with Next.js, TypeScript, Tailwind CSS, Zustand, Firebase Authentication, and Cloud Firestore.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a Firebase project in the Firebase Console.

3. Add a Web app in Firebase and copy its config values.

4. In `Build > Authentication`, enable the `Google` sign-in provider.

5. In `Firestore Database`, create a database in Native mode.

6. Copy `.env.example` to `.env.local` and fill in your Firebase web app config:
```bash
cp .env.example .env.local
```

7. Start the app locally:
```bash
npm run dev
```

8. Open `http://localhost:3000` and sign in with Google.

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

Notes:
- All Firebase web config stays in `NEXT_PUBLIC_` variables only.
- Do not put server-only secrets into client-side env vars.
- `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` is optional until you enable App Check.

## Firebase Auth Setup

1. Open Firebase Console.
2. Go to `Authentication > Sign-in method`.
3. Enable `Google`.
4. Add your local and production domains to the authorized domain list if needed.

The app uses Google Sign-In and persists auth state in the browser.

## Firestore Data Model

The app uses a collection named `nfts`. Each document stores:

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

All reads and writes are scoped to the signed-in user's `uid`.

## Recommended Firestore Security Rules

Use user-scoped rules like these in production:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /nfts/{docId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

These rules ensure:
- only authenticated users can access NFT data
- each user can only read, update, and delete their own documents
- each created document must include `userId` matching `request.auth.uid`

Public read/write rules are only acceptable for temporary testing and should never be used for a real deployed app.

## Firebase App Check

The codebase includes an optional App Check bootstrap in [lib/firebase.ts](/q:/flipfolio/lib/firebase.ts).

To enable App Check later:
1. Open Firebase Console.
2. Go to `App Check`.
3. Register your web app.
4. Choose a web provider such as reCAPTCHA v3.
5. Add the site key to `.env.local` as `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`.
6. Redeploy the app.

Notes:
- App Check is intentionally optional so local development does not break.
- The app only initializes App Check in the browser and only when a site key is present.
- When you enforce App Check in production, test both local and Vercel environments before rollout.

## Production Hardening Notes

The app is structured for production-safe behavior:
- Firebase config is loaded from environment variables only.
- Firestore reads are skipped when signed out.
- NFT CRUD is always tied to `currentUser.uid`.
- Update and delete paths verify ownership in the Firestore utility layer before mutating documents.
- `createdAt` is preserved on update and `updatedAt` is refreshed.
- There is no `localStorage` source of truth.
- Auth and Firestore browser logic stays on the client side.

## Deployment on Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add the same `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel project settings.
4. If App Check is enabled, also add `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`.
5. Deploy.

## Features

- Google Sign-In with Firebase Auth
- User-isolated Firestore-backed NFT CRUD
- Gallery page with search and filters
- Dedicated NFT details page
- Profit/Loss, ROI, and holding duration calculations
- Responsive light marketplace-style UI
