import React, { useState, useEffect } from 'react';

const DISMISS_KEY = 'nexus_test_banner_dismissed_v1';

export default function TestModeBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Inline style for animation — no external dep needed */}
      <style>{`
        @keyframes bannerSlideIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .test-banner { animation: bannerSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .test-banner-btn { transition: opacity 0.15s, transform 0.15s; }
        .test-banner-btn:hover { opacity: 0.75; transform: scale(0.97); }
      `}</style>

      <div
        className="test-banner"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
          color: '#fff',
          padding: expanded ? '0.75rem 1rem 1rem' : '0.55rem 1rem',
          fontSize: '0.82rem',
          display: 'flex',
          flexDirection: expanded ? 'column' : 'row',
          alignItems: expanded ? 'flex-start' : 'center',
          gap: '0.5rem',
          transition: 'padding 0.25s',
          boxShadow: '0 2px 12px rgba(109, 40, 217, 0.4)',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%' }}>
          {/* Pulsing dot */}
          <span style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{
              display: 'block', width: '8px', height: '8px',
              borderRadius: '50%', background: '#fde68a',
              boxShadow: '0 0 0 0 rgba(253,230,138,0.6)',
              animation: 'pulse 1.8s infinite',
            }} />
          </span>

          <span style={{ fontWeight: 700, letterSpacing: '0.01em', flexShrink: 0 }}>
            🧪 TEST REJIMI
          </span>

          <span style={{ opacity: 0.9, flex: 1, lineHeight: 1.4 }}>
            Bu platforma hozirda <strong>test bosqichida</strong> ishlayapti. Ma'lumotlar o'chirilishi mumkin.
          </span>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: 'auto' }}>
            <button
              className="test-banner-btn"
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff',
                borderRadius: '6px', padding: '3px 10px',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              }}
            >
              {expanded ? 'Yig\'ish ▲' : 'Batafsil ▼'}
            </button>
            <button
              className="test-banner-btn"
              onClick={dismiss}
              title="Yopish"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff',
                borderRadius: '6px', padding: '3px 8px',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            width: '100%',
            lineHeight: 1.65,
            marginTop: '0.25rem',
          }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
              ⚠️ Test rejimi haqida bilasizmi?
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', opacity: 0.92, fontSize: '0.8rem' }}>
              <li>Kiritilgan ma'lumotlar <strong>test ma'lumotlari</strong> hisoblanadi va tozalanishi mumkin</li>
              <li>Barcha funksiyalar to'liq ishlaydi, lekin ishlab chiqarish uchun tayyorlanmagan</li>
              <li>Xatolik yoki taklif bo'lsa, <strong>Sozlamalar → Fikr bildirish</strong> bo'limiga yozing</li>
              <li>To'liq ishga tushirishdan oldin SuperAdmin platformani rasmiy holatga o'tkazadi</li>
            </ul>
            <div style={{ marginTop: '0.65rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={badgStyle('rgba(255,255,255,0.15)')}>v1.0.0-beta</span>
              <span style={badgStyle('rgba(255,255,255,0.15)')}>🔒 Ma'lumotlar xavfsiz</span>
              <span style={badgStyle('rgba(253,230,138,0.2)')}>⏳ Rasmiy versiyaga o'tish kutilmoqda</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const badgStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  borderRadius: '20px',
  padding: '2px 10px',
  fontSize: '0.74rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
});
