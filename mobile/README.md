# JLPT Hub Mobile

React Native + Expo mobile client for JLPT Hub.

This project targets Expo SDK 55 so it can run in the current public Expo Go app on Android.

## What It Shares With The Web App

- Same Render backend: `https://jlpt-hub.onrender.com/api`
- Same MongoDB users, admin roles, VIP subscriptions, progress, notebook entries, exams, and course data
- Same SePay/VietQR payment flow; the app creates a transaction and polls the existing backend status endpoint

## Run Locally

```bash
cd mobile
npm install
npm run android
```

For Expo Go:

```bash
cd mobile
npm run start
```

If Expo Go previously showed an incompatible SDK error, stop the dev server and restart it after this SDK 55 update:

```bash
cd mobile
npm run start
```

## Build Check

```bash
cd mobile
npx tsc --noEmit
npx expo export --platform android
```

## Current Mobile Parity

- Auth with the same web account
- Shared JWT/Bearer auth against the existing backend
- Level dashboard: N5, N4, N3, with N2/N1 marked as upcoming
- N5/N4 Minna lesson map and details
- N3 learning modules using backend data
- Exam list, exam detail, mobile exam room, timer, answer selection, submit/review
- Notebook
- Pricing, VietQR, SePay status polling
- Profile, VIP/admin state
- Admin dashboard and user actions
- Dark/light mode
