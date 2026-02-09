import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Upload, Download, Search, UserCheck, X, FileSpreadsheet, Brain, MapPin, ChevronDown, ChevronUp, RefreshCw, ClipboardList, MessageSquare, Loader2, Check, AlertTriangle, Truck, Mail, Send, Phone, CheckSquare, Square, Edit2, Trash2, Plus, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

// ============ GOOGLE OAUTH CONFIG ============
const GOOGLE_CLIENT_ID = '26773356182-sb6d8l7krsltmjfh2rto7nutd4eu73qr.apps.googleusercontent.com';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email';
const ALLOWED_DOMAINS = ['trob.com.mx', 'wexpress.com.mx', 'speedyhaul.com.mx'];

// ============ WHATSAPP API CONFIG ============
const WA_PHONE_ID = '963627606824867';
const WA_ACCESS_TOKEN = 'EAAVapl2JRGMBQLlCz03w6TsgRFog5PnO91xxLecN56cnqMyh5DHbbUcYHqHrHJJzHvZAlag710qZBzuuVDUwlhU55mbwweEY45Kfl5SYDPZAV22haOl7j1uEEmG4pe8qhTvwnpmfXbauthZB84BlJ7oXdK398zuZBXr9bSzLAxk2U5L4XnezLBFyyjSZAZC0A5s1AZDZD';

// ============ TYPES ============
interface ClienteAsignacion {
  id: number; numero: number; cliente: string; vendedor: string; ejecutivo_sc: string; status: string; notas: string | null;
}
interface DataExpo {
  id: number; estado: string; tipo: string; cliente: string; viajes: number; formatos_venta: string;
  num_formatos: number; origenes: string; dedicado: string; cruce: string; empresa: string;
}
interface DataImpo {
  id: number; numero: number; cliente: string; viajes: number; thermo: number; seco: number;
  formatos: number; tipo_equipo: string; zona_entrega: string; empresa: string;
}
interface Props {
  onBack: () => void; userEmail?: string; userName?: string; userRole?: string; gmailToken?: string;
}

// ============ NEIGHBOR STATES MAP ============
const NEIGHBOR_STATES: Record<string, string[]> = {
  'AGUASCALIENTES': ['JALISCO', 'ZACATECAS', 'SAN LUIS POTOSI'],
  'CAMPECHE': ['CHIAPAS'],
  'CHIAPAS': ['CAMPECHE'],
  'CIUDAD DE MEXICO': ['ESTADO DE MEXICO'],
  'COAHUILA': ['NUEVO LEON', 'DURANGO', 'ZACATECAS', 'SAN LUIS POTOSI'],
  'COLIMA': ['JALISCO', 'MICHOACAN'],
  'DURANGO': ['COAHUILA', 'ZACATECAS', 'SINALOA', 'NAYARIT'],
  'ESTADO DE MEXICO': ['CIUDAD DE MEXICO', 'HIDALGO', 'PUEBLA', 'TLAXCALA', 'MORELOS', 'QUERETARO', 'MICHOACAN', 'GUERRERO'],
  'GUANAJUATO': ['JALISCO', 'AGUASCALIENTES', 'SAN LUIS POTOSI', 'QUERETARO', 'MICHOACAN'],
  'GUERRERO': ['ESTADO DE MEXICO', 'MICHOACAN', 'MORELOS', 'PUEBLA'],
  'HIDALGO': ['ESTADO DE MEXICO', 'PUEBLA', 'VERACRUZ', 'SAN LUIS POTOSI', 'QUERETARO', 'TLAXCALA'],
  'JALISCO': ['NAYARIT', 'AGUASCALIENTES', 'ZACATECAS', 'GUANAJUATO', 'MICHOACAN', 'COLIMA'],
  'MICHOACAN': ['JALISCO', 'GUANAJUATO', 'QUERETARO', 'ESTADO DE MEXICO', 'GUERRERO', 'COLIMA'],
  'MORELOS': ['ESTADO DE MEXICO', 'GUERRERO', 'PUEBLA'],
  'NAYARIT': ['JALISCO', 'ZACATECAS', 'DURANGO', 'SINALOA'],
  'NUEVO LEON': ['COAHUILA', 'TAMAULIPAS', 'SAN LUIS POTOSI'],
  'PUEBLA': ['ESTADO DE MEXICO', 'HIDALGO', 'TLAXCALA', 'VERACRUZ', 'MORELOS', 'GUERRERO'],
  'QUERETARO': ['GUANAJUATO', 'SAN LUIS POTOSI', 'HIDALGO', 'ESTADO DE MEXICO', 'MICHOACAN'],
  'SAN LUIS POTOSI': ['ZACATECAS', 'AGUASCALIENTES', 'JALISCO', 'GUANAJUATO', 'QUERETARO', 'HIDALGO', 'VERACRUZ', 'TAMAULIPAS', 'NUEVO LEON', 'COAHUILA'],
  'SINALOA': ['SONORA', 'DURANGO', 'NAYARIT'],
  'SONORA': ['SINALOA'],
  'TAMAULIPAS': ['NUEVO LEON', 'SAN LUIS POTOSI', 'VERACRUZ'],
  'TLAXCALA': ['PUEBLA', 'HIDALGO', 'ESTADO DE MEXICO'],
  'VERACRUZ': ['TAMAULIPAS', 'SAN LUIS POTOSI', 'HIDALGO', 'PUEBLA'],
  'ZACATECAS': ['DURANGO', 'COAHUILA', 'SAN LUIS POTOSI', 'AGUASCALIENTES', 'JALISCO', 'NAYARIT'],
};

const EJECUTIVOS_SC = ['ELI', 'LIZ'];
const VENDEDORES = ['ISIS', 'LEO'];

// ============ EXPO: EXCLUSION ============
const CLIENTES_EXCLUIDOS_EXPO = [
  'TROB TRANSPORTES', 'TROB USA', 'SPEEDYHAUL', 'WEXPRESS', 'W EXPRESS',
  'TROB ', 'SHI ',
];
const isExcludedExpo = (cliente: string): boolean => {
  const c = cliente.toUpperCase();
  return CLIENTES_EXCLUIDOS_EXPO.some(e => c.includes(e.trim()));
};

// ============ IMPORTACIÓN: EXCLUSION & MAPPING ============
const CLIENTES_EXCLUIDOS_IMPO = [
  'NATURESWEET', 'NATURE SWEET', 'NS BRANDS', 'NSBRAND',
  'NEXTEER', 'STEERINGMEX', 'STEERING',
  'CLARIOS', 'CLARIOSMTY',
  'BAFAR', 'BARCEL', 'GRANJAS CARROLL', 'CARROLL',
  'LALA', 'LACTEOS LALA', 'TERNIUM', 'ALPURA',
  'TROB TRANSPORTES', 'TROB', 'WEXPRESS', 'SPEEDYHAUL', 'TROB USA',
  'WE ', 'SHI', 'PILGRIM', 'WERNER',
];
// Ventas ejecutivo is now looked up dynamically from asignacion data (inside component)
const isExcludedImpo = (cliente: string): boolean => {
  const c = cliente.toUpperCase();
  return CLIENTES_EXCLUIDOS_IMPO.some(e => c.includes(e));
};

// Normalize client names to consolidate duplicates
const CLIENT_NORM: Record<string, string> = {
  'EUROPARTNERS MEXICO SA DE CV': 'EUROPARTNERS MEXICO',
  'ZEBRA CARRIERS INC': 'ZEBRA',
  'ZEBRA LOGISTICS': 'ZEBRA',
  'SUMMIT PLASTICS GUANAJUATO': 'SUMMIT PLASTICS',
  'SUMMIT PLASTICS SILAO': 'SUMMIT PLASTICS',
  'INTERLAND USA': 'INTERLAND TRANSPORT',
  'KRONUS LOGISTICS SA DE CV': 'KRONUS LOGISTICS',
  'KRONUS LOGISTICS LLC': 'KRONUS LOGISTICS',
  'FOMO WORLDWIDE LOGISTICS LLC': 'FOMO INTERNATIONAL LOGISTICS',
  'FOMO INTERNATIONAL LOGISTICS, LLC': 'FOMO INTERNATIONAL LOGISTICS',
  'CHARGER GLOBAL LOGISTICS': 'CHARGER LOGISTICS',
  'CHARGER LOGISTICS INC.': 'CHARGER LOGISTICS',
  'INDIANA WESTERN EXPRESS, INC': 'INDIANA BROKERS',
  'INDIANA BROKERS AND LOGISTICS LLC': 'INDIANA BROKERS',
  'CH ROBINSON WORLDWIDE, INC': 'C H ROBINSON',
  'C H ROBINSON DE MEXICO': 'C H ROBINSON',
  'WHIRLPOOL MEXICO': 'INDUSTRIAS ACROS WHIRLPOOL',
};
const normalizeClient = (name: string): string => {
  const n = name.toUpperCase().trim();
  return CLIENT_NORM[n] || n;
};

