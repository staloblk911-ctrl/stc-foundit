import { z } from "zod";

export const reportCategorySchema = z.enum([
  "electronics",
  "documents",
  "keys",
  "bags",
  "clothing",
  "accessories",
  "other",
]);

export const createReportSchema = z.object({
  type: z.enum(["lost", "found"]),
  category: reportCategorySchema,
  title: z.string().min(3, "Title is too short").max(80),
  description: z.string().min(10, "Add a bit more detail").max(1000),
  location: z.string().max(120).optional(), // free-text fallback
  location_id: z.string().uuid().optional(), // preferred, from campus_locations
  incident_date: z.string().optional(), // ISO date string from a date picker
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
