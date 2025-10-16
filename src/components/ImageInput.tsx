import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface ImageInputProps {
  onImageLoad: (bitmap: ImageBitmap, file: File | null, previewUrl: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // mb
  maxDimensions?: number; // max width or height
}

export default function ImageInput({
  onImageLoad,
  onError,
  maxSize = 10,
  maxDimensions = 4096,
}: ImageInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // handles and propagates errors consistently
  const handleError = (message: string) => {
    setError(message);
    onError?.(message);
    setLoading(false);
  };

  // decodes an image bitmap safely with safari fallback
  const createBitmapFromFile = async (file: File | Blob): Promise<ImageBitmap> => {
    try {
      if (typeof window.createImageBitmap === 'function') {
        try {
          return await window.createImageBitmap(file);
        } catch (err) {
          console.warn('[ImageInput] createImageBitmap failed, using fallback:', err);
        }
      }

      // fallback: manually load image for older safari
      return await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({
            width: img.width,
            height: img.height,
            close: () => {},
          } as ImageBitmap);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('failed to load image'));
        };
        img.src = url;
      });
    } catch {
      throw new Error('failed to create image bitmap');
    }
  };

  // validates and processes image files or blobs
  const processImage = async (file: File | Blob) => {
    setLoading(true);
    setError(null);

    // validate type
    if (file instanceof File && !file.type.startsWith('image/')) {
      handleError('please select a valid image file');
      return;
    }

    // validate size
    if (file.size > maxSize * 1024 * 1024) {
      handleError(`file size exceeds ${maxSize}mb`);
      return;
    }

    try {
      const bitmap = await createBitmapFromFile(file);

      // validate dimensions
      if (bitmap.width > maxDimensions || bitmap.height > maxDimensions) {
        bitmap.close?.();
        handleError(`image dimensions exceed ${maxDimensions}×${maxDimensions}px`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      onImageLoad(bitmap, file instanceof File ? file : null, previewUrl);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'failed to load image');
    } finally {
      setLoading(false);
    }
  };

  // handles file selection from local input
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processImage(file);
  };

  // handles loading image from url input
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // fetch remote image with cors validation
      const response = await fetch(urlInput, { mode: 'cors', credentials: 'omit' });

      // check non-ok responses
      if (!response.ok) throw new Error(`failed to fetch image: ${response.statusText}`);

      // detect blocked or restricted responses (safari, no-cors)
      if (response.type === 'opaque') {
        throw new Error('image blocked by cors policy — source server must allow cross-origin access');
      }

      // validate mime type
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) throw new Error('url does not point to a valid image');

      // convert to blob for processing
      const blob = await response.blob();
      await processImage(blob);
    } catch (err) {
      const message =
        err instanceof TypeError
          ? 'image fetch failed — possible cors restriction or invalid url'
          : (err as Error).message;

      console.error('[ImageInput] url import error:', message);
      handleError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-4">
        {/* file input */}
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
          className={`flex flex-col items-center justify-center w-full h-48
                      border-2 border-dashed rounded-lg cursor-pointer transition-colors
                      ${loading
                        ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                        : 'border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-750'}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-10 h-10 mb-3 ${loading ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-400 font-semibold mb-1">click to upload an image</p>
            <p className="text-xs text-gray-500">
              png, jpg, webp (max {maxSize}mb, {maxDimensions}×{maxDimensions}px)
            </p>
          </div>
        </label>

        {/* url input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="paste image url..."
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
            {loading ? 'loading...' : 'load'}
          </button>
        </div>

        {/* error display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}