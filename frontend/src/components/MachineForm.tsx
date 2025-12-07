import { useState, useEffect } from 'react';
import type { Maquina, MaquinaCreate, TipoMaquina } from '../api/machines';
import type { Salon } from '../api/salones';
import { machinesApi } from '../api/machines';
import { salonesApi } from '../api/salones';

interface MachineFormProps {
    initialData?: Maquina;
    onSubmit: (data: MaquinaCreate) => Promise<void>;
    onCancel: () => void;
}

export default function MachineForm({ initialData, onSubmit, onCancel }: MachineFormProps) {
    const [salones, setSalones] = useState<Salon[]>([]);
    const [types, setTypes] = useState<TipoMaquina[]>([]);
    const [isLoadingDeps, setIsLoadingDeps] = useState(true);

    const [formData, setFormData] = useState<MaquinaCreate>({
        salon_id: 0,
        tipo_maquina_id: 0,
        numero_serie: '',
        numero_puesto: 0,
        tasa_semanal_override: 0,
        activo: true
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [salonesData, typesData] = await Promise.all([
                    salonesApi.getAll(),
                    machinesApi.getTypes()
                ]);
                setSalones(salonesData);
                setTypes(typesData);

                // Set default first options if creating new
                if (!initialData && salonesData.length > 0) {
                    setFormData(prev => ({ ...prev, salon_id: salonesData[0].id }));
                }
                if (!initialData && typesData.length > 0) {
                    setFormData(prev => ({ ...prev, tipo_maquina_id: typesData[0].id }));
                }

            } catch (err) {
                console.error("Error fetching dependencies:", err);
                setError("No se pudieron cargar los salones o tipos de máquina.");
            } finally {
                setIsLoadingDeps(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                salon_id: initialData.salon_id,
                tipo_maquina_id: initialData.tipo_maquina_id,
                numero_serie: initialData.numero_serie || '',
                numero_puesto: initialData.numero_puesto || 0,
                tasa_semanal_override: initialData.tasa_semanal_override || 0,
                activo: initialData.activo
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!formData.salon_id || !formData.tipo_maquina_id) {
            setError('Debe seleccionar un salón y un tipo de máquina.');
            setIsSubmitting(false);
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: any) {
            console.error('Error submitting form:', err);
            const apiError = err.response?.data?.detail;
            if (apiError) {
                setError(typeof apiError === 'string' ? apiError : JSON.stringify(apiError, null, 2));
            } else {
                setError('Error al guardar la máquina.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingDeps) {
        return <div className="text-center py-8">Cargando datos...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salón</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                        value={formData.salon_id}
                        onChange={(e) => setFormData({ ...formData, salon_id: Number(e.target.value) })}
                    >
                        <option value={0}>Seleccione un salón...</option>
                        {salones.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Máquina</label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                        value={formData.tipo_maquina_id}
                        onChange={(e) => setFormData({ ...formData, tipo_maquina_id: Number(e.target.value) })}
                    >
                        <option value={0}>Seleccione un tipo...</option>
                        {types.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.numero_serie}
                        onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                        placeholder="Opcional"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número Puesto</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.numero_puesto || ''}
                        onChange={(e) => setFormData({ ...formData, numero_puesto: parseInt(e.target.value) || 0 })}
                        placeholder="Para multipuesto"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Override (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        value={formData.tasa_semanal_override || ''}
                        onChange={(e) => setFormData({ ...formData, tasa_semanal_override: parseFloat(e.target.value) || 0 })}
                        placeholder="Dejar 0 para usar la del tipo"
                    />
                </div>
                <div>
                    {/* Spacer or extra field */}
                </div>
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
    );
}
