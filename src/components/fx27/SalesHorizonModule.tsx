'use client';

import React, { useState, useMemo } from 'react';
import { 
  Target, ArrowLeft, Truck, Search, Calendar, ChevronRight, ChevronDown,
  AlertTriangle, BarChart3, Building2, Users, TrendingUp, Download,
  ArrowRightLeft, Calculator, Filter, X, Eye, EyeOff
} from 'lucide-react';

// ==================== DATOS DEL EXCEL ====================
const GLOBAL = {
  meta_anual: 1341341246.49,
  operatividad: 0.95,
  tractores_totales: 219,
  tractores_facturan: 210,
};

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

const SEMANAS = [
  { semana: 1, inicio: '01/01', fin: '09/01', dias: 9, meta_total: 33074168, speedyhaul: 4961125, trob: 19679130, wexpress: 8433913, acumulado: 33074168 },
  { semana: 2, inicio: '10/01', fin: '16/01', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 58798520 },
  { semana: 3, inicio: '17/01', fin: '23/01', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 84522873 },
  { semana: 4, inicio: '24/01', fin: '30/01', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 110247226 },
  { semana: 5, inicio: '31/01', fin: '06/02', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 135971578 },
  { semana: 6, inicio: '07/02', fin: '13/02', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 161695931 },
  { semana: 7, inicio: '14/02', fin: '20/02', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 187420284 },
  { semana: 8, inicio: '21/02', fin: '27/02', dias: 7, meta_total: 25724353, speedyhaul: 3858653, trob: 15305990, wexpress: 6559710, acumulado: 213144637 },
  { semana: 9, inicio: '28/02', fin: '06/03', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 242543612 },
  { semana: 10, inicio: '07/03', fin: '13/03', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 271942587 },
  { semana: 11, inicio: '14/03', fin: '20/03', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 301341562 },
  { semana: 12, inicio: '21/03', fin: '27/03', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 330740537 },
  { semana: 13, inicio: '28/03', fin: '03/04', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 360139512 },
  { semana: 14, inicio: '04/04', fin: '10/04', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 389538487 },
  { semana: 15, inicio: '11/04', fin: '17/04', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 418937462 },
  { semana: 16, inicio: '18/04', fin: '24/04', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 448336437 },
  { semana: 17, inicio: '25/04', fin: '01/05', dias: 7, meta_total: 29766792, speedyhaul: 4465019, trob: 17711243, wexpress: 7590530, acumulado: 478103229 },
  { semana: 18, inicio: '02/05', fin: '08/05', dias: 7, meta_total: 29766792, speedyhaul: 4465019, trob: 17711243, wexpress: 7590530, acumulado: 507870021 },
  { semana: 19, inicio: '09/05', fin: '15/05', dias: 7, meta_total: 29766792, speedyhaul: 4465019, trob: 17711243, wexpress: 7590530, acumulado: 537636813 },
  { semana: 20, inicio: '16/05', fin: '22/05', dias: 7, meta_total: 29766792, speedyhaul: 4465019, trob: 17711243, wexpress: 7590530, acumulado: 567403605 },
  { semana: 21, inicio: '23/05', fin: '29/05', dias: 7, meta_total: 29766792, speedyhaul: 4465019, trob: 17711243, wexpress: 7590530, acumulado: 597170397 },
  { semana: 22, inicio: '30/05', fin: '05/06', dias: 7, meta_total: 31238240, speedyhaul: 4685736, trob: 18586755, wexpress: 7965749, acumulado: 628408637 },
  { semana: 23, inicio: '06/06', fin: '12/06', dias: 7, meta_total: 31238240, speedyhaul: 4685736, trob: 18586755, wexpress: 7965749, acumulado: 659646877 },
  { semana: 24, inicio: '13/06', fin: '19/06', dias: 7, meta_total: 31238240, speedyhaul: 4685736, trob: 18586755, wexpress: 7965749, acumulado: 690885117 },
  { semana: 25, inicio: '20/06', fin: '26/06', dias: 7, meta_total: 31238240, speedyhaul: 4685736, trob: 18586755, wexpress: 7965749, acumulado: 722123357 },
  { semana: 26, inicio: '27/06', fin: '03/07', dias: 7, meta_total: 31973056, speedyhaul: 4795958, trob: 19023969, wexpress: 8153129, acumulado: 754096413 },
  { semana: 27, inicio: '04/07', fin: '10/07', dias: 7, meta_total: 31973056, speedyhaul: 4795958, trob: 19023969, wexpress: 8153129, acumulado: 786069469 },
  { semana: 28, inicio: '11/07', fin: '17/07', dias: 7, meta_total: 31973056, speedyhaul: 4795958, trob: 19023969, wexpress: 8153129, acumulado: 818042525 },
  { semana: 29, inicio: '18/07', fin: '24/07', dias: 7, meta_total: 31973056, speedyhaul: 4795958, trob: 19023969, wexpress: 8153129, acumulado: 850015581 },
  { semana: 30, inicio: '25/07', fin: '31/07', dias: 7, meta_total: 31973056, speedyhaul: 4795958, trob: 19023969, wexpress: 8153129, acumulado: 881988637 },
  { semana: 31, inicio: '01/08', fin: '07/08', dias: 7, meta_total: 32707872, speedyhaul: 4906181, trob: 19461185, wexpress: 8340506, acumulado: 914696509 },
  { semana: 32, inicio: '08/08', fin: '14/08', dias: 7, meta_total: 32707872, speedyhaul: 4906181, trob: 19461185, wexpress: 8340506, acumulado: 947404381 },
  { semana: 33, inicio: '15/08', fin: '21/08', dias: 7, meta_total: 32707872, speedyhaul: 4906181, trob: 19461185, wexpress: 8340506, acumulado: 980112253 },
  { semana: 34, inicio: '22/08', fin: '28/08', dias: 7, meta_total: 32707872, speedyhaul: 4906181, trob: 19461185, wexpress: 8340506, acumulado: 1012820125 },
  { semana: 35, inicio: '29/08', fin: '04/09', dias: 7, meta_total: 34177504, speedyhaul: 5126626, trob: 20335616, wexpress: 8715262, acumulado: 1046997629 },
  { semana: 36, inicio: '05/09', fin: '11/09', dias: 7, meta_total: 34177504, speedyhaul: 5126626, trob: 20335616, wexpress: 8715262, acumulado: 1081175133 },
  { semana: 37, inicio: '12/09', fin: '18/09', dias: 7, meta_total: 34177504, speedyhaul: 5126626, trob: 20335616, wexpress: 8715262, acumulado: 1115352637 },
  { semana: 38, inicio: '19/09', fin: '25/09', dias: 7, meta_total: 34177504, speedyhaul: 5126626, trob: 20335616, wexpress: 8715262, acumulado: 1149530141 },
  { semana: 39, inicio: '26/09', fin: '02/10', dias: 7, meta_total: 34912320, speedyhaul: 5236848, trob: 20772831, wexpress: 8902641, acumulado: 1184442461 },
  { semana: 40, inicio: '03/10', fin: '09/10', dias: 7, meta_total: 34912320, speedyhaul: 5236848, trob: 20772831, wexpress: 8902641, acumulado: 1219354781 },
  { semana: 41, inicio: '10/10', fin: '16/10', dias: 7, meta_total: 34912320, speedyhaul: 5236848, trob: 20772831, wexpress: 8902641, acumulado: 1254267101 },
  { semana: 42, inicio: '17/10', fin: '23/10', dias: 7, meta_total: 34912320, speedyhaul: 5236848, trob: 20772831, wexpress: 8902641, acumulado: 1289179421 },
  { semana: 43, inicio: '24/10', fin: '30/10', dias: 7, meta_total: 34912320, speedyhaul: 5236848, trob: 20772831, wexpress: 8902641, acumulado: 1324091741 },
  { semana: 44, inicio: '31/10', fin: '06/11', dias: 7, meta_total: 33075553, speedyhaul: 4961333, trob: 19679955, wexpress: 8434265, acumulado: 1357167294 },
  { semana: 45, inicio: '07/11', fin: '13/11', dias: 7, meta_total: 33075553, speedyhaul: 4961333, trob: 19679955, wexpress: 8434265, acumulado: 1390242847 },
  { semana: 46, inicio: '14/11', fin: '20/11', dias: 7, meta_total: 33075553, speedyhaul: 4961333, trob: 19679955, wexpress: 8434265, acumulado: 1423318400 },
  { semana: 47, inicio: '21/11', fin: '27/11', dias: 7, meta_total: 33075553, speedyhaul: 4961333, trob: 19679955, wexpress: 8434265, acumulado: 1456393953 },
  { semana: 48, inicio: '28/11', fin: '04/12', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 1485792928 },
  { semana: 49, inicio: '05/12', fin: '11/12', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 1515191903 },
  { semana: 50, inicio: '12/12', fin: '18/12', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 1544590878 },
  { semana: 51, inicio: '19/12', fin: '25/12', dias: 7, meta_total: 29398975, speedyhaul: 4409846, trob: 17492390, wexpress: 7496739, acumulado: 1573989853 },
  { semana: 52, inicio: '26/12', fin: '31/12', dias: 6, meta_total: 25199407, speedyhaul: 3779911, trob: 14993647, wexpress: 6425849, acumulado: 1599189260 },
];

