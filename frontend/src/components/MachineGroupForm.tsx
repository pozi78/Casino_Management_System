import { useState, useEffect } from 'react';
import type { GrupoMaquina, GrupoMaquinaCreate } from '../api/machines';

interface MachineGroupFormProps {
    initialData?: GrupoMaquina;
    onSubmit: (data: GrupoMaquinaCreate) => Promise<void>;
    onCancel: () => void;
}

export default function MachineGroupForm({ initialData, onSubmit, onCancel }: MachineGroupFormProps) {
    const [formData, setFormData] = useState<GrupoMaquinaCreate>({
        nombre: '',
        cantidad_puestos: 1,
        descripcion: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre,
                cantidad_puestos: initialData.cantidad_puestos,
                descripcion: initialData.descripcion || ''
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
                setError('Error al guardar el grupo.');
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej. Ruleta Central"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Puestos</label>
                    <input
                        type="number"
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.cantidad_puestos}
                        onChange={(e) => setFormData({ ...formData, cantidad_puestos: parseInt(e.target.value) || 1 })}
                    />
                </div>
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
