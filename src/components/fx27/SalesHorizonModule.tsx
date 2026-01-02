'use client';

import React, { useState, useMemo } from 'react';
import { 
  Target, ArrowLeft, Truck, Search, Calendar, ChevronRight,
  Building2, Users, Download, ArrowRightLeft, Calculator, Filter, X, Eye, EyeOff
} from 'lucide-react';

// ===== DATOS GLOBALES =====
const GLOBAL = { meta_anual: 1341341246.49, operatividad: 0.95, tractores_totales: 219, tractores_facturan: 210 };

const EMPRESAS = [
  { nombre: 'SPEEDYHAUL', unidades: 33, pct_flota: 0.15, ppto_anual: 201201186.97 },
  { nombre: 'TROB', unidades: 131, pct_flota: 0.595, ppto_anual: 798098041.66 },
  { nombre: 'WEXPRESS', unidades: 56, pct_flota: 0.255, ppto_anual: 342042017.86 },
];

const SEGMENTOS = [
  { id: 'BAFAR', nombre: 'Bafar', tractores: 16, facturan: 16, pct_ppto: 0.059, ppto_anual: 79152000, tracto_mes: 412250 },
  { id: 'CARROLL', nombre: 'Carroll', tractores: 32, facturan: 31, pct_ppto: 0.119, ppto_anual: 160166400, tracto_mes: 430555 },
  { id: 'BARCEL', nombre: 'Barcel', tractores: 10, facturan: 10, pct_ppto: 0.051, ppto_anual: 68140135, tracto_mes: 567834 },
  { id: 'NATURE_SWEET', nombre: 'Nature Sweet', tractores: 13, facturan: 13, pct_ppto: 0.051, ppto_anual: 68094000, tracto_mes: 436500 },
  { id: 'ALPURA', nombre: 'ALPURA', tractores: 13, facturan: 13, pct_ppto: 0.059, ppto_anual: 78570000, tracto_mes: 503654 },
  { id: 'IMPEX', nombre: 'IMPEX', tractores: 124, facturan: 116, pct_ppto: 0.608, ppto_anual: 815456954, tracto_mes: 585817 },
  { id: 'PILGRIMS', nombre: 'Pilgrims', tractores: 11, facturan: 11, pct_ppto: 0.054, ppto_anual: 71761757, tracto_mes: 543650 },
];

const MESES = [
  { mes: 1, nombre: 'Enero', pct: 0.07, ppto: 93893887 },
  { mes: 2, nombre: 'Febrero', pct: 0.07, ppto: 93893887 },
  { mes: 3, nombre: 'Marzo', pct: 0.08, ppto: 107307300 },
  { mes: 4, nombre: 'Abril', pct: 0.08, ppto: 107307300 },
  { mes: 5, nombre: 'Mayo', pct: 0.081, ppto: 108648641 },
  { mes: 6, nombre: 'Junio', pct: 0.085, ppto: 114014006 },
  { mes: 7, nombre: 'Julio', pct: 0.087, ppto: 116696688 },
  { mes: 8, nombre: 'Agosto', pct: 0.089, ppto: 119379371 },
  { mes: 9, nombre: 'Septiembre', pct: 0.093, ppto: 124744736 },
  { mes: 10, nombre: 'Octubre', pct: 0.095, ppto: 127427418 },
  { mes: 11, nombre: 'Noviembre', pct: 0.09, ppto: 120720712 },
  { mes: 12, nombre: 'Diciembre', pct: 0.08, ppto: 107307300 },
];

