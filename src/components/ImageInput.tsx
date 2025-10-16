import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, X, AlertCircle } from 'lucide-react';

interface ImageInputProps {
  onImageLoad: (bitmap: ImageBitmap, file: File | null) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in MB
  maxDimensions?: number; // max width or height
}

export default function ImageInput({
  onImageLoad,
  onError,
  maxSize = 10,
  maxDimensions = 4096,
}: ImageInputProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleError = (message: string) => {
    setError(message);
    onError?.(message);
    setLoading(false);
  };

  const validateImage = async (
    file: File | Blob,
    source: string
  ): Promise<ImageBitmap | null> => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      handleError(
        `File size exceeds ${maxSize}MB. Please choose a smaller image.`
      );
      return null;
    }

    try {
      // Create ImageBitmap with fallback
      let bitmap: ImageBitmap;

      if ('createImageBitmap' in window) {
        bitmap = await createImageBitmap(file);
      } else {
        // Fallback for browsers without createImageBitmap
        bitmap = await createImageBitmapFallback(file);
      }

      // Validate dimensions
      if (bitmap.width > maxDimensions || bitmap.height > maxDimensions) {
        bitmap.close();
        handleError(
          `Image dimensions exceed ${maxDimensions}×${maxDimensions}px. Current: ${bitmap.width}×${bitmap.height}px`
        );
        return null;
      }

      return bitmap;
    } catch (err) {
      handleError(`Failed to load image: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  };

  const createImageBitmapFallback = (file: File | Blob): Promise<ImageBitmap> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Create a canvas-based ImageBitmap substitute
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        
        // Return a mock ImageBitmap
        resolve({
          width: img.width,
          height: img.height,
          close: () => {},
        } as ImageBitmap);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const processImage = async (file: File | Blob, isFile: boolean) => {
    setLoading(true);
    setError(null);

    const bitmap = await validateImage(file, isFile ? 'file' : 'url');

    if (bitmap) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Pass bitmap to parent
      onImageLoad(bitmap, isFile ? (file as File) : null);
    }

    setLoading(false);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      handleError('Please select a valid image file');
      return;
    }

    await processImage(file, true);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch image with CORS
      const response = await fetch(urlInput, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      const blob = await response.blob();
      await processImage(blob, false);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('CORS')) {
        handleError(
          'CORS error: The image URL does not allow cross-origin access. Try uploading the file directly.'
        );
      } else {
        handleError(
          err instanceof Error ? err.message : 'Failed to load image from URL'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError(null);
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Preview Section */}
      {preview && (
        <div className="mb-6 relative bg-gray-800 rounded-lg p-4 border border-gray-700">
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-2 bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-64 mx-auto rounded"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Section */}
      {!preview && (
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`
                flex flex-col items-center justify-center w-full h-48 
                border-2 border-dashed rounded-lg cursor-pointer
                transition-colors
                ${loading 
                  ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' 
                  : 'border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-750'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={`w-10 h-10 mb-3 ${loading ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WebP (max {maxSize}MB, {maxDimensions}×{maxDimensions}px)
                </p>
              </div>
            </label>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-950 text-gray-500">or</span>
            </div>
          </div>

          {/* URL Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="Paste image URL..."
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
                         text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 
                         focus:ring-blue-500 focus:border-transparent disabled:opacity-50 
                         disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleUrlSubmit}
              disabled={loading || !urlInput.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 
                       disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !preview && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-400">Processing image...</p>
        </div>
      )}
    </div>
  );
}