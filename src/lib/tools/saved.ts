import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;

export async function isToolSaved(userId: string, slug: string) {
  const { data } = await db
    .from("saved_items")
    .select("id")
    .eq("user_id", userId)
    .eq("item_type", "tool")
    .eq("item_id", slug)
    .maybeSingle();
  return Boolean(data);
}

export async function saveTool(userId: string, slug: string) {
  const { error } = await db
    .from("saved_items")
    .insert({ user_id: userId, item_type: "tool", item_id: slug });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function unsaveTool(userId: string, slug: string) {
  const { error } = await db
    .from("saved_items")
    .delete()
    .eq("user_id", userId)
    .eq("item_type", "tool")
    .eq("item_id", slug);
  if (error) throw error;
}
