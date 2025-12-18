'use client';

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Gauge, 
  Power, 
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Wifi,
  WifiOff,
  Navigation,
  Building2
} from 'lucide-react';

// ============================================
// REGISTRY DE FLOTA - 242 UNIDADES
// ============================================
const FLOTA_LOMA: UnitRegistry[] = [
  // TROB - 130 unidades
  { economico: "167", empresa: "TROB", segmento: "INSTITUTO" },
  { economico: "503", empresa: "TROB", segmento: "PATIERO NEXTEER" },
  { economico: "505", empresa: "TROB", segmento: "CARROL" },
  { economico: "509", empresa: "TROB", segmento: "PATIERO NEXTEER" },
  { economico: "511", empresa: "TROB", segmento: "BAFAR" },
  { economico: "547", empresa: "TROB", segmento: "PATIO CELAYA" },
  { economico: "575", empresa: "TROB", segmento: "IMPEX/MTTO" },
  { economico: "587", empresa: "TROB", segmento: "IMPEX/MTTO" },
  { economico: "589", empresa: "TROB", segmento: "PATIO MTY" },
  { economico: "593", empresa: "TROB", segmento: "PATIO MTY" },
  { economico: "629", empresa: "TROB", segmento: "IMPEX/MTTO" },
  { economico: "643", empresa: "TROB", segmento: "CARROL" },
  { economico: "649", empresa: "TROB", segmento: "BAFAR" },
  { economico: "651", empresa: "TROB", segmento: "BARCEL" },
  { economico: "653", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "657", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "681", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "699", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "713", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "717", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "721", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "727", empresa: "TROB", segmento: "CARROL" },
  { economico: "729", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "731", empresa: "TROB", segmento: "CARROL" },
  { economico: "733", empresa: "TROB", segmento: "BAFAR" },
  { economico: "735", empresa: "TROB", segmento: "BAFAR" },
  { economico: "739", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "741", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "743", empresa: "TROB", segmento: "ACCIDENTE" },
  { economico: "745", empresa: "TROB", segmento: "CARROL" },
  { economico: "747", empresa: "TROB", segmento: "ALPURA" },
  { economico: "749", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "751", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "753", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "757", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "759", empresa: "TROB", segmento: "BAFAR" },
  { economico: "761", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "765", empresa: "TROB", segmento: "CARROL" },
  { economico: "767", empresa: "TROB", segmento: "ALPURA" },
  { economico: "769", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "771", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "773", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "777", empresa: "TROB", segmento: "CARROL" },
  { economico: "779", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "781", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "783", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "785", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "787", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "789", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "791", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "797", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "799", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "801", empresa: "TROB", segmento: "CARROL" },
  { economico: "803", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "807", empresa: "TROB", segmento: "BAFAR" },
  { economico: "809", empresa: "TROB", segmento: "CARROL" },
  { economico: "811", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "813", empresa: "TROB", segmento: "CARROL" },
  { economico: "815", empresa: "TROB", segmento: "BAFAR" },
  { economico: "817", empresa: "TROB", segmento: "CARROL" },
  { economico: "819", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "821", empresa: "TROB", segmento: "BAFAR" },
  { economico: "823", empresa: "TROB", segmento: "ACCIDENTE" },
  { economico: "825", empresa: "TROB", segmento: "BAFAR" },
  { economico: "827", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "831", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "835", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "837", empresa: "TROB", segmento: "CARROL" },
  { economico: "839", empresa: "TROB", segmento: "ALPURA" },
  { economico: "841", empresa: "TROB", segmento: "CARROL" },
  { economico: "843", empresa: "TROB", segmento: "BAFAR" },
  { economico: "845", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "847", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "849", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "851", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "853", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "855", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "857", empresa: "TROB", segmento: "ALPURA" },
  { economico: "859", empresa: "TROB", segmento: "CARROL" },
  { economico: "861", empresa: "TROB", segmento: "CARROL" },
  { economico: "863", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "865", empresa: "TROB", segmento: "IMPEX/MTTO" },
  { economico: "867", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "869", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "871", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "873", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "875", empresa: "TROB", segmento: "ACCIDENTE" },
  { economico: "877", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "879", empresa: "TROB", segmento: "CARROL" },
  { economico: "883", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "885", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "887", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "889", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "891", empresa: "TROB", segmento: "CARROL" },
  { economico: "893", empresa: "TROB", segmento: "CARROL" },
  { economico: "895", empresa: "TROB", segmento: "BAFAR" },
  { economico: "897", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "899", empresa: "TROB", segmento: "CARROL" },
  { economico: "901", empresa: "TROB", segmento: "BAFAR" },
  { economico: "903", empresa: "TROB", segmento: "BARCEL" },
  { economico: "905", empresa: "TROB", segmento: "CARROL" },
  { economico: "907", empresa: "TROB", segmento: "BARCEL" },
  { economico: "909", empresa: "TROB", segmento: "IMPEX/MTTO" },
  { economico: "911", empresa: "TROB", segmento: "CARROL" },
  { economico: "913", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "915", empresa: "TROB", segmento: "BARCEL" },
  { economico: "917", empresa: "TROB", segmento: "BARCEL" },
  { economico: "919", empresa: "TROB", segmento: "BARCEL" },
  { economico: "921", empresa: "TROB", segmento: "MULA QRO" },
  { economico: "923", empresa: "TROB", segmento: "MULA AGS" },
  { economico: "925", empresa: "TROB", segmento: "BAFAR" },
  { economico: "927", empresa: "TROB", segmento: "BARCEL" },
  { economico: "929", empresa: "TROB", segmento: "ALPURA" },
  { economico: "931", empresa: "TROB", segmento: "CARROL" },
  { economico: "933", empresa: "TROB", segmento: "CARROL" },
  { economico: "935", empresa: "TROB", segmento: "BARCEL" },
  { economico: "937", empresa: "TROB", segmento: "CARROL" },
  { economico: "939", empresa: "TROB", segmento: "BARCEL" },
  { economico: "941", empresa: "TROB", segmento: "BAFAR" },
  { economico: "943", empresa: "TROB", segmento: "IMPEX/MTTO" },
  { economico: "945", empresa: "TROB", segmento: "CARROL" },
  { economico: "947", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "953", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "955", empresa: "TROB", segmento: "ALPURA" },
  { economico: "957", empresa: "TROB", segmento: "BAFAR" },
  { economico: "959", empresa: "TROB", segmento: "BAFAR" },
  { economico: "961", empresa: "TROB", segmento: "BAFAR" },
  { economico: "963", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "501", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "507", empresa: "TROB", segmento: "IMPEX/NEXTEER/CLARIOS" },
  // WE (WEXPRESS) - 56 unidades
  { economico: "112", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "116", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "118", empresa: "WE", segmento: "CARROL" },
  { economico: "124", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "126", empresa: "WE", segmento: "IMPEX/MTTO" },
  { economico: "128", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "130", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "134", empresa: "WE", segmento: "IMPEX/MTTO" },
  { economico: "138", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "140", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "142", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "144", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "146", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "148", empresa: "WE", segmento: "CARROL" },
  { economico: "152", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "154", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "156", empresa: "WE", segmento: "ALPURA" },
  { economico: "158", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "160", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "162", empresa: "WE", segmento: "BARCEL" },
  { economico: "164", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "166", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "168", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "170", empresa: "WE", segmento: "ALPURA" },
  { economico: "172", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "174", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "176", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "178", empresa: "WE", segmento: "CARROL" },
  { economico: "180", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "182", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "184", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "186", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "188", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "190", empresa: "WE", segmento: "ALPURA" },
  { economico: "192", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "194", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "196", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "198", empresa: "WE", segmento: "ALPURA" },
  { economico: "200", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "202", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "204", empresa: "WE", segmento: "ALPURA" },
  { economico: "206", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "208", empresa: "WE", segmento: "CARROL" },
  { economico: "212", empresa: "WE", segmento: "CARROL" },
  { economico: "214", empresa: "WE", segmento: "CARROL" },
  { economico: "216", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "218", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "220", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "222", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "224", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "226", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "228", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "232", empresa: "WE", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "234", empresa: "WE", segmento: "ALPURA" },
  { economico: "236", empresa: "WE", segmento: "ALPURA" },
  { economico: "230", empresa: "WE", segmento: "PENDIENTE DE ENTREGA ZAPATA" },
  // SHI (SPEEDYHAUL) - 33 unidades
  { economico: "1", empresa: "SHI", segmento: "DEDICADO NS/MULA" },
  { economico: "101", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "103", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "105", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "107", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "109", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "111", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "113", empresa: "SHI", segmento: "ACCIDENTE" },
  { economico: "115", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "117", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "119", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "121", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "123", empresa: "SHI", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "125", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "689", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "129", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "131", empresa: "SHI", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "133", empresa: "SHI", segmento: "ACCIDENTE" },
  { economico: "401", empresa: "SHI", segmento: "ALPURA" },
  { economico: "405", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "409", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "413", empresa: "SHI", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "417", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "419", empresa: "SHI", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "431", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "433", empresa: "SHI", segmento: "PATIO CARROL" },
  { economico: "435", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "437", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "439", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "441", empresa: "SHI", segmento: "DEDICADO PILGRIMS" },
  { economico: "443", empresa: "SHI", segmento: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "445", empresa: "SHI", segmento: "DEDICADO NS" },
  { economico: "449", empresa: "SHI", segmento: "DEDICADO NS" },
  // TROB USA - 23 unidades
  { economico: "231001", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "231002", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "231003", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "231004", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "231005", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241006", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241007", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241008", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241009", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241010", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241011", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241012", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241013", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241014", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241015", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241016", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241017", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241018", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241019", empresa: "TROB USA", segmento: "MTTO" },
  { economico: "241020", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "241021", empresa: "TROB USA", segmento: "MTTO" },
  { economico: "775", empresa: "TROB USA", segmento: "TROB USA" },
  { economico: "881", empresa: "TROB USA", segmento: "TROB USA" },
];

