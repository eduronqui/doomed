# Refactor plan: prepare main for versus

Goal: remove duplication between the episode and versus before the two branches merge. Shared parts move out of the episode code on `main` into small modules. Then the `versus-multiplayer` branch is rebased onto `main` and uses those modules instead of its own copies.

Status: planned, not started.

## Why now

- Versus copied parts of the episode instead of sharing them:
  - `src/render/ArenaScene.ts` (about 470 lines) repeats parts of `src/render/GameScene.ts` (about 1,190 lines): map drawing, Marine views, input, effects and tracers.
  - `src/sim/arena.ts` (about 480 lines) repeats parts of `src/sim/world.ts` (about 1,880 lines): Marine movement, firing, damage with armor, pickups and ammo.
- A cleanup on `main` alone cannot see these copies, and every change to shared files makes the next rebase of versus harder. So the shared modules are built on `main` with versus in mind, and versus switches to them in the same step.

## Rules

- Phase A changes no behavior on `main`. Existing tests stay as they are and must pass.
- One commit per step. Linter (`npm run linter`) and tests (`npm test`) pass after each step.
- New modules get their own tests.
- Rebase `versus-multiplayer` onto `main`, never merge `main` into it.

## Phase A: refactor main

### 1. Shared math in `src/sim/types.ts`

`world.ts` has its own copies of `angleDiff` and `rayCircle`. Move them to `src/sim/types.ts`. The versus branch already did this, so the step also shrinks the branch diff.

### 2. Marine rules in `src/sim/marine.ts`

Pure functions on a small Marine state (health, armor, ammo, weapons, current weapon, cooldown):

- **Damage:** armor absorbs a third of the damage, up to the armor left. Returns the damage taken.
- **Ammo:** add ammo up to `MAX_AMMO`, and say whether anything was added.
- **Weapons:** "has ammo for this weapon" (with `ammoPerShot`), the best fallback weapon (`FALLBACK_ORDER`), the weapon for a slot key, the next weapon when cycling, and selecting a weapon (with the short switch delay).
- **Walking:** the walk step: normalized input times `MARINE.speed` times `dt`, then `grid.move`. Returns the move result, so the episode keeps its extras (sliding into gaps, shoving, footsteps, doors).
- **Items:** the effect of health, armor, ammo and weapon pickups, with the ammo tables (`PICKUP_AMMO`, `WEAPON_PICKUP_AMMO`) and an ammo scale (difficulty in the episode, 1 in versus). Returns whether the item was taken, the sound and a new weapon, if any. The amounts are the same as versus uses today: clip 10, shells 8, shotgun 8 shells, rotary 20 bullets.

`world.ts` keeps everything that only the episode has: keycards and ambushes, stats, difficulty scaling, god mode, dropped and emergency items, footsteps, doors, resting and hazards. It calls the shared functions for the rest.

### 3. Render constants in `src/render/layers.ts`

The depth constants (`FLOOR_DEPTH`, `CORPSE_DEPTH`, `OVERLAY_DEPTH`, `NAME_DEPTH`), `ACTOR_FOOT`, `GUN_HEIGHT_PX` and the tile `hash`. On the versus branch, `ArenaScene.ts` imports them from `GameScene.ts`, which pulls the whole episode scene into the arena scene.

### 4. Effects in `src/render/effects.ts`

The short effect animations (blood, puffs and the other frames in `FX_FRAMES`) and the tracer lines, as one small class with `add`, `update` and `draw`. `GameScene` uses it. The arena scene has a simpler copy today.

### 5. Logo helper in `src/ui/screens.ts`

The title logo is created the same way in several screens. One helper builds it.

## Phase B: rebase versus and remove the copies

- Rebase `versus-multiplayer` onto the refactored `main`, and resolve the conflicts.
- `src/sim/arena.ts` uses `src/sim/marine.ts` instead of its own armor, ammo, weapon, walking and pickup code.
- `src/render/ArenaScene.ts` uses `layers.ts` and `effects.ts`, and no longer imports `GameScene.ts`.
- Run the linter and all tests on the branch, and play one local match (`?versus=host` and `?versus=join`).

### Decision needed: one set of Marine rules

Sharing the rules makes versus behave like the episode in three small ways:

1. Switching weapons has a 0.2 second delay, as in the episode.
2. A weapon that uses more than one ammo per shot needs enough ammo for a shot. Versus has no such weapon today.
3. Picking up ammo with only the knife in hand switches to a weapon that can use it.

Recommendation: take the episode rules, so the Marine has one set of rules everywhere. The other option is to keep the versus behavior through options on the shared functions.

## Later, not in this plan

- **One map renderer for both scenes.** The episode renderer handles heights, doors, liquids and braziers; the arena renderer is a simple copy. This is the largest win and the largest risk, so it is a separate step.
- **One Marine look everywhere:** the episode draws the player with the base and team layers, and the baked green set leaves the sprite sheet. See "Merging versus into main" in `docs/multiplayer.md` on the `versus-multiplayer` branch.
