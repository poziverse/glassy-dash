/**
 * Coordinate System Tests
 * Tests for drawing coordinate normalization and transformation
 */

import { describe, it, expect } from 'vitest';
import { 
  normalizePoint, 
  denormalizePoint, 
  normalizePath, 
  denormalizePath,
  transformCoordinates,
  transformAllCoordinates,
  calculateBoundingBox,
  getAspectRatio,
  createDimensions,
  migrateLegacyDrawing
} from '../src/utils/drawing';

describe('Drawing Utilities - Coordinate System', () => {
  describe('normalizePoint', () => {
    it('should normalize a point to 0-1 range', () => {
      const point = { x: 400, y: 300 };
      const normalized = normalizePoint(point, 800, 600);
      
      expect(normalized.x).toBe(0.5);
      expect(normalized.y).toBe(0.5);
    });

    it('should handle zero width/height', () => {
      const point = { x: 100, y: 100 };
      const normalized = normalizePoint(point, 0, 0);
      
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('should normalize corner points', () => {
      const topLeft = normalizePoint({ x: 0, y: 0 }, 800, 600);
      const bottomRight = normalizePoint({ x: 800, y: 600 }, 800, 600);
      
      expect(topLeft.x).toBe(0);
      expect(topLeft.y).toBe(0);
      expect(bottomRight.x).toBe(1);
      expect(bottomRight.y).toBe(1);
    });
  });

  describe('denormalizePoint', () => {
    it('should denormalize a point from 0-1 range to pixels', () => {
      const normalized = { x: 0.5, y: 0.5 };
      const point = denormalizePoint(normalized, 800, 600);
      
      expect(point.x).toBe(400);
      expect(point.y).toBe(300);
    });

    it('should handle edge cases', () => {
      const edgeCases = [
        { input: { x: 0, y: 0 }, expected: { x: 0, y: 0 } },
        { input: { x: 1, y: 1 }, expected: { x: 800, y: 600 } },
        { input: { x: 0.25, y: 0.75 }, expected: { x: 200, y: 450 } }
      ];

      edgeCases.forEach(({ input, expected }) => {
        const result = denormalizePoint(input, 800, 600);
        expect(result.x).toBeCloseTo(expected.x, 0.1);
        expect(result.y).toBeCloseTo(expected.y, 0.1);
      });
    });
  });

  describe('transformCoordinates', () => {
    it('should transform coordinates from one viewport to another', () => {
      const path = { 
        points: [
          { x: 400, y: 300 },
          { x: 800, y: 600 }
        ]
      };
      
      const transformed = transformCoordinates(
        path,
        { width: 800, height: 600 },
        { width: 1920, height: 1080 }
      );
      
      expect(transformed.points[0].x).toBe(960);
      expect(transformed.points[0].y).toBe(540);
      expect(transformed.points[1].x).toBe(1920);
      expect(transformed.points[1].y).toBe(1080);
    });

    it('should maintain aspect ratio during transformation', () => {
      const path = { 
        points: [{ x: 400, y: 300 }]
      };
      
      const transformed = transformCoordinates(
        path,
        { width: 800, height: 600 },
        { width: 1600, height: 1200 }
      );
      
      // Should maintain relative position (still in center)
      expect(transformed.points[0].x / 1600).toBeCloseTo(0.5, 0.01);
      expect(transformed.points[0].y / 1200).toBeCloseTo(0.5, 0.01);
    });

    it('should handle null or undefined paths', () => {
      const result1 = transformCoordinates(null, { width: 800, height: 600 }, { width: 1920, height: 1080 });
      const result2 = transformCoordinates(undefined, { width: 800, height: 600 }, { width: 1920, height: 1080 });
      
      expect(result1).toBeNull();
      expect(result2).toBeUndefined();
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate bounding box for paths', () => {
      const paths = [
        { points: [{ x: 100, y: 100 }, { x: 200, y: 200 }] },
        { points: [{ x: 300, y: 50 }, { x: 400, y: 300 }] }
      ];
      
      const bounds = calculateBoundingBox(paths);
      
      expect(bounds.minX).toBe(100);
      expect(bounds.maxX).toBe(400);
      expect(bounds.minY).toBe(50);
      expect(bounds.maxY).toBe(300);
      expect(bounds.width).toBe(300);
      expect(bounds.height).toBe(250);
    });

    it('should return null for empty paths array', () => {
      const bounds = calculateBoundingBox([]);
      expect(bounds).toBeNull();
    });

    it('should return null for null paths', () => {
      const bounds = calculateBoundingBox(null);
      expect(bounds).toBeNull();
    });

    it('should handle single point paths', () => {
      const paths = [{ points: [{ x: 500, y: 500 }] }];
      const bounds = calculateBoundingBox(paths);
      
      expect(bounds.minX).toBe(500);
      expect(bounds.maxX).toBe(500);
      expect(bounds.minY).toBe(500);
      expect(bounds.maxY).toBe(500);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });
  });

  describe('getAspectRatio', () => {
    it('should calculate aspect ratio correctly', () => {
      expect(getAspectRatio(800, 600)).toBeCloseTo(1.33, 2);
      expect(getAspectRatio(1920, 1080)).toBeCloseTo(1.78, 2);
      expect(getAspectRatio(750, 850)).toBeCloseTo(0.88, 2);
    });

    it('should handle zero height', () => {
      const result = getAspectRatio(800, 0);
      expect(result).toBe(0); // Should return 0, not NaN or Infinity
    });

    it('should handle zero width', () => {
      const result = getAspectRatio(0, 600);
      expect(result).toBe(0);
    });
  });

  describe('createDimensions', () => {
    it('should create dimensions with all required fields', () => {
      const dims = createDimensions(800, 600);
      
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(600);
      expect(dims.viewportWidth).toBe(800);
      expect(dims.viewportHeight).toBe(600);
      expect(dims.aspectRatio).toBeCloseTo(1.33, 2);
      expect(dims.createdAt).toBeDefined();
    });

    it('should include timestamp', () => {
      const dims = createDimensions(1000, 800);
      const timestamp = new Date(dims.createdAt);
      
      expect(timestamp instanceof Date).toBe(true);
      expect(Date.now() - timestamp.getTime()).toBeLessThan(1000); // Within last second
    });
  });

  describe('migrateLegacyDrawing', () => {
    it('should migrate old array format', () => {
      const oldDrawing = [
        { points: [{ x: 100, y: 100 }] }
      ];
      
      const migrated = migrateLegacyDrawing(oldDrawing);
      
      expect(migrated.paths).toEqual(oldDrawing);
      expect(migrated.dimensions.width).toBe(800);
      expect(migrated.dimensions.height).toBe(600);
      expect(migrated.dimensions.viewportWidth).toBe(800);
      expect(migrated.dimensions.viewportHeight).toBe(600);
      expect(migrated.dimensions.aspectRatio).toBeCloseTo(1.33, 2);
      expect(migrated.dimensions.migrated).toBe(true);
    });

    it('should preserve new format with dimensions', () => {
      const newDrawing = {
        paths: [{ points: [{ x: 100, y: 100 }] }],
        dimensions: {
          width: 1000,
          height: 800,
          viewportWidth: 1000,
          viewportHeight: 800,
          aspectRatio: 1.25
        }
      };
      
      const migrated = migrateLegacyDrawing(newDrawing);
      
      expect(migrated).toEqual(newDrawing);
    });

    it('should handle empty/null drawings', () => {
      const result1 = migrateLegacyDrawing(null);
      const result2 = migrateLegacyDrawing(undefined);
      
      expect(result1.paths).toEqual([]);
      expect(result2.paths).toEqual([]);
      expect(result1.dimensions.width).toBe(800);
      expect(result2.dimensions.width).toBe(800);
    });

    it('should handle object with paths but no dimensions', () => {
      const partialDrawing = {
        paths: [{ points: [{ x: 100, y: 100 }] }]
      };
      
      const migrated = migrateLegacyDrawing(partialDrawing);
      
      expect(migrated.paths).toEqual(partialDrawing.paths);
      expect(migrated.dimensions.width).toBe(800);
      expect(migrated.dimensions.height).toBe(600);
      expect(migrated.dimensions.migrated).toBe(true);
    });
  });
});

describe('Integration Tests - Cross-Device Drawing', () => {
  it('should maintain drawing position across different viewports', () => {
    // Drawing created on desktop (1920x1080)
    const desktopPath = {
      tool: 'pen',
      color: '#000000',
      size: 4,
      points: [
        { x: 960, y: 540 },  // Center of 1920x1080
        { x: 1000, y: 600 }
      ]
    };

    // Transform to laptop (1366x768)
    const laptopPath = transformCoordinates(
      desktopPath,
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 }
    );

    // Should maintain relative position (roughly center)
    expect(laptopPath.points[0].x).toBeCloseTo(683, 5);
    expect(laptopPath.points[0].y).toBeCloseTo(384, 5);

    // Transform to tablet (768x1024)
    const tabletPath = transformCoordinates(
      desktopPath,
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 }
    );

    expect(tabletPath.points[0].x).toBeCloseTo(384, 5);
    expect(tabletPath.points[0].y).toBeCloseTo(512, 5);
  });

  it('should handle multi-page drawings correctly', () => {
    const singlePage = createDimensions(800, 600);
    const doublePage = createDimensions(800, 1200);
    
    expect(singlePage.aspectRatio).toBeCloseTo(1.33, 2);
    expect(doublePage.aspectRatio).toBeCloseTo(0.67, 2);
  });
});