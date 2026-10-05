import { Design, VisualFingerprint } from '../types';
import { downloadDesignPhoto } from '../services/designImageStorage';

/**
 * Extracts a visual similarity fingerprint from an image element or data URL.
 */
export async function extractImageFingerprint(imageSrc: string): Promise<VisualFingerprint> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 9;
      canvas.width = size;
      canvas.height = 8;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          dominantHue: 40,
          avgBrightness: 150,
          edgeDensity: 0.5,
          warmth: 0.6,
          aspectRatio: 1,
          hash: 'default',
        });
        return;
      }

      // Center-crop to a square so different camera aspect ratios compare fairly.
      const cropSize = Math.min(img.naturalWidth, img.naturalHeight);
      const cropX = (img.naturalWidth - cropSize) / 2;
      const cropY = (img.naturalHeight - cropSize) / 2;
      let imgData: ImageData;
      try {
        ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, size, 8);
        imgData = ctx.getImageData(0, 0, size, 8);
      } catch (error) {
        console.warn('Could not read a design image for visual matching:', error);
        resolve({
          dominantHue: 0,
          avgBrightness: 0,
          edgeDensity: 0,
          warmth: 0,
          aspectRatio: 1,
          hash: 'unavailable',
        });
        return;
      }
      const data = imgData.data;

      let totalR = 0, totalG = 0, totalB = 0;
      let totalBrightness = 0;
      let goldWarmthCount = 0;
      let edges = 0;

      const grayscale: number[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalR += r;
        totalG += g;
        totalB += b;

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        grayscale.push(brightness);
        totalBrightness += brightness;

        // Check for golden/warm brass/yellow hues (typical in ring jewelry)
        if (r > b * 1.2 && g > b * 1.1) {
          goldWarmthCount++;
        }

        // Horizontal edge gradient
        if (i > 4) {
          const prevBrightness = 0.299 * data[i - 4] + 0.587 * data[i - 3] + 0.114 * data[i - 2];
          if (Math.abs(brightness - prevBrightness) > 28) {
            edges++;
          }
        }
      }

      const pixelCount = size * 8;
      const avgR = totalR / pixelCount;
      const avgG = totalG / pixelCount;
      const avgB = totalB / pixelCount;
      const avgBrightness = totalBrightness / pixelCount;
      const warmth = goldWarmthCount / pixelCount;
      const edgeDensity = Math.min(1, edges / (pixelCount * 0.4));

      // 64-bit difference hash captures the shape/layout rather than only the
      // overall color, which made the old search rank unrelated rings alike.
      let perceptualHash = '';
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          perceptualHash += grayscale[y * 9 + x] > grayscale[y * 9 + x + 1] ? '1' : '0';
        }
      }

      // Compute hue (0-360)
      const max = Math.max(avgR, avgG, avgB);
      const min = Math.min(avgR, avgG, avgB);
      let hue = 0;
      if (max !== min) {
        const d = max - min;
        if (max === avgR) hue = ((avgG - avgB) / d + (avgG < avgB ? 6 : 0)) * 60;
        else if (max === avgG) hue = ((avgB - avgR) / d + 2) * 60;
        else hue = ((avgR - avgG) / d + 4) * 60;
      }

      const hash = `${Math.round(hue)}-${Math.round(avgBrightness)}-${Math.round(warmth * 100)}-${Math.round(edgeDensity * 100)}`;

      resolve({
        dominantHue: Math.round(hue),
        avgBrightness: Math.round(avgBrightness),
        edgeDensity: Number(edgeDensity.toFixed(3)),
        warmth: Number(warmth.toFixed(3)),
        aspectRatio: img.naturalWidth / (img.naturalHeight || 1),
        hash,
        perceptualHash,
      });
    };

    img.onerror = () => resolve({
      dominantHue: 0,
      avgBrightness: 0,
      edgeDensity: 0,
      warmth: 0,
      aspectRatio: 1,
      hash: 'unavailable',
    });

    img.src = imageSrc;
  });
}

/**
 * Calculates a similarity percentage (0% to 99%) between a query photo fingerprint and a design.
 */
export function calculateSimilarity(fpA: VisualFingerprint, fpB: VisualFingerprint): number {
  if (fpA.perceptualHash && fpB.perceptualHash) {
    const length = Math.min(fpA.perceptualHash.length, fpB.perceptualHash.length);
    if (length === 0) return 0;
    let differentBits = 0;
    for (let i = 0; i < length; i += 1) {
      if (fpA.perceptualHash[i] !== fpB.perceptualHash[i]) differentBits += 1;
    }
    const shapeSimilarity = (1 - differentBits / length) * 100;
    const hueDiff = Math.min(Math.abs(fpA.dominantHue - fpB.dominantHue), 360 - Math.abs(fpA.dominantHue - fpB.dominantHue)) / 180;
    const colorDistance = hueDiff * 0.4 + Math.abs(fpA.avgBrightness - fpB.avgBrightness) / 255 * 0.3 + Math.abs(fpA.warmth - fpB.warmth) * 0.3;
    return Number((shapeSimilarity * 0.85 + (1 - colorDistance) * 100 * 0.15).toFixed(1));
  }
  // Hue distance (circular 0-360)
  const hueDiff = Math.min(Math.abs(fpA.dominantHue - fpB.dominantHue), 360 - Math.abs(fpA.dominantHue - fpB.dominantHue)) / 180;
  // Brightness distance (0-255)
  const brightDiff = Math.abs(fpA.avgBrightness - fpB.avgBrightness) / 255;
  // Warmth distance (0-1)
  const warmthDiff = Math.abs(fpA.warmth - fpB.warmth);
  // Edge density distance (texture/detailing)
  const edgeDiff = Math.abs(fpA.edgeDensity - fpB.edgeDensity);

  // Weighted similarity calculation
  const distance = hueDiff * 0.35 + brightDiff * 0.2 + warmthDiff * 0.25 + edgeDiff * 0.2;
  const rawSimilarity = Math.max(0, 1 - distance);

  return Number((rawSimilarity * 100).toFixed(1));
}

export interface SimilarityResult {
  design: Design;
  similarity: number;
}

/**
 * Returns the top 3 matches ranked by similarity percentage.
 */
export async function findTop3Matches(queryFp: VisualFingerprint, designs: Design[]): Promise<SimilarityResult[]> {
  if (!queryFp.perceptualHash || queryFp.hash === 'unavailable') return [];
  const scored = await Promise.all(designs.map(async (design) => {
    // Recompute old saved fingerprints from their actual image. Name/ID-based
    // synthetic fingerprints are deliberately not used as fake matches.
    let dFp = design.fingerprint?.perceptualHash ? design.fingerprint : undefined;
    if (!dFp && design.photoStoragePath) {
      try {
        const imageBlob = await downloadDesignPhoto(design.photoStoragePath);
        const imageUrl = URL.createObjectURL(imageBlob);
        try {
          dFp = await extractImageFingerprint(imageUrl);
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      } catch (error) {
        console.warn(`Could not load stored photo for design ${design.id}:`, error);
      }
    }
    if (!dFp) dFp = await extractImageFingerprint(design.photoUrl);
    if (!dFp.perceptualHash || dFp.hash === 'unavailable') return null;
    return { design, similarity: calculateSimilarity(queryFp, dFp) };
  }));

  return scored
    .filter((result): result is SimilarityResult => result !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}
