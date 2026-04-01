#!/bin/bash
# Sync all social media data for Creator Analytics Dashboard
# Runs daily via LaunchAgent

LOG_DIR="/Users/alberto/creator-analytics-dashboard/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/sync-$(date +%Y-%m-%d).log"

cd /Users/alberto/creator-analytics-dashboard

echo "=== Sync started at $(date) ===" >> "$LOG"

# 1. YouTube (reliable, API key)
echo "[YouTube] Starting..." >> "$LOG"
YOUTUBE_API_KEY=AIzaSyC7CQvor2H3uErSzvfZ_2kLIEJQOEKtIik /Users/alberto/.nvm/versions/node/v24.13.0/bin/npx tsx scripts/fetch-youtube.ts albertodelviejo >> "$LOG" 2>&1
echo "[YouTube] Done" >> "$LOG"

sleep 5

# 2. Instagram (rate limited, may fail)
echo "[Instagram] Starting..." >> "$LOG"
/Library/Developer/CommandLineTools/usr/bin/python3 scripts/fetch-instagram.py albertodviejo >> "$LOG" 2>&1
echo "[Instagram] Done" >> "$LOG"

sleep 5

# 3. Cache Instagram thumbnails
echo "[Thumbnails] Caching..." >> "$LOG"
/Library/Developer/CommandLineTools/usr/bin/python3 scripts/cache-thumbnails.py >> "$LOG" 2>&1 || true
echo "[Thumbnails] Done" >> "$LOG"

# 4. News RSS
echo "[News] Syncing RSS feeds..." >> "$LOG"
curl -s -X POST http://localhost:3100/api/news >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "[News] Done" >> "$LOG"

echo "=== Sync completed at $(date) ===" >> "$LOG"
echo "" >> "$LOG"
