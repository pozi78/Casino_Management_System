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

export default function Recaudaciones() {
    const navigate = useNavigate();
    const { selectedSalonIds } = useSalonFilter();
    const [recaudaciones, setRecaudaciones] = useState<Recaudacion[]>([]);
    const [salones, setSalons] = useState<Salon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Dynamic Grouping State
    const [activeGroupingKeys, setActiveGroupingKeys] = useState<GroupingKey[]>(() => {
        const saved = localStorage.getItem('recaudaciones_grouping_keys');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('recaudaciones_grouping_keys', JSON.stringify(activeGroupingKeys));
    }, [activeGroupingKeys]);

    const toggleGroupingKey = (key: GroupingKey) => {
        setActiveGroupingKeys(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    // Recursive Grouping Helper
    const recursiveGroup = (data: Recaudacion[], keys: GroupingKey[]): any => {
        if (keys.length === 0) return data;

        const currentKey = keys[0];
        const grouped: Record<string, Recaudacion[]> = {};

        // Helper inside to get name
        const getSalonName = (id: number) => salones.find(s => s.id === id)?.nombre || 'Unknown';

        data.forEach(rec => {
            let groupValue = 'Unknown';
            const date = new Date(rec.fecha_fin || rec.fecha_cierre);

            if (currentKey === 'salon') {
                groupValue = getSalonName(rec.salon_id);
            } else if (currentKey === 'year') {
                groupValue = date.getFullYear().toString();
            } else if (currentKey === 'month') {
                const m = date.toLocaleString('es-ES', { month: 'long' });
                groupValue = m.charAt(0).toUpperCase() + m.slice(1);
            }

            if (!grouped[groupValue]) grouped[groupValue] = [];
            grouped[groupValue].push(rec);
        });

        // Recursively group children
        const result: Record<string, any> = {};
        Object.keys(grouped).forEach(key => {
            result[key] = recursiveGroup(grouped[key], keys.slice(1));
        });

        return result;
    };

    // Filter recaudaciones
    const filteredRecaudaciones = recaudaciones.filter(rec => selectedSalonIds.includes(rec.salon_id));

    const getSalonName = (id: number) => salones.find(s => s.id === id)?.nombre || 'Unknown';

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

    const [startTime, setStartTime] = useState('06:00');
    const [endTime, setEndTime] = useState('06:00');

    // Import File State for New Recaudacion
    const [importFile, setImportFile] = useState<File | null>(null);

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

    const handleSalonChange = async (salonId: number) => {
        setFormData(prev => ({ ...prev, salon_id: salonId }));
        if (salonId === 0) return;

        try {
            const lastDateIso = await recaudacionApi.getLastDate(salonId);
            const today = new Date().toISOString().split('T')[0];

            let newStartDate = '';
            let newStartTime = '06:00';

            if (lastDateIso && typeof lastDateIso === 'string') {
                // If last info exists, use its End Date as Start Date
                const lastDateObj = new Date(lastDateIso);
                newStartDate = lastDateObj.toISOString().split('T')[0];
                const hours = lastDateObj.getHours().toString().padStart(2, '0');
                const minutes = lastDateObj.getMinutes().toString().padStart(2, '0');
                newStartTime = `${hours}:${minutes}`;
            }

            setFormData(prev => ({
                ...prev,
                salon_id: salonId,
                fecha_inicio: newStartDate,
                fecha_fin: today,
                fecha_cierre: today
            }));
            setStartTime(newStartTime);
            setEndTime('06:00');
        } catch (err) {
            console.error("Error fetching last date", err);
        }
    };

    // Auto-fill from Excel
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);

        try {
            const metadata = await recaudacionApi.parseMetadata(file);
            console.log("Metadata parsed:", metadata);

            if (metadata.is_normalized) {
                // Determine updates
                const updates: any = {};
                if (metadata.salon_id) {
                    updates.salon_id = metadata.salon_id;
                    updates.origen = 'importacion';
                }

                // Format dates to YYYY-MM-DD
                const formatDateStr = (d: string) => d.split('T')[0];

                if (metadata.fecha_inicio) {
                    updates.fecha_inicio = formatDateStr(metadata.fecha_inicio);
                }

                if (metadata.fecha_fin) {
                    updates.fecha_fin = formatDateStr(metadata.fecha_fin);
                    // Standard logic: closing date = end date
                    updates.fecha_cierre = formatDateStr(metadata.fecha_fin);
                }

                if (Object.keys(updates).length > 0) {
                    setFormData(prev => ({ ...prev, ...updates }));
                    alert("Datos autocompletados desde el archivo Excel.");
                }
            }
        } catch (err) {
            console.error("Error parsing metadata:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const startDateTime = `${formData.fecha_inicio}T${startTime}:00`;
            const endDateTime = `${formData.fecha_fin}T${endTime}:00`;

            const payload = {
                ...formData,
                fecha_inicio: startDateTime,
                fecha_fin: endDateTime
            };

            const newRec = await recaudacionApi.create(payload);

            // Handle Import
            if (importFile) {
                try {
                    // Upload the file
                    const uploadedFile = await recaudacionApi.uploadFile(newRec.id, importFile);

                    // Analyze it
                    // Note: modify backend analyzeFile to potentially return logic for auto-import? 
                    // Or we just check names.
                    // For now, let's trigger analysis.
                    const analysis = await recaudacionApi.analyzeFile(newRec.id, uploadedFile.id);

                    if (analysis.is_normalized) {
                        // Auto-import using remapExcel (which supports file_id and empty mappings)
                        await recaudacionApi.remapExcel(newRec.id, uploadedFile.id, {});
                        // Done
                        navigate(`/recaudaciones/${newRec.id}`);
                    } else {
                        // Go to detail page but open the mapping modal
                        navigate(`/recaudaciones/${newRec.id}`, {
                            state: {
                                openImportModal: true,
                                analysisResults: analysis,
                                analyzingFileId: uploadedFile.id
                            }
                        });
                    }
                } catch (err) {
                    console.error("Error creating/importing:", err);
                    alert("Recaudación creada, pero hubo error al importar el archivo.");
                    navigate(`/recaudaciones/${newRec.id}`);
                }
            } else {
                setRecaudaciones([newRec, ...recaudaciones]);
                setShowModal(false);
                navigate(`/recaudaciones/${newRec.id}`);
            }
        } catch (error: any) {
            console.error("Error creating recaudacion:", error);
            const msg = error.response?.data?.detail || "Error al crear la recaudación. Verifique que no haya solapamiento de fechas.";
            alert(msg);
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


    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Recaudaciones</h1>
                    <p className="text-gray-500">Gestión de recaudaciones y lecturas</p>
                </div>

                {/* View Controls */}
                <div className="flex items-center gap-4 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-700 ml-2">Agrupar por:</span>
                    <div className="flex gap-2">
                        {(['salon', 'year', 'month'] as GroupingKey[]).map(key => (
                            <button
                                key={key}
                                onClick={() => toggleGroupingKey(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${activeGroupingKeys.includes(key)
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {key === 'salon' ? 'Salón' : key === 'year' ? 'Año' : 'Mes'}
                            </button>
                        ))}
                    </div>
                    {activeGroupingKeys.length > 0 && (
                        <>
                            <div className="border-l border-gray-300 h-5 mx-1"></div>
                            <button
                                onClick={() => setActiveGroupingKeys([])}
                                className="text-xs text-red-500 hover:text-red-700 font-medium mr-2"
                            >
                                Limpiar
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 transition-all font-medium"
                >
                    <Plus size={20} className="mr-2" />
                    Nueva Recaudación
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando recaudaciones...</p>
                </div>
            ) : activeGroupingKeys.length > 0 ? (
                <GroupedRenderer
                    data={recursiveGroup(filteredRecaudaciones, activeGroupingKeys)}
                    depthKeys={activeGroupingKeys}
                    navigate={navigate}
                    salones={salones}
                    activeGroupingKeys={activeGroupingKeys}
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>

                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salón</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas (Días)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neto Salón</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiqueta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRecaudaciones.map((rec) => (
                                <tr key={rec.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/recaudaciones/${rec.id}`)}>

                                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white shadow-sm font-bold ${getSalonColor(getSalonName(rec.salon_id))}`}>
                                                {getSalonInitials(getSalonName(rec.salon_id))}
                                            </span>
                                            {getSalonName(rec.salon_id)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-gray-900">
                                                {formatDate(rec.fecha_fin)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Recaudación anterior: {formatDate(rec.fecha_inicio)} ({getDaysDiff(rec.fecha_inicio, rec.fecha_fin)} días)
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-2 whitespace-nowrap text-sm font-bold ${getCurrencyClasses(getNetoSalon(rec))}`}>
                                        {formatCurrency(getNetoSalon(rec))} <span className="text-gray-400 font-normal text-xs ml-1">({rec.porcentaje_salon ?? 50}%)</span>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {rec.etiqueta || '-'}
                                    </td>
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
                                    onChange={(e) => handleSalonChange(Number(e.target.value))}
                                >
                                    <option value={0}>Seleccione un salón</option>
                                    {salones.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
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
                        </form>
                    </div>
                </div >
            )
            }

            {/* Modal Borrar Recaudacion */}
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
