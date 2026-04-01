#!/usr/bin/env python3
"""
Fetch Instagram posts for a profile and save to SQLite.
Uses instaloader session cookies + Instagram private API.
"""

import instaloader
import json
import sys
import time
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "analytics.db")

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
    """Load instaloader session and return requests session with cookies."""
    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        save_metadata=False,
    )
    L.load_session_from_file('albertodviejo')
    return L.context._session

def map_typename(typename, product_type=None):
    if typename == "GraphSidecar":
        return "Carrusel"
    if typename == "GraphVideo" or product_type == "clips":
        return "Reel"
    return "Post"

def fetch_profile_posts(session, username, max_pages=5):
    """Fetch posts via Instagram private API using session cookies."""
    posts = []
    end_cursor = None
    page = 0

    while page < max_pages:
        params = {"username": username}
        if end_cursor:
            # For pagination we need the graphql endpoint
            pass

        resp = session.get(
            "https://i.instagram.com/api/v1/users/web_profile_info/",
            params=params,
            headers={
                "User-Agent": "Instagram 275.0.0.27.98 Android",
                "X-IG-App-ID": "936619743392459",
            }
        )

        if resp.status_code != 200:
            print(f"❌ API error: {resp.status_code}")
            break

        data = resp.json()
        user = data.get("data", {}).get("user", {})

        if page == 0:
            followers = user.get("edge_followed_by", {}).get("count", 0)
            total_posts = user.get("edge_owner_to_timeline_media", {}).get("count", 0)
            print(f"📊 @{username}: {followers} followers, {total_posts} posts")

        media = user.get("edge_owner_to_timeline_media", {})
        edges = media.get("edges", [])

        if not edges:
            break

        for edge in edges:
            node = edge["node"]
            shortcode = node["shortcode"]
            typename = node.get("__typename", "")
            product_type = node.get("product_type")
            post_type = map_typename(typename, product_type)

            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
            caption = (caption_edges[0]["node"]["text"][:150] if caption_edges else "").replace('\n', ' ')

            timestamp = node.get("taken_at_timestamp", 0)
            from datetime import datetime
            published_at = datetime.utcfromtimestamp(timestamp).isoformat() if timestamp else ""

            views = node.get("video_view_count") or node.get("video_play_count")
            likes = node.get("edge_media_preview_like", {}).get("count", 0)
            comments = node.get("edge_media_to_comment", {}).get("count", 0)

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
            })

        # Check pagination
        page_info = media.get("page_info", {})
        has_next = page_info.get("has_next_page", False)
        end_cursor = page_info.get("end_cursor")

        if not has_next or not end_cursor:
            break

        # For next pages, use graphql query
        page += 1
        if has_next and end_cursor:
            user_id = user.get("id")
            if user_id:
                posts.extend(fetch_next_page(session, user_id, end_cursor, max_pages - page))
            break

        time.sleep(2)

    return posts

def fetch_next_page(session, user_id, end_cursor, remaining_pages):
    """Fetch additional pages of posts via graphql."""
    posts = []

    for _ in range(remaining_pages):
        variables = json.dumps({
            "id": user_id,
            "first": 12,
            "after": end_cursor,
        })

        resp = session.get(
            "https://www.instagram.com/graphql/query/",
            params={
                "query_hash": "e769aa130647d2571c27c44596cb68bd",
                "variables": variables,
            },
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "X-IG-App-ID": "936619743392459",
                "X-Requested-With": "XMLHttpRequest",
            }
        )

        if resp.status_code != 200:
            print(f"  ⚠️ Pagination error: {resp.status_code}")
            break

        data = resp.json()
        media = data.get("data", {}).get("user", {}).get("edge_owner_to_timeline_media", {})
        edges = media.get("edges", [])

        if not edges:
            break

        for edge in edges:
            node = edge["node"]
            shortcode = node["shortcode"]
            typename = node.get("__typename", "")
            product_type = node.get("product_type")
            post_type = map_typename(typename, product_type)

            caption_edges = node.get("edge_media_to_caption", {}).get("edges", [])
            caption = (caption_edges[0]["node"]["text"][:150] if caption_edges else "").replace('\n', ' ')

            timestamp = node.get("taken_at_timestamp", 0)
            from datetime import datetime
            published_at = datetime.utcfromtimestamp(timestamp).isoformat() if timestamp else ""

            views = node.get("video_view_count") or node.get("video_play_count")
            likes = node.get("edge_media_preview_like", {}).get("count", 0)
            comments = node.get("edge_media_to_comment", {}).get("count", 0)

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
            })

        page_info = media.get("page_info", {})
        has_next = page_info.get("has_next_page", False)
        end_cursor = page_info.get("end_cursor")

        if not has_next or not end_cursor:
            break

        print(f"  Fetched {len(posts)} more posts...")
        time.sleep(3)

    return posts

def save_to_db(conn, posts):
    cursor = conn.cursor()
    saved = 0
    for p in posts:
        cursor.execute("""
            INSERT INTO instagram_posts (url, shortcode, type, caption, published_at, views, likes, comments, engagement_rate, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(url) DO UPDATE SET
                views = excluded.views,
                likes = excluded.likes,
                comments = excluded.comments,
                engagement_rate = excluded.engagement_rate,
                fetched_at = CURRENT_TIMESTAMP
        """, (p["url"], p["shortcode"], p["type"], p["caption"],
              p["published_at"], p["views"], p["likes"], p["comments"],
              p["engagement_rate"]))
        saved += 1
    conn.commit()
    return saved

if __name__ == "__main__":
    username = sys.argv[1].replace('@', '') if len(sys.argv) > 1 else "albertodviejo"

    print(f"🔄 Fetching Instagram posts for @{username}...")

    session = get_session()
    print("✅ Session loaded")

    posts = fetch_profile_posts(session, username)
    print(f"\n📥 Found {len(posts)} posts")

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
