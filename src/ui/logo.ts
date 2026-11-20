export const GLYPHS: Record<string, string[]> = {
  D: ['#######..', '########.', '##....###', '##.....##', '##.....##', '##.....##', '##.....##', '##.....##', '##....###', '########.', '#######..'],
  O: ['..#####..', '.#######.', '###...###', '##.....##', '##.....##', '##.....##', '##.....##', '##.....##', '###...###', '.#######.', '..#####..'],
  M: ['###...###', '####.####', '#########', '##.###.##', '##..#..##', '##.....##', '##.....##', '##.....##', '##.....##', '##.....##', '##.....##'],
  E: ['#########', '#########', '##.......', '##.......', '#######..', '#######..', '##.......', '##.......', '##.......', '#########', '#########'],
};

const BLOCK = 4;
const DEPTH = 7;
const GAP = 2;

function filled(g: string[], x: number, y: number): boolean {
  return g[y]?.[x] === '#';
}

export function drawLogo(text = 'DOOMED'): HTMLCanvasElement {
  const letters = [...text].map((c) => GLYPHS[c]);
  const n = letters.length;
  const widths = letters.map((g) => g[0].length * BLOCK);
  const maxH = 11 * BLOCK;
  const canvas = document.createElement('canvas');
  canvas.width = widths.reduce((a, b) => a + b, 0) + GAP * BLOCK * (n - 1) + DEPTH * 2 + 8;
  canvas.height = maxH + DEPTH + 10;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  let ox = 4;
  letters.forEach((g, i) => {
    const bw = BLOCK;
    const bh = BLOCK;
    const h = maxH;
    const oy = 4;
    const cells: [number, number, number, number, number, number][] = [];
    g.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c !== '#') return;
        const x0 = Math.round(ox + x * bw);
        const y0 = Math.round(oy + y * bh);
        cells.push([x0, y0, Math.round(ox + (x + 1) * bw) - x0, Math.round(oy + (y + 1) * bh) - y0, x, y]);
      });
    });

    ctx.fillStyle = '#000';
    for (const [x, y, w, hh] of cells) ctx.fillRect(x - 2, y - 2, w + 4 + DEPTH, hh + 4 + DEPTH);
    for (let k = DEPTH; k >= 1; k--) {
      const t = k / DEPTH;
      ctx.fillStyle = `rgb(${Math.round(110 - 70 * t)}, ${Math.round(24 - 16 * t)}, ${Math.round(8 - 4 * t)})`;
      for (const [x, y, w, hh] of cells) ctx.fillRect(x + k, y + k, w, hh);
    }
    const grad = ctx.createLinearGradient(0, oy, 0, oy + h);
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.18, '#ffc840');
    grad.addColorStop(0.5, '#f0701c');
    grad.addColorStop(0.8, '#b8240e');
    grad.addColorStop(1, '#6a0e06');
    ctx.fillStyle = grad;
    for (const [x, y, w, hh] of cells) ctx.fillRect(x, y, w, hh);

    for (const [x, y, w, hh, gx, gy] of cells) {
      if (!filled(g, gx, gy - 1)) {
        ctx.fillStyle = 'rgba(255,255,220,0.75)';
        ctx.fillRect(x, y, w, 1);
      }
      if (!filled(g, gx - 1, gy)) {
        ctx.fillStyle = 'rgba(255,240,180,0.45)';
        ctx.fillRect(x, y, 1, hh);
      }
      if (!filled(g, gx, gy + 1)) {
        ctx.fillStyle = 'rgba(40,0,0,0.7)';
        ctx.fillRect(x, y + hh - 1, w, 1);
      }
      if (!filled(g, gx + 1, gy)) {
        ctx.fillStyle = 'rgba(40,0,0,0.55)';
        ctx.fillRect(x + w - 1, y, 1, hh);
      }
      if ((gx * 7 + gy * 13 + i * 5) % 9 === 0) {
        ctx.fillStyle = 'rgba(60,8,0,0.45)';
        ctx.fillRect(x + 1, y + 1, 1, 1);
      }
    }
    ox += widths[i] + GAP * BLOCK;
  });
  return canvas;
}
