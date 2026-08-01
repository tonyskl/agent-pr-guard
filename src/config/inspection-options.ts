import { z } from "zod";

export const outputFormats = ["human", "json"] as const;
export type OutputFormat = (typeof outputFormats)[number];

export const inspectionOptionsSchema = z.object({
  base: z.string().min(1),
  head: z.string().min(1),
  format: z.enum(outputFormats),
  config: z.string().min(1).optional(),
});

export type InspectionOptions = z.infer<typeof inspectionOptionsSchema>;