// ============================================
// TIPOS
// ============================================
interface UnitRegistry {
  economico: string;
  empresa: string;
  segmento: string;
}

interface FleetUnit extends UnitRegistry {
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: string | null;
  address: string | null;
  timestamp: string | null;
  odometer: number | null;
  ignition: boolean | null;
  status: 'online' | 'offline' | 'moving' | 'stopped' | 'no_signal' | 'loading';
  lastUpdate: Date | null;
}

// Orden de empresas para sorting
const EMPRESA_ORDER: Record<string, number> = { 'SHI': 1, 'TROB': 2, 'WE': 3, 'TROB USA': 4 };

// Colores por empresa
const EMPRESA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'TROB': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  'WE': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'SHI': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  'TROB USA': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
};

// Status config
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  'moving': { bg: 'bg-green-500/20', text: 'text-green-400', icon: <Navigation className="w-3 h-3" />, label: 'Movimiento' },
  'stopped': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <Power className="w-3 h-3" />, label: 'Detenido' },
  'offline': { bg: 'bg-red-500/20', text: 'text-red-400', icon: <WifiOff className="w-3 h-3" />, label: 'Offline' },
  'no_signal': { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: <WifiOff className="w-3 h-3" />, label: 'Sin GPS' },
  'loading': { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: <RefreshCw className="w-3 h-3 animate-spin" />, label: '...' },
};

