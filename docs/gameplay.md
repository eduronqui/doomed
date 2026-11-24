# DOOMED: Gameplay Reference

This document describes every game rule in DOOMED. All numbers come from the code in `src/sim/`. A "tile" is one map cell (32 px on screen).

## Goal

The episode has twelve levels. Each level from 4 to 11 brings one new weapon or one new enemy, and level 12 ends the episode with a boss. Each level has one exit switch. It always sits on the top wall of a room, and at least one monster always guards it, close to it in the same room. Find it and use it. Enemies, locked doors and hazards are in your way. Every level starts in a safe room: a door stands between the start and the first enemy. When you use the switch, a tally shows your kills, items, secrets and time. Then you continue to the next level.

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
- The "Hide" button in the corner of the box removes the current hint and keeps the training going. A hint you hid stays hidden for the rest of that run. The next hint (another room, or the box after you clear the room) shows again. A restart of the training shows all hints again. Enter skips the training only while the box is visible.
- When you reach the training exit or skip the training, the game stores `doomed.trainingDone = 1` in the browser's localStorage. After that, new games start at E1. To see the training again, remove that key (browser developer tools, Application, Local Storage). If the browser blocks localStorage, the training shows on each new game.
- If you die in the training, it restarts.

## Episode and progression

The twelve levels form four chapters of three levels. From chapter 2 (E4) on, enemies start facing the doors of their rooms, and every level up to E11 has a lever and gate, dead ends and side rooms. Each chapter brings more and tougher enemies. E12 is a short walk to the boss arena.

| Level | Title | Keycards | Par |
| --- | --- | --- | --- |
| 1 | E1: Outpost Breach | red | 4:00 |
| 2 | E2: Toxin Refinery | blue | 5:00 |
| 3 | E3: Ember Gate | yellow, then red | 6:00 |
| 4 | E4: Freight Lift | blue, then yellow | 5:00 |
| 5 | E5: Coolant Works | blue, then red | 5:30 |
| 6 | E6: Furnace Deck | red, then blue | 5:30 |
| 7 | E7: Hunting Grounds | blue, then yellow | 6:00 |
| 8 | E8: Arc Foundry | red, then yellow | 6:00 |
| 9 | E9: Iron Bastion | blue, then yellow | 6:30 |
| 10 | E10: Drowned Pit | red, then blue | 6:30 |
| 11 | E11: The Gauntlet | red, then yellow, then blue | 7:00 |
| 12 | E12: The Gate | none | 4:00 |

- When you continue to the next level, your health, armor, ammo, weapons and selected weapon carry over. Keycards do not carry over.
- When you die, the level restarts with the loadout you had when you entered it. Level 1 always starts with 100 health, the knife, the sidearm and the start bullets of your difficulty (60, 40 or 20).
- After level 12, the victory screen offers to play the episode again from level 1, with any difficulty.

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
| Mouse | Aim. The last input wins: when you start walking or change direction with the keys, the Marine looks (and shoots with Space) where he walks. When you move the mouse or hold its button, he looks at the cursor, also while he keeps walking. |
| Left mouse button or Space (hold) | Fire (a mouse click must start inside the play area) |
| E or Space | Use (doors, secret walls, exit switch). Space also fires, so one press both shoots and uses. |
| 1 to 8 | Select weapon slot |
| Mouse wheel | Next or previous weapon |
| Q | Next weapon |
| N | Turn the music on or off (remembered in localStorage) |
| M | Mute or unmute all sound (remembered in localStorage) |
| Esc or P | Pause or resume |
| W A S D or arrow keys, then Enter or Space | On the title, death and victory screens: select a button and press it |
| Enter or Space | On the pause screen: resume. On the victory screen: skip the count |
| Enter | During training: skip the training. Space does not skip it, because Space fires and uses during play. |
| R | On the death screen: restart the level. On the victory screen: continue to the next level (or play again after level 3) |

On a screen with buttons, the gold border marks your current difficulty and the white outline marks the selected button. The selection starts on the current difficulty, and the mouse moves it too. A held key does not repeat on these screens.

### Touch controls (phones and tablets)

The game turns on touch mode when the device has a touch screen as its main input. It plays in landscape. In portrait, a "Rotate your phone" screen covers the game and the game stops.

