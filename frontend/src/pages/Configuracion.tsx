import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi, type UserUpdate } from '../api/users';
import { Mail, Lock, Save, Shield, CheckCircle, AlertCircle, Phone, MapPin, FileBadge, Send, ChevronDown } from 'lucide-react';

const COUNTRY_CODES = [
    { code: '+34', flag: '🇪🇸', name: 'España' },
    { code: '+351', flag: '🇵🇹', name: 'Portugal' },
    { code: '+376', flag: '🇦🇩', name: 'Andorra' },
    { code: '+33', flag: '🇫🇷', name: 'Francia' },
    { code: '+39', flag: '🇮🇹', name: 'Italia' },
    { code: '+44', flag: '🇬🇧', name: 'Reino Unido' },
    { code: '+1', flag: '🇺🇸', name: 'EE.UU.' },
    { code: '+49', flag: '🇩🇪', name: 'Alemania' },
];

export default function Configuracion() {
    const { user, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        username: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',

        // Contact Fields
        telefono_prefix: '+34',
        telefono_number: '',
        telefono_fijo_prefix: '+34',
        telefono_fijo_number: '',
        telegram_user: '',
        dni: '',
        direccion_postal: ''
    });

    useEffect(() => {
        if (user) {
            // Helper to split prefix and number
            const parsePhone = (phoneStr: string) => {
                if (!phoneStr) return { prefix: '+34', number: '' };
                const match = phoneStr.match(/^(\+\d+)\s*(.*)$/);
                if (match) {
                    return { prefix: match[1], number: match[2] };
                }
                return { prefix: '+34', number: phoneStr };
            };

            const mobile = parsePhone(user.telefono || '');
            const landline = parsePhone(user.telefono_fijo || '');

            setFormData(prev => ({
                ...prev,
                nombre: user.nombre || '',
                email: user.email || '',
                username: user.username || '',
                telefono_prefix: mobile.prefix,
                telefono_number: mobile.number,
                telefono_fijo_prefix: landline.prefix,
                telefono_fijo_number: landline.number,
                telegram_user: user.telegram_user || '',
                dni: user.dni || '',
                direccion_postal: user.direccion_postal || ''
            }));
        }
    }, [user]);

    const isAdmin = user?.roles?.some(r => ['SUPERADMIN', 'ADMIN'].includes(r.codigo));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
        if (successMessage) setSuccessMessage('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');
        setSuccessMessage('');

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError('Las nuevas contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const updateData: UserUpdate = {
                nombre: formData.nombre,
                telefono: `${formData.telefono_prefix} ${formData.telefono_number}`.trim(),
                telefono_fijo: `${formData.telefono_fijo_prefix} ${formData.telefono_fijo_number}`.trim(),
                telegram_user: formData.telegram_user,
                dni: formData.dni,
                direccion_postal: formData.direccion_postal,
                email: formData.email,
                password: formData.newPassword || undefined,
            };

            await usersApi.update(user.id, updateData);
            await refreshUser();

            setSuccessMessage('Perfil actualizado correctamente');
            setFormData(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    const getInitials = () => {
        const name = (user.nombre || user.username || '??').trim();
        const parts = name.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Component helper for phone inputs
    const PhoneInput = ({
        label,
        prefixName,
        numberName,
        prefixValue,
        numberValue,
        icon: Icon
    }: any) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex gap-2">
                <div className="relative min-w-[110px]">
                    <select
                        name={prefixName}
                        value={prefixValue}
                        onChange={handleChange}
                        className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer text-sm"
                    >
                        {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>
                                {c.flag} {c.code}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                </div>
                <div className="relative flex-1">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="tel"
                        name={numberName}
                        value={numberValue}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        placeholder="Número de teléfono"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 border-b pb-4">Configuración de Perfil</h1>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Profile Card - Left Column */}
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4 text-white shadow-lg ring-4 ring-emerald-50">
                            <span className="text-3xl font-bold tracking-wider">{getInitials()}</span>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.nombre || user.username}</h2>
                        <p className="text-sm font-medium text-emerald-600 mb-1">@{user.username}</p>
                        <p className="text-sm text-gray-400 mb-6">{user.email}</p>

                        <div className="w-full pt-6 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Roles y Permisos</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {user.roles?.map(role => (
                                    <span key={role.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        <Shield size={12} className="mr-1.5" />
                                        {role.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {(user.cargo || user.departamento || user.codigo_empleado) && (
                            <div className="w-full pt-4 mt-4 border-t border-gray-100 text-left text-sm space-y-2">
                                {user.cargo && <div className="flex justify-between"><span className="text-gray-500">Cargo:</span> <span className="font-medium text-gray-800">{user.cargo}</span></div>}
                                {user.departamento && <div className="flex justify-between"><span className="text-gray-500">Dpto:</span> <span className="font-medium text-gray-800">{user.departamento}</span></div>}
                                {user.codigo_empleado && <div className="flex justify-between"><span className="text-gray-500">Código:</span> <span className="font-medium text-gray-800">{user.codigo_empleado}</span></div>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form - Right Column */}
                <div className="md:col-span-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center border-b pb-2">
                            <FileBadge size={20} className="mr-2 text-emerald-600" />
                            Editar Información
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center text-sm"><AlertCircle className="mr-2 shrink-0" size={18} /> {error} </div>}
                            {successMessage && <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center text-sm"><CheckCircle className="mr-2 shrink-0" size={18} /> {successMessage} </div>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!isAdmin} className={`w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 outline-none transition-all ${!isAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'}`} />
                                    </div>
                                    {!isAdmin && <p className="text-xs text-gray-400 mt-1">Solo administradores pueden cambiar el email.</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">DNI / Documento</label>
                                    <div className="relative">
                                        <FileBadge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input type="text" name="dni" value={formData.dni} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4 px-1">Datos de Contacto</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PhoneInput
                                        label="Teléfono Móvil"
                                        prefixName="telefono_prefix"
                                        numberName="telefono_number"
                                        prefixValue={formData.telefono_prefix}
                                        numberValue={formData.telefono_number}
                                        icon={Phone}
                                    />
                                    <PhoneInput
                                        label="Teléfono Fijo"
                                        prefixName="telefono_fijo_prefix"
                                        numberName="telefono_fijo_number"
                                        prefixValue={formData.telefono_fijo_prefix}
                                        numberValue={formData.telefono_fijo_number}
                                        icon={Phone}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
                                        <div className="relative">
                                            <Send className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input type="text" name="telegram_user" value={formData.telegram_user} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Dirección Postal</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input type="text" name="direccion_postal" value={formData.direccion_postal} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4 px-1 flex items-center"><Lock size={16} className="mr-2 text-emerald-600" /> Cambiar Contraseña</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nueva Contraseña</label>
                                        <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white" placeholder="Dejar en blanco para mantener" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar Nueva Contraseña</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white" placeholder="Repite la nueva contraseña" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button type="submit" disabled={isLoading} className={`flex items-center px-8 py-3 rounded-lg text-white font-medium shadow-md transition-all ${isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:transform active:scale-95'}`}>
                                    {isLoading ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Guardando...</> : <><Save size={18} className="mr-2" /> Guardar Cambios</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
