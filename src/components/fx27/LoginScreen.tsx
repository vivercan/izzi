import { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  loginError?: string;
}

export const LoginScreen = ({
  onLogin,
  loginError,
}: LoginScreenProps) => {
  const isDevelopment =
    typeof window !== 'undefined' &&
    (
      window.location.hostname === 'localhost' ||
      window.location.hostname.includes('figma') ||
      window.location.hostname.includes('fx27-mail')
    );

  const [email, setEmail] = useState(
    isDevelopment ? "juan.viveros@trob.com.mx" : ""
  );
  const [password, setPassword] = useState(
    isDevelopment ? "Mexico86" : ""
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUser, setRememberUser] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background - Gradiente AZUL ELÉCTRICO #10 (MISMO QUE DASHBOARD) */}
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
          {/* FX27 grande */}
          <div
            className="text-[240px] font-black leading-none opacity-25"
            style={{ 
              fontFamily: "Exo 2, sans-serif",
              color: 'white'
            }}
          >
            FX27
          </div>
          
          {/* Slogan - GRIS AZULADO ELEGANTE */}
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

      {/* Login Card - moved 25% to the left */}
      <div
        className="relative z-10 flex items-center w-full h-full"
        style={{ paddingRight: "60%", paddingTop: "60px" }}
      >
        <div
          className="w-[520px] rounded-[var(--radius-lg)] px-8 pt-5 pb-1.5 flex flex-col gap-3 ml-auto mr-auto"
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
          <h2
            className="text-[var(--fx-text)]"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontWeight: 600,
              fontSize: "24px",
              lineHeight: "32px",
              marginTop: "-14px",
              marginBottom: "-8px",
            }}
          >
            Bienvenido
          </h2>

          {/* Error Message */}
          {loginError && (
            <div
              className="px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: "13px",
                marginTop: "-4px",
                marginBottom: "-4px",
              }}
            >
              {loginError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
          >
            {/* Email Input */}
            <input
              type="email"
              placeholder={
                isDevelopment
                  ? "juan.viveros@trob.com.mx"
                  : "Correo electrónico"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-[var(--fx-text)] placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)] transition-colors"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: "14px",
              }}
            />

            {/* Password Input */}
            <input
              type={showPassword ? "text" : "password"}
              placeholder={isDevelopment ? "Mexico86" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-[var(--fx-text)] placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)] transition-colors"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: "14px",
              }}
            />

            {/* Checkboxes and Login Button */}
            <div
              className="flex items-center justify-between gap-4"
              style={{ marginTop: "-8px" }}
            >
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) =>
                      setShowPassword(e.target.checked)
                    }
                    className="w-4 h-4 rounded border-[var(--fx-muted)] bg-transparent accent-[var(--fx-primary)]"
                  />
                  <span
                    className="text-[var(--fx-muted)]"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: "13px",
                    }}
                  >
                    Mostrar contraseña
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberUser}
                    onChange={(e) =>
                      setRememberUser(e.target.checked)
                    }
                    className="w-4 h-4 rounded border-[var(--fx-muted)] bg-transparent accent-[var(--fx-primary)]"
                  />
                  <span
                    className="text-[var(--fx-muted)]"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: "13px",
                    }}
                  >
                    Recordar usuario
                  </span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #1E66F5 0%, #3b82f6 50%, #60a5fa 100%)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 24px rgba(30, 102, 245, 0.4), 0 4px 8px rgba(255,255,255,0.1) inset, 0 -2px 4px rgba(0,0,0,0.2) inset',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid rgba(255,255,255,0.4)',
                  borderBottom: '1px solid rgba(0,0,0,0.2)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
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