| Touch | Action |
| --- | --- |
| Drag on the left half of the screen | Move. A stick appears under your thumb. The further you drag, the faster the Marine walks. The Marine looks where he walks. |
| Drag on the right half of the screen | Aim. A stick appears under your thumb. The Marine keeps this direction after you let go, until you walk or aim again. |
| Push the right stick to its edge (or beyond) | Fire, while you hold it there. The ring turns red. Like Space, the first push also uses what is in front of you. This is how you open a secret wall. |
| USE (bottom right) | Shows only when the exit switch or a lever that is still off is within reach, labelled EXIT (red, like the exit sign) or PULL (cyan, like the lever). Tap it to use it, without firing. Doors open when you walk into them, and secret walls stay hidden, so they get no button. |
| Pause (right end of the bottom bar) | Pause. The button then reads Resume. Tap it, or the pause screen, to resume. The game also pauses when you switch to another app. |
| Weapon boxes in the side panel | Tap one to select that weapon |
| Server Log (bottom bar) | Tap the bar to open or close the log. Closed, only the title shows. The latest message still appears in the centre of the screen. |

The side panel is fixed on the right: map, health, armor, weapons and keycards. The log is a bar across the bottom. Opened, it covers the lower part of the game and does not pause it. The game remembers whether the log was open (localStorage). The first tap goes fullscreen and locks landscape on Android Chrome. On an iPhone, Safari cannot lock the orientation, so the rotate screen stays as the fallback. A hint explains "Add to Home Screen" (or shows an Install button on Android). The installed game opens fullscreen in landscape from the web manifest.

The first difficulty pick on the title screen (click, Enter or Space) also starts the sound. Browsers block sound until you click or press a key.

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

- On your 1st and 2nd death on a level, the screen shows one "Try again" button on the same difficulty. Click it, or press Enter, Space or R.
- From your 3rd death on the same level, the screen shows the difficulty picker instead. Select a difficulty with the mouse, or with the arrow keys or W A S D and Enter or Space, or press R to keep the same one.
- The count goes back to 0 when you clear a level or reload the page.

## Weapons

| Slot | Weapon | Ammo | Damage per hit | Pellets | Fire delay | Range | Noise |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Combat Knife | none | 6 to 20 | 1 | 0.40 s | 1.25 tiles | silent |
| 2 | Sidearm | 1 bullet | 5 to 15 | 1 | 0.38 s | 22 tiles | loud |
| 3 | Pump Shotgun | 1 shell | 5 to 15 | 7 | 0.95 s | 18 tiles | loud |
| 4 | Rotary Gun | 1 bullet | 5 to 15 | 1 | 0.11 s | 22 tiles | loud |
| 5 | Grenade Launcher | 1 grenade | 10 to 20 on a direct hit, plus a blast | 1 | 0.80 s | 14 tiles of flight | loud |
| 6 | Flamer | 1 fuel | 2 to 4, plus burning | cone | 0.09 s | 3.4 tiles | loud |
| 7 | Arc Rifle | 1 cell | 16 to 24 to every enemy in the line | beam | 0.30 s | 24 tiles | loud |
| 8 | Rift Cannon | 20 cells | 40 to 60 on a direct hit, plus a big blast | 1 | 1.50 s | 30 tiles of flight | loud |

- Aim at the head or the body of an enemy. The line of aim goes through the cursor at gun height, so shots at the legs miss.
- Guns hit instantly along the line of aim (hitscan). Each pellet spreads a little. The rotary gun spreads more than the sidearm. The shotgun spreads the most.
- The knife hits the nearest enemy or barrel in front of you, inside a wide arc.
- **Grenade launcher.** The grenade flies over crates but explodes on walls and doors, on the first enemy or barrel it touches, or at the end of its flight. The blast does up to 95 damage within 2.4 tiles, less at the edge. It hurts you too if you stand inside it.
- **Flamer.** A short cone of fire (40° wide) in front of you. It does not go through walls. Every enemy in the cone catches fire and burns for 3 seconds, 8 damage per second. Each new hit restarts the 3 seconds. The flames light the area around them.
- **Arc rifle.** An energy beam that hits every enemy and barrel along the line, up to the first wall.
- **Rift cannon.** A slow orb that explodes on the first wall, enemy or barrel. The blast does up to 300 damage within 4.5 tiles. It does not hurt you.
- **Backstab.** A knife hit kills a calm enemy at once if you stand in its back arc (120° wide) and it does not see you. Calm means idle, wandering, holding or walking home, not hunting you. It works on every enemy kind, also the Brute and the Shade. The kill makes only a soft thud instead of the death scream, and no other enemy wakes up. The message "Silent kill." shows.
- Any other knife kill is loud: the enemy screams, and the scream wakes all enemies within 13 tiles, like a gunshot.
- **Loud** weapons wake all enemies within 13 tiles, even through walls. The knife swing is silent, but a knife kill that is not a backstab is loud.
- When a gun is empty, you switch to your best weapon that has ammo. The order is arc rifle, shotgun, rotary gun, flamer, sidearm, knife. You never switch to the grenade launcher or the rift cannon by yourself.
- When you pick up a new weapon, you switch to it at once.
- The marine sprite shows the selected weapon from all four directions.

