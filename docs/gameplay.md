# DOOMED: Gameplay Reference

This document describes every game rule in DOOMED. All numbers come from the code in `src/sim/`. A "tile" is one map cell (32 px on screen).

## Goal

The episode has three levels. Each level has one exit switch. It always sits on the top wall of a room, and at least one monster always guards it, close to it in the same room. Find it and use it. Enemies, locked doors and hazards are in your way. When you use the switch, a tally shows your kills, items, secrets and time. Then you continue to the next level.

## Training (first run only)

The first time you play, the game starts with a short training level, "Training: Boot Camp". A box at the top of the screen explains each step. It has three rooms in a row:

| Room | What it teaches |
| --- | --- |
| 1 | Moving (W A S D), aiming (mouse), picking up items (a clip and a combat vest) and opening doors |
| 2 | Shooting two Husks and a pair of barrels, crates as cover. When the room is clear, the box explains resting and its cap, healing with a medikit, and weapon switching with a shotgun. |
| 3 | A Brute that guards the exit switch. It spots you the moment you step into the room and charges at once. The box explains how to fight a Brute. When the Brute is dead, it tells you to use the exit switch. |

- You start the training with 25 health, below the rest cap of Recruit and Veteran, so you can see resting heal you. On Doomed there is no resting, so use the medikit.
- When you use the exit switch, the training shows the same victory tally as the other levels (par 1:30). Then "Continue to E1: Outpost Breach" (or R) starts E1 with a fresh loadout. Nothing from the training carries over.
- The "Skip training (Enter)" button in the box, or Enter, ends the training at once and starts E1.
- When you reach the training exit or skip the training, the game stores `doomed.trainingDone = 1` in the browser's localStorage. After that, new games start at E1. To see the training again, remove that key (browser developer tools, Application, Local Storage). If the browser blocks localStorage, the training shows on each new game.
- If you die in the training, it restarts.

## Episode and progression

| Level | Title | Keycards | Par |
| --- | --- | --- | --- |
| 1 | E1: Outpost Breach | red | 4:00 |
| 2 | E2: Toxin Refinery | blue | 5:00 |
| 3 | E3: Ember Gate | yellow, then red | 6:00 |

- When you continue to the next level, your health, armor, ammo, weapons and selected weapon carry over. Keycards do not carry over.
- When you die, the level restarts with the loadout you had when you entered it. Level 1 always starts with 100 health, the knife, the sidearm and the start bullets of your difficulty (60, 40 or 20).
- After level 3, the victory screen offers to play the episode again from level 1, with any difficulty.

## Difficulty

Pick a difficulty on the title screen before you start. The victory screen after the last level lets you pick again. The death screen lets you pick again only from your 3rd death in a row on the same level. R restarts with the same difficulty.

| | Recruit | Veteran | Doomed |
| --- | --- | --- | --- |
| Enemy damage | x0.5 | x1 | x1.5 |
| Start bullets | 60 | 40 | 20 |
| Ammo from pickups and drops (rounded) | x2 | x1 | x0.75 |
| Enemy speed | x0.9 | x1 | x1.15 |
| Time between enemy attacks | x1.3 | x1 | x0.75 |
| Enemy sight range | x0.85 | x1 | x1.25 |
| Fireball speed | x0.85 | x1 | x1.25 |
| Resting heals 1 HP every (after the 10 s wait) | 1.5 s | 2 s | no resting |
| Resting stops at | 60 HP | 30 HP | no resting |

All numbers in this document are for Veteran. The side panel shows the difficulty next to the level name.

## Controls

| Input | Action |
| --- | --- |
| W A S D or arrow keys | Move |
| Mouse | Aim |
| Left mouse button (hold) | Fire (only when the click starts inside the play area) |
| E or Space | Use (doors, secret walls, exit switch) |
| 1 to 4 | Select weapon slot |
| Mouse wheel | Next or previous weapon |
| Q | Next weapon |
| N | Turn the music on or off (remembered in localStorage) |
| M | Mute or unmute all sound (remembered in localStorage) |
| Esc or P | Pause or resume |
| W A S D or arrow keys, then Enter | On the title, death and victory screens: select a button and press it |
| Enter | On the pause screen: resume. On the victory screen: skip the count. During training: skip the training |
| R | On the death screen: restart the level. On the victory screen: continue to the next level (or play again after level 3) |

