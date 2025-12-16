
import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import BrandLogo from '../components/BrandLogo';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Geçersiz veya eksik şifre sıfırlama bağlantısı.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
        setError('Şifre en az 8 karakter olmalıdır.');
        setLoading(false);
        return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError('Şifre en az bir büyük harf ve bir rakam içermelidir.');
        setLoading(false);
        return;
    }

    try {
      await api.auth.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Şifre sıfırlama işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-enterprise-50 dark:bg-enterprise-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-enterprise-800 rounded-2xl shadow-xl p-8 text-center animate-fade-in-up border border-slate-100 dark:border-slate-700">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Şifreniz Güncellendi!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Yeni şifrenizle başarıyla giriş yapabilirsiniz. Giriş sayfasına yönlendiriliyorsunuz...
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="text-brand-600 font-bold hover:text-brand-700"
                >
                    Hemen Giriş Yap
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex w-full bg-enterprise-50 dark:bg-enterprise-900 transition-colors duration-300">
      
      {/* Left Side - Visual & Brand (Same as Login for consistency) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-enterprise-900 items-center justify-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 p-12 max-w-2xl text-white text-center">
          <div className="mb-8 flex justify-center">
            <BrandLogo size="xl" light />
          </div>
          <h1 className="text-4xl font-bold mb-4">Hesabınızı Kurtarın</h1>
          <p className="text-lg text-slate-400">
            Güvenliğiniz bizim önceliğimizdir. Lütfen yeni şifrenizi dikkatlice seçin.
          </p>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto h-screen">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-6 flex justify-center">
               <BrandLogo size="lg" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Yeni Şifre Belirle
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
                Hesabınız için yeni ve güvenli bir şifre oluşturun.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start animate-fade-in-down border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Yeni Şifre</label>
                    <div className="relative group mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500 text-slate-400">
                        <Lock className="h-5 w-5" />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm"
                        placeholder="Yeni şifreniz"
                        disabled={!token || loading}
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
                    
                    {/* Password Strength Indicator */}
                    {password && (
                        <div className="space-y-1.5">
                            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div 
                                    className={`h-full transition-all duration-300 ${
                                        password.length < 6 ? 'w-1/4 bg-red-500' :
                                        password.length < 8 ? 'w-2/4 bg-orange-500' :
                                        !/[A-Z]/.test(password) || !/[0-9]/.test(password) ? 'w-3/4 bg-yellow-500' :
                                        'w-full bg-green-500'
                                    }`} 
                                />
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className={`font-medium ${
                                    password.length < 6 ? 'text-red-500' :
                                    password.length < 8 ? 'text-orange-500' :
                                    !/[A-Z]/.test(password) || !/[0-9]/.test(password) ? 'text-yellow-500' :
                                    'text-green-500'
                                }`}>
                                    {password.length < 6 ? 'Çok Zayıf' :
                                     password.length < 8 ? 'Zayıf' :
                                     !/[A-Z]/.test(password) || !/[0-9]/.test(password) ? 'Orta' :
                                     'Güçlü'}
                                </span>
                                <span className="text-slate-400">
                                    En az 8 karakter, 1 büyük harf ve 1 rakam önerilir.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Şifreyi Onayla</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500 text-slate-400">
                        <Lock className="h-5 w-5" />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 bg-white dark:bg-enterprise-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all shadow-sm"
                        placeholder="Şifreyi tekrar girin"
                        disabled={!token || loading}
                    />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !token}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 active:scale-[0.98]"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                    Şifreyi Güncelle
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
            
            <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    İptal ve Giriş Ekranına Dön
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
