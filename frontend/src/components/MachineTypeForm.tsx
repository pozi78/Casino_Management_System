import { useState, useEffect } from 'react';
import type { TipoMaquina, TipoMaquinaCreate } from '../api/machines';

interface MachineTypeFormProps {
    initialData?: TipoMaquina;
    onSubmit: (data: TipoMaquinaCreate) => Promise<void>;
    onCancel: () => void;
}

export default function MachineTypeForm({ initialData, onSubmit, onCancel }: MachineTypeFormProps) {
    const [formData, setFormData] = useState<TipoMaquinaCreate>({
        nombre: '',
        tasa_semanal_orientativa: 0,
        tasa_por_puesto: false,
        es_multipuesto: false,
        descripcion: '',
        activo: true
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre,
                tasa_semanal_orientativa: initialData.tasa_semanal_orientativa,
                tasa_por_puesto: initialData.tasa_por_puesto,
                es_multipuesto: initialData.es_multipuesto,
                descripcion: initialData.descripcion || '',
                activo: initialData.activo
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit(formData);
        } catch (err: any) {
            console.error('Error submitting form:', err);
            const apiError = err.response?.data?.detail;
            if (apiError) {
                setError(typeof apiError === 'string' ? apiError : JSON.stringify(apiError));
            } else {
                setError('Error al guardar el tipo de máquina.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej. Tragaperras Modelo X"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Semanal Orientativa (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.tasa_semanal_orientativa}
                        onChange={(e) => setFormData({ ...formData, tasa_semanal_orientativa: parseFloat(e.target.value) || 0 })}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.tasa_por_puesto}
                        onChange={(e) => setFormData({ ...formData, tasa_por_puesto: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Tasa por Puesto</span>
                </label>

                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.es_multipuesto || false}
                        onChange={(e) => setFormData({ ...formData, es_multipuesto: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Multipuesto</span>
                </label>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
            </div>

            <div className="flex items-center pt-2 border-t">
                <label className="flex items-center cursor-pointer mt-2">
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
    );
}
