import { useState, useEffect } from 'react';
import { Truck, ArrowLeft, AlertTriangle, CheckCircle, Download, X, Wrench, FileText, Zap, MapPin, Clock, Paperclip, Plus, Calendar, Navigation } from 'lucide-react';
import { GoogleMap, LoadScript, Marker, Circle, Polyline, InfoWindow } from '@react-google-maps/api';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_GPS = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY_GPS = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabaseGPS = createClient(SUPABASE_URL_GPS, SUPABASE_ANON_KEY_GPS);

interface CarrollModuleProps {
  onBack: () => void;
}

type EstadoUnidad = 'Lavado' | 'Origen' | 'Tránsito' | 'Destino';
type StatusEntrega = 'On Time' | 'Delayed' | 'Early';

interface Unidad {
  id: string;
  tracto: string;
  thermo: string;
  operador: string;
  destino: string;
  cliente: string;
  bodega: string;
  temp: number;
  estado: EstadoUnidad;
  tiempoRestante: number;
  status: StatusEntrega;
  progreso: number;
  minutosDetenido?: number;
  semaforoMant: 'verde' | 'amarillo' | 'rojo';
  semaforoRemolque?: 'verde' | 'amarillo' | 'rojo';
  kmActual: number;
  kmMant: number;
  horasThermo: number;
  horasMant: number;
  lat: number;
  lng: number;
  horasDelay?: number;
  citaFecha: string;
  citaHora: string;
  formatoVenta?: string;
  numeroViaje?: string;
  fechaMantoTracto?: string;
  fechaMantoRemolque?: string;
  diasMantRemolque?: number;
}

