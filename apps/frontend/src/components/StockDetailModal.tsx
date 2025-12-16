
import React, { useState, useEffect, useMemo } from 'react';
import { Product, StockMovement } from '../types';
import { 
  X, Package, TrendingUp, TrendingDown, History, 
  AlertTriangle, Save, Calendar, FileText, ArrowRightLeft, Loader2, Wrench, Filter, Search
} from 'lucide-react';
import { api } from '../services/api';

interface StockDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStock: (productId: string, newStock: number) => void;
}

const StockDetailModal: React.FC<StockDetailModalProps> = ({ product, isOpen, onClose, onUpdateStock }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'adjust'>('history');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), // First day of month
    end: new Date().toISOString().slice(0, 10)
  });
  const [filterType, setFilterType] = useState<string>('all');

  // Adjustment Form
  const [adjustForm, setAdjustForm] = useState({
    type: 'adjustment_inc', // adjustment_inc or adjustment_dec
    quantity: '1',
    description: ''
  });

  // Fetch movements on mount
  useEffect(() => {
      if (isOpen) {
          const fetchMovements = async () => {
              setLoading(true);
              try {
                  const allMovements = await api.products.getStockMovements();
                  const productMovements = allMovements.filter(m => m.productId === product.id);
                  // Sort by date descending
                  productMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  setMovements(productMovements);
              } catch (error) {
                  console.error("Failed to fetch stock movements", error);
              } finally {
                  setLoading(false);
              }
          };
          fetchMovements();
      }
  }, [isOpen, product.id]);

  // Filter Logic
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const mDate = new Date(m.date).toISOString().slice(0, 10);
      const inDateRange = mDate >= dateRange.start && mDate <= dateRange.end;
      const typeMatch = filterType === 'all' ? true : m.type === filterType;
      return inDateRange && typeMatch;
    });
  }, [movements, dateRange, filterType]);

  // Calculations based on filtered data
  const totalIn = filteredMovements
    .filter(m => ['purchase', 'return_in', 'adjustment_inc', 'transfer'].includes(m.type)) // Simplified logic
    .reduce((acc, curr) => acc + curr.quantity, 0);
    
  const totalOut = filteredMovements
    .filter(m => ['sale', 'return_out', 'adjustment_dec'].includes(m.type))
    .reduce((acc, curr) => acc + curr.quantity, 0);

  if (!isOpen) return null;

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustForm.quantity);
    if (!qty || qty <= 0) return;

    // Calculate new stock
    const isInc = adjustForm.type === 'adjustment_inc';
    const newStock = isInc ? product.stock + qty : product.stock - qty;

    if (newStock < 0) {
      alert("Stok miktarı 0'dan küçük olamaz!");
      return;
    }

    // Create movement record
    const newMovement: StockMovement = {
      id: `MV-${Date.now()}`,
      tenantId: product.tenantId,
      productId: product.id,
      date: new Date().toISOString(),
      type: adjustForm.type as any,
      quantity: qty,
      description: adjustForm.description || (isInc ? 'Stok Ekleme (Manuel)' : 'Stok Düşme (Manuel)'),
      performedBy: 'Kullanıcı' // In real app, current user
    };

    try {
        await api.products.createStockMovement(newMovement);
        setMovements([newMovement, ...movements]);
        onUpdateStock(product.id, newStock);
        
        // Reset form and show success
        setAdjustForm({ type: 'adjustment_inc', quantity: '1', description: '' });
        setActiveTab('history');
    } catch(e) {
        alert("Stok hareketi kaydedilirken hata oluştu.");
    }
  };

  const getMovementBadge = (movement: StockMovement) => {
    // Override label if description contains specific keywords
    if (movement.description?.includes('Servis')) {
        return { label: 'Servis Kullanımı', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Wrench };
    }

    switch(movement.type) {
      case 'purchase': return { label: 'Alış', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: TrendingUp };
      case 'sale': return { label: 'Satış', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingDown };
      case 'return_in': return { label: 'Satış İade', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: ArrowRightLeft };
      case 'return_out': return { label: 'Alış İade', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ArrowRightLeft };
      case 'adjustment_inc': return { label: 'Sayım Fazlası', class: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300', icon: PlusIcon };
      case 'adjustment_dec': return { label: 'Zayi / Fire', class: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300', icon: MinusIcon };
      case 'transfer': return { label: 'Transfer', class: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: ArrowRightLeft };
      default: return { label: movement.type, class: 'bg-gray-100 text-gray-700', icon: FileText };
    }
  };

  const PlusIcon = () => <div className="font-bold">+</div>;
  const MinusIcon = () => <div className="font-bold">-</div>;

  return (
    // Z-INDEX INCREASED TO 70 to appear above the product edit modal (which is typically z-50)
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-enterprise-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors border border-slate-200 dark:border-slate-700/50">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package size={32} className="text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{product.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{product.code}</span>
                <span>{product.category}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
          <div className="bg-white dark:bg-enterprise-800 p-4 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Mevcut Stok</div>
            <div className={`text-2xl font-bold mt-1 ${product.stock <= product.minStock ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
              {product.stock}
            </div>
          </div>
          <div className="bg-white dark:bg-enterprise-800 p-4 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Satış Fiyatı</div>
            <div className="text-2xl font-bold mt-1 text-brand-600 dark:text-brand-400">
              {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : '₺'}{product.price.toLocaleString('tr-TR')}
            </div>
          </div>
          <div className="bg-white dark:bg-enterprise-800 p-4 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Toplam Hareket</div>
            <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
              {movements.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 bg-slate-50/50 dark:bg-slate-800/50">
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'history' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <History size={16} className="mr-2" />
            Hareket Geçmişi
          </button>
          <button 
            onClick={() => setActiveTab('adjust')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'adjust' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <ArrowRightLeft size={16} className="mr-2" />
            Hızlı Stok Düzenle
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50 dark:bg-slate-900/30">
          
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* ... Content remains same ... */}
              {/* Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-enterprise-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                      className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                      className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                 </div>
                 
                 <div className="flex items-center gap-2 flex-1">
                    <Filter size={16} className="text-slate-400" />
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full sm:w-auto text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="all">Tüm İşlemler</option>
                      <option value="sale">Satışlar</option>
                      <option value="purchase">Alışlar</option>
                      <option value="return_in">Satış İadesi</option>
                      <option value="return_out">Alış İadesi</option>
                      <option value="adjustment_inc">Sayım Fazlası</option>
                      <option value="adjustment_dec">Zayi / Fire</option>
                    </select>
                 </div>

                 {/* Filtered Stats */}
                 <div className="flex gap-3 text-xs font-bold items-center border-l border-slate-200 dark:border-slate-700 pl-4">
                    <div className="text-green-600 dark:text-green-400 flex items-center">
                        <TrendingUp size={14} className="mr-1"/>
                        +{totalIn}
                    </div>
                    <div className="text-red-600 dark:text-red-400 flex items-center">
                        <TrendingDown size={14} className="mr-1"/>
                        -{totalOut}
                    </div>
                 </div>
              </div>

              {loading ? (
                  <div className="flex justify-center items-center py-12">
                      <Loader2 size={32} className="animate-spin text-slate-400" />
                  </div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <History size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Bu tarih aralığında hareket bulunamadı.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-enterprise-800 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Tarih</th>
                        <th className="px-4 py-3">İşlem Türü</th>
                        <th className="px-4 py-3">Belge / Açıklama</th>
                        <th className="px-4 py-3">Personel</th>
                        <th className="px-4 py-3 text-right">Miktar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {filteredMovements.map(move => {
                        const badge = getMovementBadge(move);
                        const isPositive = ['purchase', 'return_in', 'adjustment_inc'].includes(move.type);
                        
                        return (
                          <tr key={move.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 text-sm transition-colors">
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                {new Date(move.date).toLocaleDateString('tr-TR')}
                                <span className="text-xs text-slate-400">{new Date(move.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.class}`}>
                                <badge.icon size={12} className="mr-1" />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900 dark:text-white">{move.documentNo || '-'}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{move.description}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{move.performedBy}</td>
                            <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isPositive ? '+' : '-'}{move.quantity}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="max-w-lg mx-auto">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong className="block mb-1">Manuel Stok Düzenleme</strong>
                  Bu işlem stok miktarını doğrudan etkiler. Sayım farkları, zayi (kırık/bozuk) ürünler veya açılış düzeltmeleri için kullanınız.
                </div>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setAdjustForm({...adjustForm, type: 'adjustment_inc'})}
                    className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${adjustForm.type === 'adjustment_inc' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'}`}
                  >
                    <TrendingUp size={24} className="mb-2" />
                    <span className="font-bold">Stok Ekle (+)</span>
                    <span className="text-xs mt-1 opacity-70">Sayım fazlası, giriş</span>
                  </div>
                  <div 
                    onClick={() => setAdjustForm({...adjustForm, type: 'adjustment_dec'})}
                    className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${adjustForm.type === 'adjustment_dec' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'}`}
                  >
                    <TrendingDown size={24} className="mb-2" />
                    <span className="font-bold">Stok Düş (-)</span>
                    <span className="text-xs mt-1 opacity-70">Zayi, kırık, sayım eksiği</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Miktar</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({...adjustForm, quantity: e.target.value})}
                    className="w-full px-4 py-3 text-lg font-bold text-center border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Açıklama (Zorunlu)</label>
                  <textarea 
                    rows={3}
                    value={adjustForm.description}
                    onChange={(e) => setAdjustForm({...adjustForm, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Örn: Depo sayım farkı..."
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-colors flex items-center justify-center ${adjustForm.type === 'adjustment_inc' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  <Save size={20} className="mr-2" />
                  Stok Hareketini Kaydet
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;
