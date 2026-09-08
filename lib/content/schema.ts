import { z } from "zod";
import { colorKeys } from "@/lib/design/modules";

export const frontmatterSchema = z.object({
  title: z.string().min(1),
  number: z.string().regex(/^\d{2}\.\d{2}$/, "number must look like 04.13"),
  summary: z.string().min(1).max(200),
  status: z.enum(["published", "draft"]).default("draft"),
  free: z.boolean().default(true),
  difficulty: z.enum(["intro", "core", "deep"]),
  estMinutes: z.number().int().positive(),
  tags: z.array(z.string()).default([]),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const moduleRecordSchema = z.object({
  id: z.string().regex(/^\d{2}$/),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  dir: z.string().min(1),
  title: z.string().min(1),
  blurb: z.string().min(1),
  // No cast: z.enum accepts ColorKey[] directly and narrows colorKey to
  // ColorKey. Casting to [string, ...string[]] would widen it to string and
  // force a second cast where the Module is built.
  colorKey: z.enum(colorKeys),
  topicCount: z.number().int().positive(),
});
