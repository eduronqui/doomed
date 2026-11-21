import { parseLevel } from '../sim/level';
import { TRAINING_MAP } from './training.map';
import { TRAINING_MUSIC } from './training.music';
import type { LevelInfo } from './types';

export const TRAINING: LevelInfo = {
  id: 0,
  title: 'Training: Boot Camp',
  briefing: 'A short drill before deployment.',
  darkness: 0.55,
  par: 90,
  startMessage: 'Follow the instructions at the top of the screen.',
  music: TRAINING_MUSIC,
  load: () => parseLevel('Boot Camp', TRAINING_MAP),
  training: true,
  alertOnEntry: ['brute'],
  startCarry: { health: 25, armor: 0, ammo: { bullets: 50, shells: 0, grenades: 0, fuel: 0, cells: 0 }, weapons: ['knife', 'pistol'], weapon: 'pistol' },
  tips: [
    {
      area: [1, 1, 12, 11],
      text: 'MOVE with W A S D. AIM with the mouse. Walk over items to pick them up. Walk into the door on the right, or press E next to it, to open it.',
    },
    {
      area: [13, 1, 28, 11],
      text: 'SHOOT: hold the left mouse button or the space bar. Kill the two Husks, or shoot a barrel to blow up what stands near it. Crates block bullets, so use them as cover. Or sneak up behind a Husk and stab it with the knife (press 1): a silent kill.',
      clearText:
        'REST: the room is clear. Stand still and do not shoot. After 10 seconds you heal 1 HP every 2 seconds, up to 60 HP on Recruit and 30 HP on Veteran (no resting on Doomed). Then take the medikit to heal more, and the shotgun: press 3 (or turn the mouse wheel) to switch weapons.',
    },
    {
      area: [29, 1, 43, 11],
      text: 'FINAL: a Brute guards the exit. It is fast and hits hard, but you are faster. Back off while you shoot, and use the shotgun up close.',
      clearText: 'EXIT: press E at the red EXIT switch on the north wall to finish the training.',
    },
  ],
};
