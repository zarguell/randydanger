// ─── GAME CONSTANTS ───────────────────────────────────────────────
export const MAP_W = 16, MAP_H = 16;
export const FOV = Math.PI / 3;
export const HALF_FOV = FOV / 2;
export const MAX_DEPTH = 20;
export const MOVE_SPEED = 3.5;
export const ROT_SPEED = 2.0;

export const QUIPS = [
  "That'll learn ya.",
  "Randy 1, Bad guys 0.",
  "I am SO good at this.",
  "Heh. Danger zone.",
  "Aw yeah, buddy.",
  "Too easy. Too easy.",
  "That's what I thought.",
  "Eat it, chump.",
  "Randy Danger does NOT miss.",
  "Carl would've been dead by now.",
];

export const OUCH_QUIPS = [
  "OW! Come on!",
  "That tickled. Mostly.",
  "You got lucky, pal.",
  "Randy doesn't go down easy!",
  "Watch the face!",
];

export const MAPS = [
  [
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,
    1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,
    1,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,1,1,0,0,0,0,1,1,0,0,0,1,
    1,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,
    1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  ],
];

export const WALL_COLORS = [
  null,
  ['#2a4a2a', '#1a3a1a'],
];
export const FLOOR_COLOR = '#111a11';
export const CEIL_COLOR  = '#0a120a';

export const JOYSTICK_RADIUS = 52;
export const TRACKPAD_SENSITIVITY = 0.006;
export const TAP_MAX_DURATION = 150;
export const TAP_MAX_MOVEMENT = 20;
export const AUTO_AIM_ANGLE = 0.09;
export const AUTO_AIM_SPEED = 1.5;
export const LEFT_ZONE_RATIO = 0.4;
