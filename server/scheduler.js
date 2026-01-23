/**
 * Task Scheduler
 * 
 * Schedules automated tasks like backups, log rotation, and cleanup.
 * Uses cron-like scheduling for recurring tasks.
 */

const cron = require('node-cron');
const { createBackup, cleanupOldBackups } = require('./migrations/backup');
const { rotateLogs, getLogStats } = require('./utils/logger');
const { runMigrations } = require('./migrations');

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

/**
 * Daily backup at 2 AM
 */
const dailyBackup = cron.schedule('0 2 * * *', async () => {
  console.log('🕒 Running scheduled daily backup...');
  try {
    createBackup();
    cleanupOldBackups(7); // Keep 7 days of backups
  } catch (err) {
    console.error('❌ Scheduled backup failed:', err.message);
  }
}, {
  scheduled: false, // Don't start automatically
  timezone: process.env.TZ || 'UTC',
});

/**
 * Hourly log rotation check
 */
const hourlyLogCheck = cron.schedule('0 * * * *', () => {
  console.log('🕒 Running scheduled log rotation check...');
  try {
    rotateLogs();
  } catch (err) {
    console.error('❌ Scheduled log rotation failed:', err.message);
  }
}, {
  scheduled: false,
  timezone: process.env.TZ || 'UTC',
});

/**
 * Weekly cleanup on Sunday at 3 AM
 */
const weeklyCleanup = cron.schedule('0 3 * * 0', async () => {
  console.log('🕒 Running scheduled weekly cleanup...');
  try {
    // Clean up old backups
    cleanupOldBackups(30); // Keep 30 days of backups
    
    // Rotate logs
    rotateLogs();
    
    // Run any pending migrations
    runMigrations();
    
    console.log('✅ Weekly cleanup completed');
  } catch (err) {
    console.error('❌ Scheduled cleanup failed:', err.message);
  }
}, {
  scheduled: false,
  timezone: process.env.TZ || 'UTC',
});

/**
 * Daily health check at 6 AM
 */
const dailyHealthCheck = cron.schedule('0 6 * * *', () => {
  console.log('🕒 Running scheduled health check...');
  try {
    const logStats = getLogStats();
    console.log('📊 Log Stats:', {
      appLog: logStats.appLog?.sizeMB,
      errorLog: logStats.errorLog?.sizeMB,
      totalSize: logStats.totalSizeMB,
    });
    
    // Check for large log files
    if (parseFloat(logStats.totalSizeMB) > 100) {
      console.warn('⚠️  Large log files detected, consider rotation');
    }
  } catch (err) {
    console.error('❌ Scheduled health check failed:', err.message);
  }
}, {
  scheduled: false,
  timezone: process.env.TZ || 'UTC',
});

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

/**
 * Start all scheduled tasks
 */
const startScheduler = () => {
  console.log('📅 Starting task scheduler...');
  
  dailyBackup.start();
  console.log('  ✅ Daily backup scheduled (2 AM)');
  
  hourlyLogCheck.start();
  console.log('  ✅ Hourly log check scheduled (every hour)');
  
  weeklyCleanup.start();
  console.log('  ✅ Weekly cleanup scheduled (Sunday 3 AM)');
  
  dailyHealthCheck.start();
  console.log('  ✅ Daily health check scheduled (6 AM)');
  
  console.log('✅ All scheduled tasks started');
};

/**
 * Stop all scheduled tasks
 */
const stopScheduler = () => {
  console.log('🛑 Stopping task scheduler...');
  
  dailyBackup.stop();
  hourlyLogCheck.stop();
  weeklyCleanup.stop();
  dailyHealthCheck.stop();
  
  console.log('✅ All scheduled tasks stopped');
};

/**
 * Manually trigger a task
 */
const triggerTask = (taskName) => {
  console.log(`⚡ Manually triggering task: ${taskName}`);
  
  switch (taskName) {
    case 'backup':
      dailyBackup.now();
      break;
    case 'log-rotation':
      hourlyLogCheck.now();
      break;
    case 'cleanup':
      weeklyCleanup.now();
      break;
    case 'health-check':
      dailyHealthCheck.now();
      break;
    default:
      console.error(`Unknown task: ${taskName}`);
      console.error('Available tasks: backup, log-rotation, cleanup, health-check');
  }
};

/**
 * Get task status
 */
const getTaskStatus = () => {
  return {
    dailyBackup: dailyBackup.getStatus ? 'running' : 'not implemented',
    hourlyLogCheck: hourlyLogCheck.getStatus ? 'running' : 'not implemented',
    weeklyCleanup: weeklyCleanup.getStatus ? 'running' : 'not implemented',
    dailyHealthCheck: dailyHealthCheck.getStatus ? 'running' : 'not implemented',
  };
};

// ============================================================================
// CLI INTERFACE
// ============================================================================

const command = process.argv[2];

switch (command) {
  case 'start':
    startScheduler();
    console.log('\nPress Ctrl+C to stop scheduler\n');
    
    // Keep process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, stopping scheduler...');
      stopScheduler();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, stopping scheduler...');
      stopScheduler();
      process.exit(0);
    });
    
    break;
  
  case 'stop':
    stopScheduler();
    break;
  
  case 'trigger':
    const task = process.argv[3];
    if (!task) {
      console.error('Error: Task name required');
      console.log('Usage: node server/scheduler.js trigger <task-name>');
      console.log('Available tasks: backup, log-rotation, cleanup, health-check');
      process.exit(1);
    }
    triggerTask(task);
    break;
  
  case 'status':
    const status = getTaskStatus();
    console.log('\n📊 Task Scheduler Status');
    console.log('═'.repeat(50));
    Object.entries(status).forEach(([name, state]) => {
      const icon = state === 'running' ? '✅' : '⚠️';
      console.log(`  ${icon} ${name}: ${state}`);
    });
    console.log('═'.repeat(50));
    break;
  
  default:
    console.log('Usage:');
    console.log('  node server/scheduler.js [command] [options]');
    console.log('');
    console.log('Commands:');
    console.log('  start              Start all scheduled tasks');
    console.log('  stop               Stop all scheduled tasks');
    console.log('  trigger <task>     Manually trigger a task');
    console.log('  status             Show task status');
    console.log('');
    console.log('Available tasks:');
    console.log('  backup             Create database backup');
    console.log('  log-rotation       Rotate log files');
    console.log('  cleanup            Run weekly cleanup');
    console.log('  health-check        Run health check');
    console.log('');
    console.log('Examples:');
    console.log('  node server/scheduler.js start');
    console.log('  node server/scheduler.js trigger backup');
    console.log('  node server/scheduler.js status');
    process.exit(1);
}

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  startScheduler,
  stopScheduler,
  triggerTask,
  getTaskStatus,
  dailyBackup,
  hourlyLogCheck,
  weeklyCleanup,
  dailyHealthCheck,
};