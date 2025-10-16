// worker context

self.addEventListener('message', (e) => {
  const bitmap = e.data as ImageBitmap;

  // example processing: log metadata
  console.log('[worker] received bitmap', bitmap.width, bitmap.height);

  // temp simulate processing (like resizing, filters, etc.)
  self.postMessage({
    success: true,
    width: bitmap.width,
    height: bitmap.height,
  });

  // release memory
  bitmap.close();
});
