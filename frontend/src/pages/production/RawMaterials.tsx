import React, { useState } from 'react';
import { Search, Plus, Settings2 } from 'lucide-react';
import useToast from '../../store/useToast';

const DUMMY_RAW_MATERIALS = [
  { id: 'RM-001', name: 'Paxta tola (Oq)', unit: 'Kg', amount: 450, cost: 2.50, min_stock: 50 },
  { id: 'RM-002', name: 'Sintetik ip', unit: 'Oram', amount: 120, cost: 1.20, min_stock: 30 },
  { id: 'RM-003', name: 'Charm', unit: 'Metr', amount: 15, cost: 8.00, min_stock: 20 },
  { id: 'RM-004', name: "Bo'yoq (Moviy)", unit: 'Litr', amount: 60, cost: 4.50, min_stock: 10 },
];

export default function RawMaterials() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = DUMMY_RAW_MATERIALS.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-title-box">
        <h1 className="page-title">Xomashyolar ro'yxati</h1>
        <button
          className="btn btn-primary"
          style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}
          onClick={() => toast.info("Xomashyo qo'shish modali tez orada qo'shiladi")}
        >
          <Plus size={18} />
          Xomashyo Qo'shish
        </button>
      </div>

      <div className="card">
        <div className="mb-6" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
          <div style={{ position:'relative', flex:1, minWidth:'250px' }}>
            <Search size={18} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Xomashyo nomi bo'yicha qidirish..."
              style={{ paddingLeft:'2.5rem', width:'100%' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="btn btn-outline"
            style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}
            onClick={() => toast.info("Sozlash funksiyasi tez orada qo'shiladi")}
          >
            <Settings2 size={18} />
            Sozlash
          </button>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Nomi</th>
                <th>O'lchov formati</th>
                <th>Qoldiq</th>
                <th>O'rtacha Narx</th>
                <th>Holati</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((mat) => (
                <tr key={mat.id}>
                  <td style={{ color:'var(--text-muted)' }}>{mat.id}</td>
                  <td style={{ fontWeight:500 }}>{mat.name}</td>
                  <td>{mat.unit}</td>
                  <td style={{ fontWeight:600 }}>{mat.amount}</td>
                  <td>${mat.cost.toFixed(2)}</td>
                  <td>
                    {mat.amount > mat.min_stock ? (
                      <span className="badge badge-active">Yeterli</span>
                    ) : (
                      <span className="badge badge-danger">Kam qolgan!</span>
                    )}
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
