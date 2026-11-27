# Multiplayer

Plans and design notes for multiplayer. The rules of the built versus mode are in [gameplay.md](gameplay.md#versus-2-players). How to deploy the server is in the [README](../README.md#deploying-to-cloudflare).

## Status

| Part | Status |
| --- | --- |
| 2-player versus in the arena The Pit | Built |
| Host-authoritative `ArenaWorld`, inputs up and snapshots down | Built |
| Signaling: Cloudflare Worker, one Durable Object per 6-letter room code, trickle ICE | Built |
| STUN (Cloudflare) and TURN relay with short-lived credentials per player | Built |
| Limit of 20 rooms or joins per address in 10 minutes | Built |
| Frag count on screen and respawn countdown | Built |
| Player count in one place (`src/sim/players.ts`); the rules work for any number of players | Built |
| [More players in versus (up to 4)](#more-players-in-versus-up-to-4) | Planned, next |
| [Merge into main](#merging-versus-into-main): Cloudflare hosting for main, one Marine look everywhere | Planned |
| Client-side prediction and interpolation | Not built |
| Co-op in the episode | Not built |

## More players in versus (up to 4)

Goal: 3 or 4 players in one versus match, free-for-all, with the same host-authoritative design.

### Decisions

- **Star around the host.** Each guest connects only to the host. The guests never connect to each other. The host holds one WebRTC link per guest.
- **Free-for-all.** Every player scores for themselves. First to 10 frags wins.
- **Up to 4 players** in a room: the host and up to 3 guests.
- **No joining a match that has started.** Players join in the lobby. The host presses Start.
- **A player who leaves** drops out. The match goes on while at least 2 players remain. With 1 player left, that player wins.

### Signaling server

- A room accepts up to 3 guests. `admit()` counts the guests instead of checking for one.
- Each guest gets a number (1 to 3) from the room. The number goes in the WebSocket attachment, so it survives hibernation.
- Messages between the host and a guest carry the guest number: the host says which guest a message is for, and the room tells the host which guest a message came from. A guest can only talk to the host.
- The room tells the host when a guest joins or leaves (`peer` and `left` with the guest number), and sends TURN credentials to each new guest and a fresh set to the host for that guest.
- The room closes when the host leaves. When a guest leaves, only that guest's slot opens again, in the lobby.
- The limit of 20 rooms or joins per address stays.

### Client network

- The host keeps a list of links, one per guest. Each link runs its own offer, answer and candidates.
- The existing `PeerLink` already handles one connection. A small `HostLinks` class owns the signaling socket and creates one `PeerLink`-like connection per guest number.
- Guests do not change: they still have one link, to the host.

### Lobby

- The host sees the room code and a list of joined names with their colors. **Start** is available with 2 or more players.
- Guests see "Waiting for the host to start" and the list of names.
- Names must differ. A duplicate name gets a number added, for example "Edu 2".

### Game rules (`src/sim/arena.ts`)

Done: `src/sim/players.ts` holds `MIN_PLAYERS`, `MAX_PLAYERS`, the slot check and the `TEAMS` table (tint and label color per slot). `ArenaWorld` takes a list of names. Shots hit the nearest player on the line, melee hits the nearest player in reach, and a respawn picks the start farthest from the nearest living player. Tests already play 3-player matches in the simulation. To allow 4 players, raise `MAX_PLAYERS` and add two `TEAMS` entries with a tint each.

Still to do:
- **Leaving:** a player who leaves is removed from the snapshot. Their frags stay on the final score.
- The frag limit stays 10. Open point: lower it to 8 for 4 players, if matches feel long.

### Content and art

- **Map:** The Pit has 2 starts and is built for 1 against 1. Draw a larger arena by hand with 4 starts, loops and several routes. Show a draft before building. Until then, test 3 players in The Pit with 2 extra starts.
- **Colors (done):** a team color is a tint in `TEAMS`, not a sprite set. Versus draws each Marine as two images: a base layer (skin, visor, boots, belt, weapon) and a gray team layer (body, legs, helmet, pads) tinted with the team color. The art code splits the green Marine into both layers by drawing it a second time with probe colors and keeping the pixels that change. So red and yellow cost no art and no sprite sheet space: add `{ id: 'red', tint: 0xd6463c, color: '#ff5a4a' }`. Pick tints about as bright as green (`0x6fa056`) and blue (`0x5c83cb`), so the shading looks the same. The episode Marine keeps its baked green sprite.
- **Screen:** the scoreboard at the top becomes a short list sorted by frags. Name labels, tracers and the side panel use the 4 colors.

### Protocol and security

- `protocol.ts` accepts slots 0 to 3 and lists of up to 4 players and names. Everything else stays strict.
- The host limits messages per guest, as today, and drops a guest who floods.
- Each guest sees the IP address of the host only, not of the other guests. Guests who use TURN hide their address from the host too.

### Bandwidth and cost

- Host upload grows with each guest: one snapshot stream per guest. Snapshots are small, so 4 players should be fine on a normal home connection. Measure the bytes per second during a 4-player test and write the number here.
- TURN traffic grows with the number of players who need the relay. The free amount (1,000 GB per month) still covers normal play.

### Tests

- Rules: 3 and 4 player frags, respawns away from the nearest player, a player who leaves, the win with 1 player left, duplicate names.
- Room rules: up to 3 guests, a full room, guest numbers, messages routed to the right guest, a guest who sends to another guest is refused.
- Protocol: the strict checks with the larger lists.
- By hand: 3 browsers on different networks, through the deployed Worker.

### Order and size

| Step | Size |
| --- | --- |
| 1. Rules for 2 to 4 players in `ArenaWorld`, with tests | Medium |
| 2. Room with up to 3 guests and guest numbers, with tests | Medium |
| 3. Host with one link per guest | Medium |
| 4. Lobby with names and Start | Small |
| 5. Red and yellow Marines, scoreboard list | Small in code, larger sprite sheet |
| 6. Larger arena for 4, hand-drawn, draft first | Medium |

Steps 1 to 4 already allow a 3-player match in The Pit with 2 extra starts.

### Other option: the server runs the match

A Durable Object could run `ArenaWorld` itself, with every player on a WebSocket and no WebRTC.

- **Gains:** no TURN, no failed connections, no host advantage.
- **Costs:** a bit more delay, and much more Durable Object traffic. A rough estimate: inputs at 30 per second from 4 players use the free 100,000 requests per day in about 25 matches. Fewer inputs per second allow more.
- Not chosen for now. It is a good fit if public matches with strangers ever matter, because the host cannot cheat.

## Merging versus into main

Versus lives on the `versus-multiplayer` branch. `main` stays on Vercel until the merge. Steps for the merge:

### Hosting

- `main` moves from Vercel to Cloudflare, because versus needs the `/signal` route of the Worker on the same site.
- The Worker keeps the name `doomed`. If versus was deployed as `doomed-versus` in the meantime, delete that Worker after the merge (`npx wrangler delete doomed-versus`).
- Put the TURN secrets on the `doomed` Worker again if it does not have them: `npx wrangler secret put TURN_KEY_ID` and `npx wrangler secret put TURN_KEY_TOKEN`.
- Disconnect the Vercel project, or the old site keeps deploying `main` without versus.
- Saves do not carry over from the Vercel domain to the Cloudflare domain. Mention it in the release notes.

### One Marine look everywhere

Goal: the episode and versus draw the Marine the same way, so it looks and feels the same everywhere.

- Today the sprite sheet holds three Marine sets: the baked green Marine for the episode, and the base and team layers for versus.
- At the merge, the episode also draws the player as the base layer plus the team layer, tinted with the green team color (`TEAMS[0].tint`).
- Then remove the baked green set (`actor_marine-...` and `corpse_marine`, 129 frames) from the art catalog and the sprite sheet.
- Every effect on the player in `GameScene` must apply to both images: the hurt flash, stealth or see-through looks, the muzzle flash depth, and the corpse.
- Check: a test that the green tint rebuilds the green Marine already exists (`tests/marineLayers.test.ts`). Also compare episode screenshots before and after.

### Before the merge

- Rebase `versus-multiplayer` onto `main` (never merge `main` into it).
- Run the linter, the tests and `npm run sprites` (the sprite sheet must match the art code).
- Play one episode level and one versus match on the deployed site.

## Design notes

Goal of the whole multiplayer work: 2 to 4 players in two modes, on the same network code.

- **Versus (PvP):** Marines against each other, in deathmatch arenas, with or without demons. Built for 2 players.
- **Co-op:** play the episode together, Marines against the same demons. Not built.

### Network model

- **Host-authoritative.** One browser (the host) runs the real `World`. The simulation in `src/sim/` is pure TypeScript and steps only through `World.update(dt, input)`, so it can run unchanged on the host.
- **Clients send inputs** to the host about 30 times per second: movement, aim, fire, use, weapon. Never state.
- **The host sends snapshots** about 20 times per second: players, monsters, projectiles, doors, items, events.
- **Clients interpolate** between snapshots, and predict their own Marine's movement so that walking feels instant.
- **Not lockstep.** The game steps with a variable `dt`, and every browser would have to compute exactly the same results. One mismatch makes the games drift apart.
- **Transport:** a WebRTC data channel. Unreliable and unordered for snapshots, reliable for events (pickups, messages, level changes).

### Connecting the players

- **Signaling (built):** a Cloudflare Worker with one Durable Object per room. The host gets a 6-letter code, the guest types it, and the room relays the offer, the answer and the ICE candidates. The room uses the WebSocket Hibernation API, closes after 5 minutes or when a player leaves, and fits in the free plan. The first version used copy-paste codes with no server.
- **STUN (built):** Cloudflare's free STUN server.
- **TURN (built):** needed for roughly 10 to 20% of connections, and for most mobile data. When a guest joins, the Worker asks Cloudflare for credentials for each player (30 minutes, enough for a match; the browser needs them, so they cannot be hidden from it) and sends them in the `joined` and `peer` messages. The key stays in Worker secrets. Free up to 1,000 GB per month.

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
- Room codes do not contain the IP address, but anyone with the code can join the room while it is open. Players should not post codes in public channels.

**5. Signaling and TURN servers** (built; these rules apply to them).
- HTTPS and WSS only. The signaling exchange carries the keys that WebRTC's built-in encryption (DTLS) depends on, so anyone who can change it can read or change all game traffic.
- Long random room codes that expire, with a rate limit on join attempts, so strangers cannot guess them.
- Check the `Origin` header, cap rooms and connections per IP address, and do not log the exchanged data.
- Never put TURN credentials in the client bundle, or anyone can use the relay at our cost. Use short-lived credentials signed by a small server endpoint. Its secret goes in a secret store, never in code or in the repository.

**6. Browser and dependency settings.**
- Extend `connect-src` in the Content Security Policy only to the exact signaling, STUN and TURN hosts, with no wildcards. Keep `script-src 'self'` and `frame-ancestors 'none'`.
- A library such as PeerJS adds supply-chain risk: pin its version, run `npm audit`, and ask before installing it. The current version needs no networking package; only `wrangler` is a dev dependency.

**7. Data.** No accounts, no personal data, nothing stored on a server beyond the short signaling exchange. Player names live in memory for the session only.

**Checklist for every new multiplayer step:**
1. Strict checks on all messages, both directions.
2. Rate and size limits per peer.
3. Text only through `textContent`, with length limits.
4. A lobby notice about IP addresses.
5. The exact hosts in the Content Security Policy.

### Testing

1. **Unit tests, no browser.** The rules (`ArenaWorld`), the protocol checks and the room rules (`src/net/signal.ts`) are pure TypeScript and run in Vitest.
2. **Local server.** `npm run dev:worker` and `npm run dev` together run the game and the signaling server on this machine. A Node script with WebSockets can drive a host and a guest through the room.
3. **Two tabs, no network.** In dev, `?versus=host` and `?versus=join` pair two tabs over a `BroadcastChannel`, without WebRTC.
4. **Two tabs with WebRTC.** On some machines this fails, because Chrome hides local addresses behind `.local` names and the machine cannot resolve them (for example when Chrome has no Local Network permission on macOS). Use two devices on different networks instead.
5. **Deployed.** `npm run deploy` and two devices on different networks, for example a laptop on Wi-Fi and a phone on mobile data. `npx wrangler tail` shows the room events and the TURN status.
