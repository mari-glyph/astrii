// src/__tests__/RenderUtils.test.ts

import {
  clamp,
  interpolate,
  luminance,
  applyContrastBrightness,
  mapToChar,
  rgbToHex,
  gaussianKernel2D,
  convolve2D,
  differenceOfGaussians2D,
  applySobel2D,
  nonMaxSuppression,
  scaleImage
} from '@/utils/RenderUtils';

// mock OffscreenCanvas for node/jsdom
class MockOffscreenCanvas {
  width = 0;
  height = 0;
  getContext(_type: string) {
    return {
      drawImage: () => {},
      getImageData: (_x: number, _y: number, width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      }),
    };
  }
}

global.OffscreenCanvas = MockOffscreenCanvas as any;

describe('RenderUtils', () => {
  test('clamp works', () => {
    expect(clamp(10, 0, 5)).toBe(5);
    expect(clamp(-1, 0, 5)).toBe(0);
    expect(clamp(3, 0, 5)).toBe(3);
  });

  test('interpolate works', () => {
    expect(interpolate(0, 10, 0.5)).toBe(5);
  });

  test('luminance returns valid range', () => {
    const lum = luminance(255, 0, 0);
    expect(lum).toBeGreaterThanOrEqual(0);
    expect(lum).toBeLessThanOrEqual(255);
  });

  test('applyContrastBrightness clamps output', () => {
    expect(applyContrastBrightness(100, 255, 100)).toBeLessThanOrEqual(255);
    expect(applyContrastBrightness(100, -255, -200)).toBeGreaterThanOrEqual(0);
  });

  test('mapToChar returns character from charset', () => {
    const charset = '@%#*+=-:. ';
    const char = mapToChar(128, charset);
    expect(charset.includes(char)).toBe(true);
  });

  test('rgbToHex works', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  test('gaussianKernel2D produces normalized kernel', () => {
    const kernel = gaussianKernel2D(1, 3);
    const sum = kernel.flat().reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  test('convolve2D with identity kernel returns same values', () => {
    const img = [
      [1, 2],
      [3, 4]
    ];
    const kernel = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ];
    expect(convolve2D(img, kernel)).toEqual(img);
  });

  test('differenceOfGaussians2D returns correct dimensions', () => {
    const img = [
      [1, 2],
      [3, 4]
    ];
    const dog = differenceOfGaussians2D(img, 1, 2, 3);
    expect(dog.length).toBe(img.length);
    expect(dog[0].length).toBe(img[0].length);
  });

  test('applySobel2D returns magnitude and angle arrays', () => {
    const img = [
      [0, 0, 0],
      [0, 255, 0],
      [0, 0, 0]
    ];
    const { mag, angle } = applySobel2D(img, 3, 3);
    expect(mag.length).toBe(3);
    expect(angle.length).toBe(3);
  });

  test('nonMaxSuppression returns same dimensions', () => {
    const mag = [
      [0, 1, 0],
      [1, 2, 1],
      [0, 1, 0]
    ];
    const angle = [
      [0, 0, 0],
      [0, 45, 0],
      [0, 0, 0]
    ];
    const suppressed = nonMaxSuppression(mag, angle, 3, 3);
    expect(suppressed.length).toBe(3);
    expect(suppressed[0].length).toBe(3);
  });

  test('scaleImage returns ImageData of correct size', async () => {
    const imgBitmap: any = {}; // mock ImageBitmap
    const data = await scaleImage(imgBitmap, 5, 5);
    expect(data.width).toBe(5);
    expect(data.height).toBe(5);
  });
});
