// Componente Modal de Confirmación Disuasivo
// Se muestra antes de enviar la solicitud
// El cliente debe confirmar que entiende quién paga

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, X, Shield } from 'lucide-react';

interface Props {
  razonSocial: string;
  rfc: string;
  empresaFacturadora: string;
  idioma: 'es' | 'en';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ModalConfirmacionPago({
  razonSocial,
  rfc,
  empresaFacturadora,
  idioma,
  onConfirm,
  onCancel
}: Props) {
  const [checks, setChecks] = useState({
    check1: false,
    check2: false,
    check3: false,
    check4: false
  });

  const allChecked = checks.check1 && checks.check2 && checks.check3 && checks.check4;

  const T = {
    es: {
      title: 'CONFIRMACIÓN IMPORTANTE',
      subtitle: 'Antes de enviar su solicitud, confirme lo siguiente:',
      check1: `La empresa ${razonSocial} será quien PAGUE los servicios de transporte`,
      check2: `Las facturas se emitirán a nombre de ${razonSocial} con RFC ${rfc}`,
      check3: 'NO se aceptarán solicitudes de refacturación a otra razón social',
      check4: 'Los días de crédito aplican únicamente para esta empresa',
      warning: 'Al confirmar, usted declara bajo protesta de decir verdad que la información proporcionada es correcta y que la empresa registrada será la única responsable del pago de los servicios.',
      cancel: 'Cancelar',
      confirm: 'Confirmo y Acepto',
      mustAccept: 'Debe aceptar todos los puntos para continuar'
    },
    en: {
      title: 'IMPORTANT CONFIRMATION',
      subtitle: 'Before submitting your request, please confirm the following:',
      check1: `The company ${razonSocial} will PAY for transportation services`,
      check2: `Invoices will be issued to ${razonSocial} with Tax ID ${rfc}`,
      check3: 'Re-invoicing requests to another company will NOT be accepted',
      check4: 'Credit terms apply only to this company',
      warning: 'By confirming, you declare under penalty of perjury that the information provided is correct and that the registered company will be solely responsible for payment of services.',
      cancel: 'Cancel',
      confirm: 'I Confirm and Accept',
      mustAccept: 'You must accept all items to continue'
    }
  };

  const t = T[idioma];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1729] rounded-2xl border border-orange-500/30 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500/20 border-b border-orange-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-500/30 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-orange-400">{t.title}</h2>
                <p className="text-sm text-white/60">{t.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info de la empresa */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/50 block text-xs">{idioma === 'es' ? 'Empresa que paga:' : 'Company that pays:'}</span>
                <span className="text-blue-400 font-bold">{razonSocial}</span>
              </div>
              <div>
                <span className="text-white/50 block text-xs">{idioma === 'es' ? 'Facturar a:' : 'Invoice to:'}</span>
                <span className="text-orange-400 font-bold">{empresaFacturadora || 'GRUPO LOMA'}</span>
              </div>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            {[
              { key: 'check1', text: t.check1 },
              { key: 'check2', text: t.check2 },
              { key: 'check3', text: t.check3 },
              { key: 'check4', text: t.check4 }
            ].map(item => (
              <label 
                key={item.key}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  (checks as any)[item.key] 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={(checks as any)[item.key]}
                  onChange={e => setChecks({ ...checks, [item.key]: e.target.checked })}
                  className="mt-1 w-5 h-5 rounded"
                  style={{ accentColor: '#22c55e' }}
                />
                <span className={`text-sm ${(checks as any)[item.key] ? 'text-green-300' : 'text-white/80'}`}>
                  {(checks as any)[item.key] && <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-400" />}
                  {item.text}
                </span>
              </label>
            ))}
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-200/80">{t.warning}</p>
            </div>
          </div>

          {/* Mensaje si no ha aceptado todo */}
          {!allChecked && (
            <p className="text-center text-sm text-orange-400">{t.mustAccept}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-semibold bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!allChecked}
            className="flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ 
              background: allChecked 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                : 'rgba(255,255,255,0.1)' 
            }}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
