
import React, { useState, useEffect } from 'react';
import { 
  Landmark, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, 
  ArrowRightLeft, Plus, History, Coins, Printer, Filter, Search, Calendar, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { CashRegister, Transaction } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const CashRegisters: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'movements'>('overview');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('all');
  
  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');

  // Forms
  const [txForm, setTxForm] = useState({
    registerId: '',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().slice(0, 16)
  });

  const [transferForm, setTransferForm] = useState({
    fromRegisterId: '',
    toRegisterId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 16)
  });

  // Fetch Data
  const loadData = async () => {
      setLoading(true);
      try {
          const [fetchedRegisters, fetchedTransactions] = await Promise.all([
              api.finance.getCashRegisters(),
              api.finance.getTransactions()
          ]);
          setRegisters(fetchedRegisters);
          setTransactions(fetchedTransactions);
      } catch (error) {
          console.error("Failed to load cash register data", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      loadData();
  }, []);

  // Derived Stats
  const totalTry = registers.filter(r => r.currency === 'TRY').reduce((acc, r) => acc + r.balance, 0);
  const totalUsd = registers.filter(r => r.currency === 'USD').reduce((acc, r) => acc + r.balance, 0);
  const totalEur = registers.filter(r => r.currency === 'EUR').reduce((acc, r) => acc + r.balance, 0);

  // Filters
  const filteredTransactions = transactions
    .filter(t => selectedRegisterId === 'all' ? true : (t.registerId === selectedRegisterId || t.toRegisterId === selectedRegisterId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Handlers
  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txForm.amount);
    if (!amount || !txForm.registerId) return;

    // Create Transaction
    const newTx: Transaction = {
      id: `TRX-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      date: txForm.date,
      description: txForm.description,
      amount: amount,
      type: txType,
      category: txForm.category || (txType === 'income' ? 'Diğer Gelir' : 'Diğer Gider'),
      status: 'completed',
      registerId: txForm.registerId
    };

    try {
        await api.finance.createTransaction(newTx);
        
        // Optimistic Update
        setTransactions([newTx, ...transactions]);
        setRegisters(prev => prev.map(r => {
            if (r.id === txForm.registerId) {
                return {
                ...r,
                balance: txType === 'income' ? r.balance + amount : r.balance - amount
                };
            }
            return r;
        }));

        setIsTxModalOpen(false);
        setTxForm({ ...txForm, amount: '', description: '', category: '' });
    } catch (error) {
        alert("İşlem kaydedilirken hata oluştu.");
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferForm.amount);
    if (!amount || !transferForm.fromRegisterId || !transferForm.toRegisterId) return;
    if (transferForm.fromRegisterId === transferForm.toRegisterId) {
      alert("Aynı hesaba transfer yapılamaz.");
      return;
    }

    // Create Transaction Record (Transfer is usually recorded as Expense from Source)
    const newTx: Transaction = {
      id: `TRF-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      date: transferForm.date,
      description: `Transfer: ${transferForm.description}`,
      amount: amount,
      type: 'transfer',
      category: 'Virman',
      status: 'completed',
      registerId: transferForm.fromRegisterId,
      toRegisterId: transferForm.toRegisterId
    };

    try {
        // In a real API, a single transfer endpoint handles both balance updates.
        // Here we simulate it by creating a transaction and manually updating balances
        await api.finance.createTransaction(newTx);
        
        // Manual updates for mock consistency in UI
        const sourceReg = registers.find(r => r.id === transferForm.fromRegisterId);
        const destReg = registers.find(r => r.id === transferForm.toRegisterId);
        
        if (sourceReg) await api.finance.updateCashRegister({...sourceReg, balance: sourceReg.balance - amount});
        if (destReg) await api.finance.updateCashRegister({...destReg, balance: destReg.balance + amount});

        setTransactions([newTx, ...transactions]);
        setRegisters(prev => prev.map(r => {
            if (r.id === transferForm.fromRegisterId) return { ...r, balance: r.balance - amount };
            if (r.id === transferForm.toRegisterId) return { ...r, balance: r.balance + amount };
            return r;
        }));

        setIsTransferModalOpen(false);
        setTransferForm({ ...transferForm, amount: '', description: '' });
    } catch (error) {
        alert("Transfer işlemi sırasında hata oluştu.");
    }
  };

  const inputClass = "w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white";

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kasa ve Banka</h1>
          <p className="text-slate-500 dark:text-slate-400">Nakit akışını, banka hesaplarını ve virman işlemlerini yönetin.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all hover:scale-105"
          >
            <ArrowRightLeft size={16} className="mr-2" />
            Virman (Transfer)
          </button>
          <button 
            onClick={() => { setTxType('expense'); setIsTxModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all hover:scale-105"
          >
            <ArrowUpRight size={16} className="mr-2" />
            Tediye (Ödeme)
          </button>
          <button 
            onClick={() => { setTxType('income'); setIsTxModalOpen(true); }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all hover:scale-105"
          >
            <ArrowDownRight size={16} className="mr-2" />
            Tahsilat (Giriş)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors group hover:-translate-y-1">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Toplam Türk Lirası</p>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                 {loading ? '...' : `₺${totalTry.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
               </h3>
             </div>
             <div className="p-3 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
               <span className="font-bold">TRY</span>
             </div>
           </div>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors group hover:-translate-y-1">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Toplam Dolar</p>
               <h3 className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tight">
                 {loading ? '...' : `$${totalUsd.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
               </h3>
             </div>
             <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
               <span className="font-bold">USD</span>
             </div>
           </div>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 transition-colors group hover:-translate-y-1">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Toplam Euro</p>
               <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                 {loading ? '...' : `€${totalEur.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
               </h3>
             </div>
             <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
               <span className="font-bold">EUR</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 overflow-hidden min-h-[500px]">
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700/50 flex bg-slate-50/50 dark:bg-slate-800/50 p-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'overview' ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-enterprise-800 shadow-sm rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Hesaplar & Kasalar
          </button>
          <button 
            onClick={() => setActiveTab('movements')}
            className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'movements' ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-enterprise-800 shadow-sm rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Hesap Hareketleri
          </button>
        </div>

        <div className="p-6">
          {loading ? (
             <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
                <p>Kasa bilgileri yükleniyor...</p>
            </div>
          ) : (
            <>
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registers.map(reg => (
                        <div key={reg.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all bg-white dark:bg-slate-800/50 group relative hover:border-brand-500/30">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl shadow-sm ${reg.type === 'bank' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : reg.type === 'pos' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {reg.type === 'bank' ? <Landmark size={24} /> : reg.type === 'pos' ? <CreditCard size={24} /> : <Wallet size={24} />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{reg.name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{reg.type}</p>
                            </div>
                            </div>
                            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                            {reg.currency}
                            </span>
                        </div>
                        
                        <div className="mb-6">
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {reg.currency === 'USD' ? '$' : reg.currency === 'EUR' ? '€' : '₺'}
                            {reg.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </div>
                            {reg.iban && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono truncate bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700" title={reg.iban}>
                                {reg.iban}
                            </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <button 
                            onClick={() => { setSelectedRegisterId(reg.id); setActiveTab('movements'); }}
                            className="flex-1 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                            >
                            Hareketler
                            </button>
                            <button 
                            onClick={() => { setTransferForm({...transferForm, fromRegisterId: reg.id}); setIsTransferModalOpen(true); }}
                            className="flex-1 py-2.5 text-xs font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
                            >
                            Transfer Yap
                            </button>
                        </div>
                        </div>
                    ))}
                    
                    {/* Add New Register Placeholder */}
                    <button className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all min-h-[200px] group">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                           <Plus size={32} />
                        </div>
                        <span className="font-bold">Yeni Hesap Ekle</span>
                    </button>
                    </div>
                )}

                {activeTab === 'movements' && (
                    <div>
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
                        <button 
                            onClick={() => setSelectedRegisterId('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedRegisterId === 'all' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        >
                            Tüm Hesaplar
                        </button>
                        {registers.map(r => (
                            <button 
                            key={r.id}
                            onClick={() => setSelectedRegisterId(r.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedRegisterId === r.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                            >
                            {r.name}
                            </button>
                        ))}
                        </div>
                        <div className="flex items-center gap-2">
                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                            <Filter size={20} />
                        </button>
                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                            <Printer size={20} />
                        </button>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                            <th className="px-6 py-4">Tarih</th>
                            <th className="px-6 py-4">Kasa / Hesap</th>
                            <th className="px-6 py-4">Açıklama</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4 text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredTransactions.map(t => {
                            const register = registers.find(r => r.id === t.registerId);
                            const symbol = register?.currency === 'USD' ? '$' : register?.currency === 'EUR' ? '€' : '₺';
                            return (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    <div className="font-bold text-slate-900 dark:text-white">{new Date(t.date).toLocaleDateString('tr-TR')}</div>
                                    <div className="text-xs">{new Date(t.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                    {register?.name || 'Bilinmiyor'}
                                    {t.type === 'transfer' && (
                                    <span className="text-xs text-brand-600 dark:text-brand-400 block font-bold mt-0.5">
                                        ➔ {registers.find(r => r.id === t.toRegisterId)?.name}
                                    </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{t.description}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                    {t.category}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-sm font-black text-right ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}{symbol}{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </td>
                                </tr>
                            );
                            })}
                            {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                Bu hesap için işlem bulunamadı.
                                </td>
                            </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                    </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* TRANSACTION MODAL */}
      <Modal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)} 
        title={txType === 'income' ? 'Yeni Tahsilat (Giriş)' : 'Yeni Tediye (Çıkış)'}
        size="sm"
      >
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Hesap Seçimi</label>
            <select 
              value={txForm.registerId}
              onChange={e => setTxForm({...txForm, registerId: e.target.value})}
              required
              className={inputClass}
            >
              <option value="">Seçiniz...</option>
              {registers.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.currency})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Tutar</label>
            <input 
              type="number"
              min="0"
              step="0.01"
              value={txForm.amount}
              onChange={e => setTxForm({...txForm, amount: e.target.value})}
              required
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Açıklama</label>
            <input 
              type="text"
              value={txForm.description}
              onChange={e => setTxForm({...txForm, description: e.target.value})}
              required
              className={inputClass}
              placeholder="İşlem açıklaması..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Kategori</label>
            <select 
              value={txForm.category}
              onChange={e => setTxForm({...txForm, category: e.target.value})}
              className={inputClass}
            >
              <option value="">Otomatik</option>
              <option value="Satış">Satış</option>
              <option value="Hizmet">Hizmet</option>
              <option value="Fatura Ödeme">Fatura Ödeme</option>
              <option value="Maaş">Maaş</option>
              <option value="Kira">Kira</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Tarih</label>
            <input 
              type="datetime-local"
              value={txForm.date}
              onChange={e => setTxForm({...txForm, date: e.target.value})}
              className={inputClass}
            />
          </div>
          <button type="submit" className={`w-full py-3 rounded-xl text-white font-bold shadow-lg transition-all hover:scale-105 ${txType === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}>
            İşlemi Kaydet
          </button>
        </form>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        title="Virman (Hesaplar Arası Transfer)"
        size="sm"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg text-xs font-medium text-purple-800 dark:text-purple-300 mb-4">
            Dikkat: Transfer işlemi sadece aynı para birimine sahip hesaplar arasında yapılabilir. Çapraz kur çevrimi henüz desteklenmemektedir.
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Gönderen Hesap</label>
            <select 
              value={transferForm.fromRegisterId}
              onChange={e => setTransferForm({...transferForm, fromRegisterId: e.target.value})}
              required
              className={inputClass}
            >
              <option value="">Seçiniz...</option>
              {registers.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.currency})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Alıcı Hesap</label>
            <select 
              value={transferForm.toRegisterId}
              onChange={e => setTransferForm({...transferForm, toRegisterId: e.target.value})}
              required
              className={inputClass}
            >
              <option value="">Seçiniz...</option>
              {registers
                .filter(r => r.id !== transferForm.fromRegisterId) // Exclude source
                .filter(r => !transferForm.fromRegisterId || r.currency === registers.find(s => s.id === transferForm.fromRegisterId)?.currency) // Match currency
                .map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.currency})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Transfer Tutarı</label>
            <input 
              type="number"
              min="0"
              step="0.01"
              value={transferForm.amount}
              onChange={e => setTransferForm({...transferForm, amount: e.target.value})}
              required
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase text-xs">Açıklama</label>
            <input 
              type="text"
              value={transferForm.description}
              onChange={e => setTransferForm({...transferForm, description: e.target.value})}
              required
              className={inputClass}
              placeholder="Transfer nedeni..."
            />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 bg-purple-600 hover:bg-purple-700">
            Transferi Tamamla
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CashRegisters;
