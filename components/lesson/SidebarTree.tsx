"use client";

import type { ColorKey } from "@/lib/design/modules";

export type SidebarLesson = {
  slug: string;
  number: string;
  title: string;
  url: string;
  status: "published" | "draft";
};

export type SidebarModule = {
  id: string;
  slug: string;
  title: string;
  colorKey: ColorKey;
  lessons: SidebarLesson[];
};

/** Placeholder — Task 9 implements the real collapsible tree. */
export function SidebarTree(_props: {
  modules: SidebarModule[];
  currentModule: string;
  currentLesson: string;
}) {
  return null;
}
