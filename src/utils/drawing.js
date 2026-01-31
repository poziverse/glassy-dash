/**
 * Drawing Utilities
 * Helper functions for coordinate transformation and normalization
 */

/**
 * Normalize a point to 0-1 range (percentage coordinates)
 * @param {Object} point - Point with x, y in pixels
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {Object} Normalized point with x, y in 0-1 range
 */
export const normalizePoint = (point, width, height) => ({
  x: width > 0 ? point.x / width : 0,
  y: height > 0 ? point.y / height : 0
});

/**
 * Denormalize a point from 0-1 range to pixels
 * @param {Object} point - Point with x, y in 0-1 range
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {Object} Point with x, y in pixels
 */
export const denormalizePoint = (point, width, height) => ({
  x: point.x * width,
  y: point.y * height
});

/**
 * Normalize all points in a path
 * @param {Object} path - Path with points array
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {Object} Path with normalized points
 */
export const normalizePath = (path, width, height) => ({
  ...path,
  points: path.points.map(p => normalizePoint(p, width, height))
});

/**
 * Denormalize all points in a path
 * @param {Object} path - Path with normalized points
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {Object} Path with pixel points
 */
export const denormalizePath = (path, width, height) => ({
  ...path,
  points: path.points.map(p => denormalizePoint(p, width, height))
});

/**
 * Transform coordinates from one viewport to another
 * @param {Object} path - Path with points array
 * @param {Object} fromDims - Source dimensions {width, height}
 * @param {Object} toDims - Target dimensions {width, height}
 * @returns {Object} Transformed path
 */
export const transformCoordinates = (path, fromDims, toDims) => {
  if (!path || !path.points || !fromDims || !toDims) return path;

  const scaleX = toDims.width / fromDims.width;
  const scaleY = toDims.height / fromDims.height;

  return {
    ...path,
    points: path.points.map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY
    }))
  };
};

/**
 * Transform all paths from one viewport to another
 * @param {Array} paths - Array of paths
 * @param {Object} fromDims - Source dimensions {width, height}
 * @param {Object} toDims - Target dimensions {width, height}
 * @returns {Array} Transformed paths
 */
export const transformAllCoordinates = (paths, fromDims, toDims) => {
  if (!paths || !paths.length) return [];
  return paths.map(path => transformCoordinates(path, fromDims, toDims));
};

/**
 * Calculate bounding box of all points in paths
 * @param {Array} paths - Array of paths with points
 * @returns {Object|null} Bounding box {minX, maxX, minY, maxY, width, height} or null
 */
export const calculateBoundingBox = (paths) => {
  if (!paths || !paths.length) return null;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  paths.forEach(path => {
    if (!path.points || !path.points.length) return;
    path.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
  });

  if (minX === Infinity) return null;

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Calculate aspect ratio from dimensions
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @returns {number} Aspect ratio (width/height)
 */
export const getAspectRatio = (width, height) => {
  if (!height || height === 0) return 0;
  if (!width) return 0;
  return width / height;
};

/**
 * Create default dimensions metadata
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @returns {Object} Dimensions metadata object
 */
export const createDimensions = (width, height) => ({
  width,
  height,
  viewportWidth: width,
  viewportHeight: height,
  aspectRatio: getAspectRatio(width, height),
  createdAt: new Date().toISOString()
});

/**
 * Migrate legacy drawing to new format with dimensions
 * @param {*} drawing - Drawing data (array or object)
 * @returns {Object} Migrated drawing with dimensions
 */
export const migrateLegacyDrawing = (drawing) => {
  // Old format: just an array of paths
  if (Array.isArray(drawing)) {
    return {
      paths: drawing,
      dimensions: {
        ...createDimensions(800, 600),
        migrated: true
      }
    };
  }

  // New format: already has dimensions
  if (drawing && typeof drawing === 'object' && drawing.dimensions) {
    return drawing;
  }

  // Unknown format: treat as paths array
  if (drawing && typeof drawing === 'object' && drawing.paths) {
    return {
      paths: drawing.paths,
      dimensions: {
        ...createDimensions(800, 600),
        migrated: true
      }
    };
  }

  // Empty or invalid: return empty drawing
  return {
    paths: [],
    dimensions: createDimensions(800, 600)
  };
};
