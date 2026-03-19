import { randInt, shuffle } from './utils.js';

const CHOICE_COUNT = 6;

export function generateChoices(answer, stage) {
  const values = new Set([answer]);
  const baseSpan = stage <= 2 ? 4 : stage <= 4 ? 7 : 10;
  let span = Math.max(baseSpan, CHOICE_COUNT - 1 - Math.max(0, answer));
  let attempts = 0;

  while (values.size < CHOICE_COUNT && attempts < 200) {
    attempts += 1;
    const delta = randInt(-span, span);
    const candidate = answer + delta;
    if (candidate < 0 || candidate === answer) continue;
    values.add(candidate);

    if (attempts % 40 === 0 && values.size < CHOICE_COUNT) {
      span += 2;
    }
  }

  for (let candidate = 0; values.size < CHOICE_COUNT; candidate += 1) {
    if (candidate !== answer) values.add(candidate);
  }

  return shuffle([...values]);
}
