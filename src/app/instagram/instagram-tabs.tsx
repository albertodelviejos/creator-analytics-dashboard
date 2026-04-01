"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentManager } from "./content-manager";
import { InstagramContent } from "./instagram-content";

interface InstagramPost {
  id: number;
  url: string;
  shortcode: string;
  type: "Reel" | "Post" | "Carrusel";
  caption: string | null;
  published_at: string;
  views: number | null;
  likes: number;
  comments: number;
  engagement_rate: number | null;
  thumbnail_url: string | null;
}

export function InstagramTabs({ posts }: { posts: InstagramPost[] }) {
  return (
    <Tabs defaultValue="content" className="space-y-6">
      <TabsList>
        <TabsTrigger value="content">Content Manager</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <ContentManager />
      </TabsContent>

      <TabsContent value="analytics">
        <InstagramContent posts={posts} />
      </TabsContent>
    </Tabs>
  );
}
