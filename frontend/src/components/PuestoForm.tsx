import { useState, useEffect } from 'react';
import type { Puesto, PuestoCreate, PuestoUpdate } from '../api/machines';

interface PuestoFormProps {
    initialData?: Puesto;
    maquinaId: number;
    defaultRate?: number;
    nextPuestoNumber?: number;
    onSubmit: (data: PuestoCreate | PuestoUpdate) => Promise<void>;
    onCancel: () => void;
}

export default function PuestoForm({ initialData, maquinaId, defaultRate, nextPuestoNumber, onSubmit, onCancel }: PuestoFormProps) {
    const [formData, setFormData] = useState<PuestoCreate>({
        maquina_id: maquinaId,
        numero_puesto: 0,
        descripcion: '',
        tasa_semanal: 0,
        activo: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                maquina_id: initialData.maquina_id,
                numero_puesto: initialData.numero_puesto,
                descripcion: initialData.descripcion || '',
                tasa_semanal: initialData.tasa_semanal || 0,
                activo: initialData.activo
            });
        } else {
            setFormData(prev => ({
                ...prev,
                tasa_semanal: defaultRate || 0,
                numero_puesto: nextPuestoNumber || 0
            }));
        }
    }, [initialData, defaultRate, nextPuestoNumber]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit(formData);
        } catch (err: any) {
            console.error(err);
            setError('Error al guardar el puesto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número Puesto</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.numero_puesto}
                        onChange={(e) => setFormData({ ...formData, numero_puesto: parseInt(e.target.value) || 0 })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Semanal</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.tasa_semanal ?? ''}
                        onChange={(e) => setFormData({ ...formData, tasa_semanal: parseFloat(e.target.value) || 0 })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    value={formData.descripcion || ''}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
            </div>

            <div className="flex items-center pt-2">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Activo</span>
                </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    )
}
