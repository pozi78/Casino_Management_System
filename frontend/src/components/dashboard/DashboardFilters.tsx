import * as React from 'react';
import { Filter, Calendar, Monitor } from 'lucide-react';

interface FiltersMetadata {
    years: number[];
    months: { id: number, name: string }[];
    machines: { id: number, name: string, salon_id: number }[];
}

interface DashboardFiltersState {
    years: number[];
    months: number[];
    machine_ids: number[];
}

interface Props {
    metadata: FiltersMetadata;
    filters: DashboardFiltersState;
    onChange: (newFilters: DashboardFiltersState) => void;
    salons: { id: number, nombre: string }[];
}

export default function DashboardFilters({ metadata, filters, onChange, salons }: Props) {
    const [openDropdown, setOpenDropdown] = React.useState<'years' | 'months' | 'machines' | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = (dropdown: 'years' | 'months' | 'machines') => {
        if (openDropdown === dropdown) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(dropdown);
        }
    };

    const toggleArrayItem = <T,>(array: T[], item: T): T[] => {
        if (array.includes(item)) {
            return array.filter(i => i !== item);
        } else {
            return [...array, item];
        }
    };

    // Helper to get salon name
    const getSalonName = (salonId: number) => {
        const salon = salons.find(s => s.id === salonId);
        return salon ? salon.nombre : 'Desconocido';
    };

    return (
        <div ref={containerRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <Filter className="w-5 h-5" />
                    <span>Filtros:</span>
                </div>

                <div className="flex flex-wrap gap-4 flex-1">
                    {/* Year Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('years')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${openDropdown === 'years' ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Años
                            {filters.years.length > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">{filters.years.length}</span>}
                        </button>
                        {openDropdown === 'years' && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-20">
                                <div className="flex justify-between px-2 py-1 mb-1 border-b border-gray-100">
                                    <button
                                        onClick={() => onChange({ ...filters, years: metadata.years })}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => onChange({ ...filters, years: [] })}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Ninguno
                                    </button>
                                </div>
                                {metadata.years.map(year => (
                                    <label key={year} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.years.includes(year)}
                                            onChange={() => onChange({ ...filters, years: toggleArrayItem(filters.years, year) })}
                                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{year}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Month Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('months')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${openDropdown === 'months' ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Meses
                            {filters.months.length > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">{filters.months.length}</span>}
                        </button>
                        {openDropdown === 'months' && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-20 h-64 overflow-y-auto">
                                <div className="flex justify-between px-2 py-1 mb-1 border-b border-gray-100 sticky top-0 bg-white z-10">
                                    <button
                                        onClick={() => onChange({ ...filters, months: metadata.months.map(m => m.id) })}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => onChange({ ...filters, months: [] })}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Ninguno
                                    </button>
                                </div>
                                {metadata.months.map(month => (
                                    <label key={month.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.months.includes(month.id)}
                                            onChange={() => onChange({ ...filters, months: toggleArrayItem(filters.months, month.id) })}
                                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{month.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Machine Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('machines')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${openDropdown === 'machines' ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Monitor className="w-4 h-4 text-gray-500" />
                            Máquinas
                            {filters.machine_ids.length > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">{filters.machine_ids.length}</span>}
                        </button>
                        {openDropdown === 'machines' && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-20 max-h-80 overflow-y-auto">
                                <div className="p-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="flex justify-between px-2 py-1 mb-1 border-b border-gray-100">
                                    <button
                                        onClick={() => onChange({ ...filters, machine_ids: metadata.machines.map(m => m.id) })}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => onChange({ ...filters, machine_ids: [] })}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Ninguno
                                    </button>
                                </div>
                                {metadata.machines.slice(0, 100).map(machine => ( // Limit rendering for performance
                                    <label key={machine.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.machine_ids.includes(machine.id)}
                                            onChange={() => onChange({ ...filters, machine_ids: toggleArrayItem(filters.machine_ids, machine.id) })}
                                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 truncate">
                                            {machine.name} <span className="text-xs text-gray-400">({getSalonName(machine.salon_id)})</span>
                                        </span>
                                    </label>
                                ))}
                                {metadata.machines.length > 100 && <p className="text-xs text-gray-400 p-2 text-center">Mostrando 100/{metadata.machines.length}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Reset Button */}
                {(filters.years.length > 0 || filters.months.length > 0 || filters.machine_ids.length > 0) && (
                    <button
                        onClick={() => onChange({ years: [], months: [], machine_ids: [] })}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
}
