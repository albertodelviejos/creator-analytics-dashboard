#!/usr/bin/env python3
"""
Fetch ALL Instagram posts for a profile and save to SQLite.
Uses instaloader session cookies + Instagram v1 feed API with pagination.
"""

import instaloader
import json
import sys
import time
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "analytics.db")

HEADERS = {
    "User-Agent": "Instagram 275.0.0.27.98 Android",
    "X-IG-App-ID": "936619743392459",
}

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS instagram_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE NOT NULL,
            shortcode TEXT NOT NULL,
            type TEXT CHECK(type IN ('Reel', 'Post', 'Carrusel')),
            caption TEXT,
            published_at TEXT NOT NULL,
            views INTEGER,
            likes INTEGER NOT NULL DEFAULT 0,
            comments INTEGER NOT NULL DEFAULT 0,
            engagement_rate REAL,
            fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn

def get_session():
    L = instaloader.Instaloader(
        download_pictures=False, download_videos=False,
        download_video_thumbnails=False, save_metadata=False,
    )
    L.load_session_from_file('albertodviejo')
    return L.context._session

def map_media_type(media_type, product_type=None):
    # media_type: 1=photo, 2=video, 8=carousel
    if media_type == 8:
        return "Carrusel"
    if media_type == 2:
        return "Reel"
    return "Post"

def get_user_id(session, username):
    resp = session.get(
        "https://i.instagram.com/api/v1/users/web_profile_info/",
        params={"username": username},
        headers=HEADERS,
    )
    if resp.status_code != 200:
        raise Exception(f"Profile fetch failed: {resp.status_code}")
    data = resp.json()
    user = data["data"]["user"]
    user_id = user["id"]
    followers = user.get("edge_followed_by", {}).get("count", 0)
    total_posts = user.get("edge_owner_to_timeline_media", {}).get("count", 0)
    print(f"📊 @{username}: {followers} followers, {total_posts} posts")
    return user_id

def fetch_all_posts(session, user_id):
    posts = []
    max_id = ""
    page = 1

    while True:
        params = {"count": 33}
        if max_id:
            params["max_id"] = max_id

        resp = session.get(
            f"https://i.instagram.com/api/v1/feed/user/{user_id}/",
            params=params,
            headers=HEADERS,
        )

        if resp.status_code != 200:
            print(f"  ❌ Feed error: {resp.status_code}")
            break

        data = resp.json()
        items = data.get("items", [])

        if not items:
            break

        for item in items:
            shortcode = item.get("code", "")
            media_type = item.get("media_type", 1)
            product_type = item.get("product_type")
            post_type = map_media_type(media_type, product_type)

            caption_obj = item.get("caption")
            caption = (caption_obj.get("text", "")[:150] if caption_obj else "").replace('\n', ' ')

            timestamp = item.get("taken_at", 0)
            published_at = datetime.utcfromtimestamp(timestamp).isoformat() if timestamp else ""

            views = item.get("play_count") or item.get("view_count")
            likes = item.get("like_count", 0)
            comments = item.get("comment_count", 0)

            # Thumbnail
            candidates = item.get("image_versions2", {}).get("candidates", [])
            thumbnail_url = candidates[0]["url"] if candidates else None

            total = likes + comments
            eng_rate = round((total / views * 100), 2) if views and views > 0 else None

            posts.append({
                "url": f"https://www.instagram.com/p/{shortcode}/",
                "shortcode": shortcode,
                "type": post_type,
                "caption": caption,
                "published_at": published_at,
                "views": views,
                "likes": likes,
                "comments": comments,
                "engagement_rate": eng_rate,
                "thumbnail_url": thumbnail_url,
            })

        print(f"  📄 Page {page}: {len(items)} posts (total: {len(posts)})")

        more = data.get("more_available", False)
        next_max_id = data.get("next_max_id")

        if not more or not next_max_id:
            break

        max_id = next_max_id
        page += 1
        time.sleep(2)

    return posts

def save_to_db(conn, posts):
    cursor = conn.cursor()
    saved = 0
    for p in posts:
        cursor.execute("""
            INSERT INTO instagram_posts (url, shortcode, type, caption, published_at, views, likes, comments, engagement_rate, thumbnail_url, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(url) DO UPDATE SET
                views = excluded.views,
                likes = excluded.likes,
                comments = excluded.comments,
                engagement_rate = excluded.engagement_rate,
                thumbnail_url = excluded.thumbnail_url,
                fetched_at = CURRENT_TIMESTAMP
        """, (p["url"], p["shortcode"], p["type"], p["caption"],
              p["published_at"], p["views"], p["likes"], p["comments"],
              p["engagement_rate"], p["thumbnail_url"]))
        saved += 1
    conn.commit()
    return saved

if __name__ == "__main__":
    username = sys.argv[1].replace('@', '') if len(sys.argv) > 1 else "albertodviejo"

    print(f"🔄 Fetching ALL Instagram posts for @{username}...")

    session = get_session()
    print("✅ Session loaded")

    user_id = get_user_id(session, username)
    posts = fetch_all_posts(session, user_id)

    print(f"\n📥 Found {len(posts)} posts total")

    if posts:
        conn = init_db()
        saved = save_to_db(conn, posts)
        conn.close()
        print(f"💾 Saved {saved} posts to DB")

        reels = sum(1 for p in posts if p["type"] == "Reel")
        carruseles = sum(1 for p in posts if p["type"] == "Carrusel")
        statics = sum(1 for p in posts if p["type"] == "Post")
        print(f"📊 {reels} reels · {carruseles} carruseles · {statics} posts")
    else:
        print("⚠️ No posts found")
