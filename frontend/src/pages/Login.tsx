import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setDebugInfo('');
        setIsLoading(true);

        try {
            console.log("Attempting login for:", username);
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/login/access-token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            console.log("Login success:", response.data);
            login(response.data.access_token);
            login(response.data.access_token);
            navigate('/');
        } catch (err) {
            console.error("Login Error:", err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorObj = err as any;
            if (errorObj.response) {
                setError(errorObj.response.data.detail || 'Credenciales incorrectas');
                setDebugInfo(`Status: ${errorObj.response.status}`);
            } else if (errorObj.request) {
                setError('No se pudo conectar con el servidor.');
                setDebugInfo(`Network Error - Unreachable at ${api.defaults.baseURL}`);
            } else {
                setError('Error desconocido');
                setDebugInfo(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const [bgImage, setBgImage] = useState('/assets/images/bg_roulette_1.png');

    useEffect(() => {
        const images = [
            '/assets/images/bg_roulette_1.png',
            '/assets/images/bg_roulette_2.png'
        ];
        const randomImage = images[Math.floor(Math.random() * images.length)];
        setBgImage(randomImage);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#064E3B] relative overflow-hidden">
            {/* Roulette Layout Motif (Angled Perspective) - Random Selection */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-overlay transition-opacity duration-1000"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />

            {/* Felt Texture Overlay (Local Asset) */}
            <div className="absolute inset-0 bg-[url('/assets/images/felt.png')] opacity-40 mix-blend-multiply" />

            {/* Gradient Overlay for Tone */}
            <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 0%, rgba(6, 78, 59, 0.5) 100%) pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#064E3B]/40 via-transparent to-[#064E3B]/60 pointer-events-none" />

            <div className="relative z-10 w-full max-w-md p-8 mx-4">
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#B45309] mb-4 shadow-lg shadow-orange-500/20">
                        <span className="text-2xl text-white font-bold">CMS</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 tracking-tight leading-tight flex flex-col gap-1">
                        <span>Casino</span>
                        <span>Management System</span>
                    </h1>
                    <p className="text-emerald-200/80 font-medium uppercase tracking-[0.2em] text-xs mt-2">
                        Premium Casino Management
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-lg text-sm flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-medium">{error}</p>
                                    {debugInfo && <p className="text-xs opacity-75 mt-1 font-mono">{debugInfo}</p>}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-1.5 ml-1">Usuario</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-emerald-400 group-focus-within:text-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all font-medium"
                                        placeholder="Ingrese su usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-emerald-100 mb-1.5 ml-1">Contraseña</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-emerald-400 group-focus-within:text-amber-400 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-200/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-emerald-950 bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-emerald-900 focus:ring-amber-400 transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Accediendo...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-emerald-200/40 text-xs mt-8">
                    &copy; 2025 MASHOLDINGS. All rights reserved.
                </p>
            </div>
        </div>
    );
}
