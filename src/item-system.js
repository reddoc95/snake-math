import { ITEM_META, ITEM_TYPES } from './config.js';
import { keyOf, pick, randInt } from './utils.js';

const POOL = Object.values(ITEM_TYPES);

export class ItemSystem {
  constructor() {
    this.items = [];
    this.nextSpawnAt = performance.now() + this.randomSpawnDelay();
  }

  reset(now = performance.now()) {
    this.items = [];
    this.nextSpawnAt = now + this.randomSpawnDelay();
  }

  update(now, occupiedKeys, randomEmptyCell) {
    this.items = this.items.filter((item) => item.expiresAt > now);
    if (this.items.length >= 2 || now < this.nextSpawnAt) return;

    const cell = randomEmptyCell(new Set([...occupiedKeys, ...this.items.map((item) => keyOf(item.pos))]));
    if (!cell) return;

    const type = pick(POOL);
    this.items.push({
      type,
      pos: cell,
      expiresAt: now + randInt(10000, 20000),
      meta: ITEM_META[type],
    });
    this.nextSpawnAt = now + this.randomSpawnDelay();
  }

  consumeAt(pos) {
    const index = this.items.findIndex((item) => item.pos.x === pos.x && item.pos.y === pos.y);
    if (index === -1) return null;
    const [item] = this.items.splice(index, 1);
    return item;
  }

  randomSpawnDelay() {
    return randInt(8000, 12000);
  }
}
