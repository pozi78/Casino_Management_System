import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Trash2, X, AlertTriangle, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import { recaudacionApi, type Recaudacion, type RecaudacionCreate } from '../api/recaudaciones';
import { salonesApi, type Salon } from '../api/salones';
import { formatCurrency, getCurrencyClasses } from '../utils/currency';
import { useSalonFilter } from '../context/SalonFilterContext';

// TYPES
type GroupingKey = 'salon' | 'year' | 'month';

// HELPERS
const getSalonInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
};

const getSalonColor = (name: string) => {
    const colors = [
        'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
        'bg-indigo-500', 'bg-green-600', 'bg-blue-600',
        'bg-teal-600', 'bg-cyan-600', 'bg-indigo-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const datePart = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timePart = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `${dayNameCap} ${datePart} ${timePart}`;
};

const getDaysDiff = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// COMPONENTS
// HELPERS
const getNetoSalon = (rec: Recaudacion) => {
    const total = Number(rec.total_global) || 0;
    const percent = rec.porcentaje_salon ?? 50;
    return total * (percent / 100);
};

const calculateTotal = (groupData: any): number => {
    if (Array.isArray(groupData)) {
        return groupData.reduce((sum: any, rec: any) => sum + getNetoSalon(rec), 0);
    }
    return Object.values(groupData).reduce((sum: number, val: any) => sum + calculateTotal(val), 0);
};


const GroupItem = ({ groupKey, value, depthKeys, type, navigate, salones, activeGroupingKeys }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const groupTotal = calculateTotal(value);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800 flex items-center gap-4 cursor-pointer hover:bg-gray-100 transition-colors"
            >
                <div className="text-gray-400">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-sm font-bold ${type === 'salon' ? getSalonColor(groupKey) :
                        type === 'year' ? 'bg-purple-600' :
                            'bg-amber-500'
                        }`}>
                        {type === 'salon' ? getSalonInitials(groupKey) : type === 'year' ? 'Año' : 'Mes'}
                    </span>
                    {groupKey}
                </div>
                <span className={`text-sm ${getCurrencyClasses(groupTotal)}`}>
                    ({formatCurrency(groupTotal)})
                </span>
            </div>
            {isExpanded && (
                <div className="p-2 border-l-4 border-gray-100">
                    <GroupedRenderer
                        data={value}
                        depthKeys={depthKeys}
                        navigate={navigate}
                        salones={salones}
                        activeGroupingKeys={activeGroupingKeys}
                    />
                </div>
            )}
        </div>
    );
};

const GroupedRenderer = ({ data, depthKeys, navigate, salones, activeGroupingKeys }: any) => {
    // Base case: leaf node is Array of Recaudacion
    if (Array.isArray(data)) {
        const getSalonName = (id: number) => salones.find((s: any) => s.id === id)?.nombre || 'Unknown';

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                {data.map((rec: Recaudacion) => (
                    <div
                        key={rec.id}
                        onClick={() => navigate(`/recaudaciones/${rec.id}`)}
                        className="bg-white p-3 rounded border border-gray-200 hover:shadow-md cursor-pointer transition-shadow flex justify-between items-center group"
                    >
                        <div>
                            {!activeGroupingKeys.includes('salon') && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm font-bold ${getSalonColor(getSalonName(rec.salon_id))}`}>
                                        {getSalonInitials(getSalonName(rec.salon_id))}
                                    </span>
                                    <span className="text-xs font-bold text-gray-700">{getSalonName(rec.salon_id)}</span>
                                </div>
                            )}
                            <div className="font-bold text-gray-900">{formatDate(rec.fecha_fin)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {rec.etiqueta && <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded mr-2">{rec.etiqueta}</span>}
                                <span className="text-gray-400">{getDaysDiff(rec.fecha_inicio, rec.fecha_fin)} días</span>
                            </div>
                        </div>
                        <div className={`font-bold text-sm ${getCurrencyClasses(getNetoSalon(rec))}`}>
                            {formatCurrency(getNetoSalon(rec))} <span className="text-gray-400 font-normal text-xs ml-1">({rec.porcentaje_salon ?? 50}%)</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Recursive case: render sections
    const currentKeyType = depthKeys[0];
    let entries = Object.entries(data);

    // Sort entries
    if (currentKeyType === 'year') {
        entries.sort((a, b) => Number(b[0]) - Number(a[0]));
    } else if (currentKeyType === 'month') {
        const monthsOrder = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        entries.sort((a, b) => monthsOrder.indexOf(b[0]) - monthsOrder.indexOf(a[0]));
    } else {
        entries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    return (
        <div className="space-y-4 ml-2">
            {entries.map(([key, value]) => (
                <GroupItem
                    key={key}
                    groupKey={key}
                    value={value}
                    depthKeys={depthKeys.slice(1)}
                    type={currentKeyType}
                    navigate={navigate}
                    salones={salones}
                    activeGroupingKeys={activeGroupingKeys}
                />
            ))}
        </div>
    );
};

import { usePermission } from '../hooks/usePermission';

// ... (in Recaudaciones component)

const navigate = useNavigate();
const { selectedSalonIds } = useSalonFilter();
const { canViewRecaudaciones, canEditRecaudaciones } = usePermission(); // usePermission hook
const [recaudaciones, setRecaudaciones] = useState<Recaudacion[]>([]);
// ...

// Filter recaudaciones: Must be in selected IDs AND have view_recaudaciones permission
const filteredRecaudaciones = recaudaciones.filter(rec =>
    selectedSalonIds.includes(rec.salon_id) && canViewRecaudaciones(rec.salon_id)
);

// Filter salons for "New Recaudación" dropdown: Must have edit_recaudaciones permission
const editableSalons = salones.filter(s => canEditRecaudaciones(s.id));
const canCreateAny = editableSalons.length > 0;

// ...

return (
    <div className="space-y-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            {/* ... Header ... */}

            {/* Create Button - Only show if user can edit at least one salon */}
            {canCreateAny && (
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 transition-all font-medium"
                >
                    <Plus size={20} className="mr-2" />
                    Nueva Recaudación
                </button>
            )}
        </div>

        {/* ... List ... */}
        <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
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
                {canEditRecaudaciones(rec.salon_id) && (
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
                )}
            </div>
        </td>
    </tr>
))}
                        </tbody >
                    </table >
    {/* ... */ }
                </div >
            )}

{/* Modal Nueva Recaudacion */ }
{
    showModal && (
                // ...
                                <label className="block text-sm font-medium text-gray-700 mb-1">Salón</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={formData.salon_id}
                                    onChange={(e) => handleSalonChange(Number(e.target.value))}
                                >
                                    <option value={0}>Seleccione un salón</option>
                                    {editableSalons.map(s => ( // Use filtered list
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div >
        {/* ... */ }
        < div className = "grid grid-cols-1 gap-4" >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            required
                                            className="w-full border rounded-lg p-2"
                                            value={formData.fecha_inicio}
                                            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            required
                                            className="w-24 border rounded-lg p-2"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            required
                                            className="w-full border rounded-lg p-2"
                                            value={formData.fecha_fin}
                                            onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            required
                                            className="w-24 border rounded-lg p-2"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div >
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Importar Excel (Opcional)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                        onChange={handleFileSelect}
                                    />
                                    {importFile && (
                                        <button
                                            type="button"
                                            onClick={() => setImportFile(null)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Quitar archivo"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Detecta automáticamente si es plantilla normalizada (v1.0).
                                </p>
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
                        </form >
                    </div >
                </div >
            )
}

{/* Modal Borrar Recaudacion */ }
{
    deleteId && (
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
    )
}
        </div >
    );
}
