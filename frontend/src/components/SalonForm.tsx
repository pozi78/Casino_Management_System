import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { SalonCreate, SalonUpdate, Salon } from '../api/salones';

interface SalonFormProps {
    initialData?: Salon;
    onSubmit: (data: SalonCreate | SalonUpdate) => Promise<void>;
    onCancel: () => void;
}

export default function SalonForm({ initialData, onSubmit, onCancel }: SalonFormProps) {
    const [formData, setFormData] = useState<SalonCreate>({
        nombre: '',
        direccion: '',
        activo: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre,
                direccion: initialData.direccion || '',
                activo: initialData.activo
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await onSubmit(formData);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Error al guardar el salón');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm break-words">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                        {JSON.stringify(error, null, 2)}
                    </pre>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Salón</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Ej: Casino Gran Vía"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="flex items-center h-[42px]">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">
                                {formData.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección (Opcional)</label>
                <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Calle Principal, 12, planta baja..."
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={isLoading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-1 flex justify-center items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-70"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : (initialData ? 'Guardar Cambios' : 'Crear Salón')}
                </button>
            </div>
        </form>
    );
}
