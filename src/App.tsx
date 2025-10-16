import { useState } from 'react';
import ImageInput from './components/ImageInput';
import { useImageInput } from './hooks/useImageInput';

function App() {
  const { imageState, handleImageLoad } = useImageInput();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Astrii</h1>
          <p className="text-gray-400">ASCII Art Animation Studio</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6">Import Image</h2>
          
          <ImageInput 
            onImageLoad={handleImageLoad}
            onError={setError}
          />

          {/* Display Image Info */}
          {imageState.bitmap && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-2">Image Loaded ✓</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Dimensions: {imageState.width} × {imageState.height}px</p>
                {imageState.file && (
                  <>
                    <p>Filename: {imageState.file.name}</p>
                    <p>Size: {(imageState.file.size / 1024 / 1024).toFixed(2)}MB</p>
                    <p>Type: {imageState.file.type}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 text-center text-red-400 text-sm">
            Last error: {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;