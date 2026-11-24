export interface StickVector {
  x: number;
  y: number;
  angle: number;
  strength: number;
  isActive: boolean;
}

export function stickVector(dx: number, dy: number, radius: number, deadZone: number): StickVector {
  const angle = Math.atan2(dy, dx);
  const magnitude = Math.min(1, Math.hypot(dx, dy) / radius);
  if (magnitude < deadZone) return { x: 0, y: 0, angle, strength: magnitude, isActive: false };
  const scaled = (magnitude - deadZone) / (1 - deadZone);
  return { x: Math.cos(angle) * scaled, y: Math.sin(angle) * scaled, angle, strength: magnitude, isActive: true };
}

export function knobOffset(dx: number, dy: number, radius: number): { x: number; y: number } {
  const length = Math.hypot(dx, dy);
  const scale = length > radius ? radius / length : 1;
  return { x: dx * scale, y: dy * scale };
}

export function heading(vector: StickVector): { x: number; y: number } {
  return vector.isActive ? { x: Math.cos(vector.angle), y: Math.sin(vector.angle) } : { x: 0, y: 0 };
}