On a screen with buttons, the gold border marks your current difficulty and the white outline marks the selected button. The selection starts on the current difficulty, and the mouse moves it too. A held key does not repeat on these screens.

The first difficulty pick on the title screen (click or Enter) also starts the sound. Browsers block sound until you click or press a key.

## The Marine

| Property | Value |
| --- | --- |
| Start health | 100 |
| Max health | 100 from medical items, 200 with a vital sphere |
| Start armor | 0 |
| Max armor | 100 |
| Speed | 5 tiles per second |
| Start weapons | Combat knife, sidearm |
| Start ammo | 40 bullets, 0 shells (60 on Recruit, 20 on Doomed) |

### Armor

Armor absorbs one third of the damage from enemy attacks and explosions (rounded down). Each absorbed point removes one point of armor. Slime and lava ignore armor.

### Resting

You start to rest after **10 seconds** in which all these conditions stay true:

- You do not move.
- You do not attack.
- No damage hit you.
- Your health is below the rest cap of your difficulty.
- No live enemy is in your room.

While you rest, you recover **1 health every 2 seconds** (Veteran). If any condition breaks, resting stops and the 10 seconds start again.

Resting is a safety net, not full healing. It stops at the rest cap: **60 HP on Recruit, 30 HP on Veteran, and no resting at all on Doomed**. Above the cap, only stimpacks, medikits and vital spheres heal you.

Doors divide the level into rooms. Open passages without a door join two areas into one room. If you stand in a doorway, the rooms on both sides count. The HUD shows no countdown and no label. While you rest, a green "+1" floats up over the marine for each point.

### Death

When your health reaches 0, you die. The level music stops. After 1.4 seconds the death screen shows "YOU DIED" and a slow dramatic loop plays until you restart. The screen shows no stats; only the victory tally shows them.

- On your 1st and 2nd death on a level, the screen shows one "Try again" button on the same difficulty. Click it, press Enter or press R.
- From your 3rd death on the same level, the screen shows the difficulty picker instead. Select a difficulty with the mouse, or with the arrow keys or W A S D and Enter, or press R to keep the same one.
- The count goes back to 0 when you clear a level or reload the page.

## Weapons

| Slot | Weapon | Ammo | Damage per hit | Pellets | Fire delay | Range | Noise |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Combat Knife | none | 6 to 20 | 1 | 0.40 s | 1.25 tiles | silent |
| 2 | Sidearm | 1 bullet | 5 to 15 | 1 | 0.38 s | 22 tiles | loud |
| 3 | Pump Shotgun | 1 shell | 5 to 15 | 7 | 0.95 s | 18 tiles | loud |
| 4 | Rotary Gun | 1 bullet | 5 to 15 | 1 | 0.11 s | 22 tiles | loud |

- Aim at the head or the body of an enemy. The line of aim goes through the cursor at gun height, so shots at the legs miss.
- Guns hit instantly along the line of aim (hitscan). Each pellet spreads a little. The rotary gun spreads more than the sidearm. The shotgun spreads the most.
- The knife hits the nearest enemy or barrel in front of you, inside a wide arc.
- **Backstab.** A knife hit kills a calm enemy at once if you stand in its back arc (120° wide) and it does not see you. Calm means idle, wandering, holding or walking home, not hunting you. It works on every enemy kind, also the Brute and the Shade. The kill makes only a soft thud instead of the death scream, and no other enemy wakes up. The message "Silent kill." shows.
- Any other knife kill is loud: the enemy screams, and the scream wakes all enemies within 13 tiles, like a gunshot.
- **Loud** weapons wake all enemies within 13 tiles, even through walls. The knife swing is silent, but a knife kill that is not a backstab is loud.
- When a gun is empty, you switch to your best weapon that has ammo. The order is shotgun, rotary gun, sidearm, knife.
- When you pick up a new weapon, you switch to it at once.
- The marine sprite shows the selected weapon from all four directions.

