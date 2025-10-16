import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';

/* ==========================================================
   universal image loader (safari-safe + memory-optimized)
   ========================================================== */
export const loadImageBitmap = async (file: Blob | File): Promise<ImageBitmap> => {
  // prefer native createImageBitmap if available
  if (typeof window.createImageBitmap === 'function') {
    try {
      return await window.createImageBitmap(file);
    } catch (err) {
      console.warn('[ImageInput] createImageBitmap failed, falling back to <img> method:', err);
    }
  }

  // safari / legacy fallback
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // reuse a single offscreen canvas for performance
        const canvas =
          (loadImageBitmap._canvas ||= document.createElement('canvas')) as HTMLCanvasElement;

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('failed to get 2d context');

        ctx.clearRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        URL.revokeObjectURL(url);

        // return a minimal imagebitmap-compatible object
        resolve({
          width: img.width,
          height: img.height,
          close: () => {},
        } as ImageBitmap);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('failed to load image for fallback'));
    };

    if ('decode' in img) img.decode?.().catch(() => {});
    img.src = url;
  });
};
loadImageBitmap._canvas = undefined as HTMLCanvasElement | undefined;

/* ==========================================================
   imageinput component
   ========================================================== */
interface ImageInputProps {
  onImageLoad: (bitmap: ImageBitmap, file: File | null, previewUrl: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in mb
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

  // unified error handler
  const handleError = (msg: string) => {
    setError(msg);
    onError?.(msg);
    setLoading(false);
  };

  // validate and process images
  const processImage = async (file: File | Blob) => {
    setLoading(true);
    setError(null);

    if (file instanceof File && !file.type.startsWith('image/'))
      return handleError('please select a valid image file');
    if (file.size > maxSize * 1024 * 1024)
      return handleError(`file size exceeds ${maxSize}mb`);

    try {
      const bitmap = await loadImageBitmap(file);
      if (bitmap.width > maxDimensions || bitmap.height > maxDimensions) {
        bitmap.close?.();
        return handleError(`image exceeds ${maxDimensions}×${maxDimensions}px`);
      }

      const previewUrl = URL.createObjectURL(file);
      onImageLoad(bitmap, file instanceof File ? file : null, previewUrl);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'failed to load image');
    } finally {
      setLoading(false);
    }
  };

  // handle file input
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processImage(file);
  };

  // handle url input
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(urlInput, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`failed to fetch image: ${response.statusText}`);

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) throw new Error('url is not an image');

      const blob = await response.blob();
      await processImage(blob);
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'failed to load image from url');
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     ui
     ========================================================== */
  return (
    <div className="w-full max-w-2xl">
      {/* file upload */}
      <div className="space-y-4">
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
        </div>

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

        {/* error message */}
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