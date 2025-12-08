import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Power, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { salonesApi } from '../api/salones';
import type { Salon, SalonCreate, SalonUpdate } from '../api/salones';
import Modal from '../components/Modal';
import SalonForm from '../components/SalonForm';

import { useSalonFilter } from '../context/SalonFilterContext';

export default function Salones() {
    const [salones, setSalones] = useState<Salon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { selectedSalonIds } = useSalonFilter();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSalon, setCurrentSalon] = useState<Salon | undefined>(undefined);

    useEffect(() => {
        fetchSalones();
    }, []);

    const fetchSalones = async () => {
        try {
            setIsLoading(true);
            const data = await salonesApi.getAll();
            setSalones(data);
        } catch (err) {
            console.error('Error fetching salones:', err);
            setError('No se pudieron cargar los salones. Inténtelo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSalon = async (data: SalonCreate | SalonUpdate) => {
        try {
            if (isEditing && currentSalon) {
                await salonesApi.update(currentSalon.id, data);
            } else {
                await salonesApi.create(data as SalonCreate);
            }
            // Refetch to ensure we have the correct server state
            await fetchSalones();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Error saving salon:", err);
            throw err;
        }
    };

    const handleDeleteSalon = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este salón?')) {
            return;
        }

        try {
            await salonesApi.delete(id);
            await fetchSalones();
        } catch (err) {
            console.error("Error deleting salon:", err);
            alert('Error al eliminar el salón. Inténtelo de nuevo.');
        }
    };

    const handleOpenModal = (salon?: Salon) => {
        if (salon) {
            setIsEditing(true);
            setCurrentSalon(salon);
        } else {
            setIsEditing(false);
            setCurrentSalon(undefined);
        }
        setIsModalOpen(true);
    };

    const filteredSalones = salones.filter(salon => {
        if (!salon) return false;

        // Global Filter
        if (!selectedSalonIds.includes(salon.id)) return false;

        // Search Term
        const term = searchTerm.toLowerCase();
        const nameMatch = salon.nombre ? salon.nombre.toLowerCase().includes(term) : false;
        return nameMatch;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Salones</h1>
                    <p className="text-gray-500 mt-1">Gestiona los salones de juego y sus ubicaciones.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 transition-all font-medium"
                >
                    <Plus size={20} className="mr-2" />
                    Nuevo Salón
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                    {error}
                </div>
            ) : filteredSalones.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 border-dashed">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No hay salones encontrados</h3>
                    <p className="text-gray-500 mt-1">Prueba a cambiar los filtros o crea un nuevo salón.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSalones.map((salon) => (
                        <div key={salon.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                                            #{salon.id}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{salon.nombre}</h3>
                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                <MapPin size={12} className="mr-1" />
                                                {salon.direccion || 'Sin dirección'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${salon.activo
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-700'
                                        }`}>
                                        <Power size={12} className="mr-1" />
                                        {salon.activo ? 'Activo' : 'Inactivo'}
                                    </span>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenModal(salon)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSalon(salon.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? "Editar Salón" : "Nuevo Salón"}
            >
                <SalonForm
                    initialData={currentSalon}
                    onSubmit={handleSaveSalon}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