### Ammo limits

| Ammo | Max |
| --- | --- |
| Bullets | 200 |
| Shells | 50 |
| Grenades | 30 |
| Fuel | 200 |
| Cells | 300 |

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
| Box of grenades | +4 grenades |
| Fuel canister | +50 fuel |
| Energy cell pack | +40 cells |
| Grenade launcher | Gives the grenade launcher and 6 grenades |
| Flamer | Gives the flamer and 60 fuel |
| Arc rifle | Gives the arc rifle and 40 cells |
| Rift cannon | Gives the rift cannon and 160 cells (eight shots) |
| Red, blue or yellow keycard | Opens doors of the same color in this level |

The "Items" stat counts the items placed in the map. Items that enemies drop do not count: ammo from Husks and Shotgun Husks, and stimpacks from Brutes and Shades.

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
| Drops | Clip (5 bullets) | Shells (5 shells) | nothing | Stimpack | Stimpack |
| First appears in | Level 1 | Level 1 | Level 1 | Level 1 | Level 2 |

### Later enemies

| | Gunner | Stalker | Warden | Hollow | Gatekeeper (boss) |
| --- | --- | --- | --- | --- | --- |
| Health | 70 | 80 | 220 | 90 | 2500 |
| Speed (tiles/s) | 1.9 | 4.2 | 1.7 | 2.2 (floats) | 2 (floats) |
| Attack | Rotary gun bursts of 6 shots | Claw, and a leap from up to 3.5 tiles | Claw, or a fireball | Slow homing wisp | Volleys of homing energy bolts |
| Damage | 3 to 8 per shot | 8 to 22 | Claw 10 to 30, fireball 8 to 16 | 8 to 14 | 10 to 18 per bolt |
| Attack range | 16 tiles | Contact | Fireball 10 tiles | 14 tiles | 22 tiles |
| Special | Pins you down with long bursts | Circles you, then leaps in | Front shield blocks 80% of the damage | Ignores ledges, slime and lava | Teleports, three phases, cannot be backstabbed |
| Drops | Clip (5 bullets) | nothing | Energy cell pack | nothing | nothing |
| First appears in | Level 5 | Level 7 | Level 9 | Level 10 | Level 12 |

The time between attacks varies at random from 70% to 130% of the value in the table.

### Rules for all enemies

**Sight**
- A calm enemy sees only inside its view cone, up to its calm sight range.
- It also senses you within 1.5 tiles, except from behind. Its back arc is 120° wide (60° each side of straight back).
- A hunting enemy sees in all directions, up to 1.5 times its calm range.
- Walls and closed doors block sight. Crates block sight for Fiends only.
- From E4 on, a calm enemy starts facing the nearest door of its room, and its head turns sweep around that door.
- A calm enemy turns its head from time to time, so its cone sweeps the room. Husks, Brutes and Shades turn every 2 to 5 seconds, by up to 108° each way, at about 90° per second. Fiends are restless: they turn every 0.7 to 1.6 seconds, by up to 180° each way, at about 180° per second.

**What wakes an enemy**
- It sees you.
- It hears your steps. Your boots clang on metal floor and on grates, and a calm enemy within 4 tiles hears every step (3.4 tiles on Recruit, 5 on Doomed: the range follows the enemy sight factor). Concrete and rock are quiet. Walls and closed doors stop the sound, so an enemy in the next room or around a corner does not hear you. You hear your own steps as a soft clank, so you always know when you are loud.
- You hit it and it survives.
- It hears a loud weapon or a barrel explosion within 13 tiles. Walls do not stop this sound.
- It hears another enemy's alert cry within 10 tiles.

**The alarm**
- An enemy that finds you by itself (it sees you, hears your steps, or you hit it) gives its alert cry, and the cry wakes every calm enemy within 10 tiles. Walls do not stop the cry.
- An enemy woken second-hand (by a cry, by gunfire, by an explosion, or by a trap door) joins the hunt but does not pass the alarm on. So one alarm wakes one area, not the whole level.
- Each enemy cries only the first time it becomes alert. If it loses you and finds you again, it still alerts the enemies near it, but silently. You hear at most one cry every half second, so a group that wakes at once gives one cry.
- To reach an enemy's back for a backstab, plan a path over concrete or rock. A knife hit that does not kill counts as a hit, so it raises the alarm.

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
- When you walk into an enemy, it is pushed to the side. A mob cannot hold you in place.

**Friendly fire**
- Husk bullets, Shotgun Husk pellets and Fiend fireballs can hit other enemies and barrels. A hit enemy does not turn on its attacker.

### Husk

A dead soldier with a sidearm. It is weak, but it shoots from range.

- **It uses the Marine's guns.** Its shot has the sidearm sound and the sidearm spread, plus some aim error. You know what fires at you from the sound.

