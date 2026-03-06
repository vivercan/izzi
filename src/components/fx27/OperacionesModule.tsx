/**
 * FX27 — Módulo Operaciones / Torre de Control
 * Conecta directo con ANODOS API (solo lectura)
 *
 * REQUIERE en .env:
 *   VITE_ANODOS_API_URL=http://34.127.23.213:5216
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Viaje {
  idViaje?: number;
  NumeroViaje?: string;
  Tracto?: string;
  Caja?: string;
  Operador?: string;
  Cliente?: string;
  Tipo?: string;
  Origen?: string;
  Destino?: string;
  Cruce?: string;
  IniciaViaje?: string;
  LlegaDestino?: string;
  Disponible?: string | null;
  KmsViaje?: number;
  idFormatoVenta?: number;
  Empresa?: string;
  Estatus?: string;
  CitaCarga?: string;
  CitaEntrega?: string;
}

interface ViajeRich extends Viaje {
  _horasOcioso: number;
  _esOcioso: boolean;
  _enRiesgo: boolean;
  _disponibleEstimado: string;
}

interface ClienteAnodos {
  idCliente?: number;
  RazonSocial?: string;
  RFC?: string;
  DiasCredito?: number;
  Ejecutivo?: string;
  Ciudad?: string;
  Estado?: string;
  Domicilio?: string;
}

interface Props {
  onBack: () => void;
  userRole?: string;
  userEmail?: string;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const BASE = (import.meta as any).env?.VITE_ANODOS_API_URL ?? 'http://34.127.23.213:5216';
const COSTO_DIA = 12500;

const TIPO_COLOR: Record<string, string> = {
  NAC:   '#3b82f6',
  IMPO:  '#a855f7',
  EXPO:  '#22c55e',
  VACIO: '#f97316',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getFechas() {
  const hoy = new Date();
  const ini = new Date(hoy); ini.setDate(hoy.getDate() - 7);
  const fin = new Date(hoy); fin.setDate(hoy.getDate() + 6);
  const f = (d: Date) => d.toISOString().split('T')[0] + 'T00:00:00';
  return { fechaInicio: f(ini), fechaFin: f(fin) };
}

function horasDesde(s?: string | null): number {
  if (!s) return 0;
  const d = new Date(s);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, (Date.now() - d.getTime()) / 3_600_000);
}

function fmtF(s?: string | null): string {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtMXN(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

function enriquecer(v: Viaje): ViajeRich {
  const horas = horasDesde(v.Disponible);
  let estimado = '—';
  if (v.LlegaDestino) {
    const d = new Date(v.LlegaDestino);
    d.setHours(d.getHours() + 6);
    estimado = fmtF(d.toISOString());
  }
  return {
    ...v,
    _horasOcioso: horas,
    _esOcioso: !!v.Disponible && horas >= 24,
    _enRiesgo: !v.Disponible && !!v.LlegaDestino && horasDesde(v.LlegaDestino) > 2,
    _disponibleEstimado: estimado,
  };
}

// ─── COMPONENTES PEQUEÑOS ─────────────────────────────────────────────────────

function Badge({ tipo }: { tipo?: string }) {
  const t = tipo || '?';
  const color = TIPO_COLOR[t] || '#64748b';
  return (
    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color + '22', color }}>{t}</span>
  );
}

function NivelBadge({ horas }: { horas: number }) {
  const [label, color] =
    horas >= 72 ? ['CRÍTICO', '#ef4444'] :
    horas >= 48 ? ['URGENTE', '#f97316'] :
    horas >= 24 ? ['ALERTA',  '#eab308'] :
                  ['OK',      '#22c55e'];
  return (
    <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 800, background: color + '22', color, border: `1px solid ${color}44` }}>{label}</span>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60, gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'anodosspin .7s linear infinite' }} />
      <span style={{ color: '#64748b', fontSize: 13 }}>Conectando con ANODOS...</span>
      <style>{`@keyframes anodosspin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── PANTALLA 1 — RESUMEN ─────────────────────────────────────────────────────

function PantallaResumen({ viajes, clientes }: { viajes: ViajeRich[]; clientes: ClienteAnodos[] }) {
  const total       = viajes.length;
  const enTransito  = viajes.filter(v => !v.Disponible).length;
  const disponibles = viajes.filter(v => !!v.Disponible && !v._esOcioso).length;
  const ociosos     = viajes.filter(v => v._esOcioso).length;
  const enRiesgo    = viajes.filter(v => v._enRiesgo).length;
  const sinCaja     = viajes.filter(v => !v.Caja && !v.Disponible).length;
  const costoOcio   = viajes.filter(v => v._esOcioso).reduce((s, v) => s + (v._horasOcioso / 24) * COSTO_DIA, 0);

  const nac   = viajes.filter(v => v.Tipo === 'NAC').length;
  const impo  = viajes.filter(v => v.Tipo === 'IMPO').length;
  const expo  = viajes.filter(v => v.Tipo === 'EXPO').length;
  const vacio = viajes.filter(v => v.Tipo === 'VACIO').length;

  const horizontes = [0, 12, 24, 48, 72, 120].map(h => {
    const hasta = new Date(Date.now() + h * 3_600_000);
    const count = viajes.filter(v => {
      if (v.Disponible) return new Date(v.Disponible) <= hasta;
      if (v.LlegaDestino) {
        const est = new Date(v.LlegaDestino); est.setHours(est.getHours() + 6);
        return est <= hasta;
      }
      return false;
    }).length;
    return { label: h === 0 ? 'Ahora' : `+${h}h`, count };
  });

  const vol: Record<string, number> = {};
  viajes.forEach(v => { if (v.Cliente) vol[v.Cliente] = (vol[v.Cliente] || 0) + 1; });
  const top = Object.entries(vol).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const Card = ({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) => (
    <div style={{ background: '#1e293b', border: `1px solid ${color}33`, borderRadius: 10, padding: '16px 20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#e2e8f0', marginTop: 5, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <Card label="Total Viajes"    value={total}       color="#3b82f6" sub="últimos 7 días" />
        <Card label="En Tránsito"     value={enTransito}  color="#6366f1" sub="sin disponibilidad" />
        <Card label="Disponibles"     value={disponibles} color="#22c55e" sub="listos para asignar" />
        <Card label="Ociosos +24h"    value={ociosos}     color="#ef4444" sub={fmtMXN(costoOcio) + ' pérdida'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <Card label="Citas en Riesgo"       value={enRiesgo}         color="#f97316" sub="ETA vencido" />
        <Card label="Sin Remolque"          value={sinCaja}          color="#eab308" sub="tractos sin caja" />
        <Card label="Clientes en Catálogo"  value={clientes.length}  color="#64748b" sub="ANODOS obtenerClientes" />
      </div>

      {/* Horizonte */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          Horizonte de Capacidad — Unidades que quedarán disponibles
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
          {horizontes.map(h => (
            <div key={h.label} style={{ textAlign: 'center', background: '#0f172a', borderRadius: 8, padding: '12px 8px' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{h.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: h.count > 10 ? '#22c55e' : h.count > 4 ? '#eab308' : '#ef4444' }}>{h.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Por tipo */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Por Tipo de Operación</div>
          {[['NAC', nac, '#3b82f6'], ['IMPO', impo, '#a855f7'], ['EXPO', expo, '#22c55e'], ['VACIO', vacio, '#f97316']].map(([tipo, count, color]) => (
            <div key={tipo as string} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: color as string, fontWeight: 700 }}>{tipo}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{count} ({Math.round((count as number) / (total || 1) * 100)}%)</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count as number) / (total || 1) * 100}%`, background: color as string, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Top clientes */}
        <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Top Clientes por Viajes</div>
          {top.map(([nombre, count]) => (
            <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#e2e8f0', width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</span>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${count / (top[0]?.[1] || 1) * 100}%`, background: '#3b82f6', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: '#64748b', width: 22, textAlign: 'right' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PANTALLA 2 — VIAJES ACTIVOS ──────────────────────────────────────────────

function PantallaViajes({ viajes }: { viajes: ViajeRich[] }) {
  const [q, setQ]       = useState('');
  const [tipo, setTipo] = useState('TODOS');
  const [pag, setPag]   = useState(1);
  const PX = 25;

  const filtrados = useMemo(() => {
    let r = viajes;
    if (tipo !== 'TODOS') r = r.filter(v => v.Tipo === tipo);
    if (q) {
      const lq = q.toLowerCase();
      r = r.filter(v => [v.Tracto, v.Caja, v.Cliente, v.Origen, v.Destino, v.Operador, v.NumeroViaje].some(f => f?.toLowerCase().includes(lq)));
    }
    return r;
  }, [viajes, q, tipo]);

  const paginas = Math.ceil(filtrados.length / PX);
  const items   = filtrados.slice((pag - 1) * PX, pag * PX);

  const th: React.CSSProperties = { padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.07)' };
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => { setQ(e.target.value); setPag(1); }}
          placeholder="Buscar tracto, caja, cliente, ruta, operador..."
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 12px', color: '#e2e8f0', fontSize: 13, width: 320, outline: 'none' }} />
        {['TODOS','NAC','IMPO','EXPO','VACIO'].map(t => (
          <button key={t} onClick={() => { setTipo(t); setPag(1); }} style={{
            padding: '6px 13px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: tipo === t ? `1px solid ${TIPO_COLOR[t] || '#3b82f6'}` : '1px solid rgba(255,255,255,0.1)',
            background: tipo === t ? (TIPO_COLOR[t] || '#3b82f6') + '22' : '#1e293b',
            color: tipo === t ? (TIPO_COLOR[t] || '#60a5fa') : '#94a3b8',
          }}>{t}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>{filtrados.length} registros</span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: '#1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#Viaje','Tracto','Caja','Tipo','Cliente','Origen','Destino','Operador','Inicia','Llega','Disponible','Kms'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((v, i) => (
              <tr key={v.idViaje || i}
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: v._esOcioso ? 'rgba(239,68,68,0.05)' : 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = v._esOcioso ? 'rgba(239,68,68,0.05)' : 'transparent')}
              >
                <td style={{ ...td, color: '#64748b', fontFamily: 'monospace' }}>{v.NumeroViaje || v.idViaje || '—'}</td>
                <td style={{ ...td, color: '#f1f5f9', fontWeight: 700 }}>{v.Tracto || '—'}</td>
                <td style={{ ...td, color: v.Caja ? '#94a3b8' : '#475569' }}>{v.Caja || 'Sin caja'}</td>
                <td style={td}><Badge tipo={v.Tipo} /></td>
                <td style={{ ...td, color: '#e2e8f0', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.Cliente || '—'}</td>
                <td style={{ ...td, color: '#94a3b8' }}>{v.Origen || '—'}</td>
                <td style={{ ...td, color: '#94a3b8' }}>{v.Destino || '—'}</td>
                <td style={{ ...td, color: '#64748b' }}>{v.Operador || '—'}</td>
                <td style={{ ...td, color: '#64748b' }}>{fmtF(v.IniciaViaje)}</td>
                <td style={{ ...td, color: '#64748b' }}>{fmtF(v.LlegaDestino)}</td>
                <td style={td}>
                  {v.Disponible
                    ? <span style={{ color: '#4ade80', fontWeight: 600 }}>{fmtF(v.Disponible)}</span>
                    : v._enRiesgo
                    ? <span style={{ color: '#f97316' }}>⚠ En riesgo</span>
                    : <span style={{ color: '#475569' }}>En ruta</span>}
                </td>
                <td style={{ ...td, color: '#475569' }}>{v.KmsViaje ? `${v.KmsViaje.toLocaleString()} km` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginas > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <button onClick={() => setPag(p => Math.max(1, p - 1))} disabled={pag === 1}
            style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>← Ant</button>
          <span style={{ color: '#64748b', fontSize: 12 }}>Pág {pag} / {paginas}</span>
          <button onClick={() => setPag(p => Math.min(paginas, p + 1))} disabled={pag === paginas}
            style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>Sig →</button>
        </div>
      )}
    </div>
  );
}

// ─── PANTALLA 3 — TRACTOS SIN ASIGNACIÓN ─────────────────────────────────────

function PantallaSinAsignacion({ viajes }: { viajes: ViajeRich[] }) {
  const ociosos = viajes.filter(v => v._esOcioso).sort((a, b) => b._horasOcioso - a._horasOcioso);
  const totalPerdida = ociosos.reduce((s, v) => s + (v._horasOcioso / 24) * COSTO_DIA, 0);

  const th: React.CSSProperties = { padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#fca5a5', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(239,68,68,0.15)' };
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fca5a5' }}>
            {ociosos.length} tracto{ociosos.length !== 1 ? 's' : ''} sin asignación nueva (+24h disponible)
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
            Pérdida acumulada estimada: <strong style={{ color: '#ef4444' }}>{fmtMXN(totalPerdida)}</strong> a {fmtMXN(COSTO_DIA)}/día
          </div>
        </div>
        {ociosos.length === 0 && <span style={{ fontSize: 20, color: '#22c55e' }}>✓ Sin tractos ociosos</span>}
      </div>

      {ociosos.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: '#1e293b' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(239,68,68,0.08)' }}>
                {['Tracto','Caja','Tipo','Empresa','Último Destino','Disponible Desde','Horas Ocioso','Costo','Nivel'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ociosos.map((v, i) => {
                const costo = (v._horasOcioso / 24) * COSTO_DIA;
                return (
                  <tr key={v.idViaje || i} style={{ borderTop: '1px solid rgba(239,68,68,0.08)' }}>
                    <td style={{ ...td, color: '#f1f5f9', fontWeight: 800 }}>{v.Tracto || '—'}</td>
                    <td style={{ ...td, color: '#94a3b8' }}>{v.Caja || '—'}</td>
                    <td style={td}><Badge tipo={v.Tipo} /></td>
                    <td style={{ ...td, color: '#64748b' }}>{v.Empresa || '—'}</td>
                    <td style={{ ...td, color: '#94a3b8' }}>{v.Destino || '—'}</td>
                    <td style={{ ...td, color: '#fca5a5' }}>{fmtF(v.Disponible)}</td>
                    <td style={{ ...td, color: '#ef4444', fontWeight: 800 }}>{Math.round(v._horasOcioso)}h</td>
                    <td style={{ ...td, color: '#ef4444', fontWeight: 700 }}>{fmtMXN(costo)}</td>
                    <td style={td}><NivelBadge horas={v._horasOcioso} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PANTALLA 4 — CAJAS SIN PLAN ─────────────────────────────────────────────

function PantallaCajasSinPlan({ viajes }: { viajes: ViajeRich[] }) {
  const sinCaja      = viajes.filter(v => !v.Caja && !v.Disponible);
  const cajasOciosas = viajes.filter(v => !!v.Caja && v._esOcioso);

  const th: React.CSSProperties = { padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#fde68a', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(234,179,8,0.15)' };
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 12, whiteSpace: 'nowrap' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tractos sin remolque */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fde68a', marginBottom: 10 }}>
          Tractos en tránsito sin remolque asignado: {sinCaja.length}
        </div>
        {sinCaja.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(234,179,8,0.2)', background: '#1e293b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(234,179,8,0.07)' }}>
                  {['Tracto','Tipo','Cliente','Origen','Destino','Inicia','Disponible Estimado'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sinCaja.map((v, i) => (
                  <tr key={v.idViaje || i} style={{ borderTop: '1px solid rgba(234,179,8,0.08)' }}>
                    <td style={{ ...td, color: '#f1f5f9', fontWeight: 700 }}>{v.Tracto || '—'}</td>
                    <td style={td}><Badge tipo={v.Tipo} /></td>
                    <td style={{ ...td, color: '#e2e8f0' }}>{v.Cliente || '—'}</td>
                    <td style={{ ...td, color: '#94a3b8' }}>{v.Origen || '—'}</td>
                    <td style={{ ...td, color: '#94a3b8' }}>{v.Destino || '—'}</td>
                    <td style={{ ...td, color: '#64748b' }}>{fmtF(v.IniciaViaje)}</td>
                    <td style={{ ...td, color: '#eab308' }}>{v._disponibleEstimado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#22c55e', fontSize: 13 }}>✓ Todos los tractos en tránsito tienen remolque</div>
        )}
      </div>

      {/* Cajas ociosas */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fde68a', marginBottom: 10 }}>
          Cajas disponibles sin siguiente plan asignado: {cajasOciosas.length}
        </div>
        {cajasOciosas.length > 0 ? (
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(234,179,8,0.2)', background: '#1e293b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(234,179,8,0.07)' }}>
                  {['Caja','Tracto','Tipo','Último Cliente','Última Ubicación','Disponible Desde','Horas sin plan'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cajasOciosas.map((v, i) => (
                  <tr key={v.idViaje || i} style={{ borderTop: '1px solid rgba(234,179,8,0.08)' }}>
                    <td style={{ ...td, color: '#f1f5f9', fontWeight: 700 }}>{v.Caja}</td>
                    <td style={{ ...td, color: '#94a3b8' }}>{v.Tracto || '—'}</td>
                    <td style={td}><Badge tipo={v.Tipo} /></td>
                    <td style={{ ...td, color: '#e2e8f0' }}>{v.Cliente || '—'}</td>
                    <td style={{ ...td, color: '#94a3b8' }}>{v.Destino || '—'}</td>
                    <td style={{ ...td, color: '#fde68a' }}>{fmtF(v.Disponible)}</td>
                    <td style={{ ...td, color: '#eab308', fontWeight: 700 }}>{Math.round(v._horasOcioso)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: '#22c55e', fontSize: 13 }}>✓ Sin cajas ociosas detectadas</div>
        )}
      </div>
    </div>
  );
}

// ─── PANTALLA 5 — CAPACIDAD FUTURA ───────────────────────────────────────────

function PantallaCapacidad({ viajes }: { viajes: ViajeRich[] }) {
  const dias = useMemo(() => {
    const result = [];
    for (let i = 0; i <= 5; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const key   = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' :
        d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });

      const disponibles = viajes.filter(v => {
        if (v.Disponible) return v.Disponible.split('T')[0] <= key;
        if (v.LlegaDestino) {
          const est = new Date(v.LlegaDestino); est.setHours(est.getHours() + 6);
          return est.toISOString().split('T')[0] <= key;
        }
        return false;
      });

      const porCiudad: Record<string, { secas: number; termos: number; total: number }> = {};
      disponibles.forEach(v => {
        const ciudad = v.Destino?.split(',')[0]?.trim() || v.Origen?.split(',')[0]?.trim() || 'Sin ciudad';
        if (!porCiudad[ciudad]) porCiudad[ciudad] = { secas: 0, termos: 0, total: 0 };
        const esTermo = v.Caja ? /^[RT]/i.test(v.Caja) : false;
        if (esTermo) porCiudad[ciudad].termos++; else porCiudad[ciudad].secas++;
        porCiudad[ciudad].total++;
      });

      result.push({ key, label, total: disponibles.length, porCiudad, isToday: i === 0 });
    }
    return result;
  }, [viajes]);

  const maxTotal = Math.max(...dias.map(d => d.total), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
        Proyección: disponible_estimado = LlegaDestino + 6h. Secas/Termos según prefijo de caja (R/T = termo).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }}>
        {dias.map(d => (
          <div key={d.key} style={{
            background: '#1e293b',
            border: `1px solid ${d.isToday ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 8, padding: '14px 12px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: d.isToday ? '#60a5fa' : '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>{d.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: d.total > 10 ? '#22c55e' : d.total > 4 ? '#eab308' : '#ef4444' }}>{d.total}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>unidades</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${d.total / maxTotal * 100}%`, background: d.total > 10 ? '#22c55e' : d.total > 4 ? '#eab308' : '#ef4444', borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Capacidad HOY por Ciudad / Terminal
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 8 }}>
          {Object.entries(dias[0].porCiudad)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([ciudad, c]) => (
              <div key={ciudad} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ciudad}</div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div><div style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>{c.secas}</div><div style={{ fontSize: 10, color: '#64748b' }}>Secas</div></div>
                  <div><div style={{ fontSize: 20, fontWeight: 800, color: '#c084fc' }}>{c.termos}</div><div style={{ fontSize: 10, color: '#64748b' }}>Termos</div></div>
                </div>
              </div>
            ))}
          {Object.keys(dias[0].porCiudad).length === 0 && (
            <p style={{ color: '#475569', fontSize: 13 }}>Sin datos de disponibilidad para hoy.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PANTALLA 6 — CLIENTES ────────────────────────────────────────────────────

function PantallaClientes({ clientes, viajes }: { clientes: ClienteAnodos[]; viajes: ViajeRich[] }) {
  const [q, setQ] = useState('');

  const volPorCliente: Record<string, number> = {};
  viajes.forEach(v => { if (v.Cliente) volPorCliente[v.Cliente.toUpperCase()] = (volPorCliente[v.Cliente.toUpperCase()] || 0) + 1; });

  const filtrados = clientes.filter(c =>
    !q ||
    c.RazonSocial?.toLowerCase().includes(q.toLowerCase()) ||
    c.RFC?.toLowerCase().includes(q.toLowerCase()) ||
    c.Ejecutivo?.toLowerCase().includes(q.toLowerCase())
  );

  const th: React.CSSProperties = { padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.07)' };
  const td: React.CSSProperties = { padding: '8px 10px', fontSize: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar razón social, RFC, ejecutivo..."
          style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 12px', color: '#e2e8f0', fontSize: 13, width: 340, outline: 'none' }} />
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>{filtrados.length} clientes</span>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: '#1e293b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Razón Social','RFC','Ejecutivo','Días Crédito','Ciudad','Estado','Viajes (7d)'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c, i) => {
              const vol = volPorCliente[c.RazonSocial?.toUpperCase() || ''] || 0;
              return (
                <tr key={c.idCliente || i}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...td, color: '#f1f5f9', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.RazonSocial || '—'}</td>
                  <td style={{ ...td, color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{c.RFC || '—'}</td>
                  <td style={{ ...td, color: '#94a3b8' }}>{c.Ejecutivo || '—'}</td>
                  <td style={td}>
                    {c.DiasCredito != null
                      ? <span style={{ fontWeight: 700, color: c.DiasCredito === 0 ? '#ef4444' : c.DiasCredito <= 15 ? '#eab308' : '#22c55e' }}>{c.DiasCredito}d</span>
                      : <span style={{ color: '#475569' }}>—</span>}
                  </td>
                  <td style={{ ...td, color: '#64748b' }}>{c.Ciudad || '—'}</td>
                  <td style={{ ...td, color: '#64748b' }}>{c.Estado || '—'}</td>
                  <td style={td}>{vol > 0 ? <span style={{ color: '#60a5fa', fontWeight: 700 }}>{vol}</span> : <span style={{ color: '#334155' }}>0</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export function OperacionesModule({ onBack, userRole, userEmail }: Props) {
  const [tab, setTab]             = useState('resumen');
  const [viajes, setViajes]       = useState<ViajeRich[]>([]);
  const [clientes, setClientes]   = useState<ClienteAnodos[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { fechaInicio, fechaFin } = getFechas();
      const [r1, r2] = await Promise.all([
        fetch(`${BASE}/api/AnodosData/obtenerInformacionViajes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        fetch(`${BASE}/api/AnodosData/obtenerClientes`),
      ]);
      if (!r1.ok) throw new Error(`ANODOS viajes: HTTP ${r1.status}`);
      if (!r2.ok) throw new Error(`ANODOS clientes: HTTP ${r2.status}`);
      const vRaw = await r1.json();
      const cRaw = await r2.json();
      setViajes((Array.isArray(vRaw) ? vRaw : []).map(enriquecer));
      setClientes(Array.isArray(cRaw) ? cRaw : []);
      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e.message || 'Error conectando con ANODOS');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const t = setInterval(cargar, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [cargar]);

  const ociosos = viajes.filter(v => v._esOcioso).length;
  const alertas = viajes.filter(v => v._esOcioso || v._enRiesgo).length;

  const tabs = [
    { id: 'resumen',   label: 'Resumen',          count: null,           alert: false },
    { id: 'viajes',    label: 'Viajes Activos',   count: viajes.length,  alert: false },
    { id: 'sin-asig',  label: 'Sin Asignación',   count: ociosos,        alert: ociosos > 0 },
    { id: 'cajas',     label: 'Cajas Sin Plan',   count: null,           alert: false },
    { id: 'capacidad', label: 'Capacidad Futura', count: null,           alert: false },
    { id: 'clientes',  label: 'Clientes ANODOS',  count: clientes.length, alert: false },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          ← Volver
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>Operaciones</div>
          <div style={{ fontSize: 11, color: '#475569' }}>Torre de Control — Fuente: ANODOS API (solo lectura)</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {alertas > 0 && (
            <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#fca5a5', fontWeight: 700 }}>
              ⚠ {alertas} alertas activas
            </span>
          )}
          {updatedAt && <span style={{ fontSize: 11, color: '#475569' }}>Act: {updatedAt.toLocaleTimeString('es-MX')}</span>}
          <button onClick={cargar} disabled={loading} style={{
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 7, padding: '6px 14px', color: '#60a5fa', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>{loading ? '⟳ Cargando...' : '⟳ Actualizar'}</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', margin: '20px 28px', borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: 4 }}>⚠ Error conectando con ANODOS</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>{error}</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>
            Verifica <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 3 }}>VITE_ANODOS_API_URL=http://34.127.23.213:5216</code> en tu archivo .env
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 28px', background: '#1e293b' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 18px', cursor: 'pointer', border: 'none', fontSize: 13, fontWeight: 600,
            background: 'transparent', display: 'flex', alignItems: 'center', gap: 6,
            color: tab === t.id ? '#60a5fa' : '#64748b',
            borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: -1, transition: 'color .15s',
          }}>
            {t.label}
            {t.count != null && t.count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10,
                background: t.alert ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)',
                color: t.alert ? '#ef4444' : '#60a5fa',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ padding: '24px 28px' }}>
        {loading ? <Spinner /> : (
          <>
            {tab === 'resumen'   && <PantallaResumen viajes={viajes} clientes={clientes} />}
            {tab === 'viajes'    && <PantallaViajes viajes={viajes} />}
            {tab === 'sin-asig'  && <PantallaSinAsignacion viajes={viajes} />}
            {tab === 'cajas'     && <PantallaCajasSinPlan viajes={viajes} />}
            {tab === 'capacidad' && <PantallaCapacidad viajes={viajes} />}
            {tab === 'clientes'  && <PantallaClientes clientes={clientes} viajes={viajes} />}
          </>
        )}
      </div>
    </div>
  );
}
