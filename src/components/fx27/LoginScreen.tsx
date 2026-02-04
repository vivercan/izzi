import { useState } from 'react';

interface LoginScreenProps {
  onGoogleSignIn: () => void;
  loginError?: string;
  googleLoading?: boolean;
}

export const LoginScreen = ({
  onGoogleSignIn,
  loginError,
  googleLoading = false,
}: LoginScreenProps) => {

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background - Gradiente AZUL ELÉCTRICO (MISMO QUE DASHBOARD) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)',
          opacity: 1,
        }}
      />

      {/* FX27 Logo & Background - ALINEADO A LA DERECHA */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-start"
        style={{ paddingLeft: "58%", paddingTop: "-200px" }}
      >
        <div className="relative flex flex-col items-end">
          <div
            className="text-[240px] font-black leading-none opacity-25"
            style={{ 
              fontFamily: "Exo 2, sans-serif",
              color: 'white'
            }}
          >
            FX27
          </div>
          <div
            className="uppercase"
            style={{ 
              fontFamily: "Exo 2, sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.3em',
              marginTop: '12px',
              color: 'rgba(200, 220, 240, 0.6)',
              textAlign: 'right',
            }}
          >
            Future Experience 27
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div
        className="relative z-10 flex items-center w-full h-full"
        style={{ paddingRight: "60%", paddingTop: "60px" }}
      >
        <div
          className="w-[520px] rounded-[var(--radius-lg)] px-8 pt-6 pb-6 flex flex-col gap-5 ml-auto mr-auto"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(40px) saturate(150%)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderTop: "1px solid rgba(255, 255, 255, 0.25)",
            WebkitBackdropFilter: "blur(40px) saturate(150%)",
          }}
        >
          {/* Title */}
          <div>
            <h2
              className="text-[var(--fx-text)]"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontWeight: 600,
                fontSize: "24px",
                lineHeight: "32px",
                marginBottom: "4px",
              }}
            >
              Bienvenido
            </h2>
            <p
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: "13px",
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0,
              }}
            >
              Inicia sesión con tu cuenta corporativa de Google
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div
              className="px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: "13px",
              }}
            >
              {loginError}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#333',
              cursor: googleLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              opacity: googleLoading ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            }}
          >
            {!googleLoading && (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Conectando...' : 'Iniciar con Google'}
          </button>

          {/* Authorized domains note */}
          <p
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: "11px",
              color: 'rgba(255, 255, 255, 0.35)',
              textAlign: 'center',
              margin: '-4px 0 0',
            }}
          >
            Solo cuentas autorizadas @trob.com.mx · @wexpress.com.mx · @speedyhaul.com.mx
          </p>
        </div>
      </div>

      {/* Footer text */}
      <div className="absolute bottom-4 right-6 z-20">
        <p
          className="text-white"
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: "10px",
            lineHeight: "1",
            whiteSpace: "nowrap",
          }}
        >
          FX27® v12.5 Grupo Loma 2025 hola@trob.com.mx
          Operación inteligente... Resultados reales.
        </p>
      </div>
    </div>
  );
};