- **Trait: it searches, then wanders.** When it loses sight of you, it walks to the place where it last saw you. When it gets there, or after 5 seconds, it gives up. Then it walks around at random, at half speed, with short stops. If it sees you again, it hunts you again.
- When it dies, it drops a clip with 5 bullets (10 on Recruit, 4 on Doomed).

### Shotgun Husk

A dead soldier with a pump shotgun. Its uniform is darker green, and you see the shotgun in its hands. Its label reads "Husk", the same as the plain Husk. Only its look and its gun tell them apart. These docs call it the Shotgun Husk.

- It fires the Marine's pump shotgun: 7 pellets with the shotgun sound and spread. Up close, most pellets hit, so it hurts. From far away, most pellets miss.
- It has a longer wind-up and a longer time between shots than the Husk. Close in or take cover between its shots.
- It searches and wanders like the Husk when it loses sight of you.
- When it dies, it drops 5 shells (10 on Recruit, 4 on Doomed).

### Fiend

A spiked brown demon. It throws fireballs and claws when you are close.

- **Restless watcher.** While calm, it looks around often and fast, and it can turn to look behind itself. It is hard to sneak past a calm Fiend.
- **Trait: it holds its position.** When it loses sight of you, it stops at once and faces the place where it last saw you. While it holds, it keeps turning its head like a calm Fiend, so it can find you again from any side. It follows you again only when it sees you. A shot from out of its sight wakes it, but it still holds.
- **Crates hide you from Fiends.** If a crate comes between you and a Fiend, it loses sight of you and holds.
- Its fireball flies at 7.5 tiles per second. You can dodge it. A fireball explodes on walls, crates, barrels, other enemies or you.
- Before a fireball, a glow shows in its hands.

### Brute

A hunched red horned demon with tusks and claws. It is fast, tough and fights only in melee.

- **Trait: it tracks you.** When it loses sight of you, it still knows where you are for 6 seconds and follows you around corners. Then it gives up and walks back to its start position at 70% speed. There it guards again. If it hears a loud noise while it walks home or guards, it hunts you again.
- You are faster than a Brute. Move back while you shoot it.
- A closed door is the best way to escape from a Brute.
- When it dies, it drops a stimpack.

### Shade

A transparent Brute. It is a pale blue ghost of a Brute, and you can see through it.

- **Trait: it is almost invisible.** Its body shimmers at 25% to 50% opacity. Its name, health bar and sight cone (with `?sight`) show only when it is within 3 tiles of you, or for 1.5 seconds after you hit it. A hit makes it flash more visible.
- It fights like a Brute: same health and claws, a little slower.
- **Trait: it tracks you longer.** After it loses sight of you, it follows you for 8 seconds, then walks back to its start position.
- Its corpse stays half transparent.
- Listen for it. Its growl is the same as the Brute's.
- When it dies, it drops a stimpack, like a Brute.

### Gunner

A heavy Husk in dark armor with a red visor and a rotary gun.

- Each attack is a burst of 6 shots, 0.12 seconds apart. The burst stops when it loses sight of you.
- Its burst can pin you behind cover. A grenade lobbed over the cover is the classic answer.

### Stalker

A lean, dark violet demon with claws and spikes. It is the fastest enemy.

- **Trait: it flanks.** At mid range it does not run straight at you. It circles to your side and switches sides every 1 to 2.5 seconds.
- **Trait: it leaps.** From up to 3.5 tiles away, with a clear path, it leaps at you, then attacks with its claws. It can leap once every 1.6 seconds.
- Stay near walls to cut down its angles. The flamer's wide cone catches it while it circles.

### Warden

A steel-gray Brute in armor with a large shield.

- **Trait: front shield.** Damage that comes from the front (a 120° arc) is cut by 80%. Burning ignores the shield.
- The shield turns slowly, at about 90° per second. Circle the Warden to hit it from the side or the back, or backstab it while it is calm.
- The arc rifle hits it from any angle you can reach, and it hits everything behind it in the same line.

### Hollow

A hooded, floating shape with glowing eyes.

- **Trait: it floats.** It ignores ledges, slime and lava, and it flies straight over pits and hazards to reach you.
- Its wisps are slow, but they turn toward you while they fly. Break line of sight or shoot the Hollow first.

### Gatekeeper (boss)

A dark sorcerer in a long red-lined cape, with a crown of horns, glowing violet eyes and a staff. He floats above the floor and guards the gate in level 12. His death breaks the rift seal in front of the exit.

