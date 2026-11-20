# DOOMED

A fast top-down shooter with a demon-invasion theme. The view, pixel art and interface follow the style of classic tile-based online RPGs: a 3/4 oblique view, 32 px tiles, names and health bars above creatures, a minimap and a server log.

All sprites are drawn in code and baked into one sprite sheet (`public/assets/sprites.png` with the atlas `public/assets/sprites.json`). All sound effects and the music of each level are synthesized at runtime with WebAudio. The project has no audio files.

**Play it:** https://doomed-nine.vercel.app/

- Game rules, enemies, weapons, items and walkthroughs of all three levels: [docs/gameplay.md](docs/gameplay.md)
- How to add levels, characters, sprites, sounds, music and more: [docs/extending.md](docs/extending.md)
- Ideas and plans under discussion (not built yet): [docs/ideas.md](docs/ideas.md)

## Requirements

- Node.js 26.13.1 or later (see `.nvmrc`)
- A browser with WebGL and Web Audio

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install the dependencies |
| `npm run dev` | Start the dev server (Vite) |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the `dist/` build |
| `npm run sprites` | Draw all sprites and write the sprite sheet to `public/assets/` |
| `npm run linter` | Type-check (`tsc --noEmit`) and run ESLint |
| `npm test` | Run the Vitest tests |

## Stack

| Part | Choice |
| --- | --- |
| Language | TypeScript 6.0.3 |
| Engine | Phaser 4.2.1 (WebGL renderer, input, camera) |
| Build | Vite 8 |
| Tests | Vitest 5 |
| Lint | ESLint 10 with typescript-eslint 8 |

TypeScript is pinned to 6.0.x because typescript-eslint 8.73 supports only TypeScript versions below 6.1. Update it when typescript-eslint supports TypeScript 7.

## Project structure

```
index.html            Page layout: game view, server log, side panel
public/assets/
  sprites.png         Sprite sheet with every sprite frame (generated)
  sprites.json        Phaser atlas (JSON hash) with the frame rectangles (generated)
scripts/
  build-sprites.mjs   Builds the sprite sheet from the art code (npm run sprites)
  png.mjs             Small PNG encoder and decoder (Node zlib, no dependencies)
src/
  main.ts             Creates the Phaser game, the boot scene and the shared services
  style.css           Interface styles (stone panels, bars, slots, screens)
  sim/                Game rules. Pure TypeScript, no Phaser, fully testable
    defs.ts           Items, keycards, sounds, difficulties: tuning values
    level.ts          ASCII map parser, tile types, hazard damage
    grid.ts           Tiles, doors and door groups, rooms, collision, raycasts
    pathfind.ts       A* path search (8 directions, no corner cutting)
    world.ts          The simulation: player, monster AI, combat, pickups, events
    rng.ts            Seeded random numbers
    types.ts          Small shared types and helpers
  characters/         Everything about each character, one name per character
    index.ts          MONSTERS and MARINE (data only, used by the simulation)
    types.ts          MonsterKind, MonsterDef, MarineDef and their trait types
    art.ts            CHARACTER_ART registry and CharacterKind (used by the sprite sheet)
    humanoid.art.ts   Shared humanoid body: legs, torso, head, forearms, corpse (calls the weapon art)
    marine.ts         MARINE: speed, size, starting loadout
    marine.art.ts     MARINE_ART: one sprite set per weapon, corpse
    husk.ts           HUSK: stats and traits      husk.art.ts    HUSK_ART
    shotgunner.ts     SHOTGUNNER (Shotgun Husk)   shotgunner.art.ts  SHOTGUNNER_ART
    fiend.ts          FIEND                       fiend.art.ts   FIEND_ART
    brute.ts          BRUTE                       brute.art.ts   BRUTE_ART (and BRUTE_PALETTE)
    shade.ts          SHADE                       shade.art.ts   SHADE_ART (a ghostly Brute)
  weapons/            Everything about each weapon, one name per weapon
    index.ts          WEAPONS, WEAPON_ORDER, FALLBACK_ORDER, MAX_AMMO (data only, used by the simulation)
    types.ts          WeaponId, AmmoType, WeaponDef
    art.ts            WEAPON_ART registry (used by the sprite sheet)
    held.art.ts       WeaponArt and HeldPose types, shared gun colors
    knife.ts          KNIFE: stats                 knife.art.ts    KNIFE_ART: held poses, icon
    pistol.ts         PISTOL                       pistol.art.ts   PISTOL_ART
    shotgun.ts        SHOTGUN                      shotgun.art.ts  SHOTGUN_ART
    rotary.ts         ROTARY                       rotary.art.ts   ROTARY_ART
  levels/
    index.ts          LEVELS (play order), TRAINING, ALL_LEVELS, levelInfo()
    types.ts          LevelInfo and Tip types
    levelN.ts         Level N settings (N = 1 to 3): title, briefing, darkness, par, music, loader
    levelN.map.ts     Level N ASCII map
    levelN.music.ts   Level N music track
    training.ts       Training settings (tips, start loadout, alert-on-entry), shown once
    training.map.ts   Training ASCII map
    training.music.ts Training music track
    death.music.ts    Death screen music loop

    Levels: 1 = E1: Outpost Breach, 2 = E2: Toxin Refinery, 3 = E3: Ember Gate.
  render/             Everything visual and audible
    GameScene.ts      Builds the map sprites, syncs them with the world, effects, input
    lighting.ts       Darkness overlay and colored glow
    devParams.ts      Dev-only URL parameters (the production build drops them)
    atlas.ts          Atlas paths, frame names, frame-to-canvas helper
    sheet.ts          Packs sprites into one RGBA sheet and its atlas data
    art/catalog.ts    The list of every sprite in the sheet (including door pieces for all levels)
    pixel.ts          Small pixel canvas with outline, mirror and shading helpers
    art/tiles.ts      Floors, walls, doors, exit switch
    art/items.ts      Items, decorations, barrels, effects
    sfx.ts            WebAudio sound effects (class Sfx)
    music.ts          Music engine: look-ahead step sequencer, guitar, bass, lead and drum voices
    tracks.ts         Track type, pattern parser and validation
  ui/
    hud.ts            Side panel, minimap, server log, center messages
    screens.ts        Title, pause, death and victory screens
    logo.ts           Generated title logo
    progress.ts       localStorage flag that marks the training as done
    storage.ts        Safe localStorage flags (training, music, sound)
tests/                Vitest tests for the simulation, the levels and the sprite sheet
```

