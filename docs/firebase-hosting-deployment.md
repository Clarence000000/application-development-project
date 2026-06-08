# Firebase Hosting Deployment

This Sprint 4 setup prepares the project for Firebase Hosting deployment using the Firebase CLI and the existing Firebase project:

```text
sistem-perakuan-penghulu
```

## Prerequisites

Install dependencies:

```bash
npm install
```

Login to Firebase before deploying:

```bash
npx firebase login
```

Confirm the selected Firebase project:

```bash
npx firebase use
```

Enable Firebase Hosting framework support before the first deploy:

```bash
npm run firebase:frameworks
```

## Local Verification

Run a production build before every deploy:

```bash
npm run build
```

## Preview Deployment

Use a temporary Hosting preview channel for demo testing:

```bash
npm run firebase:preview
```

The Firebase CLI will print a preview URL after the deploy succeeds.

## Production Deployment

Deploy the Hosting target:

```bash
npm run firebase:deploy
```

## Environment Notes

- Do not commit `.env.local` or real API keys.
- `NEXT_PUBLIC_FIREBASE_*` values are embedded into the client build.
- Server-side features such as `/api/ocr/mykad` need their server environment variables configured for the deployed backend.
- Google Cloud Vision still requires a valid API key and billing-enabled Google Cloud project.
- Firebase framework-aware Hosting is a preview feature. For a full-stack Next.js production deployment, Firebase currently recommends Firebase App Hosting.
- If Firebase Hosting detects dynamic server logic, it can deploy the server part to Cloud Functions for Firebase, which may require billing to be enabled.

## Demo Backup

If Firebase deployment is unavailable during presentation, run the local fallback:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```