- He cannot be backstabbed and never staggers. Once he wakes, he always knows where you are.
- He has no melee attack. He stays at range and hurls volleys of energy bolts that turn slowly toward you.
- **He teleports.** He vanishes in a rift flash and reappears 5 to 10 tiles from you, in the same room: every 8 seconds in phase 1, every 6 in phase 2, every 4 in phase 3, and also after he takes 300 damage. Rushing him only makes him teleport.
- **Phase 1 (full health to two thirds):** volleys of 3 bolts.
- **Phase 2 (below two thirds):** volleys of 5 bolts. Every 12 seconds he summons two Fiends at his sides, up to 4 at a time.
- **Phase 3 (below one third):** volleys of 7 bolts. He summons Stalkers instead of Fiends, and every 7 seconds he fires a ring of 12 bolts in all directions.
- Summoned enemies do not count in the kill total.

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
| Rift seal (violet stripes and a violet light) | Nothing opens it. It breaks when the level's boss dies, and stays open | Cannot open it |
| Gate (cyan stripes and a cyan light) | Find its lever (a cyan wall panel) and press E while you face it. When you walk into a gate, the Server Log tells you in which direction its lever is | Cannot open it |

- A door opens in about 0.4 seconds. You can pass when it is 85% open.
- A wide door, or a wide secret wall, opens and closes as one piece.
- Normal and red doors close again 4 seconds after they open. They do not close while you or an enemy stand in them.
- A secret wall stays open. A gate stays open after you pull its lever.
- From E2 on, most levels have a gate. Its lever is in the room in front of it, or a few rooms away.
- Some rooms join through an open passage instead of a door.
- If you walk into the edge of a doorway, you slide into the opening. Walls and doors stop you at your feet, so you can stand close to a north wall.

### Key ambush

Each level has one trap door. It looks exactly like a plain wall, with no scratches. Behind it, a closed room holds a group of enemies. Until the door opens, the door looks like wall. If rooms surround the closet, the whole closet looks like a solid block of wall, on screen and on the minimap. If the closet is outside the rooms, it stays unknown area, as dark as the void, until the door opens. The trap door is as wide as that room, so nothing stays hidden inside when it opens.

- When you take the trap keycard, the trap door opens with the normal door sound, stays open, and the whole group comes out to hunt you.
- You cannot open a trap door any other way, and enemies cannot open it.
- The enemies in the closet count in the kill total.
- Two medikits lie on the back row of every trap closet, side by side around its middle. They count in the item total.

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

## Raised floor

Some areas stand one step above the floor, as tall as a crate: porches, platforms and pillars.

- You climb up or down only on stairs. A ledge stops you, up and down. Enemies also use the stairs.
- Shots, fireballs and sight cross between heights. An enemy on a porch shoots down at you, and you can shoot back from below.
- Melee does not reach across a ledge. A Fiend on a porch cannot claw you from above, and your knife cannot reach it from below.
- Standing right behind a raised area hides your legs, like a crate.
- A raised area does not always have stairs. An enemy can stand on a pillar that you cannot climb.

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

- **Obstacles:** crates block their whole tile. Lamps and braziers are tall, thin objects: you can walk close around them, but not through them.
- **Lighting:** the level is dark. Your marine, lamps, braziers, slime, lava, fireballs, explosions, screens and some items give light. A muzzle flash lights the area for a moment.
- **Names and bars:** each creature shows its name and a health bar, like your own "Marine" label.
- **Floating numbers:** red numbers show damage, and green "+1" numbers show healing.
- **Map panel:** the minimap shows the area within 7 tiles of every place you visited. Colors: gray floor, light walls, red-brown stone, green slime, orange lava, yellow doors, red locked doors, green exit.
- **Status panel:** health and armor bars, 8 weapon slots in two rows, each with the number of shots it has left, the five ammo types (bullets, shells, grenades, fuel, cells) and the keycards.
- **Server Log:** the bottom panel shows the last 7 game messages with the level time, for example pickups, keycard warnings and secrets. Pickups are green, warnings red, secrets yellow. Important messages also show in the center of the screen.
- **Red screen edge:** shows when you take damage, and it pulses when your health is below 25.

## Victory tally

