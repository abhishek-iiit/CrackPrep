import type { Status } from "@/lib/content";
import { Pill } from "./Pill";

/** Renders only for drafts — a published lesson needs no marker. */
export function Badge({ status }: { status: Status }) {
  if (status === "published") return null;
  return <Pill>Draft</Pill>;
}
