import { pick, randInt } from './utils.js';

function stage1() {
  const op = pick(['+', '-']);
  if (op === '+') {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    return makeProblem(a, op, b, a + b);
  }
  const a = randInt(1, 9);
  const b = randInt(0, a);
  return makeProblem(a, op, b, a - b);
}

function stage2() {
  const patterns = ['a+ten', 'ten+a', 'ten-a'];
  const p = pick(patterns);
  const ten = randInt(1, 9) * 10;
  const a = randInt(1, 9);
  if (p === 'a+ten') return makeProblem(a, '+', ten, a + ten);
  if (p === 'ten+a') return makeProblem(ten, '+', a, ten + a);
  return makeProblem(ten + a, '-', a, ten);
}

function stage3() {
  const op = pick(['+', '-']);
  if (op === '+') {
    const a = randInt(10, 39);
    const b = randInt(1, 9);
    return makeProblem(a, '+', b, a + b);
  }
  const a = randInt(10, 39);
  const b = randInt(1, Math.min(9, a - 1));
  return makeProblem(a, '-', b, a - b);
}

function stage4() {
  const op = pick(['+', '-']);
  if (op === '+') {
    const a = randInt(12, 49);
    const b = randInt(2, 9);
    return makeProblem(a, '+', b, a + b);
  }
  const a = randInt(15, 59);
  const b = randInt(2, 9);
  const safeA = Math.max(a, b + 1);
  return makeProblem(safeA, '-', b, safeA - b);
}

function stage5() {
  return pick([stage1, stage2, stage3, stage4])();
}

function makeProblem(a, op, b, answer) {
  const typeRoll = Math.random();
  let display = '';
  let speech = '';

  if (typeRoll < 0.5) {
    display = `${a} ${symbol(op)} ${b} = □`;
    speech = `${toSpeech(a)} ${opWord(op)} ${toSpeech(b)}은 얼마일까요?`;
  } else if (typeRoll < 0.75) {
    display = `□ ${symbol(op)} ${b} = ${answer}`;
    speech = `네모 ${opWord(op)} ${toSpeech(b)}은 ${toSpeech(answer)}입니다. 네모 안에 들어갈 숫자는 무엇일까요?`;
    answer = a;
  } else {
    display = `${a} ${symbol(op)} □ = ${answer}`;
    speech = `${toSpeech(a)} ${opWord(op)} 네모는 ${toSpeech(answer)}입니다. 네모 안에 들어갈 숫자는 무엇일까요?`;
    answer = b;
  }

  return { display, speech, answer, operator: op, left: a, right: b };
}

function symbol(op) {
  return op === '+' ? '+' : '-';
}

function opWord(op) {
  return op === '+' ? '더하기' : '빼기';
}

function toSpeech(value) {
  return String(value);
}

export function generateProblem(stage, previousDisplay = '') {
  const table = { 1: stage1, 2: stage2, 3: stage3, 4: stage4, 5: stage5 };
  let next = (table[stage] || stage5)();
  let tries = 0;
  while (next.display === previousDisplay && tries < 10) {
    next = (table[stage] || stage5)();
    tries += 1;
  }
  return next;
}
