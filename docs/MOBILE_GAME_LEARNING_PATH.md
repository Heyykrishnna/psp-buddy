# PSP Buddy Mobile Game Learning Path

## Product direction

The mobile student experience is a playful learning map rather than a dashboard of unrelated tools. A student moves through a sequence of chapters, clears levels inside each chapter, earns XP, and unlocks the next level only after the current level meets its score rule.

The visual language follows the supplied references:

- soft sky/cream canvas with large rounded cards;
- colorful chapter banners and oversized level nodes;
- white pill controls, chunky icons, friendly microcopy, and visible XP;
- a map-first home screen with a persistent bottom navigation bar;
- short, game-like moments: streaks, checkpoint progress, “next win” messaging, and completion states.

## Existing project constraints

The project has three clients and one shared NestJS/Prisma backend:

- `app/` is the Expo React Native mobile app;
- `web/` is the Next.js student and teacher portal;
- `backend/` owns assessments, questions, workbooks, XP, analytics, and WebSocket fan-out.

Questions remain in `Assessment`, `Question`, and `Option`. The learning path is an orchestration layer over those records so a teacher editing or publishing an assessment does not create a second copy of the question bank.

## Progression model

```text
LearningChapter
  └── LearningLevel (ordered)
        └── LevelActivity (QUIZ or WORKSHEET)
              └── Assessment (existing teacher-owned record)
                    └── Question / Option (existing question bank)

Student ── LevelProgress ── LearningLevel
```

### Unlock rules

1. The first published level is `UNLOCKED`.
2. A later level is `LOCKED` until the previous level is completed.
3. A level is `IN_PROGRESS` once the student has a non-zero result in one activity.
4. A level is `COMPLETED` when every activity is passed and the average activity score reaches `passPercent`.
5. Completing a level awards its `xpReward` once through `Student.totalXp` and `XpTransaction`.
6. Quiz progress is read from the student’s best evaluated assessment attempt.
7. Worksheet progress is read from the best evaluated workbook upload. An evaluated assessment attempt is accepted as a fallback so existing assessment records can be introduced into the path before workbook files are available.

## API contract

### Student

`GET /learning-path?studentId=<user-or-student-id>`

Returns published chapters, ordered levels, activities, assessment metadata, and the current student progress for every level/activity.

`GET /learning-path/levels/:levelId?studentId=<user-or-student-id>`

Returns one level with its chapter context and activity progress.

### Teacher

`GET /learning-path/teacher/overview?className=1st%20Sem`

Returns the same map definition with per-level completion counts and per-student level summaries. This gives the teacher portal a canonical view of the game state rather than rebuilding it from UI-specific assumptions.

### Realtime event

`LEVEL_PROGRESS_UPDATED` is broadcast after an evaluated assessment or evaluated workbook changes a student’s learning path. Mobile and web clients can refresh their cached learning-path read model when this event arrives.

## Database additions

The Prisma schema adds:

- `LearningChapter`: chapter metadata, ordering, theme, and publication state;
- `LearningLevel`: level metadata, ordering, XP reward, and score threshold;
- `LevelActivity`: ordered connection between a level and an existing assessment;
- `LevelProgress`: per-student status, scores, XP award, and timestamps;
- `LearningActivityType`: `QUIZ` or `WORKSHEET`;
- `LevelProgressStatus`: `LOCKED`, `UNLOCKED`, `IN_PROGRESS`, or `COMPLETED`.

## Seed data

`backend/prisma/learning-path.seed.ts` is the focused learning-path seed. It is called by the existing `backend/prisma/seed.ts` after the assessment seed has created the referenced assessment IDs.

The seed is idempotent and references existing assessments by stable ID:

- `demo-asm-1` → algorithm complexity quiz;
- `demo-asm-2` → systems quiz;
- `demo-asm-4` → object-oriented programming assessment;
- `demo-asm-coding` → coding/practice worksheet checkpoint.

To load everything into a database:

