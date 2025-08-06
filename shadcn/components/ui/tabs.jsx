import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../../lib/utils";

function Tabs({ className, ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 px-4 py-1 text-sm font-medium rounded-md border border-transparent transition-all duration-300 ease-in-out", // Base styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", // Focus outline
        "bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800", // Hover effect
        "text-gray-700 dark:text-gray-300", // Default text color
        "data-[state=active]:bg-gradient-to-b from-gray-500 to-slate-800 data-[state=active]:text-white", // Active state styles
        "data-[state=active]:transform data-[state=active]:scale-105", // Scaling effect on active state
        "focus-visible:ring-offset-2", // Focus visible offset
        "data-[state=active]:shadow-lg", // Shadow on active state
        "dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30", // Dark mode active state
        "disabled:pointer-events-none disabled:opacity-50", // Disabled state
        "transition-colors", // Ensures smooth color transitions (text and background)
        className // Allow additional classes to be passed
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