When you use the exit switch, the victory screen counts up each stat one by one: Kills, Items, Secrets (as percentages) and your Time. A gunshot sounds while a line counts. An explosion sounds when a line finishes. Then the Par time appears at once, with an explosion. Click or press Enter or Space to skip to the final numbers. Then pick a button with the mouse or with the arrow keys or W A S D and Enter or Space, or press R.

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
| Courtyard (slime river, grate bridge) | 4 Husks, 2 Fiends on a raised porch (south-east) | Combat vest on a slime island (north-east), medikit on the porch, 2 clips, 4 barrels (3 in the north-west corner). The porch has stairs on its west side. |
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
| Start room (south-west) | none | 2 clips, stimpack, a **lever** on the north wall |
| Pump hall (south, slime channel with two grate bridges) | 4 Husks, 2 Fiends, 1 Brute | Box of shells, medikit, 2 barrels, crates |
| Refinery tanks (center, big slime pool) | 2 Husks, 3 Fiends, 1 Shade | **Blue keycard** on the island in the pool, 2 boxes of shells, medikit, barrel |
| Control room (west) | 2 Husks, 1 Fiend, 1 Shade | **Pump shotgun**, combat vest, clip, crates |
| Secret storage (north of the control room) | none | **Vital sphere**, combat vest, 2 boxes of shells |
| Settling basins (east, behind the blue door) | 3 Shotgun Husks, 2 Fiends, 3 Brutes, 1 Shade | 2 medikits, box of shells, clip, 2 barrels, slime basins |
| Exit room (north-east) | 2 Fiends, 1 Brute | 2 stimpacks, **exit switch** on the north wall |

### Route

1. The east door of the start room is a gate. Pull the lever on the north wall to open it. Go east into the pump hall and cross the slime channel on a grate bridge.
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
| Start cave (south) | none | Clip, box of shells |
| Hub cavern (center, lava pools) | 4 Husks (one right inside the door from the start), 1 Shotgun Husk, 3 Fiends, 2 Brutes | Medikit, box of shells, 2 barrels |
| East wing (lava channels with one gap each) | 2 Shotgun Husks, 2 Fiends, 3 Shades | **Yellow keycard** (north-east corner), medikit, stimpack, box of shells, clip, crates, a **lever** on the north wall |
| Secret chamber (south of the east wing) | none | **Vital sphere**, combat vest, box of shells |
| West wing (behind the yellow door) | 2 Husks, 2 Fiends, 3 Brutes, 1 Shade | **Red keycard** inside a lava moat (north-west), medikit, stimpack, box of shells, clip, 2 barrels |
| Sanctum (north, behind the red door) | 1 Husk, 1 Shotgun Husk, 4 Fiends, 2 Brutes, 2 Shades | 2 medikits, box of shells, braziers |
| End room (off the north-east corner of the sanctum) | 1 Brute | **Exit switch** on the north wall, 2 braziers |

### Route

1. Go north from the start cave into the hub cavern.
2. Take the east door into the east wing. Cross the lava channels at their gaps. Take the yellow keycard in the north-east corner.
3. Optional: in the south wall of the east wing, three scratched panels hide the secret chamber.
4. Go back to the hub and open the yellow door in its west wall.
5. In the west wing, cross the lava moat at its gap in the north-west. Take the red keycard. A trap door in the north wall of the west wing, just east of the key, opens on a large group.
6. Go back to the hub and open the red door in its north wall. Cross the sanctum to its north-east corner. The door in the east wall is a gate: if you did not pull the lever in the east wing yet, go back for it. Beat the Brute in the small end room and use the exit switch.

## Level 4: Freight Lift

> Freight lifts haul ammunition down to the deep levels, and the dead now guard them.

| Totals | |
| --- | --- |
| Chapter | 2 |
| Rooms | 10 and a secret |
| Enemies | 31: 14 Husks, 6 Shotgun Husks, 7 Fiends, 2 Brutes, 2 Shades |
| Map items | 21 |
| Barrels | 5 |
| Secrets | 1 |
| Par time | 5:00 |

### Route

1. Start in the **lift car** (south-west). The door opens on the **loading dock**: crates for cover, Husks facing the lift.
2. The **dock office** east of the dock holds the **blue keycard**. Two Husks wait right beside its door.
3. The service corridor runs north. Off it, the **armory** (a dead end) has the **grenade launcher**. A scratched wall in its north wall hides a stash with a vital sphere.
4. The **cargo hall** has two close groups, good first grenade targets, and two Shotgun Husks on a raised porch.
5. The **blue door** in the east wall of the hall leads to **lift control**. Its **lever** is on the north wall, right in front of the **gate**.
6. The gate opens on **storage**: the **yellow keycard**, and the trap closet in the north-east corner.
7. The **yellow door** in the south wall of storage opens on the **freight lift**: the exit, guarded by a Brute.

Enemies start facing the doors of their rooms.

## Level 5: Coolant Works

> Deeper down, the coolant plant still pumps, and something heavier walks the catwalks.

| Totals | |
| --- | --- |
| Chapter | 2 |
| Rooms | 7 and a secret |
| Enemies | 30: 12 Husks, 5 Shotgun Husks, 5 Fiends, 1 Brute, 1 Shade, 6 Gunners |
| Map items | 18 |
| Barrels | 1 |
| Secrets | 1 |
| Par time | 5:30 |

### Route

