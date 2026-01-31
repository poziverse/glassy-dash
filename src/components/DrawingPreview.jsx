import React, { useRef, useEffect, useState } from 'react';
import { calculateBoundingBox, migrateLegacyDrawing } from '../utils/drawing';

export function DrawingPreview({ data, width, height, darkMode = false }) {
  const canvasRef = useRef(null);
  const [previewAllPages, setPreviewAllPages] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Migrate and parse drawing data
    const migrated = migrateLegacyDrawing(data);
    let paths = migrated.paths || [];
    const dimensions = migrated.dimensions;
    
    let originalWidth = dimensions?.width || 800;
    let originalHeight = dimensions?.height || 600;
    const aspectRatio = dimensions?.aspectRatio || (originalWidth / originalHeight);

    // Calculate page count based on aspect ratio
    // If aspect ratio is significantly larger than 1.5, assume multi-page
    const estimatedPageCount = aspectRatio > 1.5 ? Math.round(aspectRatio) : 1;
    setPageCount(estimatedPageCount);

    // Filter paths based on page selection
    const firstPageHeight = originalHeight / estimatedPageCount;
    paths = paths.filter(path => {
      if (!path.points || path.points.length === 0) return false;
      
      if (previewAllPages) {
        // Show all pages, no filtering
        return true;
      }
      
      // Show only current page
      const pageTop = (currentPage - 1) * firstPageHeight;
      const pageBottom = currentPage * firstPageHeight;
      
      // Include path if any point is in current page
      return path.points.some(point => 
        point.y >= pageTop && point.y < pageBottom
      );
    });

    // Adjust Y coordinates for multi-page preview
    if (!previewAllPages && currentPage > 1) {
      const offset = (currentPage - 1) * firstPageHeight;
      paths = paths.map(path => ({
        ...path,
        points: path.points.map(p => ({
          ...p,
          y: p.y - offset
        }))
      }));
    }

    // Convert black/white strokes based on current theme for optimal contrast
    paths = paths.map(path => {
      // Only convert black/white strokes for better contrast, keep other colors as-is
      if (darkMode) {
        // In dark mode, ensure black strokes are white for visibility
        if (path.color === '#000000') {
          return { ...path, color: '#FFFFFF' };
        }
      } else {
        // In light mode, ensure white strokes are black for visibility
        if (path.color === '#FFFFFF') {
          return { ...path, color: '#000000' };
        }
      }
      return path;
    });

    // Use improved bounding box calculation
    const bounds = calculateBoundingBox(paths);
    
    let scale, offsetX, offsetY;
    const previewWidth = width;
    const previewHeight = height;

    if (!bounds || !paths.length) {
      // Fallback for empty drawings
      const firstPageHeight = originalHeight / pageCount;
      scale = Math.min(width / originalWidth, height / firstPageHeight);
      offsetX = (width - originalWidth * scale) / 2;
      offsetY = (height - firstPageHeight * scale) / 2;
    } else {
      // Content-aware scaling with improved padding
      const contentWidth = bounds.width;
      const contentHeight = bounds.height;
      
      // Add minimum padding (20px or 15%, whichever is larger)
      const padding = Math.max(20, Math.max(contentWidth, contentHeight) * 0.15);
      const paddedWidth = contentWidth + padding * 2;
      const paddedHeight = contentHeight + padding * 2;

      scale = Math.min(width / paddedWidth, height / paddedHeight);
      
      // Center the content in the preview
      offsetX = (width - contentWidth * scale) / 2 - bounds.minX * scale;
      offsetY = (height - contentHeight * scale) / 2 - bounds.minY * scale;
    }

    // Set canvas dimensions to match preview container exactly
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // Clear canvas
    ctx.clearRect(0, 0, previewWidth, previewHeight);

    if (paths.length === 0) {
      // Draw a subtle placeholder
      ctx.strokeStyle = darkMode ? '#374151' : '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(10, 10, previewWidth - 20, previewHeight - 20);

      ctx.fillStyle = darkMode ? '#6b7280' : '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Empty', previewWidth / 2, previewHeight / 2 + 3);
      
      // Draw multi-page indicator
      if (pageCount > 1) {
        ctx.fillStyle = darkMode ? '#6b7280' : '#9ca3af';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${pageCount} pages`, previewWidth / 2, previewHeight - 10);
      }
      
      return;
    }

    // Draw paths at scaled and centered size
    paths.forEach(path => {
      if (path.points && path.points.length > 0) {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = Math.max(1, path.size * scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (path.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.beginPath();
        if (path.points && path.points.length > 0) {
          ctx.moveTo(path.points[0].x * scale + offsetX, path.points[0].y * scale + offsetY);

          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x * scale + offsetX, path.points[i].y * scale + offsetY);
          }

          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    });
  }, [data, width, height, darkMode]);

  return (
    <div className="flex flex-col items-center justify-center h-32 rounded overflow-hidden relative">
      {/* Page navigation for multi-page drawings */}
      {pageCount > 1 && !previewAllPages && (
        <>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs"
            title="Previous page"
          >
            ê
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
            disabled={currentPage === pageCount}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs"
            title="Next page"
          >
            í
          </button>
        </>
      )}

      {/* Page indicator */}
      {pageCount > 1 && !previewAllPages && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 rounded-full px-2 py-1">
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentPage - 1 ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Toggle preview all pages */}
      {pageCount > 1 && (
        <button
          onClick={() => {
            setPreviewAllPages(!previewAllPages);
            setCurrentPage(1);
          }}
          className="absolute top-1 right-1 text-xs bg-black/50 hover:bg-black/70 text-white rounded px-1.5 py-0.5"
          title={previewAllPages ? 'Show single page' : 'Show all pages'}
        >
          {previewAllPages ? '1x' : 'All'}
        </button>
      )}

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}