### Ammo limits

| Ammo | Max |
| --- | --- |
| Bullets | 200 |
| Shells | 50 |

## Items

You pick up an item when you walk over it. Stimpacks and medikits stay on the floor when your health is already 100 or more. You always pick up a vital sphere. Armor stays on the floor when your armor is already 100 or more. Ammo stays on the floor when that ammo is full.

| Item | Effect |
| --- | --- |
| Stimpack | +10 health, up to 100 |
| Medikit | +25 health, up to 100 |
| Vital sphere | +100 health, up to 200 |
| Combat vest | Sets armor to 100 |
| Clip of bullets | +10 bullets (+5 if a Husk dropped it) |
| Box of shells | +8 shells (+5 if a Shotgun Husk dropped it) |
| Pump shotgun | Gives the shotgun and 8 shells |
| Rotary gun | Gives the rotary gun and 20 bullets |
| Red, blue or yellow keycard | Opens doors of the same color in this level |

The "Items" stat counts the items placed in the map. Ammo dropped by Husks and Shotgun Husks does not count.

## Enemies

All enemies show their name and a health bar above them. The name color changes with their health: green above 60%, yellow above 30%, red below that. Each hit shows a red damage number.

### Overview

| | Husk | Shotgun Husk | Fiend | Brute | Shade |
| --- | --- | --- | --- | --- | --- |
| Health | 20 | 30 | 60 | 150 | 150 |
| Speed (tiles/s) | 2.2 | 2.1 | 2.5 | 3.8 | 3.5 |
| Attack | Sidearm (1 bullet) | Pump shotgun (7 pellets) | Fireball, or claw at close range | Claw (melee only) | Claw (melee only) |
| Damage | 3 to 12 | 2 to 5 per pellet | Fireball 3 to 20, claw 3 to 24 | 4 to 32 | 4 to 32 |
| Attack range | 12 tiles | 9 tiles | Fireball 14 tiles | Contact | Contact |
| Wind-up before the attack | 0.45 s | 0.6 s | 0.5 s (claw 0.35 s) | 0.3 s | 0.3 s |
| Time between attacks | about 1.5 s | about 2.2 s | about 1.6 s | about 0.9 s | about 0.9 s |
| Chance to fire when ready | 55% | 60% | 45% | always (when in contact) | always (when in contact) |
| Chance to stagger on hit | 80% | 70% | 70% | 60% | 60% |
| Stagger time | 0.25 s | 0.3 s | 0.25 s | 0.35 s | 0.35 s |
| View angle | 100° | 100° | 130° | 90° | 100° |
| Sight range, calm | 6 tiles | 6 tiles | 8 tiles | 5 tiles | 6 tiles |
| Sight range, hunting | 9 tiles | 9 tiles | 12 tiles | 7.5 tiles | 9 tiles |
| Crates block its sight | no | no | **yes** | no | no |
| After it loses sight of you | Goes to where it last saw you, then wanders | Same as the Husk | Stops and holds | Tracks you for 6 s, then goes home | Tracks you for 8 s, then goes home |
| Drops | Clip (5 bullets) | Shells (5 shells) | nothing | nothing | nothing |
| First appears in | Level 1 | Level 1 | Level 1 | Level 1 | Level 2 |

The time between attacks varies at random from 70% to 130% of the value in the table.

### Rules for all enemies

**Sight**
- A calm enemy sees only inside its view cone, up to its calm sight range.
- It also senses you within 1.5 tiles, except from behind. Its back arc is 120° wide (60° each side of straight back).
- A hunting enemy sees in all directions, up to 1.5 times its calm range.
- Walls and closed doors block sight. Crates block sight for Fiends only.
- A calm enemy turns its head from time to time, so its cone sweeps the room. Husks, Brutes and Shades turn every 2 to 5 seconds, by up to 108° each way, at about 90° per second. Fiends are restless: they turn every 0.7 to 1.6 seconds, by up to 180° each way, at about 180° per second.

