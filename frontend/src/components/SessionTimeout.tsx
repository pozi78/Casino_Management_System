import { Clock } from 'lucide-react';

interface SessionTimeoutProps {
    isOpen: boolean;
    timeLeft: number; // in seconds
    onExtend: () => void;
    onLogout: () => void;
}

export default function SessionTimeout({ isOpen, timeLeft, onExtend, onLogout }: SessionTimeoutProps) {
    if (!isOpen) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <div className="p-2 bg-amber-100 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tu sesión está a punto de expirar</h3>
                </div>

                <p className="text-gray-600 mb-6 text-center">
                    Por seguridad, tu sesión se cerrará automáticamente en:
                    <span className="block text-4xl font-bold text-gray-900 mt-3 font-mono tracking-wider">
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </span>
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onLogout}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                    <button
                        onClick={onExtend}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
                    >
                        Mantener Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
