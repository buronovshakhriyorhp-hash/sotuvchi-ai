import React from 'react';
import { X, FileText, CheckCircle2, History, ArrowRightLeft, ShieldCheck, Zap } from 'lucide-react';

interface QuickHelpProps {
  onClose: () => void;
}

export default function QuickHelp({ onClose }: QuickHelpProps) {
  const steps = [
    {
      title: "Ommaviy Import (Excel + Rasmlar)",
      desc: "Eski tizimdan bizga ko'chib o'tishning eng tezkor usuli. Excel faylda ma'lumotlarni yuklang va ZIP arxivda rasmlarni SKU nomi bilan taqdim eting.",
      icon: FileText,
      color: 'var(--primary)'
    },
    {
      title: "Inventarizatsiya (Haqiqiy holat)",
      desc: "Matematik xatolardan qochish uchun faqat tokchadagi mahsulot sonini kiriting. Tizim farqni o'zi hisoblab, tarixga yozadi.",
      icon: ShieldCheck,
      color: 'var(--success)'
    },
    {
      title: "Omborlararo Ko'chirish",
      desc: "Mahsulotlarni bir ombordan ikkinchisiga o'tkazishda tranzaksiyalar zanjiri shakllanadi. Har doim qayerda qancha mahsulot borligini bilib turasiz.",
      icon: ArrowRightLeft,
      color: 'var(--info)'
    },
    {
      title: "Tranzaksiyalar Tarixi",
      desc: "Har bir kirim, chiqim va o'zgarish kim tomonidan va qachon qilingani saqlanadi. Bu ombordagi yo'qolishlarni kamaytiradi.",
      icon: History,
      color: 'var(--text-muted)'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content modal-md fade-in" onClick={e => e.stopPropagation()} style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={24} fill="var(--warning)" style={{ color: 'var(--warning)' }} />
              Ombor bo'yicha qo'llanma
            </h2>
            <p className="modal-subtitle">Tizimdan samarali foydalanish sirlari</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={20}/></button>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', background: 'var(--surface-2)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: '48px', height: '48px', background: `${s.color}15`, color: s.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.375rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '12px', border: '1px dashed var(--primary)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
             Savollaringiz bormi? Telegram orqali qo'llab-quvvatlash guruhiga yozing.
          </p>
        </div>

        <button className="btn btn-primary w-full" style={{ marginTop: '1.5rem' }} onClick={onClose}>
          Tushunarli, rahmat!
        </button>
      </div>
    </div>
  );
}
