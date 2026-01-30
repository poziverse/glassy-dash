#!/bin/bash
# Cleanup script to stop duplicate development server instances
# This script kills all Vite dev servers except the most recent one

echo "🔍 Checking for running Vite processes..."

# Find all Vite dev servers
VITE_PIDS=$(pgrep -f "node.*vite" | sort -n)

if [ -z "$VITE_PIDS" ]; then
    echo "✅ No Vite servers running"
    exit 0
fi

# Count processes
COUNT=$(echo "$VITE_PIDS" | wc -l)
echo "📊 Found $COUNT Vite server process(es)"
echo ""
echo "Running processes:"
ps -p $VITE_PIDS -o pid,etime,cmd --no-headers | while read pid etime cmd; do
    echo "  PID $PID (running for $ETIME): $CMD"
    echo "  PID $pid (running for $etime): $cmd"
done

# Keep only the most recent process (last in list)
if [ $COUNT -gt 1 ]; then
    echo ""
    echo "⚠️  Multiple instances detected! Keeping only the most recent one..."
    
    # Get all but the last PID
    TO_KILL=$(echo "$VITE_PIDS" | head -n -1)
    
    echo ""
    echo "🛑 Stopping the following processes:"
    for pid in $TO_KILL; do
        echo "  - Killing PID $pid..."
        kill $pid
    done
    
    echo ""
    echo "✅ Cleanup complete! Running: $(pgrep -f 'node.*vite' | tail -1)"
else
    echo "✅ Only one instance running - no cleanup needed"
fi