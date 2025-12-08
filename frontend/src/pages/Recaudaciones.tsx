import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, X, AlertTriangle } from 'lucide-react';
import { recaudacionApi, type Recaudacion, type RecaudacionCreate } from '../api/recaudaciones';
import { salonesApi, type Salon } from '../api/salones';
import { formatCurrency, getCurrencyClasses } from '../utils/currency';

export default function Recaudaciones() {
    const navigate = useNavigate();
    const [recaudaciones, setRecaudaciones] = useState<Recaudacion[]>([]);
    const [salones, setSalons] = useState<Salon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Delete Modal State
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const [formData, setFormData] = useState<RecaudacionCreate>({
        salon_id: 0,
        fecha_inicio: '',
        fecha_fin: '',
        fecha_cierre: '',
        etiqueta: '',
        notas: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [r, s] = await Promise.all([
                recaudacionApi.getAll(),
                salonesApi.getAll()
            ]);
            setRecaudaciones(r);
            setSalons(s);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newRec = await recaudacionApi.create(formData);
            setRecaudaciones([newRec, ...recaudaciones]);
            setShowModal(false);
            // Optional: Navigate immediately to detail
            navigate(`/recaudaciones/${newRec.id}`);
        } catch (error) {
            console.error("Error creating recaudacion:", error);
        }
    };

    const handleDelete = async () => {
        if (!deleteId || deleteConfirmation !== 'BORRAR') return;

        try {
            await recaudacionApi.delete(deleteId);
            setRecaudaciones(recaudaciones.filter(r => r.id !== deleteId));
            setDeleteId(null);
            setDeleteConfirmation('');
        } catch (error) {
            console.error("Error deleting recaudacion:", error);
            alert("Error al borrar la recaudación");
        }
    };

    const getSalonName = (id: number) => salones.find(s => s.id === id)?.nombre || 'Unknown';

    // Helper to format date like "Lun 20/03/2024"
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // capitalize first letter of day
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
        const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        const datePart = date.toLocaleDateString('es-ES');
        return `${dayNameCap} ${datePart}`;
    };

    const getDaysDiff = (start: string, end: string) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Recaudaciones</h1>
                    <p className="text-gray-500">Gestión de recaudaciones y lecturas</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nueva Recaudación
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando recaudaciones...</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salón</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas (Días)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neto Salón</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiqueta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recaudaciones.map((rec) => (
                                <tr key={rec.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/recaudaciones/${rec.id}`)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{rec.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {getSalonName(rec.salon_id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">
                                                {formatDate(rec.fecha_inicio)} - {formatDate(rec.fecha_fin)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                ({getDaysDiff(rec.fecha_inicio, rec.fecha_fin)} días)
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getCurrencyClasses((Number(rec.total_global) || 0) / 2)}`}>
                                        {formatCurrency((Number(rec.total_global) || 0) / 2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rec.etiqueta || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/recaudaciones/${rec.id}`);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                                                title="Ver Detalles"
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteId(rec.id);
                                                    setDeleteConfirmation('');
                                                }}
                                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                                title="Borrar Recaudación"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recaudaciones.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No hay recaudaciones registradas.
                        </div>
                    )}
                </div>
            )}

            {/* Modal Nueva Recaudacion */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Nueva Recaudación</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Salón</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={formData.salon_id}
                                    onChange={(e) => setFormData({ ...formData, salon_id: Number(e.target.value) })}
                                >
                                    <option value={0}>Seleccione un salón</option>
                                    {salones.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={formData.fecha_inicio}
                                        onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border rounded-lg p-2"
                                        value={formData.fecha_fin}
                                        onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Cierre (Contable)</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={formData.fecha_cierre}
                                    onChange={(e) => setFormData({ ...formData, fecha_cierre: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Semana 42"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.etiqueta || ''}
                                    onChange={(e) => setFormData({ ...formData, etiqueta: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Crear Recaudación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Borrar Recaudacion */}
            {deleteId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">¿Borrar Recaudación?</h2>
                            <p className="text-sm text-gray-500 mt-2">
                                Esta acción no se puede deshacer. Para confirmar, escribe <strong>BORRAR</strong> abajo.
                            </p>
                        </div>

                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2 text-center uppercase mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Escribe BORRAR"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteId(null); setDeleteConfirmation(''); }}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteConfirmation !== 'BORRAR'}
                                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${deleteConfirmation === 'BORRAR'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-red-300 cursor-not-allowed'
                                    }`}
                            >
                                Borrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
