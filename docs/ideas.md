# Ideas and plans

Ideas under discussion. Nothing in this file is built yet. When an idea is built, move its rules to [gameplay.md](gameplay.md) and remove it here.

| Idea | Status |
| --- | --- |
| [Achievements](#achievements) | Under discussion, not built |
| [Stealth enemy behaviors](#stealth-enemy-behaviors) | Under discussion, not built |
| [Enemies that break habits](#enemies-that-break-habits) | Under discussion, not built |
| [Level 4 and a boss](#level-4-and-a-boss) | Under discussion, not built |
| [Level select](#level-select) | Under discussion, not built |
| [Best-run records](#best-run-records) | Under discussion, not built |
| [Screen shake and hit stop](#screen-shake-and-hit-stop) | Under discussion, not built |
| [Positional enemy footsteps](#positional-enemy-footsteps) | Under discussion, not built |
| [Multiplayer over WebRTC](#multiplayer-over-webrtc) | Under discussion, not built |

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

## Multiplayer over WebRTC

Goal: 2 to 4 players in two modes, on the same network code:

- **Co-op:** play the episode together, Marines against the same demons.
- **Versus (PvP):** Marines against each other, in deathmatch arenas, with or without demons.

### Network model

- **Host-authoritative.** One browser (the host) runs the real `World`. The simulation in `src/sim/` is pure TypeScript and steps only through `World.update(dt, input)`, so it can run unchanged on the host.
- **Clients send inputs** to the host about 30 times per second: movement, aim, fire, use, weapon. Never state.
- **The host sends snapshots** about 20 times per second: players, monsters, projectiles, doors, items, events.
- **Clients interpolate** between snapshots, and predict their own Marine's movement so that walking feels instant.
- **Not lockstep.** The game steps with a variable `dt`, and every browser would have to compute exactly the same results. One mismatch makes the games drift apart.
- **Transport:** a WebRTC data channel. Unreliable and unordered for snapshots, reliable for events (pickups, messages, level changes).

### Connecting the players

- **Signaling** (exchange of the connection offer and answer). Vercel cannot hold the open WebSocket connections that signaling usually uses. Options:
  1. Copy and paste codes between players. No server, free, fine for friends. **First step.**
  2. A small WebSocket service (Cloudflare Workers, Fly.io or similar).
  3. A hosted service (PeerJS, Firebase). This adds a dependency, so ask before installing.
- **STUN:** free public servers.
- **TURN:** needed for roughly 10 to 20% of connections. It costs money (Cloudflare, Twilio) or a self-hosted server.

### Game changes

- `World` holds a list of players instead of one `player`. This touches monster sight and targeting, backstabs, alert cries, noise, damage, pickups, keys, resting, death and room reveal.
- Co-op rules to decide:
  - Friendly fire: on or off?
  - Keycards: shared by the team, or per player?
  - Death: respawn, spectate, or restart only when all are dead?
  - Ammo and stats: per player?
  - Ambushes: which player's pickup triggers them?
  - Difficulty: do enemy groups scale with the player count?
- Versus needs its own rules and content:
  - Arena maps built for fights: loops, several routes, no keycards, no exit switch.
  - Weapons and items that respawn on a timer, instead of one pickup per level.
  - Respawn points away from the killer, short spawn protection, a frag limit or a time limit, and a score table.
  - Optional demons in the arena as a shared danger.
  - Backstabs, the sight layer and the alert cries need rules when the target is a player, for example a backstab from behind on a player who is not shooting.
- Fairness in versus: shots must hit what the shooter saw. The host keeps a short history of player positions and checks each shot against where the target was on the shooter's screen (lag compensation).
- Rendering: several Marines with name labels and colors. Each camera, minimap and HUD follows its local player.
- Screens: a lobby to host or join, a ready check, and synced level changes.

### Security and privacy

The design is host-authoritative. In co-op the risk to the game itself is low; in versus, cheating matters more (see part 3). The other concerns are attacks between players' browsers, privacy, and any servers we add.

**1. Untrusted messages (most important).** The other browser can send anything; a modified client or the browser console is enough.
- **Host side:** validate every client message. Known types only, a maximum size, finite numbers only (no NaN or Infinity), and value ranges (movement -1/0/1, weapon slot 1 to 4, aim within a few tiles of the player). Drop everything else.
- **Client side:** the host is untrusted too. A malicious host can send huge snapshots or hostile text. Limit list lengths, value ranges and text length.
- **Safe parsing:** `JSON.parse` copies `__proto__` and `constructor` keys onto the objects it creates. Never merge parsed objects into game state; read known fields into fresh objects, or use a fixed binary format.
- **Text from other players** (names, chat): write it only with `textContent`, never `innerHTML`, with a length limit and no control characters. This protects against script injection (XSS).

**2. Flooding (denial of service).**
- Limit messages per peer per second, and disconnect peers that go over.
- Cap the number of players, set connection timeouts, and close idle connections.

**3. Cheating.**
- Clients send only inputs, never state such as "I picked up the key" or "I have 200 health". The host computes all results.
- The host can cheat, because it runs the game. In co-op, players choose whom they host with, so this is acceptable.
- **In versus, the host is also a player,** so it can give itself an advantage: more damage, wall vision, a slower enemy. For casual games among friends, accept it and tell players. For fair or public games, run the `World` on a neutral host that does not play: a small dedicated server (Node can run `src/sim/` as it is), or a spectator browser.
- **Wallhacks:** a client that gets the positions of every player can show players behind walls. In versus, the host should send each client only the players and demons it can see, or nearly see (interest management).
- **Aim and timing bots** cannot be stopped in the browser. With friends this does not matter; with strangers, server-side checks on impossible aim speed or reaction time can catch the worst cases.

**4. Privacy: IP addresses.**
- WebRTC shows each player's public IP address to the other players. Modern browsers hide local network addresses behind random `.local` names.
- Tell players in the lobby. Offer a relay-only mode (`iceTransportPolicy: 'relay'`) that sends all traffic through TURN, so peers never see each other's address. It costs more TURN traffic.
- Copy-paste codes contain the IP address. Players should not post them in public channels.

**5. Signaling and TURN servers** (only when we add them).
- HTTPS and WSS only. The signaling exchange carries the keys that WebRTC's built-in encryption (DTLS) depends on, so anyone who can change it can read or change all game traffic.
- Long random room codes that expire, with a rate limit on join attempts, so strangers cannot guess them.
- Check the `Origin` header, cap rooms and connections per IP address, and do not log the exchanged data.
- Never put TURN credentials in the client bundle, or anyone can use the relay at our cost. Use short-lived credentials signed by a small server endpoint. Its secret goes in a secret store, never in code or in the repository.

**6. Browser and dependency settings.**
- Extend `connect-src` in the Content Security Policy only to the exact signaling, STUN and TURN hosts, with no wildcards. Keep `script-src 'self'` and `frame-ancestors 'none'`.
- A library such as PeerJS adds supply-chain risk: pin its version, run `npm audit`, and ask before installing it. The copy-paste first step needs no new package.

**7. Data.** No accounts, no personal data, nothing stored on a server beyond the short signaling exchange. Player names live in memory for the session only.

**Checklist for the first step (copy-paste, co-op or versus):**
1. Strict checks on all messages, both directions.
2. Rate and size limits per peer.
3. Text only through `textContent`, with length limits.
4. A lobby notice about IP addresses.
5. The exact hosts in the Content Security Policy.

### Size and first step

| Step | Size |
| --- | --- |
| A list of players in `World`, co-op rules | Large, about 30 to 40% of the work, with tests |
| Versus rules, arena maps, respawns, scores, lag compensation | Large |
| Snapshots, interpolation, prediction | Large |
| WebRTC with copy-paste signaling | Medium |
| Lobby, multiplayer HUD and cameras, synced level changes | Medium |
| Signaling server and TURN (optional) | Small to medium, plus hosting |

First step: **2 players with copy-paste signaling, co-op first**. No server and no new packages, and it tests the hardest part, the multi-player `World`, on the existing levels. Versus comes after, on the same network code, with its own arena map and rules.