**What wakes an enemy**
- It sees you.
- It hears a loud weapon or a barrel explosion within 13 tiles. Walls do not stop the sound.
- Another enemy within 10 tiles sees you. The one that sees you gives its alert cry, and that wakes the others. Walls do not stop the cry. Only an enemy that sees you cries out, so a woken enemy does not pass the alarm on.
- Each enemy cries only the first time it becomes alert. If it loses you and finds you again, it still alerts the enemies near it, but silently. You hear at most one cry every half second, so a group that wakes at once gives one cry.
- You hit it.

**Attacks**
- Each attack has a short wind-up. During the wind-up the enemy faces you and shows its attack pose.
- A melee strike hits only if you are still close at the end of the wind-up. Step back during the wind-up to dodge it.
- A ranged enemy fires only when it has a clear line of fire. Crates and walls block that line.
- An enemy with a melee attack (the Fiend) uses it when it touches you. Husks and Shotgun Husks have no melee attack, so they fire their gun at point-blank range.
- A hit can stagger an enemy for a moment. Its current wind-up is not interrupted.

**Movement**
- An enemy walks straight at its target when the way is clear. Otherwise it finds a path around walls.
- Enemies **never open doors**. A closed door stops them. They can walk through a door that is already open.
- Enemies never step on slime or lava. If you stand in a hazard, they wait at the edge.
- Enemies push each other apart and do not walk through you.

**Friendly fire**
- Husk bullets, Shotgun Husk pellets and Fiend fireballs can hit other enemies and barrels. A hit enemy does not turn on its attacker.

### Husk

A dead soldier with a sidearm. It is weak, but it shoots from range.

- **It uses the Marine's guns.** Its shot has the sidearm sound and the sidearm spread, plus some aim error. You know what fires at you from the sound.

- **Trait: it searches, then wanders.** When it loses sight of you, it walks to the place where it last saw you. When it gets there, or after 5 seconds, it gives up. Then it walks around at random, at half speed, with short stops. If it sees you again, it hunts you again.
- When it dies, it drops a clip with 5 bullets (10 on Recruit, 4 on Doomed).

### Shotgun Husk

A dead soldier with a pump shotgun. Its uniform is darker green, and you see the shotgun in its hands.

- It fires the Marine's pump shotgun: 7 pellets with the shotgun sound and spread. Up close, most pellets hit, so it hurts. From far away, most pellets miss.
- It has a longer wind-up and a longer time between shots than the Husk. Close in or take cover between its shots.
- It searches and wanders like the Husk when it loses sight of you.
- When it dies, it drops 5 shells (10 on Recruit, 4 on Doomed).

### Fiend

A spiked brown demon. It throws fireballs and claws when you are close.

- **Restless watcher.** While calm, it looks around often and fast, and it can turn to look behind itself. It is hard to sneak past a calm Fiend.
- **Trait: it holds its position.** When it loses sight of you, it stops at once and faces the place where it last saw you. It follows you again only when it sees you. A shot from out of its sight wakes it, but it still holds.
- **Crates hide you from Fiends.** If a crate comes between you and a Fiend, it loses sight of you and holds.
- Its fireball flies at 7.5 tiles per second. You can dodge it. A fireball explodes on walls, crates, barrels, other enemies or you.
- Before a fireball, a glow shows in its hands.

### Brute

A hunched red horned demon with tusks and claws. It is fast, tough and fights only in melee.

- **Trait: it tracks you.** When it loses sight of you, it still knows where you are for 6 seconds and follows you around corners. Then it gives up and walks back to its start position at 70% speed. There it guards again. If it hears a loud noise while it walks home or guards, it hunts you again.
- You are faster than a Brute. Move back while you shoot it.
- A closed door is the best way to escape from a Brute.

### Shade

A transparent Brute. It is a pale blue ghost of a Brute, and you can see through it.

- **Trait: it is almost invisible.** Its body shimmers at 25% to 50% opacity. Its name, health bar and sight cone (with `?sight`) show only when it is within 3 tiles of you, or for 1.5 seconds after you hit it. A hit makes it flash more visible.
- It fights like a Brute: same health and claws, a little slower.
- **Trait: it tracks you longer.** After it loses sight of you, it follows you for 8 seconds, then walks back to its start position.
- Its corpse stays half transparent.
- Listen for it. Its growl is the same as the Brute's.

