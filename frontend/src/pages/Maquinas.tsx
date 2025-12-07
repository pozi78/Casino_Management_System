import { useState, useEffect } from 'react';
import { Plus, Layers, Cpu, Edit, Trash2, Grid } from 'lucide-react';
import { machinesApi } from '../api/machines';
import type { Maquina, TipoMaquina, MaquinaCreate, GrupoMaquina, GrupoMaquinaCreate, TipoMaquinaCreate } from '../api/machines';
import { salonesApi, type Salon } from '../api/salones';
import Modal from '../components/Modal';
import MachineForm from '../components/MachineForm';
import MachineTypeForm from '../components/MachineTypeForm';
import MachineGroupForm from '../components/MachineGroupForm';

type Tab = 'inventory' | 'types' | 'groups';

export default function Maquinas() {
    const [activeTab, setActiveTab] = useState<Tab>('inventory');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Data
    const [machines, setMachines] = useState<Maquina[]>([]);
    const [types, setTypes] = useState<TipoMaquina[]>([]);
    const [groups, setGroups] = useState<GrupoMaquina[]>([]);
    const [salons, setSalons] = useState<Salon[]>([]);

    // Modals
    const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    const [editingMachine, setEditingMachine] = useState<Maquina | undefined>(undefined);
    const [editingType, setEditingType] = useState<TipoMaquina | undefined>(undefined);
    const [editingGroup, setEditingGroup] = useState<GrupoMaquina | undefined>(undefined);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Fetch everything we might need to display names correctly across tabs
            // In a larger app we might optimize this, but here it keeps things consistent
            const [m, t, g, s] = await Promise.all([
                machinesApi.getAll(),
                machinesApi.getTypes(),
                machinesApi.getGroups(),
                salonesApi.getAll()
            ]);
            setMachines(m.sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setTypes(t);
            setGroups(g.sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setSalons(s);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Error al cargar los datos.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Type Handlers ---
    const handleSaveType = async (data: TipoMaquinaCreate) => {
        try {
            // Currently API client might only have createType
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

    // --- Group Handlers ---
    const handleSaveGroup = async (data: GrupoMaquinaCreate) => {
        try {
            if (editingGroup) {
                await machinesApi.updateGroup(editingGroup.id, data);
            } else {
                await machinesApi.createGroup(data);
            }
            await fetchData();
            setIsGroupModalOpen(false);
        } catch (err) {
            throw err;
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!window.confirm('¿Seguro que quieres eliminar este grupo?')) return;
        try {
            await machinesApi.deleteGroup(id);
            await fetchData();
        } catch (err) {
            alert('Error al eliminar grupo');
        }
    };

    const handleOpenGroupModal = (group?: GrupoMaquina) => {
        setEditingGroup(group);
        setIsGroupModalOpen(true);
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
        if (!window.confirm('¿Seguro que quieres eliminar esta máquina?')) return;
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
    const getGroupName = (id?: number) => {
        if (!id) return '-';
        return groups.find(g => g.id === id)?.nombre || 'Desconocido';
    };

    const renderMachineCards = (machineList: Maquina[]) => (
        machineList.map(m => (
            <div key={m.id} className="group bg-white rounded-lg border border-gray-100 p-3 hover:shadow-md transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${m.es_multipuesto ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <Cpu size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-sm">{m.nombre}</h3>
                            {m.es_multipuesto && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">Multipuesto</span>}
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
        ))
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
                            else if (activeTab === 'groups') handleOpenGroupModal();
                            else handleOpenTypeModal();
                        }}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 transition-all font-medium"
                    >
                        <Plus size={20} className="mr-2" />
                        {activeTab === 'inventory' ? 'Nueva Máquina' : activeTab === 'groups' ? 'Nuevo Grupo' : 'Nuevo Tipo'}
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
                    onClick={() => setActiveTab('groups')}
                    className={`pb-4 px-6 font-medium text-sm transition-all relative ${activeTab === 'groups'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Grid size={18} />
                        Grupos / Multipuesto
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
                        <div className="space-y-12">
                            {salons.map(salon => {
                                const salonMachines = machines.filter(m => m.salon_id === salon.id);
                                if (salonMachines.length === 0) return null;

                                // Group by Machine Group
                                const machinesByGroup: { [key: string]: Maquina[] } = {};
                                const noGroupMachines: Maquina[] = [];

                                salonMachines.forEach(m => {
                                    if (m.grupo_id) {
                                        const gName = getGroupName(m.grupo_id);
                                        if (!machinesByGroup[gName]) machinesByGroup[gName] = [];
                                        machinesByGroup[gName].push(m);
                                    } else {
                                        noGroupMachines.push(m);
                                    }
                                });

                                return (
                                    <div key={salon.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                                            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                            {salon.nombre}
                                            <span className="text-sm font-normal text-gray-400 ml-2">({salonMachines.length} máquinas)</span>
                                        </h2>

                                        <div className="space-y-8">
                                            {/* Iterate Linked Groups */}
                                            {Object.entries(machinesByGroup)
                                                .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
                                                .map(([groupName, groupMachines]) => (
                                                    <div key={groupName} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                                        <h3 className="text-md font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                                                            <Grid size={16} />
                                                            Grupo: {groupName}
                                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{groupMachines.length}</span>
                                                        </h3>
                                                        <div className="flex flex-col gap-2">
                                                            {renderMachineCards(groupMachines)}
                                                        </div>
                                                    </div>
                                                ))}

                                            {/* Individual / No Group */}
                                            {noGroupMachines.length > 0 && (
                                                <div>
                                                    {Object.keys(machinesByGroup).length > 0 && (
                                                        <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider pl-1">Máquinas Individuales</h3>
                                                    )}
                                                    <div className="flex flex-col gap-2">
                                                        {renderMachineCards(noGroupMachines)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {machines.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No hay máquinas registradas.</p>}
                        </div>
                    )}

                    {activeTab === 'groups' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Nombre Grupo</th>
                                        <th className="px-6 py-4">Puestos</th>
                                        <th className="px-6 py-4">Descripción</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {groups.map(g => (
                                        <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{g.nombre}</td>
                                            <td className="px-6 py-4 text-gray-600">{g.cantidad_puestos}</td>
                                            <td className="px-6 py-4 text-gray-500">{g.descripcion || '-'}</td>
                                            <td className="px-6 py-4 flex gap-2 justify-end">
                                                <button onClick={() => handleOpenGroupModal(g)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteGroup(g.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {groups.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay grupos definidos.</td></tr>
                                    )}
                                </tbody>
                            </table>
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

                    <Modal
                        isOpen={isGroupModalOpen}
                        onClose={() => setIsGroupModalOpen(false)}
                        title={editingGroup ? "Editar Grupo" : "Nuevo Grupo"}
                    >
                        <MachineGroupForm
                            initialData={editingGroup}
                            onSubmit={handleSaveGroup}
                            onCancel={() => setIsGroupModalOpen(false)}
                        />
                    </Modal>
                </>
            )}
        </div>
    );
}
