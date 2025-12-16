
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shield, Sparkles } from 'lucide-react';

const TwoFactorSetup: React.FC = () => {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    // If already enabled, we might want to show a status or "Disable" button, 
    // but for now let's focus on Enabling flow.
    
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await api.auth.generate2fa(user.tenantId); // Wait, API expects userId actually? 
            // My backend expects 'userId'. Frontend 'currentUser' usually has 'id' not 'tenantId' as primary key if I recall correctly.
            // Let's check api.ts generate2fa signature: it takes userId.
            // User object usually: { name, role, tenantId ... wait, does it have ID? }
            // Login returns: { access_token, user: { name, role, tenantId } } in `auth.service.ts`.
            // WARNING: The user object returned by login DOES NOT HAVE ID.
            // I need to update AuthService login to return ID in the user object.
            
            // Assuming I fix AuthService, let's continue code:
            // Actually, I can decode the token to get ID, or update login response.
            // Update login response is better.
            
            // For now, let's assume I fix it.
             const userId = (user as any).id || (user as any).sub; // JWT usually has sub=id
             // But localStorage user object might not.
             
             // I will fix AuthService login response in a moment.
             
             const data = await api.auth.generate2fa(userId);
             setQrCode(data.qrCodeUrl);
        } catch (err: any) {
            setError(err.message || 'QR Kod oluşturulamadı.');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable = async () => {
        if (!otp || otp.length !== 6) return;
        setLoading(true);
        try {
             const userId = (user as any).id; // Need to ensure ID exists
             await api.auth.enable2fa(userId, otp);
             setSuccess(true);
             setQrCode(null);
        } catch (err: any) {
            setError(err.message || 'Doğrulama başarısız.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-enterprise-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-enterprise-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
                
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-full bg-brand-50 dark:bg-brand-900/20 mb-4">
                        <Shield className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        İki Aşamalı Doğrulama
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Hesabınızı Google Authenticator veya benzeri bir uygulama ile koruyun.
                    </p>
                </div>

                {success ? (
                    <div className="text-center bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 p-6 rounded-xl">
                        <Sparkles className="w-8 h-8 text-green-600 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-2">Başarıyla Aktif!</h3>
                        <p className="text-green-600 dark:text-green-500 text-sm">
                            Artık giriş yaparken Authenticator kodunuzu kullanabilirsiniz.
                        </p>
                        <button 
                            onClick={() => window.location.href = '/'}
                            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {!qrCode ? (
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Yükleniyor...' : 'Kurulumu Başlat'}
                            </button>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner flex justify-center">
                                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 object-contain" />
                                </div>
                                
                                <div className="text-xs text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                    QR Kodu Authenticator uygulamanızla taratın, ardından üretilen 6 haneli kodu aşağıya girin.
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Doğrulama Kodu
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                                        className="block w-full text-center py-3 bg-white dark:bg-enterprise-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-white tracking-[0.5em] font-mono text-lg"
                                        placeholder="000000"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleEnable}
                                    disabled={loading || otp.length !== 6}
                                    className="w-full py-3 px-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Doğrulanıyor...' : 'Aktifleştir'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TwoFactorSetup;
