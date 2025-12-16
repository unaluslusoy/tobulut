import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, Search, Filter, Trash2, Plus, History, 
  Printer, CheckSquare, Square, 
  Bold, Italic, Underline, List,
  Tag, Layers, ArrowRightLeft, ShoppingBag, Database, 
  CheckCircle, ArrowRight, Edit, ClipboardCheck, Tags, Lock,
  Image as ImageIcon, X, ChevronDown, MoreHorizontal, AlertCircle,
  Truck, Box, Barcode, Percent, DollarSign, MapPin, Monitor, Scale, Warehouse, Info, CreditCard, Star
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Product, Account, Branch, Collection, StockCount, PurchaseOrder, Transfer, PurchaseOrderItem, TransferItem, ProductVariant } from '../types';
import Modal from '../components/Modal';
import BarcodeModal from '../components/BarcodeModal';
import StockDetailModal from '../components/StockDetailModal';
import { useAuth } from '../context/AuthContext';

// --- RICH TEXT EDITOR COMPONENT ---
const RichTextEditor = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-brand-500 transition-all flex flex-col shadow-sm h-64">
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <button type="button" onClick={() => execCmd('bold')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors" title="Kalın"><Bold size={16} /></button>
        <button type="button" onClick={() => execCmd('italic')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors" title="İtalik"><Italic size={16} /></button>
        <button type="button" onClick={() => execCmd('underline')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors" title="Altı Çizili"><Underline size={16} /></button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors" title="Liste"><List size={16} /></button>
      </div>
      <div 
        ref={editorRef}
        className="p-4 h-full outline-none text-sm text-slate-800 dark:text-slate-200 overflow-y-auto"
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
};

// Extended Interface for Form State
interface ExtendedProductForm extends Partial<Product> {
  sku?: string;
  barcode?: string;
  additionalBarcodes?: string[];
  discountPrice?: number;
  cost?: number; // Cost of goods + overhead
  taxRate?: number;
  isDigital?: boolean;
  trackStock?: boolean;
  trackSerial?: boolean;
  shelfCode?: string;
  weight?: number;
  width?: number;
  height?: number;
  depth?: number;
  locationStocks?: { name: string; stock: number }[]; // Mock location stocks
  unit?: string;
  subUnit?: string;
  conversionRate?: number;
  currency?: 'TRY' | 'USD' | 'EUR';
}

const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency }).format(value);
};

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'list';

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Account[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- SUB-MODULE STATE ---
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  // Modals Management
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [productDetailTab, setProductDetailTab] = useState<'general' | 'pricing' | 'inventory' | 'media'>('general');
  
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isStockCountModalOpen, setIsStockCountModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isStockDetailOpen, setIsStockDetailOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<Product | null>(null);
  
  // Selection & Editing States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Enhanced Product Form State
  const [activeProduct, setActiveProduct] = useState<ExtendedProductForm>({});
  
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Forms for Sub-Modules
  const [activeCollection, setActiveCollection] = useState<Partial<Collection>>({});
  const [activeStockCount, setActiveStockCount] = useState<Partial<StockCount>>({});
  const [activePO, setActivePO] = useState<Partial<PurchaseOrder>>({});
  const [activeTransfer, setActiveTransfer] = useState<Partial<Transfer>>({});

  // --- PERMISSIONS LOGIC ---
  const canEdit = ['superuser', 'admin', 'manager'].includes(user?.role || '');
  const canCreate = ['superuser', 'admin', 'manager', 'technician'].includes(user?.role || '');
  
  // Fetch Data
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prods, accs, brs, cols, counts, pos, trfs] = await Promise.all([
        api.products.getAll(),
        api.accounts.getAll(),
        api.sales.getBranches(),
        api.inventory.getCollections(),
        api.inventory.getStockCounts(),
        api.inventory.getPurchaseOrders(),
        api.inventory.getTransfers()
      ]);
      setProducts(prods);
      setSuppliers(accs.filter(a => a.type === 'supplier'));
      setBranches(brs);
      setCollections(cols);
      setStockCounts(counts);
      setPurchaseOrders(pos);
      setTransfers(trfs);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) setSearchTerm(query);
  }, [searchParams]);

  // --- Handlers: Product ---
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredProducts.map(p => p.id)));
  };

  const openProductDetail = (product?: Product) => {
    if (!canCreate && !product) return; 
    if (!canEdit && product) return;

    setProductDetailTab('general');

    if (product) {
      // Mapping existing product to extended form
      setActiveProduct({ 
        ...product,
        sku: product.code, // Assuming code maps to SKU
        barcode: product.barcode,
        additionalBarcodes: product.additionalBarcodes || [],
        isDigital: false, // Default assumption, API should provide
        trackStock: true,
        taxRate: 20, // Default
        unit: product.unit || 'Adet',
        subUnit: product.subUnit,
        conversionRate: product.conversionRate,
        shelfCode: product.shelfCode,
        trackSerial: product.trackSerial || false,
        currency: product.currency || 'TRY',
        locationStocks: product.stock > 0 ? [{ name: 'Merkez Depo', stock: product.stock }] : [{ name: 'Merkez Depo', stock: 0 }],
        media: product.media || (product.image ? [product.image] : [])
      });
      setIsNewProduct(false);
    } else {
      setActiveProduct({
        id: `PRD-${Date.now()}`,
        name: '',
        description: '',
        status: 'active',
        stock: 0,
        price: 0,
        discountPrice: 0,
        cost: 0,
        taxRate: 20,
        currency: 'TRY',
        media: [],
        variants: [],
        tags: [],
        isDigital: false,
        trackStock: true,
        unit: 'Adet',
        additionalBarcodes: [],
        locationStocks: [
            { name: 'Merkez Depo', stock: 0 }
        ]
      });
      setIsNewProduct(true);
    }
    setTagInput('');
    setBarcodeInput('');
    setIsDetailOpen(true);
  };

  // --- Variant Logic ---
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: '',
      options: []
    };
    setActiveProduct(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }));
  };

  const updateVariantName = (id: string, name: string) => {
    setActiveProduct(prev => ({
      ...prev,
      variants: prev.variants?.map(v => v.id === id ? { ...v, name } : v)
    }));
  };

  const updateVariantOptions = (id: string, optionsStr: string) => {
    const options = optionsStr.split(',').map(s => s.trim()).filter(s => s !== '');
    setActiveProduct(prev => ({
      ...prev,
      variants: prev.variants?.map(v => v.id === id ? { ...v, options } : v)
    }));
  };

  const removeVariant = (id: string) => {
    setActiveProduct(prev => ({
      ...prev,
      variants: prev.variants?.filter(v => v.id !== id)
    }));
  };

  // --- Tag Logic ---
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!activeProduct.tags?.includes(tagInput.trim())) {
        setActiveProduct(prev => ({
          ...prev,
          tags: [...(prev.tags || []), tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setActiveProduct(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  // --- Barcode Logic ---
  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      const newBarcode = barcodeInput.trim();
      // If primary is empty, set primary
      if (!activeProduct.barcode) {
          setActiveProduct(prev => ({ ...prev, barcode: newBarcode }));
      } else if (!activeProduct.additionalBarcodes?.includes(newBarcode) && activeProduct.barcode !== newBarcode) {
          setActiveProduct(prev => ({
              ...prev,
              additionalBarcodes: [...(prev.additionalBarcodes || []), newBarcode]
          }));
      }
      setBarcodeInput('');
    }
  };

  const removeAdditionalBarcode = (bcToRemove: string) => {
      setActiveProduct(prev => ({
          ...prev,
          additionalBarcodes: prev.additionalBarcodes?.filter(b => b !== bcToRemove)
      }));
  };

  // --- Warehouse Logic ---
  const addWarehouse = () => {
    if (!newWarehouseName.trim()) return;
    setActiveProduct(prev => ({
      ...prev,
      locationStocks: [...(prev.locationStocks || []), { name: newWarehouseName, stock: 0 }]
    }));
    setNewWarehouseName('');
  };

  const removeWarehouse = (idx: number) => {
    setActiveProduct(prev => ({
      ...prev,
      locationStocks: prev.locationStocks?.filter((_, i) => i !== idx)
    }));
  };

  // --- Media Logic (Multi-Image Support) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          // Convert FileList to array of URLs
          const newUrls = Array.from(files).map(file => URL.createObjectURL(file as any));
          
          setActiveProduct(prev => {
              const currentMedia = prev.media || [];
              const updatedMedia = [...currentMedia, ...newUrls];
              // If no cover image is set, set the first newly added image as cover
              const newCover = prev.image || newUrls[0];
              return { ...prev, media: updatedMedia, image: newCover };
          });
      }
  };

  const removeImageFromGallery = (indexToRemove: number) => {
      setActiveProduct(prev => {
          const currentMedia = prev.media || [];
          const urlToRemove = currentMedia[indexToRemove];
          const newMedia = currentMedia.filter((_, i) => i !== indexToRemove);
          
          // If we deleted the main/cover image, set a new one
          let newCover = prev.image;
          if (prev.image === urlToRemove) {
              newCover = newMedia.length > 0 ? newMedia[0] : undefined;
          }
          
          return { ...prev, media: newMedia, image: newCover };
      });
  };

  const setAsCover = (url: string) => {
      setActiveProduct(prev => ({ ...prev, image: url }));
  };

  // --- Save Logic ---
  const handleSaveProduct = async () => {
    try {
      const productToSave = activeProduct as Product;
      
      // Calculate total stock from locations if tracking is on
      if (activeProduct.trackStock && activeProduct.locationStocks) {
          productToSave.stock = activeProduct.locationStocks.reduce((acc, loc) => acc + loc.stock, 0);
      }

      if (!productToSave.name) { alert("Ürün adı zorunludur."); return; }
      if (isNewProduct) {
        await api.products.create(productToSave);
        setProducts([productToSave, ...products]);
      } else {
        await api.products.update(productToSave);
        setProducts(products.map(p => p.id === productToSave.id ? productToSave : p));
      }
      setIsDetailOpen(false);
    } catch (error) { alert("Hata oluştu."); }
  };

  // --- Omitted Collection, Stock Count, PO, Transfer Handlers for brevity (same as original) ---
  const openCollectionModal = (col?: Collection) => { if (col) setActiveCollection({ ...col }); else setActiveCollection({ id: `COL-${Date.now()}`, name: '', description: '', productIds: [], status: 'active' }); setIsCollectionModalOpen(true); };
  const handleSaveCollection = async () => { if (!activeCollection.name) return; try { const col = activeCollection as Collection; if (collections.find(c => c.id === col.id)) { await api.inventory.updateCollection(col); setCollections(collections.map(c => c.id === col.id ? col : c)); } else { await api.inventory.createCollection(col); setCollections([col, ...collections]); } setIsCollectionModalOpen(false); } catch (e) { alert("Hata oluştu."); } };
  const openStockCountModal = (count?: StockCount) => { if (count) setActiveStockCount({ ...count }); else { const initialItems = products.map(p => ({ productId: p.id, productName: p.name, currentStock: p.stock, countedStock: p.stock })); setActiveStockCount({ id: `CNT-${Date.now()}`, date: new Date().toISOString(), branchName: 'Merkez Depo', status: 'draft', items: initialItems, notes: '' }); } setIsStockCountModalOpen(true); };
  const handleStockCountChange = (productId: string, val: number) => { const newItems = activeStockCount.items?.map(item => item.productId === productId ? { ...item, countedStock: val } : item); setActiveStockCount({ ...activeStockCount, items: newItems }); };
  const handleSaveStockCount = async (status: 'draft' | 'completed') => { const toSave = { ...activeStockCount, status } as StockCount; try { if (stockCounts.find(c => c.id === toSave.id)) { await api.inventory.updateStockCount(toSave); setStockCounts(stockCounts.map(c => c.id === toSave.id ? toSave : c)); } else { await api.inventory.createStockCount(toSave); setStockCounts([toSave, ...stockCounts]); } if (status === 'completed') { const updatedProducts = await api.products.getAll(); setProducts(updatedProducts); alert("Sayım tamamlandı ve stoklar güncellendi."); } setIsStockCountModalOpen(false); } catch(e) { alert("Hata oluştu."); } };
  const openPOModal = (po?: PurchaseOrder) => { if (po) setActivePO({ ...po }); else setActivePO({ id: `PO-${Date.now()}`, supplierId: '', supplierName: '', date: new Date().toISOString().slice(0, 10), expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'draft', items: [], totalAmount: 0, notes: '' }); setIsPOModalOpen(true); };
  const handleAddPOItem = (product: Product) => { const newItem: PurchaseOrderItem = { productId: product.id, productName: product.name, quantity: 1, unitCost: product.price * 0.6, total: product.price * 0.6 }; const newItems = [...(activePO.items || []), newItem]; const newTotal = newItems.reduce((sum, i) => sum + i.total, 0); setActivePO({ ...activePO, items: newItems, totalAmount: newTotal }); };
  const updatePOItem = (productId: string, field: keyof PurchaseOrderItem, value: number) => { const newItems = activePO.items?.map(item => { if (item.productId === productId) { const updated = { ...item, [field]: value }; updated.total = updated.quantity * updated.unitCost; return updated; } return item; }); const newTotal = newItems?.reduce((sum, i) => sum + i.total, 0); setActivePO({ ...activePO, items: newItems, totalAmount: newTotal }); };
  const handleSavePO = async (status?: PurchaseOrder['status']) => { const finalStatus = status || activePO.status || 'draft'; const supplier = suppliers.find(s => s.id === activePO.supplierId); const toSave = { ...activePO, supplierName: supplier?.name || activePO.supplierName, status: finalStatus } as PurchaseOrder; try { if (purchaseOrders.find(p => p.id === toSave.id)) { await api.inventory.updatePurchaseOrder(toSave); setPurchaseOrders(purchaseOrders.map(p => p.id === toSave.id ? toSave : p)); } else { await api.inventory.createPurchaseOrder(toSave); setPurchaseOrders([toSave, ...purchaseOrders]); } if (finalStatus === 'received') { const updatedProducts = await api.products.getAll(); setProducts(updatedProducts); alert("Ürünler stoğa eklendi."); } setIsPOModalOpen(false); } catch(e) { alert("Hata oluştu."); } };
  const openTransferModal = (trf?: Transfer) => { if (trf) setActiveTransfer({ ...trf }); else setActiveTransfer({ id: `TRF-${Date.now()}`, fromBranch: '', toBranch: '', date: new Date().toISOString().slice(0, 10), status: 'pending', items: [], notes: '' }); setIsTransferModalOpen(true); };
  const handleAddTransferItem = (product: Product) => { const newItem: TransferItem = { productId: product.id, productName: product.name, quantity: 1 }; setActiveTransfer({ ...activeTransfer, items: [...(activeTransfer.items || []), newItem] }); };
  const handleSaveTransfer = async (status?: Transfer['status']) => { const finalStatus = status || activeTransfer.status || 'pending'; const toSave = { ...activeTransfer, status: finalStatus } as Transfer; try { if (transfers.find(t => t.id === toSave.id)) { await api.inventory.updateTransfer(toSave); setTransfers(transfers.map(t => t.id === toSave.id ? toSave : t)); } else { await api.inventory.createTransfer(toSave); setTransfers([toSave, ...transfers]); } if (finalStatus === 'shipped') { const updatedProducts = await api.products.getAll(); setProducts(updatedProducts); alert("Transfer başlatıldı ve stok çıkışı yapıldı."); } setIsTransferModalOpen(false); } catch(e) { alert("Hata oluştu."); } };
  const handleOpenStockDetail = (product: Product, e?: React.MouseEvent) => { if(e) e.stopPropagation(); setSelectedStockProduct(product); setIsStockDetailOpen(true); };
  const handleUpdateStockFromModal = async (productId: string, newStock: number) => { try { setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p)); const product = products.find(p => p.id === productId); if(product) { await api.products.update({...product, stock: newStock}); } } catch (e) { console.error(e); } };

  const filteredProducts = products.filter(p => 
    p.name.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')) || 
    p.code.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
  );

  const getTabClass = (id: string) => `
    flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
    ${activeTab === id 
      ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' 
      : 'bg-white dark:bg-enterprise-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-gray-200 dark:hover:border-slate-700'}
  `;

  // Calculated Profit Margin
  const profit = (activeProduct.price || 0) - (activeProduct.cost || 0);
  const margin = activeProduct.price ? ((profit / activeProduct.price) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 space-y-6">
      {isBarcodeModalOpen && <BarcodeModal isOpen={true} onClose={() => setIsBarcodeModalOpen(false)} selectedProducts={products.filter(p => selectedIds.has(p.id))} />}
      {selectedStockProduct && <StockDetailModal product={selectedStockProduct} isOpen={isStockDetailOpen} onClose={() => setIsStockDetailOpen(false)} onUpdateStock={handleUpdateStockFromModal} />}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Stok ve Ürün Yönetimi</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Envanter takibi, koleksiyonlar ve depolar arası transferler.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'list' && (
            <>
              {selectedIds.size > 0 && (
                <button onClick={() => setIsBarcodeModalOpen(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-900/20 flex items-center transition-all">
                  <Printer size={16} className="mr-2" /> Etiket ({selectedIds.size})
                </button>
              )}
              {canCreate && (
                <button onClick={() => openProductDetail()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-900/20 flex items-center transition-all">
                  <Plus size={16} className="mr-2" /> Ürün Ekle
                </button>
              )}
            </>
          )}
          {activeTab === 'collections' && canEdit && <button onClick={() => openCollectionModal()} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-lg shadow-brand-900/20 flex items-center transition-all"><Plus size={16} className="mr-2" /> Koleksiyon Ekle</button>}
          {activeTab === 'inventory' && canEdit && <button onClick={() => openStockCountModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 flex items-center transition-all"><Plus size={16} className="mr-2" /> Sayım Başlat</button>}
          {activeTab === 'orders' && canEdit && <button onClick={() => openPOModal()} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 shadow-lg shadow-orange-900/20 flex items-center transition-all"><Plus size={16} className="mr-2" /> Sipariş Oluştur</button>}
          {activeTab === 'transfers' && canEdit && <button onClick={() => openTransferModal()} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-900/20 flex items-center transition-all"><Plus size={16} className="mr-2" /> Transfer Yap</button>}
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        <button onClick={() => setSearchParams({ tab: 'list' })} className={getTabClass('list')}><Package size={16} className="mr-2" /> Ürünler</button>
        <button onClick={() => setSearchParams({ tab: 'collections' })} className={getTabClass('collections')}><Tags size={16} className="mr-2" /> Koleksiyonlar</button>
        <button onClick={() => setSearchParams({ tab: 'inventory' })} className={getTabClass('inventory')}><ClipboardCheck size={16} className="mr-2" /> Sayım</button>
        {canEdit && <button onClick={() => setSearchParams({ tab: 'orders' })} className={getTabClass('orders')}><ShoppingBag size={16} className="mr-2" /> Satın Alma</button>}
        <button onClick={() => setSearchParams({ tab: 'transfers' })} className={getTabClass('transfers')}><ArrowRightLeft size={16} className="mr-2" /> Transferler</button>
      </div>

      {activeTab === 'list' && (
        <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 transition-colors overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
            <div className="relative w-64">
              <input type="text" placeholder="Ürün ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all" />
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            </div>
            <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Filter size={18} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-12 text-center"><button onClick={toggleSelectAll} className="text-slate-400 hover:text-brand-600 transition-colors">{selectedIds.size > 0 && selectedIds.size === filteredProducts.length ? <CheckSquare size={18} /> : <Square size={18} />}</button></th>
                  <th className="px-6 py-4">Ürün Detayı</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4 text-center">Stok</th>
                  <th className="px-6 py-4 text-right">Fiyat</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  return (
                    <tr key={product.id} className={`group transition-all hover:bg-slate-50 dark:hover:bg-slate-700/30 ${isSelected ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
                      <td className="px-6 py-4 text-center" onClick={(e) => { e.stopPropagation(); toggleSelection(product.id); }}><button className={`transition-colors ${isSelected ? 'text-brand-600' : 'text-slate-300 hover:text-slate-400'}`}>{isSelected ? <CheckSquare size={18} /> : <Square size={18} />}</button></td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-3 ${canEdit ? 'cursor-pointer group' : ''}`} onClick={() => canEdit && openProductDetail(product)}>
                           <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">{product.image ? <img src={product.image} className="w-full h-full object-cover rounded-lg" /> : <Package size={20} />}</div>
                           <div><div className={`font-bold text-slate-900 dark:text-white text-sm ${canEdit ? 'group-hover:text-brand-600 transition-colors' : ''}`}>{product.name}</div><div className="text-xs text-slate-500 font-mono mt-0.5">{product.code}</div></div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{product.category}</span></td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold text-sm ${product.stock <= product.minStock ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {product.stock} {product.unit || 'Adet'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right"><span className="font-bold text-slate-900 dark:text-white">{formatCurrency(product.price, product.currency || 'TRY')}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenStockDetail(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Stok Geçmişi"><History size={16} /></button>
                            {canEdit && <button onClick={() => openProductDetail(product)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors" title="Düzenle"><Edit size={16} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other Tabs omitted for brevity as requested */}
      {/* ... */}

      {/* --- PRODUCT DETAIL / EDIT MODAL (FULL SCREEN + TABS) --- */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={activeProduct.name || 'Yeni Ürün Ekle'} size="full">
         <div className="flex flex-col h-full bg-slate-50 dark:bg-enterprise-900">
            
            {/* Header / Tabs */}
            <div className="bg-white dark:bg-enterprise-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2 flex items-center justify-between sticky top-0 z-10">
                <div className="flex space-x-1">
                    <button 
                        onClick={() => setProductDetailTab('general')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${productDetailTab === 'general' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        <Info size={16} className="inline mr-2" /> Genel
                    </button>
                    <button 
                        onClick={() => setProductDetailTab('pricing')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${productDetailTab === 'pricing' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        <DollarSign size={16} className="inline mr-2" /> Fiyat & Finans
                    </button>
                    <button 
                        onClick={() => setProductDetailTab('inventory')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${productDetailTab === 'inventory' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        <Database size={16} className="inline mr-2" /> Stok & Depo
                    </button>
                    <button 
                        onClick={() => setProductDetailTab('media')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${productDetailTab === 'media' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        <ImageIcon size={16} className="inline mr-2" /> Medya & Varyasyon
                    </button>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => setIsDetailOpen(false)} className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-bold transition-colors">Vazgeç</button>
                    <button onClick={handleSaveProduct} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/20 font-bold transition-all">Kaydet</button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
                
                {/* --- GENERAL TAB --- */}
                {productDetailTab === 'general' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-down">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Ürün Adı</label>
                                        <button 
                                            type="button" 
                                            onClick={() => setActiveProduct({...activeProduct, isDigital: !activeProduct.isDigital})}
                                            className={`text-xs px-2 py-1 rounded border flex items-center gap-1 transition-colors ${activeProduct.isDigital ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}
                                        >
                                            {activeProduct.isDigital ? <Monitor size={12}/> : <Box size={12}/>}
                                            {activeProduct.isDigital ? 'Dijital Ürün (Hizmet)' : 'Fiziksel Ürün (Stoklu)'}
                                        </button>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={activeProduct.name} 
                                        onChange={e => setActiveProduct({...activeProduct, name: e.target.value})} 
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none text-lg font-medium" 
                                        placeholder="Örn: Pamuklu Tişört"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Açıklama</label>
                                    <RichTextEditor 
                                        value={activeProduct.description || ''} 
                                        onChange={(val) => setActiveProduct({...activeProduct, description: val})} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Organizasyon</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                                        <input type="text" value={activeProduct.category} onChange={e => setActiveProduct({...activeProduct, category: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-1 focus:ring-brand-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Marka / Satıcı</label>
                                        <input type="text" value={activeProduct.vendor || ''} onChange={e => setActiveProduct({...activeProduct, vendor: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-1 focus:ring-brand-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Koleksiyon</label>
                                        <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-1 focus:ring-brand-500 outline-none">
                                            <option>Seçiniz...</option>
                                            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Etiketler</h3>
                                <input 
                                    type="text" 
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-1 focus:ring-brand-500 outline-none mb-3"
                                    placeholder="Etiket ekle (Enter)"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {activeProduct.tags?.map(tag => (
                                        <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs flex items-center border border-slate-200 dark:border-slate-600">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PRICING TAB --- */}
                {productDetailTab === 'pricing' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-down">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <CreditCard size={20} className="mr-2 text-green-600"/> Satış Fiyatlandırması
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Para Birimi</label>
                                    <div className="flex gap-4">
                                        {['TRY', 'USD', 'EUR'].map(curr => (
                                            <label key={curr} className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${activeProduct.currency === curr ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                <input type="radio" name="currency" value={curr} checked={activeProduct.currency === curr} onChange={() => setActiveProduct({...activeProduct, currency: curr as any})} className="hidden" />
                                                <span className="font-bold">{curr}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Satış Fiyatı</label>
                                        <div className="relative">
                                            <input type="number" step="0.01" value={activeProduct.price} onChange={e => setActiveProduct({...activeProduct, price: parseFloat(e.target.value)})} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-lg font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
                                            <div className="absolute right-3 top-3 text-sm text-slate-400 pointer-events-none font-bold">
                                                {formatCurrency(activeProduct.price || 0, activeProduct.currency || 'TRY')}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">İndirimli Fiyat</label>
                                        <div className="relative">
                                            <input type="number" step="0.01" value={activeProduct.discountPrice || ''} onChange={e => setActiveProduct({...activeProduct, discountPrice: parseFloat(e.target.value)})} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="Opsiyonel" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Scale size={20} className="mr-2 text-blue-600"/> Maliyet ve Vergi
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Maliyet</label>
                                        <input type="number" step="0.01" value={activeProduct.cost || ''} onChange={e => setActiveProduct({...activeProduct, cost: parseFloat(e.target.value)})} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder="0.00" />
                                        <p className="text-xs text-slate-500 mt-1">Birim maliyet.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">KDV Oranı (%)</label>
                                        <select value={activeProduct.taxRate} onChange={e => setActiveProduct({...activeProduct, taxRate: parseFloat(e.target.value)})} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500">
                                            <option value="0">%0</option>
                                            <option value="1">%1</option>
                                            <option value="10">%10</option>
                                            <option value="20">%20</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-slate-500 uppercase">Tahmini Kar Marjı</p>
                                        <p className="text-xs text-slate-400">Satış - Maliyet</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-black ${Number(margin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>%{margin}</div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Kar: {formatCurrency(profit, activeProduct.currency || 'TRY')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- INVENTORY TAB --- */}
                {productDetailTab === 'inventory' && !activeProduct.isDigital && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-down">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Database size={20} className="mr-2 text-purple-600"/> Stok Takibi & Kodlar
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                                    <input type="checkbox" checked={activeProduct.trackStock} onChange={e => setActiveProduct({...activeProduct, trackStock: e.target.checked})} className="w-5 h-5 text-brand-600 rounded" />
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Bu ürün için stok takibi yap</label>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">SKU (Stok Kodu)</label>
                                        <input type="text" value={activeProduct.sku || ''} onChange={e => setActiveProduct({...activeProduct, sku: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Raf / Konum</label>
                                        <input type="text" value={activeProduct.shelfCode || ''} onChange={e => setActiveProduct({...activeProduct, shelfCode: e.target.value})} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Barkodlar (Enter ile ekle)</label>
                                    <div className="relative">
                                        <input type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeKeyDown} className="w-full pl-10 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" placeholder={!activeProduct.barcode ? "Ana barkod..." : "Ek barkod..."} />
                                        <Barcode size={18} className="absolute left-3 top-3.5 text-slate-400" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {activeProduct.barcode && (
                                            <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-lg text-sm font-mono flex items-center border border-brand-200 dark:border-brand-800 shadow-sm">
                                                <Lock size={12} className="mr-2" /> {activeProduct.barcode}
                                            </span>
                                        )}
                                        {activeProduct.additionalBarcodes?.map((bc, idx) => (
                                            <span key={idx} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-mono flex items-center group border border-slate-200 dark:border-slate-600">
                                                {bc}
                                                <button onClick={() => removeAdditionalBarcode(bc)} className="ml-2 hover:text-red-500"><X size={14} /></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Warehouse size={20} className="mr-2 text-orange-600"/> Depo Stokları
                            </h3>
                            
                            {activeProduct.trackStock ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar">
                                        {activeProduct.locationStocks?.map((loc, idx) => (
                                            <div key={idx} className="flex justify-between items-center mb-3 last:mb-0 p-2 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <MapPin size={16} className="text-slate-400" />
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{loc.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={loc.stock} 
                                                        onChange={(e) => {
                                                            const newLocs = [...(activeProduct.locationStocks || [])];
                                                            newLocs[idx].stock = parseInt(e.target.value) || 0;
                                                            setActiveProduct({...activeProduct, locationStocks: newLocs});
                                                        }}
                                                        className="w-20 p-1 text-right border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-sm font-bold"
                                                    />
                                                    <button onClick={() => removeWarehouse(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                        <input 
                                            type="text" 
                                            value={newWarehouseName}
                                            onChange={e => setNewWarehouseName(e.target.value)}
                                            placeholder="Yeni Depo Adı (Örn: Kadıköy Şube)"
                                            className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm"
                                        />
                                        <button onClick={addWarehouse} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-brand-600 hover:text-white rounded-lg text-sm font-bold transition-colors">Ekle</button>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-sm font-bold text-slate-500">TOPLAM STOK</span>
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                                            {activeProduct.locationStocks?.reduce((acc, l) => acc + l.stock, 0) || 0}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <p>Stok takibi kapalı.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- MEDIA TAB --- */}
                {productDetailTab === 'media' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-down">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ürün Görselleri</h3>
                                {activeProduct.media && activeProduct.media.length > 0 && (
                                    <span className="text-xs text-slate-500">{activeProduct.media.length} görsel</span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                {/* Upload Button */}
                                <div 
                                    className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 cursor-pointer transition-all"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        multiple 
                                        onChange={handleImageUpload} 
                                    />
                                    <Plus size={32} className="mb-2" />
                                    <span className="text-xs font-medium">Görsel Yükle</span>
                                </div>

                                {/* Gallery */}
                                {activeProduct.media?.map((url, idx) => (
                                    <div key={idx} className={`aspect-square relative group rounded-xl overflow-hidden border-2 ${activeProduct.image === url ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-slate-200 dark:border-slate-600'} shadow-sm`}>
                                        <img src={url} className="w-full h-full object-cover" />
                                        
                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <button 
                                                onClick={() => setAsCover(url)} 
                                                className={`p-2 rounded-full ${activeProduct.image === url ? 'bg-yellow-400 text-white' : 'bg-white/20 text-white hover:bg-yellow-400'}`}
                                                title="Kapak Fotoğrafı Yap"
                                            >
                                                <Star size={16} fill={activeProduct.image === url ? "currentColor" : "none"} />
                                            </button>
                                            <button 
                                                onClick={() => removeImageFromGallery(idx)} 
                                                className="bg-white/20 text-white p-2 rounded-full hover:bg-red-600"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Cover Badge */}
                                        {activeProduct.image === url && (
                                            <div className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                                KAPAK
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Varyasyonlar (Renk / Beden)</h3>
                            <div className="space-y-4">
                                {activeProduct.variants?.map((variant) => (
                                    <div key={variant.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl relative group">
                                        <button onClick={() => removeVariant(variant.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-1">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Seçenek Adı</label>
                                                <input type="text" value={variant.name} onChange={(e) => updateVariantName(variant.id, e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-sm" placeholder="Örn: Beden" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Değerler (Virgülle ayırın)</label>
                                                <input type="text" value={variant.options.join(', ')} onChange={(e) => updateVariantOptions(variant.id, e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-sm" placeholder="Örn: S, M, L" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addVariant} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 hover:text-brand-600 hover:border-brand-500 font-bold transition-all flex items-center justify-center gap-2">
                                    <Plus size={18} /> Varyasyon Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
         </div>
      </Modal>

    </div>
  );
};

export default Inventory;