// Extract Mexican state from full address
const ESTADOS_MX = [
  'AGUASCALIENTES', 'BAJA CALIFORNIA SUR', 'BAJA CALIFORNIA',
  'CAMPECHE', 'CHIAPAS', 'CHIHUAHUA', 'CIUDAD DE MEXICO', 'COAHUILA',
  'COLIMA', 'DURANGO', 'ESTADO DE MEXICO', 'GUANAJUATO', 'GUERRERO',
  'HIDALGO', 'JALISCO', 'MICHOACAN', 'MORELOS', 'NAYARIT', 'NUEVO LEON',
  'OAXACA', 'PUEBLA', 'QUERETARO', 'QUINTANA ROO', 'SAN LUIS POTOSI',
  'SINALOA', 'SONORA', 'TABASCO', 'TAMAULIPAS', 'TLAXCALA', 'VERACRUZ',
  'YUCATAN', 'ZACATECAS',
];
const ESTADO_DISPLAY: Record<string, string> = {
  'AGUASCALIENTES': 'AGS', 'BAJA CALIFORNIA SUR': 'BCS', 'BAJA CALIFORNIA': 'BC',
  'CAMPECHE': 'CAMP', 'CHIAPAS': 'CHIS', 'CHIHUAHUA': 'CHIH', 'CIUDAD DE MEXICO': 'CDMX',
  'COAHUILA': 'COAH', 'COLIMA': 'COL', 'DURANGO': 'DGO', 'ESTADO DE MEXICO': 'EDOMEX',
  'GUANAJUATO': 'GTO', 'GUERRERO': 'GRO', 'HIDALGO': 'HGO', 'JALISCO': 'JAL',
  'MICHOACAN': 'MICH', 'MORELOS': 'MOR', 'NAYARIT': 'NAY', 'NUEVO LEON': 'NL',
  'OAXACA': 'OAX', 'PUEBLA': 'PUE', 'QUERETARO': 'QRO', 'QUINTANA ROO': 'QROO',
  'SAN LUIS POTOSI': 'SLP', 'SINALOA': 'SIN', 'SONORA': 'SON', 'TABASCO': 'TAB',
  'TAMAULIPAS': 'TAMPS', 'TLAXCALA': 'TLAX', 'VERACRUZ': 'VER', 'YUCATAN': 'YUC',
  'ZACATECAS': 'ZAC',
};
const extractEstados = (zona: string): string[] => {
  if (!zona) return [];
  const z = zona.toUpperCase()
    .replace(/MÉXICO/g, 'MEXICO').replace(/QUERÉTARO/g, 'QUERETARO')
    .replace(/MICHOACÁN/g, 'MICHOACAN').replace(/YUCATÁN/g, 'YUCATAN')
    .replace(/LEÓN/g, 'LEON').replace(/SAN LUIS POTOSÍ/g, 'SAN LUIS POTOSI')
    .replace(/COAHUILA DE ZARAGOZA/g, 'COAHUILA');
  const found = new Set<string>();
  // Direct state name matches
  for (const edo of ESTADOS_MX) {
    if (z.includes(edo)) found.add(edo);
  }
  // City/abbreviation → state mappings
  const CITY_MAP: [string, string][] = [
    // Nuevo León
    ['MONTERREY', 'NUEVO LEON'], ['MTY', 'NUEVO LEON'], ['NVO LEON', 'NUEVO LEON'], ['N.L.', 'NUEVO LEON'], ['NVO. LEON', 'NUEVO LEON'], ['APODACA', 'NUEVO LEON'], ['SAN NICOLAS', 'NUEVO LEON'], ['SANTA CATARINA', 'NUEVO LEON'], ['GARCIA NL', 'NUEVO LEON'], ['ESCOBEDO', 'NUEVO LEON'], ['GUADALUPE NL', 'NUEVO LEON'], ['CIENEGA DE FLORES', 'NUEVO LEON'], ['PESQUERIA', 'NUEVO LEON'],
    // CDMX / Edo Mex
    ['CDMX', 'CIUDAD DE MEXICO'], ['CD. DE MEXICO', 'CIUDAD DE MEXICO'], ['D.F.', 'CIUDAD DE MEXICO'], ['CIUDAD DE MEX', 'CIUDAD DE MEXICO'],
    ['EDO. MEX', 'ESTADO DE MEXICO'], ['EDO MEX', 'ESTADO DE MEXICO'], ['EDOMEX', 'ESTADO DE MEXICO'], ['TOLUCA', 'ESTADO DE MEXICO'], ['NAUCALPAN', 'ESTADO DE MEXICO'], ['TLALNEPANTLA', 'ESTADO DE MEXICO'], ['ECATEPEC', 'ESTADO DE MEXICO'], ['CUAUTITLAN', 'ESTADO DE MEXICO'], ['TULTITLAN', 'ESTADO DE MEXICO'], ['IXTAPALUCA', 'ESTADO DE MEXICO'], ['ATIZAPAN', 'ESTADO DE MEXICO'],
    // Coahuila
    ['SALTILLO', 'COAHUILA'], ['RAMOS ARIZPE', 'COAHUILA'], ['MONCLOVA', 'COAHUILA'], ['TORREON', 'COAHUILA'], ['PIEDRAS NEGRAS', 'COAHUILA'], ['ARTEAGA COAH', 'COAHUILA'], ['CIUDAD ACUÑA', 'COAHUILA'],
    // Jalisco
    ['GDL', 'JALISCO'], ['GUADALAJARA', 'JALISCO'], ['ZAPOPAN', 'JALISCO'], ['TLAQUEPAQUE', 'JALISCO'], ['TONALA JAL', 'JALISCO'], ['TLAJOMULCO', 'JALISCO'], ['EL SALTO JAL', 'JALISCO'],
    // Guanajuato
    ['LEON GTO', 'GUANAJUATO'], ['CELAYA', 'GUANAJUATO'], ['IRAPUATO', 'GUANAJUATO'], ['SILAO', 'GUANAJUATO'], ['SALAMANCA GTO', 'GUANAJUATO'], ['SAN MIGUEL ALLENDE', 'GUANAJUATO'],
    // Querétaro
    ['QRO', 'QUERETARO'], ['QUERETARO', 'QUERETARO'], ['SAN JUAN DEL RIO', 'QUERETARO'], ['EL MARQUES', 'QUERETARO'],
    // San Luis Potosí
    ['SLP', 'SAN LUIS POTOSI'], ['SAN LUIS', 'SAN LUIS POTOSI'],
    // Aguascalientes
    ['AGS', 'AGUASCALIENTES'],
    // Puebla
    ['PUEBLA', 'PUEBLA'], ['CHOLULA', 'PUEBLA'], ['TEHUACAN', 'PUEBLA'], ['SAN MARTIN TEXMELUCAN', 'PUEBLA'],
    // Tamaulipas
    ['REYNOSA', 'TAMAULIPAS'], ['MATAMOROS TAM', 'TAMAULIPAS'], ['NUEVO LAREDO', 'TAMAULIPAS'], ['TAMPICO', 'TAMAULIPAS'], ['CD. VICTORIA', 'TAMAULIPAS'], ['ALTAMIRA', 'TAMAULIPAS'],
    // Chihuahua
    ['CD. JUAREZ', 'CHIHUAHUA'], ['CIUDAD JUAREZ', 'CHIHUAHUA'], ['JUAREZ CHIH', 'CHIHUAHUA'], ['CHIHUAHUA', 'CHIHUAHUA'], ['DELICIAS', 'CHIHUAHUA'], ['CUAUHTEMOC CHIH', 'CHIHUAHUA'],
    // Sonora
    ['HERMOSILLO', 'SONORA'], ['NOGALES', 'SONORA'], ['CD. OBREGON', 'SONORA'], ['GUAYMAS', 'SONORA'], ['EMPALME', 'SONORA'],
    // Baja California
    ['TIJUANA', 'BAJA CALIFORNIA'], ['MEXICALI', 'BAJA CALIFORNIA'], ['ENSENADA', 'BAJA CALIFORNIA'], ['TECATE', 'BAJA CALIFORNIA'], ['ROSARITO', 'BAJA CALIFORNIA'],
    // Yucatán
    ['MERIDA', 'YUCATAN'],
    // Veracruz
    ['VERACRUZ', 'VERACRUZ'], ['XALAPA', 'VERACRUZ'], ['COATZACOALCOS', 'VERACRUZ'], ['BOCA DEL RIO', 'VERACRUZ'], ['CORDOBA VER', 'VERACRUZ'], ['ORIZABA', 'VERACRUZ'],
    // Sinaloa
    ['CULIACAN', 'SINALOA'], ['MAZATLAN', 'SINALOA'], ['LOS MOCHIS', 'SINALOA'],
    // Durango
    ['DURANGO', 'DURANGO'], ['GOMEZ PALACIO', 'DURANGO'], ['LERDO DGO', 'DURANGO'],
    // Michoacán
    ['MORELIA', 'MICHOACAN'], ['LAZARO CARDENAS', 'MICHOACAN'], ['URUAPAN', 'MICHOACAN'], ['ZAMORA MICH', 'MICHOACAN'],
    // Hidalgo
    ['PACHUCA', 'HIDALGO'], ['TULA HGO', 'HIDALGO'], ['TIZAYUCA', 'HIDALGO'],
    // Tlaxcala
    ['TLAXCALA', 'TLAXCALA'], ['APIZACO', 'TLAXCALA'],
    // Morelos
    ['CUERNAVACA', 'MORELOS'], ['CUAUTLA MOR', 'MORELOS'],
    // Quintana Roo
    ['CANCUN', 'QUINTANA ROO'], ['PLAYA DEL CARMEN', 'QUINTANA ROO'],
    // Tabasco
    ['VILLAHERMOSA', 'TABASCO'],
    // Zacatecas
    ['ZACATECAS', 'ZACATECAS'], ['FRESNILLO', 'ZACATECAS'],
    // Nayarit
    ['TEPIC', 'NAYARIT'],
  ];
  for (const [city, estado] of CITY_MAP) {
    if (z.includes(city)) found.add(estado);
  }
  // Filter out USA (this is northbound import, destinos are in Mexico)
  found.delete('USA');
  return Array.from(found);
};

// ============ STYLES ============
const S = {
  bg: { background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)' },
  overlay: { background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.25) 100%)' },
  card: {
    background: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%)',
    border: '1px solid rgba(80,120,180,0.2)',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  cardHover: {
    border: '1px solid rgba(240,160,80,0.5)',
    boxShadow: '0 8px 32px rgba(240,160,80,0.15), 0 4px 16px rgba(0,0,0,0.5)',
    transform: 'translateY(-4px)',
  },
  font: { fontFamily: "'Exo 2', sans-serif" },
  text: { color: 'rgba(255,255,255,0.9)', fontFamily: "'Exo 2', sans-serif" },
  textMuted: { color: 'rgba(255,255,255,0.6)', fontFamily: "'Exo 2', sans-serif" },
  textOrange: { color: 'rgba(240,160,80,1)', fontFamily: "'Exo 2', sans-serif" },
  input: {
    background: 'rgba(10,20,40,0.8)', border: '1px solid rgba(80,120,180,0.25)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.9)', fontFamily: "'Exo 2', sans-serif", padding: '10px 14px', fontSize: '14px',
    outline: 'none', width: '100%',
  },
  select: {
    background: 'rgba(10,20,40,0.8)', border: '1px solid rgba(80,120,180,0.25)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.9)', fontFamily: "'Exo 2', sans-serif", padding: '10px 14px', fontSize: '14px',
    outline: 'none', cursor: 'pointer', appearance: 'none' as const,
  },
  btn: {
    background: 'linear-gradient(135deg, rgba(240,160,80,0.9) 0%, rgba(220,140,60,0.95) 100%)',
    border: 'none', borderRadius: '8px', color: '#fff', fontFamily: "'Exo 2', sans-serif",
    fontWeight: 700, padding: '10px 20px', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.03em',
  },
  btnSecondary: {
    background: 'rgba(20,35,60,0.9)', border: '1px solid rgba(80,120,180,0.3)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.85)', fontFamily: "'Exo 2', sans-serif", fontWeight: 600,
    padding: '10px 20px', cursor: 'pointer', fontSize: '13px',
  },
  tableHeader: {
    background: 'rgba(15,25,45,0.95)', borderBottom: '2px solid rgba(240,160,80,0.3)',
    fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, color: 'rgba(240,160,80,0.9)',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '8px 10px', textAlign: 'left' as const,
  },
  tableCell: {
    fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.85)',
    padding: '6px 10px', borderBottom: '1px solid rgba(80,120,180,0.1)',
  },
};

// ============ AI HELPER ============
const callClaudeAPI = async (prompt: string): Promise<string> => {
  if (!ANTHROPIC_KEY) return 'API key no configurada. Agrega VITE_ANTHROPIC_API_KEY en tu .env';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || 'Sin respuesta';
  } catch (err) {
    console.error('Claude API error:', err);
    return 'Error al consultar IA. Verifica tu API key y conexión.';
  }
};

