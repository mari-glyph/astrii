import { useState, useCallback } from 'react';

export interface ImageState {
  bitmap: ImageBitmap | null;
  file: File | null;
  width: number;
  height: number;
}

export function useImageInput() {
  const [imageState, setImageState] = useState<ImageState>({
    bitmap: null,
    file: null,
    width: 0,
    height: 0,
  });

  const handleImageLoad = useCallback((bitmap: ImageBitmap, file: File | null) => {
    // Clean up previous bitmap
    if (imageState.bitmap) {
      imageState.bitmap.close();
    }

    setImageState({
      bitmap,
      file,
      width: bitmap.width,
      height: bitmap.height,
    });
  }, [imageState.bitmap]);

  const clearImage = useCallback(() => {
    if (imageState.bitmap) {
      imageState.bitmap.close();
    }
    setImageState({
      bitmap: null,
      file: null,
      width: 0,
      height: 0,
    });
  }, [imageState.bitmap]);

  return {
    imageState,
    handleImageLoad,
    clearImage,
  };
}