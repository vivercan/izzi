// Componente para CREAR SOLICITUD de Alta de Cliente
// Con checkboxes de empresa facturadora (TROB, WE, SHI, TROB USA)
// Ubicación: src/components/fx27/CrearSolicitudAlta.tsx

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Mail, Building2, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMPRESAS_FACTURADORAS = [
  { id: 'TROB', nombre: 'TROB TRANSPORTES', color: '#3b82f6' },
  { id: 'WE', nombre: 'WEXPRESS', color: '#22c55e' },
  { id: 'SHI', nombre: 'SPEEDYHAUL INTERNATIONAL', color: '#a855f7' },
  { id: 'TROB_USA', nombre: 'TROB USA LLC', color: '#ef4444' }
];

interface Props {
  usuarioCreador: string;
  onClose?: () => void;
  onCreated?: (id: string) => void;
}

export default function CrearSolicitudAlta({ usuarioCreador, onClose, onCreated }: Props) {
  const [emails, setEmails] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [tipoEmpresa, setTipoEmpresa] = useState<'MEXICANA' | 'USA_CANADA'>('MEXICANA');
  const [empresaFacturadora, setEmpresaFacturadora] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [linkGenerado, setLinkGenerado] = useState('');

  const handleSubmit = async () => {
    // Validaciones
    if (!nombreComercial.trim()) {
      setError('Ingrese el nombre comercial del cliente');
      return;
    }
    if (!nombreContacto.trim()) {
      setError('Ingrese el nombre del contacto');
      return;
    }
    if (!emails.trim()) {
      setError('Ingrese al menos un correo electrónico');
      return;
    }
    if (!empresaFacturadora) {
      setError('Seleccione la empresa facturadora');
      return;
    }

    setError('');
    setSending(true);

    try {
      // Crear la solicitud en BD - USANDO NOMBRES CORRECTOS DE COLUMNAS
      const { data: solicitud, error: insertError } = await supabase
        .from('alta_clientes')
        .insert({
          email_cliente: emails.split(',').map(e => e.trim())[0], // Primer email como principal
          emails_adicionales: emails.split(',').map(e => e.trim()).slice(1), // Resto como adicionales
          nombre_cliente: nombreContacto.trim(), // Nombre del contacto
          razon_social: nombreComercial.trim(), // Nombre comercial (se actualiza cuando IA extrae datos)
          tipo_empresa: tipoEmpresa,
          giro: empresaFacturadora, // Usamos giro para empresa facturadora
          enviado_por: usuarioCreador,
          estatus: 'ENVIADA'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const linkPublico = `https://www.jjcrm27.com/alta/${solicitud.id}`;
      setLinkGenerado(linkPublico);

      // Enviar correo al cliente
      try {
        await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            tipo: 'solicitud_cliente',
            solicitudId: solicitud.id,
            destinatarios: emails.split(',').map(e => e.trim()),
            nombreContacto: nombreContacto.trim(),
            nombreComercial: nombreComercial.trim(),
            linkFormulario: linkPublico,
            empresaFacturadora: EMPRESAS_FACTURADORAS.find(e => e.id === empresaFacturadora)?.nombre
          })
        });
      } catch (emailErr) {
        console.warn('Error enviando correo, pero solicitud creada:', emailErr);
      }

      setSent(true);
      onCreated?.(solicitud.id);

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al crear la solicitud');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div 
          className="rounded-2xl border p-8 max-w-md w-full text-center"
          style={{
            background: 'linear-gradient(145deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(34, 197, 94, 0.1)'
          }}
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Solicitud Enviada!</h2>
          <p className="text-white/70 mb-2">
            Se ha enviado el formulario de alta a:
          </p>
          <p className="text-orange-400 font-medium mb-1">{nombreComercial}</p>
          <p className="text-white/50 text-sm mb-4">Contacto: {nombreContacto} ({emails})</p>
          
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-xs text-white/50 mb-2">Link del formulario:</p>
            <p className="text-sm text-blue-400 break-all font-mono">{linkGenerado}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-white/50 mb-6">
            <Building2 className="w-4 h-4" />
            <span>Facturará: {EMPRESAS_FACTURADORAS.find(e => e.id === empresaFacturadora)?.nombre}</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div 
        className="rounded-2xl border p-8 w-full"
        style={{
          maxWidth: '800px',
          background: 'linear-gradient(145deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
          borderColor: 'rgba(254, 80, 0, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(254, 80, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}>
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nueva Solicitud de Alta</h2>
              <p className="text-sm text-white/50">Enviar formulario al cliente</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          )}
        </div>

        {/* Form - Grid de 2 columnas */}
        <div className="space-y-5">
          {/* Fila 1: Nombre Comercial + Nombre Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Nombre Comercial *
              </label>
              <input
                type="text"
                value={nombreComercial}
                onChange={e => setNombreComercial(e.target.value)}
                placeholder="Ej: Bimbo, Soriana, ACME"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/40 outline-none transition-colors"
                style={{
                  background: 'rgba(0, 20, 50, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(254, 80, 0, 0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
              <p className="text-xs text-white/40 mt-1">Referencia interna</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Nombre del Contacto *
              </label>
              <input
                type="text"
                value={nombreContacto}
                onChange={e => setNombreContacto(e.target.value)}
                placeholder="Ej: Lic. Roberto García"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/40 outline-none transition-colors"
                style={{
                  background: 'rgba(0, 20, 50, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(254, 80, 0, 0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
              />
              <p className="text-xs text-white/40 mt-1">Persona que recibirá el correo</p>
            </div>
          </div>

          {/* Fila 2: Correos (ancho completo) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Correo(s) del Cliente *
            </label>
            <input
              type="text"
              value={emails}
              onChange={e => setEmails(e.target.value)}
              placeholder="correo@cliente.com, otro@cliente.com"
              className="w-full px-4 py-3 rounded-xl text-white placeholder-white/40 outline-none transition-colors"
              style={{
                background: 'rgba(0, 20, 50, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(254, 80, 0, 0.5)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
            <p className="text-xs text-white/40 mt-1">Separe múltiples correos con coma</p>
          </div>

          {/* Fila 3: Tipo Empresa + Empresa Facturadora lado a lado */}
          <div className="grid grid-cols-2 gap-6">
            {/* Tipo de empresa */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Tipo de Empresa
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTipoEmpresa('MEXICANA')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    tipoEmpresa === 'MEXICANA' 
                      ? 'border-orange-500 bg-orange-500/10' 
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg font-bold block">MX</span>
                  <span className={`text-xs ${tipoEmpresa === 'MEXICANA' ? 'text-orange-400' : 'text-white/70'}`}>
                    Mexicana
                  </span>
                </button>
                <button
                  onClick={() => setTipoEmpresa('USA_CANADA')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    tipoEmpresa === 'USA_CANADA' 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg font-bold block">US</span>
                  <span className={`text-xs ${tipoEmpresa === 'USA_CANADA' ? 'text-blue-400' : 'text-white/70'}`}>
                    USA / Canadá
                  </span>
                </button>
              </div>
            </div>

            {/* Empresa Facturadora */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Empresa que Facturará *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EMPRESAS_FACTURADORAS.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setEmpresaFacturadora(emp.id)}
                    className={`p-2 rounded-lg border-2 transition-all text-left ${
                      empresaFacturadora === emp.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                        style={{ 
                          borderColor: empresaFacturadora === emp.id ? '#fe5000' : 'rgba(255,255,255,0.3)',
                          background: empresaFacturadora === emp.id ? '#fe5000' : 'transparent'
                        }}
                      />
                      <span className={`text-xs font-medium ${
                        empresaFacturadora === emp.id ? 'text-orange-400' : 'text-white/80'
                      }`}>
                        {emp.id}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 4: Aviso + Botón */}
          <div className="grid grid-cols-3 gap-4 items-center pt-2">
            {/* Aviso importante */}
            <div className="col-span-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <p className="text-xs text-white/70">
                  El cliente firmará que <strong className="text-yellow-400">esta empresa será quien pague</strong> y no solicitará refacturación.
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="h-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
