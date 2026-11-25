# Classroom game service

Host a Game opens `host.html?mode=host` with the activity and the teacher’s
current practice settings. Pupils join through the lobby QR code. Rooms support
up to 20 pupils, excluding the teacher.

New races load the individual practice page for each pupil. The room passes
along the level, question options or collection and a shared random seed. Races
use written questions and the original answer controls. Escape Room Race keeps
its audio clues and awards the win to the first pupil to escape all six rooms.
Higher Chords, Rhythmic Dictation, Follow the Score, Repeat Signs and collections
that use audio open their original pages in hosted Individual Practice rooms.
The teacher starts and ends the room and can see who has completed the
activity. Pupils use the activity's own playback and feedback at their own
pace. Melodic Dictation remains available as a shared Quiz.
The first pupil to solve the puzzle, complete the challenge or reach ten correct
answers wins, according to the activity. Personal scores and medals are separate
from classroom play.

Rhythm Identification uses Time Trial mode. The teacher sets a time limit from
1 to 10 minutes. Pupils play fresh grids with the teacher's settings, and the
leaderboard keeps their fastest completed grid. The server closes submissions
at the deadline.

Concept Recall shows each pupil’s live total. The teacher can leave the race
unlimited or choose a limit from 1 to 10 minutes. Recalling every concept ends
the race immediately. At the deadline, the highest total wins, with ties shared.

Concept Quizzes uses shared Quiz mode. The teacher selects the question count
and time per question from the eligible question bank for their chosen collection
and question types.

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
4. `migrations/20261121-shared-activity-rooms.sql` adds native activity rooms
   and a common question order in newly created Races.
5. `migrations/20261122-activity-races.sql` adds completion Races for the
   original activities and keeps existing rooms playable.
6. `migrations/20261122-dominoes.sql` adds private card dealing, teacher
   timing and replays for Dominoes.
7. `migrations/20261122-nicknames.sql` adds the teacher's Allow nicknames
   setting and lets pupils update their own names in the lobby.
8. `migrations/20261123-listening-quizzes.sql` keeps the timer paused and pupil
   answers locked until the teacher's excerpt finishes.
9. `migrations/20261123-native-melodic-dictation.sql` grades the notes pupils
   enter in the shared Melodic Dictation score.
10. `migrations/20261123-rhythm-time-trial.sql` adds the round deadline and
    best-grid-time leaderboard for Rhythm Identification.
11. `migrations/20261123-shared-concept-quizzes.sql` enables shared Concept
    Quizzes with the existing answer formats and partial-credit marking.
12. `migrations/20261123-z-concept-recall-standings.sql` adds live Concept Recall
    totals, optional deadlines and final standings.
13. `migrations/20261124-reset-lobby-nicknames.sql` restores assigned names when
    the host turns off Allow Nicknames.
14. `migrations/20261124-sync-quiz-playback.sql` shares the host's playback status
    with pupils during Concept Quizzes.
15. `migrations/20261124-z-quiz-review.sql` preserves per-question leaderboard
    points on refresh and lets the host skip an excerpt that fails to play.
16. `migrations/20261124-zz-pupil-quiz-score.sql` gives each pupil their own
    running quiz score and updates it when answers are revealed.
17. `migrations/20261124-zzz-word-search-race-progress.sql` records the Word
    Search board total and each pupil’s running word count.
18. `migrations/20261124-zzzz-millionaire-race-progress.sql` records Millionaire
    progress across retries and ends the race when a pupil reaches £1 million.
19. `migrations/20261124-zzzzz-escape-room-race.sql` records escaped rooms and
    lets a pupil’s game over end their attempt while the race continues.
20. `migrations/20261124-zzzzzz-crossword-race-progress.sql` records the
    crossword total and each pupil’s running word count.
21. `migrations/20261124-zzzzzzz-literacy-streak-races.sql` tracks current and
    highest streaks for the Music Literacy activities played on their own screens.
22. `migrations/20261125-timed-activity-races.sql` adds timed retries and
    accuracy-then-speed rankings for Dominoes and Concept Sort.

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
  National 3 to National 5 use the selected mix of Name the Key and Find the Key.
- The lobby shows a join QR code, participant count and random names. Teachers
  can remove pupils before starting. Existing pupils can rejoin a full lobby.
- Teachers control Start and game audio. Theme music starts unmuted and stops
  when winners are announced. Medal sounds respect the audio setting.
- Tokens are hashed in the database. Teacher and pupil tokens remain in tab
  storage so refreshes restore the same room or pupil. Host URLs contain the
  room PIN, never the control token. Public database table/RPC access is blocked.
- Expired rooms are deleted on a subsequent service request. There are no
  application-level monthly or room-creation quotas; provider limits still apply.

## Legacy Quiz

Teachers select 5–50 questions in steps of 5, with 20 selected by default.
Time Per Question offers 5, 10, 15, 20, 30, 45, 60, 90 or 120 seconds;
the default is 20 seconds.

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

## Legacy Streak Race

Teachers select a Streak target from 1 to 100, defaulting to 30. Time Limit defaults
to Unlimited, with 1–10 minute options. A selected timer starts when Start is pressed;
there is no timer for individual questions. All pupils see the same questions in the same order and advance at their own pace. Race rooms expire two hours after creation.

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
