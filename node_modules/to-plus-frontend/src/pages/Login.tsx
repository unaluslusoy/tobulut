
import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Package, Shield, Wrench, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import BrandLogo from '../components/BrandLogo';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState<'login' | 'forgot'>('login');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLocalLoading(true);
    setError('');
    
    // Client-side validation removed
    /*
    if (!email) {
      setError('Lütfen şifre sıfırlama bağlantısı için e-posta adresinizi giriniz.');
      setIsLocalLoading(false);
      return;
    }
    */

    try {
        await api.auth.forgotPassword(email);
        setResetSuccess(true);
    } catch (err: any) {
        setError(err.message || 'İşlem başarısız.');
    } finally {
        setIsLocalLoading(false);
    }
  };

  // 2FA State
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'forgot') return handleForgotPassword(e);

    // 2FA Submission
    if (showOtp) {
        // Client-side validation removed
        /*
        if (!otp || otp.length !== 6) {
            setError('Lütfen 6 haneli doğrulama kodunu giriniz.');
            return;
        }
        */
        setIsLocalLoading(true);
        setError('');
        try {
            await api.auth.verify2fa(tempUserId, otp);
            // Force reload to ensure App.tsx picks up new auth state
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Doğrulama başarısız.');
        } finally {
            setIsLocalLoading(false);
        }
        return;
    }

    // Normal Login
    setIsLocalLoading(true);
    setError('');

    // Manual Validation
    // Client-side validation removed as per user request to let service handle all warnings
    /*
    if (!email) {
      setError('Lütfen e-posta adresinizi giriniz.');
      setIsLocalLoading(false);
      return;
    }
    if (!password) {
      setError('Lütfen şifrenizi giriniz.');
      setIsLocalLoading(false);
      return;
    }
    */

    try {
      const response = await api.auth.login(email, password) as any;
      
      // Check if 2FA is required
      if (response && response.status === '2fa_required') {
          setTempUserId(response.userId);
          setShowOtp(true);
          setError(''); // Clear any previous errors
          // Optionally show a success info message
          // alert(response.message); 
      } else {
          // Normal success (token already set by api.login)
          // Force reload to ensure App.tsx picks up new auth state
          window.location.href = '/'; 
      }

    } catch (err: any) {
      setError(err.message || 'Giriş işlemi başarısız.');
    } finally {
      setIsLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-enterprise-50 dark:bg-enterprise-900 transition-colors duration-300">
      
      {/* Left Side - Visual & Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-enterprise-900 items-center justify-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 p-12 max-w-2xl text-white">
          <div className="mb-12">
            <BrandLogo size="xl" light />
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            İşletmenizin <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-blue-300">Dijital Beyni.</span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Finans, stok, teknik servis ve insan kaynakları süreçlerinizi tek bir platformdan, yapay zeka destekli araçlarla yönetin.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="font-bold">Tam Entegrasyon</div>
                <div className="text-xs text-slate-400">E-Fatura & Pazaryeri</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="font-bold">Bulut Tabanlı</div>
                <div className="text-xs text-slate-400">Her yerden erişim</div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-xs text-slate-600 font-mono">
            v2.0.1 Enterprise Build • © 2024 ToPlus Bilişim
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto h-screen">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
               <BrandLogo size="lg" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {viewMode === 'login' ? 'Hoş Geldiniz' : 'Şifremi Unuttum'}
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
                {viewMode === 'login' 
                    ? 'Hesabınıza erişmek için kimlik bilgilerinizi girin.' 
                    : 'Hesabınızla ilişkilendirilmiş e-posta adresini girin.'}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start animate-fade-in-down border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {resetSuccess && viewMode === 'forgot' ? (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-6 rounded-xl text-center border border-green-100 dark:border-green-900/50">
                    <div className="flex justify-center mb-3">
                        <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                            <Mail className="w-8 h-8 text-green-600 dark:text-green-300" />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">E-posta Gönderildi!</h3>
                    <p className="text-sm mb-6">
                        Şifre sıfırlama talimatlarını içeren bir e-posta <strong>{email}</strong> adresine gönderildi.
                    </p>
                    <p className="text-xs text-slate-500 mb-6">
                        Giriş ekranına yönlendiriliyorsunuz...
                    </p>
                    <button
                        type="button"
                        onClick={() => { setViewMode('login'); setResetSuccess(false); setError(''); }}
                        className="text-brand-600 font-bold hover:text-brand-700"
                    >
                        Hemen Dön
                    </button>
                    {/* Auto-redirect effect */}
                    {(() => {
                        setTimeout(() => {
                           setViewMode('login'); 
                           setResetSuccess(false); 
                           setError('');
                        }, 3000);
                        return null;
                    })()}
                </div>
            ) : (
                <>
                    <div className="space-y-5">
                    {showOtp ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Doğrulama Kodu (Authenticator)</label>
                            <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500 text-slate-400">
                                <Shield className="h-5 w-5" />
                            </div>
                            <input
                                type="text"
                                value={otp}
                                maxLength={6}
                                onChange={(e) => { setOtp(e.target.value.replace(/\D/g,'')); setError(''); }}
                                className={`block w-full pl-10 pr-3 py-3 bg-white dark:bg-enterprise-800 border ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm text-center tracking-[0.5em] font-mono text-lg`}
                                placeholder="000000"
                                autoFocus
                            />
                            </div>
                            <p className="mt-2 text-xs text-center text-slate-500">
                                Authenticator uygulamanızdaki 6 haneli kodu giriniz.
                            </p>
                        </div>
                    ) : (
                        // Normal Login Fields
                        <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-posta Adresi</label>
                            <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500 text-slate-400">
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                className={`block w-full pl-10 pr-3 py-3 bg-white dark:bg-enterprise-800 border ${error && !email ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm`}
                                placeholder="isim@sirket.com"
                            />
                            </div>
                        </div>

                        {viewMode === 'login' && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Şifre</label>
                                <button 
                                    type="button"
                                    onClick={() => { setViewMode('forgot'); setError(''); }}
                                    className="text-sm font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 transition-colors"
                                >
                                    Unuttum?
                                </button>
                                </div>
                                <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500 text-slate-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    className={`block w-full pl-10 pr-10 py-3 bg-white dark:bg-enterprise-800 border ${error && !password ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm`}
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                                    >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                    </div>

                    {viewMode === 'login' && (
                        <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            Beni hatırla
                        </label>
                        </div>
                    )}

                    <button
                    type="submit"
                    disabled={isLocalLoading}
                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 active:scale-[0.98]"
                    >
                    {isLocalLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                        {viewMode === 'login' 
                            ? (showOtp ? 'Doğrula ve Giriş Yap' : 'Giriş Yap') 
                            : 'Sıfırlama Linki Gönder'}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                    </button>
                    
                     {viewMode === 'forgot' && (
                        <div className="text-center mt-4">
                             <button
                                type="button"
                                onClick={() => { setViewMode('login'); setError(''); }}
                                className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Giriş Ekranına Dön
                            </button>
                        </div>
                    )}
                </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
