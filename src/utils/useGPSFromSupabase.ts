// ============================================
// useGPSFromSupabase.ts
// Hook para obtener ubicaciones GPS de Supabase
// ============================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface GPSData {
  economico: string;
  empresa: string;
  segmento: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  address: string | null;
  timestamp_gps: string | null;
  timestamp_updated: string | null;
  stopped_minutes: number | null;
  stopped_time: string | null;
  status: string;
  anomaly: string | null;
}

export async function getGPSByEconomico(economico: string): Promise<GPSData | null> {
  try {
    const { data, error } = await supabase.from('gps_tracking').select('*').eq('economico', economico).single();
    if (error || !data) return null;
    return data as GPSData;
  } catch { return null; }
}

export async function getGPSByEconomicos(economicos: string[]): Promise<Map<string, GPSData>> {
  const result = new Map<string, GPSData>();
  try {
    const { data, error } = await supabase.from('gps_tracking').select('*').in('economico', economicos);
    if (!error && data) for (const row of data) result.set(row.economico, row as GPSData);
  } catch {}
  return result;
}

export async function getGPSBySegmento(segmento: string): Promise<GPSData[]> {
  try {
    const { data, error } = await supabase.from('gps_tracking').select('*').eq('segmento', segmento).order('economico');
    if (error || !data) return [];
    return data as GPSData[];
  } catch { return []; }
}

export async function getGPSCarroll(): Promise<GPSData[]> {
  return getGPSBySegmento('CARROLL');
}

export function formatGPSDisplay(gps: GPSData | null): string {
  if (!gps) return 'Sin señal GPS';
  if (!gps.address || gps.address === '-') {
    if (gps.latitude && gps.longitude) return `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`;
    return 'Sin señal GPS';
  }
  return gps.address;
}

export function getGPSStatus(gps: GPSData | null): 'moving' | 'stopped' | 'no_signal' | 'gps_issue' {
  if (!gps) return 'no_signal';
  return (gps.status as any) || 'no_signal';
}

export function subscribeToGPSChanges(callback: (data: GPSData) => void): () => void {
  const channel = supabase.channel('gps_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'gps_tracking' }, (payload) => {
    if (payload.new) callback(payload.new as GPSData);
  }).subscribe();
  return () => channel.unsubscribe();
}
