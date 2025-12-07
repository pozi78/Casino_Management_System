import { useState, useEffect } from 'react';
import { Plus, Cpu, Layers, Grid, ChevronRight, ChevronDown, Edit, Trash2, Gamepad2 } from 'lucide-react';
import { machinesApi } from '../api/machines';
import { salonesApi } from '../api/salones';
import type { Maquina, MaquinaCreate, TipoMaquina, TipoMaquinaCreate } from '../api/machines';
import type { Salon } from '../api/salones';
import Modal from '../components/Modal';
import MachineForm from '../components/MachineForm';
import MachineTypeForm from '../components/MachineTypeForm';

type Tab = 'inventory' | 'types';

export default function Maquinas() {
    const [activeTab, setActiveTab] = useState<Tab>('inventory');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Data
    // Data
    const [machines, setMachines] = useState<Maquina[]>([]);
    const [types, setTypes] = useState<TipoMaquina[]>([]);
    const [salons, setSalons] = useState<Salon[]>([]);

    // State for Collapsible UI
    // State for Collapsible UI (Default: Collapsed/Empty)
    const [expandedSalons, setExpandedSalons] = useState<Record<number, boolean>>({});
    const [expandedMultipuestos, setExpandedMultipuestos] = useState<Record<number, boolean>>({});

    // Modals
    const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    const [editingMachine, setEditingMachine] = useState<Maquina | undefined>(undefined);
    const [editingType, setEditingType] = useState<TipoMaquina | undefined>(undefined);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const [m, t, s] = await Promise.all([
                machinesApi.getAll(),
                machinesApi.getTypes(),
                salonesApi.getAll()
            ]);

            // Ensure we have a fresh list of machines
            // The API returns all, including children.
            setMachines(m.sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setTypes(t);
            setSalons(s);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Error al cargar los datos.");
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle Handlers
    const toggleSalon = (id: number) => {
        setExpandedSalons(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleMultipuesto = (id: number) => {
        setExpandedMultipuestos(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Type Handlers ---
    const handleSaveType = async (data: TipoMaquinaCreate) => {
        try {
            if (editingType) {
                alert("Edición de tipos no implementada en API aún, solo creación.");
                return;
            }
            await machinesApi.createType(data);
            await fetchData();
            setIsTypeModalOpen(false);
        } catch (err) {
            throw err;
        }
    };

    const handleOpenTypeModal = (type?: TipoMaquina) => {
        setEditingType(type);
        setIsTypeModalOpen(true);
    };

    // --- Machine Handlers ---
    const handleSaveMachine = async (data: MaquinaCreate) => {
        try {
            if (editingMachine) {
                await machinesApi.update(editingMachine.id, data);
            } else {
                await machinesApi.create(data);
            }
            await fetchData();
            setIsMachineModalOpen(false);
        } catch (err) {
            throw err;
        }
    };

    const handleDeleteMachine = async (id: number) => {
        if (!window.confirm('¿Seguro que quieres eliminar esta máquina? (Si es multipuesto, eliminará también las submáquinas vinculadas)')) return;
        try {
            await machinesApi.delete(id);
            await fetchData();
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    const handleOpenMachineModal = (machine?: Maquina) => {
        setEditingMachine(machine);
        setIsMachineModalOpen(true);
    };

    // --- Helpers ---
    const getTypeName = (id: number) => types.find(t => t.id === id)?.nombre || 'Desconocido';


    // Helper to organize machines into Roots (Standalone + Parents) and Children
    const organizeMachines = (machineList: Maquina[]) => {
        const childrenMap: Record<number, Maquina[]> = {};
        const roots: Maquina[] = [];

        // 1. Identify Children (machines with maquina_padre_id)
        machineList.forEach(m => {
            if (m.maquina_padre_id) {
                if (!childrenMap[m.maquina_padre_id]) childrenMap[m.maquina_padre_id] = [];
                childrenMap[m.maquina_padre_id].push(m);
            }
        });

        // 2. Identify Roots (machines without maquina_padre_id)
        machineList.forEach(m => {
            if (!m.maquina_padre_id) {
                roots.push(m);
            }
        });

        return { roots, childrenMap };
    };

    const renderMachineCards = (machineList: Maquina[], childrenMap: Record<number, Maquina[]>) => (
        machineList.map(m => {
            const children = childrenMap[m.id];
            const hasChildren = children && children.length > 0;
            // Note: If es_multipuesto is true, treat as container even if children array empty momentarily
            if (m.es_multipuesto) {
                const isExpanded = expandedMultipuestos[m.id]; // Default collapsed if undefined

                return (
                    <div key={m.id} className="border border-indigo-100 rounded-lg overflow-hidden bg-white mb-2 shadow-sm">
                        {/* Parent Header */}
                        <div
                            className="bg-indigo-50/40 p-3 flex items-center justify-between cursor-pointer hover:bg-indigo-50 transition-colors select-none"
                            onClick={() => toggleMultipuesto(m.id)}
                        >
                            <div className="flex items-center gap-2 sm:gap-4 flex-1">
                                <button className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>

                                <div className="flex items-center gap-3">
                                    <div className="bg-white border border-indigo-200 text-indigo-600 p-1.5 rounded-lg shadow-sm">
                                        <Cpu size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900 text-sm">{m.nombre}</h3>
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                                {children?.length || 0} Puestos
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">{getTypeName(m.tipo_maquina_id)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenMachineModal(m); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit size={16} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteMachine(m.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {/* Children List */}
                        {isExpanded && (
                            <div className="border-t border-indigo-100 bg-gray-50/30 p-2 space-y-1 pl-4 sm:pl-10">
                                {children && children.map(child => (
                                    <div key={child.id} className="group bg-white border border-gray-100 rounded p-2 flex items-center justify-between text-sm hover:border-indigo-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                                            <div>
                                                <span className="font-medium text-gray-700">{child.nombre}</span>
                                                <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Puesto {child.numero_puesto}</span>
                                            </div>
                                        </div>
                                        {/* Child Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenMachineModal(child)} className="p-1 text-gray-400 hover:text-blue-600"><Edit size={14} /></button>
                                            <button onClick={() => handleDeleteMachine(child.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                {(!children || children.length === 0) && (
                                    <div className="text-xs text-gray-400 italic p-2 text-center">Sin puestos asignados</div>
                                )}
                            </div>
                        )}
                    </div>
                );
            }

            // Standard Card (Single)
            return (
                <div key={m.id} className="group bg-white rounded-lg border border-gray-100 p-3 hover:shadow-md transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${m.es_multipuesto ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <Cpu size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-sm">{m.nombre}</h3>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                <span>{getTypeName(m.tipo_maquina_id)}</span>
                                <span className="text-gray-300">•</span>
                                {m.numero_serie && <span>S/N: {m.numero_serie}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {m.activo ? 'Activo' : 'Baja'}
                        </span>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenMachineModal(m)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteMachine(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </div>
            );
        })
    );

    return (
        <div>
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 relative">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-1">{error}</span>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Máquinas</h1>
                    <p className="text-gray-500 mt-1">Inventario, grupos y configuración de modelos.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (activeTab === 'inventory') handleOpenMachineModal();
                            else handleOpenTypeModal();
                        }}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 transition-all font-medium"
                    >
                        <Plus size={20} className="mr-2" />
                        {activeTab === 'inventory' ? 'Nueva Máquina' : 'Nuevo Tipo'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-4 px-6 font-medium text-sm transition-all relative ${activeTab === 'inventory'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Cpu size={18} />
                        Inventario
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('types')}
                    className={`pb-4 px-6 font-medium text-sm transition-all relative ${activeTab === 'types'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Layers size={18} />
                        Tipos de Máquina
                    </div>
                </button>
            </div>

            {/* Content */}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'inventory' && (
                        <div className="space-y-6">
                            {salons.map(salon => {
                                const salonMachines = machines.filter(m => m.salon_id === salon.id);
                                if (salonMachines.length === 0) return null;

                                const isSalonExpanded = expandedSalons[salon.id];

                                // Organize machines (Roots vs Children)
                                const { roots, childrenMap } = organizeMachines(salonMachines);

                                // Sort: Multipuesto first (Alpha), then Monopuesto (Alpha)
                                roots.sort((a, b) => {
                                    if (a.es_multipuesto && !b.es_multipuesto) return -1;
                                    if (!a.es_multipuesto && b.es_multipuesto) return 1;
                                    return a.nombre.localeCompare(b.nombre);
                                });



                                // Calculate counts
                                const totalRoots = roots.length;
                                const totalMultipuestoSeats = roots.reduce((acc, m) => {
                                    if (m.es_multipuesto) return acc + (childrenMap[m.id]?.length || 0);
                                    return acc;
                                }, 0);
                                const totalMonopuestos = roots.filter(m => !m.es_multipuesto).length;

                                return (
                                    <div key={salon.id} className="mb-8">
                                        {/* Salon Header */}
                                        <div
                                            className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors mb-4"
                                            onClick={() => toggleSalon(salon.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <button className="text-indigo-400 hover:text-indigo-600 transition-colors">
                                                    {isSalonExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                                                </button>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">{salon.nombre}</h2>
                                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                                        <span className="flex items-center gap-1.5" title="Máquinas Físicas (Total Muebles)">
                                                            <Cpu size={16} className="text-gray-500" />
                                                            <span className="font-bold text-gray-900">{totalRoots}</span> Máquinas
                                                        </span>
                                                        {totalMultipuestoSeats > 0 && (
                                                            <span className="flex items-center gap-1.5" title="Total Puestos en Multipuestos">
                                                                <Grid size={16} className="text-indigo-500" />
                                                                <span className="font-bold text-indigo-700">{totalMultipuestoSeats}</span> Puestos Multi
                                                            </span>
                                                        )}
                                                        {totalMonopuestos > 0 && (
                                                            <span className="flex items-center gap-1.5" title="Total Puestos Monopuesto">
                                                                <Gamepad2 size={16} className="text-emerald-500" />
                                                                <span className="font-bold text-emerald-700">{totalMonopuestos}</span> Puestos Mono
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Salon Content */}
                                        {isSalonExpanded && (
                                            <div className="space-y-6 pl-2 sm:pl-4 border-l-2 border-gray-100 ml-2 sm:ml-4">
                                                <div className="flex flex-col gap-2">
                                                    {renderMachineCards(roots, childrenMap)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {machines.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No hay máquinas registradas.</p>}
                        </div>
                    )}

                    {activeTab === 'types' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Tasa Orientativa</th>
                                        <th className="px-6 py-4">Multipuesto?</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {types.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{t.nombre}</td>
                                            <td className="px-6 py-4 text-gray-600">{t.tasa_semanal_orientativa}€</td>
                                            <td className="px-6 py-4 text-gray-600">{t.es_multipuesto ? 'Sí' : 'No'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                    {t.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleOpenTypeModal(t)} className="text-gray-400 hover:text-emerald-600 transition-colors"><Edit size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {types.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay tipos definidos.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Modals */}
                    <Modal
                        isOpen={isMachineModalOpen}
                        onClose={() => setIsMachineModalOpen(false)}
                        title={editingMachine ? "Editar Máquina" : "Nueva Máquina"}
                    >
                        <MachineForm
                            initialData={editingMachine}
                            onSubmit={handleSaveMachine}
                            onCancel={() => setIsMachineModalOpen(false)}
                        />
                    </Modal>

                    <Modal
                        isOpen={isTypeModalOpen}
                        onClose={() => setIsTypeModalOpen(false)}
                        title={editingType ? "Editar Tipo" : "Nuevo Tipo de Máquina"}
                    >
                        <MachineTypeForm
                            initialData={editingType}
                            onSubmit={handleSaveType}
                            onCancel={() => setIsTypeModalOpen(false)}
                        />
                    </Modal>
                </>
            )
            }
        </div >
    );
}
