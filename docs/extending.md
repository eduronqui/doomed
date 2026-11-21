# DOOMED: Extending the Game

This guide explains how to add content: levels, characters, sprites, sounds, music, weapons, items, decorations, tiles and difficulties. Each section is a checklist with the files to change.

For the game rules, see [gameplay.md](gameplay.md). For setup and commands, see the [README](../README.md).

## Contents

1. [Workflow](#1-workflow)
2. [Naming rules](#2-naming-rules)
3. [Levels](#3-levels)
4. [Maps](#4-maps)
5. [Monsters](#5-monsters)
6. [The marine](#6-the-marine)
7. [Sprites](#7-sprites)
8. [Sound effects](#8-sound-effects)
9. [Music](#9-music)
10. [Weapons](#10-weapons)
11. [Items](#11-items)
12. [Keycards and locked doors](#12-keycards-and-locked-doors)
13. [Decorations](#13-decorations)
14. [Floors and walls](#14-floors-and-walls)
15. [Difficulties](#15-difficulties)
16. [Training tips](#16-training-tips)
17. [Rules that the code enforces](#17-rules-that-the-code-enforces)

## 1. Workflow

After every change:

1. If you changed any art, or added a level with a new door size, run `npm run sprites`.
2. Run `npm run linter`. It type-checks and runs ESLint.
3. Run `npm test`.
4. Run `npm run dev` and look at the change in the game.

Commit the source files and, after `npm run sprites`, also `public/assets/sprites.png` and `public/assets/sprites.json`.

Dev mode helps you test a change fast. These URL parameters work only with `npm run dev`:

| Parameter | Effect |
| --- | --- |
| `?autostart` | Skip the title screen (default difficulty) |
| `?level=n` | Start on level n (1 to 3), or 0 for the training |
| `?pos=x,y` | Put the player on map cell (x, y) |
| `?god` | Set the player health to 9999 |
| `?sight` | Show the enemy sight layer (view cones) |

Example: `http://localhost:5173/?autostart&god&level=2&pos=28,24`.

In dev mode, `window.__doomed.world` is the live `World` and `window.__doomed.scene` is the Phaser scene. Use them in the browser console.

## 2. Naming rules

Things that belong together share one name. The name starts every file and every export.

| Thing | Files | Exports |
| --- | --- | --- |
| Level 1 | `src/levels/level1.ts`, `level1.map.ts`, `level1.music.ts` | `LEVEL1`, `LEVEL1_MAP`, `LEVEL1_MUSIC` |
| Training | `src/levels/training.ts`, `training.map.ts`, `training.music.ts` | `TRAINING`, `TRAINING_MAP`, `TRAINING_MUSIC` |
| Husk | `src/characters/husk.ts`, `husk.art.ts` | `HUSK`, `HUSK_ART` |
| Marine | `src/characters/marine.ts`, `marine.art.ts` | `MARINE`, `MARINE_ART` |
| Pump shotgun | `src/weapons/shotgun.ts`, `shotgun.art.ts` | `SHOTGUN`, `SHOTGUN_ART` |

Other rules:

- `*.art.ts` files draw sprites. The simulation (`src/sim/`) never imports them.
- `src/sim/` never imports Phaser or the DOM, so the tests can run the real game rules in Node.
- Sprite frame names come from `key` in `src/render/atlas.ts`. Do not write frame names by hand.
- Use `player` for the role (whoever plays) and `marine` for the character and its sprites.

## 3. Levels

A level is three files plus one line in the level list.

### Steps

1. **Map:** create `src/levels/level4.map.ts`:

   ```ts
   export const LEVEL4_MAP = String.raw`
   ##########E#########
   #........b.........#
   #..P...............#
   ####################
   `;
   ```

   See [Maps](#4-maps) for the characters and rules.

2. **Music:** create `src/levels/level4.music.ts` that exports `LEVEL4_MUSIC: Track`. See [Music](#9-music).

3. **Settings:** create `src/levels/level4.ts`:

   ```ts
   import { parseLevel } from '../sim/level';
   import { LEVEL4_MAP } from './level4.map';
   import { LEVEL4_MUSIC } from './level4.music';
   import type { LevelInfo } from './types';

   export const LEVEL4: LevelInfo = {
     id: 4,
     title: 'E4: Your Title',
     briefing: 'Story text for the title screen.',
     darkness: 0.75,
     par: 300,
     music: LEVEL4_MUSIC,
     load: () => parseLevel('Your Title', LEVEL4_MAP),
   };
   ```

4. **Play order:** add `LEVEL4` to `LEVELS` in `src/levels/index.ts`. The array order is the play order. The victory screen of the previous level now offers "Continue to E4".

5. **Door sizes:** if the map has a door group of a new size (for example a 4-wide door), run `npm run sprites`. The sprite sheet holds one door piece per door size found in all levels.

6. Run `npm run linter` and `npm test`. `tests/level.test.ts` checks every level in `LEVELS` automatically.

### LevelInfo fields

| Field | Meaning |
| --- | --- |
| `id` | Level number (0 for the training) |
| `title` | Shown on screens and in the side panel |
| `briefing` | Story text on the title screen. It shows only for the level a run starts on (the training or E1, or any level with `?level=n` in dev mode). |
| `darkness` | Strength of the darkness, 0 (bright) to 1 (black). The levels use 0.55 to 0.8. |
| `par` | Par time in seconds, shown on the victory tally |
| `startMessage` | Optional. Text after "Welcome to ..." in the first Server Log message. Do not use it for hints about the level; only the training uses it. |
| `music` | The level's `Track` |
| `load` | Returns the parsed map |
| `startCarry` | Optional. The marine's loadout at the start. Only the training uses it. Other levels get the loadout from the previous level. |
| `alertOnEntry` | Optional. Monster kinds that wake up as soon as the player steps into their room |
| `ambush` | Optional. `{ key, groups }`: taking the keycard of color `key` opens the level's one trap door (`T`). `groups` maps each difficulty to a string of monster map chars, for example `{ recruit: 'hhff', veteran: 'hhffHb', doomed: 'hhffHbg' }`. The game places them on the floor of the empty closet behind the door, nearest to the door first. The game also puts two medikits on the back row of the closet, the row farthest from the door, symmetric around its middle. The back row must have at least two free cells. The closet must be a room with no map spawns, big enough for the largest group, and the `T` door must cover one whole side of it, so that every enemy inside can see out when it opens. The game throws an error otherwise. While the door is shut, the closet is hidden on the screen and the minimap. If every wall around the closet also touches another room, the closet is drawn as solid wall, so it can stand inside a room as a pillar or housing. Otherwise it stays unknown area until the door opens. |
| `tips` | Optional, training only. The instruction boxes (see [Training tips](#16-training-tips)) |
| `training` | Optional. Marks the training level |

### Level design tips

- Doors split the level into rooms. A room stays black until the player is in it or a door into it opens. Use doors to hide what comes next.
- Enemies never open doors. A closed door is a safe place for the player.
- Place lamps (`l`) and braziers (`t`). They are the only fixed lights besides slime, lava and wall screens.
- Monsters see only in a cone in front of them. A calm monster turns its head from time to time. Place them so that the player can sneak or must fight.
- Give the player enough ammo and health for the monsters you place. Every map in this game also has a secret.

## 4. Maps

A map is an ASCII grid. One character is one tile (32 px). Rows may have different lengths, and missing cells are void.

### Tiles

| Char | Tile | Char | Tile |
| --- | --- | --- | --- |
| `#` | Tech wall | `.` | Metal floor |
| `%` | Stone (hell) wall | `,` | Concrete floor |
| `D` | Door | `:` | Grate floor |
| `R` | Red door (red keycard) | `r` | Rock floor |
| `B` | Blue door (blue keycard) | `~` | Toxic slime (5 damage/s) |
| `Y` | Yellow door (yellow keycard) | `=` | Lava (10 damage/s) |
| `X` | Secret wall (opens with E) | `?` | Metal floor in a secret area |
| `T` | Trap door (looks like wall; only the level's `ambush` key opens it) | | |
| `E` | Exit switch (part of a wall) | space | Void outside the level |

### Entities

| Char | Entity | Char | Entity |
| --- | --- | --- | --- |
| `P` | Player start | `+` | Stimpack |
| `h` | Husk | `m` | Medikit |
| `H` | Shotgun Husk | | |
| `f` | Fiend | `a` | Combat vest |
| `b` | Brute | `v` | Vital sphere |
| `g` | Shade | `c` | Clip of bullets |
| `o` | Barrel | `s` | Box of shells |
| `l` | Lamp (thin post, light) | `G` | Pump shotgun |
| `C` | Crate (solid, blocks shots) | `W` | Rotary gun |
| `t` | Brazier (solid, light) | `k` | Red keycard |
| `x` | Gore decal | `j` | Blue keycard |
| `z` | Body decal | `y` | Yellow keycard |

### Rules

- An entity cell takes the floor of the cell to its left. Put a floor tile left of each entity to choose its floor.
- Adjacent door cells of the same kind form one door group. A group opens and closes as one piece and draws as one sprite. Make doors as wide as the corridor.
- Connected `?` cells form one secret area. It counts as found when the player steps in.
- The exit switch must sit on a top wall: the cell below it must be floor. Its face then shows toward the player.
- A monster must guard the exit switch: it spawns in the same room as the floor cell in front of the switch, at most 5 tiles away (`EXIT_GUARD_RADIUS` in `src/sim/level.ts`).
- Walls must enclose every floor, door and exit cell. No walkable cell may touch the void.
- Each keycard must be reachable without its own door, and the exit must need the keycards of the locked doors.

`parseLevel` rejects a map that breaks the exit rules or uses an unknown character. `tests/level.test.ts` checks the other rules for every level.

### Tip: draw maps with a script

The maps in this game were drawn with small scripts that place rectangles (rooms), fill areas (lava, slime) and put entities at coordinates. This is easier than typing a 64 x 44 grid by hand. Paste the output into the `.map.ts` file.

## 5. Monsters

A monster is a data file, an art file and a map character.

### Steps

1. **Kind:** add the name to `MonsterKind` in `src/characters/types.ts`:

   ```ts
   export type MonsterKind = 'husk' | 'shotgunner' | 'fiend' | 'brute' | 'shade' | 'wraith';
   ```

2. **Stats:** create `src/characters/wraith.ts` that exports `WRAITH: MonsterDef`. Copy the closest existing monster and change the values. See the field table below.

3. **Sprites:** create `src/characters/wraith.art.ts` that exports `WRAITH_ART: CharacterArt`:

   ```ts
   import type { CharacterArt } from './art';
   import { humanoid, humanoidCorpse, type Outfit } from './humanoid.art';

   const WRAITH_OUTFIT: Outfit = { /* colors and parts, see HUSK_OUTFIT */ };

   export const WRAITH_ART: CharacterArt = {
     frame: (dir, frame) => humanoid(WRAITH_OUTFIT, dir, frame, 'wraith'),
     corpse: () => humanoidCorpse('wraith', WRAITH_OUTFIT.body, WRAITH_OUTFIT.skin),
   };
   ```

   A humanoid monster can reuse `humanoid()`. A monster with its own shape draws its own `Pix`, like `brute.art.ts`. A variant can transform another monster's frames, like `shade.art.ts`. See [Sprites](#7-sprites).

4. **Register:** add `wraith: WRAITH` to `MONSTERS` in `src/characters/index.ts`, and `wraith: WRAITH_ART` to `CHARACTER_ART` in `src/characters/art.ts`.

5. **Map character:** add a free letter to `SPAWNS` in `src/sim/level.ts`, for example `w: 'wraith'`. Also add the kind to `MONSTER_KINDS` in the same file, so it can guard an exit.

6. **Sound (optional):** set `alertSound` to an existing sound, or add a new one (see [Sound effects](#8-sound-effects)).

7. Run `npm run sprites`, `npm run linter` and `npm test`.

The simulation, sight cones, names, health bars and corpses work for the new kind without more code.

### MonsterDef fields

| Field | Meaning |
| --- | --- |
| `kind`, `name` | Map kind and the name shown above the monster |
| `hp`, `speed`, `radius` | Health, tiles per second, body radius in tiles (0.3 to 0.4) |
| `painChance`, `painTime` | Chance to stagger on a hit, and how long |
| `ranged` | `'hitscan'`, `'fireball'` or `null` (melee only) |
| `weapon` | For `'hitscan'`: the Marine weapon it fires (`'pistol'`, `'shotgun'`, ...). The shot uses that weapon's pellets, spread, range and sound from `WEAPONS`. `null` for other attack styles. Draw the same weapon in its outfit (`weapon` in the `Outfit`). |
| `rangedRange`, `rangedChance`, `rangedDamage` | Ranged attack range, chance to fire when ready, damage [min, max] (per pellet for `'hitscan'`) |
| `meleeDamage` | Claw damage [min, max], or `null` |
| `windup`, `cooldown` | Delay before an attack lands, and time between attacks |
| `alertSound` | Sound when it wakes up |
| `drop` | Item it drops when it dies, or `null`. A dropped `clip` or `shells` always gives 5 rounds (`DROPPED_AMMO` in `src/sim/world.ts`), on every difficulty. |
| `lost` | What it does when it loses sight of the player: `'wander'`, `'hold'` or `'track'` |
| `trackTime` | Seconds it searches (`'wander'`) or tracks (`'track'`) before it gives up |
| `fov`, `sightRange` | View cone angle (radians) and calm sight range (tiles) |
| `coverBlocksSight` | If true, crates hide the player from it (like the Fiend) |
| `stealth` | If true, it is drawn almost invisible, and its name and cone show only up close (like the Shade) |
| `lookEvery`, `lookSwing`, `turnSpeed` | How often, how far and how fast it looks around while calm |

## 6. The marine

`src/characters/marine.ts` exports `MARINE`:

| Field | Meaning |
| --- | --- |
| `name` | Name shown above the marine |
| `speed` | Tiles per second |
| `radius` | Body radius in tiles |
| `start` | Loadout at the start of level 1 or after "Play the episode again": health, armor, ammo, weapons, selected weapon |

`src/characters/marine.art.ts` draws the marine. It draws one sprite set per weapon, because the marine holds the selected weapon. The held weapon shapes are in the weapon art files (`src/weapons/<name>.art.ts`). `humanoid.art.ts` draws the forearms and calls the weapon art.

## 7. Sprites

All sprites are drawn in code with the `Pix` class (`src/render/pixel.ts`) and baked into one sprite sheet.

### How sprites flow

1. Art functions return a `Pix`: a pixel grid with colors and alpha.
2. `buildArt()` in `src/render/art/catalog.ts` collects every sprite under its frame name.
3. `npm run sprites` packs them into `public/assets/sprites.png` and writes the atlas `public/assets/sprites.json`.
4. The game loads the sheet at boot and shows frames by name: `this.add.image(x, y, ATLAS, key.item('medkit'))` or `sprite.setFrame(...)`.
5. `tests/sprites.test.mjs` fails if the committed sheet differs from the art code.

### Where the art lives

| Art | File |
| --- | --- |
| Characters and corpses | `src/characters/<name>.art.ts`, shared body in `humanoid.art.ts` |
| Floors, walls, doors, exit switch | `src/render/art/tiles.ts` |
| Items, weapon icons, decorations, barrels, effects | `src/render/art/items.ts` |
| Title logo | `src/ui/logo.ts` (drawn at runtime, not in the sheet) |

### Drawing with Pix

```ts
const p = new Pix(32, 32);
p.rect(10, 14, 12, 10, 0x8a5634);                 // filled rectangle
p.ellipse(16, 10, 4, 4, 0xd8a47a);                // filled ellipse
p.ellipse(16, 18, 6, 6, (_x, _y, nx, ny) => ...); // color per pixel (nx, ny from -1 to 1)
p.set(14, 9, 0xff2a14);                           // one pixel
p.line(8, 20, 24, 20, 0x2c2e33);                  // line
p.speckle(0, 0, 32, 32, [c1, c2], 0.2, rng);      // random noise pixels
p.outline(0x140d0a);                              // dark outline around everything
return p;
```

Helpers in `src/render/pixel.ts`: `shade(color, f)` makes a color lighter (f > 0) or darker (f < 0), `mix(a, b, t)` blends two colors, `seeded(key)` gives a random generator that always returns the same numbers for the same key, `mirror()` flips a sprite, `blit()` and `blitRegion()` copy sprites.

### Style guide

- Tiles and characters are 32 x 32 pixels. Walls are 32 x 56: a 32 px top face and a 24 px front face below it.
- Light comes from the top left. Make left and top edges lighter, right and bottom edges darker.
- End character and item sprites with `outline()`, so they read well on any floor.
- Use `seeded('name')` instead of `Math.random()`, so the sheet is the same each time you build it.
- A character's feet sit at about row 29 to 30.

### Add a new sprite

1. Write the art function in the right art file.
2. Add a frame name helper to `key` in `src/render/atlas.ts` if no helper fits.
3. Register the sprite in `buildArt()` in `src/render/art/catalog.ts`.
4. Use it in `src/render/GameScene.ts` with `ATLAS` and the `key` helper.
5. Run `npm run sprites`.

Animated sprites are several frames (`_0`, `_1`, `_2`). The scene switches frames on a timer, like the braziers, barrels, slime and lava.

## 8. Sound effects

All sound effects are synthesized in `src/render/sfx.ts`. There are no audio files.

### Steps

1. **Id:** add the name to `SoundId` in `src/sim/defs.ts`, for example `'wraithShriek'`.

2. **Sound:** add a case to the `switch` in `Sfx.play()` in `src/render/sfx.ts`. Two helpers build every sound:

   - `n(duration, filterType, freqStart, freqEnd, gain, delay = 0, q = 1)`: filtered noise. Good for shots, explosions, hisses and impacts.
   - `o(wave, freqStart, freqEnd, duration, gain, delay = 0)`: a tone that slides from one pitch to another. Wave is `'sine'`, `'square'`, `'sawtooth'` or `'triangle'`. Good for growls, beeps and thumps.
   - `c(wave, [start, peak, end], duration, gain, [vibratoRate, vibratoDepth], delay = 0)`: a cry. It fades in, rises to the peak pitch, then falls, with an optional vibrato. Good for alert cries and roars.

   ```ts
   case 'wraithShriek':
     o('sawtooth', 900, 300, 0.6, 0.25);
     n(0.5, 'bandpass', 3000, 1200, 0.4, 0, 4);
     break;
   ```

   Combine several calls, and use `delay` to layer them in time.

3. **Play it:**
   - From the game rules: call `this.sound('wraithShriek', x, y)` in `src/sim/world.ts`. The scene plays it quieter with distance and pans it left or right.
   - As a monster's alert: set `alertSound: 'wraithShriek'` in its data file.
   - As a weapon shot: set the weapon's `sound` field.
   - From the interface: call `sfx.play('wraithShriek')` directly.

Keep gains below about 1. A compressor on the master output protects against clipping, but loud sounds still drown out the music.

## 9. Music

Each level has a track next to its map, for example `src/levels/level1.music.ts` exports `LEVEL1_MUSIC`. The engine in `src/render/music.ts` plays it live with a synthesized guitar, bass, lead and drums.

### Track format

```ts
import type { Track } from '../render/tracks';

export const LEVEL4_MUSIC: Track = {
  title: 'Your Title',
  bpm: 130,
  root: 40,      // MIDI note of the key: 40 = E2, 38 = D2, 45 = A2
  drive: 40,     // guitar distortion: 10 clean-ish, 55 very heavy
  guitar: `
    x x 0 - x x 3 - x x 5 - 3 - 0 -
    0 - - - 7 - 5 - 3 - - - 1 - - -`,
  bass: `
    0 0 0 - 0 0 3 - 0 0 5 - 3 - 0 -
    0 - - - 7 - 5 - 3 - - - 1 - - -`,
  lead: `
    . . . . . . . . . . . . . . . .
    24 - - - - - - - 22 - - - - - - -`,
  kick:  'x...x.x.x...x.x. x.......x.......',
  snare: '....x.......x... ....x...x.x.xxxx',
  hat:   'x.x.x.x.x.x.x.x. x.x.x.x.........',
};
```

- One token is one 16th note. 16 tokens are one bar.
- `guitar`, `bass`, `lead`: a number is a note in semitones above `root`. `-` holds the previous note. `.` is a rest. In the guitar, `x` is a short palm-muted chug on the root.
- The guitar plays power chords (note, fifth, octave). The bass plays one octave below the note. Put the lead one or two octaves up (12 to 36).
- `kick`, `snare`, `hat`: `x` hits, `.` rests. Spaces are ignored, so you can group by bar.
- Every part must have the same number of steps, in whole bars. Use `rest(bars)` from `src/render/tracks.ts` for an empty part.

Useful scales: minor 0 2 3 5 7 8 10, Phrygian (dark, metal) 0 1 3 5 7 8 10. The tritone (6) sounds tense.

To use the track, set `music: LEVEL4_MUSIC` in the level settings. `tests/music.test.ts` checks every level's track. Listen to it in the game: tests cannot judge the sound.

## 10. Weapons

### Steps

Each weapon has a data file and an art file in `src/weapons/`, like the characters. The example adds a plasma rifle named `plasma`.

1. **Id:** add `'plasma'` to `WeaponId` in `src/weapons/types.ts`.
2. **Stats:** create `src/weapons/plasma.ts` and export `PLASMA: WeaponDef`:

   | Field | Meaning |
   | --- | --- |
   | `id` | The weapon id, `'plasma'` |
   | `name`, `slot` | Display name and number key. Keys 1 to 4 are bound. For slot 5 or more, also add the key in `setupInput()` in `src/render/GameScene.ts`. |
   | `ammo` | `'bullets'`, `'shells'` or `null` (melee). For a new ammo type, add it to `AmmoType` in `src/weapons/types.ts`, to `MAX_AMMO` in `src/weapons/index.ts` and to the marine's `start.ammo`. |
   | `cooldown` | Seconds between shots |
   | `pellets`, `spread` | Projectiles per shot and their spread (radians) |
   | `damage`, `range` | Damage per pellet [min, max] and range in tiles |
   | `sound`, `noise` | Firing sound, and whether shots wake monsters |

3. **Register:** in `src/weapons/index.ts`, add `plasma: PLASMA` to `WEAPONS` and add `'plasma'` to `WEAPON_ORDER`. This order sets the side-panel slots and the marine sprite sets.
4. **Auto-switch:** if it should be picked when ammo runs out, add it to `FALLBACK_ORDER` in `src/weapons/index.ts`. The first owned weapon with ammo wins.
5. **Art:** create `src/weapons/plasma.art.ts` and export `PLASMA_ART: WeaponArt` (types and shared gun colors are in `src/weapons/held.art.ts`):

   | Field | Meaning |
   | --- | --- |
   | `recoil` | `true` if the weapon kicks back 1 pixel in the attack frame |
   | `south`, `north`, `east` | Draw the held weapon for that facing (west is mirrored). `hands` gives the skin and sleeve colors. `pose` gives `kick` and `attack`. |
   | `icon` | The 32 x 32 side-panel icon. A weapon pickup item can return it too, see `itemTexture()` in `src/render/art/items.ts`. |

   Then add `plasma: PLASMA_ART` to `WEAPON_ART` in `src/weapons/art.ts`.
6. **Pickup:** add a weapon item (see [Items](#11-items)), and handle it like `'shotgun'` and `'rotary'` in `tryPickup()` in `src/sim/world.ts`.
7. **Enemies (optional):** a monster with `ranged: 'hitscan'` and `weapon: 'plasma'` fires it (see [Monsters](#5-monsters)).
8. Run `npm run sprites`.

## 11. Items

### Steps

1. **Kind:** add the name to `ItemKind` and its pickup text to `ITEM_NAMES` in `src/sim/defs.ts` ("You picked up …").
2. **Effect:** add a case to `tryPickup()` in `src/sim/world.ts`. Call `return` before `item.taken = true` when the player should leave the item on the floor (for example, full health).
3. **Map character:** add a free letter to `SPAWNS` in `src/sim/level.ts`.
4. **Art:** add a case to `itemTexture()` in `src/render/art/items.ts`. Draw the item small and low in the 32 x 32 cell. The catalog adds every `ITEM_NAMES` entry to the sheet automatically.
5. **Glow (optional):** add a light in the item loop of `drawOverlay()` in `src/render/GameScene.ts`, like the keycards and the vital sphere.
6. Run `npm run sprites`.

Every item placed in a map counts toward the "Items" stat. Items that monsters drop do not count.

## 12. Keycards and locked doors

The game has red, blue and yellow keycards and doors. To add a color, for example green:

1. Add `'green'` to `KeyColor` and an entry to `KEY_ITEMS` in `src/sim/defs.ts`, and `'greenkey'` to `ItemKind` and `ITEM_NAMES`.
2. In `src/sim/level.ts`: add `'green'` to `DoorKind`, a door character to `DOOR_CHARS`, and a keycard character to `SPAWNS`.
3. In `src/sim/world.ts`: add the mapping to `KEY_COLOR_OF_ITEM` and the color to `keyColorOf()`, and the new keycard to the keycard case of `tryPickup()`.
4. Art and lights: the door stripe color in `HAZARD` and the light in `KEY_LIGHT` (`src/render/art/tiles.ts`), the card color in `KEY_CARD` (`src/render/art/items.ts`), and the light color in `KEY_RGB` (`src/render/GameScene.ts`).
5. Interface: a slot in `index.html`, the color in `KEY_COLORS` and `MINIMAP_COLORS` and the door check in `drawMinimap()` (`src/ui/hud.ts`), and the icon name in `src/main.ts`.
6. Run `npm run sprites`.

## 13. Decorations

Decorations are lamps, crates, braziers and decals.

1. Add the name to `DecoKind` in `src/sim/defs.ts`. If it should block its whole tile, add it to `SOLID_DECOS`. If it is a thin object like a lamp, add its radius to `DECO_POSTS` instead: you can walk close around it, and monsters still plan their paths around its tile.
2. Add a map character to `SPAWNS` in `src/sim/level.ts`.
3. Add a case to `decoTexture()` in `src/render/art/items.ts`, and register its frames in `buildArt()` in `src/render/art/catalog.ts`.
4. Add a case to `addDeco()` in `src/render/GameScene.ts`. It sets the position and depth, and optionally pushes a light to `staticLights`.
5. Optional: crates also block shots. That is set where decorations spawn in the `World` constructor (`shotBlockers`).
6. Run `npm run sprites`.

## 14. Floors and walls

**Floor:**

1. Add the name to `FloorKind` in `src/sim/level.ts`, a map character to `FLOORS`, and its damage per second to `FLOOR_HAZARD` (0 if safe).
2. Add a case to `floorTexture()` in `src/render/art/tiles.ts`, and the kind to the `floors` list in `buildArt()`.
3. Monsters avoid any floor with damage greater than 0.
4. Optional: a light for it in `buildMap()` in `src/render/GameScene.ts` (see slime and lava), and a color in the minimap (`src/ui/hud.ts`).
5. Run `npm run sprites`.

**Wall:** walls are `'tech'` (`#`) or `'stone'` (`%`). `wallTexture()` in `src/render/art/tiles.ts` draws them, and `WALL_VARIANTS` in `src/render/atlas.ts` sets how many variants exist. Variant 0 is plain. The scene picks other variants (screens, pipes, light strips) only for walls whose front face is visible.

## 15. Difficulties

Add an entry to `DIFFICULTIES` in `src/sim/defs.ts`. The picker shows all entries in order.

| Field | Meaning |
| --- | --- |
| `id`, `name`, `blurb` | Id, button title and button text |
| `enemyDamage` | Multiplies all enemy damage to the marine |
| `ammo` | Multiplies ammo from pickups |
| `enemySpeed`, `enemyCooldown` | Multiply enemy speed and time between attacks |
| `enemySight`, `projectileSpeed` | Multiply enemy sight range and fireball speed |
| `restInterval` | Seconds per 1 HP while resting. The 10 s wait before resting starts is `REST_DELAY` in `src/sim/world.ts` and is the same for all difficulties. |
| `restCap` | Resting stops at this health. 0 turns resting off. |

## 16. Training tips

The training shows instruction boxes from `tips` in `src/levels/training.ts`:

```ts
{
  area: [13, 1, 28, 11],   // map cells x0, y0, x1, y1
  text: 'Shown while the player is in this area.',
  clearText: 'Shown instead when no monster is alive in this area.',
}
```

The box shows the tip of the area that holds the player. Use `tips` only in the training: the box always has a "Skip training" button, which ends the training and starts E1. The "shown once" logic is in `src/ui/progress.ts`.

## 17. Rules that the code enforces

| Rule | Enforced by |
| --- | --- |
| Unknown map characters are rejected | `parseLevel` |
| The exit switch sits on a top wall with floor below it | `parseLevel` |
| A monster guards the exit switch (same room, within 5 tiles) | `parseLevel` |
| One player start, one exit, enough monsters, one or more secrets | `tests/level.test.ts` |
| No walkable cell touches the void | `tests/level.test.ts` |
| Keycards are reachable without their own door, and the exit needs them | `tests/level.test.ts` |
| Every non-solid entity is reachable | `tests/level.test.ts` |
| Every music track is whole bars with matching parts, one track per level | `tests/music.test.ts` |
| The committed sprite sheet matches the art code, with no overlapping frames | `tests/sprites.test.mjs` |
| The simulation never imports Phaser, the DOM or art files | Convention: keep `src/sim/` and `src/characters/*.ts` (not `*.art.ts`) pure |
