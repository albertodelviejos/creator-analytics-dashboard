"use client";

import Image from "next/image";
import { EngagementChart } from "@/components/EngagementChart";
import { SyncButton } from "@/components/SyncButton";
import { formatNumber, formatDate } from "@/lib/format";

interface YouTubeVideo {
  id: number;
  video_id: string;
  title: string;
  description: string | null;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  duration: string | null;
  thumbnail_url: string | null;
}

interface ChannelStats {
  id: number;
  subscribers: number;
  total_views: number;
  total_videos: number;
  recorded_at: string;
}

interface YouTubeContentProps {
  videos: YouTubeVideo[];
  channelHistory: ChannelStats[];
}

export function YouTubeContent({
  videos,
  channelHistory,
}: YouTubeContentProps) {
  const subChartData = [...channelHistory]
    .reverse()
    .map((s) => ({
      label: s.recorded_at.slice(0, 10),
      subscribers: s.subscribers,
    }));

  const viewsChartData = videos.slice(0, 20).reverse().map((v) => ({
    label: v.title.slice(0, 15),
    views: v.views,
    likes: v.likes,
  }));

  return (
    <div className="space-y-6">
      {subChartData.length > 1 && (
        <EngagementChart
          title="Subscriber Growth"
          data={subChartData}
          series={[
            { key: "subscribers", name: "Subscribers", color: "#ef4444" },
          ]}
          type="line"
        />
      )}

      <EngagementChart
        title="Views by Video (Last 20)"
        data={viewsChartData}
        series={[
          { key: "views", name: "Views", color: "#ef4444" },
          { key: "likes", name: "Likes", color: "#f97316" },
        ]}
        type="bar"
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Videos</h3>
        <SyncButton platform="youtube" />
      </div>

      <div className="space-y-3">
        {videos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No videos yet. Click Sync Data to fetch from YouTube.
          </p>
        ) : (
          videos.map((video) => (
            <div
              key={video.video_id}
              className="flex gap-4 rounded-lg border border-border p-4"
            >
              {video.thumbnail_url && (
                <Image
                  src={video.thumbnail_url}
                  alt={video.title}
                  width={144}
                  height={80}
                  className="h-20 w-36 rounded-md object-cover flex-shrink-0"
                  unoptimized
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{video.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(video.published_at)}
                  {video.duration && ` · ${video.duration}`}
                </p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(video.views)} views
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(video.likes)} likes
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(video.comments)} comments
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
