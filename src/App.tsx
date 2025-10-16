import ImageInput from './components/ImageInput';
import { useImageInput } from './hooks/useImageInput';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function App() {
  const { imageState, handleImageLoad, clearImage } = useImageInput();

  // 🔍 Debug logging whenever imageState updates
  useEffect(() => {
    if (imageState.bitmap) {
      console.group('[ImageInput Debug]');
      console.log('Bitmap size:', {
        width: imageState.width,
        height: imageState.height,
      });
      console.log('File info:', imageState.file);
      console.log('Preview URL:', imageState.previewUrl);
      console.groupEnd();
    } else {
      console.info('[ImageInput Debug] Cleared image state.');
    }
  }, [imageState]);

  // 🔍 Optional wrapper for additional debug logging
  const handleDebugLoad = (bitmap: ImageBitmap, file: File | null, previewUrl: string) => {
    console.info('[ImageInput Debug] Image loaded via ImageInput');
    console.log({ bitmap, file, previewUrl });
    handleImageLoad(bitmap, file, previewUrl);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-semibold mb-4">🧩 Image Input (Debug Mode)</h1>

      {!imageState.previewUrl ? (
        <ImageInput onImageLoad={handleDebugLoad} />
      ) : (
        <div className="relative">
          <button
            onClick={() => {
              console.info('[ImageInput Debug] Clear button clicked.');
              clearImage();
            }}
            className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full transition"
            aria-label="Clear image"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <img
            src={imageState.previewUrl}
            alt="Preview"
            className="max-w-xs rounded-lg border border-gray-700"
            onLoad={() => console.info('[ImageInput Debug] Preview image rendered.')}
            onError={() => console.error('[ImageInput Debug] Failed to render preview.')}
          />

          <div className="mt-2 text-sm text-gray-400 text-center">
            {imageState.width}×{imageState.height}px
            {imageState.file && (
              <span className="block text-xs text-gray-500 mt-1">
                {imageState.file.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
