# Ideas and plans

Ideas under discussion. Nothing in this file is built yet. When an idea is built, move its rules to [gameplay.md](gameplay.md) and remove it here.

| Idea | Status |
| --- | --- |
| [Achievements](#achievements) | Under discussion, not built |

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
