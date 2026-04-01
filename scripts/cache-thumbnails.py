#!/usr/bin/env python3
"""
Download Instagram thumbnails locally so they don't expire.
Reads thumbnail_url from DB, downloads to public/thumbnails/<shortcode>.jpg,
then updates DB with local path.
"""

import sqlite3
import os
import urllib.request
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "analytics.db")
THUMB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "thumbnails")

def main():
    os.makedirs(THUMB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)

    posts = conn.execute(
        "SELECT shortcode, thumbnail_url FROM instagram_posts WHERE thumbnail_url IS NOT NULL AND thumbnail_url LIKE 'http%'"
    ).fetchall()

    print(f"📥 {len(posts)} posts with remote thumbnails to cache")

    cached = 0
    for shortcode, url in posts:
        local_path = os.path.join(THUMB_DIR, f"{shortcode}.jpg")
        local_url = f"/thumbnails/{shortcode}.jpg"

        if os.path.exists(local_path):
            # Already cached, just update DB
            conn.execute("UPDATE instagram_posts SET thumbnail_url = ? WHERE shortcode = ?", (local_url, shortcode))
            cached += 1
            continue

        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            resp = urllib.request.urlopen(req, timeout=10)
            data = resp.read()

            with open(local_path, "wb") as f:
                f.write(data)

            conn.execute("UPDATE instagram_posts SET thumbnail_url = ? WHERE shortcode = ?", (local_url, shortcode))
            cached += 1
            print(f"  ✅ {shortcode} ({len(data)//1024}KB)")
        except Exception as e:
            print(f"  ❌ {shortcode}: {e}")

    conn.commit()
    conn.close()
    print(f"💾 Cached {cached}/{len(posts)} thumbnails")

if __name__ == "__main__":
    main()