// ===== 365 DÍAS CON % EXACTOS DEL EXCEL =====
const DIAS_2026: Record<string, { ds: string; f: string | null; p: number }> = {
  '2026-01-01': { ds: 'Jue', f: 'Año Nuevo', p: 0.00952381 },
  '2026-01-02': { ds: 'Vie', f: 'Año Nuevo', p: 0.00952381 },
  '2026-01-03': { ds: 'Sáb', f: 'Año Nuevo', p: 0.00952381 },
  '2026-01-04': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-01-05': { ds: 'Lun', f: null, p: 0.03809524 },
  '2026-01-06': { ds: 'Mar', f: 'Día de Reyes', p: 0.01904762 },
  '2026-01-07': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-01-08': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-01-09': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-01-10': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-01-11': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-01-12': { ds: 'Lun', f: null, p: 0.03809524 },
  '2026-01-13': { ds: 'Mar', f: null, p: 0.03809524 },
  '2026-01-14': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-01-15': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-01-16': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-01-17': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-01-18': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-01-19': { ds: 'Lun', f: null, p: 0.03809524 },
  '2026-01-20': { ds: 'Mar', f: null, p: 0.03809524 },
  '2026-01-21': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-01-22': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-01-23': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-01-24': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-01-25': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-01-26': { ds: 'Lun', f: null, p: 0.03809524 },
  '2026-01-27': { ds: 'Mar', f: null, p: 0.03809524 },
  '2026-01-28': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-01-29': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-01-30': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-01-31': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-02-01': { ds: 'Dom', f: null, p: 0.02061856 },
  '2026-02-02': { ds: 'Lun', f: null, p: 0.04123711 },
  '2026-02-03': { ds: 'Mar', f: null, p: 0.04123711 },
  '2026-02-04': { ds: 'Mié', f: null, p: 0.04123711 },
  '2026-02-05': { ds: 'Jue', f: 'Constitución MX', p: 0.01030928 },
  '2026-02-06': { ds: 'Vie', f: null, p: 0.04123711 },
  '2026-02-07': { ds: 'Sáb', f: null, p: 0.03092784 },
  '2026-02-08': { ds: 'Dom', f: null, p: 0.02061856 },
  '2026-02-09': { ds: 'Lun', f: null, p: 0.04123711 },
  '2026-02-10': { ds: 'Mar', f: null, p: 0.04123711 },
  '2026-02-11': { ds: 'Mié', f: null, p: 0.04123711 },
  '2026-02-12': { ds: 'Jue', f: null, p: 0.05154639 },
  '2026-02-13': { ds: 'Vie', f: null, p: 0.04123711 },
  '2026-02-14': { ds: 'Sáb', f: null, p: 0.03092784 },
  '2026-02-15': { ds: 'Dom', f: null, p: 0.02061856 },
  '2026-02-16': { ds: 'Lun', f: 'Presidents Day', p: 0.01030928 },
  '2026-02-17': { ds: 'Mar', f: null, p: 0.04123711 },
  '2026-02-18': { ds: 'Mié', f: null, p: 0.04123711 },
  '2026-02-19': { ds: 'Jue', f: null, p: 0.05154639 },
  '2026-02-20': { ds: 'Vie', f: null, p: 0.04123711 },
  '2026-02-21': { ds: 'Sáb', f: null, p: 0.03092784 },
  '2026-02-22': { ds: 'Dom', f: null, p: 0.02061856 },
  '2026-02-23': { ds: 'Lun', f: null, p: 0.04123711 },
  '2026-02-24': { ds: 'Mar', f: null, p: 0.04123711 },
  '2026-02-25': { ds: 'Mié', f: null, p: 0.04123711 },
  '2026-02-26': { ds: 'Jue', f: null, p: 0.05154639 },
  '2026-02-27': { ds: 'Vie', f: null, p: 0.04123711 },
  '2026-02-28': { ds: 'Sáb', f: null, p: 0.03092784 },
  '2026-03-01': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-03-02': { ds: 'Lun', f: null, p: 0.03809524 },
  '2026-03-03': { ds: 'Mar', f: null, p: 0.03809524 },
  '2026-03-04': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-03-05': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-03-06': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-03-07': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-03-08': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-03-09': { ds: 'Lun', f: null, p: 0.03809524 },
  '2026-03-10': { ds: 'Mar', f: null, p: 0.03809524 },
  '2026-03-11': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-03-12': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-03-13': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-03-14': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-03-15': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-03-16': { ds: 'Lun', f: 'Benito Juárez', p: 0.01904762 },
  '2026-03-17': { ds: 'Mar', f: null, p: 0.03809524 },
  '2026-03-18': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-03-19': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-03-20': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-03-21': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-03-22': { ds: 'Dom', f: null, p: 0.01904762 },
  '2026-03-23': { ds: 'Lun', f: null, p: 0.03809524 },
  '2026-03-24': { ds: 'Mar', f: null, p: 0.03809524 },
  '2026-03-25': { ds: 'Mié', f: null, p: 0.03809524 },
  '2026-03-26': { ds: 'Jue', f: null, p: 0.04761905 },
  '2026-03-27': { ds: 'Vie', f: null, p: 0.03809524 },
  '2026-03-28': { ds: 'Sáb', f: null, p: 0.02857143 },
  '2026-03-29': { ds: 'Dom', f: 'Semana Santa', p: 0.00952381 },
  '2026-03-30': { ds: 'Lun', f: 'Semana Santa', p: 0.00952381 },
  '2026-03-31': { ds: 'Mar', f: 'Semana Santa', p: 0.00952381 },
  '2026-04-01': { ds: 'Mié', f: 'Semana Santa', p: 0.01 },
  '2026-04-02': { ds: 'Jue', f: 'Semana Santa', p: 0.01 },
  '2026-04-03': { ds: 'Vie', f: 'Semana Santa', p: 0.01 },
  '2026-04-04': { ds: 'Sáb', f: 'Semana Santa', p: 0.01 },
  '2026-04-05': { ds: 'Dom', f: 'Semana Santa', p: 0.01 },
  '2026-04-06': { ds: 'Lun', f: null, p: 0.04 },
  '2026-04-07': { ds: 'Mar', f: null, p: 0.04 },
  '2026-04-08': { ds: 'Mié', f: null, p: 0.04 },
  '2026-04-09': { ds: 'Jue', f: null, p: 0.05 },
  '2026-04-10': { ds: 'Vie', f: null, p: 0.04 },
  '2026-04-11': { ds: 'Sáb', f: null, p: 0.03 },
  '2026-04-12': { ds: 'Dom', f: null, p: 0.02 },
  '2026-04-13': { ds: 'Lun', f: null, p: 0.04 },
  '2026-04-14': { ds: 'Mar', f: null, p: 0.04 },
  '2026-04-15': { ds: 'Mié', f: null, p: 0.04 },
  '2026-04-16': { ds: 'Jue', f: null, p: 0.05 },
  '2026-04-17': { ds: 'Vie', f: null, p: 0.04 },
  '2026-04-18': { ds: 'Sáb', f: null, p: 0.03 },
  '2026-04-19': { ds: 'Dom', f: null, p: 0.02 },
  '2026-04-20': { ds: 'Lun', f: null, p: 0.04 },
  '2026-04-21': { ds: 'Mar', f: null, p: 0.04 },
  '2026-04-22': { ds: 'Mié', f: null, p: 0.04 },
  '2026-04-23': { ds: 'Jue', f: null, p: 0.05 },
  '2026-04-24': { ds: 'Vie', f: null, p: 0.04 },
  '2026-04-25': { ds: 'Sáb', f: null, p: 0.03 },
  '2026-04-26': { ds: 'Dom', f: null, p: 0.02 },
  '2026-04-27': { ds: 'Lun', f: null, p: 0.04 },
  '2026-04-28': { ds: 'Mar', f: null, p: 0.04 },
  '2026-04-29': { ds: 'Mié', f: null, p: 0.04 },
  '2026-04-30': { ds: 'Jue', f: null, p: 0.05 },
  '2026-05-01': { ds: 'Vie', f: 'Día del Trabajo', p: 0.00925926 },
  '2026-05-02': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-05-03': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-05-04': { ds: 'Lun', f: null, p: 0.03703704 },
  '2026-05-05': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-05-06': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-05-07': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-05-08': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-05-09': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-05-10': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-05-11': { ds: 'Lun', f: null, p: 0.03703704 },
  '2026-05-12': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-05-13': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-05-14': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-05-15': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-05-16': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-05-17': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-05-18': { ds: 'Lun', f: null, p: 0.03703704 },
  '2026-05-19': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-05-20': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-05-21': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-05-22': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-05-23': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-05-24': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-05-25': { ds: 'Lun', f: 'Memorial Day', p: 0.01851852 },
  '2026-05-26': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-05-27': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-05-28': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-05-29': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-05-30': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-05-31': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-06-01': { ds: 'Lun', f: null, p: 0.03571429 },
  '2026-06-02': { ds: 'Mar', f: null, p: 0.03571429 },
  '2026-06-03': { ds: 'Mié', f: null, p: 0.03571429 },
  '2026-06-04': { ds: 'Jue', f: null, p: 0.04464286 },
  '2026-06-05': { ds: 'Vie', f: null, p: 0.03571429 },
  '2026-06-06': { ds: 'Sáb', f: null, p: 0.02678571 },
  '2026-06-07': { ds: 'Dom', f: null, p: 0.01785714 },
  '2026-06-08': { ds: 'Lun', f: null, p: 0.03571429 },
  '2026-06-09': { ds: 'Mar', f: null, p: 0.03571429 },
  '2026-06-10': { ds: 'Mié', f: null, p: 0.03571429 },
  '2026-06-11': { ds: 'Jue', f: null, p: 0.04464286 },
  '2026-06-12': { ds: 'Vie', f: null, p: 0.03571429 },
  '2026-06-13': { ds: 'Sáb', f: null, p: 0.02678571 },
  '2026-06-14': { ds: 'Dom', f: null, p: 0.01785714 },
  '2026-06-15': { ds: 'Lun', f: null, p: 0.03571429 },
  '2026-06-16': { ds: 'Mar', f: null, p: 0.03571429 },
  '2026-06-17': { ds: 'Mié', f: null, p: 0.03571429 },
  '2026-06-18': { ds: 'Jue', f: null, p: 0.04464286 },
  '2026-06-19': { ds: 'Vie', f: null, p: 0.03571429 },
  '2026-06-20': { ds: 'Sáb', f: null, p: 0.02678571 },
  '2026-06-21': { ds: 'Dom', f: null, p: 0.01785714 },
  '2026-06-22': { ds: 'Lun', f: null, p: 0.03571429 },
  '2026-06-23': { ds: 'Mar', f: null, p: 0.03571429 },
  '2026-06-24': { ds: 'Mié', f: null, p: 0.03571429 },
  '2026-06-25': { ds: 'Jue', f: null, p: 0.04464286 },
  '2026-06-26': { ds: 'Vie', f: null, p: 0.03571429 },
  '2026-06-27': { ds: 'Sáb', f: null, p: 0.02678571 },
  '2026-06-28': { ds: 'Dom', f: null, p: 0.01785714 },
  '2026-06-29': { ds: 'Lun', f: null, p: 0.03571429 },
  '2026-06-30': { ds: 'Mar', f: null, p: 0.03571429 },
  '2026-07-01': { ds: 'Mié', f: null, p: 0.05970149 },
  '2026-07-02': { ds: 'Jue', f: null, p: 0.07462687 },
  '2026-07-03': { ds: 'Vie', f: null, p: 0.05970149 },
  '2026-07-04': { ds: 'Sáb', f: 'Independence Day', p: 0.01492537 },
  '2026-07-05': { ds: 'Dom', f: null, p: 0.02985075 },
  '2026-07-06': { ds: 'Lun', f: null, p: 0.05970149 },
  '2026-07-07': { ds: 'Mar', f: null, p: 0.05970149 },
  '2026-07-08': { ds: 'Mié', f: null, p: 0.05970149 },
  '2026-07-09': { ds: 'Jue', f: null, p: 0.07462687 },
  '2026-07-10': { ds: 'Vie', f: null, p: 0.05970149 },
  '2026-07-11': { ds: 'Sáb', f: null, p: 0.04477612 },
  '2026-07-12': { ds: 'Dom', f: null, p: 0.02985075 },
  '2026-07-13': { ds: 'Lun', f: null, p: 0.05970149 },
  '2026-07-14': { ds: 'Mar', f: null, p: 0.05970149 },
  '2026-07-15': { ds: 'Mié', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-16': { ds: 'Jue', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-17': { ds: 'Vie', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-18': { ds: 'Sáb', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-19': { ds: 'Dom', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-20': { ds: 'Lun', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-21': { ds: 'Mar', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-22': { ds: 'Mié', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-23': { ds: 'Jue', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-24': { ds: 'Vie', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-25': { ds: 'Sáb', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-26': { ds: 'Dom', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-27': { ds: 'Lun', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-28': { ds: 'Mar', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-29': { ds: 'Mié', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-30': { ds: 'Jue', f: 'Cierres Planta', p: 0.01492537 },
  '2026-07-31': { ds: 'Vie', f: 'Cierres Planta', p: 0.01492537 },
  '2026-08-01': { ds: 'Sáb', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-02': { ds: 'Dom', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-03': { ds: 'Lun', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-04': { ds: 'Mar', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-05': { ds: 'Mié', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-06': { ds: 'Jue', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-07': { ds: 'Vie', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-08': { ds: 'Sáb', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-09': { ds: 'Dom', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-10': { ds: 'Lun', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-11': { ds: 'Mar', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-12': { ds: 'Mié', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-13': { ds: 'Jue', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-14': { ds: 'Vie', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-15': { ds: 'Sáb', f: 'Cierres Planta', p: 0.02272727 },
  '2026-08-16': { ds: 'Dom', f: null, p: 0.02272727 },
  '2026-08-17': { ds: 'Lun', f: null, p: 0.04545455 },
  '2026-08-18': { ds: 'Mar', f: null, p: 0.04545455 },
  '2026-08-19': { ds: 'Mié', f: null, p: 0.04545455 },
  '2026-08-20': { ds: 'Jue', f: null, p: 0.05681818 },
  '2026-08-21': { ds: 'Vie', f: null, p: 0.04545455 },
  '2026-08-22': { ds: 'Sáb', f: null, p: 0.03409091 },
  '2026-08-23': { ds: 'Dom', f: null, p: 0.02272727 },
  '2026-08-24': { ds: 'Lun', f: null, p: 0.04545455 },
  '2026-08-25': { ds: 'Mar', f: null, p: 0.04545455 },
  '2026-08-26': { ds: 'Mié', f: null, p: 0.04545455 },
  '2026-08-27': { ds: 'Jue', f: null, p: 0.05681818 },
  '2026-08-28': { ds: 'Vie', f: null, p: 0.04545455 },
  '2026-08-29': { ds: 'Sáb', f: null, p: 0.03409091 },
  '2026-08-30': { ds: 'Dom', f: null, p: 0.02272727 },
  '2026-08-31': { ds: 'Lun', f: null, p: 0.04545455 },
  '2026-09-01': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-09-02': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-09-03': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-09-04': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-09-05': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-09-06': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-09-07': { ds: 'Lun', f: 'Labor Day', p: 0.01851852 },
  '2026-09-08': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-09-09': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-09-10': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-09-11': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-09-12': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-09-13': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-09-14': { ds: 'Lun', f: null, p: 0.03703704 },
  '2026-09-15': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-09-16': { ds: 'Mié', f: 'Independencia MX', p: 0.01851852 },
  '2026-09-17': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-09-18': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-09-19': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-09-20': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-09-21': { ds: 'Lun', f: null, p: 0.03703704 },
  '2026-09-22': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-09-23': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-09-24': { ds: 'Jue', f: null, p: 0.0462963 },
  '2026-09-25': { ds: 'Vie', f: null, p: 0.03703704 },
  '2026-09-26': { ds: 'Sáb', f: null, p: 0.02777778 },
  '2026-09-27': { ds: 'Dom', f: null, p: 0.01851852 },
  '2026-09-28': { ds: 'Lun', f: null, p: 0.03703704 },
  '2026-09-29': { ds: 'Mar', f: null, p: 0.03703704 },
  '2026-09-30': { ds: 'Mié', f: null, p: 0.03703704 },
  '2026-10-01': { ds: 'Jue', f: null, p: 0.04347826 },
  '2026-10-02': { ds: 'Vie', f: null, p: 0.03478261 },
  '2026-10-03': { ds: 'Sáb', f: null, p: 0.02608696 },
  '2026-10-04': { ds: 'Dom', f: null, p: 0.0173913 },
  '2026-10-05': { ds: 'Lun', f: null, p: 0.03478261 },
  '2026-10-06': { ds: 'Mar', f: null, p: 0.03478261 },
  '2026-10-07': { ds: 'Mié', f: null, p: 0.03478261 },
  '2026-10-08': { ds: 'Jue', f: null, p: 0.04347826 },
  '2026-10-09': { ds: 'Vie', f: null, p: 0.03478261 },
  '2026-10-10': { ds: 'Sáb', f: null, p: 0.02608696 },
  '2026-10-11': { ds: 'Dom', f: null, p: 0.0173913 },
  '2026-10-12': { ds: 'Lun', f: 'Columbus Day', p: 0.02608696 },
  '2026-10-13': { ds: 'Mar', f: null, p: 0.03478261 },
  '2026-10-14': { ds: 'Mié', f: null, p: 0.03478261 },
  '2026-10-15': { ds: 'Jue', f: null, p: 0.04347826 },
  '2026-10-16': { ds: 'Vie', f: null, p: 0.03478261 },
  '2026-10-17': { ds: 'Sáb', f: null, p: 0.02608696 },
  '2026-10-18': { ds: 'Dom', f: null, p: 0.0173913 },
  '2026-10-19': { ds: 'Lun', f: null, p: 0.03478261 },
  '2026-10-20': { ds: 'Mar', f: null, p: 0.03478261 },
  '2026-10-21': { ds: 'Mié', f: null, p: 0.03478261 },
  '2026-10-22': { ds: 'Jue', f: null, p: 0.04347826 },
  '2026-10-23': { ds: 'Vie', f: null, p: 0.03478261 },
  '2026-10-24': { ds: 'Sáb', f: null, p: 0.02608696 },
  '2026-10-25': { ds: 'Dom', f: null, p: 0.0173913 },
  '2026-10-26': { ds: 'Lun', f: null, p: 0.03478261 },
  '2026-10-27': { ds: 'Mar', f: null, p: 0.03478261 },
  '2026-10-28': { ds: 'Mié', f: null, p: 0.03478261 },
  '2026-10-29': { ds: 'Jue', f: null, p: 0.04347826 },
  '2026-10-30': { ds: 'Vie', f: null, p: 0.03478261 },
  '2026-10-31': { ds: 'Sáb', f: null, p: 0.02608696 },
  '2026-11-01': { ds: 'Dom', f: null, p: 0.02020202 },
  '2026-11-02': { ds: 'Lun', f: 'Día de Muertos', p: 0.02020202 },
  '2026-11-03': { ds: 'Mar', f: null, p: 0.04040404 },
  '2026-11-04': { ds: 'Mié', f: null, p: 0.04040404 },
  '2026-11-05': { ds: 'Jue', f: null, p: 0.05050505 },
  '2026-11-06': { ds: 'Vie', f: null, p: 0.04040404 },
  '2026-11-07': { ds: 'Sáb', f: null, p: 0.03030303 },
  '2026-11-08': { ds: 'Dom', f: null, p: 0.02020202 },
  '2026-11-09': { ds: 'Lun', f: null, p: 0.04040404 },
  '2026-11-10': { ds: 'Mar', f: null, p: 0.04040404 },
  '2026-11-11': { ds: 'Mié', f: null, p: 0.04040404 },
  '2026-11-12': { ds: 'Jue', f: null, p: 0.05050505 },
  '2026-11-13': { ds: 'Vie', f: null, p: 0.04040404 },
  '2026-11-14': { ds: 'Sáb', f: null, p: 0.03030303 },
  '2026-11-15': { ds: 'Dom', f: null, p: 0.02020202 },
  '2026-11-16': { ds: 'Lun', f: 'Revolución MX', p: 0.02020202 },
  '2026-11-17': { ds: 'Mar', f: null, p: 0.04040404 },
  '2026-11-18': { ds: 'Mié', f: null, p: 0.04040404 },
  '2026-11-19': { ds: 'Jue', f: null, p: 0.05050505 },
  '2026-11-20': { ds: 'Vie', f: null, p: 0.04040404 },
  '2026-11-21': { ds: 'Sáb', f: null, p: 0.03030303 },
  '2026-11-22': { ds: 'Dom', f: null, p: 0.02020202 },
  '2026-11-23': { ds: 'Lun', f: null, p: 0.04040404 },
  '2026-11-24': { ds: 'Mar', f: null, p: 0.04040404 },
  '2026-11-25': { ds: 'Mié', f: null, p: 0.04040404 },
  '2026-11-26': { ds: 'Jue', f: 'Thanksgiving', p: 0.01010101 },
  '2026-11-27': { ds: 'Vie', f: 'Thanksgiving', p: 0.01010101 },
  '2026-11-28': { ds: 'Sáb', f: null, p: 0.03030303 },
  '2026-11-29': { ds: 'Dom', f: null, p: 0.02020202 },
  '2026-11-30': { ds: 'Lun', f: null, p: 0.04040404 },
  '2026-12-01': { ds: 'Mar', f: null, p: 0.04494382 },
  '2026-12-02': { ds: 'Mié', f: null, p: 0.04494382 },
  '2026-12-03': { ds: 'Jue', f: null, p: 0.05617978 },
  '2026-12-04': { ds: 'Vie', f: null, p: 0.04494382 },
  '2026-12-05': { ds: 'Sáb', f: null, p: 0.03370787 },
  '2026-12-06': { ds: 'Dom', f: null, p: 0.02247191 },
  '2026-12-07': { ds: 'Lun', f: null, p: 0.04494382 },
  '2026-12-08': { ds: 'Mar', f: null, p: 0.04494382 },
  '2026-12-09': { ds: 'Mié', f: null, p: 0.04494382 },
  '2026-12-10': { ds: 'Jue', f: null, p: 0.05617978 },
  '2026-12-11': { ds: 'Vie', f: null, p: 0.04494382 },
  '2026-12-12': { ds: 'Sáb', f: null, p: 0.03370787 },
  '2026-12-13': { ds: 'Dom', f: null, p: 0.02247191 },
  '2026-12-14': { ds: 'Lun', f: null, p: 0.04494382 },
  '2026-12-15': { ds: 'Mar', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-16': { ds: 'Mié', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-17': { ds: 'Jue', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-18': { ds: 'Vie', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-19': { ds: 'Sáb', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-20': { ds: 'Dom', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-21': { ds: 'Lun', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-22': { ds: 'Mar', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-23': { ds: 'Mié', f: 'Temporada Baja', p: 0.02247191 },
  '2026-12-24': { ds: 'Jue', f: 'Navidad', p: 0.00561798 },
  '2026-12-25': { ds: 'Vie', f: 'Navidad', p: 0.00561798 },
  '2026-12-26': { ds: 'Sáb', f: null, p: 0.03370787 },
  '2026-12-27': { ds: 'Dom', f: null, p: 0.02247191 },
  '2026-12-28': { ds: 'Lun', f: null, p: 0.04494382 },
  '2026-12-29': { ds: 'Mar', f: null, p: 0.04494382 },
  '2026-12-30': { ds: 'Mié', f: null, p: 0.04494382 },
  '2026-12-31': { ds: 'Jue', f: 'Fin de Año', p: 0.01123596 },
};

// ===== SEMANAS =====
const SEMANAS = [
  { semana: 1, inicio: '01/01', fin: '09/01', dias: 9, meta_total: 33074168, speedyhaul: 4961125, trob: 19679130, wexpress: 8433913, acumulado: 33074168 },
  { semana: 2, inicio: '10/01', fin: '16/01', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 58798520 },
  { semana: 3, inicio: '17/01', fin: '23/01', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 84522873 },
  { semana: 4, inicio: '24/01', fin: '30/01', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 110247226 },
  ...Array.from({ length: 48 }, (_, i) => ({ semana: i + 5, inicio: '', fin: '', dias: 7, meta_total: 25000000, speedyhaul: 3750000, trob: 14875000, wexpress: 6375000, acumulado: 110247226 + (i + 1) * 25000000 })),
];

// ===== HELPERS =====
const formatMoney = (v: number, c = false): string => {
  if (c) {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);
};
const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;
const getFechaStr = (m: number, d: number) => `2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const getDiasMes = (m: number) => [31,28,31,30,31,30,31,31,30,31,30,31][m-1];

// ===== TIPOS =====
type Vista = 'dashboard' | 'empresa' | 'segmento' | 'semanas' | 'mes' | 'buscar' | 'mover' | 'simulador';
interface Props { onBack: () => void; }

// ===== COMPONENTE =====
export default function SalesHorizonModule({ onBack }: Props) {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [mesActual] = useState(new Date().getMonth() + 1);
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [simSegmento, setSimSegmento] = useState('IMPEX');
  const [simCambio, setSimCambio] = useState(0);

  const datosMes = MESES.find(m => m.mes === mesSeleccionado) || MESES[0];
  
  // Meta del día usando % exacto del Excel
  const hoy = new Date();
  const fechaHoy = getFechaStr(hoy.getMonth() + 1, hoy.getDate());
  const diaHoy = DIAS_2026[fechaHoy];
  const metaHoy = diaHoy ? datosMes.ppto * diaHoy.p : 0;

  // Días del mes seleccionado
  const diasDelMes = useMemo(() => {
    const dias = [];
    for (let d = 1; d <= getDiasMes(mesSeleccionado); d++) {
      const fecha = getFechaStr(mesSeleccionado, d);
      const dia = DIAS_2026[fecha];
      if (dia) dias.push({ dia: d, ...dia, meta: datosMes.ppto * dia.p });
    }
    return dias;
  }, [mesSeleccionado, datosMes]);

  // Simulador
  const simulacion = useMemo(() => {
    const seg = SEGMENTOS.find(s => s.id === simSegmento);
    if (!seg) return null;
    const actual = seg.facturan;
    const nuevo = actual + simCambio;
    if (nuevo <= 0) return null;
    const metaMes = datosMes.ppto * seg.pct_ppto;
    return {
      segmento: seg.nombre,
      actual,
      nuevo,
      tractoActual: metaMes / actual,
      tractoNuevo: metaMes / nuevo,
      diff: (metaMes / nuevo) - (metaMes / actual),
    };
  }, [simSegmento, simCambio, datosMes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={vista === 'dashboard' ? onBack : () => setVista('dashboard')} className="p-2 hover:bg-slate-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl"><Target className="w-6 h-6 text-white" /></div>
              <div>
                <h1 className="text-xl font-bold text-white">Sales Horizon 2026</h1>
                <p className="text-sm text-slate-400">{datosMes.nombre} - Presupuesto</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={mesSeleccionado} onChange={e => setMesSeleccionado(Number(e.target.value))} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
              {MESES.map(m => <option key={m.mes} value={m.mes}>{m.nombre}</option>)}
            </select>
            <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
              <Download className="w-4 h-4 text-white" /><span className="text-sm text-white">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      {vista === 'dashboard' && (
        <div className="p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 rounded-xl p-4 border border-blue-500/30">
              <div className="text-blue-300 text-sm mb-1">Meta Anual 2026</div>
              <div className="text-2xl font-bold text-white">{formatMoney(GLOBAL.meta_anual, true)}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-700/30 rounded-xl p-4 border border-emerald-500/30">
              <div className="text-emerald-300 text-sm mb-1">Operatividad</div>
              <div className="text-2xl font-bold text-white">{formatPct(GLOBAL.operatividad)}</div>
              <div className="text-xs text-emerald-400">{GLOBAL.tractores_facturan}/{GLOBAL.tractores_totales}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600/30 to-orange-700/30 rounded-xl p-4 border border-orange-500/30">
              <div className="text-orange-300 text-sm mb-1">Meta {datosMes.nombre}</div>
              <div className="text-2xl font-bold text-white">{formatMoney(datosMes.ppto, true)}</div>
              <div className="text-xs text-orange-400">{formatPct(datosMes.pct)} del año</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 rounded-xl p-4 border border-purple-500/30">
              <div className="text-purple-300 text-sm mb-1">Meta Hoy ({diaHoy?.ds})</div>
              <div className="text-2xl font-bold text-white">{formatMoney(metaHoy, true)}</div>
              <div className="text-xs text-purple-400">{diaHoy?.f || 'Normal'} • {formatPct(diaHoy?.p || 0)}</div>
            </div>
          </div>

          {/* Navegación */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { v: 'empresa', i: Building2, t: 'Por Empresa', c: 'blue' },
              { v: 'segmento', i: Users, t: 'Por Segmento', c: 'emerald' },
              { v: 'mes', i: Calendar, t: 'Días del Mes', c: 'orange' },
              { v: 'semanas', i: Calendar, t: '52 Semanas', c: 'purple' },
              { v: 'buscar', i: Search, t: 'Buscar Tracto', c: 'cyan' },
            ].map(({ v, i: Icon, t, c }) => (
              <button key={v} onClick={() => setVista(v as Vista)} className={`flex flex-col items-center gap-2 p-4 bg-${c}-600/20 hover:bg-${c}-600/30 rounded-xl border border-${c}-500/30`}>
                <Icon className={`w-6 h-6 text-${c}-400`} />
                <span className="text-white text-sm">{t}</span>
              </button>
            ))}
          </div>

          {/* Empresas + Segmentos */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Empresas - {datosMes.nombre}</h3>
              {EMPRESAS.map(e => (
                <div key={e.nombre} className="flex justify-between p-3 bg-slate-700/30 rounded-lg mb-2">
                  <div><div className="text-white font-medium">{e.nombre}</div><div className="text-slate-400 text-xs">{e.unidades} unidades</div></div>
                  <div className="text-white font-bold">{formatMoney(datosMes.ppto * e.pct_flota, true)}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Segmentos - {datosMes.nombre}</h3>
              <div className="max-h-[250px] overflow-y-auto space-y-2">
                {SEGMENTOS.map(s => (
                  <div key={s.id} className="flex justify-between p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50" onClick={() => setVista('segmento')}>
                    <div><div className="text-white font-medium">{s.nombre}</div><div className="text-slate-400 text-xs">{s.facturan} tractores • {formatMoney(s.tracto_mes, true)}/T</div></div>
                    <div className="text-white font-bold">{formatMoney(datosMes.ppto * s.pct_ppto, true)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Herramientas */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setVista('mover')} className="flex items-center gap-3 p-4 bg-amber-600/20 hover:bg-amber-600/30 rounded-xl border border-amber-500/30">
              <ArrowRightLeft className="w-6 h-6 text-amber-400" />
              <div><div className="text-white font-medium">Mover Tracto</div><div className="text-amber-300 text-xs">Cambiar de segmento</div></div>
            </button>
            <button onClick={() => setVista('simulador')} className="flex items-center gap-3 p-4 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-xl border border-cyan-500/30">
              <Calculator className="w-6 h-6 text-cyan-400" />
              <div><div className="text-white font-medium">Simulador</div><div className="text-cyan-300 text-xs">¿Qué pasa si +1/-1?</div></div>
            </button>
          </div>
        </div>
      )}

      {/* Vista Mes - Días con % exactos */}
      {vista === 'mes' && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">{datosMes.nombre} 2026 - Desglose Diario</h2>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-slate-400">Día</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-400">Semana</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-400">Festivo</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400">% Curva</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400">Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {diasDelMes.map(d => (
                    <tr key={d.dia} className={`hover:bg-slate-700/30 ${d.f ? 'bg-amber-500/10' : ''}`}>
                      <td className="px-4 py-2 text-white font-mono">{d.dia}</td>
                      <td className="px-4 py-2 text-slate-300">{d.ds}</td>
                      <td className="px-4 py-2">{d.f ? <span className="text-amber-400 text-xs">{d.f}</span> : '-'}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{formatPct(d.p)}</td>
                      <td className="px-4 py-2 text-right text-white font-bold">{formatMoney(d.meta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vista Empresa */}
      {vista === 'empresa' && (
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Por Empresa - {datosMes.nombre}</h2>
          {EMPRESAS.map(e => (
            <div key={e.nombre} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <div className="flex justify-between mb-4">
                <div><h3 className="text-lg font-bold text-white">{e.nombre}</h3><p className="text-slate-400 text-sm">{e.unidades} unidades • {formatPct(e.pct_flota)}</p></div>
                <div className="text-2xl font-bold text-white">{formatMoney(datosMes.ppto * e.pct_flota, true)}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-700/30 rounded-lg"><div className="text-slate-400 text-xs">Meta Anual</div><div className="text-white font-bold">{formatMoney(e.ppto_anual, true)}</div></div>
                <div className="p-3 bg-slate-700/30 rounded-lg"><div className="text-slate-400 text-xs">Meta Semana</div><div className="text-white font-bold">{formatMoney(datosMes.ppto * e.pct_flota / 4, true)}</div></div>
                <div className="p-3 bg-slate-700/30 rounded-lg"><div className="text-slate-400 text-xs">Meta Día (prom)</div><div className="text-white font-bold">{formatMoney(datosMes.ppto * e.pct_flota / getDiasMes(mesSeleccionado), true)}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Segmento */}
      {vista === 'segmento' && (
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Por Segmento - {datosMes.nombre}</h2>
          {SEGMENTOS.map(s => (
            <div key={s.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <div className="flex justify-between mb-4">
                <div><h3 className="text-lg font-bold text-white">{s.nombre}</h3><p className="text-slate-400 text-sm">{s.facturan} tractores • {formatPct(s.pct_ppto)}</p></div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{formatMoney(datosMes.ppto * s.pct_ppto, true)}</div>
                  <div className="text-emerald-400 text-sm">$/T: {formatMoney(s.tracto_mes, true)}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-700/30 rounded-lg"><div className="text-slate-400 text-xs">Meta Anual</div><div className="text-white font-bold">{formatMoney(s.ppto_anual, true)}</div></div>
                <div className="p-3 bg-slate-700/30 rounded-lg"><div className="text-slate-400 text-xs">$/Tracto/Semana</div><div className="text-white font-bold">{formatMoney(s.tracto_mes / 4, true)}</div></div>
                <div className="p-3 bg-slate-700/30 rounded-lg"><div className="text-slate-400 text-xs">$/Tracto/Día</div><div className="text-white font-bold">{formatMoney(s.tracto_mes / 30, true)}</div></div>
                <div className="p-3 bg-slate-700/30 rounded-lg"><div className="text-slate-400 text-xs">$/Tracto/Año</div><div className="text-white font-bold">{formatMoney(s.tracto_mes * 12, true)}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Semanas */}
      {vista === 'semanas' && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">52 Semanas 2026</h2>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Sem</th>
                    <th className="px-3 py-2 text-right text-xs text-slate-400">Meta Total</th>
                    <th className="px-3 py-2 text-right text-xs text-slate-400">SPEEDYHAUL</th>
                    <th className="px-3 py-2 text-right text-xs text-slate-400">TROB</th>
                    <th className="px-3 py-2 text-right text-xs text-slate-400">WEXPRESS</th>
                    <th className="px-3 py-2 text-right text-xs text-slate-400">Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {SEMANAS.slice(0, 52).map(s => (
                    <tr key={s.semana} className="hover:bg-slate-700/30">
                      <td className="px-3 py-2 text-orange-400 font-medium">{s.semana}</td>
                      <td className="px-3 py-2 text-right text-white font-bold">{formatMoney(s.meta_total, true)}</td>
                      <td className="px-3 py-2 text-right text-blue-300">{formatMoney(s.speedyhaul, true)}</td>
                      <td className="px-3 py-2 text-right text-purple-300">{formatMoney(s.trob, true)}</td>
                      <td className="px-3 py-2 text-right text-emerald-300">{formatMoney(s.wexpress, true)}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{formatMoney(s.acumulado, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Buscar */}
      {vista === 'buscar' && (
        <div className="p-6">
          <div className="max-w-xl mx-auto bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Buscar Tracto</h3>
            <input type="number" placeholder="Número de tracto" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
            <p className="text-slate-400 text-sm mt-4">Ingresa el número y presiona Enter para buscar</p>
          </div>
        </div>
      )}

      {/* Mover */}
      {vista === 'mover' && (
        <div className="p-6">
          <div className="max-w-xl mx-auto bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-amber-400" />Mover Tracto</h3>
            <div className="space-y-4">
              <input type="number" placeholder="Número de tracto" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
              <select className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
                <option value="">Segmento destino...</option>
                {SEGMENTOS.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <button className="w-full py-3 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-medium">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Simulador */}
      {vista === 'simulador' && (
        <div className="p-6">
          <div className="max-w-xl mx-auto bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calculator className="w-5 h-5 text-cyan-400" />Simulador +1/-1</h3>
            <div className="space-y-4">
              <select value={simSegmento} onChange={e => setSimSegmento(e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
                {SEGMENTOS.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <div className="flex gap-2">
                {[-3,-2,-1,0,1,2,3].map(n => (
                  <button key={n} onClick={() => setSimCambio(n)} className={`flex-1 py-2 rounded-lg font-medium ${simCambio === n ? (n < 0 ? 'bg-red-500' : n > 0 ? 'bg-green-500' : 'bg-slate-500') : 'bg-slate-700'} text-white`}>
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>
              {simulacion && (
                <div className="p-4 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div><div className="text-slate-400 text-xs">Tractores Actual</div><div className="text-white font-bold">{simulacion.actual}</div></div>
                    <div><div className="text-slate-400 text-xs">Tractores Nuevo</div><div className="text-white font-bold">{simulacion.nuevo}</div></div>
                    <div><div className="text-slate-400 text-xs">$/T/Mes Actual</div><div className="text-white font-bold">{formatMoney(simulacion.tractoActual)}</div></div>
                    <div><div className="text-slate-400 text-xs">$/T/Mes Nuevo</div><div className="text-white font-bold">{formatMoney(simulacion.tractoNuevo)}</div></div>
                  </div>
                  <div className={`text-center py-2 rounded-lg ${simulacion.diff > 0 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                    {simulacion.diff > 0 ? '+' : ''}{formatMoney(simulacion.diff)} por tracto
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