// ============ EXCEL EXPORT ============
const exportToExcel = (headers: string[], rows: string[][], filename: string, aiSummary?: string) => {
  const now = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; }
  .title { font-size: 18px; font-weight: bold; color: #1a3a6e; padding: 10px; }
  .subtitle { font-size: 12px; color: #666; padding: 4px 10px; }
  .ai-summary { background: #f0f4ff; border-left: 4px solid #1a3a6e; padding: 12px; margin: 10px 0; font-size: 12px; color: #333; }
  th { background-color: #1a3a6e; color: white; font-weight: bold; font-size: 12px; padding: 10px 12px; text-align: left; border: 1px solid #0d2147; }
  td { font-size: 11px; padding: 8px 12px; border: 1px solid #d0d8e8; color: #222; }
  tr:nth-child(even) td { background-color: #f5f8fc; }
  tr:hover td { background-color: #e8f0fe; }
  .highlight { background-color: #fff3e0 !important; font-weight: bold; }
  .badge-si { background: #c8e6c9; color: #2e7d32; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
  .badge-no { background: #f5f5f5; color: #999; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
  .footer { font-size: 10px; color: #999; padding: 8px 10px; margin-top: 10px; }
</style></head><body>`;
  html += `<div class="title">📊 FX27 — Servicio a Clientes</div>`;
  html += `<div class="subtitle">Reporte generado: ${now} | Grupo Loma Transportes</div>`;
  if (aiSummary) html += `<div class="ai-summary"><b>🤖 Resumen IA:</b><br/>${aiSummary.replace(/\n/g, '<br/>')}</div>`;
  html += `<br/><table cellspacing="0"><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  rows.forEach(row => {
    html += `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`;
  });
  html += `</table><div class="footer">Generado por FX27 Future Experience 27 — Grupo Loma Transportes | ${now}</div></body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}_${new Date().toISOString().slice(0,10)}.xls`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ============ KPI CARD ============
const KPICard = ({ label, value, icon: Icon, color = 'rgba(240,160,80,1)' }: { label: string; value: string | number; icon: any; color?: string }) => (
  <div style={{ ...S.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '140px' }}>
    <div style={{ background: `${color}22`, borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: '22px', height: '22px', color }} />
    </div>
    <div>
      <div style={{ ...S.font, fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ ...S.font, fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>{label}</div>
    </div>
  </div>
);

// ============ MAIN COMPONENT ============
export function AtencionClientesModule({ onBack, userEmail, userName, userRole, gmailToken: loginGmailToken }: Props) {
  const [view, setView] = useState<'home' | 'asignacion' | 'expo' | 'impo'>('home');
  const [loading, setLoading] = useState(true);

  // Data
  const [asignacion, setAsignacion] = useState<ClienteAsignacion[]>([]);
  const [expoData, setExpoData] = useState<DataExpo[]>([]);
  const [impoData, setImpoData] = useState<DataImpo[]>([]);

  // Asignacion state
  const [searchAsig, setSearchAsig] = useState('');
  const [filterEjec, setFilterEjec] = useState('TODOS');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEjecutivo, setEditEjecutivo] = useState('');
  const [editVendedor, setEditVendedor] = useState('');

  // Expo state
  const [expoTipo, setExpoTipo] = useState('THERMO');
  const [expoEstado, setExpoEstado] = useState('');
  const [expoExpanded, setExpoExpanded] = useState(false);
  const [searchExpo, setSearchExpo] = useState('');

  // Impo state
  const [searchImpo, setSearchImpo] = useState('');
  const [filterTipoImpo, setFilterTipoImpo] = useState('TODOS');
  const [impoSortCol, setImpoSortCol] = useState<string>('viajes');
  const [impoSortDir, setImpoSortDir] = useState<'asc' | 'desc'>('desc');

  // AI state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Ofertar state
  const [selectedExpo, setSelectedExpo] = useState<Set<number>>(new Set());
  const [showOfertarModal, setShowOfertarModal] = useState(false);
  const [ofertarDisp, setOfertarDisp] = useState('hoy');
  const [ofertarCustomDate, setOfertarCustomDate] = useState('');
  const [ofertarCanal, setOfertarCanal] = useState<'email' | 'whatsapp' | 'ambos'>('email');
  const [ofertarSending, setOfertarSending] = useState(false);
  const [ofertarResult, setOfertarResult] = useState<{ success: number; failed: number; details: string[] } | null>(null);
  const [gmailToken, setGmailToken] = useState('');
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailName, setGmailName] = useState('');
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Contactos modal state
  interface Contacto { id?: number; cliente_nombre: string; contacto_nombre: string; email: string; whatsapp: string; cargo: string; notas: string; }
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsCliente, setContactsCliente] = useState('');
  const [contactsList, setContactsList] = useState<Contacto[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [newContact, setNewContact] = useState<Contacto>({ cliente_nombre: '', contacto_nombre: '', email: '', whatsapp: '', cargo: '', notas: '' });
  const [clientesConContactos, setClientesConContactos] = useState<Map<string, number>>(new Map());

  // ============ FETCH DATA ============
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [asigRes, expoRes, impoRes] = await Promise.all([
          supabase.from('sc_clientes_asignacion').select('*').order('numero'),
          supabase.from('sc_data_expo').select('*').order('viajes', { ascending: false }),
          supabase.from('sc_data_impo').select('*').order('viajes', { ascending: false }),
        ]);
        if (asigRes.data) setAsignacion(asigRes.data);
        if (expoRes.data) setExpoData(expoRes.data);
        if (impoRes.data) setImpoData(impoRes.data);
        // Load contact counts per client
        const { data: contactosIdx } = await supabase.from('sc_contactos_clientes').select('cliente_nombre');
        if (contactosIdx) {
          const countMap = new Map<string, number>();
          contactosIdx.forEach(c => countMap.set(c.cliente_nombre, (countMap.get(c.cliente_nombre) || 0) + 1));
          setClientesConContactos(countMap);
        }
      } catch (err) { console.error('Error fetching data:', err); }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ============ LOAD GOOGLE IDENTITY SERVICES ============
  useEffect(() => {
    if (document.getElementById('gsi-script')) { setGsiLoaded(true); return; }
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setGsiLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ============ PRE-POPULATE GMAIL FROM LOGIN ============
  useEffect(() => {
    if (loginGmailToken && !gmailToken) {
      setGmailToken(loginGmailToken);
      setGmailEmail(userEmail || '');
      setGmailName(userName || '');
    }
  }, [loginGmailToken]);

  // ============ GMAIL OAUTH CONNECT ============
  // ============ CONTACTOS MANAGEMENT ============
  const openContactsModal = async (clienteNombre: string) => {
    setContactsCliente(clienteNombre);
    setShowContactsModal(true);
    setContactsLoading(true);
    setNewContact({ cliente_nombre: clienteNombre, contacto_nombre: '', email: '', whatsapp: '', cargo: '', notas: '' });
    try {
      const { data, error } = await supabase.from('sc_contactos_clientes').select('*').eq('cliente_nombre', clienteNombre).order('id');
      if (error) {
        console.error('Error cargando contactos:', error.message);
        setContactsList([]);
      } else {
        setContactsList(data || []);
      }
    } catch (err) {
      console.error('Error inesperado cargando contactos:', err);
      setContactsList([]);
    }
    setContactsLoading(false);
  };

  const saveNewContact = async () => {
    if (!newContact.contacto_nombre || !newContact.email || !newContact.whatsapp) return;
    setContactsSaving(true);
    try {
      const payload = {
        cliente_nombre: contactsCliente,
        contacto_nombre: newContact.contacto_nombre,
        email: newContact.email,
        whatsapp: newContact.whatsapp,
        cargo: newContact.cargo || '',
        notas: newContact.notas || '',
      };
      const { data, error } = await supabase.from('sc_contactos_clientes').insert(payload).select();
      if (error) {
        console.error('Error guardando contacto:', error.message, error.details, error.hint);
        alert(`Error al guardar contacto: ${error.message}`);
      } else if (data && data.length > 0 && data[0]) {
        setContactsList(prev => [...prev, data[0]]);
        setNewContact({ cliente_nombre: contactsCliente, contacto_nombre: '', email: '', whatsapp: '', cargo: '', notas: '' });
        setClientesConContactos(prev => { const m = new Map(prev); m.set(contactsCliente, (m.get(contactsCliente) || 0) + 1); return m; });
      } else {
        console.warn('Insert sin error pero sin data retornada. data:', data);
        alert('No se pudo guardar el contacto. Intenta de nuevo o contacta al administrador.');
      }
    } catch (err) {
      console.error('Error inesperado guardando contacto:', err);
      alert('Error de conexión al guardar contacto. Verifica tu internet e intenta de nuevo.');
    }
    setContactsSaving(false);
  };

  const deleteContact = async (id: number) => {
    const { error } = await supabase.from('sc_contactos_clientes').delete().eq('id', id);
    if (error) {
      console.error('Error eliminando contacto:', error.message);
      alert(`Error al eliminar contacto: ${error.message}`);
      return;
    }
    const newList = contactsList.filter(c => c.id !== id);
    setContactsList(newList);
    setClientesConContactos(prev => { const m = new Map(prev); const cnt = (m.get(contactsCliente) || 1) - 1; if (cnt <= 0) m.delete(contactsCliente); else m.set(contactsCliente, cnt); return m; });
  };

  const handleGmailConnect = () => {
    if (!gsiLoaded || !(window as any).google?.accounts?.oauth2) {
      alert('Google Sign-In no cargó. Recarga la página e intenta de nuevo.');
      return;
    }
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,
      callback: async (resp: any) => {
        if (resp.error) { alert('Error de autenticación: ' + resp.error); return; }
        setGmailToken(resp.access_token);
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` },
          });
          const data = await info.json();
          const domain = data.email?.split('@')[1];
          if (!ALLOWED_DOMAINS.includes(domain)) {
            alert(`El dominio @${domain} no está autorizado. Solo se permiten: ${ALLOWED_DOMAINS.join(', ')}`);
            setGmailToken('');
            return;
          }
          setGmailEmail(data.email);
          setGmailName(data.name || data.email.split('@')[0]);
        } catch { setGmailEmail('Conectado'); }
      },
    });
    tokenClient.requestAccessToken();
  };

  // ============ SEND EMAIL VIA GMAIL API ============
  const sendGmailEmail = async (to: string, subject: string, htmlBody: string): Promise<boolean> => {
    if (!gmailToken) return false;
    const boundary = 'fx27boundary';
    const raw = [
      `From: ${gmailName} <${gmailEmail}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(htmlBody))),
      `--${boundary}--`,
    ].join('\r\n');
    const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${gmailToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encoded }),
      });
      return res.ok;
    } catch { return false; }
  };

  // ============ SEND WHATSAPP VIA META API ============
  const sendWhatsApp = async (phone: string, message: string): Promise<boolean> => {
    try {
      const res = await fetch(`https://graph.facebook.com/v22.0/${WA_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/\D/g, ''),
          type: 'text',
          text: { body: message },
        }),
      });
      return res.ok;
    } catch { return false; }
  };

  // ============ BUILD OFFER MESSAGE ============
  const buildOfferMessage = (cliente: string, tipo: string, zona: string, disponibilidad: string, ejecutiva: string): string => {
    const dispText = disponibilidad === 'hoy' ? 'hoy' : disponibilidad === 'manana' ? 'mañana' : disponibilidad === 'finde' ? 'este fin de semana' : disponibilidad;
    return `Estimado equipo de ${cliente},\n\nLe informamos que tenemos equipo ${tipo} disponible en la zona de ${zona} para ${dispText}.\n\nQuedamos a sus órdenes para cualquier requerimiento de transporte.\n\nSaludos cordiales,\n${ejecutiva}\nGrupo Loma Transportes`;
  };

  const buildOfferHTML = (cliente: string, tipo: string, zona: string, disponibilidad: string, ejecutiva: string, ejecutivaEmail: string): string => {
    const dispText = disponibilidad === 'hoy' ? 'HOY' : disponibilidad === 'manana' ? 'MAÑANA' : disponibilidad === 'finde' ? 'ESTE FIN DE SEMANA' : disponibilidad.toUpperCase();
    const iconEquipo = tipo === 'THERMO' ? '❄️' : '📦';
    return `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1);">
<div style="background:linear-gradient(135deg,#001f4d,#0066cc);padding:24px 32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:24px;">🚛 Equipo Disponible</h1>
<p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Grupo Loma Transportes — FX27</p>
</div>
<div style="padding:32px;">
<p style="font-size:16px;color:#333;margin:0 0 16px;">Estimado equipo de <strong>${cliente}</strong>,</p>
<div style="background:linear-gradient(135deg,#e8f0fe,#f0f4ff);border-left:4px solid #0066cc;border-radius:8px;padding:20px;margin:20px 0;">
<p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#001f4d;">${iconEquipo} Equipo ${tipo} disponible</p>
<p style="margin:0 0 4px;color:#333;"><strong>📍 Zona:</strong> ${zona}</p>
<p style="margin:0;color:#333;"><strong>📅 Disponibilidad:</strong> ${dispText}</p>
</div>
<p style="font-size:15px;color:#555;line-height:1.6;">Quedamos a sus órdenes para cualquier requerimiento de transporte. No dude en contactarnos.</p>
<div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee;">
<p style="margin:0;font-weight:600;color:#333;">${ejecutiva}</p>
<p style="margin:4px 0 0;color:#666;font-size:14px;">${ejecutivaEmail}</p>
<p style="margin:4px 0 0;color:#666;font-size:14px;">Grupo Loma Transportes</p>
</div>
</div>
<div style="background:#f8f8f8;padding:16px;text-align:center;font-size:12px;color:#999;">
FX27 Future Experience 27 — Grupo Loma Transportes © ${new Date().getFullYear()}
</div>
</div></body></html>`;
  };

  // ============ HANDLE SEND OFERTAS ============
  const handleSendOfertas = async () => {
    const selectedClients = filteredExpo.filter(d => selectedExpo.has(d.id));
    if (selectedClients.length === 0) return;
    setOfertarSending(true);
    setOfertarResult(null);
    let success = 0, failed = 0;
    const details: string[] = [];
    const zona = expoExpanded ? `${expoEstado} y estados vecinos` : expoEstado;
    const disp = ofertarDisp === 'custom' ? ofertarCustomDate : ofertarDisp;
    const ejecutiva = gmailName || userName || 'Ejecutivo Comercial';
    const ejecutivaEmail = gmailEmail || userEmail || '';

    for (const client of selectedClients) {
      // For now: demo mode - log the offer. In production, this would look up contact info.
      // We'll store the offer in Supabase for tracking
      try {
        if (ofertarCanal === 'email' || ofertarCanal === 'ambos') {
          if (!gmailToken) {
            details.push(`⚠️ ${client.cliente}: Gmail no conectado`);
            failed++;
            continue;
          }
          // TODO: Replace with actual client email from sc_contactos_clientes table
          // For now, log as pending contact
          details.push(`📧 ${client.cliente}: Pendiente — agregar email de contacto`);
        }
        if (ofertarCanal === 'whatsapp' || ofertarCanal === 'ambos') {
          details.push(`📱 ${client.cliente}: Pendiente — agregar WhatsApp de contacto`);
        }
        // Log offer to Supabase
        await supabase.from('sc_ofertas_log').insert({
          cliente: client.cliente,
          canal: ofertarCanal,
          tipo_equipo: expoTipo,
          zona: zona,
          disponibilidad: disp,
          estado_origen: client.estado,
          viajes_historicos: client.viajes,
          enviado_por: gmailEmail || userEmail || 'unknown',
          status: 'pendiente_contacto',
        }).then(() => { success++; }).catch(() => { failed++; });
      } catch { failed++; details.push(`❌ ${client.cliente}: Error`); }
    }
    setOfertarResult({ success, failed, details });
    setOfertarSending(false);
  };

  // ============ EXPO SELECTION HELPERS ============
  const toggleSelectExpo = (id: number) => {
    setSelectedExpo(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAllExpo = () => {
    if (selectedExpo.size === filteredExpo.length) setSelectedExpo(new Set());
    else setSelectedExpo(new Set(filteredExpo.map(d => d.id)));
  };

  // ============ ASIGNACION LOGIC ============
  const handleAssign = async (id: number, ejecutivo: string, vendedor: string) => {
    const vend = vendedor === 'PENDIENTE' || !vendedor ? '' : vendedor;
    const status = (ejecutivo === 'PENDIENTE' && !vend) ? 'PENDIENTE' : 'ASIGNADO';
    const { error } = await supabase.from('sc_clientes_asignacion')
      .update({ ejecutivo_sc: ejecutivo, vendedor: vend, status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setAsignacion(prev => prev.map(c => c.id === id ? { ...c, ejecutivo_sc: ejecutivo, vendedor: vend, status } : c));
      setEditingId(null);
    }
  };

  const filteredAsignacion = useMemo(() => {
    let data = asignacion;
    if (filterEjec === 'ISIS' || filterEjec === 'LEO') {
      data = data.filter(c => c.vendedor === filterEjec);
    } else if (filterEjec === 'PENDIENTE') {
      data = data.filter(c => c.status === 'PENDIENTE');
    } else if (filterEjec !== 'TODOS') {
      data = data.filter(c => c.ejecutivo_sc === filterEjec);
    }
    if (searchAsig) {
      const q = searchAsig.toLowerCase();
      data = data.filter(c => c.cliente.toLowerCase().includes(q) || (c.notas || '').toLowerCase().includes(q) || (c.vendedor || '').toLowerCase().includes(q));
    }
    // CSR filter: show only their clients
    if (userRole === 'csr' && userEmail) {
      const csrName = userName?.split(' ')[0]?.toUpperCase() || '';
      if (csrName === 'LIZ' || csrName === 'ELI') {
        data = data.filter(c => c.ejecutivo_sc === csrName || c.status === 'PENDIENTE');
      }
    }
    return data;
  }, [asignacion, filterEjec, searchAsig, userRole, userEmail, userName]);

  const asigKPIs = useMemo(() => ({
    total: asignacion.length,
    isis: asignacion.filter(c => c.vendedor === 'ISIS').length,
    leo: asignacion.filter(c => c.vendedor === 'LEO').length,
    eli: asignacion.filter(c => c.ejecutivo_sc === 'ELI').length,
    liz: asignacion.filter(c => c.ejecutivo_sc === 'LIZ').length,
    pendientes: asignacion.filter(c => c.status === 'PENDIENTE').length,
  }), [asignacion]);

  // ============ EXPO LOGIC ============
  const estadosDisponibles = useMemo(() => {
    const estados = [...new Set(expoData.map(d => d.estado))].sort();
    return estados;
  }, [expoData]);

  const filteredExpo = useMemo(() => {
    if (!expoEstado) return [];
    let targetEstados = [expoEstado];
    if (expoExpanded && NEIGHBOR_STATES[expoEstado]) {
      targetEstados = [expoEstado, ...NEIGHBOR_STATES[expoEstado]];
    }
    let data = expoData.filter(d => d.tipo === expoTipo && targetEstados.includes(d.estado) && !isExcludedExpo(d.cliente));
    if (searchExpo) {
      const q = searchExpo.toLowerCase();
      data = data.filter(d => d.cliente.toLowerCase().includes(q) || d.origenes.toLowerCase().includes(q));
    }
    return data.sort((a, b) => b.viajes - a.viajes);
  }, [expoData, expoTipo, expoEstado, expoExpanded, searchExpo]);

  const expoKPIs = useMemo(() => ({
    clientes: filteredExpo.length,
    viajes: filteredExpo.reduce((s, d) => s + d.viajes, 0),
    formatos: filteredExpo.reduce((s, d) => s + d.num_formatos, 0),
  }), [filteredExpo]);

  // ============ IMPO LOGIC ============
  const handleImpoSort = (col: string) => {
    if (impoSortCol === col) setImpoSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setImpoSortCol(col); setImpoSortDir(col === 'cliente' ? 'asc' : 'desc'); }
  };
  const SortIcon = ({ col }: { col: string }) => {
    if (impoSortCol !== col) return <ChevronDown style={{ width: '12px', height: '12px', opacity: 0.3, marginLeft: '2px' }} />;
    return impoSortDir === 'asc'
      ? <ChevronUp style={{ width: '12px', height: '12px', opacity: 0.9, marginLeft: '2px', color: 'rgba(240,160,80,1)' }} />
      : <ChevronDown style={{ width: '12px', height: '12px', opacity: 0.9, marginLeft: '2px', color: 'rgba(240,160,80,1)' }} />;
  };

  // SC ejecutivo lookup from asignacion data
  const getEjecutivoSC = (cliente: string): string => {
    const c = cliente.toUpperCase().trim();
    const match = asignacion.find(a => {
      const ac = a.cliente.toUpperCase().trim();
      return ac === c || c.includes(ac) || ac.includes(c);
    });
    return match ? match.ejecutivo_sc : '—';
  };

  // Ventas ejecutivo lookup from asignacion data
  const getEjecutivoImpo = (cliente: string): string => {
    const c = cliente.toUpperCase().trim();
    const match = asignacion.find(a => {
      const ac = a.cliente.toUpperCase().trim();
      return ac === c || c.includes(ac) || ac.includes(c);
    });
    return match?.vendedor || '—';
  };

  // Consolidate duplicate clients with smart normalization
  const consolidatedImpo = useMemo(() => {
    const filtered = impoData.filter(d => !isExcludedImpo(d.cliente));
    const map = new Map<string, { id: number; cliente: string; viajes: number; thermo: number; seco: number; formatos: number; tipo_equipo: string; estados: Set<string>; rawZonas: Set<string> }>();
    filtered.forEach(d => {
      const key = normalizeClient(d.cliente);
      const estados = extractEstados(d.zona_entrega);
      if (map.has(key)) {
        const ex = map.get(key)!;
        ex.viajes += d.viajes;
        ex.thermo += d.thermo;
        ex.seco += d.seco;
        ex.formatos += d.formatos;
        estados.forEach(e => ex.estados.add(e));
        if (d.zona_entrega) ex.rawZonas.add(d.zona_entrega.trim());
        if (ex.thermo > 0 && ex.seco > 0) ex.tipo_equipo = 'THERMO / SECO';
        else if (ex.thermo > 0) ex.tipo_equipo = 'THERMO';
        else ex.tipo_equipo = 'SECO';
      } else {
        const rawSet = new Set<string>();
        if (d.zona_entrega) rawSet.add(d.zona_entrega.trim());
        map.set(key, { id: d.id, cliente: key.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ').replace(/\b(De|Del|Y|S\.a\.|S\.a|Sa|Cv|Llc|Inc|Ltd)\b/gi, m => m.toLowerCase()), viajes: d.viajes, thermo: d.thermo, seco: d.seco, formatos: d.formatos, tipo_equipo: d.tipo_equipo, estados: new Set(estados), rawZonas: rawSet });
      }
    });
    return Array.from(map.values()).map(d => {
      const edos = Array.from(d.estados).sort();
      const abrevs = edos.map(e => ESTADO_DISPLAY[e] || e);
      // If no states were recognized, use raw zona_entrega as fallback (skip USA addresses)
      const USA_KEYWORDS = ['TEXAS', 'TX ', 'CAROLINA', 'MINNESOTA', 'CHICAGO', 'KENTUCKY', 'NASHVILLE', 'TENNESSEE', 'INDIANA', 'OHIO', 'MICHIGAN', 'WISCONSIN', 'ILLINOIS', 'IOWA', 'ARKANSAS', 'OKLAHOMA', 'GEORGIA', 'FLORIDA', 'VIRGINIA', 'MARYLAND', 'PENNSYLVANIA', 'NEW YORK', 'NEW JERSEY', 'CONNECTICUT', 'MASSACHUSETTS', 'CALIFORNIA', 'ARIZONA', 'NEVADA', 'COLORADO', 'UTAH', 'OREGON', 'WASHINGTON', 'SPARTANBURG', 'EL PASO', 'LAREDO TX', 'STATE HWY', 'USA'];
      const rawArr = Array.from(d.rawZonas).filter(r => !USA_KEYWORDS.some(kw => r.toUpperCase().includes(kw)));
      const fallback = abrevs.length === 0 ? rawArr.slice(0, 3).join(', ') : '';
      return { ...d, estadosStr: abrevs.join(', ') || fallback || '—' };
    });
  }, [impoData]);

  const filteredImpo = useMemo(() => {
    let data = consolidatedImpo;
    if (filterTipoImpo !== 'TODOS') {
      if (filterTipoImpo === 'THERMO') data = data.filter(d => d.thermo > 0);
      else if (filterTipoImpo === 'SECO') data = data.filter(d => d.seco > 0);
    }
    if (searchImpo) {
      const q = searchImpo.toLowerCase();
      data = data.filter(d => d.cliente.toLowerCase().includes(q) || d.estadosStr.toLowerCase().includes(q) || getEjecutivoImpo(d.cliente).toLowerCase().includes(q) || getEjecutivoSC(d.cliente).toLowerCase().includes(q));
    }
    data = [...data].sort((a, b) => {
      let va: any, vb: any;
      switch (impoSortCol) {
        case 'cliente': va = a.cliente.toUpperCase(); vb = b.cliente.toUpperCase(); break;
        case 'viajes': va = a.viajes; vb = b.viajes; break;
        case 'thermo': va = a.thermo; vb = b.thermo; break;
        case 'seco': va = a.seco; vb = b.seco; break;
        case 'formatos': va = a.formatos; vb = b.formatos; break;
        case 'tipo_equipo': va = a.tipo_equipo; vb = b.tipo_equipo; break;
        case 'zona': va = a.estadosStr; vb = b.estadosStr; break;
        case 'ejecutivo': va = getEjecutivoImpo(a.cliente); vb = getEjecutivoImpo(b.cliente); break;
        case 'ejecutivoSC': va = getEjecutivoSC(a.cliente); vb = getEjecutivoSC(b.cliente); break;
        default: va = a.viajes; vb = b.viajes;
      }
      if (typeof va === 'string') return impoSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return impoSortDir === 'asc' ? va - vb : vb - va;
    });
    return data;
  }, [consolidatedImpo, filterTipoImpo, searchImpo, impoSortCol, impoSortDir, asignacion]);

  const impoKPIs = useMemo(() => ({
    clientes: filteredImpo.length,
    viajes: filteredImpo.reduce((s, d) => s + d.viajes, 0),
    thermo: filteredImpo.reduce((s, d) => s + d.thermo, 0),
    seco: filteredImpo.reduce((s, d) => s + d.seco, 0),
  }), [filteredImpo]);

  // ============ AI SEARCH ============
  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    let context = '';
    if (view === 'asignacion') {
      context = `Datos de asignación de clientes (${asignacion.length} clientes). Vendedores: ISIS ${asigKPIs.isis}, LEO ${asigKPIs.leo}. CSR: ELI ${asigKPIs.eli}, LIZ ${asigKPIs.liz}. PENDIENTES: ${asigKPIs.pendientes}. Lista: ${asignacion.slice(0, 50).map(c => `${c.cliente} (Vta:${c.vendedor || '—'}, SC:${c.ejecutivo_sc})`).join(', ')}...`;
    } else if (view === 'expo') {
      const expoSample = filteredExpo.length > 0 ? filteredExpo : expoData.slice(0, 30);
      context = `Datos de exportación (471 registros). Filtro actual: ${expoTipo} en ${expoEstado || 'sin seleccionar'}. Resultados: ${expoSample.map(d => `${d.cliente}: ${d.viajes} viajes desde ${d.estado} (${d.tipo}, Ded:${d.dedicado}, Cruce:${d.cruce})`).join(' | ')}`;
    } else if (view === 'impo') {
      context = `Datos de importación (${impoData.length} clientes). Top: ${impoData.slice(0, 20).map(d => `${d.cliente}: ${d.viajes}v (T:${d.thermo}/S:${d.seco})`).join(' | ')}`;
    }
    const prompt = `Eres un asistente de Servicio a Clientes para Grupo Loma Transportes (TROB/WEXPRESS/SPEEDYHAUL), empresa de transporte con 242 tractores. Responde en español, conciso y útil.\n\nContexto de datos:\n${context}\n\nPregunta del usuario: ${aiQuery}\n\nResponde de forma directa, práctica y orientada a la acción. Si es una búsqueda, lista los resultados relevantes. Si es una consulta de negocio, da recomendaciones concretas.`;
    const result = await callClaudeAPI(prompt);
    setAiResult(result);
    setAiLoading(false);
  };

  // ============ EXPORT WITH AI ============
  const handleExportWithAI = async (headers: string[], rows: string[][], filename: string, dataContext: string) => {
    setExporting(true);
    let aiSummary = '';
    if (ANTHROPIC_KEY) {
      const prompt = `Genera un resumen ejecutivo breve (3-4 oraciones) en español para este reporte de ${filename} de Grupo Loma Transportes. Datos: ${dataContext}. Incluye insights clave y recomendaciones. Solo el texto, sin títulos ni formato markdown.`;
      aiSummary = await callClaudeAPI(prompt);
    }
    exportToExcel(headers, rows, filename, aiSummary);
    setExporting(false);
  };

  // ============ COMMON HEADER — EXACT MODULETEMPLATE ============
  const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ position: 'relative', height: '119px', overflow: 'hidden', marginBottom: '0px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a1628 0%, #0d1f35 25%, #0f2847 50%, #0a1e38 75%, #081420 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,30,56,0.9) 0%, rgba(20,45,75,0.6) 30%, rgba(15,35,60,0.7) 70%, rgba(10,20,40,0.9) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(59,130,246,0.08) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,15,28,0.4) 0%, rgba(8,15,28,0.2) 50%, rgba(8,15,28,0.5) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.2) 20%, rgba(59,130,246,0.3) 50%, rgba(59,130,246,0.2) 80%, transparent 100%)' }} />
      <div style={{ position: 'absolute', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', top: '13px', right: '32px' }}>
        <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '72px', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px',
          background: 'linear-gradient(135deg, #E8EEF4 0%, #B5C4D8 30%, #D8DFE8 55%, #9FB0C5 80%, #D0D9E4 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(2px 0 4px rgba(160,180,210,0.2)) drop-shadow(-1px 0 2px rgba(255,255,255,0.1))' }}>FX27</div>
        <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase' as const,
          color: 'rgba(240,160,80,0.75)', marginTop: '4px', marginRight: '-3px',
          filter: 'blur(0.5px) drop-shadow(0 0 8px rgba(240,160,80,0.6)) drop-shadow(0 0 16px rgba(240,160,80,0.4))' }}>Future Experience 27</div>
      </div>
      <div style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', paddingTop: '25px', paddingLeft: '24px', paddingRight: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={() => setView('home')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px',
              background: '#fe5000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(254,80,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#cc4000'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fe5000'; }}>
            <ArrowLeft style={{ width: '24px', height: '24px', strokeWidth: 2.5 }} />
          </button>
          <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600, fontSize: '32px', lineHeight: 1, color: 'white', margin: 0 }}>{title}</h1>
        </div>
      </div>
    </div>
  );

  // ============ AI PANEL ============
  const AIPanel = () => showAI ? (
    <div style={{ ...S.card, padding: '16px', marginBottom: '16px', borderColor: 'rgba(240,160,80,0.3)' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: aiResult ? '12px' : '0' }}>
        <Brain style={{ width: '20px', height: '20px', color: 'rgba(240,160,80,0.9)', flexShrink: 0 }} />
        <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Pregunta algo... ej: ¿Qué clientes cargan thermo en Jalisco?"
          style={{ ...S.input, flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleAISearch()} />
        <button onClick={handleAISearch} disabled={aiLoading}
          style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px', opacity: aiLoading ? 0.7 : 1 }}>
          {aiLoading ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Search style={{ width: '16px', height: '16px' }} />}
          {aiLoading ? 'Buscando...' : 'Buscar'}
        </button>
        <button onClick={() => { setShowAI(false); setAiResult(''); setAiQuery(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>
      {aiResult && (
        <div style={{ background: 'rgba(240,160,80,0.08)', border: '1px solid rgba(240,160,80,0.2)', borderRadius: '8px', padding: '14px', marginTop: '8px' }}>
          <pre style={{ ...S.text, fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{aiResult}</pre>
        </div>
      )}
    </div>
  ) : null;

  // ============ LOADING ============
  if (loading) return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...S.overlay, position: 'absolute', inset: 0 }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <Loader2 style={{ width: '48px', height: '48px', color: 'rgba(240,160,80,0.8)', animation: 'spin 1s linear infinite' }} />
        <p style={{ ...S.text, marginTop: '12px', fontSize: '14px' }}>Cargando datos...</p>
      </div>
    </div>
  );

  // ============ HOME VIEW ============
  if (view === 'home') return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', pointerEvents: 'none', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '80%', height: '68%',
        background: 'radial-gradient(ellipse at center, rgba(30,80,160,0.08) 0%, rgba(40,90,170,0.04) 35%, transparent 70%)',
        filter: 'blur(90px)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HEADER BAR */}
        <div style={{ position: 'relative', height: '119px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a1628 0%, #0d1f35 25%, #0f2847 50%, #0a1e38 75%, #081420 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,30,56,0.9) 0%, rgba(20,45,75,0.6) 30%, rgba(15,35,60,0.7) 70%, rgba(10,20,40,0.9) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(59,130,246,0.08) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,15,28,0.4) 0%, rgba(8,15,28,0.2) 50%, rgba(8,15,28,0.5) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.2) 20%, rgba(59,130,246,0.3) 50%, rgba(59,130,246,0.2) 80%, transparent 100%)' }} />
          <div style={{ position: 'absolute', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', top: '13px', right: '32px' }}>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '72px', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px',
              background: 'linear-gradient(135deg, #E8EEF4 0%, #B5C4D8 30%, #D8DFE8 55%, #9FB0C5 80%, #D0D9E4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(2px 0 4px rgba(160,180,210,0.2)) drop-shadow(-1px 0 2px rgba(255,255,255,0.1))' }}>FX27</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'rgba(240,160,80,0.75)', marginTop: '4px', marginRight: '-3px',
              filter: 'blur(0.5px) drop-shadow(0 0 8px rgba(240,160,80,0.6)) drop-shadow(0 0 16px rgba(240,160,80,0.4))' }}>Future Experience 27</div>
          </div>
          <div style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', gap: '24px', paddingTop: '25px', paddingLeft: '24px' }}>
            <button onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px',
                background: '#fe5000', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(254,80,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#cc4000'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fe5000'; }}>
              <ArrowLeft style={{ width: '24px', height: '24px', strokeWidth: 2.5 }} />
            </button>
            <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600, fontSize: '32px', lineHeight: 1, color: 'white', margin: 0 }}>Servicio a Clientes</h1>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '40px 48px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* KPI CARDS — 6 items in 3-col grid (2 rows) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
            {[
              { label: 'CLIENTES ACTIVOS', value: asigKPIs.total, icon: Users, color: 'rgba(240,160,80,1)' },
              { label: 'VTA: ISIS', value: asigKPIs.isis, icon: Truck, color: '#4caf50' },
              { label: 'VTA: LEO', value: asigKPIs.leo, icon: Truck, color: '#29b6f6' },
              { label: 'CSR: ELI', value: asigKPIs.eli, icon: UserCheck, color: '#ba68c8' },
              { label: 'CSR: LIZ', value: asigKPIs.liz, icon: UserCheck, color: '#2196f3' },
              { label: 'PENDIENTES', value: asigKPIs.pendientes, icon: AlertTriangle, color: '#ff9800' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} style={{
                  background: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%)',
                  border: '1px solid rgba(80,120,180,0.2)', borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, transparent, ${kpi.color}66 50%, transparent)` }} />
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${kpi.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: '22px', height: '22px', color: kpi.color }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '28px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>{kpi.value}</div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, color: kpi.color,
                      letterSpacing: '0.1em', marginTop: '4px', textTransform: 'uppercase' }}>{kpi.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3 MAIN SECTION BUTTONS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { id: 'asignacion' as const, title: 'Asignación de Clientes', desc: `${asigKPIs.total} clientes · ${asigKPIs.pendientes} pendientes`, icon: ClipboardList },
              { id: 'expo' as const, title: 'Expo Radar', desc: `${expoData.length} registros · 25 estados · THERMO/SECO`, icon: Upload },
              { id: 'impo' as const, title: 'Importación', desc: `${impoData.length} clientes · USA → México`, icon: Download },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setView(item.id)}
                  className="group"
                  style={{
                    background: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%)',
                    border: '2px solid transparent',
                    backgroundImage: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)',
                    backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box',
                    borderRadius: '10px', cursor: 'pointer', textAlign: 'center' as const,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(0,0,0,0.2)',
                    padding: '48px 32px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '20px',
                    transition: 'all 0.3s ease', position: 'relative' as const, overflow: 'hidden', transform: 'translateY(0)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(28,48,82,1) 0%, rgba(20,35,62,1) 35%, rgba(14,24,45,1) 70%, rgba(10,18,35,1) 100%), linear-gradient(135deg, rgba(240,160,80,0.65) 0%, rgba(220,140,70,0.6) 25%, rgba(70,110,170,0.4) 50%, rgba(220,140,70,0.6) 75%, rgba(240,160,80,0.65) 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.6), 0 0 30px rgba(240,160,80,0.15), inset 0 1px 0 rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(0,0,0,0.2)';
                  }}>
                  <div className="absolute top-0 left-0 right-0 h-[35%] opacity-30 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }} />
                  <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(240,160,80,0.3) 15%, rgba(240,160,80,0.85) 50%, rgba(240,160,80,0.3) 85%, transparent 100%)',
                      boxShadow: '0 2px 12px rgba(240,160,80,0.5), 0 0 20px rgba(240,160,80,0.3)', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(240,160,80,0.15) 0%, rgba(220,140,70,0.08) 40%, transparent 70%)', borderRadius: '10px' }} />
                  <Icon className="relative z-10 transition-all duration-300 group-hover:text-[rgba(240,160,80,1)]"
                    style={{ width: '56px', height: '56px', color: 'rgba(255,255,255,0.95)', strokeWidth: 1.4,
                      filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6)) drop-shadow(0 0 14px rgba(255,255,255,0.15))' }} />
                  <div className="relative z-10">
                    <div className="transition-all duration-300 group-hover:text-[rgba(240,160,80,1)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.8)' }}>{item.title}</div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '6px' }}>{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ============ ASIGNACION VIEW ============
  if (view === 'asignacion') return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header title="Asignación de Clientes" />
        <div style={{ padding: '12px 40px 4px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
          <KPICard label="Total Clientes" value={asigKPIs.total} icon={Users} />
          <KPICard label="Vta: ISIS" value={asigKPIs.isis} icon={Truck} color="#4caf50" />
          <KPICard label="Vta: LEO" value={asigKPIs.leo} icon={Truck} color="#29b6f6" />
          <KPICard label="CSR: Eli" value={asigKPIs.eli} icon={UserCheck} color="#ba68c8" />
          <KPICard label="CSR: Liz" value={asigKPIs.liz} icon={UserCheck} color="#2196f3" />
          <KPICard label="Pendientes" value={asigKPIs.pendientes} icon={AlertTriangle} color="#ff9800" />
        </div>

        {/* Filters & Actions */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
            <input value={searchAsig} onChange={e => setSearchAsig(e.target.value)} placeholder="Buscar cliente..."
              style={{ ...S.input, paddingLeft: '38px' }} />
          </div>
          <select value={filterEjec} onChange={e => setFilterEjec(e.target.value)} style={{ ...S.select, width: '200px' }}>
            <option value="TODOS">Todos</option>
            <option value="ISIS">Vendedor: ISIS</option>
            <option value="LEO">Vendedor: LEO</option>
            <option value="ELI">CSR: ELI</option>
            <option value="LIZ">CSR: LIZ</option>
            <option value="PENDIENTE">Pendientes</option>
          </select>
          {userRole === 'admin' && (
          <button onClick={() => {
            const headers = ['#', 'CLIENTE', 'VENDEDOR', 'EJECUTIVO SC', 'STATUS', 'NOTAS'];
            const rows = filteredAsignacion.map(c => [String(c.numero), c.cliente, c.vendedor || '', c.ejecutivo_sc, c.status, c.notas || '']);
            const ctx = `${asigKPIs.total} clientes. Vendedores: ISIS ${asigKPIs.isis}, LEO ${asigKPIs.leo}. CSR: ELI ${asigKPIs.eli}, LIZ ${asigKPIs.liz}. Pendientes: ${asigKPIs.pendientes}`;
            handleExportWithAI(headers, rows, 'Asignacion_Clientes_SC', ctx);
          }} disabled={exporting}
            style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {exporting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet style={{ width: '16px', height: '16px' }} />}
            Exportar Excel
          </button>
          )}
        </div>

        {/* Table */}
        <div style={{ ...S.card, overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ ...S.tableHeader, width: '50px' }}>#</th>
                  <th style={{ ...S.tableHeader }}>Cliente</th>
                  <th style={{ ...S.tableHeader, width: '110px' }}>Vendedor</th>
                  <th style={{ ...S.tableHeader, width: '120px' }}>Ejecutivo SC</th>
                  <th style={{ ...S.tableHeader, width: '100px' }}>Status</th>
                  <th style={{ ...S.tableHeader }}>Notas</th>
                  <th style={{ ...S.tableHeader, width: '200px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredAsignacion.map(c => {
                  const contactCount = clientesConContactos.get(c.cliente) || 0;
                  const incomplete = contactCount < 2;
                  return (
                  <tr key={c.id} style={{ transition: 'background 0.2s', borderLeft: incomplete ? '3px solid rgba(255,80,80,0.7)' : '3px solid rgba(76,175,80,0.5)', background: incomplete ? 'rgba(255,80,80,0.03)' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = incomplete ? 'rgba(255,80,80,0.07)' : 'rgba(240,160,80,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = incomplete ? 'rgba(255,80,80,0.03)' : 'transparent')}>
                    <td style={{ ...S.tableCell, color: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{c.numero}</span>
                        {incomplete && <span title={`${contactCount === 0 ? 'Sin contactos' : `Solo ${contactCount} contacto — mínimo 2`}`} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff5252', display: 'inline-block', flexShrink: 0 }} />}
                      </div>
                    </td>
                    <td style={{ ...S.tableCell, fontWeight: 600 }}>{c.cliente}</td>
                    {/* VENDEDOR COLUMN */}
                    <td style={S.tableCell}>
                      {editingId === c.id ? (
                        <select value={editVendedor} onChange={e => setEditVendedor(e.target.value)}
                          style={{ ...S.select, padding: '6px 10px', fontSize: '12px', width: '100px' }}>
                          <option value="">—</option>
                          {VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                          background: c.vendedor === 'ISIS' ? 'rgba(76,175,80,0.15)' : c.vendedor === 'LEO' ? 'rgba(41,182,246,0.15)' : 'transparent',
                          color: c.vendedor === 'ISIS' ? '#66bb6a' : c.vendedor === 'LEO' ? '#29b6f6' : 'rgba(255,255,255,0.25)',
                        }}>{c.vendedor || '—'}</span>
                      )}
                    </td>
                    {/* EJECUTIVO SC COLUMN */}
                    <td style={S.tableCell}>
                      {editingId === c.id ? (
                        <select value={editEjecutivo} onChange={e => setEditEjecutivo(e.target.value)}
                          style={{ ...S.select, padding: '6px 10px', fontSize: '12px', width: '100px' }}>
                          <option value="PENDIENTE">PENDIENTE</option>
                          {EJECUTIVOS_SC.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      ) : (
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                          background: c.ejecutivo_sc === 'ELI' ? 'rgba(186,104,200,0.15)' : c.ejecutivo_sc === 'LIZ' ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                          color: c.ejecutivo_sc === 'ELI' ? '#ba68c8' : c.ejecutivo_sc === 'LIZ' ? '#42a5f5' : '#ffa726',
                        }}>{c.ejecutivo_sc}</span>
                      )}
                    </td>
                    <td style={S.tableCell}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                        background: c.status === 'ASIGNADO' ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)',
                        color: c.status === 'ASIGNADO' ? '#66bb6a' : '#ffa726',
                      }}>{c.status}</span>
                    </td>
                    <td style={{ ...S.tableCell, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{c.notas || '—'}</td>
                    <td style={S.tableCell}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {userRole === 'admin' && editingId === c.id ? (
                        <>
                          <button onClick={() => handleAssign(c.id, editEjecutivo, editVendedor)}
                            style={{ background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                            <Check style={{ width: '14px', height: '14px', color: '#66bb6a' }} />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                            <X style={{ width: '14px', height: '14px', color: '#ff6b6b' }} />
                          </button>
                        </>
                      ) : userRole === 'admin' ? (
                        <button onClick={() => { setEditingId(c.id); setEditEjecutivo(c.ejecutivo_sc); setEditVendedor(c.vendedor || ''); }}
                          style={{ ...S.btnSecondary, padding: '5px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck style={{ width: '13px', height: '13px' }} /> Asignar
                        </button>
                      ) : null}
                      <button onClick={() => openContactsModal(c.cliente)}
                        style={{
                          ...S.btnSecondary, padding: '5px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
                          background: (clientesConContactos.get(c.cliente) || 0) >= 2 ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.04)',
                          borderColor: (clientesConContactos.get(c.cliente) || 0) >= 2 ? 'rgba(76,175,80,0.4)' : undefined,
                          color: (clientesConContactos.get(c.cliente) || 0) >= 2 ? '#66bb6a' : undefined,
                        }}>
                        <Mail style={{ width: '13px', height: '13px' }} /> Contactos
                      </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '8px', textAlign: 'right', flexShrink: 0 }}>
          Mostrando {filteredAsignacion.length} de {asignacion.length} clientes
        </div>
      </div></div>
      {/* CONTACTOS MODAL */}
      {showContactsModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowContactsModal(false)} />
          <div style={{ ...S.card, position: 'relative', width: '720px', maxHeight: '85vh', overflow: 'auto', padding: '0', border: '1px solid rgba(59,130,246,0.3)' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>
                  <Mail style={{ width: '18px', height: '18px', display: 'inline', marginRight: '8px', color: '#60a5fa' }} />
                  Contactos — {contactsCliente}
                </h3>
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                  Mínimo 2 contactos con correo y WhatsApp para envío de ofertas
                </p>
                {!contactsLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', maxWidth: '120px' }}>
                      <div style={{ height: '100%', borderRadius: '2px', width: `${Math.min(contactsList.length / 2 * 100, 100)}%`, background: contactsList.length >= 2 ? '#4caf50' : '#ff5252', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, color: contactsList.length >= 2 ? '#4caf50' : '#ff5252' }}>
                      {contactsList.length}/2 {contactsList.length >= 2 ? '✓ Completo' : 'mínimo'}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowContactsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
            {/* Existing contacts */}
            <div style={{ padding: '16px 24px' }}>
              {contactsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Exo 2', sans-serif" }}>
                  <Loader2 style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                  Cargando contactos...
                </div>
              ) : contactsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                  ⚠️ Sin contactos registrados. Se requieren mínimo 2 contactos con correo y WhatsApp.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {contactsList.filter(ct => ct && ct.contacto_nombre !== undefined).map((ct, i) => (
                    <div key={ct.id || i} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 16px',
                      border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white' }}>
                          {ct.contacto_nombre || 'Sin nombre'}
                          {ct.cargo && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>— {ct.cargo}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                          {ct.email && (
                            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail style={{ width: '12px', height: '12px' }} /> {ct.email}
                            </span>
                          )}
                          {ct.whatsapp && (
                            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone style={{ width: '12px', height: '12px' }} /> {ct.whatsapp}
                            </span>
                          )}
                        </div>
                        {ct.notas && <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{ct.notas}</div>}
                      </div>
                      <button onClick={() => ct.id && deleteContact(ct.id)}
                        style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
                        <Trash2 style={{ width: '14px', height: '14px', color: '#ff6b6b' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Add new contact form */}
              <div style={{
                background: 'rgba(59,130,246,0.06)', borderRadius: '8px', padding: '16px',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
                <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600, color: '#60a5fa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus style={{ width: '14px', height: '14px' }} /> Agregar Contacto
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input value={newContact.contacto_nombre} onChange={e => setNewContact(p => ({ ...p, contacto_nombre: e.target.value }))}
                    placeholder="Nombre del contacto" style={{ ...S.input, fontSize: '13px', padding: '8px 12px' }} />
                  <input value={newContact.cargo} onChange={e => setNewContact(p => ({ ...p, cargo: e.target.value }))}
                    placeholder="Cargo (ej: Logística, Compras)" style={{ ...S.input, fontSize: '13px', padding: '8px 12px' }} />
                  <input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
                    placeholder="correo@empresa.com" style={{ ...S.input, fontSize: '13px', padding: '8px 12px' }} />
                  <input value={newContact.whatsapp} onChange={e => setNewContact(p => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="WhatsApp (ej: 52 81 1234 5678)" style={{ ...S.input, fontSize: '13px', padding: '8px 12px' }} />
                  <input value={newContact.notas} onChange={e => setNewContact(p => ({ ...p, notas: e.target.value }))}
                    placeholder="Notas (opcional)" style={{ ...S.input, fontSize: '13px', padding: '8px 12px', gridColumn: '1 / -1' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button onClick={saveNewContact} disabled={contactsSaving || !newContact.contacto_nombre || !newContact.email || !newContact.whatsapp}
                    style={{
                      ...S.btn, padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                      opacity: (!newContact.contacto_nombre || !newContact.email || !newContact.whatsapp) ? 0.4 : 1,
                    }}>
                    {contactsSaving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '14px', height: '14px' }} />}
                    Guardar Contacto
                  </button>
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '6px 0 0', textAlign: 'center' }}>
                    * Nombre, correo y WhatsApp son obligatorios
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ============ OFERTAR MODAL ============
  const OfertarModal = () => {
    if (!showOfertarModal) return null;
    const selectedClients = filteredExpo.filter(d => selectedExpo.has(d.id));
    const zona = expoExpanded ? `${expoEstado} y estados vecinos` : expoEstado;
    const dispLabel = ofertarDisp === 'hoy' ? 'HOY' : ofertarDisp === 'manana' ? 'MAÑANA' : ofertarDisp === 'finde' ? 'FIN DE SEMANA' : ofertarCustomDate || 'FECHA';
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => { setShowOfertarModal(false); setOfertarResult(null); }} />
        <div style={{ ...S.card, position: 'relative', width: '680px', maxHeight: '85vh', overflow: 'auto', padding: '0', border: '1px solid rgba(240,160,80,0.3)' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(80,120,180,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 2, background: 'rgba(12,22,42,0.98)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Send style={{ width: '22px', height: '22px', color: 'rgba(240,160,80,1)' }} />
              <div>
                <div style={{ ...S.text, fontSize: '18px', fontWeight: 700 }}>Ofertar Equipo</div>
                <div style={{ ...S.textMuted, fontSize: '12px' }}>{selectedClients.length} clientes seleccionados · {expoTipo} · {zona}</div>
              </div>
            </div>
            <button onClick={() => { setShowOfertarModal(false); setOfertarResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <X style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.5)' }} />
            </button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Gmail Connection */}
            <div style={{ ...S.card, padding: '14px 18px', marginBottom: '16px', border: gmailToken ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,152,0,0.3)' }}>
              {gmailToken ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail style={{ width: '18px', height: '18px', color: '#66bb6a' }} />
                    <div>
                      <div style={{ ...S.text, fontSize: '13px', fontWeight: 600 }}>Gmail Conectado</div>
                      <div style={{ ...S.textMuted, fontSize: '11px' }}>Enviando como: {gmailEmail}</div>
                    </div>
                  </div>
                  <button onClick={() => { setGmailToken(''); setGmailEmail(''); setGmailName(''); }}
                    style={{ ...S.btnSecondary, padding: '5px 12px', fontSize: '11px' }}>Desconectar</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail style={{ width: '18px', height: '18px', color: '#ffa726' }} />
                    <div>
                      <div style={{ ...S.text, fontSize: '13px', fontWeight: 600 }}>Gmail no conectado</div>
                      <div style={{ ...S.textMuted, fontSize: '11px' }}>Conecta tu cuenta para enviar correos</div>
                    </div>
                  </div>
                  <button onClick={handleGmailConnect}
                    style={{ ...S.btn, padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail style={{ width: '14px', height: '14px' }} /> Conectar Gmail
                  </button>
                </div>
              )}
            </div>

            {/* Disponibilidad */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Disponibilidad del equipo</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { val: 'hoy', label: '📅 Hoy' },
                  { val: 'manana', label: '📅 Mañana' },
                  { val: 'finde', label: '📅 Fin de semana' },
                  { val: 'custom', label: '🗓️ Fecha específica' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setOfertarDisp(opt.val)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: ofertarDisp === opt.val ? 'rgba(240,160,80,0.2)' : 'rgba(10,20,40,0.6)',
                      color: ofertarDisp === opt.val ? '#ffa726' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${ofertarDisp === opt.val ? 'rgba(240,160,80,0.5)' : 'rgba(80,120,180,0.25)'}`,
                    }}>{opt.label}</button>
                ))}
              </div>
              {ofertarDisp === 'custom' && (
                <input type="date" value={ofertarCustomDate} onChange={e => setOfertarCustomDate(e.target.value)}
                  style={{ ...S.input, marginTop: '8px', width: '200px' }} />
              )}
            </div>

            {/* Canal */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Canal de envío</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { val: 'email' as const, label: '📧 Correo', icon: Mail, ready: true },
                  { val: 'whatsapp' as const, label: '📱 WhatsApp', icon: Phone, ready: false },
                  { val: 'ambos' as const, label: '📧📱 Ambos', icon: Send, ready: false },
                ].map(opt => (
                  <button key={opt.val} onClick={() => opt.ready && setOfertarCanal(opt.val)}
                    style={{
                      padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                      cursor: opt.ready ? 'pointer' : 'not-allowed', transition: 'all 0.2s', opacity: opt.ready ? 1 : 0.4,
                      background: ofertarCanal === opt.val ? 'rgba(33,150,243,0.2)' : 'rgba(10,20,40,0.6)',
                      color: ofertarCanal === opt.val ? '#42a5f5' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${ofertarCanal === opt.val ? 'rgba(33,150,243,0.5)' : 'rgba(80,120,180,0.25)'}`,
                    }}>{opt.label}{!opt.ready && ' (próx.)'}</button>
                ))}
              </div>
              {ofertarCanal !== 'email' && (
                <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '6px', color: '#ffa726' }}>
                  ⚠️ WhatsApp requiere plantilla aprobada por Meta. Primero crea la plantilla en business.facebook.com
                </div>
              )}
            </div>

            {/* Preview */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vista previa del correo</label>
              <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', maxHeight: '220px', overflowY: 'auto' }}>
                <div style={{ background: 'linear-gradient(135deg,#001f4d,#0066cc)', padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>🚛 Equipo Disponible</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '4px' }}>Grupo Loma Transportes — FX27</div>
                </div>
                <div style={{ padding: '16px 20px', fontSize: '13px', color: '#333' }}>
                  <p style={{ margin: '0 0 10px' }}>Estimado equipo de <strong>[CLIENTE]</strong>,</p>
                  <div style={{ background: '#e8f0fe', borderLeft: '3px solid #0066cc', borderRadius: '6px', padding: '12px', margin: '10px 0' }}>
                    <div style={{ fontWeight: 700, color: '#001f4d', fontSize: '14px' }}>{expoTipo === 'THERMO' ? '❄️' : '📦'} Equipo {expoTipo} disponible</div>
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>📍 Zona: <strong>{zona}</strong></div>
                    <div style={{ marginTop: '2px', fontSize: '12px' }}>📅 Disponibilidad: <strong>{dispLabel}</strong></div>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#555' }}>Quedamos a sus órdenes para cualquier requerimiento de transporte.</p>
                </div>
              </div>
            </div>

            {/* Selected clients list */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Clientes a ofertar ({selectedClients.length})
              </label>
              <div style={{ ...S.card, maxHeight: '180px', overflowY: 'auto', padding: '0' }}>
                {selectedClients.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderBottom: '1px solid rgba(80,120,180,0.1)' }}>
                    <div style={{ ...S.text, fontSize: '12px', fontWeight: 600, flex: 1 }}>{i + 1}. {c.cliente}</div>
                    <div style={{ ...S.textMuted, fontSize: '11px' }}>{c.viajes} viajes · {c.estado}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            {ofertarResult && (
              <div style={{ ...S.card, padding: '14px', marginBottom: '16px', border: '1px solid rgba(76,175,80,0.3)' }}>
                <div style={{ ...S.text, fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                  ✅ Ofertas registradas: {ofertarResult.success} · ❌ Fallidas: {ofertarResult.failed}
                </div>
                {ofertarResult.details.map((d, i) => (
                  <div key={i} style={{ ...S.textMuted, fontSize: '11px', padding: '2px 0' }}>{d}</div>
                ))}
                <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '8px', color: '#ffa726' }}>
                  💡 Para enviar correos reales, agrega los emails de contacto en la tabla <strong>sc_contactos_clientes</strong> en Supabase.
                </div>
              </div>
            )}

            {/* Send button */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowOfertarModal(false); setOfertarResult(null); }}
                style={S.btnSecondary}>Cancelar</button>
              <button onClick={handleSendOfertas} disabled={ofertarSending || selectedClients.length === 0}
                style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '8px', opacity: ofertarSending ? 0.7 : 1, padding: '12px 24px' }}>
                {ofertarSending ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: '16px', height: '16px' }} />}
                {ofertarSending ? 'Enviando...' : `Ofertar a ${selectedClients.length} clientes`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============ EXPORTACIONES VIEW ============
  if (view === 'expo') {
    const neighborStates = expoEstado ? (NEIGHBOR_STATES[expoEstado] || []) : [];
    return (
      <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header title="Expo Radar" />
          <div style={{ padding: '12px 40px 4px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...S.card, padding: '16px', marginBottom: '12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 200px' }}>
                <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo de Equipo</label>
                <div style={{ display: 'flex', gap: '0' }}>
                  {['THERMO', 'SECO'].map(t => (
                    <button key={t} onClick={() => setExpoTipo(t)}
                      style={{
                        flex: 1, padding: '10px 16px', fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: '13px',
                        border: '1px solid rgba(80,120,180,0.3)', cursor: 'pointer', transition: 'all 0.2s',
                        borderRadius: t === 'THERMO' ? '8px 0 0 8px' : '0 8px 8px 0',
                        background: expoTipo === t ? (t === 'THERMO' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)') : 'rgba(10,20,40,0.6)',
                        color: expoTipo === t ? '#fff' : 'rgba(255,255,255,0.5)',
                        borderColor: expoTipo === t ? (t === 'THERMO' ? 'rgba(33,150,243,0.6)' : 'rgba(255,152,0,0.6)') : 'rgba(80,120,180,0.3)',
                      }}>{t === 'THERMO' ? '❄️' : '📦'} {t}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado de Origen</label>
                <select value={expoEstado} onChange={e => { setExpoEstado(e.target.value); setExpoExpanded(false); }} style={S.select}>
                  <option value="">— Selecciona un estado —</option>
                  {estadosDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {expoEstado && neighborStates.length > 0 && (
                <button onClick={() => setExpoExpanded(!expoExpanded)}
                  style={{ ...S.btnSecondary, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
                    ...(expoExpanded ? { border: '1px solid rgba(33,150,243,0.5)', color: '#42a5f5', background: 'rgba(33,150,243,0.1)' } : {}),
                  }}>
                  <MapPin style={{ width: '16px', height: '16px' }} />
                  {expoExpanded ? `Búsqueda ampliada (${neighborStates.length + 1} estados)` : `Ampliar a estados vecinos (+${neighborStates.length})`}
                </button>
              )}
              <div style={{ position: 'relative', flex: '0 0 250px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
                <input value={searchExpo} onChange={e => setSearchExpo(e.target.value)} placeholder="Filtrar cliente..." style={{ ...S.input, paddingLeft: '38px' }} />
              </div>
              {/* OFERTAR BUTTON */}
              {selectedExpo.size > 0 && (
                <button onClick={() => setShowOfertarModal(true)}
                  style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, rgba(76,175,80,0.9) 0%, rgba(56,142,60,0.95) 100%)' }}>
                  <Send style={{ width: '16px', height: '16px' }} />
                  Ofertar ({selectedExpo.size})
                </button>
              )}
            </div>
            {expoExpanded && neighborStates.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...S.textMuted, fontSize: '11px' }}>Estados incluidos:</span>
                {[expoEstado, ...neighborStates].map(e => (
                  <span key={e} style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                    background: e === expoEstado ? 'rgba(240,160,80,0.2)' : 'rgba(33,150,243,0.15)',
                    color: e === expoEstado ? '#ffa726' : '#42a5f5',
                    border: `1px solid ${e === expoEstado ? 'rgba(240,160,80,0.4)' : 'rgba(33,150,243,0.3)'}`,
                  }}>{e}</span>
                ))}
              </div>
            )}
          </div>
          {expoEstado && (
            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap', flexShrink: 0 }}>
              <KPICard label="Clientes" value={expoKPIs.clientes} icon={Users} />
              <KPICard label="Viajes" value={expoKPIs.viajes.toLocaleString()} icon={Truck} color="#2196f3" />
              <KPICard label="Formatos" value={expoKPIs.formatos} icon={ClipboardList} color="#9c27b0" />
            </div>
          )}
          {filteredExpo.length > 0 && userRole === 'admin' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', flexShrink: 0 }}>
              <button onClick={() => {
                const headers = ['#', 'CLIENTE', 'VIAJES', 'FORMATOS', 'ORÍGENES', 'CRUCE', 'ESTADO'];
                const rows = filteredExpo.map((d, i) => [String(i + 1), d.cliente, String(d.viajes), String(d.num_formatos), d.origenes, d.cruce, d.estado]);
                const ctx = `Búsqueda: ${expoTipo} en ${expoEstado}${expoExpanded ? ' + vecinos' : ''}. ${expoKPIs.clientes} clientes, ${expoKPIs.viajes} viajes`;
                handleExportWithAI(headers, rows, `EXPO_${expoTipo}_${expoEstado}`, ctx);
              }} disabled={exporting} style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {exporting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet style={{ width: '16px', height: '16px' }} />}
                Exportar Excel
              </button>
            </div>
          )}
          {!expoEstado ? (
            <div style={{ ...S.card, padding: '60px 40px', textAlign: 'center' }}>
              <MapPin style={{ width: '48px', height: '48px', color: 'rgba(240,160,80,0.4)', margin: '0 auto 16px' }} />
              <p style={{ ...S.text, fontSize: '16px', fontWeight: 600 }}>Selecciona tipo de equipo y estado</p>
              <p style={{ ...S.textMuted, fontSize: '13px', marginTop: '8px' }}>Elige THERMO o SECO y un estado para ver los clientes que han cargado desde ahí</p>
            </div>
          ) : filteredExpo.length === 0 ? (
            <div style={{ ...S.card, padding: '40px', textAlign: 'center' }}>
              <AlertTriangle style={{ width: '36px', height: '36px', color: 'rgba(255,152,0,0.6)', margin: '0 auto 12px' }} />
              <p style={{ ...S.text, fontSize: '14px' }}>No se encontraron resultados para {expoTipo} en {expoEstado}</p>
              {!expoExpanded && neighborStates.length > 0 && (
                <button onClick={() => setExpoExpanded(true)} style={{ ...S.btn, marginTop: '12px' }}>Ampliar búsqueda a estados vecinos</button>
              )}
            </div>
          ) : (
            <div style={{ ...S.card, overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr>
                      <th style={{ ...S.tableHeader, width: '36px', textAlign: 'center', padding: '8px 4px' }}>
                        <button onClick={toggleSelectAllExpo} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedExpo.size === filteredExpo.length && filteredExpo.length > 0
                            ? <CheckSquare style={{ width: '16px', height: '16px', color: 'rgba(240,160,80,1)' }} />
                            : <Square style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />}
                        </button>
                      </th>
                      <th style={{ ...S.tableHeader, width: '40px' }}>#</th>
                      <th style={S.tableHeader}>Cliente</th>
                      <th style={{ ...S.tableHeader, width: '80px', textAlign: 'center' }}>Viajes</th>
                      <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Fmts</th>
                      <th style={S.tableHeader}>Orígenes</th>
                      <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Cruce</th>
                      {expoExpanded && <th style={{ ...S.tableHeader, width: '120px' }}>Estado</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpo.map((d, i) => (
                      <tr key={d.id} style={{ transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,160,80,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...S.tableCell, textAlign: 'center', padding: '4px' }}>
                          <button onClick={() => toggleSelectExpo(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedExpo.has(d.id)
                              ? <CheckSquare style={{ width: '15px', height: '15px', color: 'rgba(240,160,80,1)' }} />
                              : <Square style={{ width: '15px', height: '15px', color: 'rgba(255,255,255,0.25)' }} />}
                          </button>
                        </td>
                        <td style={{ ...S.tableCell, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</td>
                        <td style={{ ...S.tableCell, fontWeight: 600 }}>{d.cliente}</td>
                        <td style={{ ...S.tableCell, textAlign: 'center', fontWeight: 700, color: 'rgba(240,160,80,1)' }}>{d.viajes}</td>
                        <td style={{ ...S.tableCell, textAlign: 'center' }}>{d.num_formatos}</td>
                        <td style={{ ...S.tableCell, fontSize: '11px', color: 'rgba(255,255,255,0.6)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.origenes}>{d.origenes}</td>
                        <td style={{ ...S.tableCell, textAlign: 'center' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                            background: d.cruce === 'SI' ? 'rgba(33,150,243,0.15)' : 'rgba(120,120,120,0.1)',
                            color: d.cruce === 'SI' ? '#42a5f5' : 'rgba(255,255,255,0.35)' }}>{d.cruce}</span>
                        </td>
                        {expoExpanded && (
                          <td style={S.tableCell}>
                            <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                              background: d.estado === expoEstado ? 'rgba(240,160,80,0.15)' : 'rgba(33,150,243,0.1)',
                              color: d.estado === expoEstado ? '#ffa726' : '#42a5f5' }}>{d.estado}</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '8px', textAlign: 'right', flexShrink: 0 }}>
            {filteredExpo.length} resultados · {expoTipo} · {expoExpanded ? `${expoEstado} + vecinos` : expoEstado || 'Sin filtro'}
            {selectedExpo.size > 0 && <span style={{ color: 'rgba(240,160,80,1)', marginLeft: '12px' }}>· {selectedExpo.size} seleccionados</span>}
          </div>
        </div></div>
        <OfertarModal />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============ IMPORTACION VIEW ============
  return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header title="Clientes de Importación" subtitle={`${impoData.length} clientes · Entregas USA → México`} />
        <div style={{ padding: '12px 40px 4px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
          <KPICard label="Clientes" value={impoKPIs.clientes} icon={Users} />
          <KPICard label="Viajes Totales" value={impoKPIs.viajes.toLocaleString()} icon={Truck} color="#2196f3" />
          <KPICard label="Viajes Thermo" value={impoKPIs.thermo.toLocaleString()} icon={Download} color="#29b6f6" />
          <KPICard label="Viajes Seco" value={impoKPIs.seco.toLocaleString()} icon={Upload} color="#ff9800" />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
            <input value={searchImpo} onChange={e => setSearchImpo(e.target.value)} placeholder="Buscar cliente, estado o ejecutivo..."
              style={{ ...S.input, paddingLeft: '38px' }} />
          </div>
          <select value={filterTipoImpo} onChange={e => setFilterTipoImpo(e.target.value)} style={{ ...S.select, width: '180px' }}>
            <option value="TODOS">Todos los tipos</option>
            <option value="THERMO">Solo Thermo</option>
            <option value="SECO">Solo Seco</option>
          </select>
          {userRole === 'admin' && (
          <button onClick={() => {
            const headers = ['#', 'CLIENTE', 'VIAJES', 'THERMO', 'SECO', 'FMTS', 'TIPO EQUIPO', 'DESTINOS', 'VENTAS', 'CSR'];
            const rows = filteredImpo.map((d, i) => [String(i + 1), d.cliente, String(d.viajes), String(d.thermo), String(d.seco), String(d.formatos), d.tipo_equipo, d.estadosStr, getEjecutivoImpo(d.cliente), getEjecutivoSC(d.cliente)]);
            const ctx = `${impoKPIs.clientes} clientes IMPO consolidados, ${impoKPIs.viajes} viajes totales, ${impoKPIs.thermo} thermo, ${impoKPIs.seco} seco`;
            handleExportWithAI(headers, rows, 'Importacion_Clientes', ctx);
          }} disabled={exporting} style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {exporting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet style={{ width: '16px', height: '16px' }} />}
            Exportar Excel
          </button>
          )}
        </div>
        <div style={{ ...S.card, overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ ...S.tableHeader, width: '30px', padding: '10px 4px', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }}>#</th>
                  <th style={{ ...S.tableHeader, width: '22%', padding: '10px 8px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('cliente')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Cliente <SortIcon col="cliente" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '52px', textAlign: 'center', padding: '10px 2px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('viajes')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Viajes <SortIcon col="viajes" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '46px', textAlign: 'center', padding: '10px 2px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('thermo')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Thm <SortIcon col="thermo" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '44px', textAlign: 'center', padding: '10px 2px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('seco')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Seco <SortIcon col="seco" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '40px', textAlign: 'center', padding: '10px 2px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('formatos')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Fmt <SortIcon col="formatos" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '76px', padding: '10px 4px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('tipo_equipo')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Tipo <SortIcon col="tipo_equipo" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '30%', padding: '10px 6px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('zona')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Destinos <SortIcon col="zona" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center', padding: '10px 4px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('ejecutivo')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Ventas <SortIcon col="ejecutivo" /></span>
                  </th>
                  <th style={{ ...S.tableHeader, width: '60px', textAlign: 'center', padding: '10px 4px', cursor: 'pointer', userSelect: 'none', background: 'rgba(10,18,36,0.98)', borderBottom: '2px solid rgba(240,160,80,0.5)' }} onClick={() => handleImpoSort('ejecutivoSC')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>CSR <SortIcon col="ejecutivoSC" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredImpo.map((d, i) => {
                  const ejecVta = getEjecutivoImpo(d.cliente);
                  const ejecSC = getEjecutivoSC(d.cliente);
                  return (
                  <tr key={d.id} style={{ transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,160,80,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ ...S.tableCell, color: 'rgba(255,255,255,0.4)', padding: '5px 4px' }}>{i + 1}</td>
                    <td style={{ ...S.tableCell, fontWeight: 600, padding: '5px 8px', fontSize: '11.5px' }}>{d.cliente}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', fontWeight: 700, color: 'rgba(240,160,80,1)', padding: '5px 2px' }}>{d.viajes}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', padding: '5px 2px', color: d.thermo > 0 ? '#29b6f6' : 'rgba(255,255,255,0.25)' }}>{d.thermo}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', padding: '5px 2px', color: d.seco > 0 ? '#ffa726' : 'rgba(255,255,255,0.25)' }}>{d.seco}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', padding: '5px 2px' }}>{d.formatos}</td>
                    <td style={{ ...S.tableCell, padding: '5px 4px' }}>
                      <span style={{
                        padding: '2px 5px', borderRadius: '4px', fontSize: '8.5px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                        background: d.tipo_equipo.includes('THERMO') && d.tipo_equipo.includes('SECO') ? 'rgba(156,39,176,0.15)' : d.tipo_equipo.includes('THERMO') ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                        color: d.tipo_equipo.includes('THERMO') && d.tipo_equipo.includes('SECO') ? '#ba68c8' : d.tipo_equipo.includes('THERMO') ? '#42a5f5' : '#ffa726',
                      }}>{d.tipo_equipo}</span>
                    </td>
                    <td style={{ ...S.tableCell, fontSize: '10px', padding: '4px 6px', lineHeight: '1.3', color: 'rgba(255,255,255,0.65)' }} title={d.estadosStr}>{d.estadosStr}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', padding: '5px 2px' }}>
                      <span style={{
                        padding: '2px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                        background: ejecVta !== '—' ? 'rgba(76,175,80,0.15)' : 'rgba(120,120,120,0.08)',
                        color: ejecVta !== '—' ? '#66bb6a' : 'rgba(255,255,255,0.25)',
                      }}>{ejecVta}</span>
                    </td>
                    <td style={{ ...S.tableCell, textAlign: 'center', padding: '5px 2px' }}>
                      <span style={{
                        padding: '2px 5px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                        background: ejecSC === 'ELI' ? 'rgba(255,152,0,0.15)' : ejecSC === 'LIZ' ? 'rgba(156,39,176,0.15)' : 'rgba(120,120,120,0.08)',
                        color: ejecSC === 'ELI' ? '#ffa726' : ejecSC === 'LIZ' ? '#ba68c8' : 'rgba(255,255,255,0.25)',
                      }}>{ejecSC}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '8px', textAlign: 'right', flexShrink: 0 }}>
          Mostrando {filteredImpo.length} de {consolidatedImpo.length} clientes (excluidos dedicados e internos)
        </div>
      </div></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
