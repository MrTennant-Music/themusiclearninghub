# Keyboard classroom service

Host a Game opens `keyboardnoteidentificationclassroom.html?mode=host` with the teacher’s current
keyboard settings. Pupils join through the lobby QR code and receive a random
musical name and symbol. Quiz and Race each support up to 20 pupils; the teacher
is not counted. There is no teacher key or random-name toggle.

## Deployment and database setup

The main Hub uses the repository-root `netlify.toml` to build `dist` and bundle
`classroom-pilot/functions/classroom.js` at `/.netlify/functions/classroom`.
No separate classroom site is required. GitHub Pages cannot run this backend.
The historical `classroom-pilot/netlify.toml` and `build.cjs` are rollback tools,
not the current deployment configuration.

Configure these variables on the main Netlify project for Production only:

- `SUPABASE_URL`: the existing classroom database URL.
- `SUPABASE_SERVICE_ROLE_KEY`: the server-only credential, stored as a secret.
- `CLASSROOM_ENABLED`: `true` when ready to enable classroom access.

Keep credentials out of Git and browser assets. The build excludes backend
files from the public site. Preview and branch deployments disable classroom
access through the root Netlify configuration.

Retain the existing Supabase database. Before publishing the current client,
apply any unapplied migrations in this order:

1. `migrations/20261007-game-timer-and-speed-scoring.sql` adds the speed-scoring
   helper and replaces the room-control function.
2. `migrations/20261014-next-question-countdown.sql` refreshes the speed-scoring
   helper and the room-control function permissions.
3. `migrations/20261121-find-the-key.sql` installs the current room-control
   function with exact-key grading for Find the Key.

These migrations do not recreate tables or remove rooms. `schema.sql` is for a
new, empty database only. An older installation that still enforces the former
service quotas also needs `remove-capacity-limits.sql` before the migrations.
The database’s enabled switch must be on:

```sql
update public.keyboard_pilot_settings set enabled=true where id=true;
```

Publishing remains under the repository owner’s control. The main build enforces
a 1,000 MB public-site size limit; resolve any build failure before publishing.
A local preview does not apply migrations to live Supabase or verify production.

## Shared game behaviour

- Questions follow the selected level, note groups, octave range and C labels.
- Higher and Advanced Higher use Find the Key in Quiz and Race. Pupils read
  a written note in the selected clefs and choose its exact key and octave.
  National 3 to National 5 use Name the Key.
- The lobby shows a join QR code, participant count and random names. Teachers
  can remove pupils before starting. Existing pupils can rejoin a full lobby.
- Teachers control Start and game audio. Theme music starts unmuted and stops
  when winners are announced. Medal sounds respect the audio setting.
- Tokens are hashed in the database. Teacher and pupil tokens remain in tab
  storage so refreshes restore the same room or pupil. Host URLs contain the
  room PIN, never the control token. Public database table/RPC access is blocked.
- Expired rooms are deleted on a subsequent service request. There are no
  application-level monthly or room-creation quotas; provider limits still apply.

## Quiz

Teachers select 5–50 questions in steps of 5, with 20 selected by default.
Time Per Question offers 5, 10, 15, 20, 30, 45, 60, 90 or 120 seconds;
the default is 10 seconds.

Correct answers in under 0.5 seconds earn 100 points. Later correct answers earn
`round(100 * (1 - elapsed / (2 * questionTime)))`, with a minimum of 50 at the
deadline. Incorrect or unanswered questions earn zero. Timing and scoring are
measured by the database; duplicate and late submissions are rejected. Legacy
rooms created before speed scoring retain their original fixed-point scoring.

Answers reveal when everyone has submitted, time expires, or the teacher presses
Reveal Answers. A submitted answer stays black while waiting, then receives
correct/incorrect feedback. Refreshing restores that pupil’s submitted answer.

The teacher sees a Results bar graph and the top five leaderboard entries.
Show All opens the full leaderboard. There are no class-celebration panels.
Equal scores are ordered alphabetically by name. Next Question starts a shared
3–2–1 countdown; the next question’s timer and scoring start after it.

The final podium reveals third, second and first place in that order, using fixed
podium heights, place labels, confetti and a celebration sound.
Quiz rooms expire from creation after the greater of 45 minutes or the total
configured question time plus 30 minutes.

## Race

Teachers select a Streak target from 1 to 100, defaulting to 30. Time Limit defaults
to Unlimited, with 1–10 minute options. A selected timer starts when Start is pressed;
there is no timer for individual questions. Race rooms expire two hours after creation.

Pupils answer independent questions at their own pace and see only their own
progress bar. The teacher sees everyone, ordered by current streak. Correct answers
advance progress. A mistake resets the database streak immediately; the display
turns red, drains and counts down over 1.8 seconds, then moves the row down over
1.4 seconds. Best records the highest streak achieved during the game.

Reaching the target wins immediately and fills the whole bar green. If time expires
first, the highest streak achieved wins; equal best streaks share the win. The winner
announcement has confetti and a celebration sound when teacher audio is enabled.
There are no Quiz points or podium places in Race.

## Connection recovery and troubleshooting

Active games poll once a second; lobbies and finished games poll every five seconds.
Countdown polling adapts to its start time. Answers and teacher actions update
immediately. Failed reads retry automatically with delays capped at 30 seconds.
The browser’s online event triggers another attempt, and Reconnect offers a manual
retry. A successful read restores controls without refreshing.

Teacher refreshes restore the room-control session in the same tab. Opening Host
a Game from individual practice starts a new setup. Expired or invalid saved host
sessions are cleared. Quiz rejoining restores only that pupil’s own answer and
feedback; advancing questions clears the old selection.

If classroom access fails, check the function’s environment variables, database
switch and applied migrations. Verify the school Wi-Fi and provider usage before
wider classroom use. Individual practice remains available independently.

## Checks

- `pnpm test:desktop-layout` checks the fixed desktop-canvas policy.
- `node --test classroom-pilot/tests/*.test.cjs tests/keyboard-notes.test.js` checks
  request validation, session recovery, retries and keyboard question generation.
  These JavaScript tests are also included in `pnpm test`.
- Run `tests/game-scoring.sql` separately against a disposable database after
  `schema.sql`, and after applying the migrations. Its fixtures roll back. It checks
  scoring, timers, countdowns, answer privacy, rejoining and Race winners. The main
  test command does not execute SQL files.
- `pnpm run build:site` checks the production build and public-site size limit.
- In two browser sessions, verify create/join/start, Quiz submission/reveal/next,
  Race resets and winners, refresh recovery, temporary connection loss and audio
  stopping at the finish. Check the main production deployment separately.

## Emergency switch-off

Set `CLASSROOM_ENABLED=false` on the main Netlify project and redeploy, or disable
the database switch immediately:

```sql
update public.keyboard_pilot_settings set enabled=false where id=true;
```

The database switch blocks sessions on their next request. Individual practice
continues to work. Retiring the old separate Netlify project does not require
deleting Supabase; verify the main deployment first and obtain the owner’s approval
before deleting the obsolete project.
