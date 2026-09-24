// Mirrors the Supabase schema in supabase/migrations/0001_init.sql
// Import these in both apps/web and apps/mobile so the shape never drifts.

export type ReportType = "lost" | "found";
export type ReportStatus = "active" | "matched" | "returned" | "closed";

export type ReportCategory =
  | "electronics"
  | "documents"
  | "keys"
  | "bags"
  | "clothing"
  | "accessories"
  | "other";

export interface Profile {
  id: string; // uuid, matches auth.users.id
  display_name: string;
  university: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  type: ReportType;
  category: ReportCategory;
  title: string;
  description: string;
  location: string | null; // free-text fallback
  location_id: string | null; // preferred: points at campus_locations
  incident_date: string | null; // ISO date
  status: ReportStatus;
  created_at: string;
}

export interface CampusLocation {
  id: string;
  university: string;
  name: string;
  parent_id: string | null; // null = top-level (e.g. a faculty)
  created_at: string;
}

export type MatchStatus = "suggested" | "confirmed" | "dismissed";

export interface Match {
  id: string;
  lost_report_id: string;
  found_report_id: string;
  confidence: number; // 0-100
  status: MatchStatus;
  created_at: string;
}

export interface ReportImage {
  id: string;
  report_id: string;
  storage_path: string;
}

export interface Conversation {
  id: string;
  report_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
