import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  X, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Info,
  Sparkles,
  Zap,
  Server
} from 'lucide-react';

const DISMISS_KEY = 'nexus_test_banner_dismissed_v1';

export default function TestModeBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) {
      setTimeout(() => setVisible(true), 300);
    }
  }, []);

  const dismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      sessionStorage.setItem(DISMISS_KEY, '1');
      setVisible(false);
    }, 300);
  };

  if (!visible) return null;

  return (
    <>
      {/* Animatsiya stillari */}
      <style>{`
        @keyframes bannerSlideDown {
          from { 
            transform: translateY(-100%); 
            opacity: 0;
          }
          to { 
            transform: translateY(0); 
            opacity: 1;
          }
        }
        
        @keyframes bannerSlideUp {
          from { 
            transform: translateY(0); 
            opacity: 1;
          }
          to { 
            transform: translateY(-100%); 
            opacity: 0;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(147, 51, 234, 0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .test-banner-enter {
          animation: bannerSlideDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .test-banner-exit {
          animation: bannerSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .pulse-badge {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .float-icon {
          animation: float 3s ease-in-out infinite;
        }
        
        .shimmer-text {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.9) 0%,
            rgba(255,255,255,1) 50%,
            rgba(255,255,255,0.9) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        
        .expand-content {
          animation: expandFadeIn 0.3s ease-out forwards;
        }
        
        @keyframes expandFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .btn-hover {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .btn-hover:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .btn-hover:active {
          transform: scale(0.98);
        }
        
        .glass-effect {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .marquee-text:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className={isClosing ? 'test-banner-exit' : 'test-banner-enter'}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '260px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(109, 40, 217, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Marquee konteyner - harakatlanuvchi matn */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            position: 'relative',
          }}
        >
          {/* Chap tomon - Icon */}
          <div
            className="pulse-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          >
            <FlaskConical size={16} color="#fbbf24" />
          </div>

          {/* Harakatlanuvchi matn (Marquee) */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              height: '24px',
            }}
          >
            <div
              className="marquee-text"
              style={{
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                animation: 'marquee 12s linear infinite',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              <span style={{ marginRight: '30px' }}>
                <strong style={{ color: '#fbbf24' }}>TEST REJIMI</strong> — Platforma test bosqichida ishlamoqda
              </span>
              <span style={{ marginRight: '30px' }}>
                <strong style={{ color: '#fbbf24' }}>⚠️</strong> Ma'lumotlar o'chirilishi mumkin
              </span>
              <span style={{ marginRight: '30px' }}>
                <strong style={{ color: '#fbbf24' }}>v1.0.0-beta</strong> — Rasmiy versiyaga o'tish kutilmoqda
              </span>
              <span style={{ marginRight: '30px' }}>
                <strong style={{ color: '#fbbf24' }}>TEST REJIMI</strong> — Platforma test bosqichida ishlamoqda
              </span>
              <span style={{ marginRight: '30px' }}>
                <strong style={{ color: '#fbbf24' }}>⚠️</strong> Ma'lumotlar o'chirilishi mumkin
              </span>
              <span style={{ marginRight: '30px' }}>
                <strong style={{ color: '#fbbf24' }}>v1.0.0-beta</strong> — Rasmiy versiyaga o'tish kutilmoqda
              </span>
            </div>
          </div>

          {/* O'ng tomon - Tugmalar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            <button
              onClick={dismiss}
              title="Yopish"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Kengaytirilgan ma'lumotlar */}
        {expanded && (
          <div
            className="expand-content"
            style={{
              padding: '0 12px 12px',
            }}
          >
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Sarlavha */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <AlertTriangle size={16} color="#fbbf24" />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#fbbf24',
                  }}
                >
                  Test rejimi haqida
                </span>
              </div>

              {/* Ro'yxat */}
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {[
                  {
                    icon: <Zap size={14} />,
                    text: 'Kiritilgan ma\'lumotlar',
                    highlight: 'test ma\'lumotlari',
                    suffix: 'hisoblanadi va tozalanishi mumkin',
                  },
                  {
                    icon: <Server size={14} />,
                    text: 'Barcha funksiyalar',
                    highlight: 'to\'liq ishlaydi',
                    suffix: ', lekin ishlab chiqarish uchun tayyorlanmagan',
                  },
                  {
                    icon: <Info size={14} />,
                    text: 'Xatolik yoki taklif bo\'lsa,',
                    highlight: 'Sozlamalar → Fikr bildirish',
                    suffix: 'bo\'limiga yozing',
                  },
                  {
                    icon: <Clock size={14} />,
                    text: 'To\'liq ishga tushirishdan oldin',
                    highlight: 'SuperAdmin',
                    suffix: 'platformani rasmiy holatga o\'tkazadi',
                  },
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '0.7rem',
                      lineHeight: 1.4,
                      opacity: 0.95,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '5px',
                        background: 'rgba(251, 191, 36, 0.15)',
                        color: '#fbbf24',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {item.icon}
                    </span>
                    <span>
                      {item.text}{' '}
                      <strong style={{ color: '#fbbf24', fontWeight: 600 }}>
                        {item.highlight}
                      </strong>{' '}
                      {item.suffix}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Badges */}
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { icon: <FlaskConical size={10} />, text: 'v1.0.0-beta', bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
                  { icon: <Shield size={10} />, text: "Xavfsiz", bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' },
                  { icon: <Clock size={10} />, text: "Kutilmoqda", bg: 'rgba(147, 51, 234, 0.3)', color: '#c4b5fd' },
                ].map((badge, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: badge.bg,
                      color: badge.color,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      border: `1px solid ${badge.color}30`,
                    }}
                  >
                    {badge.icon}
                    {badge.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
