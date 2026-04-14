import React, { useState } from 'react';
import { X, FileText, ImageIcon, Upload, CheckCircle2, AlertCircle, Download, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';
import useToast from '../../../store/useToast';

interface ImportWizardProps {
  onClose: () => void;
  onSuccess: () => void;
  warehouses: { id: number; name: string }[];
}

export default function ImportWizard({ onClose, onSuccess, warehouses }: ImportWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>(
    Array.isArray(warehouses) && warehouses.length > 0 ? warehouses[0].id.toString() : ''
  );
  const [results, setResults] = useState<any>(null);
  const toast = useToast();

  const handleImport = async () => {
    if (!excelFile) return toast.error('Excel faylini yuklang');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('excel', excelFile);
    if (zipFile) formData.append('zip', zipFile);
    formData.append('warehouseId', targetWarehouseId);

    try {
      const res: any = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(res);
      setStep(3);
      if (res.imported > 0) {
        toast.success(`${res.imported} ta mahsulot muvaffaqiyatli yuklandi`);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Importda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await api.get('/products/import/template', {
        responseType: 'blob'
      });
      // @ts-ignore
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'nexus_mahsulot_shablon.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      toast.error('Shablon yuklashda xatolik yuz berdi');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-md" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Ommaviy Import Wizards</h2>
            <p className="modal-subtitle">Mahsulotlarni Excel va ZIP orqali yuklash</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={20}/></button>
        </div>

        <div className="modal-body">
          {/* Steps Indicator */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: '4px', background: step >= s ? 'var(--primary)' : 'var(--border)', borderRadius: '2px', transition: 'all 0.3s' }} />
            ))}
          </div>

          {step === 1 && (
            <div className="fade-in space-y-6">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <FileText size={48} style={{ color: 'var(--primary)', marginBottom: '1rem', opacity: 0.8 }} />
                <h3>Excel Ma'lumotlari</h3>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>Eski tizimingizdan eksport qilingan mahsulotlar ro'yxatini yuklang.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Excel/CSV Fayl</label>
                <div 
                  className="input-field" 
                  style={{ border: '2px dashed var(--border)', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: excelFile ? 'var(--primary-light)' : 'transparent' }}
                  onClick={() => document.getElementById('excel-input')?.click()}
                >
                  {excelFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                      <CheckCircle2 size={18} /> {excelFile.name}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                      <Upload size={20} style={{ marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.8125rem' }}>Faylni tanlang yoki shu yerga tashlang</div>
                    </div>
                  )}
                </div>
                <input id="excel-input" type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => setExcelFile(e.target.files?.[0] || null)} />
              </div>

              <button className="btn btn-ghost w-full" onClick={downloadTemplate} style={{ border: '1px solid var(--border)' }}>
                <Download size={16} /> Namuna shablonini yuklab olish
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button className="btn btn-primary" disabled={!excelFile} onClick={() => setStep(2)}>
                  Keyingisi <ImageIcon size={16} style={{ marginLeft: '4px' }} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in space-y-6">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <ImageIcon size={48} style={{ color: 'var(--info)', marginBottom: '1rem', opacity: 0.8 }} />
                <h3>Rasmlar (Ixtiyoriy)</h3>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>Mahsulot rasmlarini bitta ZIP arxivda yuklashingiz mumkin. <br/> Rasm nomlari SKU yoki Barcode bilan bir xil bo'lishi kerak.</p>
              </div>

              <div className="form-group">
                <label className="form-label">ZIP Arxiv (Rasmlar)</label>
                <div 
                  className="input-field" 
                  style={{ border: '2px dashed var(--border)', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: zipFile ? 'var(--info-light)' : 'transparent' }}
                  onClick={() => document.getElementById('zip-input')?.click()}
                >
                  {zipFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--info)', fontWeight: 600 }}>
                      <CheckCircle2 size={18} /> {zipFile.name}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                      <Upload size={20} style={{ marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.8125rem' }}>ZIP faylni tanlang</div>
                    </div>
                  )}
                </div>
                <input id="zip-input" type="file" accept=".zip" hidden onChange={e => setZipFile(e.target.files?.[0] || null)} />
              </div>

              <div className="form-group">
                <label className="form-label">Boshlang'ich qoldiqlar uchun ombor</label>
                <select className="input-field" value={targetWarehouseId} onChange={e => setTargetWarehouseId(e.target.value)}>
                  {Array.isArray(warehouses) && warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn btn-outline" onClick={() => setStep(1)} style={{ flex: 1 }}>Orqaga</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleImport} disabled={loading}>
                  {loading ? <RefreshCw className="spin" size={16} /> : '📥 Importni boshlash'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && results && (
            <div className="fade-in space-y-6">
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--success)' }}>{results.imported}</div>
                <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Muvaffaqiyatli yuklandi</div>
              </div>

              {results.errors?.length > 0 && (
                <div className="space-y-3">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700 }}>
                    <AlertCircle size={18} /> {results.errors.length} ta xatolik aniqlandi:
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem' }}>
                    {results.errors.map((err: any, idx: number) => (
                      <div key={idx} style={{ padding: '0.5rem', fontSize: '0.75rem', borderBottom: idx === results.errors.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                        <span style={{ fontWeight: 700 }}>Qator {err.row}:</span> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-primary w-full" onClick={() => { onSuccess(); onClose(); }}>
                Tayyor! <CheckCircle2 size={16} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
