# Offline Games and Lessons — Follow-up Update

## What changed

- Built-in offline subject packs now contain subject-specific interactive activities rather than opening only a multiple-choice quiz.
- Chemistry offline activity: assemble real atom-count molecules (water, carbon dioxide, sodium chloride) and balance H2 + O2 -> H2O with coefficient controls.
- Physics offline activity: experiment with N/S magnet poles, iron/plastic and distance, with explanatory feedback.
- Biology offline activity: match cell structures to their functions.
- Space offline activity: arrange all eight planets in order from the Sun.
- Existing AI-generated topic games continue to save their generated hands-on drag/drop mission and final quiz. The quiz is a debrief, not the only offline game.
- Generated Explore lessons now save their full sections, key terms, examples and recap for offline reading, in addition to the practice quiz.
- Personal Science Notebook notes now have a **Save for offline** action and appear in My Downloads for later reading.
- My Downloads distinguishes saved lessons/notes from interactive game packs and displays saved lesson sections.

## Device storage note

Offline items are saved locally in this browser/device using IndexedDB with a localStorage fallback. They are available offline on the same device/browser after the first successful download. They are not cloud backups; clearing browser/site data or uninstalling/clearing the browser profile can remove them. Export/restore or cross-device sync is not included in this update.

## Verification

- TypeScript/TSX syntax transpilation passed for all changed files.
- PWA manifest JSON validation passed.
- Full dependency installation, type-check, production build and airplane-mode browser testing have not been run in this environment. Please run `npm install` and `npm run build` locally, then test by downloading a pack/lesson while online and switching to airplane mode.
