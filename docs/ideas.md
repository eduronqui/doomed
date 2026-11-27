# Ideas and plans

Ideas under discussion. Nothing in this file is built yet. When an idea is built, move its rules to [gameplay.md](gameplay.md) and remove it here.

| Idea | Status |
| --- | --- |
| [Achievements](#achievements) | Under discussion, not built |
| [Stealth enemy behaviors](#stealth-enemy-behaviors) | Under discussion, not built |
| [Enemies that break habits](#enemies-that-break-habits) | Under discussion, not built |
| [A silent weapon](#a-silent-weapon) | Under discussion, not built |
| [Secrets with a puzzle](#secrets-with-a-puzzle) | Under discussion, not built |
| [Set pieces](#set-pieces) | Under discussion, not built |
| [Level select](#level-select) | Under discussion, not built |
| [Best-run records](#best-run-records) | Under discussion, not built |
| [Minimum loadout at level start](#minimum-loadout-at-level-start) | Under discussion, not built |
| [Multiplayer](multiplayer.md) | Own file. Versus built for 2 players; up to 4 players planned next; co-op and prediction not built |

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
- Progress stays in `localStorage`, like the training flag and the saved game. No accounts and no server.

### Open points

1. **Rewards.** Cosmetic unlocks (Marine armor colors, a gold knife) give each achievement a purpose, but add art work. Without rewards the feature stays simpler.
2. **Difficulty.** Proposal: achievements count on Recruit too, except the ones about difficulty (Iron Marine, Doomed).
3. **Training.** Proposal: the training level does not count.
4. **Size.** About 15 to 20 achievements for the 12 levels. More feels like a checklist.

## Stealth enemy behaviors

Goal: make stealth and the backstab deeper.

- **Sleeping enemies.** Some enemies start asleep. They do not see you, and only a noise wakes them. A sleeping enemy is a free backstab if you are quiet.
- **Corpse discovery.** An enemy that sees a corpse becomes alert and alarms the enemies near it. Players must pick where they kill, not only who.

## Enemies that break habits

Goal: one new rule per level keeps the levels fresh.

- **Flanker.** A fast Husk that does not run straight at you. It moves around you to attack from the side.
- **Door Brute.** A Brute that can open doors. Then a closed door is no longer always safe.

## A silent weapon

Goal: give stealth a tool, so that the backstab is not the only quiet kill.

- A suppressed weapon or a crossbow. Its shots make no noise, so they do not wake sleeping enemies or alert the ones nearby.
- Low damage and little ammo, so it does not replace the pistol or the shotgun. It rewards a careful player.
- Works with the [stealth enemy behaviors](#stealth-enemy-behaviors): sleeping enemies and corpse discovery.
- Open points: which level gives it, and whether a headshot-style bonus on an unaware enemy is too strong.

## Secrets with a puzzle

Goal: make secrets a surprise, not only a hidden door and a small room.

- **Timed door.** A lever opens a secret door for a few seconds. The player must reach it in time.
- **Lever order.** Two or three levers in a room open the secret only in the right order. The map shows a hint.
- **Shortcut secret.** The secret opens a loop to a key room or the exit. It counts as a secret and saves time on a second run.
- Secrets keep counting in the end-of-level stats, like today.

## Set pieces

Goal: one memorable moment in the levels that do not have one yet. The level 12 arena is the model.

- **Room that closes behind you.** Seal doors (`U`) already exist. A room can lock when the player enters, and open when the monsters are dead.
- **Lights out.** The lamps in a room go dark after a trigger, and the player fights with the flashlight and the muzzle flash.
- **Collapsing floor.** A bridge or a ledge over lava falls after the player crosses it, so there is no way back.
- Keep it to one per level, and show a draft before building a batch.

## Level select

Goal: make replays easy.

- The level picker stays hidden until the player has cleared all 12 levels once. Before that, the only way to a level is to play the levels in order.
- The picker needs a `hasCompleted` flag in `localStorage` (key `doomed.hasCompleted`), set when the player clears level 12. It is not built yet. The picker shows only when the flag is true. The flag is separate from the saved game, which the game deletes after level 12, so the picker stays available for good.
- The picker shows on the menu, next to "Continue" and "New game", for example as "Select level".
- A level started from the picker uses the fresh starting loadout of that level, not a carried one. Open point: the difficulty, either chosen in the picker or taken from the last game.
- It also makes achievement hunting easier.

## Best-run records

Goal: give a reason to replay.

- Store the best time and the best kill percentage per level and per difficulty in `localStorage`.
- The tally screen shows "New record!" when you beat one.

## Minimum loadout at level start

Problem: health, armor, ammo and weapons carry over to the next level, and a restart after death uses the loadout you entered the level with. If you finish a level low, for example 60 health, 25 bullets and 10 shells, every attempt at the next level starts that low. On Doomed you can get stuck on a level you cannot win from that start.

### Leaning towards

- **Health on Recruit and Veteran:** health is at least 100 when a level starts. It is a minimum, not a reset: health above 100 from a vital sphere carries over.
- **Health on Doomed:** health carries over as it is. To stop the trap, after a death in a level, retries start at 100. The retry uses the health you had when the level started, not the health at death.
- **Bullets:** the same pattern. On Recruit and Veteran, bullets are at least the difficulty's start amount (60 or 40). Doomed keeps the raw carry, and after a death it uses its start amount (20).
- **Weapons, armor and extra ammo** carry over as they are. High carry is not capped, so a great run still pays off.

### Open points

- Shells: no minimum, or a minimum only if you own the shotgun.
- Doomed alternatives: a small health minimum (for example 25) instead of the reset after a death, or accept the trap, since the difficulty picker shows from the 3rd death.
- Show the change: a Server Log line such as "Resupplied: +40 health, +15 bullets", so the jump does not look like a bug.
