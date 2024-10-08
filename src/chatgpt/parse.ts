const byteTable = {
  "*": 0xFE, "/": 0xFF, " ": 0x00, "A": 0x01, "B": 0x02, "C": 0x03,
  "D": 0x04, "E": 0x05, "F": 0x06, "G": 0x07, "H": 0x08, "I": 0x09,
  "J": 0x0A, "K": 0x0B, "L": 0x0C, "M": 0x0D, "N": 0x0E, "O": 0x0F,
  "P": 0x10, "Q": 0x11, "R": 0x12, "S": 0x13, "T": 0x14, "U": 0x15,
  "V": 0x16, "W": 0x17, "X": 0x18, "Y": 0x19, "Z": 0x1A, ".": 0x1B,
  "’": 0x1C, "'": 0x1C, ",": 0x1E, ";": 0x1E, "0": 0x36, "1": 0x37, "2": 0x38, "3": 0x39,
  "4": 0x3A, "5": 0x3B, "6": 0x3C, "7": 0x3D, "8": 0x3E, "9": 0x3F,
  "!": 0x40, "-": 0x46, "?": 0x5D
};

export const parseToBytes = (text: string) => {
  const fixedText =  text.replace(/\n/g, '*');

  const byteText = fixedText.toUpperCase().split("").map((char) => {
    return byteTable[char as keyof typeof byteTable];

  });

  byteText.push(0xFF);

  return byteText;
}