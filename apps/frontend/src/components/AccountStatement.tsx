
import React, { useState, useMemo } from 'react';
import { Account, Invoice, Transaction } from '../types';
import { Printer, X, Calendar, Download, Filter } from 'lucide-react';

interface AccountStatementProps {
  account: Account;
  invoices: Invoice[];
  transactions: Transaction[];
  onClose: () => void;
}

const AccountStatement: React.FC<AccountStatementProps> = ({ account, invoices, transactions, onClose }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), // First day of current month
    end: new Date().toISOString().slice(0, 10)
  });

  const handlePrint = () => {
    window.print();
  };

  // Combine and Sort Data
  const statementData = useMemo(() => {
    const combined = [];

    // 1. Add Invoices
    // Sales Invoice: Customer Debited (Borç)
    // Purchase Invoice: We are Debited -> Customer Credited (Alacak) relative to us? 
    // Convention: 
    // Sales Invoice -> Debit (Borç)
    // Purchase Invoice -> Credit (Alacak)
    
    invoices
      .filter(inv => inv.accountId === account.id)
      .forEach(inv => {
        combined.push({
          id: inv.id,
          date: inv.date,
          type: 'invoice',
          refNumber: inv.invoiceNumber,
          description: inv.type === 'sales' ? 'Satış Faturası' : 'Alış Faturası',
          debit: inv.type === 'sales' ? inv.total : 0,
          credit: inv.type === 'purchase' ? inv.total : 0,
          currency: inv.currency
        });
      });

    // 2. Add Transactions (Payments)
    // Income (Tahsilat) -> Customer Credit (Alacak) - reduces their debt
    // Expense (Tediye) -> Customer Debit (Borç) - we paid them (e.g. refund or supplier payment)
    
    transactions
      .filter(tx => tx.accountId === account.id)
      .forEach(tx => {
        combined.push({
          id: tx.id,
          date: tx.date,
          type: 'transaction',
          refNumber: tx.id,
          description: tx.description || (tx.type === 'income' ? 'Tahsilat' : 'Tediye'),
          debit: tx.type === 'expense' ? tx.amount : 0,  // We paid -> Debit to Supplier
          credit: tx.type === 'income' ? tx.amount : 0,  // They paid -> Credit to Customer
          currency: 'TRY' // Assuming transactions are base currency for now
        });
      });

    // Sort by Date
    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [account.id, invoices, transactions]);

  // Filter by Date
  const filteredData = statementData.filter(item => {
    const itemDate = item.date.slice(0, 10);
    return itemDate >= dateRange.start && itemDate <= dateRange.end;
  });

  // Calculate Running Balance
  let runningBalance = 0; 
  // For a true statement, we should calculate "Transfer (Devir)" balance from items before start date.
  
  const prePeriodData = statementData.filter(item => item.date.slice(0, 10) < dateRange.start);
  const transferBalance = prePeriodData.reduce((acc, item) => acc + (item.debit - item.credit), 0);
  
  runningBalance = transferBalance;

  const rowsWithBalance = filteredData.map(item => {
    runningBalance += (item.debit - item.credit);
    return { ...item, balance: runningBalance };
  });

  const totalDebit = rowsWithBalance.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = rowsWithBalance.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center py-8 print:p-0 print:bg-white print:static print:block">
      
      {/* Controls - Hidden on Print */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-between px-6 shadow-sm z-50 print:hidden border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
           <div className="text-sm font-bold text-gray-700 dark:text-slate-300">Cari Ekstre</div>
           <div className="h-6 w-px bg-gray-300 dark:bg-slate-700"></div>
           <div className="flex items-center gap-2">
             <div className="relative">
               <Calendar size={14} className="absolute left-2 top-2 text-gray-500 dark:text-slate-400" />
               <input 
                 type="date" 
                 value={dateRange.start}
                 onChange={e => setDateRange({...dateRange, start: e.target.value})}
                 className="pl-7 pr-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none"
               />
             </div>
             <span className="text-gray-400 dark:text-slate-600">-</span>
             <div className="relative">
               <Calendar size={14} className="absolute left-2 top-2 text-gray-500 dark:text-slate-400" />
               <input 
                 type="date" 
                 value={dateRange.end}
                 onChange={e => setDateRange({...dateRange, end: e.target.value})}
                 className="pl-7 pr-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-500 outline-none"
               />
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Printer size={16} />
            Yazdır
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* A4 Page */}
      <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl mx-auto mt-16 p-[10mm] relative text-gray-900 print:shadow-none print:m-0 print:w-full print:h-full box-border text-sm rounded-sm">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">CARİ HESAP EKSTRESİ</h1>
            <p className="text-gray-500 text-xs">Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-brand-700 text-lg">TODESTEK BİLİŞİM</div>
            <div className="text-xs text-gray-500">
              Teknoloji Mah. Sanayi Cad. No:42<br/>
              Maslak, İstanbul<br/>
              Tel: +90 850 123 45 67
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Cari Hesap Bilgileri</span>
              <h2 className="text-lg font-bold text-gray-900">{account.name}</h2>
              <div className="text-xs text-gray-600 mt-1">
                {account.authorizedPerson}<br/>
                {account.taxNumber && `VKN/TCKN: ${account.taxNumber}`} <br/>
                {account.city} / {account.district}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Tarih Aralığı</span>
              <div className="font-medium text-gray-900">
                {new Date(dateRange.start).toLocaleDateString('tr-TR')} - {new Date(dateRange.end).toLocaleDateString('tr-TR')}
              </div>
              <div className="mt-2 inline-block text-left">
                 <div className="text-xs text-gray-500">Devir Bakiyesi</div>
                 <div className={`font-bold ${transferBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {transferBalance >= 0 ? '(B) ' : '(A) '}
                   ₺{Math.abs(transferBalance).toLocaleString('tr-TR', {minimumFractionDigits:2})}
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-800 text-xs uppercase font-bold text-gray-600">
              <th className="py-2 pl-2">Tarih</th>
              <th className="py-2">Belge No</th>
              <th className="py-2">Açıklama</th>
              <th className="py-2 text-right">Borç</th>
              <th className="py-2 text-right">Alacak</th>
              <th className="py-2 text-right pr-2">Bakiye</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {/* Transfer Row */}
            <tr className="border-b border-gray-100 bg-gray-50 font-medium text-gray-500">
              <td className="py-2 pl-2" colSpan={3}>DEVİR BAKİYESİ</td>
              <td className="py-2 text-right">{transferBalance > 0 ? `₺${transferBalance.toLocaleString('tr-TR', {minimumFractionDigits:2})}` : '-'}</td>
              <td className="py-2 text-right">{transferBalance < 0 ? `₺${Math.abs(transferBalance).toLocaleString('tr-TR', {minimumFractionDigits:2})}` : '-'}</td>
              <td className={`py-2 text-right pr-2 ${transferBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 {transferBalance >= 0 ? '(B) ' : '(A) '}
                 ₺{Math.abs(transferBalance).toLocaleString('tr-TR', {minimumFractionDigits:2})}
              </td>
            </tr>

            {rowsWithBalance.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">Bu tarih aralığında hareket bulunamadı.</td>
              </tr>
            ) : (
              rowsWithBalance.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pl-2 whitespace-nowrap">{new Date(row.date).toLocaleDateString('tr-TR')}</td>
                  <td className="py-2 font-mono text-gray-600">{row.refNumber}</td>
                  <td className="py-2">{row.description}</td>
                  <td className="py-2 text-right font-medium text-gray-700">
                    {row.debit > 0 ? `₺${row.debit.toLocaleString('tr-TR', {minimumFractionDigits:2})}` : '-'}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-700">
                    {row.credit > 0 ? `₺${row.credit.toLocaleString('tr-TR', {minimumFractionDigits:2})}` : '-'}
                  </td>
                  <td className={`py-2 text-right pr-2 font-bold ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.balance >= 0 ? '(B) ' : '(A) '}
                    ₺{Math.abs(row.balance).toLocaleString('tr-TR', {minimumFractionDigits:2})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800 font-bold text-xs bg-gray-50">
              <td colSpan={3} className="py-3 pl-2 text-right">DÖNEM TOPLAMI</td>
              <td className="py-3 text-right">₺{totalDebit.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
              <td className="py-3 text-right">₺{totalCredit.toLocaleString('tr-TR', {minimumFractionDigits:2})}</td>
              <td className="py-3 text-right pr-2">-</td>
            </tr>
            <tr className="border-t border-gray-300 font-bold text-sm">
              <td colSpan={5} className="py-3 pl-2 text-right text-gray-900">GENEL BAKİYE</td>
              <td className={`py-3 text-right pr-2 ${runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 {runningBalance >= 0 ? '(B) ' : '(A) '}
                 ₺{Math.abs(runningBalance).toLocaleString('tr-TR', {minimumFractionDigits:2})}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer info */}
        <div className="absolute bottom-[10mm] left-[10mm] right-[10mm] text-[10px] text-gray-400 text-center border-t border-gray-100 pt-2">
          Sayın müşterimiz, bakiyede mutabık olmadığımızı düşünüyorsanız lütfen 7 gün içinde tarafımıza bilgi veriniz. <br/>
          Mutabakat için e-posta: muhasebe@todestek.com
        </div>

      </div>
    </div>
  );
};

export default AccountStatement;