// 🚚 28 UNIDADES DEDICADAS GRANJAS CARROLL - DATOS REALES ACTUALIZADOS
const DATOS_ENTREGAS: Unidad[] = [
  { id: '1', tracto: '505', thermo: '1292', operador: 'RAUL BAUTISTA LOPEZ', destino: 'TIJUANA, BAJA CALIFORNIA', cliente: 'Cliente A', bodega: 'Bodega 1', temp: -18.3, estado: 'Tránsito', tiempoRestante: 420, status: 'Delayed', progreso: 38, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 936409, kmMant: 10000, horasThermo: 680, horasMant: 1000, lat: 32.5149, lng: -117.0382, horasDelay: 2.5, citaFecha: '2023-10-15', citaHora: '14:00', formatoVenta: 'Flete', numeroViaje: 'V001', fechaMantoTracto: '2025-11-20', fechaMantoRemolque: '2025-10-24', diasMantRemolque: 27 },
  { id: '2', tracto: '777', thermo: '1356', operador: 'LUIS ANGEL TAPIA RODRIGUEZ', destino: 'HERMOSILLO, SONORA', cliente: 'Cliente B', bodega: 'Bodega 2', temp: -18.3, estado: 'Lavado', tiempoRestante: 135, status: 'Early', progreso: 0, semaforoMant: 'verde', semaforoRemolque: 'rojo', kmActual: 491391, kmMant: 10000, horasThermo: 720, horasMant: 1000, lat: 19.0427, lng: -97.5922, citaFecha: '2023-10-16', citaHora: '15:00', formatoVenta: 'Flete', numeroViaje: 'V002', fechaMantoTracto: '2025-09-04', fechaMantoRemolque: '2025-07-07', diasMantRemolque: 136 },
  { id: '3', tracto: '893', thermo: '1406', operador: 'MARCELO SANCHEZ RODRIGUEZ', destino: 'AGUASCALIENTES, AGUASCALIENTES', cliente: 'Cliente C', bodega: 'Bodega 3', temp: -17.8, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 276880, kmMant: 10000, horasThermo: 890, horasMant: 1000, lat: 21.8853, lng: -102.2916, citaFecha: '2023-10-17', citaHora: '16:00', formatoVenta: 'Flete', numeroViaje: 'V003', fechaMantoTracto: '2025-10-08', fechaMantoRemolque: '2025-10-09', diasMantRemolque: 42 },
  { id: '4', tracto: '931', thermo: '1288', operador: 'MARCELO SANCHEZ RODRIGUEZ', destino: 'MONTERREY, NUEVO LEON', cliente: 'Cliente D', bodega: 'Bodega 4', temp: -18.9, estado: 'Destino', tiempoRestante: 0, status: 'On Time', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 929754, kmMant: 10000, horasThermo: 560, horasMant: 1000, lat: 25.6866, lng: -100.3161, citaFecha: '2023-10-18', citaHora: '17:00', formatoVenta: 'Flete', numeroViaje: 'V004', fechaMantoTracto: '2025-09-29', fechaMantoRemolque: '2025-08-18', diasMantRemolque: 94 },
  { id: '5', tracto: '937', thermo: '1348', operador: 'VICTOR ISLAS ORIA', destino: 'TUXTLA GUTIERREZ, CHIAPAS', cliente: 'Cliente E', bodega: 'Bodega 5', temp: -19.4, estado: 'Origen', tiempoRestante: 960, status: 'Early', progreso: 4, minutosDetenido: 57, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 124800, kmMant: 10000, horasThermo: 420, horasMant: 1000, lat: 19.0427, lng: -97.5922, citaFecha: '2023-10-19', citaHora: '18:00', formatoVenta: 'Flete', numeroViaje: 'V005', fechaMantoTracto: '2025-09-18', fechaMantoRemolque: '2025-08-21', diasMantRemolque: 91 },
  { id: '6', tracto: '891', thermo: '1350', operador: 'FEDERICO CLEMENTE QUINTERO', destino: 'CIUDAD DE MEXICO, CD DE MEXICO', cliente: 'Cliente F', bodega: 'Bodega 6', temp: 3.7, estado: 'Origen', tiempoRestante: 60, status: 'Early', progreso: 8, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 246977, kmMant: 10000, horasThermo: 910, horasMant: 1000, lat: 19.0427, lng: -97.5922, citaFecha: '2023-10-20', citaHora: '19:00', formatoVenta: 'Flete', numeroViaje: 'V006', fechaMantoTracto: '2025-08-28', fechaMantoRemolque: '2025-08-08', diasMantRemolque: 104 },
  { id: '7', tracto: '801', thermo: '1378', operador: 'FERNANDO GUZMAN SERVN', destino: 'QUERETARO, QUERETARO', cliente: 'Cliente G', bodega: 'Bodega 7', temp: -17.8, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 802126, kmMant: 10000, horasThermo: 920, horasMant: 1000, lat: 20.5888, lng: -100.3899, citaFecha: '2023-10-21', citaHora: '20:00', formatoVenta: 'Flete', numeroViaje: 'V007', fechaMantoTracto: '2025-10-31', fechaMantoRemolque: '2025-11-19', diasMantRemolque: 1 },
  { id: '8', tracto: '905', thermo: '1260', operador: 'JUAN ALAN DIAZ MARTINEZ', destino: 'LEON, GUANAJUATO', cliente: 'Cliente H', bodega: 'Bodega 8', temp: -6.0, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'rojo', semaforoRemolque: 'verde', kmActual: 936408, kmMant: 10000, horasThermo: 880, horasMant: 1000, lat: 21.1227, lng: -101.6827, citaFecha: '2023-10-22', citaHora: '21:00', formatoVenta: 'Flete', numeroViaje: 'V008', fechaMantoTracto: '2025-08-30', fechaMantoRemolque: '2025-09-19', diasMantRemolque: 62 },
  { id: '9', tracto: '911', thermo: '1256', operador: 'ENRIQUE URBAN FLORES', destino: 'CANCUN, QUINTANA ROO', cliente: 'Cliente I', bodega: 'Bodega 9', temp: 3.6, estado: 'Tránsito', tiempoRestante: 180, status: 'On Time', progreso: 65, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 175998, kmMant: 10000, horasThermo: 740, horasMant: 1000, lat: 21.1619, lng: -86.8515, citaFecha: '2023-10-23', citaHora: '22:00', formatoVenta: 'Flete', numeroViaje: 'V009', fechaMantoTracto: '2025-09-12', fechaMantoRemolque: '2025-08-20', diasMantRemolque: 92 },
  { id: '10', tracto: '841', thermo: '1262', operador: 'RENE ALONSO VAZQUEZ CRUZ', destino: 'MERIDA, YUCATAN', cliente: 'Cliente J', bodega: 'Bodega 10', temp: 3.1, estado: 'Tránsito', tiempoRestante: 90, status: 'Early', progreso: 72, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 238717, kmMant: 10000, horasThermo: 980, horasMant: 1000, lat: 20.9674, lng: -89.5926, citaFecha: '2023-10-24', citaHora: '23:00', formatoVenta: 'Flete', numeroViaje: 'V010', fechaMantoTracto: '2025-10-15', fechaMantoRemolque: '2025-08-02', diasMantRemolque: 110 },
  { id: '11', tracto: '863', thermo: '4113', operador: 'OCTAVIO VILLELA TRENADO', destino: 'GUADALAJARA, JALISCO', cliente: 'Cliente K', bodega: 'Bodega 11', temp: 4.1, estado: 'Tránsito', tiempoRestante: 240, status: 'On Time', progreso: 45, semaforoMant: 'verde', semaforoRemolque: 'rojo', kmActual: 371606, kmMant: 10000, horasThermo: 410, horasMant: 1000, lat: 20.6597, lng: -103.3496, citaFecha: '2023-10-25', citaHora: '00:00', formatoVenta: 'Flete', numeroViaje: 'V011', fechaMantoTracto: '2025-08-02', fechaMantoRemolque: '2025-07-17', diasMantRemolque: 126 },
  { id: '12', tracto: '861', thermo: '1208', operador: 'JUAN FRANCISCO LEOS FRAGOSO', destino: 'OAXACA, OAXACA', cliente: 'Cliente L', bodega: 'Bodega 12', temp: -18.1, estado: 'Tránsito', tiempoRestante: 195, status: 'Early', progreso: 58, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 354969, kmMant: 10000, horasThermo: 900, horasMant: 1000, lat: 17.0732, lng: -96.7266, citaFecha: '2023-10-26', citaHora: '01:00', formatoVenta: 'Flete', numeroViaje: 'V012', fechaMantoTracto: '2025-11-13', fechaMantoRemolque: '2025-10-07', diasMantRemolque: 44 },
  { id: '13', tracto: '817', thermo: '1278', operador: 'JUAN RAMIREZ MONTES', destino: 'VERACRUZ, VERACRUZ', cliente: 'Cliente M', bodega: 'Bodega 13', temp: -17.9, estado: 'Tránsito', tiempoRestante: 165, status: 'On Time', progreso: 62, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 417234, kmMant: 10000, horasThermo: 590, horasMant: 1000, lat: 19.1738, lng: -96.1342, citaFecha: '2023-10-27', citaHora: '02:00', formatoVenta: 'Flete', numeroViaje: 'V013', fechaMantoTracto: '2025-08-30', fechaMantoRemolque: '2025-09-05', diasMantRemolque: 76 },
  { id: '14', tracto: '899', thermo: '1332', operador: 'JULIO ENRIQUE ARELLANO PEREZ', destino: 'PUEBLA, PUEBLA', cliente: 'Cliente N', bodega: 'Bodega 14', temp: -18.5, estado: 'Tránsito', tiempoRestante: 120, status: 'On Time', progreso: 55, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 228885, kmMant: 10000, horasThermo: 600, horasMant: 1000, lat: 19.0414, lng: -98.2063, citaFecha: '2023-10-28', citaHora: '10:00', formatoVenta: 'Flete', numeroViaje: 'V014', fechaMantoTracto: '2025-10-18', fechaMantoRemolque: '2025-10-20', diasMantRemolque: 31 },
  { id: '15', tracto: '745', thermo: '1254', operador: 'CARLOS SERGIO FLORES VERGES', destino: 'GUADALAJARA, JALISCO', cliente: 'Cliente O', bodega: 'Bodega 15', temp: -19.2, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'rojo', semaforoRemolque: 'verde', kmActual: 995790, kmMant: 10000, horasThermo: 850, horasMant: 1000, lat: 20.6597, lng: -103.3496, citaFecha: '2023-10-29', citaHora: '11:00', formatoVenta: 'Flete', numeroViaje: 'V015', fechaMantoTracto: '2025-11-20', fechaMantoRemolque: '2025-09-17', diasMantRemolque: 64 },
  { id: '16', tracto: '799', thermo: '1322', operador: 'RUBEN CALDERON JASSO', destino: 'MONTERREY, NUEVO LEON', cliente: 'Cliente P', bodega: 'Bodega 16', temp: -17.5, estado: 'Tránsito', tiempoRestante: 240, status: 'On Time', progreso: 45, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 870714, kmMant: 10000, horasThermo: 710, horasMant: 1000, lat: 25.6866, lng: -100.3161, citaFecha: '2023-10-30', citaHora: '12:00', formatoVenta: 'Flete', numeroViaje: 'V016', fechaMantoTracto: '2025-10-22', fechaMantoRemolque: '2025-10-22', diasMantRemolque: 29 },
  { id: '17', tracto: '837', thermo: '1296', operador: 'JOSE ALBERTO MORANCHEL VILLANUEVA', destino: 'CANCUN, QUINTANA ROO', cliente: 'Cliente Q', bodega: 'Bodega 17', temp: -18.8, estado: 'Tránsito', tiempoRestante: 180, status: 'Early', progreso: 60, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 289359, kmMant: 10000, horasThermo: 620, horasMant: 1000, lat: 21.1619, lng: -86.8515, citaFecha: '2023-10-31', citaHora: '13:00', formatoVenta: 'Flete', numeroViaje: 'V017', fechaMantoTracto: '2025-10-22', fechaMantoRemolque: '2025-08-14', diasMantRemolque: 98 },
  { id: '18', tracto: '933', thermo: '1328', operador: 'JUAN MANUEL OJEDA VELAZQUEZ', destino: 'VERACRUZ, VERACRUZ', cliente: 'Cliente R', bodega: 'Bodega 18', temp: -17.0, estado: 'Tránsito', tiempoRestante: 150, status: 'On Time', progreso: 62, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 162940, kmMant: 10000, horasThermo: 520, horasMant: 1000, lat: 19.1738, lng: -96.1342, citaFecha: '2023-11-01', citaHora: '14:00', formatoVenta: 'Flete', numeroViaje: 'V018', fechaMantoTracto: '2025-11-17', fechaMantoRemolque: '2025-10-10', diasMantRemolque: 41 },
  { id: '19', tracto: '212', thermo: '838843', operador: 'CHRISTIAN OJEDA VELAZQUEZ', destino: 'MERIDA, YUCATAN', cliente: 'Cliente S', bodega: 'Bodega 19', temp: -18.2, estado: 'Tránsito', tiempoRestante: 200, status: 'Delayed', progreso: 50, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 38529, kmMant: 10000, horasThermo: 450, horasMant: 1000, lat: 20.9674, lng: -89.5926, citaFecha: '2023-11-02', citaHora: '15:00', formatoVenta: 'Flete', numeroViaje: 'V019', horasDelay: 1.5, fechaMantoTracto: '2025-10-23', fechaMantoRemolque: '2025-11-10', diasMantRemolque: 10 },
  { id: '20', tracto: '765', thermo: '838855', operador: 'HECTOR CHRISTIAN JAIME LEON', destino: 'TIJUANA, BAJA CALIFORNIA', cliente: 'Cliente T', bodega: 'Bodega 20', temp: -19.5, estado: 'Tránsito', tiempoRestante: 480, status: 'On Time', progreso: 25, semaforoMant: 'rojo', semaforoRemolque: 'amarillo', kmActual: 1081287, kmMant: 10000, horasThermo: 900, horasMant: 1000, lat: 32.5149, lng: -117.0382, citaFecha: '2023-11-03', citaHora: '16:00', formatoVenta: 'Flete', numeroViaje: 'V020', fechaMantoTracto: '2025-11-10', fechaMantoRemolque: '2025-08-08', diasMantRemolque: 104 },
  { id: '21', tracto: '208', thermo: '1282', operador: 'MARCO ANTONIO GARCIA RAMIREZ', destino: 'HERMOSILLO, SONORA', cliente: 'Cliente U', bodega: 'Bodega 21', temp: -18.0, estado: 'Tránsito', tiempoRestante: 300, status: 'Early', progreso: 40, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 129159, kmMant: 10000, horasThermo: 550, horasMant: 1000, lat: 29.0729, lng: -110.9559, citaFecha: '2023-11-04', citaHora: '17:00', formatoVenta: 'Flete', numeroViaje: 'V021', fechaMantoTracto: '2025-11-18', fechaMantoRemolque: '2025-09-05', diasMantRemolque: 76 },
  { id: '22', tracto: '813', thermo: '1360', operador: 'EDGAR IVAN HERNANDEZ', destino: 'QUERETARO, QUERETARO', cliente: 'Cliente V', bodega: 'Bodega 22', temp: -17.3, estado: 'Destino', tiempoRestante: 0, status: 'On Time', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 363662, kmMant: 10000, horasThermo: 670, horasMant: 1000, lat: 20.5888, lng: -100.3899, citaFecha: '2023-11-05', citaHora: '18:00', formatoVenta: 'Flete', numeroViaje: 'V022', fechaMantoTracto: '2025-10-27', fechaMantoRemolque: '2025-10-02', diasMantRemolque: 49 },
  { id: '23', tracto: '126', thermo: '838656', operador: 'ALEJANDRO VILLANUEVA ESPINOZA', destino: 'LEON, GUANAJUATO', cliente: 'Cliente W', bodega: 'Bodega 23', temp: -19.0, estado: 'Tránsito', tiempoRestante: 210, status: 'Delayed', progreso: 48, semaforoMant: 'rojo', semaforoRemolque: 'rojo', kmActual: 1362370, kmMant: 10000, horasThermo: 820, horasMant: 1000, lat: 21.1227, lng: -101.6827, citaFecha: '2023-11-06', citaHora: '19:00', formatoVenta: 'Flete', numeroViaje: 'V023', horasDelay: 2.0, fechaMantoTracto: '2025-08-24', fechaMantoRemolque: '2025-05-08', diasMantRemolque: 196 },
  { id: '24', tracto: '809', thermo: '28654', operador: 'RUMUALDO BAUTISTA GOMEZ', destino: 'AGUASCALIENTES, AGUASCALIENTES', cliente: 'Cliente X', bodega: 'Bodega 24', temp: -18.7, estado: 'Tránsito', tiempoRestante: 170, status: 'On Time', progreso: 58, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 429433, kmMant: 10000, horasThermo: 690, horasMant: 1000, lat: 21.8853, lng: -102.2916, citaFecha: '2023-11-07', citaHora: '20:00', formatoVenta: 'Flete', numeroViaje: 'V024', fechaMantoTracto: '2025-10-15', fechaMantoRemolque: '2025-08-02', diasMantRemolque: 110 },
  { id: '25', tracto: '859', thermo: '1414', operador: 'HECTOR ADRIAN LOPEZ MEDINA', destino: 'GUADALAJARA, JALISCO', cliente: 'Cliente Y', bodega: 'Bodega 25', temp: -17.8, estado: 'Tránsito', tiempoRestante: 190, status: 'Early', progreso: 52, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 196719, kmMant: 10000, horasThermo: 580, horasMant: 1000, lat: 20.6597, lng: -103.3496, citaFecha: '2023-11-08', citaHora: '21:00', formatoVenta: 'Flete', numeroViaje: 'V025', fechaMantoTracto: '2025-09-17', fechaMantoRemolque: '2025-10-04', diasMantRemolque: 47 },
  { id: '26', tracto: '178', thermo: '1376', operador: 'CRISTIAN CORTEZ PORTILLO', destino: 'PUEBLA, PUEBLA', cliente: 'Cliente Z', bodega: 'Bodega 26', temp: -18.4, estado: 'Tránsito', tiempoRestante: 140, status: 'On Time', progreso: 65, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 426784, kmMant: 10000, horasThermo: 640, horasMant: 1000, lat: 19.0414, lng: -98.2063, citaFecha: '2023-11-09', citaHora: '22:00', formatoVenta: 'Flete', numeroViaje: 'V026', fechaMantoTracto: '2025-09-21', fechaMantoRemolque: '2025-08-26', diasMantRemolque: 86 },
  { id: '27', tracto: '731', thermo: '1398', operador: 'MARIO LARA TIBURCIO', destino: 'MONTERREY, NUEVO LEON', cliente: 'Cliente AA', bodega: 'Bodega 27', temp: -17.2, estado: 'Tránsito', tiempoRestante: 250, status: 'On Time', progreso: 42, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 889384, kmMant: 10000, horasThermo: 750, horasMant: 1000, lat: 25.6866, lng: -100.3161, citaFecha: '2023-11-10', citaHora: '23:00', formatoVenta: 'Flete', numeroViaje: 'V027', fechaMantoTracto: '2025-06-19', fechaMantoRemolque: '2025-09-13', diasMantRemolque: 68 },
  { id: '28', tracto: '847', thermo: '1396', operador: 'VICTOR FRANCO MONTAÑO', destino: 'VERACRUZ, VERACRUZ', cliente: 'Cliente AB', bodega: 'Bodega 28', temp: -18.6, estado: 'Tránsito', tiempoRestante: 160, status: 'Early', progreso: 60, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 498572, kmMant: 10000, horasThermo: 610, horasMant: 1000, lat: 19.1738, lng: -96.1342, citaFecha: '2023-11-11', citaHora: '08:00', formatoVenta: 'Flete', numeroViaje: 'V028', fechaMantoTracto: '2025-11-10', fechaMantoRemolque: '2025-08-28', diasMantRemolque: 84 },
];

