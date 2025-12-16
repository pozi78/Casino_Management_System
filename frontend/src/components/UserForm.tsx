import React, { useState, useEffect } from 'react';
import { User, Shield, Building2, Plus, Trash2, X } from 'lucide-react';
import type { User as UserType, UserCreate, UserUpdate, UsuarioSalonPermission } from '../api/users';
import type { Role } from '../api/roles';
import type { Salon } from '../api/salones';
import { rolesApi } from '../api/roles';
import { salonesApi } from '../api/salones';

interface UserFormProps {
    initialData?: UserType;
    onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
    onCancel: () => void;
}

export default function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);

    // Data Lists
    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [availableSalones, setAvailableSalones] = useState<Salon[]>([]);

    const [formData, setFormData] = useState({
        nombre: '',
        username: '',
        email: '',
        password: '',
        activo: true,
        // New fields
        telefono: '',
        telegram_user: '',
        cargo: '',
        departamento: '',
        codigo_empleado: '',
        dni: '',
        direccion_postal: '',
        notas: ''
    });

    // Permissions State
    const [selectedRole, setSelectedRole] = useState<number | ''>('');
    const [salonPermissions, setSalonPermissions] = useState<UsuarioSalonPermission[]>([]);
    const [selectedSalonId, setSelectedSalonId] = useState<number | null>(null);

    const handleAddSalon = () => {
        if (!selectedSalonId) return;
        setSalonPermissions(prev => [
            ...prev,
            {
                salon_id: selectedSalonId,
                puede_ver: true,
                puede_editar: false,
                ver_dashboard: false,
                ver_recaudaciones: false,
                editar_recaudaciones: false,
                ver_historico: false
            }
        ]);
        setSelectedSalonId(null);
    };

    const handleRemoveSalon = (salonId: number) => {
        setSalonPermissions(prev => prev.filter(p => p.salon_id !== salonId));
    };

    const handlePermissionChange = (salonId: number, field: keyof UsuarioSalonPermission, value: boolean) => {
        setSalonPermissions(prev => prev.map(p => {
            if (p.salon_id === salonId) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    useEffect(() => {
        const loadAuxData = async () => {
            try {
                const [roles, salones] = await Promise.all([
                    rolesApi.getAll(),
                    salonesApi.getAll()
                ]);
                setAvailableRoles(roles);
                setAvailableSalones(salones);
            } catch (err) {
                console.error("Error loading roles/salones", err);
            }
        };
        loadAuxData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                username: initialData.username || '',
                email: initialData.email || '',
                password: '', // Don't show existing password
                activo: initialData.activo ?? true,
                telefono: initialData.telefono || '',
                telegram_user: initialData.telegram_user || '',
                cargo: initialData.cargo || '',
                departamento: initialData.departamento || '',
                codigo_empleado: initialData.codigo_empleado || '',
                dni: initialData.dni || '',
                direccion_postal: initialData.direccion_postal || '',
                notas: initialData.notas || ''
            });

            if (initialData.roles && initialData.roles.length > 0) {
                setSelectedRole(initialData.roles[0].id);
            }
            if (initialData.salones_asignados) {
                const perms = initialData.salones_asignados.map(p => ({
                    ...p,
                    ver_dashboard: p.ver_dashboard ?? false,
                    ver_recaudaciones: p.ver_recaudaciones ?? false,
                    editar_recaudaciones: p.editar_recaudaciones ?? false,
                    ver_historico: p.ver_historico ?? false
                }));
                setSalonPermissions(perms);
            }
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload: any = {
                ...formData,
                role_ids: selectedRole ? [Number(selectedRole)] : [],
                salones_permission: salonPermissions
            };

            if (!isEditing || (isEditing && formData.password.trim() !== '')) {
                payload.password = formData.password;
            } else {
                delete payload.password;
            }

            await onSubmit(payload);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Permission Columns Definition
    const permissionColumns = [
        { key: 'puede_ver', label: 'Ver' },
        { key: 'puede_editar', label: 'Editar' },
        { key: 'ver_dashboard', label: 'Dashboard' },
        { key: 'ver_recaudaciones', label: 'Recaudaciones' },
        { key: 'editar_recaudaciones', label: 'Edit. Recau' },
        { key: 'ver_historico', label: 'Histórico' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Account Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Cuenta</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isEditing ? 'Contraseña (Opcional)' : 'Contraseña'}
                        </label>
                        <input
                            type="password"
                            required={!isEditing}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                {/* Column 2: Professional Details & Role */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Detalles y Rol</h3>

                    {/* Role Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol del Usuario</label>
                        <select
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(Number(e.target.value))}
                        >
                            <option value="">Seleccionar Rol...</option>
                            {availableRoles.map(role => (
                                <option key={role.id} value={role.id}>{role.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                value={formData.cargo}
                                onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                value={formData.departamento}
                                onChange={e => setFormData({ ...formData, departamento: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código Empleado</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.codigo_empleado}
                            onChange={e => setFormData({ ...formData, codigo_empleado: e.target.value })}
                        />
                    </div>
                </div>

                {/* Column 3: Contact & Status */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Contacto</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea
                            rows={4}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                            value={formData.notas}
                            onChange={e => setFormData({ ...formData, notas: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="relative inline-flex items-center cursor-pointer mt-4">
                            <input
                                type="checkbox"
                                checked={formData.activo}
                                onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">Usuario Activo</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Permissions Section - Clean Table Layout */}
            <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-md font-bold text-gray-900">Permisos por Salón</h3>
                        <p className="text-sm text-gray-500">Asigne permisos específicos para cada salón.</p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-w-[200px]"
                            value={selectedSalonId || ''}
                            onChange={(e) => setSelectedSalonId(Number(e.target.value))}
                        >
                            <option value="">Seleccionar Salón...</option>
                            {availableSalones
                                .filter(s => !salonPermissions.some(p => p.salon_id === s.id))
                                .map(salon => (
                                    <option key={salon.id} value={salon.id}>{salon.nombre}</option>
                                ))
                            }
                        </select>
                        <button
                            type="button"
                            onClick={handleAddSalon}
                            disabled={!selectedSalonId}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {salonPermissions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No hay permisos asignados. Seleccione un salón para comenzar.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Salón</th>
                                        {permissionColumns.map(col => (
                                            <th key={col.key} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{col.label}</th>
                                        ))}
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {salonPermissions.map(perm => {
                                        const salon = availableSalones.find(s => s.id === perm.salon_id);
                                        if (!salon) return null;
                                        return (
                                            <tr key={perm.salon_id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={16} className="text-gray-400" />
                                                        {salon.nombre}
                                                    </div>
                                                </td>
                                                {permissionColumns.map(col => (
                                                    <td key={col.key} className="px-4 py-4 whitespace-nowrap text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                                                            checked={!!perm[col.key as keyof UsuarioSalonPermission]}
                                                            onChange={(e) => handlePermissionChange(perm.salon_id, col.key as keyof UsuarioSalonPermission, e.target.checked)}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSalon(perm.salon_id)}
                                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-2.5 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-70"
                >
                    {isLoading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
            </div>
        </form>
    );
}
