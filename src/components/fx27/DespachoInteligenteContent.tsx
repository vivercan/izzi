'use client';

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, MapPin, Clock, Gauge, Power, RefreshCw, Search, Download,
  X, WifiOff, Navigation, ExternalLink
} from 'lucide-react';

// ============================================
// FLOTA - 242 UNIDADES
// ============================================
const FLOTA_LOMA_RAW: { economico: string; empresa: string; segmentoOriginal: string }[] = [
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

const normalizeSegmento = (seg: string): string => {
  const s = seg.toUpperCase();
  if (s.includes('ALPURA')) return 'ALPURA';
  if (s.includes('BAFAR')) return 'BAFAR';
  if (s.includes('BARCEL')) return 'BARCEL';
  if (s.includes('CARROL')) return 'CARROLL';
  if (s.includes('NS') || s.includes('NATURESWEET')) return 'NatureSweet';
  if (s.includes('PILGRIM')) return 'Pilgrims';
  if (s.includes('IMPEX') && !s.includes('MTTO')) return 'IMPEX';
  if (s.includes('MTTO')) return 'MTTO';
  if (s.includes('ACCIDENTE')) return 'ACCIDENTE';
  if (s.includes('INSTITUTO')) return 'INSTITUTO';
  if (s.includes('PATIO') || s.includes('MULA')) return 'PATIOS';
  if (s.includes('PENDIENTE')) return 'PENDIENTE';
  if (s.includes('TROB USA') || s.includes('USA')) return 'TROB USA';
  return 'IMPEX';
};

const FLOTA_LOMA = FLOTA_LOMA_RAW.map(u => ({
  economico: u.economico,
  empresa: u.empresa,
  segmento: normalizeSegmento(u.segmentoOriginal)
}));

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
const SEGMENTOS = ['ALPURA', 'BAFAR', 'BARCEL', 'CARROLL', 'NatureSweet', 'Pilgrims', 'IMPEX', 'MTTO', 'ACCIDENTE', 'INSTITUTO', 'PATIOS', 'PENDIENTE', 'TROB USA'];
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
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  const fetchBatch = async (placas: string[]): Promise<any[]> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify({ placas }) }
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.results || result.data || [];
    } catch { return []; }
  };

  const fetchFleetGPS = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const initialFleet: FleetUnit[] = FLOTA_LOMA.map(unit => ({ ...unit, latitude: null, longitude: null, speed: null, heading: null, address: null, timestamp: null, odometer: null, ignition: null, status: 'loading' as const, lastUpdate: null }));
    setFleet(initialFleet);
    const allPlacas = FLOTA_LOMA.map(u => u.economico);
    const batches: string[][] = [];
    for (let i = 0; i < allPlacas.length; i += BATCH_SIZE) batches.push(allPlacas.slice(i, i + BATCH_SIZE));
    setLoadingProgress({ current: 0, total: batches.length });
    const allResults: any[] = [];
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await fetchBatch(batches[i]);
      allResults.push(...batchResults);
      setLoadingProgress({ current: i + 1, total: batches.length });
      setFleet(prev => prev.map(unit => {
        const gpsData = allResults.find((d: any) => d.placa === unit.economico);
        if (gpsData?.success && gpsData.location) {
          const loc = gpsData.location;
          const isMoving = (loc.speed || 0) > 5;
          const hasSignal = loc.latitude && loc.longitude;
          const ignitionOn = loc.ignition === 'ON' || loc.ignition === true;
          return { ...unit, latitude: loc.latitude, longitude: loc.longitude, speed: loc.speed, heading: loc.heading, address: loc.address || loc.addressOriginal, timestamp: loc.timestamp, odometer: loc.odometer, ignition: ignitionOn, status: !hasSignal ? 'no_signal' : isMoving ? 'moving' : ignitionOn ? 'stopped' : 'offline', lastUpdate: new Date() };
        }
        if (batches.slice(0, i + 1).flat().includes(unit.economico) && unit.status === 'loading') return { ...unit, status: 'no_signal' as const, lastUpdate: new Date() };
        return unit;
      }));
      if (i < batches.length - 1) await new Promise(r => setTimeout(r, 300));
    }
    setLastRefresh(new Date()); setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { fetchFleetGPS(); }, [fetchFleetGPS]);

  const toggleEmpresa = (emp: string) => setFilterEmpresas(prev => prev.includes(emp) ? prev.filter(e => e !== emp) : [...prev, emp]);

  const filteredFleet = fleet.filter(unit => {
    if (searchTerm && !unit.economico.includes(searchTerm)) return false;
    if (!filterEmpresas.includes(unit.empresa)) return false;
    if (filterSegmento !== 'ALL' && unit.segmento !== filterSegmento) return false;
    if (filterStatus === 'moving' && unit.status !== 'moving') return false;
    if (filterStatus === 'stopped' && unit.status !== 'stopped') return false;
    if (filterStatus === 'no_signal' && unit.status !== 'no_signal' && unit.status !== 'offline') return false;
    return true;
  }).sort((a, b) => {
    const ed = (EMPRESA_ORDER[a.empresa] || 99) - (EMPRESA_ORDER[b.empresa] || 99);
    if (ed !== 0) return ed;
    const sd = a.segmento.localeCompare(b.segmento);
    if (sd !== 0) return sd;
    return parseInt(a.economico) - parseInt(b.economico);
  });

  const stats = {
    total: fleet.length,
    moving: fleet.filter(u => u.status === 'moving').length,
    stopped: fleet.filter(u => u.status === 'stopped').length,
    noSignal: fleet.filter(u => u.status === 'no_signal' || u.status === 'offline').length,
    byEmpresa: { SHI: fleet.filter(u => u.empresa === 'SHI').length, TROB: fleet.filter(u => u.empresa === 'TROB').length, WE: fleet.filter(u => u.empresa === 'WE').length, 'TROB USA': fleet.filter(u => u.empresa === 'TROB USA').length }
  };

  const openMaps = (u: FleetUnit) => u.latitude && window.open(`https://www.google.com/maps?q=${u.latitude},${u.longitude}`, '_blank');

  const exportExcel = () => {
    const rows = [['Eco', 'Empresa', 'Segmento', 'Status', 'Vel', 'Lat', 'Lon', 'Dirección', 'Señal'], ...filteredFleet.map(u => [u.economico, u.empresa, u.segmento, u.status, u.speed || '', u.latitude || '', u.longitude || '', u.address || '', u.timestamp || ''])];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `GPS_${new Date().toISOString().slice(0, 10)}.csv`; link.click();
  };

  const formatTs = (ts: string | null) => ts ? new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  // Botón 3D estilo glassmorphism uniforme
  const Btn3D = ({ active, color, onClick, children }: { active?: boolean; color: string; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`
      relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200
      ${active ? `bg-${color} text-white shadow-lg shadow-${color}/40` : 'bg-white/10 text-white/70 hover:bg-white/20'}
      backdrop-blur-md border border-white/20
      hover:scale-105 active:scale-95
    `} style={{
      background: active ? `linear-gradient(145deg, var(--tw-gradient-from), var(--tw-gradient-to))` : 'rgba(255,255,255,0.08)',
      boxShadow: active ? `0 8px 32px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.2), 0 4px 16px ${color === 'emerald-500' ? 'rgba(16,185,129,0.3)' : color === 'amber-500' ? 'rgba(245,158,11,0.3)' : color === 'red-500' ? 'rgba(239,68,68,0.3)' : 'rgba(100,100,100,0.3)'}` : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
    }}>{children}</button>
  );

  return (
    <div className="min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 50%, #1b263b 100%)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-2xl backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
        {/* Status buttons */}
        <button onClick={() => setFilterStatus('ALL')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${filterStatus === 'ALL' ? 'bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} style={{ boxShadow: filterStatus === 'ALL' ? '0 8px 24px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2)' : '0 4px 12px rgba(0,0,0,0.2)' }}>
          <Truck className="w-4 h-4" /> {stats.total}
        </button>
        <button onClick={() => setFilterStatus('moving')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${filterStatus === 'moving' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} style={{ boxShadow: filterStatus === 'moving' ? '0 8px 24px rgba(16,185,129,0.4), inset 0 2px 0 rgba(255,255,255,0.2)' : '0 4px 12px rgba(0,0,0,0.2)' }}>
          <Navigation className="w-4 h-4" /> {stats.moving}
        </button>
        <button onClick={() => setFilterStatus('stopped')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${filterStatus === 'stopped' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} style={{ boxShadow: filterStatus === 'stopped' ? '0 8px 24px rgba(245,158,11,0.4), inset 0 2px 0 rgba(255,255,255,0.2)' : '0 4px 12px rgba(0,0,0,0.2)' }}>
          <Power className="w-4 h-4" /> {stats.stopped}
        </button>
        <button onClick={() => setFilterStatus('no_signal')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${filterStatus === 'no_signal' ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} style={{ boxShadow: filterStatus === 'no_signal' ? '0 8px 24px rgba(239,68,68,0.4), inset 0 2px 0 rgba(255,255,255,0.2)' : '0 4px 12px rgba(0,0,0,0.2)' }}>
          <WifiOff className="w-4 h-4" /> {stats.noSignal}
        </button>

        <div className="w-px h-8 bg-white/20 mx-1" />

        {/* Empresa buttons */}
        {(['SHI', 'TROB', 'WE', 'TROB USA'] as const).map(emp => (
          <button key={emp} onClick={() => toggleEmpresa(emp)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filterEmpresas.includes(emp) ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/50 hover:bg-white/20'}`} style={{ boxShadow: filterEmpresas.includes(emp) ? '0 6px 20px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 3px 10px rgba(0,0,0,0.2)' }}>
            {emp} ({stats.byEmpresa[emp]})
          </button>
        ))}

        <div className="w-px h-8 bg-white/20 mx-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Eco..." className="w-24 pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 focus:outline-none focus:bg-white/15" />
        </div>

        {/* Segmento */}
        <select value={filterSegmento} onChange={e => setFilterSegmento(e.target.value)} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none">
          <option value="ALL" className="bg-slate-800">Segmento</option>
          {SEGMENTOS.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
        </select>

        <div className="flex-1" />

        <span className="text-white/50 text-xs">{filteredFleet.length}/{stats.total}</span>
        {lastRefresh && <span className="text-white/40 text-xs">{lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>}

        <button onClick={exportExcel} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}><Download className="w-4 h-4" /></button>
        <button onClick={() => fetchFleetGPS(true)} disabled={loading || refreshing} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${loading || refreshing ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'}`} style={{ boxShadow: loading || refreshing ? '0 8px 24px rgba(249,115,22,0.5), inset 0 2px 0 rgba(255,255,255,0.2)' : '0 8px 24px rgba(59,130,246,0.4), inset 0 2px 0 rgba(255,255,255,0.2)' }}>
          <RefreshCw className={`w-4 h-4 ${loading || refreshing ? 'animate-spin text-orange-200' : ''}`} />
          {loading || refreshing ? `${Math.round((loadingProgress.current / loadingProgress.total) * 100 || 0)}%` : 'Actualizar'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <table className="w-full">
            <thead className="sticky top-0 z-10" style={{ background: 'rgba(15,23,42,0.95)' }}>
              <tr>
                {['ECO', 'EMPRESA', 'SEGMENTO', 'STATUS', 'VEL', 'UBICACIÓN', 'SEÑAL'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map((u, i) => (
                <tr key={u.economico} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{u.economico}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${u.empresa === 'SHI' ? 'bg-purple-500/30 text-purple-300' : u.empresa === 'TROB' ? 'bg-blue-500/30 text-blue-300' : u.empresa === 'WE' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'}`}>{u.empresa}</span></td>
                  <td className="px-4 py-3 text-white/70 text-sm">{u.segmento}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openMaps(u)} disabled={!u.latitude} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${u.status === 'moving' ? 'bg-emerald-500/30 text-emerald-300' : u.status === 'stopped' ? 'bg-amber-500/30 text-amber-300' : 'bg-red-500/30 text-red-300'} ${u.latitude ? 'hover:opacity-80 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                      {u.status === 'moving' ? <Navigation className="w-3 h-3" /> : u.status === 'stopped' ? <Power className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {u.status === 'moving' ? 'Mov' : u.status === 'stopped' ? 'Det' : 'Sin'}
                      {u.latitude && <ExternalLink className="w-3 h-3 ml-1" />}
                    </button>
                  </td>
                  <td className="px-4 py-3"><span className={`text-sm font-medium ${(u.speed || 0) > 0 ? 'text-emerald-400' : 'text-white/40'}`}>{u.speed ?? '-'}</span></td>
                  <td className="px-4 py-3 text-white/50 text-xs max-w-[200px] truncate">{u.address || (u.latitude ? `${u.latitude.toFixed(3)}, ${u.longitude?.toFixed(3)}` : '-')}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{formatTs(u.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
