const typeToIndex = {
  "SHEPHARD": 0,
  "MAN": 1,
  "WOMAN": 2,
  "PRIEST": 3,
  "HUNTER": 4,
  "MERCHANT": 5,
  "FERRYMAN": 6,
}

export const getImageTag = (type) => `<img style="object-position: ${typeToIndex[type] * -32}px" src="/images/actors2.png" width="32px" height="64px"/>`;