### How the parts connect

1. `World.update(dt, input)` advances the game in steps of at most 1/30 s.
2. The world pushes events (sounds, messages, damage numbers, tracers, effects) into a queue.
3. `GameScene` reads the input, calls `update`, drains the events, and moves the sprites to match the world state.
4. The `sim/` folder never imports Phaser or the DOM. Tests run the real rules in Node.

## Extending the game

[docs/extending.md](docs/extending.md) explains, step by step, how to add levels, maps, monsters, sprites, sound effects, music, weapons, items, keycards, decorations, floors, walls and difficulties, and lists the rules that the parser and the tests enforce.

In short:

- **Sprites** are drawn in code (`src/render/art/`, `src/characters/*.art.ts`) and baked into `public/assets/sprites.png` with `npm run sprites`. Commit the sheet after art changes. A test fails if it is out of date.
- **Levels** are `src/levels/levelN.ts` (settings), `levelN.map.ts` (ASCII map) and `levelN.music.ts` (music track), listed in play order in `LEVELS`.
- **Characters** are `src/characters/<name>.ts` (stats) and `<name>.art.ts` (sprites), registered in `MONSTERS` and `CHARACTER_ART`.
- **Sounds** are synthesized cases in `Sfx.play()` (`src/render/sfx.ts`), named in `SoundId`.

## Development aids

In dev mode (`npm run dev`) only, these URL parameters help with testing:

| Parameter | Effect |
| --- | --- |
| `?autostart` | Skip the title screen |
| `?god` | Set the player health to 9999 |
| `?pos=x,y` | Start the player on map cell (x, y) |
| `?level=n` | Start on level n (1 to 3), or 0 for the training |
| `?sight` | Show the enemy sight layer (view cones) |

Example: `http://localhost:5173/?autostart&god&pos=50,26` starts in the hell vault.

Dev mode also sets `window.__doomed` to `{ world, scene }` for inspection in the browser console. The production build has none of these aids.

## Tests

`npm test` runs the tests in `tests/`:

- `level.test.ts`: for every level: one start, enough monsters, a secret and one exit. No floor touches the void. The exit faces a room. Every keycard is reachable without its own door, and the exit needs the keycards. All entities are reachable. Also map parsing of colored doors, keycards and shades.
- `grid.test.ts`: collision, sliding along walls, raycasts, door timing, door groups, path search.
- `devParams.test.ts`: the dev URL parameters, also bad values.
- `storage.test.ts`: the stored sound and music choices, also when storage is blocked.
- `training.test.ts`: the localStorage flag (also when storage is blocked), the hurt start and a tip for every room and monster.
- `music.test.ts`: every track is whole bars with matching parts, each level has its own track, and the pattern parser.
- `sprites.test.mjs`: the committed sprite sheet matches the art code, and no frames overlap.
- `world.test.ts`: pickups, weapons, ammo fallback, combat, armor, hazards, barrels, doors and keys, secrets, death, exit, resting, view cones, crate cover, knife backstabs, the lost-sight behavior of each enemy kind, monsters and doors, difficulty scaling, room reveal, colored keycards, carry-over between levels and the Shade.

## Security notes

- `index.html` sets a Content Security Policy: scripts from the same origin only, no plugins, no form targets.
- On Vercel, `vercel.json` also sends the policy as an HTTP header, with `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy` and `Permissions-Policy`.
- The interface writes dynamic text with `textContent`, never with `innerHTML`.
- The game makes no network requests. It stores only three flags in `localStorage`: training done, music on or off, and sound on or off.

## License

MIT. See [LICENSE](LICENSE).