## Sight layer

A debug layer that shows the view cones of enemies on screen. It is off, and players cannot turn it on. In dev mode only, add `?sight` to the URL to show it (see the development aids in the [README](../README.md#development-aids)). Walls cut the cones, and crates cut the cones of Fiends.

| Cone color | Meaning |
| --- | --- |
| Yellow | Calm, searching, wandering or going home |
| Orange | A Fiend that holds its position |
| Red | Hunting you |

## Doors

| Door | How to open | Enemies |
| --- | --- | --- |
| Normal (yellow and black stripes) | Walk into it, or press E | Cannot open it |
| Red, blue or yellow (colored stripes and a colored light) | Walk into it, or press E, with the keycard of the same color | Cannot open it |
| Secret wall | Press E while you face it | Cannot open it |
| Trap door | Nothing opens it. It opens by itself when you take the level's trap keycard | Cannot open it |

- A door opens in about 0.4 seconds. You can pass when it is 85% open.
- A wide door, or a wide secret wall, opens and closes as one piece.
- Normal and red doors close again 4 seconds after they open. They do not close while you or an enemy stand in them.
- A secret wall stays open.

### Key ambush

Each level has one trap door. It looks exactly like a plain wall, with no scratches. Behind it, a closed room holds a group of enemies. Until the door opens, the door and the whole room look like a solid block of wall, on screen and on the minimap. The trap door is as wide as that room, so nothing stays hidden inside when it opens.

- When you take the trap keycard, the trap door opens with the normal door sound, stays open, and the whole group comes out to hunt you.
- You cannot open a trap door any other way, and enemies cannot open it.
- The enemies in the closet count in the kill total.

| Level | Trap keycard | Recruit | Veteran | Doomed |
| --- | --- | --- | --- | --- |
| E1 | Red | 2 Husks, 2 Fiends | Same | Same |
| E2 | Blue | 2 Husks, 2 Fiends | + Shotgun Husk, Brute | + Shotgun Husk, Brute, Shade |
| E3 | Red | 2 Husks, 3 Fiends, Shade | + 2 Shotgun Husks, Brute | + 2 Shotgun Husks, 2 Brutes, 2 Shades |
- An open door does not block sight or shots. A closed door blocks both.
- E reaches doors and switches up to 1.5 tiles away, in the direction you aim.

## Unexplored rooms

Doors divide the level into rooms. A room stays black until you see into it:

- The room you stand in is always revealed.
- When a door between your room and another room opens, the other room is revealed.
- A revealed room stays revealed.

In an unrevealed room you see no floor, monsters, items, light, sight cones or effects. You still hear its sounds. Walls next to a revealed room stay visible, so you can see the shape of the level. The minimap shows only revealed cells.

## Hazards

| Floor | Damage | Notes |
| --- | --- | --- |
| Toxic slime (green) | 5 per second | Armor does not protect |
| Lava (orange) | 10 per second | Armor does not protect |

The first hit comes when you step on the hazard. The next hits come once per second while you stay on it.

## Barrels

- A barrel has 20 health. Bullets, pellets, the knife, fireballs and explosions can hurt it.
- When its health runs out, it explodes after 0.08 to 0.2 seconds. Nearby barrels can explode in a chain.
- The blast reaches 2.6 tiles. It does up to 110 damage at the center, less with distance.
- Walls, closed doors and crates protect from the blast.
- The blast hurts you and enemies, and it wakes enemies within 13 tiles.
- Barrels block movement.

## Secrets

A secret area counts as found when you step into it. A message shows, and the "Secrets" stat goes up. Secret walls look like normal walls. Look for a panel seam and scratch marks on the top of the wall.

## Music

Each level has its own looping track. All music is synthesized in the browser: a distorted power-chord guitar, a bass, a lead and drums. When you die, a slow two-bar loop in D minor (60 BPM) plays while the death screen shows: falling power chords (D, B flat, A, C sharp) and a falling lead line. N turns it off too.

| Level | Track | Tempo | Style |
| --- | --- | --- | --- |
| Training | Boot Camp | 100 BPM | A minor, light drill beat |
| E1 | Outpost Breach | 140 BPM | E minor chugging metal riff |
| E2 | Toxin Refinery | 118 BPM | D minor industrial stomp with tritone stabs |
| E3 | Ember Gate | 152 BPM | C# Phrygian gallop with double kick |

- The music starts when the level starts, pauses with the game and stops on the death and victory screens.
- N turns only the music on or off. The game stores the choice as `doomed.music` in localStorage. M mutes all sound, music included, and the game stores it as `doomed.sound`. Both choices stay after a reload.

## Screen and interface

- **Obstacles:** crates and braziers block their whole tile. A lamp is a thin post: you can walk close around it.
- **Lighting:** the level is dark. Your marine, lamps, braziers, slime, lava, fireballs, explosions, screens and some items give light. A muzzle flash lights the area for a moment.
- **Names and bars:** each creature shows its name and a health bar, like your own "Marine" label.
- **Floating numbers:** red numbers show damage, and green "+1" numbers show healing.
- **Map panel:** the minimap shows the area within 7 tiles of every place you visited. Colors: gray floor, light walls, red-brown stone, green slime, orange lava, yellow doors, red locked doors, green exit.
- **Status panel:** health and armor bars, weapon slots with ammo counts, bullets, shells and keycard.
- **Server Log:** the bottom panel shows the last 7 game messages with the level time, for example pickups, keycard warnings and secrets. Pickups are green, warnings red, secrets yellow. Important messages also show in the center of the screen.
- **Red screen edge:** shows when you take damage, and it pulses when your health is below 25.

## Victory tally

When you use the exit switch, the victory screen counts up each stat one by one: Kills, Items, Secrets (as percentages), your Time and the Par time. A gunshot sounds while a line counts. An explosion sounds when a line finishes. Click or press Enter to skip to the final numbers. Then pick a button with the mouse or with the arrow keys or W A S D and Enter, or press R.

## Level 1: Outpost Breach

> The Kharon research outpost went silent six hours ago. Its gate to the deep vaults is open, and something came through.

| Totals | |
| --- | --- |
| Enemies | 29: 11 Husks, 1 Shotgun Husk, 11 Fiends, 6 Brutes |
| Map items | 26 |
| Barrels | 8 |
| Secrets | 1 |
| Par time | 4:00 |

### Areas

| Area | Enemies | Items and objects |
| --- | --- | --- |
| Start bay (west) | none | 2 stimpacks, 1 clip |
| Corridor east of the start | 1 Husk | |
| Courtyard (slime river, grate bridge) | 4 Husks, 2 Fiends | Combat vest on a slime island (north-east), medikit, 2 clips, 4 barrels (3 in the north-west corner) |
| Lab (east of the courtyard) | 2 Husks, 3 Fiends, 1 Brute | **Red keycard** (north-east, on a grate platform), medikit, box of shells, clip, 2 barrels |
| Storage room and its corridor (south of the courtyard) | 3 Husks, 2 Fiends, 1 Brute | **Pump shotgun** and 2 boxes of shells (south-west corner), medikit, stimpack, clip, 2 barrels, crates for cover |
| Secret room (west of the storage room) | none | **Rotary gun**, **vital sphere**, 2 clips |
| Hell vault (behind the red door, south of the lab) | 1 Husk, 1 Shotgun Husk, 3 Fiends, 3 Brutes | Medikit, 2 stimpacks, box of shells, clip, lava pools |
| Exit chamber (south-west corner of the hell vault) | 1 Fiend, 1 Brute | **Exit switch** on the north wall |

### Route

1. Leave the start bay through the east door.
2. Cross the courtyard. Use the grate bridge over the slime.
3. Go east into the lab. Take the red keycard. The east wall of the lab opens behind it: 2 Husks and 2 Fiends.
4. Optional: go back to the courtyard and take the south door to the storage room for the shotgun. On the west wall of the storage room, near the middle, find the secret wall with the scratched panels. Press E there.
5. In the lab, open the red door in the south wall. Go down the corridor into the hell vault.
6. Go around the lava pools to the exit chamber door in the south-west. Use the red-lit **EXIT** switch.

## Level 2: Toxin Refinery

> The vault gate led to the refinery that feeds the outpost. Slime channels, settling basins and something that moves like smoke.

| Totals | |
| --- | --- |
| Enemies | 29: 8 Husks, 3 Shotgun Husks, 10 Fiends, 5 Brutes, 3 Shades |
| Map items | 22 |
| Barrels | 5 |
| Secrets | 1 |
| Par time | 5:00 |

### Areas

| Area | Enemies | Items and objects |
| --- | --- | --- |
| Start room (south-west) | none | 2 clips, stimpack |
| Pump hall (south, slime channel with two grate bridges) | 4 Husks, 2 Fiends, 1 Brute | Box of shells, medikit, 2 barrels, crates |
| Refinery tanks (center, big slime pool) | 2 Husks, 3 Fiends, 1 Shade | **Blue keycard** on the island in the pool, 2 boxes of shells, medikit, barrel |
| Control room (west) | 2 Husks, 1 Fiend, 1 Shade | **Pump shotgun**, combat vest, clip, crates |
| Secret storage (north of the control room) | none | **Vital sphere**, combat vest, 2 boxes of shells |
| Settling basins (east, behind the blue door) | 3 Shotgun Husks, 2 Fiends, 3 Brutes, 1 Shade | 2 medikits, box of shells, clip, 2 barrels, slime basins |
| Exit room (north-east) | 2 Fiends, 1 Brute | 2 stimpacks, **exit switch** on the north wall |

### Route

1. Leave the start room through the east door into the pump hall. Cross the slime channel on a grate bridge.
2. Go north through one of the two doors into the refinery tanks.
3. Walk the grate path from the south edge of the pool to the island. Take the blue keycard. The west face of the pump housing in the slime, right next to the island, opens, and its group pours onto the island.
4. Optional: the west door leads to the control room with a shotgun. In its north wall, three scratched panels hide the secret storage. Press E there.
5. Open the blue door in the east wall of the refinery tanks. Cross the settling basins.
6. Take the door in the north wall of the basins to the exit room. Use the exit switch.

## Level 3: Ember Gate

> Below the refinery the base is gone. Only rock, fire and the gate the demons came through.

| Totals | |
| --- | --- |
| Enemies | 36: 7 Husks, 4 Shotgun Husks, 11 Fiends, 8 Brutes, 6 Shades |
| Map items | 20 |
| Barrels | 4 |
| Secrets | 1 |
| Par time | 6:00 |

### Areas

| Area | Enemies | Items and objects |
| --- | --- | --- |
| Start cave (south) | 1 Husk | Clip, box of shells |
| Hub cavern (center, lava pools) | 3 Husks, 1 Shotgun Husk, 3 Fiends, 2 Brutes | Medikit, box of shells, 2 barrels |
| East wing (lava channels with one gap each) | 2 Shotgun Husks, 2 Fiends, 3 Shades | **Yellow keycard** (north-east corner), medikit, stimpack, box of shells, clip, crates |
| Secret chamber (south of the east wing) | none | **Vital sphere**, combat vest, box of shells |
| West wing (behind the yellow door) | 2 Husks, 2 Fiends, 3 Brutes, 1 Shade | **Red keycard** inside a lava moat (north-west), medikit, stimpack, box of shells, clip, 2 barrels |
| Sanctum (north, behind the red door) | 1 Husk, 1 Shotgun Husk, 4 Fiends, 3 Brutes, 2 Shades | 2 medikits, box of shells, **exit switch** on the north wall |

### Route

1. Go north from the start cave into the hub cavern.
2. Take the east door into the east wing. Cross the lava channels at their gaps. Take the yellow keycard in the north-east corner.
3. Optional: in the south wall of the east wing, three scratched panels hide the secret chamber.
4. Go back to the hub and open the yellow door in its west wall.
5. In the west wing, cross the lava moat at its gap in the north-west. Take the red keycard. A trap door in the north wall of the west wing, just east of the key, opens on a large group.
6. Go back to the hub and open the red door in its north wall. Fight through the sanctum and use the exit switch between the braziers.