const BATCH_SIZE = 5;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function DespachoInteligenteContent() {
  const [fleet, setFleet] = useState<FleetUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('ALL');
  const [filterSegmento, setFilterSegmento] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<FleetUnit | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  const uniqueSegmentos = [...new Set(FLOTA_LOMA.map(u => u.segmento))].sort();

  const fetchBatch = async (placas: string[]): Promise<any[]> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ placas }),
        }
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.results || result.data || [];
    } catch {
      return [];
    }
  };

  const fetchFleetGPS = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const initialFleet: FleetUnit[] = FLOTA_LOMA.map(unit => ({
      ...unit, latitude: null, longitude: null, speed: null, heading: null,
      address: null, timestamp: null, odometer: null, ignition: null,
      status: 'loading' as const, lastUpdate: null,
    }));
    setFleet(initialFleet);

    const allPlacas = FLOTA_LOMA.map(u => u.economico);
    const batches: string[][] = [];
    for (let i = 0; i < allPlacas.length; i += BATCH_SIZE) {
      batches.push(allPlacas.slice(i, i + BATCH_SIZE));
    }
    setLoadingProgress({ current: 0, total: batches.length });

    const allResults: any[] = [];
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await fetchBatch(batches[i]);
      allResults.push(...batchResults);
      setLoadingProgress({ current: i + 1, total: batches.length });
      
      setFleet(prev => prev.map(unit => {
        const gpsData = allResults.find((d: any) => d.placa === unit.economico);
        if (gpsData && gpsData.success && gpsData.location) {
          const loc = gpsData.location;
          const isMoving = (loc.speed || 0) > 5;
          const hasSignal = loc.latitude && loc.longitude;
          const ignitionOn = loc.ignition === 'ON' || loc.ignition === true;
          return {
            ...unit, latitude: loc.latitude, longitude: loc.longitude, speed: loc.speed,
            heading: loc.heading, address: loc.address || loc.addressOriginal,
            timestamp: loc.timestamp, odometer: loc.odometer, ignition: ignitionOn,
            status: !hasSignal ? 'no_signal' : isMoving ? 'moving' : ignitionOn ? 'stopped' : 'offline',
            lastUpdate: new Date(),
          };
        }
        if (batches.slice(0, i + 1).flat().includes(unit.economico) && unit.status === 'loading') {
          return { ...unit, status: 'no_signal' as const, lastUpdate: new Date() };
        }
        return unit;
      }));

      if (i < batches.length - 1) await new Promise(r => setTimeout(r, 300));
    }
    setLastRefresh(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchFleetGPS(); }, [fetchFleetGPS]);

  // Ordenamiento por defecto: Empresa -> Segmento -> Económico
  const filteredFleet = fleet
    .filter(unit => {
      if (searchTerm && !unit.economico.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterEmpresa !== 'ALL' && unit.empresa !== filterEmpresa) return false;
      if (filterSegmento !== 'ALL' && unit.segmento !== filterSegmento) return false;
      if (filterStatus !== 'ALL' && unit.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      // Primero por empresa
      const empresaDiff = (EMPRESA_ORDER[a.empresa] || 99) - (EMPRESA_ORDER[b.empresa] || 99);
      if (empresaDiff !== 0) return empresaDiff;
      // Luego por segmento
      const segmentoDiff = a.segmento.localeCompare(b.segmento);
      if (segmentoDiff !== 0) return segmentoDiff;
      // Finalmente por económico numérico
      return parseInt(a.economico) - parseInt(b.economico);
    });

  const stats = {
    total: fleet.length,
    moving: fleet.filter(u => u.status === 'moving').length,
    stopped: fleet.filter(u => u.status === 'stopped').length,
    offline: fleet.filter(u => u.status === 'offline' || u.status === 'no_signal').length,
    loading: fleet.filter(u => u.status === 'loading').length,
    byEmpresa: {
      TROB: fleet.filter(u => u.empresa === 'TROB').length,
      WE: fleet.filter(u => u.empresa === 'WE').length,
      SHI: fleet.filter(u => u.empresa === 'SHI').length,
      'TROB USA': fleet.filter(u => u.empresa === 'TROB USA').length,
    }
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return '-';
    try {
      return new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* HEADER COMPACTO */}
      <div className="flex-shrink-0 space-y-2 pb-2">
        {/* Stats en una línea */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Total */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-slate-700/30">
            <Truck className="w-4 h-4 text-slate-400" />
            <span className="text-white font-bold">{stats.total}</span>
            <span className="text-slate-500 text-xs">Total</span>
          </div>
          {/* En Movimiento */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
            <Navigation className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-bold">{stats.moving}</span>
            <span className="text-green-400/60 text-xs">Mov</span>
          </div>
          {/* Detenidos */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <Power className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{stats.stopped}</span>
            <span className="text-yellow-400/60 text-xs">Det</span>
          </div>
          {/* Sin Señal */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-bold">{stats.offline}</span>
            <span className="text-red-400/60 text-xs">Sin</span>
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Última actualización y botón */}
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-slate-500 text-xs">{lastRefresh.toLocaleTimeString('es-MX')}</span>
            )}
            {(loading || refreshing) && loadingProgress.total > 0 && (
              <span className="text-blue-400 text-xs">{loadingProgress.current}/{loadingProgress.total}</span>
            )}
            <button
              onClick={() => fetchFleetGPS(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing || loading ? 'animate-spin' : ''}`} />
              {refreshing || loading ? `${Math.round((loadingProgress.current / loadingProgress.total) * 100)}%` : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Filtros en una línea */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Búsqueda compacta */}
          <div className="relative w-32">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Eco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 bg-slate-900/50 border border-slate-700/30 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          {/* Filtro Empresa */}
          <select
            value={filterEmpresa}
            onChange={(e) => setFilterEmpresa(e.target.value)}
            className="px-2 py-1.5 bg-slate-900/50 border border-slate-700/30 rounded-lg text-white text-sm focus:outline-none"
          >
            <option value="ALL">Empresa ({stats.total})</option>
            <option value="SHI">SHI ({stats.byEmpresa.SHI})</option>
            <option value="TROB">TROB ({stats.byEmpresa.TROB})</option>
            <option value="WE">WE ({stats.byEmpresa.WE})</option>
            <option value="TROB USA">USA ({stats.byEmpresa['TROB USA']})</option>
          </select>

          {/* Filtro Segmento */}
          <select
            value={filterSegmento}
            onChange={(e) => setFilterSegmento(e.target.value)}
            className="px-2 py-1.5 bg-slate-900/50 border border-slate-700/30 rounded-lg text-white text-sm focus:outline-none max-w-[140px]"
          >
            <option value="ALL">Segmento</option>
            {uniqueSegmentos.map(seg => (
              <option key={seg} value={seg}>{seg.length > 15 ? seg.slice(0,15)+'...' : seg}</option>
            ))}
          </select>

          {/* Filtro Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 bg-slate-900/50 border border-slate-700/30 rounded-lg text-white text-sm focus:outline-none"
          >
            <option value="ALL">Status</option>
            <option value="moving">Movimiento ({stats.moving})</option>
            <option value="stopped">Detenidos ({stats.stopped})</option>
            <option value="no_signal">Sin Señal</option>
          </select>

          <span className="text-slate-500 text-xs ml-auto">
            {filteredFleet.length}/{stats.total}
            {stats.loading > 0 && <span className="text-blue-400"> ({stats.loading}...)</span>}
          </span>
        </div>
      </div>

      {/* TABLA CON SCROLL */}
      <div className="flex-1 overflow-hidden bg-slate-800/40 border border-slate-700/30 rounded-xl">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-900/95 z-10">
              <tr className="border-b border-slate-700/30">
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Eco</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Empresa</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Segmento</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Ubicación</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Vel</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Señal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {filteredFleet.map((unit) => {
                const empresaColor = EMPRESA_COLORS[unit.empresa] || EMPRESA_COLORS['TROB'];
                const statusConfig = STATUS_CONFIG[unit.status] || STATUS_CONFIG['no_signal'];
                
                return (
                  <tr 
                    key={unit.economico}
                    onClick={() => setSelectedUnit(unit)}
                    className="hover:bg-slate-700/20 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-white text-sm">{unit.economico}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${empresaColor.bg} ${empresaColor.text}`}>
                        {unit.empresa}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-300 text-xs">{unit.segmento.length > 18 ? unit.segmento.slice(0,18)+'...' : unit.segmento}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[200px]">
                      <span className="text-slate-400 text-xs truncate block">
                        {unit.address || (unit.latitude ? `${unit.latitude.toFixed(3)}, ${unit.longitude?.toFixed(3)}` : '-')}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${(unit.speed || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                        {unit.speed !== null ? `${unit.speed}` : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-400 text-xs">{formatTimestamp(unit.timestamp)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-bold text-white">{selectedUnit.economico}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${EMPRESA_COLORS[selectedUnit.empresa]?.bg} ${EMPRESA_COLORS[selectedUnit.empresa]?.text}`}>
                  {selectedUnit.empresa}
                </span>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="p-1 hover:bg-slate-700/50 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <div className={`flex items-center gap-2 p-2 rounded-lg ${STATUS_CONFIG[selectedUnit.status]?.bg}`}>
                {STATUS_CONFIG[selectedUnit.status]?.icon}
                <span className={`text-sm font-medium ${STATUS_CONFIG[selectedUnit.status]?.text}`}>
                  {STATUS_CONFIG[selectedUnit.status]?.label}
                </span>
                <span className="text-slate-400 text-xs ml-auto">{selectedUnit.segmento}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-900/50 rounded-lg p-2 col-span-2">
                  <div className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3"/>Ubicación</div>
                  <div className="text-white text-xs mt-1">{selectedUnit.address || 'Sin dirección'}</div>
                  {selectedUnit.latitude && <div className="text-slate-500 text-xs">{selectedUnit.latitude.toFixed(5)}, {selectedUnit.longitude?.toFixed(5)}</div>}
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="text-slate-400 text-xs flex items-center gap-1"><Gauge className="w-3 h-3"/>Velocidad</div>
                  <div className={`text-lg font-bold ${(selectedUnit.speed || 0) > 0 ? 'text-green-400' : 'text-white'}`}>
                    {selectedUnit.speed !== null ? `${selectedUnit.speed} km/h` : '-'}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="text-slate-400 text-xs flex items-center gap-1"><Power className="w-3 h-3"/>Motor</div>
                  <div className={`text-lg font-bold ${selectedUnit.ignition ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedUnit.ignition !== null ? (selectedUnit.ignition ? 'ON' : 'OFF') : '-'}
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="text-slate-400 text-xs">Odómetro</div>
                  <div className="text-white">{selectedUnit.odometer?.toLocaleString() || '-'} km</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <div className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3"/>Señal</div>
                  <div className="text-white text-xs">{formatTimestamp(selectedUnit.timestamp)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
