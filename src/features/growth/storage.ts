import { boundedFetch, withDeadline } from "./request";
import { createClient } from "@supabase/supabase-js";
import { freshState, type GrowthState } from "./engine";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloud =
  url && key
    ? createClient(url, key, { global: { fetch: boundedFetch } })
    : null;
export const SESSION_ID = crypto.randomUUID();
const storageKey = (id: string) => "tarsio:growth:v2:" + id;
export function readLocal(id: string): GrowthState {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(id)) || "null");
    return raw ? { ...freshState(), ...raw } : freshState();
  } catch {
    return freshState();
  }
}
export function writeLocal(id: string, s: GrowthState) {
  localStorage.setItem(storageKey(id), JSON.stringify(s));
}
export async function loadCloud(): Promise<GrowthState> {
  if (!cloud) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await withDeadline(cloud.rpc("growth_load"));
  if (error) throw error;
  return { ...freshState(), ...data };
}
export async function rpc(name: string, args: Record<string, unknown> = {}) {
  if (!cloud)
    throw new Error("Mode perangkat: fitur ini membutuhkan akun tersambung.");
  const { data, error } = await withDeadline(cloud.rpc(name, args));
  if (error) throw error;
  return data;
}
export function readPending(
  id: string,
): Record<string, import("./engine").Progress> {
  try {
    return JSON.parse(localStorage.getItem("tarsio:pending:" + id) || "{}");
  } catch {
    return {};
  }
}
export function writePending(
  id: string,
  value: Record<string, import("./engine").Progress>,
) {
  localStorage.setItem("tarsio:pending:" + id, JSON.stringify(value));
}
