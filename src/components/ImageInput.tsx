import { useState, useRef, ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface ImageInputProps {
  onImageLoad: (bitmap: ImageBitmap, file: File | null, previewUrl: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // MB
  maxDimensions?: number; // px
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

  /** Shared error handler */
  const handleError = (msg: string) => {
    setError(msg);
    onError?.(msg);
    setLoading(false);
  };

  /** Creates an ImageBitmap with fallback */
  const toBitmap = async (src: File | Blob) => {
    if ('createImageBitmap' in window) return await createImageBitmap(src);
    const img = new Image();
    const url = URL.createObjectURL(src);
    return await new Promise<ImageBitmap>((res, rej) => {
      img.onload = () => {
        URL.revokeObjectURL(url);
        res({ width: img.width, height: img.height, close: () => {} } as ImageBitmap);
      };
      img.onerror = () => rej(new Error('Failed to load image'));
      img.src = url;
    });
  };

  /** Validates and processes image file or blob */
  const processImage = async (src: File | Blob, file?: File) => {
    setLoading(true);
    setError(null);
    try {
      if (file && !file.type.startsWith('image/')) throw new Error('Invalid image file');
      if (src.size > maxSize * 1024 * 1024) throw new Error(`File size exceeds ${maxSize}MB`);

      const bitmap = await toBitmap(src);
      if (bitmap.width > maxDimensions || bitmap.height > maxDimensions) {
        bitmap.close();
        throw new Error(`Image exceeds ${maxDimensions}×${maxDimensions}px`);
      }

      const previewUrl = URL.createObjectURL(src);
      onImageLoad(bitmap, file ?? null, previewUrl);
    } catch (e) {
      handleError(e instanceof Error ? e.message : 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  /** File input handler */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file, file);
  };

  /** URL input handler */
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(urlInput, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
      const blob = await res.blob();
      const type = blob.type || res.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error('Not a valid image URL');
      await processImage(blob);
    } catch (e) {
      handleError(e instanceof Error ? e.message : 'Failed to load image from URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* File Input */}
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
            : 'border-gray-600 hover:border-blue-500 bg-gray-800 hover:bg-gray-750'}
        `}
      >
        <Upload className={`w-10 h-10 mb-3 ${loading ? 'text-gray-600' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-400 font-semibold mb-1">Click to upload an image</p>
        <p className="text-xs text-gray-500">
          PNG, JPG, WebP (max {maxSize}MB, {maxDimensions}×{maxDimensions}px)
        </p>
      </label>

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

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}