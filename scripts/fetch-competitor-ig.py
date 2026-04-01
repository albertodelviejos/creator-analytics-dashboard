#!/usr/bin/env python3
"""
Fetch recent Instagram posts + profile info for a competitor.
Uses instaloader session cookies + Instagram v1 API.
Outputs JSON to stdout for the Node.js API route to parse.
"""

import instaloader
import json
import sys
import time
from datetime import datetime

HEADERS = {
    "User-Agent": "Instagram 275.0.0.27.98 Android",
    "X-IG-App-ID": "936619743392459",
}

MAX_POSTS = 30


def get_session():
    L = instaloader.Instaloader(
        download_pictures=False, download_videos=False,
        download_video_thumbnails=False, save_metadata=False,
    )
    L.load_session_from_file('albertodviejo')
    return L.context._session


def map_media_type(media_type):
    if media_type == 8:
        return "Carrusel"
    if media_type == 2:
        return "Reel"
    return "Post"


def fetch_profile_and_posts(session, username):
    # Get profile info
    resp = session.get(
        "https://i.instagram.com/api/v1/users/web_profile_info/",
        params={"username": username},
        headers=HEADERS,
    )
    if resp.status_code != 200:
        return {"error": f"Profile fetch failed: {resp.status_code}"}

    data = resp.json()
    user = data["data"]["user"]
    user_id = user["id"]
    followers = user.get("edge_followed_by", {}).get("count", 0)
    total_posts = user.get("edge_owner_to_timeline_media", {}).get("count", 0)

    # Fetch recent posts via feed API
    posts = []
    max_id = ""
    fetched = 0

    while fetched < MAX_POSTS:
        params = {"count": 33}
        if max_id:
            params["max_id"] = max_id

        resp = session.get(
            f"https://i.instagram.com/api/v1/feed/user/{user_id}/",
            params=params,
            headers=HEADERS,
        )

        if resp.status_code != 200:
            break

        feed = resp.json()
        items = feed.get("items", [])
        if not items:
            break

        for item in items:
            if fetched >= MAX_POSTS:
                break

            shortcode = item.get("code", "")
            media_type = item.get("media_type", 1)
            post_type = map_media_type(media_type)

            caption_obj = item.get("caption")
            caption = (caption_obj.get("text", "")[:150] if caption_obj else "").replace('\n', ' ')

            timestamp = item.get("taken_at", 0)
            published_at = datetime.utcfromtimestamp(timestamp).isoformat() if timestamp else ""

            views = item.get("play_count") or item.get("view_count")
            likes = item.get("like_count", 0)
            comments = item.get("comment_count", 0)

            candidates = item.get("image_versions2", {}).get("candidates", [])
            thumbnail_url = candidates[0]["url"] if candidates else None

            total = likes + comments
            eng_rate = round((total / views * 100), 2) if views and views > 0 else None

            posts.append({
                "shortcode": shortcode,
                "type": post_type,
                "caption": caption,
                "published_at": published_at,
                "views": views or 0,
                "likes": likes,
                "comments": comments,
                "engagement_rate": eng_rate,
                "thumbnail_url": thumbnail_url,
            })
            fetched += 1

        more = feed.get("more_available", False)
        next_max_id = feed.get("next_max_id")
        if not more or not next_max_id or fetched >= MAX_POSTS:
            break
        max_id = next_max_id
        time.sleep(2)

    return {
        "username": username,
        "followers": followers,
        "total_posts": total_posts,
        "posts": posts,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 fetch-competitor-ig.py <username>"}))
        sys.exit(1)

    username = sys.argv[1].replace("@", "")

    try:
        session = get_session()
        result = fetch_profile_and_posts(session, username)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
