// ImageInput.tsx
import { useState, useRef, ChangeEvent, useCallback } from 'react';
import { Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface ImageInputProps {
  onImageLoad: (bitmap: ImageBitmap, file: File | null, previewUrl: string) => void;
  onError?: (error: string) => void;
  maxSize?: number;       // MB
  maxDimensions?: number; // max width or height (px)
}

export default function ImageInput({
  onImageLoad,
  onError,
  maxSize = 10,
  maxDimensions = 4096,
}: ImageInputProps) {
  // === Local State ===
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ useCallback ensures referential stability (avoids re-creating function on every render)
  const handleError = useCallback((message: string) => {
    setError(message);
    onError?.(message); // Optional chaining — only call if defined
    setLoading(false);
  }, [onError]);

  // === Utility: Create ImageBitmap with fallback for Safari/older browsers ===
  const createBitmapFromFile = useCallback(async (file: File | Blob): Promise<ImageBitmap> => {
    if ('createImageBitmap' in window) return await createImageBitmap(file);
    return await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const bitmapLike = {
          width: img.width,
          height: img.height,
          close: () => {},
        } as ImageBitmap;
        URL.revokeObjectURL(url);
        resolve(bitmapLike);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }, []);

  // === Core: Process and validate image ===
  const processImage = useCallback(async (file: File | Blob) => {
    try {
      setLoading(true);
      setError(null);

      // File type validation (only for File, not Blob from fetch)
      if (file instanceof File && !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // File size validation
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSize}MB`);
      }

      const bitmap = await createBitmapFromFile(file);

      // Dimension validation
      if (bitmap.width > maxDimensions || bitmap.height > maxDimensions) {
        bitmap.close?.();
        throw new Error(`Image dimensions exceed ${maxDimensions}×${maxDimensions}px`);
      }

      const previewUrl = URL.createObjectURL(file);
      onImageLoad(bitmap, file instanceof File ? file : null, previewUrl);
    } catch (err) {
      // Centralized error capture
      const message = err instanceof Error ? err.message : 'Failed to load image';
      handleError(message);
    } finally {
      setLoading(false);
    }
  }, [createBitmapFromFile, handleError, maxSize, maxDimensions, onImageLoad]);

  // === Event handlers ===
  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImage(file);
    // Optional: clear input value so same file can be re-uploaded if needed
    e.target.value = '';
  }, [processImage]);

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(urlInput, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) throw new Error('URL does not point to a valid image');

      const blob = await response.blob();
      await processImage(blob);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load image from URL';
      handleError(message);
    } finally {
      setLoading(false);
    }
  }, [urlInput, processImage, handleError]);

  // === UI ===
  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-4">
        {/* File Upload Section */}
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
              border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${loading
                ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                : 'border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-750'}
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
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

        {/* URL Input Section */}
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
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div
            role="alert"
            aria-live="polite" // accessibility improvement
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
