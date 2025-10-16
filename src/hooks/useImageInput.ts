import { useState, useCallback } from 'react';

//Manage image state cross-app
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

  //hangle incoming image from ImageInput & cleans up prev img
  const handleImageLoad = useCallback((bitmap: ImageBitmap, file: File | null, previewUrl: string) => {
    setImageState(prev => {
      prev.bitmap?.close();
      if (prev.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return {
        bitmap,
        file,
        width: bitmap.width,
        height: bitmap.height,
        previewUrl,
      };
    });
  }, []);

  //Reset image state & clean up resources
  const clearImage = useCallback(() => {
    setImageState(prev => {
      prev.bitmap?.close();
      if (prev.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { bitmap: null, file: null, width: 0, height: 0, previewUrl: null };
    });
  }, []);

  return {
    imageState,
    handleImageLoad,
    clearImage,
  };
}
