export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  let id = '';

  for (let position = 0; position < 36; position += 1) {
    if (position === 8 || position === 13 || position === 18 || position === 23) {
      id += '-';
    } else if (position === 14) {
      id += '4';
    } else if (position === 19) {
      id += '89ab'[Math.floor(Math.random() * 4)];
    } else {
      id += Math.floor(Math.random() * 16).toString(16);
    }
  }

  return id;
}
