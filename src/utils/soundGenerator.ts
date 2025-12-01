// FX27 Sound Generator - Sonidos UI Premium Espectaculares

// Sistema de cooldown para evitar spam
const lastPlayedRef: { sound: string; time: number } | null = { sound: '', time: 0 };

// AudioContext singleton
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Función helper para crear envelope ADSR
const createEnvelope = (
  gainNode: GainNode,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  duration: number
) => {
  const ctx = gainNode.context;
  const now = ctx.currentTime;
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + attack);
  gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
  gainNode.gain.setValueAtTime(sustain, now + duration - release);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
};

// SONIDO 1: "Soft Blip" - EL ELEGIDO ⭐ (Agregar Lead)
export const playSound1 = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  createEnvelope(gain, 0.005, 0.01, 0.3, 0.04, 0.06);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
};

// SONIDO 2: "Power Chord Ascend" - Acorde ascendente potente (Panel Oportunidades)
export const playSound2 = () => {
  const ctx = getAudioContext();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Acorde mayor ascendente
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523, ctx.currentTime); // C5
  osc1.frequency.exponentialRampToValueAtTime(659, ctx.currentTime + 0.08); // E5
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(659, ctx.currentTime); // E5
  osc2.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.08); // G5
  
  osc3.type = 'triangle';
  osc3.frequency.setValueAtTime(784, ctx.currentTime); // G5
  osc3.frequency.exponentialRampToValueAtTime(1047, ctx.currentTime + 0.08); // C6
  
  osc1.connect(gain);
  osc2.connect(gain);
  osc3.connect(gain);
  gain.connect(ctx.destination);
  
  createEnvelope(gain, 0.01, 0.02, 0.5, 0.05, 0.12);
  
  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc3.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.12);
  osc2.stop(ctx.currentTime + 0.12);
  osc3.stop(ctx.currentTime + 0.12);
};

// SONIDO 3: "Warp Speed" - Barrido futurista ultra rápido (Operaciones)
export const playSound3 = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.09);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 0.09);
  filter.Q.value = 5;
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  createEnvelope(gain, 0.002, 0.015, 0.4, 0.04, 0.1);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

// SONIDO 4: "Celestial Shimmer" - Brillo celestial con reverb simulado (Despacho Inteligente)
export const playSound4 = () => {
  const ctx = getAudioContext();
  const oscillators = [];
  const gains = [];
  
  // Crear 5 osciladores con frecuencias armónicas
  const frequencies = [1320, 1760, 2200, 2640, 3300];
  const delays = [0, 0.015, 0.03, 0.045, 0.06];
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const startTime = ctx.currentTime + delays[i];
    const duration = 0.15 - delays[i];
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
    
    oscillators.push(osc);
    gains.push(gain);
  });
};

// SONIDO 5: "Quantum Pulse" - Pulso cuántico con modulación (Control Equipo)
export const playSound5 = () => {
  const ctx = getAudioContext();
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modulatorGain = ctx.createGain();
  const outputGain = ctx.createGain();
  
  // FM Synthesis
  modulator.type = 'sine';
  modulator.frequency.setValueAtTime(10, ctx.currentTime);
  modulator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
  
  modulatorGain.gain.setValueAtTime(100, ctx.currentTime);
  
  carrier.type = 'sine';
  carrier.frequency.setValueAtTime(440, ctx.currentTime);
  
  modulator.connect(modulatorGain);
  modulatorGain.connect(carrier.frequency);
  carrier.connect(outputGain);
  outputGain.connect(ctx.destination);
  
  createEnvelope(outputGain, 0.005, 0.02, 0.45, 0.05, 0.11);
  
  carrier.start(ctx.currentTime);
  modulator.start(ctx.currentTime);
  carrier.stop(ctx.currentTime + 0.11);
  modulator.stop(ctx.currentTime + 0.11);
};

// SONIDO 6: "Diamond Cascade" - Cascada cristalina descendente (KPIs)
export const playSound6 = () => {
  const ctx = getAudioContext();
  const notes = [3520, 3136, 2794, 2637, 2349]; // Pentatónica descendente alta
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const startTime = ctx.currentTime + (i * 0.022);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
    
    osc.start(startTime);
    osc.stop(startTime + 0.05);
  });
};

// SONIDO 7: "Cyber Lock" - Bloqueo cibernético con doble confirmación (Configuración)
export const playSound7 = () => {
  const ctx = getAudioContext();
  
  // Primera parte: Click alto
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(1760, ctx.currentTime);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  createEnvelope(gain1, 0.001, 0.005, 0.2, 0.02, 0.035);
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.035);
  
  // Segunda parte: Confirmación grave
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(220, ctx.currentTime + 0.045);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  
  const startTime2 = ctx.currentTime + 0.045;
  gain2.gain.setValueAtTime(0, startTime2);
  gain2.gain.linearRampToValueAtTime(0.5, startTime2 + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.01, startTime2 + 0.08);
  
  osc2.start(startTime2);
  osc2.stop(startTime2 + 0.08);
};

// SONIDO 8: "Hologram Activate" - Activación de holograma (Cotizaciones)
export const playSound8 = () => {
  const ctx = getAudioContext();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // Sweep hacia arriba con batimiento
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(885, ctx.currentTime); // 5Hz batimiento
  osc2.frequency.exponentialRampToValueAtTime(1765, ctx.currentTime + 0.1);
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  
  createEnvelope(gain, 0.008, 0.02, 0.4, 0.045, 0.11);
  
  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.11);
  osc2.stop(ctx.currentTime + 0.11);
};

// SONIDO 9: "Energy Charge" - Carga de energía ascendente (Ventas)
export const playSound9 = () => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
  
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(500, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.12);
  filter.Q.value = 8;
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  // Envelope con crescendo
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 0.09);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.13);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.13);
};

// SONIDO 10: "Stardust Twinkle" - Destello estelar triple (Utilerías)
export const playSound10 = () => {
  const ctx = getAudioContext();
  
  // Triple twinkle con delay
  const twinkles = [
    { freq: 2093, time: 0 },
    { freq: 2637, time: 0.035 },
    { freq: 3520, time: 0.07 }
  ];
  
  twinkles.forEach(({ freq, time }) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, ctx.currentTime + time);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime + time);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    const startTime = ctx.currentTime + time;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.045);
    
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.045);
    osc2.stop(startTime + 0.045);
  });
};

// Función principal con cooldown de 1 segundo
export const playModuleSound = (moduleId: string) => {
  const now = Date.now();
  
  // Cooldown check
  if (lastPlayedRef && 
      lastPlayedRef.sound === moduleId && 
      now - lastPlayedRef.time < 1000) {
    return;
  }
  
  // Update tracker
  if (lastPlayedRef) {
    lastPlayedRef.sound = moduleId;
    lastPlayedRef.time = now;
  }
  
  // TODOS LOS MÓDULOS usan Energy Charge (Sound 9)
  playSound9();
};