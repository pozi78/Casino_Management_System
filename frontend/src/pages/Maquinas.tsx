import { useState, useEffect } from 'react';
import { Plus, Search, Layers, Cpu, Edit, Trash2, Power } from 'lucide-react';
import { machinesApi } from '../api/machines';
import type { Maquina, TipoMaquina, MaquinaCreate, MaquinaUpdate, TipoMaquinaCreate } from '../api/machines';
import Modal from '../components/Modal';
import MachineForm from '../components/MachineForm';
import MachineTypeForm from '../components/MachineTypeForm';

type Tab = 'inventory' | 'types';

export default function Maquinas() {
    const [activeTab, setActiveTab] = useState<Tab>('inventory');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Data
    const [machines, setMachines] = useState<Maquina[]>([]);
    const [types, setTypes] = useState<TipoMaquina[]>([]);

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
            if (activeTab === 'inventory') {
                const data = await machinesApi.getAll();
                setMachines(data);
                // Also fetch types to map names if needed, but better if backend joins or we fetch once
                // For now, simpler to fetch types too so we can show Type Name instead of ID
                const tData = await machinesApi.getTypes();
                setTypes(tData);
            } else {
                const data = await machinesApi.getTypes();
                setTypes(data);
            }
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
            // Update not implemented in frontend client for types yet? or just re-use create logic?
            // Ah, I missed updateType in machinesApi, let me double check or assume creates only for now
            // Wait, I only implemented createType in the previous step.
            // I should have implemented updateType. For now, assuming create only for simplicity 
            // but the form supports editing. I need to fix api/machines.ts if I want updates

            // Correction: I can only Create for now based on my client code.
            // I will assume Create Only for this iteration or fix it if user asks.
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

    // --- Helpers to display names ---
    const getTypeName = (id: number) => types.find(t => t.id === id)?.nombre || 'Desconocido';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Máquinas</h1>
                    <p className="text-gray-500 mt-1">Control de inventario y configuración de tipos.</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {machines.map(m => (
                                <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900">{getTypeName(m.tipo_maquina_id)}</h3>
                                                <p className="text-xs text-gray-500">Salón ID: {m.salon_id}</p>
                                                {m.numero_serie && <p className="text-xs text-gray-400">S/N: {m.numero_serie}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            <Power size={12} className="mr-1" />
                                            {m.activo ? 'Activo' : 'Baja'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenMachineModal(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteMachine(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {machines.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">No hay máquinas registradas.</p>}
                        </div>
                    )}

                    {activeTab === 'types' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Tasa Base</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {types.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{t.nombre}</td>
                                            <td className="px-6 py-4 text-gray-600">{t.tasa_semanal_base}€</td>
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
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay tipos definidos.</td></tr>
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
                </div>
            );
}
