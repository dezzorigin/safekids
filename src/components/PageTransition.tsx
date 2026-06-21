import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const MESSAGES = ["Memuat...", "Sebentar ya...", "Loading...", "Siap-siap!", "Tunggu sebentar..."];

const DECORATIONS = [
  { style: { top: '8%', left: '6%', width: '60px', height: '60px', backgroundColor: '#FF6B6B', animationDelay: '0s', animationDuration: '7s' } },
  { style: { top: '12%', right: '8%', width: '50px', height: '50px', backgroundColor: '#FFE135', animationDelay: '-2s', animationDuration: '6s' } },
  { style: { top: '45%', left: '3%', width: '45px', height: '45px', backgroundColor: '#4ECDC4', animationDelay: '-4s', animationDuration: '9s' } },
  { style: { top: '45%', right: '4%', width: '55px', height: '55px', backgroundColor: '#C77DFF', animationDelay: '-1s', animationDuration: '8s' } },
  { style: { bottom: '15%', left: '8%', width: '50px', height: '50px', backgroundColor: '#FF9A3C', animationDelay: '-3s', animationDuration: '10s' } },
  { style: { bottom: '12%', right: '6%', width: '65px', height: '65px', backgroundColor: '#74C0FC', animationDelay: '-5s', animationDuration: '8s' } },
];

const PUFF_COLORS = [
  'rgba(255,107,107,0.12)',
  'rgba(255,225,53,0.15)',
  'rgba(78,205,196,0.12)',
  'rgba(116,192,252,0.12)',
  'rgba(199,125,255,0.10)',
  'rgba(255,154,60,0.12)',
];

export default function PageTransition() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [message, setMessage] = useState('');

  // Generate smoke puffs
  const smokePuffs = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const size = Math.floor(Math.random() * 300) + 200;
      const left = Math.floor(Math.random() * 100);
      const top = Math.floor(Math.random() * 100);
      const duration = Math.floor(Math.random() * 8) + 8;
      const delay = -(Math.random() * 12);
      return {
        id: i,
        style: {
          position: 'absolute' as const,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PUFF_COLORS[i % PUFF_COLORS.length]} 0%, transparent 70%)`,
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          top: `${top}%`,
          animation: `smokeDrift ${duration}s ease-in-out infinite alternate`,
          animationDelay: `${delay}s`,
          pointerEvents: 'none' as const,
        },
      };
    });
  }, []);

  useEffect(() => {
    // 1 second display duration
    const duration = 1000;
    
    // Pick random message
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    
    setIsVisible(true);
    setIsAnimatingIn(true);
    setIsFadingOut(false);

    const slideDownTimer = setTimeout(() => {
      setIsAnimatingIn(false);
    }, 50);

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
      
      // Allow slide up animation to finish before removing from DOM
      setTimeout(() => {
        setIsVisible(false);
      }, 500); // matches 0.5s transition
    }, 50 + 500 + duration);

    return () => {
      clearTimeout(slideDownTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [location.pathname]);

  // These routes use the CurtainContext animation — skip PageTransition for them
  const CURTAIN_ROUTES = ['/', '/student/login']
  if (CURTAIN_ROUTES.includes(location.pathname)) return null

  if (!isVisible) return null;

  return (
    <div
      className="page-transition-wrapper select-none"
      style={{
        transform: isAnimatingIn ? 'translateY(-100%)' : (isFadingOut ? 'translateY(-100%)' : 'translateY(0)'),
        transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        background: '#FFFEF7',
        borderBottom: '8px solid #1A1A2E',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', sans-serif",
        color: '#1A1A2E',
      }}
    >
      <style>{`
        @keyframes smokeDrift {
          0%   { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50%  { transform: translate(30px, -20px) scale(1.1); opacity: 0.6; }
          100% { transform: translate(-20px, 10px) scale(0.95); opacity: 0.2; }
        }

        @keyframes shimmer {
          0%, 100% { text-shadow: 4px 4px 0px #FF6B6B, 8px 8px 0px rgba(255,107,107,0.25); }
          50% { text-shadow: 4px 4px 0px #FF9A3C, 8px 8px 0px rgba(255,154,60,0.35), 0 0 40px rgba(255,225,53,0.2); }
        }

        @keyframes floatRotate {
          0%   { transform: rotate(-8deg) translateY(0px); }
          100% { transform: rotate(12deg) translateY(-16px); }
        }

        @keyframes loadBarFill {
          0%   { width: 0%; }
          30%  { width: 25%; }
          60%  { width: 55%; }
          85%  { width: 80%; }
          95%  { width: 92%; }
          100% { width: 100%; }
        }

        @keyframes loadBarStripe {
          0%   { background-position: 0px 0; }
          100% { background-position: 80px 0; }
        }

        @keyframes dots {
          0%, 33%   { content: '.'; }
          34%, 66%  { content: '..'; }
          67%, 100% { content: '...'; }
        }

        .transition-title {
          font-family: 'Nunito', sans-serif;
          font-weight: 900;
          font-size: clamp(64px, 12vw, 120px);
          color: #1A1A2E;
          letter-spacing: -2px;
          line-height: 1;
          margin: 16px 0 8px 0;
          animation: shimmer 3s ease-in-out infinite;
          text-align: center;
        }

        .transition-subtitle {
          font-size: 14px;
          color: rgba(26, 26, 46, 0.5);
          font-style: italic;
          letter-spacing: 0.15em;
          margin-bottom: 24px;
        }

        .loader-container {
          width: 280px;
          height: 20px;
          border: 3px solid #1A1A2E;
          box-shadow: 3px 3px 0px #1A1A2E;
          background: white;
          position: relative;
          overflow: hidden;
          margin-top: 16px;
        }

        .loader-bar {
          height: 100%;
          background: repeating-linear-gradient(
            90deg,
            #FF6B6B 0px, #FF6B6B 20px,
            #FFE135 20px, #FFE135 40px,
            #4ECDC4 40px, #4ECDC4 60px,
            #74C0FC 60px, #74C0FC 80px
          );
          background-size: 80px 100%;
          width: 0%;
          animation: loadBarFill 1.5s ease-out forwards,
                     loadBarStripe 0.5s linear infinite;
        }

        .floating-square {
          position: absolute;
          border: 3px solid #1A1A2E;
          box-shadow: 3px 3px 0px #1A1A2E;
          animation: floatRotate 8s ease-in-out infinite alternate;
        }
      `}</style>

      {/* LAYER 1: Smoke Drifting Particles */}
      {smokePuffs.map((puff) => (
        <div key={puff.id} style={puff.style} />
      ))}

      {/* LAYER 2: Floating Squares Decorations */}
      {DECORATIONS.map((dec, idx) => (
        <div
          key={idx}
          className="floating-square"
          style={{
            ...dec.style,
            animationDuration: dec.style.animationDuration,
            animationDelay: dec.style.animationDelay,
          }}
        />
      ))}

      {/* LAYER 3: Content */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="badge-item" style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900,
          fontSize: '11px',
          letterSpacing: '0.3em',
          color: 'rgba(26, 26, 46, 0.7)',
          border: '1px solid rgba(26, 26, 46, 0.3)',
          padding: '6px 16px',
          display: 'inline-block',
          textTransform: 'uppercase'
        }}>
          🌊 PGMI · UIN AR-RANIRY 2026
        </div>

        <h1 className="transition-title">
          SafeKids
        </h1>
        
        <div className="transition-subtitle">
          [ {message.toLowerCase()} ]
        </div>
        
        <div className="loader-container">
          <div className="loader-bar" />
        </div>
      </div>
    </div>
  );
}
