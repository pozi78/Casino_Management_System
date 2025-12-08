

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MapPin,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    FileText
} from 'lucide-react';
import { useSalonFilter } from '../context/SalonFilterContext';
import { useAuth } from '../context/AuthContext';
import { SlotMachineIcon } from './Icons';

interface SidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
    const { logout } = useAuth();
    const { availableSalons, selectedSalonIds, toggleSalon, selectAll, deselectAll } = useSalonFilter();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: MapPin, label: 'Salones', path: '/salones' },
        { icon: SlotMachineIcon, label: 'Máquinas', path: '/maquinas' },
        { icon: FileText, label: 'Recaudaciones', path: '/recaudaciones' },
        { icon: Users, label: 'Usuarios', path: '/usuarios' },
        { icon: Settings, label: 'Configuración', path: '/configuracion' },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-[#064E3B]/20 bg-[#064E3B] text-white flex flex-col ${isOpen ? 'w-64' : 'w-20'
                }`}
        >
            {/* Header / Logo */}
            <div className={`flex items-center h-16 px-4 border-b border-emerald-800/50 ${isOpen ? 'justify-between' : 'justify-center'}`}>
                {isOpen ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#B45309] flex items-center justify-center font-bold text-xs shadow-md">
                            A&M
                        </div>
                        <span className="font-bold text-lg tracking-tight text-emerald-50">Casino Msg</span>
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#B45309] flex items-center justify-center font-bold text-xs shadow-md">
                        A&M
                    </div>
                )}

                <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-lg hover:bg-emerald-800/50 text-emerald-300 transition-colors ${!isOpen && 'hidden'}`}
                >
                    <ChevronLeft size={18} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                            ${isActive
                                ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-lg shadow-orange-900/20 font-medium'
                                : 'text-emerald-100/70 hover:bg-emerald-800/30 hover:text-white'
                            }
                        `}
                    >
                        <item.icon size={22} className={isOpen ? 'mr-3' : 'mx-auto'} />
                        {isOpen && <span>{item.label}</span>}
                    </NavLink>
                ))}

                {/* Salon Filter Section */}
                {isOpen && availableSalons.length > 0 && (
                    <div className="mt-8 px-3">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                Filtrar Salones
                            </h3>
                            <button
                                onClick={selectedSalonIds.length === availableSalons.length ? deselectAll : selectAll}
                                className="text-[10px] text-emerald-300 hover:text-white underline cursor-pointer"
                            >
                                {selectedSalonIds.length === availableSalons.length ? 'Ninguno' : 'Todos'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            {availableSalons.map(salon => (
                                <label key={salon.id} className="flex items-center space-x-3 cursor-pointer group p-1.5 rounded-lg hover:bg-emerald-800/20 transition-colors">
                                    <div className={`
                                        w-4 h-4 rounded border flex items-center justify-center transition-colors
                                        ${selectedSalonIds.includes(salon.id)
                                            ? 'bg-[#F59E0B] border-[#F59E0B]'
                                            : 'border-emerald-600 group-hover:border-emerald-400'
                                        }
                                    `}>
                                        {selectedSalonIds.includes(salon.id) && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedSalonIds.includes(salon.id)}
                                        onChange={() => toggleSalon(salon.id)}
                                    />
                                    <span className={`text-sm ${selectedSalonIds.includes(salon.id) ? 'text-white' : 'text-emerald-200/70'}`}>
                                        {salon.nombre}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* User Section / Logout */}
            <div className="p-4 border-t border-emerald-800/50">
                <button
                    onClick={logout}
                    className={`flex items-center w-full px-3 py-3 text-red-300 rounded-xl hover:bg-red-500/10 hover:text-red-200 transition-colors ${!isOpen && 'justify-center'}`}
                >
                    <LogOut size={20} className={isOpen ? 'mr-3' : ''} />
                    {isOpen && <span>Cerrar Sesión</span>}
                </button>
            </div>

            {/* Toggle Button for Collapsed State (floating outside if needed, or integrated) - keeping integrated for clean look */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 bg-[#F59E0B] text-white rounded-full p-1 shadow-lg hover:bg-[#D97706] transition-colors"
                >
                    <ChevronRight size={14} />
                </button>
            )}
        </aside>
    );
}
