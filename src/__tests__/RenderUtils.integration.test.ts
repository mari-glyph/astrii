// src/__tests__/RenderUtils.integration.test.ts

import {
  clamp,
  luminance,
  applyContrastBrightness,
  mapToChar,
  scaleImage,
  rgbToHex,
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
        data: new Uint8ClampedArray([
          // r,g,b,a repeated for 5x5 pixels (25 pixels)
          ...Array(25).fill([100, 150, 200, 255]).flat(),
        ]),
      }),
    };
  }
}
global.OffscreenCanvas = MockOffscreenCanvas as any;

describe('RenderUtils ascii pipeline integration', () => {
  test('generates 2d ascii array from mock image', async () => {
    const cols = 5;
    const rows = 5;
    const charset = '@%#*+=-:. '; // light → dark

    // simulate scaleImage
    const imgData = await scaleImage({} as any, cols, rows);

    // convert to 2D luminance array
    const gray: number[][] = [];
    for (let y = 0; y < rows; y++) {
      gray[y] = [];
      for (let x = 0; x < cols; x++) {
        const idx = (y * cols + x) * 4;
        const r = imgData.data[idx];
        const g = imgData.data[idx + 1];
        const b = imgData.data[idx + 2];
        gray[y][x] = luminance(r, g, b); // no gamma for now
      }
    }

    // apply contrast/brightness
    const contrast = 50;
    const brightness = 10;
    const adjusted: number[][] = gray.map((row) =>
      row.map((lum) => applyContrastBrightness(lum, contrast, brightness))
    );

    // map to ASCII
    const ascii: string[][] = adjusted.map((row) =>
      row.map((lum) => mapToChar(lum, charset))
    );

    // assertions
    expect(ascii.length).toBe(rows);
    expect(ascii[0].length).toBe(cols);

    // all chars must exist in charset
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        expect(charset.includes(ascii[y][x])).toBe(true);
      }
    }

    console.log('ascii output:', ascii);
  });
});