const DATOS_REGRESOS: Unidad[] = [];

const formatearTiempo = (minutos: number): { texto: string; color: string; urgente: boolean } => {
  if (minutos === 0) return { texto: 'Entregado', color: '#059669', urgente: false };
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  let texto = horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
  let color = minutos < 60 ? '#DC2626' : minutos < 120 ? '#F59E0B' : '#059669';
  return { texto, color, urgente: minutos < 60 };
};

// Interfaz para ubicaciones GPS de Supabase
interface GPSLocation {
  placa: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  address: string;
  status?: string;
}

export const DedicadosModule = ({ onBack }: CarrollModuleProps) => {
  const [vistaActiva, setVistaActiva] = useState<'entregas' | 'regresos'>('entregas');
  const [gpsData, setGpsData] = useState<Map<string, any>>(new Map());
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    const cargarGPS = async () => {
      try {
        const { data } = await supabaseGPS.from('gps_tracking').select('economico, latitude, longitude, speed, timestamp_gps, address, status').eq('segmento', 'CARROLL');
        const map = new Map<string, any>();
        if (data) data.forEach((r: any) => map.set(r.economico, r));
        setGpsData(map);
      } catch (e) { console.error('GPS error:', e); }
      setGpsLoading(false);
    };
    cargarGPS();
    const channel = supabaseGPS.channel('carroll_gps_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'gps_tracking', filter: 'segmento=eq.CARROLL' }, () => cargarGPS()).subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const getUbicacionGPS = (tracto: string): string => {
    const gps = gpsData.get(tracto);
    if (!gps) return gpsLoading ? 'Cargando...' : getUbicacionGPS(unidad.tracto);
    if (gps.address && gps.address !== '-') return gps.address;
    if (gps.latitude && gps.longitude) return gps.latitude.toFixed(4) + ', ' + gps.longitude.toFixed(4);
    return getUbicacionGPS(unidad.tracto);
  };
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'ontime' | 'delayed' | 'early'>('all');
  const [operadorModal, setOperadorModal] = useState<string | null>(null);
  const [mantModal, setMantModal] = useState<Unidad | null>(null);
  const [mapaVisible, setMapaVisible] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [panelCaptura, setPanelCaptura] = useState(false);
  const [gpsLocations, setGpsLocations] = useState<Record<string, GPSLocation>>({});
  const [loadingGPS, setLoadingGPS] = useState(false);

  const datos = vistaActiva === 'entregas' ? DATOS_ENTREGAS : DATOS_REGRESOS;
  const datosFiltrados = filtroStatus === 'all' ? datos : 
    datos.filter(u => 
      filtroStatus === 'ontime' ? u.status === 'On Time' :
      filtroStatus === 'delayed' ? u.status === 'Delayed' :
      u.status === 'Early'
    );

  const alertasTemp = [...DATOS_ENTREGAS, ...DATOS_REGRESOS].filter(u => Math.abs(u.temp) > 20 || (u.temp > 5 && u.temp < 15)).length;
  const evidenciasPend = DATOS_ENTREGAS.filter(u => u.estado === 'Destino').length;

  // ✅ FUNCIÓN GPS - LEE DE SUPABASE gps_tracking (segmento=CARROLL)
  const obtenerUbicacionesGPS = async () => {
    setLoadingGPS(true);
    console.log('🛰️ [GPS] Obteniendo ubicaciones desde Supabase gps_tracking (CARROLL)...');
    
    try {
      // Leer TODAS las unidades de CARROLL desde gps_tracking
      const response = await fetch(
        `https://${projectId}.supabase.co/rest/v1/gps_tracking?segmento=eq.CARROLL&select=economico,latitude,longitude,speed,address,timestamp_gps,status`,
        {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      const data = await response.json();
      console.log(`🛰️ [GPS] Supabase response (${Array.isArray(data) ? data.length : 0} unidades CARROLL):`, data);
      
      if (Array.isArray(data)) {
        const locations: Record<string, GPSLocation> = {};
        
        data.forEach((row: any) => {
          if (row.economico) {
            locations[row.economico] = {
              placa: row.economico,
              latitude: row.latitude || 0,
              longitude: row.longitude || 0,
              speed: row.speed || 0,
              timestamp: row.timestamp_gps || '',
              address: row.address || '',
              status: row.status || ''
            };
            if (row.address) {
              console.log(`✅ [GPS] ${row.economico}: ${row.address}`);
            }
          }
        });
        
        setGpsLocations(locations);
        console.log(`✅ [GPS] Total ubicaciones CARROLL cargadas: ${Object.keys(locations).length}`);
      }
    } catch (error) {
      console.error('❌ [GPS] Error:', error);
    } finally {
      setLoadingGPS(false);
    }
  };

  // Auto-actualizar ubicaciones GPS cada 30 segundos
  useEffect(() => {
    obtenerUbicacionesGPS(); // Cargar al montar
    
    const interval = setInterval(() => {
      obtenerUbicacionesGPS();
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* MODAL MAPA - TODOS LOS 30 CAMIONES */}
      {mapaVisible && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-8" onClick={() => setMapaVisible(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900 }}>
                    SISTEMA ONLINE
                  </span>
                </div>
                <div className="h-6 w-px bg-white/30 mx-2"></div>
                <span className="text-blue-100" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Carroll • 30 Unidades Activas
                </span>
              </div>
              <button onClick={() => setMapaVisible(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="relative bg-gradient-to-br from-slate-100 to-blue-50" style={{ height: '700px' }}>
              {/* GOOGLE MAPS REAL CON 30 CAMIONES */}
              <LoadScript googleMapsApiKey="AIzaSyAU-FikrmxUVTIDKqz2Ez-aXd0-d7V-DtY">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: 19.0427, lng: -97.5922 }}
                  zoom={6}
                  options={{
                    styles: [
                      {
                        featureType: "poi",
                        stylers: [{ visibility: "off" }]
                      }
                    ],
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                  }}
                >
                  {/* GEOCERCA ORIENTAL - 500m */}
                  <Circle
                    center={{ lat: 19.0427, lng: -97.5922 }}
                    radius={500}
                    options={{
                      fillColor: "#F59E0B",
                      fillOpacity: 0.2,
                      strokeColor: "#F59E0B",
                      strokeOpacity: 0.8,
                      strokeWeight: 3,
                      strokePosition: 0
                    }}
                  />

                  {/* MARCADORES ENTREGAS - 15 camiones */}
                  {DATOS_ENTREGAS.map((u) => {
                    const color = u.estado === 'Lavado' ? '#3B82F6' : 
                                  u.estado === 'Origen' ? '#F97316' : 
                                  u.estado === 'Tránsito' ? '#4F46E5' : 
                                  u.estado === 'Destino' ? '#10B981' : '#64748B';
                    
                    return (
                      <Marker
                        key={u.id}
                        position={{ lat: u.lat, lng: u.lng }}
                        label={{
                          text: u.tracto,
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        icon={{
                          path: 0,
                          fillColor: color,
                          fillOpacity: 1,
                          strokeColor: 'white',
                          strokeWeight: 3,
                          scale: 18
                        }}
                        onClick={() => setSelectedMarker(u.id)}
                      >
                        {selectedMarker === u.id && (
                          <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                            <div style={{ padding: '8px', minWidth: '200px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                                🚛 Tracto {u.tracto}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                                Thermo: {u.thermo}
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                                {u.operador}
                              </div>
                              <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                                <strong>Destino:</strong> {u.destino}
                              </div>
                              <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                                <strong>Temp:</strong> <span style={{ color: Math.abs(u.temp) > 20 ? '#DC2626' : '#059669', fontWeight: 700 }}>{u.temp.toFixed(1)}°C</span>
                              </div>
                              <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                                <strong>Estado:</strong> {u.estado}
                              </div>
                              <div style={{ fontSize: '11px' }}>
                                <strong>Progreso:</strong> {u.progreso}%
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </Marker>
                    );
                  })}

                  {/* MARCADORES REGRESOS - 15 camiones */}
                  {DATOS_REGRESOS.map((u) => (
                    <Marker
                      key={u.id}
                      position={{ lat: u.lat, lng: u.lng }}
                      label={{
                        text: u.tracto,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      icon={{
                        path: 0,
                        fillColor: '#9333EA',
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 3,
                        scale: 18
                      }}
                      onClick={() => setSelectedMarker(u.id)}
                    >
                      {selectedMarker === u.id && (
                        <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                          <div style={{ padding: '8px', minWidth: '200px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                              🚛 Tracto {u.tracto}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                              Thermo: {u.thermo}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                              {u.operador}
                            </div>
                            <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                              <strong>Destino:</strong> Oriental (Regreso)
                            </div>
                            <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                              <strong>Temp:</strong> <span style={{ color: '#64748B', fontWeight: 700 }}>{u.temp.toFixed(1)}°C</span>
                            </div>
                            <div style={{ fontSize: '11px' }}>
                              <strong>Progreso:</strong> {u.progreso}%
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  ))}

                  {/* LÍNEAS DE RUTA PARA CAMIONES EN TRÁNSITO */}
                  {DATOS_ENTREGAS.filter(u => u.estado === 'Tránsito').map(u => (
                    <Polyline
                      key={`line-${u.id}`}
                      path={[
                        { lat: 19.0427, lng: -97.5922 }, // Oriental
                        { lat: u.lat, lng: u.lng } // Posición actual
                      ]}
                      options={{
                        strokeColor: '#2563EB',
                        strokeOpacity: 0.6,
                        strokeWeight: 3,
                        geodesic: true,
                        icons: [{
                          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                          offset: '0',
                          repeat: '20px'
                        }]
                      }}
                    />
                  ))}

                  {/* LÍNEAS DE REGRESO */}
                  {DATOS_REGRESOS.map(u => (
                    <Polyline
                      key={`line-${u.id}`}
                      path={[
                        { lat: u.lat, lng: u.lng }, // Posición actual
                        { lat: 19.0427, lng: -97.5922 } // Oriental
                      ]}
                      options={{
                        strokeColor: '#9333EA',
                        strokeOpacity: 0.6,
                        strokeWeight: 3,
                        geodesic: true,
                        icons: [{
                          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                          offset: '0',
                          repeat: '20px'
                        }]
                      }}
                    />
                  ))}
                </GoogleMap>
              </LoadScript>
              
              {/* LEYENDA - GEN Z COOL */}
              <div className="absolute bottom-8 left-8 bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 shadow-2xl border-2 border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <div className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>FLEET STATUS LIVE</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-300 shadow-lg shadow-blue-500/50"></div>
                    <span className="text-white" style={{ fontSize: '11px', fontWeight: 600 }}>Lavado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-orange-300 shadow-lg shadow-orange-500/50"></div>
                    <span className="text-white" style={{ fontSize: '11px', fontWeight: 600 }}>Origen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-500/50"></div>
                    <span className="text-white" style={{ fontSize: '11px', fontWeight: 600 }}>Tránsito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 border-2 border-emerald-400 shadow-lg shadow-emerald-500/50"></div>
                    <span className="text-white" style={{ fontSize: '11px', fontWeight: 600 }}>Destino</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-600 border-2 border-purple-400 shadow-lg shadow-purple-500/50"></div>
                    <span className="text-white" style={{ fontSize: '11px', fontWeight: 600 }}>Regresando</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LICENCIA */}
      {operadorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOperadorModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>LICENCIA FEDERAL</h3>
              <button onClick={() => setOperadorModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="text-slate-700 mb-3" style={{ fontSize: '13px', fontWeight: 700 }}>{operadorModal}</div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg h-40 flex items-center justify-center text-white mb-3" style={{ fontSize: '13px', fontWeight: 700 }}>
              LICENCIA FEDERAL TIPO A
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-slate-500" style={{ fontSize: '11px' }}>No. Licencia</div><div style={{ fontWeight: 600 }}>FED-{Math.floor(Math.random() * 999999)}</div></div>
              <div><div className="text-slate-500" style={{ fontSize: '11px' }}>Vigencia</div><div className="text-emerald-600" style={{ fontWeight: 600 }}>31/12/2025</div></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAPTURA VIAJE */}
      {panelCaptura && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8" onClick={() => setPanelCaptura(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900 }}>
                <Plus className="w-6 h-6 text-blue-600" />CAPTURAR NUEVO VIAJE
              </h3>
              <button onClick={() => setPanelCaptura(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* NÚMERO DE VIAJE */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Número de Viaje</label>
                <input type="text" placeholder="V027" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* FORMATO DE VENTA */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Formato de Venta</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }}>
                  <option>Flete</option>
                  <option>Dedicado</option>
                  <option>Full</option>
                </select>
              </div>

              {/* TRACTO */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Tracto</label>
                <input type="text" placeholder="505" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* THERMO */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Thermo</label>
                <input type="text" placeholder="1292" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* OPERADOR */}
              <div className="col-span-2">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Operador</label>
                <input type="text" placeholder="Nombre completo del operador" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* DESTINO */}
              <div className="col-span-2">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Destino</label>
                <input type="text" placeholder="Ciudad, Estado" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* CLIENTE */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Cliente</label>
                <input type="text" placeholder="Nombre del cliente" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* BODEGA */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Bodega</label>
                <input type="text" placeholder="Bodega 1" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* FECHA CITA */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Fecha de Cita</label>
                <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* HORA CITA */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Hora de Cita</label>
                <input type="time" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* TIEMPO DE TRÁNSITO (HORAS) */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Tiempo de Tránsito (hrs)</label>
                <input type="number" placeholder="24" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* TEMPERATURA OBJETIVO */}
              <div className="col-span-1">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Temp. Objetivo (°C)</label>
                <input type="number" step="0.1" placeholder="-18.0" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* KILOMETRAJE ESTIMADO */}
              <div className="col-span-2">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Kilometraje Estimado</label>
                <input type="number" placeholder="1200" className="w-full px-3 py-2 border border-slate-300 rounded-lg" style={{ fontSize: '13px' }} />
              </div>

              {/* OBSERVACIONES */}
              <div className="col-span-2">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Observaciones</label>
                <textarea placeholder="Notas adicionales..." className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none" rows={3} style={{ fontSize: '13px' }}></textarea>
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPanelCaptura(false)} className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors" style={{ fontSize: '13px', fontWeight: 700 }}>
                Cancelar
              </button>
              <button onClick={() => {
                alert('Viaje capturado exitosamente!');
                setPanelCaptura(false);
              }} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" style={{ fontSize: '13px', fontWeight: 700 }}>
                Guardar Viaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANTENIMIENTO */}
      {mantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setMantModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                <Wrench className="w-5 h-5 text-orange-600" />MANTENIMIENTO
              </h3>
              <button onClick={() => setMantModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              {/* TRACTO */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div className="text-slate-900" style={{ fontSize: '15px', fontWeight: 700 }}>Tracto #{mantModal.tracto}</div>
                </div>
                <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
                  <span className="text-slate-600">Kilometraje actual</span>
                  <span className="text-slate-900" style={{ fontWeight: 700 }}>{mantModal.kmActual.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
                  <span className="text-slate-600">Próximo servicio</span>
                  <span className="text-slate-900" style={{ fontWeight: 700 }}>28,000 km</span>
                </div>
                <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
                  <span className="text-slate-600">Faltan</span>
                  <span className="text-blue-600" style={{ fontWeight: 900 }}>{(28000 - mantModal.kmActual).toLocaleString()} km</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                  <div className={`h-3 rounded-full transition-all ${(mantModal.kmActual / 28000) >= 0.95 ? 'bg-red-600' : (mantModal.kmActual / 28000) >= 0.85 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${(mantModal.kmActual / 28000) * 100}%` }} />
                </div>
                <div className="text-center mt-2" style={{ fontSize: '11px', color: (mantModal.kmActual / 28000) >= 0.95 ? '#DC2626' : (mantModal.kmActual / 28000) >= 0.85 ? '#F59E0B' : '#059669', fontWeight: 700 }}>
                  {Math.floor((mantModal.kmActual / 28000) * 100)}% completado
                </div>
              </div>

              {/* THERMO */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                  <div className="text-slate-900" style={{ fontSize: '15px', fontWeight: 700 }}>Thermo #{mantModal.thermo}</div>
                </div>
                <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
                  <span className="text-slate-600">Horas de uso</span>
                  <span className="text-slate-900" style={{ fontWeight: 700 }}>{mantModal.horasThermo} hrs</span>
                </div>
                <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
                  <span className="text-slate-600">Servicio programado</span>
                  <span className="text-slate-900" style={{ fontWeight: 700 }}>Cada 4 meses</span>
                </div>
                <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
                  <span className="text-slate-600">Faltan</span>
                  <span className="text-blue-600" style={{ fontWeight: 900 }}>{Math.floor((mantModal.horasMant - mantModal.horasThermo) / 24)} días aprox.</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 mt-3">
                  <div className={`h-3 rounded-full transition-all ${(mantModal.horasThermo / mantModal.horasMant) >= 0.95 ? 'bg-red-600' : (mantModal.horasThermo / mantModal.horasMant) >= 0.85 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${(mantModal.horasThermo / mantModal.horasMant) * 100}%` }} />
                </div>
                <div className="text-center mt-2" style={{ fontSize: '11px', color: (mantModal.horasThermo / mantModal.horasMant) >= 0.95 ? '#DC2626' : (mantModal.horasThermo / mantModal.horasMant) >= 0.85 ? '#F59E0B' : '#059669', fontWeight: 700 }}>
                  {Math.floor((mantModal.horasThermo / mantModal.horasMant) * 100)}% completado
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 900, lineHeight: '1' }}>CARROLL</h1>
                <p className="text-slate-500" style={{ fontSize: '11px' }}>Granjas Carroll • Oriental, Puebla</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-emerald-600" style={{ fontSize: '24px', fontWeight: 900 }}>{DATOS_ENTREGAS.length}</div>
              <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 700 }}>ENTREGAS</div>
            </div>
            <div className="text-center">
              <div className="text-purple-600" style={{ fontSize: '24px', fontWeight: 900 }}>{DATOS_REGRESOS.length}</div>
              <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 700 }}>REGRESOS</div>
            </div>
            <div className="text-center">
              <div className="text-red-600" style={{ fontSize: '24px', fontWeight: 900 }}>{alertasTemp}</div>
              <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 700 }}>ALERTAS</div>
            </div>
            <div className="text-center">
              <div className="text-amber-600" style={{ fontSize: '24px', fontWeight: 900 }}>{evidenciasPend}</div>
              <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 700 }}>EVIDENCIAS</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600" style={{ fontSize: '24px', fontWeight: 900 }}>26</div>
              <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 700 }}>FLOTA</div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-3 flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setVistaActiva('entregas')} className={`px-3 py-1.5 rounded ${vistaActiva === 'entregas' ? 'bg-emerald-500 text-white' : 'text-slate-600'}`} style={{ fontSize: '12px', fontWeight: 700 }}>↑ Entregas</button>
            <button onClick={() => setVistaActiva('regresos')} className={`px-3 py-1.5 rounded ${vistaActiva === 'regresos' ? 'bg-purple-500 text-white' : 'text-slate-600'}`} style={{ fontSize: '12px', fontWeight: 700 }}>↓ Regresos</button>
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <div className="flex gap-1.5">
            <button onClick={() => setFiltroStatus('all')} className={`px-3 py-1 rounded ${filtroStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`} style={{ fontSize: '11px', fontWeight: 700 }}>Todos</button>
            <button onClick={() => setFiltroStatus('ontime')} className={`px-3 py-1 rounded flex items-center gap-1 ${filtroStatus === 'ontime' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'}`} style={{ fontSize: '11px', fontWeight: 700 }}><CheckCircle className="w-3 h-3" />On Time</button>
            <button onClick={() => setFiltroStatus('delayed')} className={`px-3 py-1 rounded flex items-center gap-1 ${filtroStatus === 'delayed' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700'}`} style={{ fontSize: '11px', fontWeight: 700 }}><AlertTriangle className="w-3 h-3" />Delayed</button>
            <button onClick={() => setFiltroStatus('early')} className={`px-3 py-1 rounded flex items-center gap-1 ${filtroStatus === 'early' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700'}`} style={{ fontSize: '11px', fontWeight: 700 }}><CheckCircle className="w-3 h-3" />Early</button>
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <button onClick={() => setMapaVisible(true)} className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 700 }}><MapPin className="w-3 h-3" />MAPA</button>
          <button 
            onClick={obtenerUbicacionesGPS} 
            disabled={loadingGPS}
            className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all" 
            style={{ fontSize: '11px', fontWeight: 700 }}
          >
            {loadingGPS ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ACTUALIZANDO...
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3" />
                GPS ({Object.keys(gpsLocations).length}/26)
              </>
            )}
          </button>
          <button onClick={() => setPanelCaptura(true)} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 700 }}><Plus className="w-3 h-3" />CAPTURAR VIAJE</button>
          <div className="ml-auto text-slate-600" style={{ fontSize: '12px', fontWeight: 600 }}>{datosFiltrados.length} unidades</div>
        </div>
      </div>

      {/* TABLA */}
      <div className="px-5 py-4">
        <div className="bg-white shadow border border-slate-200 rounded-lg overflow-hidden">
          <div className={`px-4 py-2 bg-gradient-to-r ${vistaActiva === 'entregas' ? 'from-emerald-50 to-white' : 'from-purple-50 to-white'}`}>
            <div className="flex items-center gap-2">
              <Truck className={`w-4 h-4 ${vistaActiva === 'entregas' ? 'text-emerald-600' : 'text-purple-600'}`} />
              <h2 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                {vistaActiva === 'entregas' ? 'ENTREGAS EN CURSO' : 'REGRESOS A PLANTA'}
              </h2>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>UNIDAD</th>
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>OPERADOR</th>
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>🛰️ UBICACIÓN GPS</th>
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>DESTINO / CLIENTE</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>ESTADO</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>TEMP</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>STATUS</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>ETA</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>% VIAJE</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>MANT</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>PROGRESO</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((u) => (
                <tr key={u.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 900 }}>{u.tracto}</div>
                        <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 600 }}>#{u.thermo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div>
                      <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 700 }}>{u.operador}</div>
                      <button
                        onClick={() => setOperadorModal(u.operador)}
                        className="text-blue-600 hover:underline"
                        style={{ fontSize: '10px', fontWeight: 600 }}
                      >
                        Ver licencia
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      {gpsLocations[u.tracto] ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <div className="text-slate-900" style={{ fontSize: '11px', fontWeight: 700 }}>
                            {gpsLocations[u.tracto].address || 'Ubicación disponible'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                          <div className="text-slate-500" style={{ fontSize: '11px' }}>Sin señal GPS</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <button 
            onClick={async () => {
              try {
                const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/wsdl`, {
                  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                });
                const data = await response.json();
                console.log('🔍 [WSDL] MÉTODOS DISPONIBLES:', data.metodos);
                console.log('🔍 [WSDL] Total:', data.totalMetodos);
                console.log('🔍 [WSDL] WSDL completo:', data.wsdlCompleto);
                (window as any).widetechWSDL = data;
                alert(`📋 MÉTODOS WIDETECH DISPONIBLES:\n\n${data.metodos.join('\n')}\n\n✅ Total: ${data.totalMetodos} métodos\n\nRevisa la consola (F12) para ver detalles.`);
              } catch (error) {
                console.error('❌ Error consultando WSDL:', error);
                alert('❌ Error consultando WSDL. Revisa la consola.');
              }
            }}
            className="px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700 flex items-center gap-1 transition-all" 
            style={{ fontSize: '11px', fontWeight: 700 }}
          >
            <FileText className="w-3 h-3" />
            VER WSDL
          </button>
          <button 
            onClick={async () => {
              try {
                setLoadingGPS(true);
                const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/mobile-list`, {
                  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                });
                const data = await response.json();
                console.log('📱 [MOBILE LIST] Lista completa:', data);
                console.log('📱 [MOBILE LIST] Total móviles:', data.total);
                console.log('📱 [MOBILE LIST] Móviles:', data.mobileList);
                (window as any).widetechMobileList = data;
                
                if (data.success && data.mobileList.length > 0) {
                  alert(`📱 MÓVILES REGISTRADOS EN WIDETECH:\n\nTotal: ${data.total} móviles\n\nRevisa la consola (F12) para ver la lista completa con nombres y placas.`);
                } else {
                  alert(`⚠️ No se encontraron móviles o el método no está disponible.\n\nRevisa la consola (F12) para más detalles.`);
                }
                setLoadingGPS(false);
              } catch (error) {
                console.error('❌ Error obteniendo lista de móviles:', error);
                alert('❌ Error obteniendo lista de móviles. Revisa la consola.');
                setLoadingGPS(false);
              }
            }}
            className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1 transition-all" 
            style={{ fontSize: '11px', fontWeight: 700 }}
          >
            <MapPin className="w-3 h-3" />
            VER MÓVILES
          </button>
          <button 
            onClick={async () => {
              try {
                setLoadingGPS(true);
                const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/megatest`, {
                  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
                });
                const data = await response.json();
                console.log('🔥 [MEGATEST] RESULTADOS:', data);
                console.log('🔥 [MEGATEST] Métodos exitosos:', data.exitosos);
                (window as any).widetechMegatest = data;
                
                if (data.success && data.exitosos && data.exitosos.length > 0) {
                  alert(`🔥 ¡MÉTODOS EXITOSOS ENCONTRADOS!\n\n${data.exitosos.length}/${data.totalMetodos} métodos devolvieron datos.\n\nRevisa la consola (F12) para ver qué métodos funcionaron.`);
                } else {
                  alert(`⚠️ Ningún método devolvió datos GPS.\n\nRevisa la consola (F12) para más detalles.`);
                }
                setLoadingGPS(false);
              } catch (error) {
                console.error('❌ Error en MEGATEST:', error);
                alert('❌ Error en MEGATEST. Revisa la consola.');
                setLoadingGPS(false);
              }
            }}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 transition-all" 
            style={{ fontSize: '11px', fontWeight: 700 }}
          >
            <Zap className="w-3 h-3" />
            MEGATEST
          </button>
          <button onClick={() => setPanelCaptura(true)} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 700 }}><Plus className="w-3 h-3" />CAPTURAR VIAJE</button>
          <div className="ml-auto text-slate-600" style={{ fontSize: '12px', fontWeight: 600 }}>{datosFiltrados.length} unidades</div>
        </div>
      </div>

      {/* TABLA */}
      <div className="px-5 py-4">
        <div className="bg-white shadow border border-slate-200 rounded-lg overflow-hidden">
          <div className={`px-4 py-2 bg-gradient-to-r ${vistaActiva === 'entregas' ? 'from-emerald-50 to-white' : 'from-purple-50 to-white'}`}>
            <div className="flex items-center gap-2">
              <Truck className={`w-4 h-4 ${vistaActiva === 'entregas' ? 'text-emerald-600' : 'text-purple-600'}`} />
              <h2 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                {vistaActiva === 'entregas' ? 'ENTREGAS EN CURSO' : 'REGRESOS A PLANTA'}
              </h2>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-slate-700 border-b border-slate-600">
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>UNIDAD</th>
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>OPERADOR</th>
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>🛰️ UBICACIÓN GPS</th>
                <th className="px-3 py-1.5 text-left text-white" style={{ fontSize: '11px', fontWeight: 700 }}>DESTINO / CLIENTE</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>ESTADO</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>ALERTA</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>📅 CITA</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>⏰ LLEGADA</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>STATUS</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>MANT</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>%</th>
                <th className="px-3 py-1.5 text-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>📎</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((u, idx) => {
                const tiempo = formatearTiempo(u.tiempoRestante);
                return (
                  <tr key={u.id} className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => {
                          // Descargar póliza del tractocamión
                          const polizaHTML = `
                            <html>
                            <head><title>Póliza Tracto ${u.tracto}</title></head>
                            <body style="font-family: Arial; padding: 40px;">
                              <h1>PÓLIZA DE SEGURO - TRACTO #${u.tracto}</h1>
                              <p><strong>Operador:</strong> ${u.operador}</p>
                              <p><strong>Thermo:</strong> ${u.thermo}</p>
                              <p><strong>Aseguradora:</strong> Quálitas Seguros</p>
                              <p><strong>No. Póliza:</strong> POL-${u.tracto}-2025</p>
                              <p><strong>Vigencia:</strong> 01/01/2025 - 31/12/2025</p>
                              <p><strong>Cobertura:</strong> Amplia Plus</p>
                            </body>
                            </html>
                          `;
                          const blob = new Blob([polizaHTML], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Poliza-Tracto-${u.tracto}.html`;
                          a.click();
                        }} className="hover:scale-110 transition-transform cursor-pointer">
                          <Truck className="w-4 h-4 text-blue-600" />
                        </button>
                        <div>
                          <div className="text-slate-900" style={{ fontSize: '13px', fontWeight: 700 }}>{u.tracto}</div>
                          <div className="text-slate-500" style={{ fontSize: '10px' }}>{u.thermo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <button onClick={() => setOperadorModal(u.operador)} className="text-blue-600 hover:underline text-left" style={{ fontSize: '12px', fontWeight: 600 }}>{u.operador}</button>
                    </td>
                    <td className="px-3 py-1.5">
                      {gpsLocations[u.tracto] ? (
                        <div>
                          <div className="text-slate-700" style={{ fontSize: '10px', fontWeight: 600, lineHeight: '1.2', marginBottom: '2px' }}>
                            {gpsLocations[u.tracto].address.substring(0, 40)}...
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const lat = gpsLocations[u.tracto].latitude;
                                const lng = gpsLocations[u.tracto].longitude;
                                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                              }}
                              className="px-2 py-0.5 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-1 transition-all"
                              style={{ fontSize: '9px', fontWeight: 700 }}
                            >
                              <Navigation className="w-3 h-3" />
                              VER MAPA
                            </button>
                            <span className="text-slate-500" style={{ fontSize: '9px' }}>
                              {gpsLocations[u.tracto].speed.toFixed(0)} km/h
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {loadingGPS ? (
                            <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: '10px' }}>
                              <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                              <span>Cargando...</span>
                            </div>
                          ) : (
                            <span className="text-slate-400" style={{ fontSize: '10px' }}>Sin datos GPS</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <div>
                        <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 700 }}>{u.destino}</div>
                        <div className="text-blue-600" style={{ fontSize: '10px', fontWeight: 600 }}>{u.cliente}</div>
                        <div className="text-slate-500" style={{ fontSize: '10px' }}>{u.bodega}</div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`px-2 py-1 rounded ${
                        u.estado === 'Lavado' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                        u.estado === 'Origen' ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                        u.estado === 'Tránsito' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`} style={{ fontSize: '11px', fontWeight: 700 }}>{u.estado}</span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {u.minutosDetenido && u.minutosDetenido > 45 ? (
                        <div className="flex flex-col items-center gap-0">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          <div className="text-yellow-700" style={{ fontSize: '10px', fontWeight: 700 }}>{u.minutosDetenido}m</div>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex flex-col items-center gap-0">
                        <div className="flex items-center gap-1 text-indigo-600">
                          <Calendar className="w-3.5 h-3.5" />
                          <div style={{ fontSize: '11px', fontWeight: 700 }}>{u.citaFecha}</div>
                        </div>
                        <div className="text-slate-600" style={{ fontSize: '10px', fontWeight: 600 }}>{u.citaHora}</div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex flex-col items-center gap-0">
                        <div className={`flex items-center gap-1 ${tiempo.urgente ? 'animate-pulse' : ''}`}>
                          <Clock className="w-4 h-4" style={{ color: tiempo.color }} />
                          <div style={{ fontSize: '14px', fontWeight: 900, color: tiempo.color }}>{tiempo.texto}</div>
                        </div>
                        <div className="text-slate-400" style={{ fontSize: '9px' }}>{u.tiempoRestante === 0 ? '✓ Completado' : 'restante'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        {u.status === 'On Time' ? (
                          <div className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700" style={{ fontSize: '11px', fontWeight: 700 }}>On Time</span>
                          </div>
                        ) : u.status === 'Early' ? (
                          <div className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-sky-500/20 border border-sky-500">
                            <CheckCircle className="w-4 h-4 text-sky-600" />
                            <span className="text-sky-700" style={{ fontSize: '11px', fontWeight: 700 }}>Early</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-red-500/20 border border-red-500">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <span className="text-red-700" style={{ fontSize: '11px', fontWeight: 700 }}>Delay</span>
                            </div>
                            {u.horasDelay && (
                              <div className="text-red-600" style={{ fontSize: '10px', fontWeight: 700 }}>
                                +{u.horasDelay}hrs
                              </div>
                            )}
                          </>
                        )}
                        {/* ALERTA 45 MIN ANTES DE LLEGADA */}
                        {u.tiempoRestante > 0 && u.tiempoRestante <= 45 && (
                          <div className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500 animate-pulse">
                            <span className="text-amber-700" style={{ fontSize: '9px', fontWeight: 700 }}>⚠️ Preparar descarga</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => setMantModal(u)} className="flex flex-col items-center hover:bg-slate-100 rounded px-2 py-0.5 gap-0">
                        <div className={`w-4 h-4 rounded-full ${u.semaforoMant === 'rojo' ? 'bg-red-500' : u.semaforoMant === 'amarillo' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                        <div className="text-slate-900" style={{ fontSize: '9px', fontWeight: 700 }}>{Math.floor((u.kmActual / u.kmMant) * 100)}%</div>
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="text-slate-900" style={{ fontSize: '16px', fontWeight: 900 }}>{u.progreso}%</div>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => {
                        // Descargar evidencia del cliente
                        const evidenciaHTML = `
                          <html>
                          <head><title>Evidencia Entrega ${u.tracto}</title></head>
                          <body style="font-family: Arial; padding: 40px;">
                            <h1>EVIDENCIA DE ENTREGA</h1>
                            <p><strong>Tracto:</strong> ${u.tracto}</p>
                            <p><strong>Thermo:</strong> ${u.thermo}</p>
                            <p><strong>Operador:</strong> ${u.operador}</p>
                            <p><strong>Cliente:</strong> ${u.cliente}</p>
                            <p><strong>Bodega:</strong> ${u.bodega}</p>
                            <p><strong>Destino:</strong> ${u.destino}</p>
                            <p><strong>Fecha entrega:</strong> ${u.citaFecha} ${u.citaHora}</p>
                            <p><strong>Status:</strong> ${u.status}</p>
                            <hr/>
                            <p>Firma del cliente: ___________________</p>
                            <p>Nombre: ___________________</p>
                          </body>
                          </html>
                        `;
                        const blob = new Blob([evidenciaHTML], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Evidencia-${u.tracto}-${u.citaFecha}.html`;
                        a.click();
                      }} className="p-2 hover:bg-slate-100 rounded transition-colors">
                        <Paperclip className="w-4 h-4 text-emerald-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