1. Start in the **intake** (west). A scratched panel in its north wall hides a stash.
2. The **pump hall** is split by a slime channel with one grate bridge. A **Gunner** fires from a raised porch in its north-east corner.
3. A passage leads north to the **valve room**. Its **lever** opens the **gate** in the east wall of the pump hall.
4. The gate opens on the **coolant tanks**: two slime tanks, the **blue keycard**, and the trap closet in the south-west corner.
5. The **blue door** leads east onto the **catwalks** over a slime pit, with Gunners at both ends. The **red keycard** is in the room north of the catwalks.
6. Go back to the tanks. The **red door** in their north wall opens on **pump control**: the exit.

Enemies start facing the doors of their rooms.

## Level 6: Furnace Deck

> The furnaces that forge the gate still burn, and packs of the dead crowd the deck.

| Totals | |
| --- | --- |
| Chapter | 2 |
| Rooms | 8 and a secret |
| Enemies | 32: 13 Husks, 3 Shotgun Husks, 8 Fiends, 3 Brutes, 2 Shades, 3 Gunners |
| Map items | 21 |
| Barrels | 1 |
| Secrets | 1 |
| Par time | 5:30 |

### Route

1. Start in the **crew quarters** (south). A scratched panel in the east wall hides a stash with a vital sphere.
2. The **locker room** west of the start (a dead end) holds the **flamer** and fuel. Two Husks wait beside its door.
3. The **furnace hall** has two lava furnaces, a raised dais with a Gunner, and packs of Husks and Fiends that stand close together: flamer work.
4. North of the hall, the **burner booth** has the **lever**. The **gate** in its east wall opens on the **red furnace**: the **red keycard**, and the trap closet in the north-east corner.
5. The **red door** in the east wall of the hall opens on the **slag line**, split by a lava channel with one bridge. The **blue keycard** is in the room north of it.
6. The **blue door** in the west wall of the hall opens on the **control room**: the exit.

Enemies start facing the doors of their rooms.

## Level 7: Hunting Grounds

> The caverns below the furnaces are dark and wide, and something fast hunts here.

| Totals | |
| --- | --- |
| Chapter | 3 |
| Rooms | 8 and a secret |
| Enemies | 35: 8 Husks, 5 Shotgun Husks, 6 Fiends, 2 Brutes, 2 Shades, 12 Stalkers |
| Map items | 17 |
| Barrels | 0 |
| Secrets | 1 |
| Par time | 6:00 |

### Route

1. Start in a small cave (north-west). A scratched wall at the tunnel hides a niche.
2. The tunnel opens on the **great cavern**: rock pillars, a raised ledge with Husks in the north-east, and five **Stalkers** that circle and leap.
3. The **blue keycard** is in an alcove off the north-east corner of the cavern.
4. The **shrine** west of the cavern has the **lever**. It opens the **gate** in the south wall of the cavern, two rooms away.
5. The gate opens on the **den**: the **yellow keycard**, and the trap closet in the south-east corner.
6. The **blue door** in the east wall of the cavern opens on the **bone pit**. Its **yellow door** in the south wall opens on the **sanctum**: the exit.

Enemies start facing the doors of their rooms.

## Level 8: Arc Foundry

> The foundry that built the gate machines runs on stolen power: long galleries and long lines of enemies.

| Totals | |
| --- | --- |
| Chapter | 3 |
| Rooms | 9 and a secret |
| Enemies | 37: 17 Husks, 3 Shotgun Husks, 4 Fiends, 2 Brutes, 2 Shades, 5 Gunners, 4 Stalkers |
| Map items | 21 |
| Barrels | 0 |
| Secrets | 1 |
| Par time | 6:00 |

### Route

1. Start in the **loading bay** (south-west). The **assembly line** runs east: a long hall with Husks in a row, one behind the other.
2. The **arc lab** north of the line (a dead end) holds the **arc rifle**. One shot goes through the whole row on the line.
3. The **smelter hall** north of the line has a raised gallery with Gunners along its west wall, and another row of Husks.
4. East of the smelter, **control** has the **lever**, right above the **gate** to the **red vault**: the **red keycard**, and the trap closet in the south-east corner.
5. The **red door** in the north wall of the smelter opens on the **cooling tunnel**, one more row. The **yellow keycard** is in the vault at its west end.
6. Go back to the start. The **yellow door** in its north wall opens on **dispatch**: the exit.

Enemies start facing the doors of their rooms.

## Level 9: Iron Bastion

> Past the foundry stands a bastion of black stone, guarded by shield-bearing Wardens.

| Totals | |
| --- | --- |
| Chapter | 3 |
| Rooms | 8 and a secret |
| Enemies | 36: 9 Husks, 4 Shotgun Husks, 4 Fiends, 1 Brute, 5 Gunners, 6 Stalkers, 7 Wardens |
| Map items | 20 |
| Barrels | 0 |
| Secrets | 1 |
| Par time | 6:30 |

