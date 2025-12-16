
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import HR from './pages/HR';
import DataManagement from './pages/DataManagement';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CurrentAccounts from './pages/CurrentAccounts';
import Invoices from './pages/Invoices';
import InvoiceReturns from './pages/InvoiceReturns';
import Offers from './pages/Offers';
import TaskBoard from './pages/TodoList'; 
import CalendarApp from './pages/CalendarApp';
import POS from './pages/POS';
import CashRegisters from './pages/CashRegisters';
import Notifications from './pages/Notifications';
import Campaigns from './pages/Campaigns';
import UserManagement from './pages/UserManagement';
import CorporateIdentity from './pages/CorporateIdentity';
import StyleGuide from './pages/StyleGuide';
import SuperAdmin from './pages/SuperAdmin'; 
import FileManager from './pages/FileManager'; 
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import TwoFactorSetup from './pages/TwoFactorSetup';
import Register from './pages/Register'; 
import Landing from './pages/Landing'; 
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Legal from './pages/Legal'; // New Legal Page
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout Component for Authenticated Routes
const AuthenticatedLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse
  const location = useLocation();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  // Default user object structure adaptation for Header
  const headerUser = user ? {
    name: user.name,
    title: user.role === 'admin' ? 'Yönetici' : user.role === 'manager' ? 'Müdür' : user.role === 'technician' ? 'Tekniker' : user.role === 'accountant' ? 'Muhasebe' : 'Personel',
    avatar: user.avatar || 'https://picsum.photos/200',
    role: user.role
  } : {
    name: 'Kullanıcı',
    title: 'Misafir',
    avatar: 'https://picsum.photos/200'
  };

  // Special Layout for POS (Full Screen Mode)
  if (location.pathname === '/pos') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Routes>
           <Route path="/pos" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']} requiredModule="sales"><POS /></ProtectedRoute>} />
        </Routes>
      </div>
    );
  }

  // Standard Layout for other pages
  return (
    <div className="flex h-screen bg-enterprise-50 dark:bg-enterprise-900 overflow-hidden transition-colors duration-200">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isCollapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebarCollapse}
        onLogout={logout} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          toggleSidebar={toggleSidebar} 
          user={headerUser} 
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-enterprise-50 dark:bg-enterprise-900 text-gray-900 dark:text-gray-100 transition-colors duration-200 custom-scrollbar">
          <Routes>
            {/* General Routes - Accessible by most */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/:userNo/profile" element={<Profile />} />
            <Route path="/profile" element={<Navigate to={`/${user?.userNo || user?.id}/profile`} replace />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/calendar" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'technician']}><CalendarApp /></ProtectedRoute>} />

            {/* Finance & Sales */}
            <Route path="/accounts" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'cashier']} requiredModule="finance"><CurrentAccounts /></ProtectedRoute>} />
            <Route path="/offers" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']} requiredModule="sales"><Offers /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'cashier']} requiredModule="finance"><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/returns" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'cashier']} requiredModule="finance"><InvoiceReturns /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']} requiredModule="finance"><Finance /></ProtectedRoute>} />
            <Route path="/cash-registers" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']} requiredModule="finance"><CashRegisters /></ProtectedRoute>} />

            {/* Operations */}
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'technician', 'cashier']} requiredModule="inventory"><Inventory /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute allowedRoles={['admin', 'manager']} requiredModule="sales"><Campaigns /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'technician']} requiredModule="service"><Services /></ProtectedRoute>} />

            {/* Management */}
            <Route path="/hr" element={<ProtectedRoute allowedRoles={['admin', 'manager']} requiredModule="hr"><HR /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']} requiredModule="settings"><UserManagement /></ProtectedRoute>} />
            <Route path="/data" element={<ProtectedRoute allowedRoles={['admin']} requiredModule="settings"><DataManagement /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'accountant']} requiredModule="reports"><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'manager']} requiredModule="settings"><Settings /></ProtectedRoute>} />
            
            {/* Super Admin */}
            <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['superuser']}><SuperAdmin /></ProtectedRoute>} />
            <Route path="/file-manager" element={<ProtectedRoute allowedRoles={['admin', 'superuser']}><FileManager /></ProtectedRoute>} />

            {/* Dev Tools */}
            <Route path="/corporate-identity" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'technician', 'accountant', 'cashier']}><CorporateIdentity /></ProtectedRoute>} />
            <Route path="/style-guide" element={<StyleGuide />} />
            
            {/* System */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-enterprise-50 dark:bg-enterprise-900 text-brand-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" replace />} />
      <Route path="/2fa-setup" element={isAuthenticated ? <TwoFactorSetup /> : <Navigate to="/login" replace />} />
      <Route path="/legal/:type" element={<Legal />} /> {/* New Legal Route */}
      
      {/* Root redirects to landing if not auth, else dashboard */}
      <Route path="/" element={!isAuthenticated ? <Navigate to="/landing" replace /> : <AuthenticatedLayout />} />
      <Route 
        path="/*" 
        element={isAuthenticated ? <AuthenticatedLayout /> : <Navigate to="/landing" replace />} 
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
