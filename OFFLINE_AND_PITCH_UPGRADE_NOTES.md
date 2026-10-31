# SCIENCE EXPLORER — Multilingual, Subject Worlds & Offline Upgrade

This ZIP contains an implementation pass on top of the existing project. Existing routes and activities were retained.

## Changes included

### AI Tutor language handling
- The full-page AI Tutor now sends the user's saved language preference to the server.
- The tutor detects Urdu script, common Roman Urdu phrasing, English phrasing, and Sindhi script hints, then gives an explicit per-answer language instruction.
- The floating Science Buddy already sent the selected language; it now benefits from the same server-side detection.
- The global language picker remains available as the fallback for short or ambiguous questions.

Language detection is heuristic, not perfect. In particular, short phrases and Roman Sindhi can be ambiguous. The student's saved language selection is used as a fallback.

### Immersive subject worlds
- The Science Games hub now uses distinct themed cards for Chemistry, Physics, Biology, Human Body, Space, Eco, Maths, Coding and other existing game destinations.
- Physics has a new Physics Power Lab introduction and an interactive Magnetic Field Lab (flip poles, adjust distance, test iron/plastic, reveal the explanation). Existing Physics missions are preserved.
- Chemistry has a new Molecular Discovery Lab introduction and retains the existing Molecule Builder, Formula Balancer and Virtual Lab activities.

### Offline learning and PWA foundation
- Added a web app manifest, service worker, offline fallback page and install prompt handling.
- Added IndexedDB-based local learning pack storage, with a localStorage fallback.
- Added a My Downloads page with a playable quiz for saved learning packs.
- Core offline starter packs are available for Chemistry, Physics, Biology, Human Body, Space, Maths, Eco and Computer Science.
- AI-created topic games can be saved as offline missions with their interactive matching/sorting/sequence activity and quiz.
- Generated lessons can also be saved for offline reading and quiz practice.
- Offline quiz results are saved with each local pack.
- The authenticated shell can use a previously stored Supabase session to open local downloads while offline. Cloud APIs, AI generation, live chat, cloud sync and leaderboards still require connectivity.

## How to run and build

Open the `science_explorer_custom` folder (the one containing `package.json`) in VS Code. In its terminal run:

```powershell
npm install
npm run dev
```

For a production build:

```powershell
npm run build
```

## Offline test checklist

1. Start the app while connected to the internet and sign in.
2. Open Science Games and save one or more subject packs.
3. Generate an AI topic game and choose **Save for offline**.
4. Generate/open a lesson and choose **Save for offline**.
5. Open **My Downloads** once while online.
6. Turn on airplane mode and reopen the installed app or reload its cached page.
7. Open My Downloads and play the saved mission or quiz.

The first visit and first download require internet. Browser storage can be cleared by the user or removed by the browser under storage pressure; saved packs are device-local and do not automatically transfer to another device.

## Verification status

- TypeScript/TSX syntax transpilation: passed for the changed source files.
- Service worker JavaScript syntax check: passed.
- PWA manifest JSON validation: passed.
- Full dependency install and production build: **not verified in this environment** because the package registry could not be reached (DNS/network error). Please run the build on your computer after dependencies install.

No real API keys are included. The `.env` file is ignored by Git; `.env.example` remains as a template.
