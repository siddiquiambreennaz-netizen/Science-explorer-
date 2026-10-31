# SCIEXPLORER AI — Redesign + Learning Features Roadmap

Protected (do not break): auth (email/password, roles, verify, reset), Resend email, classrooms, join codes/links, RLS, AI tutor gateway fn.

## Done
- [x] Auth screen restyled to recording (brand heading, buddy tag, Google/Microsoft "soon" — disabled, honest)
- [x] Gamified student Home: hero, XP/level bar, streak, daily quests, activity tiles, classroom teaser
- [x] All Sciences hub (/app/sciences): Physics, Chemistry, Biology, Earth & Space + topics
- [x] Games (/app/games): Molecule Builder, Formula Balancing (+speed run), Virtual Lab (2 simulations)
- [x] Smart Scanner (/app/scanner): real image → AI gateway vision explanation (beta)
- [x] Notebook (/app/notebook) + Study Planner (/app/planner): real CRUD tables with RLS
- [x] My Learning (/app/progress): XP, level, streak, badges, history
- [x] Student classroom page (/app/classrooms): join code + assignments
- [x] Teacher classroom: roster with avg-score insight, attendance register, assign quizzes, results
- [x] Tournaments page: honest "not connected yet" (no fake lobby)
- [x] Gamification rules unit-tested (XP, levels, streaks, quests)

## Verify
- [ ] Build clean; vitest pass; preview spot-check (onboarding, home, games, scanner)
- [ ] Retest auth + join-classroom flow unchanged

## Current continuation
- [x] Replace top navigation with responsive left sidebar; isolated desktop/mobile menu and floating tutor open-close checks passed
- [x] Build Physics Playlab with six missions and games hub; all six mission interactions browser-tested in isolation; Chemistry reused on dedicated route
- [ ] Verify signed-in Physics saving/XP, floating tutor responses and classroom regressions — blocker: no authorized active test session
- [ ] Diagnose confirmed runtime/data errors and test signed-in AI tutor/scanner
- [x] Group role-aware navigation in a collapsible left sidebar; preserve student Home
- [ ] Add real classroom invitation QR and teacher learning insights
- [ ] Add classroom assignments, student submissions and teacher grading/feedback
- [ ] Verify navigation, persistence and permissions; report external blockers

## Not built (honest blockers)
- Math Quest, Bio Explorer, Space & Earth Explorer and mixed-subject Quiz Arena: deferred to the next incremental games stage, as allowed in the request
- Individual game best scores and mid-mission resume: deferred; Physics uses existing topic completions and derived rewards, not a duplicate rewards store
- Live multiplayer tournaments: needs real-time sync infrastructure
- QR joining: not requested infra; invite link + code cover it
