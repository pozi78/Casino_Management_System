import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MapPin,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    FileText,
    X,
    Check,
    ChevronDown,
    ChevronUp,
    Filter
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
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

                {/* Salon Filter Section (Redesigned) */}
                {isOpen && availableSalons.length > 0 && (
                    <div className="mt-8 px-1">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                <Filter size={10} />
                                Filtrar Salones
                            </h3>
                            {selectedSalonIds.length > 0 && (
                                <button onClick={deselectAll} className="text-[10px] text-emerald-500 hover:text-red-400 transition-colors">
                                    Borrar
                                </button>
                            )}
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            {/* Input / Chip Container */}
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`
                                    w-full min-h-[42px] bg-[#053d2e] border border-emerald-800/50 rounded-lg p-1.5 cursor-pointer 
                                    hover:border-emerald-600 transition-colors flex flex-wrap gap-1.5 items-center
                                    ${isDropdownOpen ? 'ring-2 ring-emerald-500/30 border-emerald-500' : ''}
                                `}
                            >
                                {selectedSalonIds.length === 0 ? (
                                    <span className="text-emerald-200/40 text-sm px-1 select-none">Todos los salones...</span>
                                ) : (
                                    selectedSalonIds.map(id => {
                                        const salon = availableSalons.find(s => s.id === id);
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-800/60 text-emerald-100 border border-emerald-700/50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSalon(id);
                                                }}
                                            >
                                                {salon?.nombre}
                                                <X size={10} className="ml-1 text-emerald-400 hover:text-white" />
                                            </span>
                                        );
                                    })
                                )}
                                <div className="ml-auto pl-1 text-emerald-400">
                                    {isDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#053d2e] border border-emerald-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-700 scrollbar-track-transparent p-1">
                                        <div
                                            onClick={selectAll}
                                            className="px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-800/50 rounded cursor-pointer mb-1 border-b border-white/5"
                                        >
                                            Seleccionar Todos
                                        </div>
                                        {availableSalons.map(salon => {
                                            const isSelected = selectedSalonIds.includes(salon.id);
                                            return (
                                                <div
                                                    key={salon.id}
                                                    onClick={() => toggleSalon(salon.id)}
                                                    className={`
                                                        flex items-center justify-between px-2 py-2 rounded cursor-pointer transition-colors
                                                        ${isSelected ? 'bg-emerald-800/40 text-white' : 'text-emerald-200 hover:bg-emerald-800/30'}
                                                    `}
                                                >
                                                    <span className="text-sm truncate pr-2">{salon.nombre}</span>
                                                    {isSelected && <Check size={14} className="text-[#F59E0B]" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
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

            {/* Toggle Button for Collapsed State */}
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
