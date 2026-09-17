import QRCode from 'qrcode';

/**
 * Generates dynamic QR data string for a lot at a specific stage.
 * Note: The lot's QR is not static: its encoded content (current stage, karigar, date)
 * must be regenerated every time the lot moves to a new stage!
 */
export function generateLotStageQrPayload(lotNumber: string, stage: string, karigarName: string, date: string): string {
  return JSON.stringify({
    type: 'LOT_STAGE_SLIP',
    lotNumber,
    stage,
    karigar: karigarName,
    date,
    nonce: Math.random().toString(36).substring(2, 8),
  });
}

/**
 * Generates QR code as a base64 Data URL for display or printing.
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR generation failed:', err);
    return '';
  }
}

/**
 * Generates an SVG string representation of a compact Code 128 barcode
 * for the permanent design barcode or lot identifier.
 * Sized to fit neatly inside info boxes without overflowing.
 */
export function generateBarcodeSvg(text: string, height = 20): string {
  const clean = text.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
  const patterns: Record<string, string> = {
    '0': '10100110110', '1': '11010010110', '2': '10110010110', '3': '11011001010',
    '4': '10100110011', '5': '11010011001', '6': '10110011001', '7': '10100101100',
    '8': '11010010100', '9': '10110010100', 'A': '11010110010', 'B': '11010011010',
    'C': '11010010110', 'D': '10110110010', 'E': '10110011010', 'F': '10110010110',
    'G': '10010110110', 'H': '10010011011', 'I': '10010010111', 'J': '10110100110',
    'K': '11010100110', 'L': '11010101100', 'M': '11011010100', 'N': '10101100110',
    'O': '10100110110', 'P': '10010110110', 'Q': '10011010110', 'R': '10011011010',
    'S': '10011010011', 'T': '10010110011', 'U': '11001010110', 'V': '11001101010',
    'W': '11001101100', 'X': '11011001100', 'Y': '11011011000', 'Z': '11001011010',
    '-': '10100011010', '_': '10100010110',
  };

  const startPattern = '11010010000'; // Start B
  const stopPattern = '1100011101011'; // Stop

  let binary = startPattern;
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    binary += patterns[char] || '10100110110';
  }
  binary += stopPattern;

  const barWidth = 1;
  const paddingX = 6;
  const totalWidth = binary.length * barWidth + paddingX * 2;
  const totalHeight = height + 11;

  let rects = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      rects += `<rect x="${paddingX + i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="#000000" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" style="width: 100%; max-width: 125px; height: auto; display: block;" class="mx-auto">
    <rect width="100%" height="100%" fill="#ffffff" />
    ${rects}
    <text x="${totalWidth / 2}" y="${height + 8.5}" text-anchor="middle" font-family="monospace" font-size="7.5" font-weight="bold" fill="#000000" letter-spacing="1">${clean}</text>
  </svg>`;
}
