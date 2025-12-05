import React, { useState, useEffect } from 'react';
import { Mail, Lock, UserPlus, LogIn, CheckSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';

interface LoginProps {
    onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [step, setStep] = useState<'login' | 'register' | 'forgot_password' | 'reset_password'>('login');

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Registration State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyPassword, setCompanyPassword] = useState('');

    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState('');

    // Reset Password State
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        // Check for saved credentials
        const savedEmail = localStorage.getItem('gtech_remember_email');
        const savedPass = localStorage.getItem('gtech_remember_pass');

        if (savedEmail && savedPass) {
            setEmail(savedEmail);
            setPassword(savedPass);
            setRememberMe(true);
        }
    }, []);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;

            // Store token in session user object for simplicity in this migration
            const userWithToken = { ...user, token };

            if (rememberMe) {
                localStorage.setItem('gtech_remember_email', email);
                localStorage.setItem('gtech_remember_pass', password);
            } else {
                localStorage.removeItem('gtech_remember_email');
                localStorage.removeItem('gtech_remember_pass');
            }
            onLoginSuccess(userWithToken);
        } catch (error: any) {
            console.error('Login Error:', error);
            let msg = "Error desconocido.";
            if (error.response) {
                // Server responded with a status code other than 2xx
                msg = `Error ${error.response.status}: ${error.response.data?.error || error.response.statusText}`;
            } else if (error.request) {
                // Request made but no response
                msg = "No hay respuesta del servidor. Verifica tu conexión.";
            } else {
                msg = error.message;
            }
            alert(msg);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/register', {
                email: regEmail,
                password: regPassword,
                name: regName,
                role: 'VIEWER', // Default to VIEWER
                companyName,
                companyPassword
            });

            const { user, token } = response.data;
            const userWithToken = { ...user, token };

            alert("Usuario creado exitosamente.");
            onLoginSuccess(userWithToken);
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error al registrar usuario.";
            alert(msg);
            console.error(error);
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/forgot-password', { email: forgotEmail });
            alert(response.data.message);
            setStep('reset_password');
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error al solicitar recuperación.";
            alert(msg);
            console.error(error);
        }
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }
        if (newPassword.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        try {
            const response = await api.post('/auth/reset-password', {
                email: forgotEmail, // We use the email from the previous step
                code: resetCode,
                newPassword
            });
            alert(response.data.message);
            setStep('login');
            setEmail(forgotEmail); // Pre-fill login email
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error al restablecer contraseña.";
            alert(msg);
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500 rounded-full mix-blend-screen filter blur-[128px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[128px]"></div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/10 relative z-10 transition-all duration-500">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-brand-500/50 mb-4">
                        <span className="text-white text-3xl font-bold">g</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">gtech ERP</h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium">
                        {step === 'login' && 'Enterprise Resource Planning'}
                        {step === 'register' && 'Crear Nueva Cuenta'}
                        {step === 'forgot_password' && 'Recuperar Contraseña'}
                        {step === 'reset_password' && 'Establecer Nueva Contraseña'}
                    </p>
                </div>

                {/* STEP 1: LOGIN */}
                {step === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 outline-none transition-all"
                                    placeholder="usuario@gtech.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <div className="w-5 h-5 border-2 border-slate-500 rounded bg-slate-800 peer-checked:bg-brand-600 peer-checked:border-brand-600 transition-all"></div>
                                    <CheckSquare size={14} className="absolute top-0.5 left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <span className="ml-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Recordar</span>
                            </label>
                            <button type="button" onClick={() => setStep('forgot_password')} className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button type="submit" className="w-full bg-brand-600 text-white py-3.5 rounded-xl hover:bg-brand-500 transition-all font-bold shadow-lg shadow-brand-600/30 transform hover:scale-[1.02] flex items-center justify-center gap-2">
                            <LogIn size={20} /> Iniciar Sesión
                        </button>

                        <div className="text-center pt-4 border-t border-white/10">
                            <button type="button" onClick={() => setStep('register')} className="text-sm text-slate-400 hover:text-white transition-colors">
                                ¿No tienes cuenta? <span className="text-brand-400 font-bold">Regístrate</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: REGISTER */}
                {step === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Nombre de la Empresa</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="gtech"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña de la Empresa</label>
                            <input
                                type="password"
                                value={companyPassword}
                                onChange={(e) => setCompanyPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Nombre Completo</label>
                            <input
                                type="text"
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="Juan Pérez"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Electrónico</label>
                            <input
                                type="email"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="usuario@empresa.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña</label>
                            <input
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="w-full bg-green-600 text-white py-3.5 rounded-xl hover:bg-green-500 transition-all font-bold shadow-lg shadow-green-600/30 transform hover:scale-[1.02] flex items-center justify-center gap-2">
                            <UserPlus size={20} /> Registrarse
                        </button>

                        <div className="text-center pt-4 border-t border-white/10">
                            <button type="button" onClick={() => setStep('login')} className="text-sm text-slate-400 hover:text-white transition-colors">
                                ¿Ya tienes cuenta? <span className="text-brand-400 font-bold">Iniciar Sesión</span>
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: FORGOT PASSWORD */}
                {step === 'forgot_password' && (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-5 animate-fade-in">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                            <ShieldCheck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-sm text-blue-100">Ingrese su correo electrónico para recibir un código de recuperación.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Electrónico</label>
                            <input
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="usuario@gtech.com"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-500 transition-all font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
                            Enviar Código <ArrowRight size={18} />
                        </button>
                        <div className="text-center">
                            <button type="button" onClick={() => setStep('login')} className="text-sm text-slate-400 hover:text-white transition-colors">
                                Volver al inicio
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 4: RESET PASSWORD */}
                {step === 'reset_password' && (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-5 animate-fade-in">
                        <div className="text-center text-slate-300 text-sm mb-4">
                            Se ha enviado un código a <strong>{forgotEmail}</strong>.
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Código de Verificación</label>
                            <input
                                type="text"
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-white placeholder-slate-500 outline-none text-center text-xl font-mono tracking-widest"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Nueva Contraseña</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-slate-500 outline-none transition-all"
                                placeholder="Repetir contraseña"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-3.5 rounded-xl hover:bg-green-500 transition-all font-bold shadow-lg shadow-green-600/30 flex items-center justify-center gap-2">
                            <Lock size={18} /> Restablecer Contraseña
                        </button>
                        <div className="text-center">
                            <button type="button" onClick={() => setStep('login')} className="text-sm text-slate-400 hover:text-white transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
                    <p>Sistema Seguro v1.1.0 (PROD)</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