// Tractores iniciales (se cargarán de Supabase en producción)
const TRACTORES_INICIAL = [
  { numero: 511, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 649, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 733, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 735, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 759, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 807, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 815, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 839, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 843, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 847, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 867, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 871, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 875, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 879, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 883, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  { numero: 887, empresa: 'TROB', segmento: 'BAFAR', estatus: 'OPERANDO', factura: true },
  // Carroll (31 tractores)
  ...Array.from({length: 31}, (_, i) => ({ numero: 100 + i, empresa: 'TROB', segmento: 'CARROLL', estatus: 'OPERANDO', factura: true })),
  // Barcel (10)
  ...Array.from({length: 10}, (_, i) => ({ numero: 200 + i, empresa: 'TROB', segmento: 'BARCEL', estatus: 'OPERANDO', factura: true })),
  // Nature Sweet (13)
  ...Array.from({length: 13}, (_, i) => ({ numero: 300 + i, empresa: 'TROB', segmento: 'NATURE_SWEET', estatus: 'OPERANDO', factura: true })),
  // ALPURA (13)
  ...Array.from({length: 13}, (_, i) => ({ numero: 400 + i, empresa: 'SPEEDYHAUL', segmento: 'ALPURA', estatus: 'OPERANDO', factura: true })),
  // Pilgrims (11)
  ...Array.from({length: 11}, (_, i) => ({ numero: 500 + i, empresa: 'WEXPRESS', segmento: 'PILGRIMS', estatus: 'OPERANDO', factura: true })),
  // IMPEX (116) - mezcla de empresas
  ...Array.from({length: 50}, (_, i) => ({ numero: 600 + i, empresa: 'TROB', segmento: 'IMPEX', estatus: 'OPERANDO', factura: true })),
  ...Array.from({length: 40}, (_, i) => ({ numero: 700 + i, empresa: 'WEXPRESS', segmento: 'IMPEX', estatus: 'OPERANDO', factura: true })),
  ...Array.from({length: 26}, (_, i) => ({ numero: 800 + i, empresa: 'SPEEDYHAUL', segmento: 'IMPEX', estatus: 'OPERANDO', factura: true })),
];

// ==================== HELPERS ====================
const formatMoney = (value: number, compact = false): string => {
  if (compact) {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
};

const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;

// ==================== TIPOS ====================
type Vista = 'dashboard' | 'empresa' | 'segmento' | 'semanas' | 'buscar' | 'mover' | 'simulador';
type Periodo = 'mes' | 'semana' | 'año';

interface Props { onBack: () => void; }

// ==================== COMPONENTE PRINCIPAL ====================
export default function SalesHorizonModule({ onBack }: Props) {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [mesActual] = useState(new Date().getMonth() + 1);
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [empresaFiltro, setEmpresaFiltro] = useState<string | null>(null);
  const [segmentoFiltro, setSegmentoFiltro] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showComparativo, setShowComparativo] = useState(false);
  const [tractores, setTractores] = useState(TRACTORES_INICIAL);
  
  // Para mover tracto
  const [tractoMover, setTractoMover] = useState<number | null>(null);
  const [segmentoDestino, setSegmentoDestino] = useState<string>('');
  
  // Para simulador
  const [simSegmento, setSimSegmento] = useState<string>('IMPEX');
  const [simCambio, setSimCambio] = useState<number>(0);

  // Datos del mes actual
  const datosMes = MESES.find(m => m.mes === mesSeleccionado) || MESES[0];
  
  // Semanas del mes seleccionado
  const semanasMes = useMemo(() => {
    const mesInicio = mesSeleccionado;
    return SEMANAS.filter(s => {
      const [diaI, mesI] = s.inicio.split('/').map(Number);
      const [diaF, mesF] = s.fin.split('/').map(Number);
      return mesI === mesInicio || mesF === mesInicio;
    });
  }, [mesSeleccionado]);

  // Acumulado del mes
  const acumuladoMes = datosMes.ppto;
  
  // Meta por empresa para el mes
  const metaEmpresaMes = (empresa: string) => {
    const emp = EMPRESAS.find(e => e.nombre === empresa);
    return emp ? datosMes.ppto * emp.pct_flota : 0;
  };
  
  // Meta por segmento para el mes
  const metaSegmentoMes = (segmentoId: string) => {
    const seg = SEGMENTOS.find(s => s.id === segmentoId);
    return seg ? datosMes.ppto * seg.pct_ppto : 0;
  };

  // Tractores por segmento (dinámico)
  const tractoresPorSegmento = (segId: string) => tractores.filter(t => t.segmento === segId);
  const tractoresFacturanSegmento = (segId: string) => tractores.filter(t => t.segmento === segId && t.factura).length;

  // Mover tracto
  const handleMoverTracto = () => {
    if (!tractoMover || !segmentoDestino) return;
    setTractores(prev => prev.map(t => 
      t.numero === tractoMover ? { ...t, segmento: segmentoDestino } : t
    ));
    setTractoMover(null);
    setSegmentoDestino('');
    setVista('dashboard');
  };

  // Buscar tracto
  const tractoEncontrado = useMemo(() => {
    const num = parseInt(searchQuery);
    return !isNaN(num) ? tractores.find(t => t.numero === num) : null;
  }, [searchQuery, tractores]);

  // Simulador
  const simulacion = useMemo(() => {
    const seg = SEGMENTOS.find(s => s.id === simSegmento);
    if (!seg) return null;
    const tractoresActuales = tractoresFacturanSegmento(simSegmento);
    const nuevosTractores = tractoresActuales + simCambio;
    if (nuevosTractores <= 0) return null;
    const metaMes = metaSegmentoMes(simSegmento);
    const tractoMesActual = tractoresActuales > 0 ? metaMes / tractoresActuales : 0;
    const tractoMesNuevo = metaMes / nuevosTractores;
    return {
      segmento: seg.nombre,
      tractoresActuales,
      nuevosTractores,
      tractoMesActual,
      tractoMesNuevo,
      diferencia: tractoMesNuevo - tractoMesActual,
    };
  }, [simSegmento, simCambio, tractores]);

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
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Sales Horizon 2026</h1>
                <p className="text-sm text-slate-400">{datosMes.nombre} - Presupuesto</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowComparativo(!showComparativo)} className={`p-2 rounded-lg ${showComparativo ? 'bg-orange-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
              {showComparativo ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-slate-300" />}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
              <Filter className="w-5 h-5 text-slate-300" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
              <Download className="w-4 h-4 text-white" />
              <span className="text-sm text-white">Excel</span>
            </button>
          </div>
        </div>
        
        {/* Filtros */}
        {showFilters && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
            <select value={mesSeleccionado} onChange={e => setMesSeleccionado(Number(e.target.value))} className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm">
              {MESES.map(m => <option key={m.mes} value={m.mes}>{m.nombre}</option>)}
            </select>
            <select value={empresaFiltro || ''} onChange={e => setEmpresaFiltro(e.target.value || null)} className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm">
              <option value="">Todas las Empresas</option>
              {EMPRESAS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
            </select>
            <select value={segmentoFiltro || ''} onChange={e => setSegmentoFiltro(e.target.value || null)} className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm">
              <option value="">Todos los Segmentos</option>
              {SEGMENTOS.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {(empresaFiltro || segmentoFiltro) && (
              <button onClick={() => { setEmpresaFiltro(null); setSegmentoFiltro(null); }} className="p-2 hover:bg-slate-600 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dashboard Principal */}
      {vista === 'dashboard' && (
        <div className="p-6 space-y-6">
          {/* KPIs Principales */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 rounded-xl p-4 border border-blue-500/30">
              <div className="text-blue-300 text-sm mb-1">Meta Anual 2026</div>
              <div className="text-2xl font-bold text-white">{formatMoney(GLOBAL.meta_anual, true)}</div>
              <div className="text-xs text-blue-400 mt-1">100% del presupuesto</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-700/30 rounded-xl p-4 border border-emerald-500/30">
              <div className="text-emerald-300 text-sm mb-1">Operatividad</div>
              <div className="text-2xl font-bold text-white">{formatPct(GLOBAL.operatividad)}</div>
              <div className="text-xs text-emerald-400 mt-1">{GLOBAL.tractores_facturan} de {GLOBAL.tractores_totales} tractores</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600/30 to-orange-700/30 rounded-xl p-4 border border-orange-500/30">
              <div className="text-orange-300 text-sm mb-1">Meta {datosMes.nombre}</div>
              <div className="text-2xl font-bold text-white">{formatMoney(acumuladoMes, true)}</div>
              <div className="text-xs text-orange-400 mt-1">{formatPct(datosMes.pct)} del año</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 rounded-xl p-4 border border-purple-500/30">
              <div className="text-purple-300 text-sm mb-1">$/Tracto/Mes</div>
              <div className="text-2xl font-bold text-white">{formatMoney(GLOBAL.meta_anual / 12 / GLOBAL.tractores_facturan, true)}</div>
              <div className="text-xs text-purple-400 mt-1">Promedio global</div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-4 gap-3">
            <button onClick={() => setVista('empresa')} className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 transition-all">
              <Building2 className="w-8 h-8 text-blue-400" />
              <div className="text-left"><div className="text-white font-medium">Por Empresa</div><div className="text-slate-400 text-xs">TROB, WE, SHI</div></div>
              <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
            </button>
            <button onClick={() => setVista('segmento')} className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 transition-all">
              <Users className="w-8 h-8 text-emerald-400" />
              <div className="text-left"><div className="text-white font-medium">Por Segmento</div><div className="text-slate-400 text-xs">7 segmentos</div></div>
              <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
            </button>
            <button onClick={() => setVista('semanas')} className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 transition-all">
              <Calendar className="w-8 h-8 text-orange-400" />
              <div className="text-left"><div className="text-white font-medium">Por Semana</div><div className="text-slate-400 text-xs">52 semanas</div></div>
              <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
            </button>
            <button onClick={() => setVista('buscar')} className="flex items-center gap-3 p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 transition-all">
              <Search className="w-8 h-8 text-purple-400" />
              <div className="text-left"><div className="text-white font-medium">Buscar Tracto</div><div className="text-slate-400 text-xs">Por número</div></div>
              <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
            </button>
          </div>

          {/* Grid: Empresas + Segmentos */}
          <div className="grid grid-cols-2 gap-6">
            {/* Empresas */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Empresas - {datosMes.nombre}
              </h3>
              <div className="space-y-3">
                {EMPRESAS.map(emp => (
                  <div key={emp.nombre} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">{emp.nombre}</div>
                      <div className="text-slate-400 text-xs">{emp.unidades} unidades • {formatPct(emp.pct_flota)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{formatMoney(metaEmpresaMes(emp.nombre), true)}</div>
                      {showComparativo && <div className="text-emerald-400 text-xs">Real: $0</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Segmentos */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Segmentos - {datosMes.nombre}
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {SEGMENTOS.map(seg => (
                  <div key={seg.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer" onClick={() => { setSegmentoFiltro(seg.id); setVista('segmento'); }}>
                    <div>
                      <div className="text-white font-medium">{seg.nombre}</div>
                      <div className="text-slate-400 text-xs">{tractoresFacturanSegmento(seg.id)} tractores • $/T: {formatMoney(seg.tracto_mes, true)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{formatMoney(metaSegmentoMes(seg.id), true)}</div>
                      {showComparativo && <div className="text-emerald-400 text-xs">Real: $0</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Semanas del Mes */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              Semanas de {datosMes.nombre}
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {semanasMes.slice(0, 5).map(sem => (
                <div key={sem.semana} className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-orange-400 text-xs mb-1">Sem {sem.semana}</div>
                  <div className="text-white font-bold">{formatMoney(sem.meta_total, true)}</div>
                  <div className="text-slate-400 text-xs">{sem.inicio} - {sem.fin}</div>
                  <div className="text-slate-500 text-xs mt-1">Acum: {formatMoney(sem.acumulado, true)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Herramientas */}
          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => setVista('mover')} className="flex items-center gap-3 p-4 bg-amber-600/20 hover:bg-amber-600/30 rounded-xl border border-amber-500/30 transition-all">
              <ArrowRightLeft className="w-6 h-6 text-amber-400" />
              <div className="text-left"><div className="text-white font-medium">Mover Tracto</div><div className="text-amber-300 text-xs">Cambiar de segmento</div></div>
            </button>
            <button onClick={() => setVista('simulador')} className="flex items-center gap-3 p-4 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-xl border border-cyan-500/30 transition-all">
              <Calculator className="w-6 h-6 text-cyan-400" />
              <div className="text-left"><div className="text-white font-medium">Simulador</div><div className="text-cyan-300 text-xs">¿Qué pasa si +1/-1?</div></div>
            </button>
            <button className="flex items-center gap-3 p-4 bg-red-600/20 hover:bg-red-600/30 rounded-xl border border-red-500/30 transition-all">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div className="text-left"><div className="text-white font-medium">Alertas</div><div className="text-red-300 text-xs">{tractores.filter(t => !t.factura).length} sin facturar</div></div>
            </button>
          </div>
        </div>
      )}

      {/* Vista Empresas */}
      {vista === 'empresa' && (
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-white">Desglose por Empresa - {datosMes.nombre}</h2>
          {EMPRESAS.map(emp => (
            <div key={emp.nombre} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{emp.nombre}</h3>
                  <p className="text-slate-400 text-sm">{emp.unidades} unidades • {formatPct(emp.pct_flota)} de flota</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{formatMoney(metaEmpresaMes(emp.nombre), true)}</div>
                  <div className="text-slate-400 text-sm">Meta {datosMes.nombre}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">Meta Anual</div>
                  <div className="text-white font-bold">{formatMoney(emp.ppto_anual, true)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">Meta Semana</div>
                  <div className="text-white font-bold">{formatMoney(metaEmpresaMes(emp.nombre) / 4, true)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">Meta Día</div>
                  <div className="text-white font-bold">{formatMoney(metaEmpresaMes(emp.nombre) / 30, true)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">Acumulado YTD</div>
                  <div className="text-white font-bold">{formatMoney(emp.ppto_anual * (mesSeleccionado / 12), true)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Segmentos */}
      {vista === 'segmento' && (
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-white">Desglose por Segmento - {datosMes.nombre}</h2>
          {SEGMENTOS.filter(s => !segmentoFiltro || s.id === segmentoFiltro).map(seg => (
            <div key={seg.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{seg.nombre}</h3>
                  <p className="text-slate-400 text-sm">{tractoresFacturanSegmento(seg.id)} tractores facturando • {formatPct(seg.pct_ppto)}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{formatMoney(metaSegmentoMes(seg.id), true)}</div>
                  <div className="text-emerald-400 text-sm">$/Tracto: {formatMoney(seg.tracto_mes, true)}</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">Meta Anual</div>
                  <div className="text-white font-bold">{formatMoney(seg.ppto_anual, true)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">Meta Semana</div>
                  <div className="text-white font-bold">{formatMoney(metaSegmentoMes(seg.id) / 4, true)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">$/Tracto/Día</div>
                  <div className="text-white font-bold">{formatMoney(seg.tracto_mes / 30, true)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">$/Tracto/Semana</div>
                  <div className="text-white font-bold">{formatMoney(seg.tracto_mes / 4, true)}</div>
                </div>
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-slate-400 text-xs">$/Tracto/Año</div>
                  <div className="text-white font-bold">{formatMoney(seg.tracto_mes * 12, true)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Semanas */}
      {vista === 'semanas' && (
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">52 Semanas de 2026</h2>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-slate-400">Sem</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-400">Período</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400">Meta Total</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400">SPEEDYHAUL</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400">TROB</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400">WEXPRESS</th>
                    <th className="px-4 py-3 text-right text-xs text-slate-400">Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {SEMANAS.map(sem => (
                    <tr key={sem.semana} className="hover:bg-slate-700/30">
                      <td className="px-4 py-2 text-orange-400 font-medium">{sem.semana}</td>
                      <td className="px-4 py-2 text-slate-300">{sem.inicio} - {sem.fin}</td>
                      <td className="px-4 py-2 text-right text-white font-bold">{formatMoney(sem.meta_total, true)}</td>
                      <td className="px-4 py-2 text-right text-blue-300">{formatMoney(sem.speedyhaul, true)}</td>
                      <td className="px-4 py-2 text-right text-purple-300">{formatMoney(sem.trob, true)}</td>
                      <td className="px-4 py-2 text-right text-emerald-300">{formatMoney(sem.wexpress, true)}</td>
                      <td className="px-4 py-2 text-right text-slate-400">{formatMoney(sem.acumulado, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vista Buscar */}
      {vista === 'buscar' && (
        <div className="p-6">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Buscar Tracto</h3>
              <div className="flex gap-3">
                <input type="number" placeholder="Número de tracto" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
                <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium">Buscar</button>
              </div>
            </div>
            {tractoEncontrado && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-slate-400 text-sm">Tracto</span>
                    <h2 className="text-3xl font-bold text-white">{tractoEncontrado.numero}</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm text-white ${tractoEncontrado.empresa === 'TROB' ? 'bg-blue-600' : tractoEncontrado.empresa === 'WEXPRESS' ? 'bg-purple-600' : 'bg-emerald-600'}`}>{tractoEncontrado.empresa}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><span className="text-slate-400 text-xs">Segmento</span><p className="text-white font-medium">{SEGMENTOS.find(s => s.id === tractoEncontrado.segmento)?.nombre}</p></div>
                  <div><span className="text-slate-400 text-xs">Estatus</span><p className={`font-medium ${tractoEncontrado.factura ? 'text-green-400' : 'text-red-400'}`}>{tractoEncontrado.estatus}</p></div>
                </div>
                {tractoEncontrado.factura && (() => {
                  const seg = SEGMENTOS.find(s => s.id === tractoEncontrado.segmento);
                  return seg && (
                    <div className="border-t border-slate-700 pt-4">
                      <h4 className="text-sm text-slate-300 mb-3">Metas - {datosMes.nombre}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-700/50 rounded-lg p-3"><div className="text-slate-400 text-xs">Meta/Mes</div><div className="text-lg font-bold text-white">{formatMoney(seg.tracto_mes)}</div></div>
                        <div className="bg-slate-700/50 rounded-lg p-3"><div className="text-slate-400 text-xs">Meta/Día</div><div className="text-lg font-bold text-white">{formatMoney(seg.tracto_mes / 30)}</div></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista Mover Tracto */}
      {vista === 'mover' && (
        <div className="p-6">
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                Mover Tracto entre Segmentos
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Número de Tracto</label>
                  <input type="number" value={tractoMover || ''} onChange={e => setTractoMover(Number(e.target.value))} placeholder="Ej: 511" className="w-full mt-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Segmento Destino</label>
                  <select value={segmentoDestino} onChange={e => setSegmentoDestino(e.target.value)} className="w-full mt-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
                    <option value="">Seleccionar segmento...</option>
                    {SEGMENTOS.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                {tractoMover && segmentoDestino && (
                  <div className="p-4 bg-amber-500/20 rounded-lg border border-amber-500/30">
                    <p className="text-amber-300 text-sm">
                      El tracto {tractoMover} se moverá a <strong>{SEGMENTOS.find(s => s.id === segmentoDestino)?.nombre}</strong>.
                      Las metas se recalcularán automáticamente.
                    </p>
                  </div>
                )}
                <button onClick={handleMoverTracto} disabled={!tractoMover || !segmentoDestino} className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium">
                  Confirmar Movimiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista Simulador */}
      {vista === 'simulador' && (
        <div className="p-6">
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-cyan-400" />
                Simulador: ¿Qué pasa si +1/-1 Tracto?
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">Segmento</label>
                  <select value={simSegmento} onChange={e => setSimSegmento(e.target.value)} className="w-full mt-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white">
                    {SEGMENTOS.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">Cambio de Tractores</label>
                  <div className="flex gap-2 mt-1">
                    {[-3, -2, -1, 0, 1, 2, 3].map(n => (
                      <button key={n} onClick={() => setSimCambio(n)} className={`flex-1 py-2 rounded-lg font-medium ${simCambio === n ? (n < 0 ? 'bg-red-500 text-white' : n > 0 ? 'bg-green-500 text-white' : 'bg-slate-500 text-white') : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                        {n > 0 ? `+${n}` : n}
                      </button>
                    ))}
                  </div>
                </div>
                {simulacion && (
                  <div className="p-4 bg-cyan-500/20 rounded-lg border border-cyan-500/30 space-y-3">
                    <h4 className="text-cyan-300 font-medium">{simulacion.segmento}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-slate-400 text-xs">Tractores Actuales</div>
                        <div className="text-white font-bold">{simulacion.tractoresActuales}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">Tractores Nuevos</div>
                        <div className="text-white font-bold">{simulacion.nuevosTractores}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">$/Tracto/Mes Actual</div>
                        <div className="text-white font-bold">{formatMoney(simulacion.tractoMesActual)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">$/Tracto/Mes Nuevo</div>
                        <div className="text-white font-bold">{formatMoney(simulacion.tractoMesNuevo)}</div>
                      </div>
                    </div>
                    <div className={`text-center py-2 rounded-lg ${simulacion.diferencia > 0 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                      Diferencia: {simulacion.diferencia > 0 ? '+' : ''}{formatMoney(simulacion.diferencia)} por tracto
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
