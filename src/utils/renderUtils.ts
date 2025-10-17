// ---------------------------
// renderutils.ts
// ---------------------------

/**
 * clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * linear interpolation between start and end
 */
export function interpolate(start: number, end: number, t: number): number {
  return start + t * (end - start);
}

/**
 * convert rgb to grayscale luminance (supports optional gamma correction)
 */
export function luminance(r: number, g: number, b: number, gamma: number = 1): number {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return gamma === 1 ? lum : 255 * Math.pow(lum / 255, gamma);
}

/**
 * adjust contrast and brightness
 * contrast in [-255,255], brightness in [-255,255]
 */
export function applyContrastBrightness(
  lum: number,
  contrast: number = 0,
  brightness: number = 0
): number {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return clamp(factor * (lum - 128) + 128 + brightness, 0, 255);
}

/**
 * map a luminance value to a character from a charset
 */
export function mapToChar(lum: number, charset: string[]): string {
  const index = Math.floor((lum / 255) * (charset.length - 1));
  return charset[clamp(index, 0, charset.length - 1)];
}

/**
 * downscale imagebitmap to ascii grid
 * uses offscanvas for efficiency
 */
export async function scaleImage(
  imageBitmap: ImageBitmap,
  cols: number,
  rows: number
): Promise<ImageData> {
  const offCanvas = new OffscreenCanvas(cols, rows);
  const ctx = offCanvas.getContext("2d")!;
  ctx.drawImage(imageBitmap, 0, 0, cols, rows);
  return ctx.getImageData(0, 0, cols, rows);
}

/**
 * convert rgb values to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * generate a normalized 2d gaussian kernel
 */
export function gaussianKernel2D(sigma: number, kernelSize: number): number[][] {
  const kernel: number[][] = [];
  const half = Math.floor(kernelSize / 2);
  let sum = 0;
  for (let y = -half; y <= half; y++) {
    const row: number[] = [];
    for (let x = -half; x <= half; x++) {
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      row.push(value);
      sum += value;
    }
    kernel.push(row);
  }
  // normalize
  for (let y = 0; y < kernelSize; y++) {
    for (let x = 0; x < kernelSize; x++) {
      kernel[y][x] /= sum;
    }
  }
  return kernel;
}

/**
 * convolve a 2d image with a kernel
 */
export function convolve2D(img: number[][], kernel: number[][]): number[][] {
  const height = img.length;
  const width = img[0].length;
  const kernelSize = kernel.length;
  const half = Math.floor(kernelSize / 2);
  const output: number[][] = [];
  for (let y = 0; y < height; y++) {
    output[y] = [];
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const yy = y + ky - half;
          const xx = x + kx - half;
          const pixel = yy >= 0 && yy < height && xx >= 0 && xx < width ? img[yy][xx] : 0;
          sum += pixel * kernel[ky][kx];
        }
      }
      output[y][x] = sum;
    }
  }
  return output;
}

/**
 * difference of gaussians (edge enhancement)
 * keeps variable name dog
 */
export function differenceOfGaussians2D(
  gray: number[][],
  sigma1: number,
  sigma2: number,
  kernelSize: number
): number[][] {
  const kernel1 = gaussianKernel2D(sigma1, kernelSize);
  const kernel2 = gaussianKernel2D(sigma2, kernelSize);
  const blurred1 = convolve2D(gray, kernel1);
  const blurred2 = convolve2D(gray, kernel2);
  const height = gray.length;
  const width = gray[0].length;
  const dog: number[][] = [];
  for (let y = 0; y < height; y++) {
    dog[y] = [];
    for (let x = 0; x < width; x++) {
      dog[y][x] = blurred1[y][x] - blurred2[y][x];
    }
  }
  return dog;
}

/**
 * apply sobel operator to detect edges
 */
export function applySobel2D(
  img: number[][],
  width: number,
  height: number
): { mag: number[][]; angle: number[][] } {
  const mag: number[][] = [];
  const angle: number[][] = [];
  for (let y = 0; y < height; y++) {
    mag[y] = [];
    angle[y] = [];
    for (let x = 0; x < width; x++) {
      mag[y][x] = 0;
      angle[y][x] = 0;
    }
  }
  const kernelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];
  const kernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let Gx = 0,
        Gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = img[y + ky][x + kx];
          Gx += pixel * kernelX[ky + 1][kx + 1];
          Gy += pixel * kernelY[ky + 1][kx + 1];
        }
      }
      mag[y][x] = Math.sqrt(Gx * Gx + Gy * Gy);
      let theta = (Math.atan2(Gy, Gx) * 180) / Math.PI;
      if (theta < 0) theta += 180;
      angle[y][x] = theta;
    }
  }
  return { mag, angle };
}

/**
 * non-maximum suppression (thins edges)
 */
export function nonMaxSuppression(
  mag: number[][],
  angle: number[][],
  width: number,
  height: number
): number[][] {
  const suppressed: number[][] = [];
  for (let y = 0; y < height; y++) {
    suppressed[y] = [];
    for (let x = 0; x < width; x++) suppressed[y][x] = 0;
  }
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const currentMag = mag[y][x];
      let neighbor1 = 0,
        neighbor2 = 0;
      const theta = angle[y][x];
      if ((theta >= 0 && theta < 22.5) || (theta >= 157.5 && theta <= 180)) {
        neighbor1 = mag[y][x - 1];
        neighbor2 = mag[y][x + 1];
      } else if (theta >= 22.5 && theta < 67.5) {
        neighbor1 = mag[y - 1][x + 1];
        neighbor2 = mag[y + 1][x - 1];
      } else if (theta >= 67.5 && theta < 112.5) {
        neighbor1 = mag[y - 1][x];
        neighbor2 = mag[y + 1][x];
      } else if (theta >= 112.5 && theta < 157.5) {
        neighbor1 = mag[y - 1][x - 1];
        neighbor2 = mag[y + 1][x + 1];
      }
      suppressed[y][x] = currentMag >= neighbor1 && currentMag >= neighbor2 ? currentMag : 0;
    }
  }
  return suppressed;
}
