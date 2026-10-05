import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

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
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, text, {
    format: 'CODE128',
    width: 2,
    height,
    displayValue: true,
    font: 'monospace',
    fontSize: 12,
    textMargin: 2,
    margin: 8,
    lineColor: '#000000',
    background: '#ffffff',
  });
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Code 128 barcode ${text}`);
  svg.setAttribute('style', 'width:100%;max-width:250px;height:auto;display:block');
  svg.setAttribute('class', 'mx-auto');
  return svg.outerHTML;
}
