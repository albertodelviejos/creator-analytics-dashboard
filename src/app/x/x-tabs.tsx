"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XContentManager } from "./content-manager";
import { XAnalytics } from "./x-analytics";

export function XTabs() {
  return (
    <Tabs defaultValue="content" className="space-y-6">
      <TabsList>
        <TabsTrigger value="content">Content Manager</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <XContentManager />
      </TabsContent>

      <TabsContent value="analytics">
        <XAnalytics />
      </TabsContent>
    </Tabs>
  );
}
