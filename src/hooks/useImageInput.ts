import { useState, useCallback } from 'react';

export interface ImageState {
  bitmap: ImageBitmap | null;
  file: File | null;
  width: number;
  height: number;
  previewUrl: string | null;
}

export function useImageInput() {
  const [imageState, setImageState] = useState<ImageState>({
    bitmap: null,
    file: null,
    width: 0,
    height: 0,
    previewUrl: null,
  });

  /* cleans up bitmap and object URLs to prevent memory leaks */
  const cleanup = (prev: ImageState) => {
    prev.bitmap?.close();
    if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
  };

  /* stores a new image and releases old resources */
  const handleImageLoad = useCallback((bitmap: ImageBitmap, file: File | null, previewUrl: string) => {
    setImageState(prev => {
      cleanup(prev);
      return { bitmap, file, width: bitmap.width, height: bitmap.height, previewUrl };
    });
  }, []);

  /* clears image and releases resources */
  const clearImage = useCallback(() => {
    setImageState(prev => {
      cleanup(prev);
      return { bitmap: null, file: null, width: 0, height: 0, previewUrl: null };
    });
  }, []);

  return { imageState, handleImageLoad, clearImage };
}