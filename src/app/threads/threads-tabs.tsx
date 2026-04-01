"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThreadsContentManager } from "./content-manager";
import { ThreadsAnalytics } from "./threads-analytics";

export function ThreadsTabs() {
  return (
    <Tabs defaultValue="content" className="space-y-6">
      <TabsList>
        <TabsTrigger value="content">Content Manager</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <ThreadsContentManager />
      </TabsContent>

      <TabsContent value="analytics">
        <ThreadsAnalytics />
      </TabsContent>
    </Tabs>
  );
}
