import ImageInput from './components/ImageInput.tsx';
import { useImageInput } from './hooks/useImageInput';
import { X } from 'lucide-react';

export default function App() {
  const { imageState, handleImageLoad, clearImage } = useImageInput();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Image Input Test</h1>

      {/* Image Input */}
      {!imageState.previewUrl ? (
        <ImageInput onImageLoad={handleImageLoad} />
      ) : (
        <div className="relative bg-gray-800 p-4 rounded-lg mb-6">
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-2 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={imageState.previewUrl}
            alt="Preview"
            className="max-w-full max-h-64 mx-auto rounded"
          />
          <p className="mt-2 text-sm text-gray-400">
            Dimensions: {imageState.width}×{imageState.height}px
          </p>
          {imageState.file && (
            <p className="text-xs text-gray-500">File: {imageState.file.name}</p>
          )}
        </div>
      )}
    </div>
  );
}
