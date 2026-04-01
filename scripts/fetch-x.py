#!/usr/bin/env python3
"""
Fetch tweets from X/Twitter using guest token + GraphQL API (no paid API needed).
Uses curl subprocess to avoid Python urllib issues with bearer token encoding.
"""

import json
import sys
import sqlite3
import os
import subprocess
import urllib.parse
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "analytics.db")

PUBLIC_BEARER = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA"

def curl_json(url, method="GET", headers=None):
    cmd = ["curl", "-s"]
    if method == "POST":
        cmd += ["-X", "POST"]
    for k, v in (headers or {}).items():
        cmd += ["-H", f"{k}: {v}"]
    cmd.append(url)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    return json.loads(result.stdout)

def get_guest_token():
    data = curl_json(
        "https://api.twitter.com/1.1/guest/activate.json",
        method="POST",
        headers={"Authorization": f"Bearer {PUBLIC_BEARER}"}
    )
    return data["guest_token"]

def get_user_info(guest_token, screen_name):
    variables = json.dumps({"screen_name": screen_name, "withSafetyModeUserFields": True})
    features = json.dumps({
        "hidden_profile_subscriptions_enabled": True,
        "responsive_web_graphql_exclude_directive_enabled": True,
        "verified_phone_label_enabled": False,
        "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
        "responsive_web_graphql_timeline_navigation_enabled": True,
    })
    
    url = f"https://api.twitter.com/graphql/xc8f1g7BYqr6VTzTbvNlGw/UserByScreenName?variables={urllib.parse.quote(variables)}&features={urllib.parse.quote(features)}"
    
    data = curl_json(url, headers={
        "Authorization": f"Bearer {PUBLIC_BEARER}",
        "x-guest-token": guest_token,
        "Content-Type": "application/json",
    })
    
    user = data.get("data", {}).get("user", {}).get("result", {})
    legacy = user.get("legacy", {})
    
    return {
        "id": user.get("rest_id"),
        "name": legacy.get("name"),
        "screen_name": legacy.get("screen_name"),
        "followers": legacy.get("followers_count", 0),
        "tweets_count": legacy.get("statuses_count", 0),
    }

def get_user_tweets(guest_token, user_id, screen_name, count=40):
    variables = json.dumps({
        "userId": user_id,
        "count": count,
        "includePromotedContent": False,
        "withQuickPromoteEligibilityTweetFields": False,
        "withVoice": False,
        "withV2Timeline": True,
    })
    features = json.dumps({
        "responsive_web_graphql_exclude_directive_enabled": True,
        "verified_phone_label_enabled": False,
        "responsive_web_graphql_timeline_navigation_enabled": True,
        "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
        "creator_subscriptions_tweet_preview_api_enabled": True,
        "tweetypie_unmention_optimization_enabled": True,
        "responsive_web_edit_tweet_api_enabled": True,
        "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
        "view_counts_everywhere_api_enabled": True,
        "longform_notetweets_consumption_enabled": True,
        "responsive_web_twitter_article_tweet_consumption_enabled": True,
        "tweet_awards_web_tipping_enabled": False,
        "freedom_of_speech_not_reach_fetch_enabled": True,
        "standardized_nudges_misinfo": True,
        "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
        "longform_notetweets_rich_text_read_enabled": True,
        "longform_notetweets_inline_media_enabled": True,
        "responsive_web_enhance_cards_enabled": False,
    })
    
    url = f"https://api.twitter.com/graphql/E3opETHurmVJflFsUBVuUQ/UserTweets?variables={urllib.parse.quote(variables)}&features={urllib.parse.quote(features)}"
    
    data = curl_json(url, headers={
        "Authorization": f"Bearer {PUBLIC_BEARER}",
        "x-guest-token": guest_token,
        "Content-Type": "application/json",
    })
    
    tweets = []
    timeline = data.get("data", {}).get("user", {}).get("result", {}).get("timeline_v2", {}).get("timeline", {})
    instructions = timeline.get("instructions", [])
    
    for instruction in instructions:
        entries = instruction.get("entries", [])
        for entry in entries:
            content = entry.get("content", {})
            item = content.get("itemContent", {})
            tweet_results = item.get("tweet_results", {}).get("result", {})
            
            if tweet_results.get("__typename") == "TweetWithVisibilityResults":
                tweet_results = tweet_results.get("tweet", tweet_results)
            
            legacy = tweet_results.get("legacy", {})
            if not legacy or not legacy.get("full_text"):
                continue
            
            tweet_id = legacy.get("id_str", "")
            text = legacy.get("full_text", "")
            created_at = legacy.get("created_at", "")
            
            try:
                dt = datetime.strptime(created_at, "%a %b %d %H:%M:%S %z %Y")
                published_at = dt.isoformat()
            except:
                published_at = created_at
            
            is_retweet = text.startswith("RT @")
            is_reply = bool(legacy.get("in_reply_to_status_id_str"))
            is_quote = bool(legacy.get("is_quote_status"))
            
            if is_retweet: post_type = "retweet"
            elif is_reply: post_type = "reply"
            elif is_quote: post_type = "quote"
            else: post_type = "tweet"
            
            likes = legacy.get("favorite_count", 0)
            retweets_count = legacy.get("retweet_count", 0)
            replies_count = legacy.get("reply_count", 0)
            bookmarks = legacy.get("bookmark_count", 0)
            
            views_data = tweet_results.get("views", {})
            impressions = int(views_data.get("count", 0)) if views_data.get("count") else 0
            
            total_eng = likes + retweets_count + replies_count + bookmarks
            eng_rate = round((total_eng / impressions * 100), 2) if impressions > 0 else None
            
            tweets.append({
                "tweet_id": tweet_id,
                "text": text[:500],
                "post_type": post_type,
                "published_at": published_at,
                "impressions": impressions,
                "likes": likes,
                "retweets": retweets_count,
                "replies": replies_count,
                "bookmarks": bookmarks,
                "engagement_rate": eng_rate,
                "url": f"https://x.com/{screen_name}/status/{tweet_id}",
            })
    
    return tweets