### Route

1. Start in the **gatehouse** (south). A scratched panel in its west wall hides a stash with a vital sphere.
2. The **courtyard** has four stone pillars, so you can get behind the **Wardens** and their shields.
3. The **barracks** west of the courtyard is a dead end with ammo. The **armory** east of it has the **lever**, which opens the **gate** in the north wall of the courtyard.
4. The gate opens on the **keep hall**. The **chapel** east of it holds the **blue keycard**, and the trap closet in the north-east corner.
5. The **blue door** in the west wall of the keep opens on the **west tower**: the **yellow keycard**.
6. Go back to the courtyard. The **yellow door** in its south wall opens on the **inner gate**: the exit.

Enemies start facing the doors of their rooms.

## Level 10: Drowned Pit

> The gate drains into a pit of slime, and floating shapes drift over it.

| Totals | |
| --- | --- |
| Chapter | 4 |
| Rooms | 8 and a secret |
| Enemies | 39: 5 Husks, 3 Shotgun Husks, 3 Fiends, 2 Brutes, 1 Shade, 6 Gunners, 7 Stalkers, 4 Wardens, 8 Hollows |
| Map items | 18 |
| Barrels | 0 |
| Secrets | 1 |
| Par time | 6:30 |

### Route

1. Start on a small landing (north-west). A sluice tunnel leads east into **the pit**.
2. The pit is a slime lake with a shore all around it. **Hollows** float on raised islands in the slime, where only shots reach them.
3. The **pump station** east of the pit has the **lever**, right above the **gate** to the **red cistern**: the **red keycard**, and the trap closet in the south-east corner.
4. The **red door** in the south wall of the pit opens on the **drowned galleries**: slime channels with one bridge each. A scratched wall in the south wall hides a stash.
5. The **blue keycard** is in the **grotto** west of the galleries.
6. The **blue door** in the north wall of the grotto opens on the **floodgate**: the exit.

Enemies start facing the doors of their rooms.

## Level 11: The Gauntlet

> Everything the gate has made waits between you and its keeper.

| Totals | |
| --- | --- |
| Chapter | 4 |
| Rooms | 10 and a secret |
| Enemies | 46: 6 Husks, 5 Shotgun Husks, 3 Fiends, 2 Brutes, 3 Shades, 7 Gunners, 9 Stalkers, 6 Wardens, 5 Hollows |
| Map items | 26 |
| Barrels | 0 |
| Secrets | 1 |
| Par time | 7:00 |

### Route

1. Start in the west. The **rift vault** north of the start (a dead end) holds the **rift cannon** and cells.
2. The **first arena** has a lava pool in the middle and every kind of enemy. The **red keycard** is in the pit south of it.
3. The **red door** in the east wall of the first arena opens on the **second arena**: four pillars, Wardens, Gunners, Stalkers and a Hollow.
4. The **watchtower** north of the second arena has the **lever**. It opens the **gate** in the north wall of the **third arena**, two rooms away.
5. The gate opens on the **yellow vault**: the **yellow keycard**, and the trap closet in the north-east corner. The **yellow door** in the south wall of the third arena opens on the **bone vault**: the **blue keycard**. A scratched wall in the east wall of the third arena hides a stash.
6. Go back to the first arena. The **blue door** in its north wall opens on the **last stand**: the exit.

Enemies start facing the doors of their rooms.

## Level 12: The Gate

> The gate stands open at the bottom of the world, and its keeper waits in front of it.

| Totals | |
| --- | --- |
| Chapter | 4 |
| Rooms | 4 and a secret |
| Enemies | 17: 3 Husks, 1 Shotgun Husk, 1 Fiend, 1 Shade, 2 Gunners, 3 Stalkers, 3 Wardens, 2 Hollows, 1 Gatekeeper |
| Map items | 14 |
| Barrels | 0 |
| Secrets | 1 |
| Par time | 4:00 |

### Layout

- New in this level: the **Gatekeeper**.
- Start in the supply room in the west: 6 cell packs, 2 boxes of grenades, 2 medikits and a combat vest. No enemies, no keycards.
- A secret wall in the north wall of the supply room hides a small stash with a **vital sphere**, a cell pack and a box of grenades.
- A door in the east wall leads into a short corridor, and a second door opens into the arena.
- The arena is one big hall with two lava strips along its sides and four stone pillars. The Gatekeeper floats in its north half, with Wardens, Stalkers, Hollows, Gunners and a few weaker enemies around him. They all face the door you come through.
- The exit is in a small room north of the arena, behind a violet rift seal. Nothing opens the seal while the Gatekeeper lives. When he dies, it breaks. One Husk waits at the exit switch.
