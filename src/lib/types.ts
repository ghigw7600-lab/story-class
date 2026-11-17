export type ClassRow = {
  id: string; name: string; level: string | null; term: string | null; days: number[]; start_time: string | null;
  minutes: number; tz: string; starts_on: string | null; ends_on: string | null; capacity: number;
  fee: number | null; fee_note: string | null; zoom_url: string | null; teacher_tg: number | null;
  status: "open" | "running" | "closed"; created_at: string;
};
export type Enrollment = {
  id: string; class_id: string; tg_id: number; status: "applied" | "proof" | "active" | "dropped";
  proof_path: string | null; proof_at: string | null; paid_amount: number | null; paid_note: string | null;
  confirmed_at: string | null; created_at: string;
};
export const CLASS_COLS = "id,name,level,term,days,start_time,minutes,tz,starts_on,ends_on,capacity,fee,fee_note,zoom_url,teacher_tg,status,created_at";