def save_to_db(tweets):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS x_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tweet_id TEXT UNIQUE NOT NULL,
            text TEXT NOT NULL,
            post_type TEXT DEFAULT 'tweet',
            published_at TEXT NOT NULL,
            impressions INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            retweets INTEGER DEFAULT 0,
            replies INTEGER DEFAULT 0,
            bookmarks INTEGER DEFAULT 0,
            engagement_rate REAL,
            url TEXT,
            fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    saved = 0
    for t in tweets:
        conn.execute("""
            INSERT INTO x_posts (tweet_id, text, post_type, published_at, impressions, likes, retweets, replies, bookmarks, engagement_rate, url, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(tweet_id) DO UPDATE SET
                impressions=excluded.impressions, likes=excluded.likes, retweets=excluded.retweets,
                replies=excluded.replies, bookmarks=excluded.bookmarks, engagement_rate=excluded.engagement_rate,
                fetched_at=CURRENT_TIMESTAMP
        """, (t["tweet_id"], t["text"], t["post_type"], t["published_at"],
              t["impressions"], t["likes"], t["retweets"], t["replies"],
              t["bookmarks"], t["engagement_rate"], t["url"]))
        saved += 1
    
    conn.commit()
    conn.close()
    return saved

if __name__ == "__main__":
    screen_name = sys.argv[1] if len(sys.argv) > 1 else "AlbertoDelViejo"
    
    print(f"🔄 Fetching tweets for @{screen_name}...")
    
    guest_token = get_guest_token()
    print(f"✅ Guest token acquired")
    
    user_info = get_user_info(guest_token, screen_name)
    print(f"📊 @{user_info['screen_name']}: {user_info['followers']} followers, {user_info['tweets_count']} tweets")
    
    tweets = get_user_tweets(guest_token, user_info["id"], screen_name)
    print(f"📥 Found {len(tweets)} tweets")
    
    if tweets:
        saved = save_to_db(tweets)
        print(f"💾 Saved {saved} tweets to DB")
        
        types = {}
        for t in tweets:
            types[t["post_type"]] = types.get(t["post_type"], 0) + 1
        print(f"📊 {types}")
    else:
        print("⚠️ No tweets found")