```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

To add new teacher-authored content, create/publish the assessment first, then add its stable assessment ID to `LEARNING_PATH_SEED` or expose the same mapping through the teacher portal’s future path editor.

## Mobile screen behavior

`GameHomeScreen` is the map-first mobile home screen:

- header: avatar, learner name, XP, sign-out;
- hero: streak, “next win” message, and continue button;
- stats: cleared levels, streak, and map completion;
- map: chapters with colorful banners and level nodes;
- level detail: XP reward, mastery bar, score target, quiz checkpoint, worksheet checkpoint, and hint card;
- bottom navigation: map, missions, rank, and profile/analytics.

When the student opens a checkpoint, the screen delegates to the existing `AssessmentScreen` so the current autosave, timer, answer evaluation, and workbook behavior remain in one place.

## Game feel and motion

A learning map only reads as a game if it moves. `GameHomeScreen` layers motion on top of the static layout using React Native's built-in `Animated` API (no extra dependency), so the shell stays lightweight while every state change is felt:

- **Staggered entrance.** Hero, stats, world map, and coach cards fade and slide up in sequence (`Animated.stagger`) so the map assembles itself instead of snapping in.
- **XP that counts up.** The header and level XP counters animate from their previous value to the new total (`useCountUp`), so earning XP reads as a reward rather than a silent number swap.
- **Animated mastery bars.** Level-detail progress fills grow from 0 to `bestPercent` with an ease-out curve, and turn green once the level is cleared.
- **Living level nodes.** The current playable node breathes with a looping pulse and a soft colored halo to draw the eye to the next objective; every node springs inward on press and bounces back on release. Locked nodes stay dim and unpressable; completed nodes flip to a green check.
- **Map path connectors.** Dashed connectors run between the nodes of a chapter so the row reads as a route, not a list.
- **Level-clear celebration.** When the realtime `LEVEL_PROGRESS_UPDATED` event reports a level newly reaching `COMPLETED` with a fresh XP award, a full-screen celebration overlay pops in with falling confetti, the cleared level's name, and an animated `+XP` badge before auto-dismissing. Because it is driven by the sync event rather than local button state, the reward also fires when the level is cleared from the web portal or another device.

## Realtime sync loop

The end-to-end game loop is fully closed:

1. A student submits a quiz or worksheet; the backend evaluates it.
2. `LearningPathService.syncStudentProgress` recalculates every `LevelProgress`, awards each newly completed level's `xpReward` exactly once (`Student.totalXp` + `XpTransaction`), and unlocks the following level.
3. If anything changed, the service broadcasts `LEVEL_PROGRESS_UPDATED` with the changed level ids, their new status, `bestPercent`, and awarded XP.
4. `GameHomeScreen` subscribes to that event: it raises the celebration overlay for any freshly cleared level, then reloads the learning path so the map, XP, and unlock states update in place — no manual refresh, no navigation reset.

## Teacher portal synchronization

Assessment and workbook completion continue to update the existing analytics and teacher result tables. The new learning-path service additionally recalculates `LevelProgress`, awards level XP once, and emits `LEVEL_PROGRESS_UPDATED`. The teacher portal should use `/learning-path/teacher/overview` for a map/progression tab and subscribe to this event for a lightweight refresh.

## Acceptance checklist

- [x] Chapters and levels are ordered and published from the database.
- [x] Existing assessment questions are reused rather than duplicated.
- [x] Level states are deterministic from attempts/workbooks.
- [x] Next-level access is gated by previous-level completion.
- [x] XP reward is persisted once per completed level.
- [x] Mobile has a map-first, playful UI with XP and streak feedback.
- [x] Mobile map moves like a game: staggered entrance, animated XP count-up, growing mastery bars, springy/pulsing level nodes, and dashed path connectors.
- [x] Clearing a level triggers a confetti + XP celebration driven by the realtime sync event (so it fires from any device).
- [x] Student and teacher clients have a shared learning-path API contract.
- [x] Progress changes emit a realtime sync event, and the mobile client refreshes the map in place when it arrives.
- [x] Teacher UI has a dedicated Learning Map view backed by the teacher overview endpoint and realtime refresh.
