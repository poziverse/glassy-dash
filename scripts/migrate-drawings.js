/**
 * Migration Script for Legacy Drawings
 * 
 * This script migrates old drawing format (array of paths) to new format
 * with dimensions metadata. This ensures compatibility with the new
 * dynamic canvas sizing system.
 * 
 * Usage:
 *   node scripts/migrate-drawings.js
 */

import { openDB } from '../src/utils/db';

/**
 * Migrate a single drawing to new format
 * @param {*} drawing - Drawing data (array or object)
 * @returns {Object} Migrated drawing with dimensions
 */
function migrateDrawing(drawing) {
  // Old format: just an array of paths
  if (Array.isArray(drawing)) {
    return {
      paths: drawing,
      dimensions: {
        width: 800,
        height: 600,
        viewportWidth: 800,
        viewportHeight: 600,
        aspectRatio: 800 / 600,
        createdAt: new Date().toISOString(),
        migrated: true
      }
    };
  }

  // New format: already has dimensions
  if (drawing && typeof drawing === 'object' && drawing.dimensions) {
    // Ensure dimensions have required fields
    const dims = drawing.dimensions;
    if (!dims.viewportWidth) {
      dims.viewportWidth = dims.width;
      dims.viewportHeight = dims.height;
    }
    if (!dims.aspectRatio) {
      dims.aspectRatio = dims.width / dims.height;
    }
    if (!dims.createdAt) {
      dims.createdAt = new Date().toISOString();
    }
    return drawing;
  }

  // Unknown format: treat as paths array
  if (drawing && typeof drawing === 'object' && drawing.paths) {
    return {
      paths: drawing.paths,
      dimensions: {
        width: 800,
        height: 600,
        viewportWidth: 800,
        viewportHeight: 600,
        aspectRatio: 800 / 600,
        createdAt: new Date().toISOString(),
        migrated: true
      }
    };
  }

  // Empty or invalid: return empty drawing
  return {
    paths: [],
    dimensions: {
      width: 800,
      height: 600,
      viewportWidth: 800,
      viewportHeight: 600,
      aspectRatio: 800 / 600,
      createdAt: new Date().toISOString(),
      migrated: true
    }
  };
}

/**
 * Main migration function
 */
async function migrateAllDrawings() {
  console.log('🎨 Drawing Migration Script');
  console.log('==========================');
  
  try {
    const db = await openDB();
    console.log('✓ Database opened');
    
    // Get all drawing notes
    const allNotes = await db.notes.toArray();
    const drawingNotes = allNotes.filter(note => note.type === 'draw');
    
    console.log(`\nFound ${drawingNotes.length} drawing notes`);
    
    if (drawingNotes.length === 0) {
      console.log('✓ No drawings to migrate');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const note of drawingNotes) {
      try {
        const currentContent = note.content;
        const migrated = migrateDrawing(currentContent);
        
        // Check if migration is needed
        const needsMigration = 
          !migrated.dimensions ||
          !migrated.dimensions.viewportWidth ||
          !migrated.dimensions.aspectRatio ||
          migrated.dimensions.migrated;
        
        if (needsMigration) {
          await db.notes.update(note.id, { content: migrated });
          migratedCount++;
          console.log(`  ✓ Migrated: ${note.title || note.id.substring(0, 8)}...`);
        } else {
          skippedCount++;
          console.log(`  ⊘ Skipped: ${note.title || note.id.substring(0, 8)}... (already migrated)`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error: ${note.title || note.id.substring(0, 8)}...`, error.message);
      }
    }

    console.log('\n==========================');
    console.log('Migration Summary:');
    console.log(`  Total drawings:     ${drawingNotes.length}`);
    console.log(`  Migrated:          ${migratedCount}`);
    console.log(`  Skipped:           ${skippedCount}`);
    console.log(`  Errors:            ${errorCount}`);
    console.log('==========================');
    console.log('\n✓ Migration complete!');
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some drawings had errors. Check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAllDrawings();