import { useState, useEffect } from 'react';
import { Truck, ArrowLeft, AlertTriangle, CheckCircle, Download, X, Wrench, FileText, Zap, MapPin, Clock, Paperclip, Plus, Calendar, Navigation } from 'lucide-react';
import { GoogleMap, LoadScript, Marker, Circle, Polyline, InfoWindow } from '@react-google-maps/api';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

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
  { id: '1', tracto: '505', thermo: '1292', operador: 'RAUL BAUTISTA LOPEZ', destino: 'TIJUANA, BAJA CALIFORNIA', cliente: 'Cliente A', bodega: 'Bodega 1', temp: -18.3, estado: 'Tránsito', tiempoRestante: 420, status: 'Delayed', progreso: 38, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 936409, kmMant: 10000, horasThermo: 680, horasMant: 1000, lat: 32.5149, lng: -117.0382, horasDelay: 2.5, citaFecha: '2023-10-15', citaHora: '14:00', formatoVenta: 'Flete', numeroViaje: 'V001', fechaMantoTracto: '20/11/2025', fechaMantoRemolque: '24/10/2025', diasMantRemolque: 27 },
  { id: '2', tracto: '777', thermo: '1356', operador: 'LUIS ANGEL TAPIA RODRIGUEZ', destino: 'HERMOSILLO, SONORA', cliente: 'Cliente B', bodega: 'Bodega 2', temp: -18.3, estado: 'Lavado', tiempoRestante: 135, status: 'Early', progreso: 0, semaforoMant: 'verde', semaforoRemolque: 'rojo', kmActual: 491391, kmMant: 10000, horasThermo: 720, horasMant: 1000, lat: 19.0427, lng: -97.5922, citaFecha: '2023-10-16', citaHora: '15:00', formatoVenta: 'Flete', numeroViaje: 'V002', fechaMantoTracto: '04/09/2025', fechaMantoRemolque: '07/07/2025', diasMantRemolque: 136 },
  { id: '3', tracto: '893', thermo: '1406', operador: 'MARCELO SANCHEZ RODRIGUEZ', destino: 'AGUASCALIENTES, AGUASCALIENTES', cliente: 'Cliente C', bodega: 'Bodega 3', temp: -17.8, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 276880, kmMant: 10000, horasThermo: 890, horasMant: 1000, lat: 21.8853, lng: -102.2916, citaFecha: '2023-10-17', citaHora: '16:00', formatoVenta: 'Flete', numeroViaje: 'V003', fechaMantoTracto: '08/10/2025', fechaMantoRemolque: '09/10/2025', diasMantRemolque: 42 },
  { id: '4', tracto: '931', thermo: '1288', operador: 'MARCELO SANCHEZ RODRIGUEZ', destino: 'MONTERREY, NUEVO LEON', cliente: 'Cliente D', bodega: 'Bodega 4', temp: -18.9, estado: 'Destino', tiempoRestante: 0, status: 'On Time', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 929754, kmMant: 10000, horasThermo: 560, horasMant: 1000, lat: 25.6866, lng: -100.3161, citaFecha: '2023-10-18', citaHora: '17:00', formatoVenta: 'Flete', numeroViaje: 'V004', fechaMantoTracto: '29/09/2025', fechaMantoRemolque: '18/08/2025', diasMantRemolque: 94 },
  { id: '5', tracto: '937', thermo: '1348', operador: 'VICTOR ISLAS ORIA', destino: 'TUXTLA GUTIERREZ, CHIAPAS', cliente: 'Cliente E', bodega: 'Bodega 5', temp: -19.4, estado: 'Origen', tiempoRestante: 960, status: 'Early', progreso: 4, minutosDetenido: 57, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 124800, kmMant: 10000, horasThermo: 420, horasMant: 1000, lat: 19.0427, lng: -97.5922, citaFecha: '2023-10-19', citaHora: '18:00', formatoVenta: 'Flete', numeroViaje: 'V005', fechaMantoTracto: '18/09/2025', fechaMantoRemolque: '21/08/2025', diasMantRemolque: 91 },
  { id: '6', tracto: '891', thermo: '1350', operador: 'FEDERICO CLEMENTE QUINTERO', destino: 'CIUDAD DE MEXICO, CD DE MEXICO', cliente: 'Cliente F', bodega: 'Bodega 6', temp: 3.7, estado: 'Origen', tiempoRestante: 60, status: 'Early', progreso: 8, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 246977, kmMant: 10000, horasThermo: 910, horasMant: 1000, lat: 19.0427, lng: -97.5922, citaFecha: '2023-10-20', citaHora: '19:00', formatoVenta: 'Flete', numeroViaje: 'V006', fechaMantoTracto: '28/08/2025', fechaMantoRemolque: '08/08/2025', diasMantRemolque: 104 },
  { id: '7', tracto: '801', thermo: '1378', operador: 'FERNANDO GUZMAN SERVN', destino: 'QUERETARO, QUERETARO', cliente: 'Cliente G', bodega: 'Bodega 7', temp: -17.8, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 802126, kmMant: 10000, horasThermo: 920, horasMant: 1000, lat: 20.5888, lng: -100.3899, citaFecha: '2023-10-21', citaHora: '20:00', formatoVenta: 'Flete', numeroViaje: 'V007', fechaMantoTracto: '31/10/2025', fechaMantoRemolque: '19/11/2025', diasMantRemolque: 1 },
  { id: '8', tracto: '905', thermo: '1260', operador: 'JUAN ALAN DIAZ MARTINEZ', destino: 'LEON, GUANAJUATO', cliente: 'Cliente H', bodega: 'Bodega 8', temp: -6.0, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 936408, kmMant: 10000, horasThermo: 880, horasMant: 1000, lat: 21.1227, lng: -101.6827, citaFecha: '2023-10-22', citaHora: '21:00', formatoVenta: 'Flete', numeroViaje: 'V008', fechaMantoTracto: '30/08/2025', fechaMantoRemolque: '19/09/2025', diasMantRemolque: 62 },
  { id: '9', tracto: '911', thermo: '1256', operador: 'ENRIQUE URBAN FLORES', destino: 'CANCUN, QUINTANA ROO', cliente: 'Cliente I', bodega: 'Bodega 9', temp: 3.6, estado: 'Tránsito', tiempoRestante: 180, status: 'On Time', progreso: 65, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 175998, kmMant: 10000, horasThermo: 740, horasMant: 1000, lat: 21.1619, lng: -86.8515, citaFecha: '2023-10-23', citaHora: '22:00', formatoVenta: 'Flete', numeroViaje: 'V009', fechaMantoTracto: '12/09/2025', fechaMantoRemolque: '20/08/2025', diasMantRemolque: 92 },
  { id: '10', tracto: '841', thermo: '1262', operador: 'RENE ALONSO VAZQUEZ CRUZ', destino: 'MERIDA, YUCATAN', cliente: 'Cliente J', bodega: 'Bodega 10', temp: 3.1, estado: 'Tránsito', tiempoRestante: 90, status: 'Early', progreso: 72, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 238717, kmMant: 10000, horasThermo: 980, horasMant: 1000, lat: 20.9674, lng: -89.5926, citaFecha: '2023-10-24', citaHora: '23:00', formatoVenta: 'Flete', numeroViaje: 'V010', fechaMantoTracto: '15/10/2025', fechaMantoRemolque: '02/08/2025', diasMantRemolque: 110 },
  { id: '11', tracto: '863', thermo: '4113', operador: 'OCTAVIO VILLELA TRENADO', destino: 'GUADALAJARA, JALISCO', cliente: 'Cliente K', bodega: 'Bodega 11', temp: 4.1, estado: 'Tránsito', tiempoRestante: 240, status: 'On Time', progreso: 45, semaforoMant: 'verde', semaforoRemolque: 'rojo', kmActual: 371606, kmMant: 10000, horasThermo: 410, horasMant: 1000, lat: 20.6597, lng: -103.3496, citaFecha: '2023-10-25', citaHora: '00:00', formatoVenta: 'Flete', numeroViaje: 'V011', fechaMantoTracto: '02/08/2025', fechaMantoRemolque: '17/07/2025', diasMantRemolque: 126 },
  { id: '12', tracto: '861', thermo: '1208', operador: 'JUAN FRANCISCO LEOS FRAGOSO', destino: 'OAXACA, OAXACA', cliente: 'Cliente L', bodega: 'Bodega 12', temp: -18.1, estado: 'Tránsito', tiempoRestante: 195, status: 'Early', progreso: 58, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 354969, kmMant: 10000, horasThermo: 900, horasMant: 1000, lat: 17.0732, lng: -96.7266, citaFecha: '2023-10-26', citaHora: '01:00', formatoVenta: 'Flete', numeroViaje: 'V012', fechaMantoTracto: '13/11/2025', fechaMantoRemolque: '07/10/2025', diasMantRemolque: 44 },
  { id: '13', tracto: '817', thermo: '1278', operador: 'JUAN RAMIREZ MONTES', destino: 'VERACRUZ, VERACRUZ', cliente: 'Cliente M', bodega: 'Bodega 13', temp: -17.9, estado: 'Tránsito', tiempoRestante: 165, status: 'On Time', progreso: 62, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 417234, kmMant: 10000, horasThermo: 590, horasMant: 1000, lat: 19.1738, lng: -96.1342, citaFecha: '2023-10-27', citaHora: '02:00', formatoVenta: 'Flete', numeroViaje: 'V013', fechaMantoTracto: '30/08/2025', fechaMantoRemolque: '05/09/2025', diasMantRemolque: 76 },
  { id: '14', tracto: '899', thermo: '1332', operador: 'JULIO ENRIQUE ARELLANO PEREZ', destino: 'PUEBLA, PUEBLA', cliente: 'Cliente N', bodega: 'Bodega 14', temp: -18.5, estado: 'Tránsito', tiempoRestante: 120, status: 'On Time', progreso: 55, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 228885, kmMant: 10000, horasThermo: 600, horasMant: 1000, lat: 19.0414, lng: -98.2063, citaFecha: '2023-10-28', citaHora: '10:00', formatoVenta: 'Flete', numeroViaje: 'V014', fechaMantoTracto: '18/10/2025', fechaMantoRemolque: '20/10/2025', diasMantRemolque: 31 },
  { id: '15', tracto: '745', thermo: '1254', operador: 'CARLOS SERGIO FLORES VERGES', destino: 'GUADALAJARA, JALISCO', cliente: 'Cliente O', bodega: 'Bodega 15', temp: -19.2, estado: 'Destino', tiempoRestante: 0, status: 'Early', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 995790, kmMant: 10000, horasThermo: 850, horasMant: 1000, lat: 20.6597, lng: -103.3496, citaFecha: '2023-10-29', citaHora: '11:00', formatoVenta: 'Flete', numeroViaje: 'V015', fechaMantoTracto: '20/11/2025', fechaMantoRemolque: '17/09/2025', diasMantRemolque: 64 },
  { id: '16', tracto: '799', thermo: '1322', operador: 'RUBEN CALDERON JASSO', destino: 'MONTERREY, NUEVO LEON', cliente: 'Cliente P', bodega: 'Bodega 16', temp: -17.5, estado: 'Tránsito', tiempoRestante: 240, status: 'On Time', progreso: 45, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 870714, kmMant: 10000, horasThermo: 710, horasMant: 1000, lat: 25.6866, lng: -100.3161, citaFecha: '2023-10-30', citaHora: '12:00', formatoVenta: 'Flete', numeroViaje: 'V016', fechaMantoTracto: '22/10/2025', fechaMantoRemolque: '22/10/2025', diasMantRemolque: 29 },
  { id: '17', tracto: '837', thermo: '1296', operador: 'JOSE ALBERTO MORANCHEL VILLANUEVA', destino: 'CANCUN, QUINTANA ROO', cliente: 'Cliente Q', bodega: 'Bodega 17', temp: -18.8, estado: 'Tránsito', tiempoRestante: 180, status: 'Early', progreso: 60, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 289359, kmMant: 10000, horasThermo: 620, horasMant: 1000, lat: 21.1619, lng: -86.8515, citaFecha: '2023-10-31', citaHora: '13:00', formatoVenta: 'Flete', numeroViaje: 'V017', fechaMantoTracto: '22/10/2025', fechaMantoRemolque: '14/08/2025', diasMantRemolque: 98 },
  { id: '18', tracto: '933', thermo: '1328', operador: 'JUAN MANUEL OJEDA VELAZQUEZ', destino: 'VERACRUZ, VERACRUZ', cliente: 'Cliente R', bodega: 'Bodega 18', temp: -17.0, estado: 'Tránsito', tiempoRestante: 150, status: 'On Time', progreso: 62, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 162940, kmMant: 10000, horasThermo: 520, horasMant: 1000, lat: 19.1738, lng: -96.1342, citaFecha: '2023-11-01', citaHora: '14:00', formatoVenta: 'Flete', numeroViaje: 'V018', fechaMantoTracto: '17/11/2025', fechaMantoRemolque: '10/10/2025', diasMantRemolque: 41 },
  { id: '19', tracto: '212', thermo: '838843', operador: 'CHRISTIAN OJEDA VELAZQUEZ', destino: 'MERIDA, YUCATAN', cliente: 'Cliente S', bodega: 'Bodega 19', temp: -18.2, estado: 'Tránsito', tiempoRestante: 200, status: 'Delayed', progreso: 50, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 38529, kmMant: 10000, horasThermo: 450, horasMant: 1000, lat: 20.9674, lng: -89.5926, citaFecha: '2023-11-02', citaHora: '15:00', formatoVenta: 'Flete', numeroViaje: 'V019', horasDelay: 1.5, fechaMantoTracto: '23/10/2025', fechaMantoRemolque: '10/11/2025', diasMantRemolque: 10 },
  { id: '20', tracto: '765', thermo: '838855', operador: 'HECTOR CHRISTIAN JAIME LEON', destino: 'TIJUANA, BAJA CALIFORNIA', cliente: 'Cliente T', bodega: 'Bodega 20', temp: -19.5, estado: 'Tránsito', tiempoRestante: 480, status: 'On Time', progreso: 25, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 1081287, kmMant: 10000, horasThermo: 900, horasMant: 1000, lat: 32.5149, lng: -117.0382, citaFecha: '2023-11-03', citaHora: '16:00', formatoVenta: 'Flete', numeroViaje: 'V020', fechaMantoTracto: '10/11/2025', fechaMantoRemolque: '08/08/2025', diasMantRemolque: 104 },
  { id: '21', tracto: '208', thermo: '1282', operador: 'MARCO ANTONIO GARCIA RAMIREZ', destino: 'HERMOSILLO, SONORA', cliente: 'Cliente U', bodega: 'Bodega 21', temp: -18.0, estado: 'Tránsito', tiempoRestante: 300, status: 'Early', progreso: 40, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 129159, kmMant: 10000, horasThermo: 550, horasMant: 1000, lat: 29.0729, lng: -110.9559, citaFecha: '2023-11-04', citaHora: '17:00', formatoVenta: 'Flete', numeroViaje: 'V021', fechaMantoTracto: '18/11/2025', fechaMantoRemolque: '05/09/2025', diasMantRemolque: 76 },
  { id: '22', tracto: '813', thermo: '1360', operador: 'EDGAR IVAN HERNANDEZ', destino: 'QUERETARO, QUERETARO', cliente: 'Cliente V', bodega: 'Bodega 22', temp: -17.3, estado: 'Destino', tiempoRestante: 0, status: 'On Time', progreso: 100, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 363662, kmMant: 10000, horasThermo: 670, horasMant: 1000, lat: 20.5888, lng: -100.3899, citaFecha: '2023-11-05', citaHora: '18:00', formatoVenta: 'Flete', numeroViaje: 'V022', fechaMantoTracto: '27/10/2025', fechaMantoRemolque: '02/10/2025', diasMantRemolque: 49 },
  { id: '23', tracto: '126', thermo: '838656', operador: 'ALEJANDRO VILLANUEVA ESPINOZA', destino: 'LEON, GUANAJUATO', cliente: 'Cliente W', bodega: 'Bodega 23', temp: -19.0, estado: 'Tránsito', tiempoRestante: 210, status: 'Delayed', progreso: 48, semaforoMant: 'verde', semaforoRemolque: 'rojo', kmActual: 1362370, kmMant: 10000, horasThermo: 820, horasMant: 1000, lat: 21.1227, lng: -101.6827, citaFecha: '2023-11-06', citaHora: '19:00', formatoVenta: 'Flete', numeroViaje: 'V023', horasDelay: 2.0, fechaMantoTracto: '24/08/2025', fechaMantoRemolque: '08/05/2025', diasMantRemolque: 196 },
  { id: '24', tracto: '809', thermo: '28654', operador: 'RUMUALDO BAUTISTA GOMEZ', destino: 'AGUASCALIENTES, AGUASCALIENTES', cliente: 'Cliente X', bodega: 'Bodega 24', temp: -18.7, estado: 'Tránsito', tiempoRestante: 170, status: 'On Time', progreso: 58, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 429433, kmMant: 10000, horasThermo: 690, horasMant: 1000, lat: 21.8853, lng: -102.2916, citaFecha: '2023-11-07', citaHora: '20:00', formatoVenta: 'Flete', numeroViaje: 'V024', fechaMantoTracto: '15/10/2025', fechaMantoRemolque: '02/08/2025', diasMantRemolque: 110 },
  { id: '25', tracto: '859', thermo: '1414', operador: 'HECTOR ADRIAN LOPEZ MEDINA', destino: 'GUADALAJARA, JALISCO', cliente: 'Cliente Y', bodega: 'Bodega 25', temp: -17.8, estado: 'Tránsito', tiempoRestante: 190, status: 'Early', progreso: 52, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 196719, kmMant: 10000, horasThermo: 580, horasMant: 1000, lat: 20.6597, lng: -103.3496, citaFecha: '2023-11-08', citaHora: '21:00', formatoVenta: 'Flete', numeroViaje: 'V025', fechaMantoTracto: '17/09/2025', fechaMantoRemolque: '04/10/2025', diasMantRemolque: 47 },
  { id: '26', tracto: '178', thermo: '1376', operador: 'CRISTIAN CORTEZ PORTILLO', destino: 'PUEBLA, PUEBLA', cliente: 'Cliente Z', bodega: 'Bodega 26', temp: -18.4, estado: 'Tránsito', tiempoRestante: 140, status: 'On Time', progreso: 65, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 426784, kmMant: 10000, horasThermo: 640, horasMant: 1000, lat: 19.0414, lng: -98.2063, citaFecha: '2023-11-09', citaHora: '22:00', formatoVenta: 'Flete', numeroViaje: 'V026', fechaMantoTracto: '21/09/2025', fechaMantoRemolque: '26/08/2025', diasMantRemolque: 86 },
  { id: '27', tracto: '731', thermo: '1398', operador: 'MARIO LARA TIBURCIO', destino: 'MONTERREY, NUEVO LEON', cliente: 'Cliente AA', bodega: 'Bodega 27', temp: -17.2, estado: 'Tránsito', tiempoRestante: 250, status: 'On Time', progreso: 42, semaforoMant: 'verde', semaforoRemolque: 'verde', kmActual: 889384, kmMant: 10000, horasThermo: 750, horasMant: 1000, lat: 25.6866, lng: -100.3161, citaFecha: '2023-11-10', citaHora: '23:00', formatoVenta: 'Flete', numeroViaje: 'V027', fechaMantoTracto: '19/06/2025', fechaMantoRemolque: '13/09/2025', diasMantRemolque: 68 },
  { id: '28', tracto: '847', thermo: '1396', operador: 'VICTOR FRANCO MONTAÑO', destino: 'VERACRUZ, VERACRUZ', cliente: 'Cliente AB', bodega: 'Bodega 28', temp: -18.6, estado: 'Tránsito', tiempoRestante: 160, status: 'Early', progreso: 60, semaforoMant: 'verde', semaforoRemolque: 'amarillo', kmActual: 498572, kmMant: 10000, horasThermo: 610, horasMant: 1000, lat: 19.1738, lng: -96.1342, citaFecha: '2023-11-11', citaHora: '08:00', formatoVenta: 'Flete', numeroViaje: 'V028', fechaMantoTracto: '10/11/2025', fechaMantoRemolque: '28/08/2025', diasMantRemolque: 84 },
];

const DATOS_REGRESOS: Unidad[] = [];

export const DedicadosModuleV2 = ({ onBack }: CarrollModuleProps) => {
  const [vistaActiva, setVistaActiva] = useState<'entregas' | 'regresos'>('entregas');
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'ontime' | 'delayed' | 'early'>('all');

  const datos = vistaActiva === 'entregas' ? DATOS_ENTREGAS : DATOS_REGRESOS;
  const datosFiltrados = filtroStatus === 'all' ? datos : 
    datos.filter(u => 
      filtroStatus === 'ontime' ? u.status === 'On Time' :
      filtroStatus === 'delayed' ? u.status === 'Delayed' :
      u.status === 'Early'
    );

  // Función para calcular días desde el último mantenimiento del remolque
  const calcularDiasDesdeMantenimiento = (fechaStr: string | undefined): number => {
    if (!fechaStr) return 0;
    const [dia, mes, anio] = fechaStr.split('/').map(Number);
    const fechaMant = new Date(anio, mes - 1, dia);
    const hoy = new Date(2025, 10, 20); // 20/11/2025
    const diffTime = hoy.getTime() - fechaMant.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Función para calcular semáforo del remolque basado en días (120 días)
  const calcularSemaforoRemolque = (dias: number): 'verde' | 'amarillo' | 'rojo' => {
    if (dias <= 80) return 'verde';      // 0-80 días = Verde
    if (dias <= 110) return 'amarillo';  // 81-110 días = Amarillo
    return 'rojo';                       // 111+ días = Rojo (límite 120)
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1220' }}>
      {/* HEADER */}
      <div className="px-5 py-4 border-b" style={{ backgroundColor: '#0B1220', borderColor: '#1E293B' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '20px', fontWeight: 700 }}>
                DEDICADOS #12 - GRANJAS CARROLL
              </h1>
              <p className="text-slate-400" style={{ fontSize: '12px' }}>
                {DATOS_ENTREGAS.length} tractocamiones dedicados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="px-5 py-4">
        {/* BANNER DE CRITERIOS DE MANTENIMIENTO */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg border-2 border-blue-600 shadow-lg">
          <div className="flex items-center gap-6 justify-center">
            <div className="flex items-center gap-3">
              <Wrench className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-white" style={{ fontSize: '13px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                  MANTENIMIENTO TRACTO
                </div>
                <div className="text-yellow-300" style={{ fontSize: '16px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif" }}>
                  CADA 28,000 KM
                </div>
              </div>
            </div>
            <div className="h-12 w-px bg-blue-400"></div>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-white" style={{ fontSize: '13px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                  MANTENIMIENTO REMOLQUE
                </div>
                <div className="text-yellow-300" style={{ fontSize: '16px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif" }}>
                  CADA 120 DÍAS
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-600">
            <div className="flex items-center gap-4 justify-center text-white" style={{ fontSize: '11px' }}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                <span>🟢 VERDE: 0-80 días</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span>🟡 AMARILLO: 81-110 días</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>🔴 ROJO: 111+ días (urgente)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                28 UNIDADES ACTUALIZADAS CON KM Y FECHAS DE MANTENIMIENTO
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-600">
                  <th className="px-2 py-1.5 text-left text-white" style={{ fontSize: '10px', fontWeight: 700 }}>UNIDAD</th>
                  <th className="px-2 py-1.5 text-left text-white" style={{ fontSize: '10px', fontWeight: 700 }}>OPERADOR</th>
                  <th className="px-2 py-1.5 text-right text-white" style={{ fontSize: '10px', fontWeight: 700 }}>KM TRACTO</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>ÚLT MANT TRACTO</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>ÚLT MANT REM</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>DÍAS REM</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>SEMÁFORO TRACTO</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>SEMÁFORO REM</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((u, idx) => (
                  <tr key={u.id} className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 py-2">
                      <div>
                        <div className="text-slate-900" style={{ fontSize: '11px', fontWeight: 900 }}>{u.tracto}</div>
                        <div className="text-slate-500" style={{ fontSize: '9px', fontWeight: 600 }}>#{u.thermo}</div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="text-slate-900" style={{ fontSize: '10px', fontWeight: 700 }}>{u.operador}</div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="text-slate-900" style={{ fontSize: '11px', fontWeight: 900 }}>{u.kmActual.toLocaleString()}</div>
                      <div className="text-slate-500" style={{ fontSize: '9px' }}>km</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-slate-900" style={{ fontSize: '10px', fontWeight: 700 }}>{u.fechaMantoTracto}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-slate-900" style={{ fontSize: '10px', fontWeight: 700 }}>{u.fechaMantoRemolque}</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="text-slate-900" style={{ fontSize: '11px', fontWeight: 900 }}>{u.diasMantRemolque}</div>
                      <div className="text-slate-500" style={{ fontSize: '9px' }}>/ 120 días</div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className={`w-6 h-6 rounded-full mx-auto ${
                        u.semaforoMant === 'verde' ? 'bg-emerald-500' :
                        u.semaforoMant === 'amarillo' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className={`w-6 h-6 rounded-full mx-auto ${
                        u.semaforoRemolque === 'verde' ? 'bg-emerald-500' :
                        u.semaforoRemolque === 'amarillo' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};