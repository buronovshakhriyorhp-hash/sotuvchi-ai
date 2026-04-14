import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import productionService from '@/services/production.service';
import { Production } from '@/types';
import PageLoader from '@/components/PageLoader';

export default function ProductionList() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await productionService.getHistory();
      setProductions(data.productions);
      setError(null);
    } catch (err: any) {
      setError('Ma\'lumotlarni yuklashda xatolik yuz berdi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <h1 className="page-title">Ishlab chiqarilganlar bo'limi</h1>
        <button className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Play size={16} /> Yangi ishlab chiqarishni boshlash
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="card">
         <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Jarayon ID</th>
                <th>Sana</th>
                <th>Ishlatilgan Retsept</th>
                <th>Tayyor Mahsulot</th>
                <th>Miqdor</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {productions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Hozircha ishlab chiqarish tarixi mavjud emas
                  </td>
                </tr>
              ) : productions.map((prd) => (
                <tr key={prd.id}>
                  <td style={{ fontWeight: 600 }}>PRD-{prd.id}</td>
                  <td>{new Date(prd.createdAt).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--primary-dark)', fontWeight: 500 }}>{prd.recipe?.name}</td>
                  <td>{prd.recipe?.product?.name}</td>
                  <td style={{ fontWeight: 700 }}>{prd.quantity} ta</td>
                  <td>
                     {prd.status === 'completed' && <span className="badge badge-active"><CheckCircle2 size={12} style={{display:'inline', marginRight:'4px'}}/> Tugallangan</span>}
                     {prd.status === 'in_progress' && <span className="badge" style={{backgroundColor:'#fef08a', color:'#854d0e'}}><RotateCcw size={12} style={{display:'inline', marginRight:'4px'}}/> Jarayonda</span>}
                     {prd.status === 'cancelled' && <span className="badge badge-inactive">Bekor qilingan</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         </div>
      </div>
    </div>
  );
}
