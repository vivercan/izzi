'use client';

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, MapPin, Clock, Gauge, Power, RefreshCw, Search, Download,
  ChevronDown, X, WifiOff, Navigation, Building2, ExternalLink
} from 'lucide-react';

// ============================================
// REGISTRY DE FLOTA - 242 UNIDADES
// ============================================
const FLOTA_LOMA_RAW: { economico: string; empresa: string; segmentoOriginal: string }[] = [
  // TROB - 130 unidades
  { economico: "167", empresa: "TROB", segmentoOriginal: "INSTITUTO" },
  { economico: "503", empresa: "TROB", segmentoOriginal: "PATIERO NEXTEER" },
  { economico: "505", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "509", empresa: "TROB", segmentoOriginal: "PATIERO NEXTEER" },
  { economico: "511", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "547", empresa: "TROB", segmentoOriginal: "PATIO CELAYA" },
  { economico: "575", empresa: "TROB", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "587", empresa: "TROB", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "589", empresa: "TROB", segmentoOriginal: "PATIO MTY" },
  { economico: "593", empresa: "TROB", segmentoOriginal: "PATIO MTY" },
  { economico: "629", empresa: "TROB", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "643", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "649", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "651", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "653", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "657", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "681", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "699", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "713", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "717", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "721", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "727", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "729", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "731", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "733", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "735", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "739", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "741", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "743", empresa: "TROB", segmentoOriginal: "ACCIDENTE" },
  { economico: "745", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "747", empresa: "TROB", segmentoOriginal: "ALPURA" },
  { economico: "749", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "751", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "753", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "757", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "759", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "761", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "765", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "767", empresa: "TROB", segmentoOriginal: "ALPURA" },
  { economico: "769", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "771", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "773", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "777", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "779", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "781", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "783", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "785", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "787", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "789", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "791", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "797", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "799", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "801", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "803", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "807", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "809", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "811", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "813", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "815", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "817", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "819", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "821", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "823", empresa: "TROB", segmentoOriginal: "ACCIDENTE" },
  { economico: "825", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "827", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "831", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "835", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "837", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "839", empresa: "TROB", segmentoOriginal: "ALPURA" },
  { economico: "841", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "843", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "845", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "847", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "849", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "851", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "853", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "855", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "857", empresa: "TROB", segmentoOriginal: "ALPURA" },
  { economico: "859", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "861", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "863", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "865", empresa: "TROB", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "867", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "869", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "871", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "873", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "875", empresa: "TROB", segmentoOriginal: "ACCIDENTE" },
  { economico: "877", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "879", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "883", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "885", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "887", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "889", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "891", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "893", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "895", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "897", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "899", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "901", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "903", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "905", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "907", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "909", empresa: "TROB", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "911", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "913", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "915", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "917", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "919", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "921", empresa: "TROB", segmentoOriginal: "MULA QRO" },
  { economico: "923", empresa: "TROB", segmentoOriginal: "MULA AGS" },
  { economico: "925", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "927", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "929", empresa: "TROB", segmentoOriginal: "ALPURA" },
  { economico: "931", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "933", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "935", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "937", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "939", empresa: "TROB", segmentoOriginal: "BARCEL" },
  { economico: "941", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "943", empresa: "TROB", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "945", empresa: "TROB", segmentoOriginal: "CARROL" },
  { economico: "947", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "953", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "955", empresa: "TROB", segmentoOriginal: "ALPURA" },
  { economico: "957", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "959", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "961", empresa: "TROB", segmentoOriginal: "BAFAR" },
  { economico: "963", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "501", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "507", empresa: "TROB", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  // WE - 56 unidades
  { economico: "112", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "116", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "118", empresa: "WE", segmentoOriginal: "CARROL" },
  { economico: "124", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "126", empresa: "WE", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "128", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "130", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "134", empresa: "WE", segmentoOriginal: "IMPEX/MTTO" },
  { economico: "138", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "140", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "142", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "144", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "146", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "148", empresa: "WE", segmentoOriginal: "CARROL" },
  { economico: "152", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "154", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "156", empresa: "WE", segmentoOriginal: "ALPURA" },
  { economico: "158", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "160", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "162", empresa: "WE", segmentoOriginal: "BARCEL" },
  { economico: "164", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "166", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "168", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "170", empresa: "WE", segmentoOriginal: "ALPURA" },
  { economico: "172", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "174", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "176", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "178", empresa: "WE", segmentoOriginal: "CARROL" },
  { economico: "180", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "182", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "184", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "186", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "188", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "190", empresa: "WE", segmentoOriginal: "ALPURA" },
  { economico: "192", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "194", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "196", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "198", empresa: "WE", segmentoOriginal: "ALPURA" },
  { economico: "200", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "202", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "204", empresa: "WE", segmentoOriginal: "ALPURA" },
  { economico: "206", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "208", empresa: "WE", segmentoOriginal: "CARROL" },
  { economico: "212", empresa: "WE", segmentoOriginal: "CARROL" },
  { economico: "214", empresa: "WE", segmentoOriginal: "CARROL" },
  { economico: "216", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "218", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "220", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "222", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "224", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "226", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "228", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "232", empresa: "WE", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "234", empresa: "WE", segmentoOriginal: "ALPURA" },
  { economico: "236", empresa: "WE", segmentoOriginal: "ALPURA" },
  { economico: "230", empresa: "WE", segmentoOriginal: "PENDIENTE DE ENTREGA ZAPATA" },
  // SHI - 33 unidades
  { economico: "1", empresa: "SHI", segmentoOriginal: "DEDICADO NS/MULA" },
  { economico: "101", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "103", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "105", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "107", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "109", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "111", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "113", empresa: "SHI", segmentoOriginal: "ACCIDENTE" },
  { economico: "115", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "117", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "119", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "121", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "123", empresa: "SHI", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "125", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "689", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "129", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "131", empresa: "SHI", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "133", empresa: "SHI", segmentoOriginal: "ACCIDENTE" },
  { economico: "401", empresa: "SHI", segmentoOriginal: "ALPURA" },
  { economico: "405", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "409", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "413", empresa: "SHI", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "417", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "419", empresa: "SHI", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "431", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "433", empresa: "SHI", segmentoOriginal: "PATIO CARROL" },
  { economico: "435", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "437", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "439", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "441", empresa: "SHI", segmentoOriginal: "DEDICADO PILGRIMS" },
  { economico: "443", empresa: "SHI", segmentoOriginal: "IMPEX/NEXTEER/CLARIOS" },
  { economico: "445", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  { economico: "449", empresa: "SHI", segmentoOriginal: "DEDICADO NS" },
  // TROB USA - 23 unidades
  { economico: "231001", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "231002", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "231003", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "231004", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "231005", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241006", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241007", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241008", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241009", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241010", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241011", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241012", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241013", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241014", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241015", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241016", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241017", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241018", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241019", empresa: "TROB USA", segmentoOriginal: "MTTO" },
  { economico: "241020", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "241021", empresa: "TROB USA", segmentoOriginal: "MTTO" },
  { economico: "775", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
  { economico: "881", empresa: "TROB USA", segmentoOriginal: "TROB USA" },
];

// Función para normalizar segmentos
const normalizeSegmento = (seg: string): string => {
  const s = seg.toUpperCase();
  if (s.includes('ALPURA')) return 'ALPURA';
  if (s.includes('BAFAR')) return 'BAFAR';
  if (s.includes('BARCEL')) return 'BARCEL';
  if (s.includes('CARROL')) return 'CARROLL';
  if (s.includes('NS') || s.includes('NATURESWEET')) return 'NatureSweet';
  if (s.includes('PILGRIM')) return 'Pilgrims';
  if (s.includes('IMPEX') && !s.includes('MTTO')) return 'IMPEX';
  if (s.includes('MTTO') || s.includes('MANTENIMIENTO')) return 'MTTO';
  if (s.includes('ACCIDENTE')) return 'ACCIDENTE';
  if (s.includes('INSTITUTO')) return 'INSTITUTO';
  if (s.includes('PATIO') || s.includes('MULA')) {
    if (s.includes('AGS')) return 'PATIO AGS';
    if (s.includes('QRO')) return 'PATIO QRO';
    if (s.includes('CELAYA')) return 'PATIO CELAYA';
    if (s.includes('MTY')) return 'PATIO MTY';
    if (s.includes('CARROL')) return 'PATIO CARROLL';
    return 'PATIOS';
  }
  if (s.includes('PENDIENTE')) return 'PENDIENTE';
  if (s.includes('TROB USA') || s.includes('USA')) return 'TROB USA';
  return 'IMPEX';
};

// Crear flota con segmentos normalizados
const FLOTA_LOMA = FLOTA_LOMA_RAW.map(u => ({
  economico: u.economico,
  empresa: u.empresa,
  segmento: normalizeSegmento(u.segmentoOriginal)
}));

// Tipos
interface FleetUnit {
  economico: string;
  empresa: string;
  segmento: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: string | null;
  address: string | null;
  timestamp: string | null;
  odometer: number | null;
  ignition: boolean | null;
  status: 'moving' | 'stopped' | 'offline' | 'no_signal' | 'loading';
  lastUpdate: Date | null;
}

const EMPRESA_ORDER: Record<string, number> = { 'SHI': 1, 'TROB': 2, 'WE': 3, 'TROB USA': 4 };
const EMPRESA_COLORS: Record<string, { bg: string; text: string; solid: string }> = {
  'SHI': { bg: 'bg-purple-500/20', text: 'text-purple-400', solid: 'bg-purple-600' },
  'TROB': { bg: 'bg-blue-500/20', text: 'text-blue-400', solid: 'bg-blue-600' },
  'WE': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', solid: 'bg-emerald-600' },
  'TROB USA': { bg: 'bg-amber-500/20', text: 'text-amber-400', solid: 'bg-amber-600' },
};

const SEGMENTOS_DISPONIBLES = [
  'ALPURA', 'BAFAR', 'BARCEL', 'CARROLL', 'NatureSweet', 'Pilgrims', 
  'IMPEX', 'MTTO', 'ACCIDENTE', 'INSTITUTO', 'PATIO AGS', 'PATIO QRO', 
  'PATIO CELAYA', 'PATIO MTY', 'PATIO CARROLL', 'PENDIENTE', 'TROB USA'
];

const BATCH_SIZE = 5;

export default function DespachoInteligenteContent() {
  const [fleet, setFleet] = useState<FleetUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterEmpresas, setFilterEmpresas] = useState<string[]>(['SHI', 'TROB', 'WE', 'TROB USA']);
  const [filterSegmento, setFilterSegmento] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<FleetUnit | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  const fetchBatch = async (placas: string[]): Promise<any[]> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ placas }),
        }
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.results || result.data || [];
    } catch { return []; }
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

  const toggleEmpresa = (emp: string) => {
    setFilterEmpresas(prev => 
      prev.includes(emp) ? prev.filter(e => e !== emp) : [...prev, emp]
    );
  };

  const filteredFleet = fleet
    .filter(unit => {
      if (searchTerm && !unit.economico.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (!filterEmpresas.includes(unit.empresa)) return false;
      if (filterSegmento !== 'ALL' && unit.segmento !== filterSegmento) return false;
      if (filterStatus === 'moving' && unit.status !== 'moving') return false;
      if (filterStatus === 'stopped' && unit.status !== 'stopped') return false;
      if (filterStatus === 'no_signal' && unit.status !== 'no_signal' && unit.status !== 'offline') return false;
      return true;
    })
    .sort((a, b) => {
      const empresaDiff = (EMPRESA_ORDER[a.empresa] || 99) - (EMPRESA_ORDER[b.empresa] || 99);
      if (empresaDiff !== 0) return empresaDiff;
      const segmentoDiff = a.segmento.localeCompare(b.segmento);
      if (segmentoDiff !== 0) return segmentoDiff;
      return parseInt(a.economico) - parseInt(b.economico);
    });

  const stats = {
    total: fleet.length,
    moving: fleet.filter(u => u.status === 'moving').length,
    stopped: fleet.filter(u => u.status === 'stopped').length,
    noSignal: fleet.filter(u => u.status === 'no_signal' || u.status === 'offline').length,
    loading: fleet.filter(u => u.status === 'loading').length,
    byEmpresa: {
      SHI: fleet.filter(u => u.empresa === 'SHI').length,
      TROB: fleet.filter(u => u.empresa === 'TROB').length,
      WE: fleet.filter(u => u.empresa === 'WE').length,
      'TROB USA': fleet.filter(u => u.empresa === 'TROB USA').length,
    }
  };

  const openGoogleMaps = (unit: FleetUnit) => {
    if (unit.latitude && unit.longitude) {
      window.open(`https://www.google.com/maps?q=${unit.latitude},${unit.longitude}`, '_blank');
    }
  };

  const exportToExcel = () => {
    const headers = ['Económico', 'Empresa', 'Segmento', 'Status', 'Velocidad', 'Latitud', 'Longitud', 'Dirección', 'Última Señal'];
    const rows = filteredFleet.map(u => [
      u.economico, u.empresa, u.segmento,
      u.status === 'moving' ? 'En Movimiento' : u.status === 'stopped' ? 'Detenido' : 'Sin Señal',
      u.speed || 0, u.latitude || '', u.longitude || '', u.address || '', u.timestamp || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `flota_gps_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return '-';
    try {
      return new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  };

  // Botón de status con efecto glassmorphism
  const StatusButton = ({ type, count, active, onClick }: { type: string; count: number; active: boolean; onClick: () => void }) => {
    const configs: Record<string, { bg: string; activeBg: string; text: string; icon: React.ReactNode; label: string }> = {
      total: { bg: 'from-slate-600 to-slate-700', activeBg: 'from-slate-500 to-slate-600', text: 'text-white', icon: <Truck className="w-4 h-4" />, label: 'Total' },
      moving: { bg: 'from-green-600 to-green-700', activeBg: 'from-green-500 to-green-600', text: 'text-white', icon: <Navigation className="w-4 h-4" />, label: 'Mov' },
      stopped: { bg: 'from-yellow-600 to-yellow-700', activeBg: 'from-yellow-500 to-yellow-600', text: 'text-white', icon: <Power className="w-4 h-4" />, label: 'Det' },
      no_signal: { bg: 'from-red-600 to-red-700', activeBg: 'from-red-500 to-red-600', text: 'text-white', icon: <WifiOff className="w-4 h-4" />, label: 'Sin' },
    };
    const cfg = configs[type];
    return (
      <button
        onClick={onClick}
        className={`
          relative overflow-hidden px-3 py-2 rounded-xl transition-all duration-200
          bg-gradient-to-b ${active ? cfg.activeBg : cfg.bg}
          border border-white/20 shadow-lg
          hover:scale-105 hover:shadow-xl
          ${active ? 'ring-2 ring-white/50' : ''}
          backdrop-blur-sm
        `}
        style={{ boxShadow: active ? '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 2px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2 relative z-10">
          {cfg.icon}
          <span className={`font-bold text-lg ${cfg.text}`}>{count}</span>
          <span className={`text-xs ${cfg.text} opacity-80`}>{cfg.label}</span>
        </div>
      </button>
    );
  };

  // Botón de empresa con multi-selección
  const EmpresaButton = ({ empresa, count, selected }: { empresa: string; count: number; selected: boolean }) => {
    const color = EMPRESA_COLORS[empresa];
    return (
      <button
        onClick={() => toggleEmpresa(empresa)}
        className={`
          px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
          border ${selected ? 'border-white/30' : 'border-transparent'}
          ${selected ? color.solid + ' text-white shadow-md' : 'bg-slate-700/50 text-slate-400'}
          hover:scale-105
        `}
      >
        {empresa} ({count})
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* HEADER */}
      <div className="flex-shrink-0 space-y-2 pb-2">
        {/* Fila 1: Botones de status + Empresas + Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botones de status */}
          <StatusButton type="total" count={stats.total} active={filterStatus === 'ALL'} onClick={() => setFilterStatus('ALL')} />
          <StatusButton type="moving" count={stats.moving} active={filterStatus === 'moving'} onClick={() => setFilterStatus('moving')} />
          <StatusButton type="stopped" count={stats.stopped} active={filterStatus === 'stopped'} onClick={() => setFilterStatus('stopped')} />
          <StatusButton type="no_signal" count={stats.noSignal} active={filterStatus === 'no_signal'} onClick={() => setFilterStatus('no_signal')} />
          
          <div className="w-px h-8 bg-slate-600 mx-1" />
          
          {/* Botones de empresa */}
          <EmpresaButton empresa="SHI" count={stats.byEmpresa.SHI} selected={filterEmpresas.includes('SHI')} />
          <EmpresaButton empresa="TROB" count={stats.byEmpresa.TROB} selected={filterEmpresas.includes('TROB')} />
          <EmpresaButton empresa="WE" count={stats.byEmpresa.WE} selected={filterEmpresas.includes('WE')} />
          <EmpresaButton empresa="TROB USA" count={stats.byEmpresa['TROB USA']} selected={filterEmpresas.includes('TROB USA')} />
          
          <div className="w-px h-8 bg-slate-600 mx-1" />
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Eco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-20 pl-7 pr-2 py-1.5 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          
          {/* Segmento */}
          <select
            value={filterSegmento}
            onChange={(e) => setFilterSegmento(e.target.value)}
            className="px-2 py-1.5 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white text-xs focus:outline-none max-w-[120px]"
          >
            <option value="ALL">Segmento</option>
            {SEGMENTOS_DISPONIBLES.map(seg => (
              <option key={seg} value={seg}>{seg}</option>
            ))}
          </select>
          
          <div className="flex-1" />
          
          {/* Info y acciones */}
          <span className="text-slate-500 text-xs">{filteredFleet.length}/{stats.total}</span>
          
          {lastRefresh && <span className="text-slate-500 text-xs">{lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>}
          
          <button onClick={exportToExcel} className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors" title="Exportar Excel">
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => fetchFleetGPS(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm disabled:opacity-50 shadow-md"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing || loading ? 'animate-spin' : ''}`} />
            {refreshing || loading ? `${Math.round((loadingProgress.current / loadingProgress.total) * 100)}%` : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="flex-1 overflow-hidden bg-slate-800/40 border border-slate-700/30 rounded-xl">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-900/95 z-10">
              <tr className="border-b border-slate-700/30">
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Eco</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Empresa</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Segmento</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Vel</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Ubicación</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">Señal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {filteredFleet.map((unit) => {
                const empresaColor = EMPRESA_COLORS[unit.empresa];
                const statusColors: Record<string, { bg: string; text: string }> = {
                  'moving': { bg: 'bg-green-500/20', text: 'text-green-400' },
                  'stopped': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
                  'no_signal': { bg: 'bg-red-500/20', text: 'text-red-400' },
                  'offline': { bg: 'bg-red-500/20', text: 'text-red-400' },
                  'loading': { bg: 'bg-slate-500/20', text: 'text-slate-400' },
                };
                const stColor = statusColors[unit.status] || statusColors['no_signal'];
                
                return (
                  <tr key={unit.economico} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-white text-sm">{unit.economico}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${empresaColor.bg} ${empresaColor.text}`}>
                        {unit.empresa}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-300 text-xs">{unit.segmento}</span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => openGoogleMaps(unit)}
                        disabled={!unit.latitude}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${stColor.bg} ${stColor.text} hover:opacity-80 disabled:cursor-not-allowed`}
                      >
                        {unit.status === 'moving' ? <Navigation className="w-3 h-3" /> : unit.status === 'stopped' ? <Power className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {unit.status === 'moving' ? 'Mov' : unit.status === 'stopped' ? 'Det' : 'Sin'}
                        {unit.latitude && <ExternalLink className="w-2.5 h-2.5 ml-0.5" />}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${(unit.speed || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                        {unit.speed !== null ? `${unit.speed}` : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[180px]">
                      <span className="text-slate-400 text-xs truncate block">
                        {unit.address || (unit.latitude ? `${unit.latitude.toFixed(3)}, ${unit.longitude?.toFixed(3)}` : '-')}
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

      {/* MODAL */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-bold text-white">{selectedUnit.economico}</span>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="p-1 hover:bg-slate-700/50 rounded"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-3 space-y-2">
              {selectedUnit.latitude && (
                <button onClick={() => openGoogleMaps(selectedUnit)} className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white">
                  <MapPin className="w-4 h-4" /> Ver en Google Maps
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
