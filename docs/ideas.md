# Ideas and plans

Ideas under discussion. Nothing in this file is built yet. When an idea is built, move its rules to [gameplay.md](gameplay.md) and remove it here.

| Idea | Status |
| --- | --- |
| [Achievements](#achievements) | Under discussion, not built |
| [Stealth enemy behaviors](#stealth-enemy-behaviors) | Under discussion, not built |
| [Footstep noise](#footstep-noise) | Under discussion, not built |
| [Enemies that break habits](#enemies-that-break-habits) | Under discussion, not built |
| [Level 4 and a boss](#level-4-and-a-boss) | Under discussion, not built |
| [Level select](#level-select) | Under discussion, not built |
| [Best-run records](#best-run-records) | Under discussion, not built |
| [Screen shake and hit stop](#screen-shake-and-hit-stop) | Under discussion, not built |
| [Positional enemy footsteps](#positional-enemy-footsteps) | Under discussion, not built |

### Discarded

- **Persistent gibs and wall decals.** Players can use blood and bullet marks to draw on the walls and floor. Not wanted.

## Achievements

### Goal

Make the game more engaging. Players stay engaged when they see a next goal, get a surprise from time to time, and feel that they get better.

### Decisions

- Achievements only. No per-level medals.
- Some achievements are hidden until unlocked.

### Design

**Visible next goal**
- The title screen shows the list with a counter, for example "7 / 18 unlocked", with the visible achievements and their conditions.
- Some achievements show progress, for example "Butcher 3/5".

**Hidden achievements (surprise)**
- About one third of the list. They show as "???", with a short cryptic hint or no hint.
- Use them for odd or funny moments, not for hard skill tests. A player cannot aim for a challenge that they cannot see.

| Hidden | Condition |
| --- | --- |
| Crossfire | An enemy shot or fireball kills another enemy |
| Toxic Assets | A barrel blast kills a Brute |
| Bait | A Fiend fireball kills a Husk that stands between you and the Fiend |
| Coward | Stand still in an open doorway while a Brute waits behind the closed side |
| Peekaboo | Backstab a Shade |
| Back for More | Die 10 times in one level |

**Visible skill goals (mastery)**

| Visible | Condition |
| --- | --- |
| Ghost | Finish a level with no enemy hunting you |
| Butcher | 5 backstabs in one level |
| Chain Reaction | Kill 3 enemies with one barrel blast |
| Untouched | Finish a level with no damage |
| Speedrunner | Finish a level under par |
| Exterminator | 100% kills, items and secrets in a level |
| Iron Marine | Finish a level on Doomed |
| Doomed | Finish the episode on Doomed |

**The unlock moment**
- During play: a short sound (like the secret sound) and a log line, "ACHIEVEMENT UNLOCKED: Crossfire". No popup over the fight.
- On the tally screen: a line under the stats that lists the achievements unlocked in that level.

### Technical sketch

- A `src/achievements/` module that listens to the world events and to the end-of-level stats. Pure TypeScript, testable like the simulation.
- Some events need more detail, for example what killed a monster (the player, a barrel, another monster).
- Progress stays in `localStorage`, like the training flag. No accounts and no server.

### Open points

1. **Rewards.** Cosmetic unlocks (Marine armor colors, a gold knife) give each achievement a purpose, but add art work. Without rewards the feature stays simpler.
2. **Difficulty.** Proposal: achievements count on Recruit too, except the ones about difficulty (Iron Marine, Doomed).
3. **Training.** Proposal: the training level does not count.
4. **Size.** About 15 to 20 achievements for 3 levels. More feels like a checklist.

## Stealth enemy behaviors

Goal: make stealth and the backstab deeper.

- **Sleeping enemies.** Some enemies start asleep. They do not see you, and only a noise wakes them. A sleeping enemy is a free backstab if you are quiet.
- **Corpse discovery.** An enemy that sees a corpse becomes alert and alarms the enemies near it. Players must pick where they kill, not only who.

## Footstep noise

Goal: a real choice between speed and stealth.

- Running makes noise in a small radius, and enemies in that radius become alert.
- Hold Shift to walk slowly. Slow steps make no noise.
- The radius must stay smaller than the gunfire noise range, so that a shot is always louder than a step.

## Enemies that break habits

Goal: one new rule per level keeps the levels fresh.

- **Flanker.** A fast Husk that does not run straight at you. It moves around you to attack from the side.
- **Door Brute.** A Brute that can open doors. Then a closed door is no longer always safe.

## Level 4 and a boss

Goal: give the episode a proper end. Today it ends at level 3 with no climax.

- A boss arena with phases, for example a new attack or adds at each health threshold.
- The boss is a new character in `src/characters/` with its own art.

## Level select

Goal: make replays easy.

- After the first full clear of the episode, the title screen shows a level select.
- It also makes achievement hunting easier.

## Best-run records

Goal: give a reason to replay.

- Store the best time and the best kill percentage per level and per difficulty in `localStorage`.
- The tally screen shows "New record!" when you beat one.

## Screen shake and hit stop

Goal: give each hit more weight for little code.

- A small screen shake on the shotgun and on explosions.
- A short freeze (hit stop) on a backstab.
- Keep both small, and maybe add an option to turn them off.

## Positional enemy footsteps

Goal: hear an enemy before you see it.

- Nearby enemies make footstep sounds, panned left or right and quieter with distance.
- Each kind can have its own step sound, so you know a Brute from a Husk.
