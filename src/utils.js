export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function keyOf(pos) {
  return `${pos.x},${pos.y}`;
}

export function positionsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
