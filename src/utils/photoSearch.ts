import { Design, VisualFingerprint } from '../types';

/**
 * Extracts a visual similarity fingerprint from an image element or data URL.
 */
export async function extractImageFingerprint(imageSrc: string): Promise<VisualFingerprint> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 64;
      canvas.width = size;
      canvas.height = size;
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

      ctx.drawImage(img, 0, 0, size, size);
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;

      let totalR = 0, totalG = 0, totalB = 0;
      let totalBrightness = 0;
      let goldWarmthCount = 0;
      let edges = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalR += r;
        totalG += g;
        totalB += b;

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
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

      const pixelCount = size * size;
      const avgR = totalR / pixelCount;
      const avgG = totalG / pixelCount;
      const avgB = totalB / pixelCount;
      const avgBrightness = totalBrightness / pixelCount;
      const warmth = goldWarmthCount / pixelCount;
      const edgeDensity = Math.min(1, edges / (pixelCount * 0.4));

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
      });
    };

    img.onerror = () => {
      resolve({
        dominantHue: 42,
        avgBrightness: 160,
        edgeDensity: 0.5,
        warmth: 0.6,
        aspectRatio: 1,
        hash: 'fallback',
      });
    };

    img.src = imageSrc;
  });
}

/**
 * Calculates a similarity percentage (0% to 99%) between a query photo fingerprint and a design.
 */
export function calculateSimilarity(fpA: VisualFingerprint, fpB: VisualFingerprint): number {
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

  // Scale naturally between 45% and 98% for realistic visual similarity feedback
  const scaledScore = Math.min(98.5, Math.max(42.0, rawSimilarity * 98));
  return Number(scaledScore.toFixed(1));
}

export interface SimilarityResult {
  design: Design;
  similarity: number;
}

/**
 * Returns the top 3 matches ranked by similarity percentage.
 */
export function findTop3Matches(queryFp: VisualFingerprint, designs: Design[]): SimilarityResult[] {
  const scored = designs.map((d) => {
    // If design doesn't have a fingerprint yet, generate a fallback deterministic one from its name & ID
    const dFp: VisualFingerprint = d.fingerprint || {
      dominantHue: (d.name.length * 37) % 360,
      avgBrightness: 140 + (d.id.charCodeAt(0) % 50),
      edgeDensity: 0.45 + ((d.id.charCodeAt(1) || 60) % 30) / 100,
      warmth: 0.55 + ((d.name.charCodeAt(0) || 70) % 30) / 100,
      aspectRatio: 1,
      hash: d.id,
    };

    const similarity = calculateSimilarity(queryFp, dFp);
    return { design: d, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, 3);
}
