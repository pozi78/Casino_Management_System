import { useState, useEffect } from 'react';
import type { User, UserCreate, UserUpdate } from '../api/users';

interface UserFormProps {
    initialData?: User;
    onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
    onCancel: () => void;
}

export default function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);

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
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload: any = { ...formData };

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

    return (
        <form onSubmit={handleSubmit} className="space-y-6 h-[80vh] overflow-y-auto pr-2">
            {/* Account Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Cuenta</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                        type="text"
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        value={formData.nombre}
                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <input
                            type="text"
                            required
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isEditing ? 'Contraseña (Dejar en blanco para mantener)' : 'Contraseña'}
                    </label>
                    <input
                        type="password"
                        required={!isEditing}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
            </div>

            {/* Profesional Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Información Profesional</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            placeholder="Ej: Gerente"
                            value={formData.cargo}
                            onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            placeholder="Ej: RRHH"
                            value={formData.departamento}
                            onChange={e => setFormData({ ...formData, departamento: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Empleado</label>
                    <input
                        type="text"
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        value={formData.codigo_empleado}
                        onChange={e => setFormData({ ...formData, codigo_empleado: e.target.value })}
                    />
                </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Contacto y Otros</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Telegram</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                            <input
                                type="text"
                                className="w-full border rounded-lg pl-7 p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                value={formData.telegram_user}
                                onChange={e => setFormData({ ...formData, telegram_user: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DNI / NIF (Opcional)</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            value={formData.dni}
                            onChange={e => setFormData({ ...formData, dni: e.target.value })}
                        />
                    </div>
                    <div>
                        {/* Empty grid slot or merge */}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Postal (Opcional)</label>
                    <input
                        type="text"
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        value={formData.direccion_postal}
                        onChange={e => setFormData({ ...formData, direccion_postal: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                    <textarea
                        rows={3}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                        value={formData.notas}
                        onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
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

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    disabled={isLoading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 shadow transition-all font-medium disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
            </div>
        </form>
    );
}
