
import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, UserPlus, Trash2, Users, Banknote, CalendarCheck, 
  CheckCircle, XCircle, Clock, AlertCircle, Calendar, DollarSign, Loader2,
  Briefcase, MoreHorizontal, Search, Filter, Eye, EyeOff
} from 'lucide-react';
import { api } from '../services/api';
import { Employee, Payroll, LeaveRequest } from '../types';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const HR: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'leaves'>('employees');
  
  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Forms
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    salary: ''
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Permissions Check
  const canViewSalary = ['superuser', 'admin', 'manager', 'accountant'].includes(user?.role || '');
  const canEdit = ['superuser', 'admin', 'manager'].includes(user?.role || '');

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedEmployees, fetchedPayrolls, fetchedLeaves] = await Promise.all([
                api.hr.getEmployees(),
                api.hr.getPayrolls(),
                api.hr.getLeaves()
            ]);
            setEmployees(fetchedEmployees);
            setPayrolls(fetchedPayrolls);
            setLeaves(fetchedLeaves);
        } catch (error) {
            console.error("Failed to load HR data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // --- Handlers ---

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEmployee: Employee = {
      id: `EMP-${Math.floor(Math.random() * 10000)}`,
      tenantId: user?.tenantId || 'tenant-1',
      name: employeeForm.name,
      position: employeeForm.position,
      department: employeeForm.department,
      status: 'active',
      joinDate: new Date().toISOString(),
      avatar: `https://ui-avatars.com/api/?name=${employeeForm.name}&background=random`,
      salary: parseFloat(employeeForm.salary) || 0
    };

    try {
        await api.hr.createEmployee(newEmployee);
        setEmployees([...employees, newEmployee]);
        setIsEmployeeModalOpen(false);
        setEmployeeForm({ name: '', position: '', department: '', email: '', phone: '', salary: '' });
    } catch (error) {
        alert("Personel eklenirken hata oluştu.");
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(emp => emp.id === leaveForm.employeeId);
    if (!employee) return;

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave: LeaveRequest = {
      id: `LVE-${Date.now()}`,
      tenantId: user?.tenantId || 'tenant-1',
      employeeId: employee.id,
      employeeName: employee.name,
      type: leaveForm.type as any,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days: days,
      reason: leaveForm.reason,
      status: 'pending'
    };

    try {
        await api.hr.createLeave(newLeave);
        setLeaves([newLeave, ...leaves]);
        setIsLeaveModalOpen(false);
        setLeaveForm({ employeeId: '', type: 'annual', startDate: '', endDate: '', reason: '' });
    } catch (error) {
        alert("İzin talebi oluşturulurken hata oluştu.");
    }
  };

  const handlePaySalary = async (payrollId: string) => {
    if (window.confirm('Ödeme işlemini onaylıyor musunuz? Kasa/Banka çıkışı yapılacaktır.')) {
        try {
            const payroll = payrolls.find(p => p.id === payrollId);
            if (payroll) {
                const updatedPayroll = { ...payroll, status: 'paid' as const, paymentDate: new Date().toISOString() };
                await api.hr.updatePayroll(updatedPayroll);
                setPayrolls(prev => prev.map(p => p.id === payrollId ? updatedPayroll : p));
            }
        } catch (error) {
            alert("Maaş ödemesi kaydedilemedi.");
        }
    }
  };

  const handleLeaveAction = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
            const updatedLeave = { ...leave, status };
            await api.hr.updateLeave(updatedLeave);
            setLeaves(prev => prev.map(l => l.id === leaveId ? updatedLeave : l));
        }
    } catch (error) {
        alert("İzin durumu güncellenemedi.");
    }
  };

  const handleDeleteEmployee = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu personel kaydını silmek istediğinize emin misiniz?')) {
      try {
          await api.hr.deleteEmployee(id);
          setEmployees(employees.filter(emp => emp.id !== id));
      } catch (error) {
          console.error(error);
      }
    }
  };

  // Stats
  const totalMonthlySalary = canViewSalary ? payrolls
    .filter(p => p.status === 'pending')
    .reduce((acc, curr) => acc + curr.netSalary, 0) : 0;
  
  const activeLeaveCount = employees.filter(e => e.status === 'on_leave').length;

  const filteredEmployees = employees.filter(e => 
    e.id !== 'EMP-VIRTUAL' && 
    (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     e.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none text-slate-900 dark:text-white transition-all";

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen text-slate-500 flex-col">
            <Loader2 size={40} className="animate-spin mb-4 text-brand-600" />
            <p>İK verileri yükleniyor...</p>
        </div>
      );
  }

  return (
    <div className="p-6 space-y-8">
      
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-brand-600" />
            İnsan Kaynakları
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Personel, bordro ve izin yönetimi.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-4 py-2 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center transition-colors"
          >
            <CalendarCheck size={16} className="mr-2" />
            İzin Talebi Gir
          </button>
          {canEdit && (
            <button 
                onClick={() => setIsEmployeeModalOpen(true)}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center transition-colors"
            >
                <UserPlus size={16} className="mr-2" />
                Personel Ekle
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 flex justify-between items-start group hover:-translate-y-1 transition-all">
           <div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Toplam Personel</p>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white">{employees.filter(e => e.id !== 'EMP-VIRTUAL').length}</h3>
           </div>
           <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
             <Users size={24} />
           </div>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 flex justify-between items-start group hover:-translate-y-1 transition-all">
           <div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Ödenecek Maaşlar</p>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {canViewSalary ? `₺${totalMonthlySalary.toLocaleString('tr-TR')}` : '*******'}
             </h3>
           </div>
           <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
             <Banknote size={24} />
           </div>
        </div>
        <div className="bg-white dark:bg-enterprise-800 p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800/60 flex justify-between items-start group hover:-translate-y-1 transition-all">
           <div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">İzinli Personel</p>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white">{activeLeaveCount}</h3>
           </div>
           <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
             <CalendarCheck size={24} />
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-enterprise-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700/50 overflow-hidden min-h-[500px] flex flex-col">
        {/* Tabs & Filter Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-800/50">
          <div className="flex bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
            <button 
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'employees' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <Users size={16} className="mr-2" /> Personel
            </button>
            <button 
                onClick={() => setActiveTab('payroll')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'payroll' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <Banknote size={16} className="mr-2" /> Bordro
            </button>
            <button 
                onClick={() => setActiveTab('leaves')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${activeTab === 'leaves' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <CalendarCheck size={16} className="mr-2" /> İzinler
            </button>
          </div>

          {activeTab === 'employees' && (
            <div className="relative w-full sm:w-64">
                <input 
                    type="text" 
                    placeholder="Personel ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white transition-all"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          )}
        </div>

        <div className="p-6 flex-1 overflow-auto">
          
          {/* --- EMPLOYEE LIST TAB --- */}
          {activeTab === 'employees' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-brand-500/30 transition-all group relative">
                  {canEdit && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleDeleteEmployee(emp.id, e)} className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 size={18} />
                        </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={emp.avatar} 
                      alt={emp.name} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{emp.name}</h3>
                      <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">{emp.position}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{emp.department}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Durum</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${emp.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                        {emp.status === 'active' ? 'Aktif' : 'İzinli'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">İletişim</span>
                      <span className="text-slate-900 dark:text-white font-medium truncate max-w-[150px]">{emp.phone || emp.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Giriş Tarihi</span>
                      <span className="text-slate-900 dark:text-white font-medium">{new Date(emp.joinDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- PAYROLL TAB --- */}
          {activeTab === 'payroll' && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Dönem</th>
                    <th className="px-6 py-4">Personel</th>
                    <th className="px-6 py-4 text-right">Brüt / Taban</th>
                    <th className="px-6 py-4 text-right">Prim / Ek</th>
                    <th className="px-6 py-4 text-right">Kesinti</th>
                    <th className="px-6 py-4 text-right font-bold">Net Ödenecek</th>
                    <th className="px-6 py-4 text-center">Durum</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{payroll.period}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{payroll.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-600 dark:text-slate-300">
                        {canViewSalary ? `₺${payroll.baseSalary.toLocaleString('tr-TR')}` : '*****'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {canViewSalary ? `+₺${payroll.bonus.toLocaleString('tr-TR')}` : '*****'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-500 dark:text-red-400 font-medium">
                        {canViewSalary ? `-₺${payroll.deduction.toLocaleString('tr-TR')}` : '*****'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-black text-brand-600 dark:text-brand-400">
                        {canViewSalary ? `₺${payroll.netSalary.toLocaleString('tr-TR')}` : '*****'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          payroll.status === 'paid' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {payroll.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payroll.status === 'pending' && canEdit && (
                          <button 
                            onClick={() => handlePaySalary(payroll.id)}
                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            Öde
                          </button>
                        )}
                        {payroll.status === 'paid' && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {new Date(payroll.paymentDate!).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- LEAVES TAB --- */}
          {activeTab === 'leaves' && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Personel</th>
                    <th className="px-6 py-4">İzin Türü</th>
                    <th className="px-6 py-4">Tarih Aralığı</th>
                    <th className="px-6 py-4">Süre</th>
                    <th className="px-6 py-4">Açıklama</th>
                    <th className="px-6 py-4 text-center">Durum</th>
                    <th className="px-6 py-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{leave.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 capitalize">
                        {leave.type === 'annual' ? 'Yıllık İzin' : leave.type === 'sick' ? 'Raporlu' : leave.type === 'unpaid' ? 'Ücretsiz' : 'Mazeret'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(leave.startDate).toLocaleDateString('tr-TR')} - {new Date(leave.endDate).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{leave.days} Gün</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {leave.status === 'approved' ? 'Onaylandı' : leave.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {leave.status === 'pending' && canEdit && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleLeaveAction(leave.id, 'approved')}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Onayla"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleLeaveAction(leave.id, 'rejected')}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Reddet"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* Employee Modal */}
      <Modal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} title="Yeni Personel Ekle">
        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ad Soyad</label>
            <input 
              type="text" 
              name="name" 
              required
              value={employeeForm.name}
              onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Pozisyon / Unvan</label>
            <input 
              type="text" 
              name="position" 
              required
              value={employeeForm.position}
              onChange={e => setEmployeeForm({...employeeForm, position: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Departman</label>
            <select 
              name="department" 
              required
              value={employeeForm.department}
              onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})}
              className={inputClass}
            >
              <option value="">Seçiniz...</option>
              <option value="Bilgi İşlem">Bilgi İşlem</option>
              <option value="İnsan Kaynakları">İnsan Kaynakları</option>
              <option value="Satış">Satış</option>
              <option value="Finans">Finans</option>
              <option value="Operasyon">Operasyon</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Maaş (Net)</label>
            <input 
              type="number" 
              name="salary" 
              required
              value={employeeForm.salary}
              onChange={e => setEmployeeForm({...employeeForm, salary: e.target.value})}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Telefon</label>
              <input 
                type="tel" 
                name="phone" 
                value={employeeForm.phone}
                onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})}
                className={inputClass}
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-posta</label>
              <input 
                type="email" 
                name="email" 
                value={employeeForm.email}
                onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})}
                className={inputClass}
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
             <button 
              type="button" 
              onClick={() => setIsEmployeeModalOpen(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/30 font-bold transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Yeni İzin Talebi">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Personel</label>
            <select 
              value={leaveForm.employeeId}
              onChange={e => setLeaveForm({...leaveForm, employeeId: e.target.value})}
              className={inputClass}
              required
            >
              <option value="">Seçiniz...</option>
              {employees.filter(e => e.id !== 'EMP-VIRTUAL').map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">İzin Türü</label>
            <select 
              value={leaveForm.type}
              onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}
              className={inputClass}
            >
              <option value="annual">Yıllık İzin</option>
              <option value="sick">Rapor / Hastalık</option>
              <option value="casual">Mazeret İzni</option>
              <option value="unpaid">Ücretsiz İzin</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Başlangıç</label>
              <input 
                type="date" 
                value={leaveForm.startDate}
                onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bitiş</label>
              <input 
                type="date" 
                value={leaveForm.endDate}
                onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})}
                className={inputClass}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sebep / Açıklama</label>
            <textarea 
              rows={3}
              value={leaveForm.reason}
              onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
              className={inputClass}
              placeholder="İzin nedeni..."
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
             <button 
              type="button" 
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/30 font-bold transition-colors"
            >
              Talebi Oluştur
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default HR;
