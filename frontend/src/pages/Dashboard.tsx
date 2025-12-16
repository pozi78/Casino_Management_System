import {
    DollarSign,
    Users,
    MapPin,
    Activity,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import RevenueEvolutionChart from './dashboard/RevenueEvolutionChart';
import SalonDistributionChart from './dashboard/SalonDistributionChart';
import TopMachinesTable from './dashboard/TopMachinesTable';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend: 'up' | 'down';
    trendValue: string;
    color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: StatCardProps) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <span className={`flex items-center font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <Activity size={16} className="mr-1" />}
                {trendValue}
            </span>
            <span className="text-gray-400 ml-2">vs mes anterior</span>
        </div>
    </div>
);

import { useSalonFilter } from '../context/SalonFilterContext';
import { statsApi } from '../api/stats';
import type { DashboardStats } from '../api/stats';
import { useState, useEffect } from 'react';

import DashboardFilters from '../components/dashboard/DashboardFilters';

import { usePermission } from '../hooks/usePermission';

export default function Dashboard() {
    const { selectedSalonIds, availableSalons } = useSalonFilter();
    const { canViewDashboard } = usePermission();

    // Filters State
    const [filtersMetadata, setFiltersMetadata] = useState<any>({ years: [], months: [], machines: [] });
    const [activeFilters, setActiveFilters] = useState({
        years: [],
        months: [],
        machine_ids: []
    });

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueEvolution, setRevenueEvolution] = useState<any[]>([]);
    const [revenueBySalon, setRevenueBySalon] = useState<any[]>([]);
    const [topMachines, setTopMachines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load of metadata
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const data = await statsApi.getFiltersMetadata();
                setFiltersMetadata(data);

                const currentYear = new Date().getFullYear();
                const defaultYear = data.years.includes(currentYear) ? [currentYear] : (data.years.length > 0 ? [data.years[0]] : []);
                const allMonths = data.months.map((m: any) => m.id);
                const allMachines = data.machines.map((m: any) => m.id);

                setActiveFilters(prev => ({
                    ...prev,
                    years: defaultYear,
                    months: allMonths,
                    machine_ids: allMachines // Select all machines by default
                }));

            } catch (e) {
                console.error("Failed to load filters metadata", e);
            }
        };
        loadMetadata();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);

            // Filter salons based on Dashboard Permission
            const allowedSalonIds = selectedSalonIds.filter(id => canViewDashboard(id));

            // Standard Behavior: If user explicitly deselects all salons, or NO allowed salons, or any other primary filter
            if (activeFilters.years.length === 0 ||
                activeFilters.months.length === 0 ||
                activeFilters.machine_ids.length === 0 ||
                (selectedSalonIds.length > 0 && allowedSalonIds.length === 0)) { // If salons selected but none allowed

                setStats({
                    ingresos_totales: 0,
                    usuarios_activos: 0,
                    salones_operativos: 0,
                    maquinas_activas: 0
                });
                setRevenueEvolution([]);
                setRevenueBySalon([]);
                setTopMachines([]);
                setIsLoading(false);
                return;
            }

            // If ALL salons are unselected (global view concept), we actually might want to show ALL ALLOWED salons.
            // But current logic implies: selectedSalonIds empty -> "Global/All" OR "None"?
            // Usually empty selection in filters means "All". 
            // Let's assume:
            // - If selectedSalonIds is NOT empty -> use intersection with allowed.
            // - If selectedSalonIds IS empty -> use ALL AVAILABLE salons intersected with allowed.

            let effectiveSalonIds = selectedSalonIds.length > 0
                ? allowedSalonIds
                : availableSalons.map(s => s.id).filter(id => canViewDashboard(id));

            if (effectiveSalonIds.length === 0) {
                // Nothing to show
                setStats({ ingresos_totales: 0, usuarios_activos: 0, salones_operativos: 0, maquinas_activas: 0 });
                setRevenueEvolution([]);
                setRevenueBySalon([]);
                setTopMachines([]);
                setIsLoading(false);
                return;
            }

            // 1. Fetch Main Stats (Ingresos, Usuarios, etc)
            try {
                // OPTIMIZATION: If all machines, all months, OR ALL SALONS are selected, send empty list 
                // to avoid URL length limits and to trigger efficient backend logic.

                const isAllMonths = activeFilters.months.length === filtersMetadata.months.length;

                const validMachineIds = new Set(filtersMetadata.machines.map((m: any) => m.id));
                const selectedValidMachines = activeFilters.machine_ids.filter(id => validMachineIds.has(id));
                const isAllMachines = selectedValidMachines.length === filtersMetadata.machines.length;

                // Check if effective IDs cover all available allowed IDs
                // Simplified: Pass explicit IDs if not "All".
                // If effectiveSalonIds includes all available, we can pass undefined? 
                // Only if available == allowed. Safer to pass explicit IDs if we are filtering for permissions.

                const queryFilters = {
                    salon_ids: effectiveSalonIds,
                    years: activeFilters.years,
                    months: isAllMonths ? undefined : activeFilters.months,
                    machine_ids: isAllMachines ? undefined : selectedValidMachines
                };

                // Fetch Stats separately so cards always load
                try {
                    const statsData = await statsApi.getDashboardStats(queryFilters);
                    setStats(statsData);
                } catch (error) {
                    console.error("Error fetching main stats:", error);
                }

                // Fetch Charts in parallel, but allow them to fail individually without blocking stats
                const [evolutionResult, salonResult, machinesResult] = await Promise.allSettled([
                    statsApi.getRevenueEvolution(queryFilters),
                    statsApi.getRevenueBySalon(queryFilters),
                    statsApi.getTopMachines(queryFilters)
                ]);

                if (evolutionResult.status === 'fulfilled') setRevenueEvolution(evolutionResult.value);
                else console.error("Error fetching revenue evolution:", evolutionResult.reason);

                if (salonResult.status === 'fulfilled') setRevenueBySalon(salonResult.value);
                else console.error("Error fetching salon distribution:", salonResult.reason);

                if (machinesResult.status === 'fulfilled') setTopMachines(machinesResult.value);
                else console.error("Error fetching top machines:", machinesResult.reason);

            } catch (error) {
                console.error("Error in dashboard orchestration:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [selectedSalonIds, activeFilters]);

    // Dynamic Metadata Update: When years change, update available machines to include historical ones
    useEffect(() => {
        const updateMachines = async () => {
            try {
                // Fetch new metadata based on selected years
                const data = await statsApi.getFiltersMetadata(activeFilters.years, selectedSalonIds);

                setFiltersMetadata((prev: any) => {
                    // Logic to auto-select ALL machines when metadata updates (e.g. Salon/Year change)
                    // This ensures we default to "All" (Global Context) and avoid stale ID issues.
                    const allNewMachineIds = data.machines.map((m: any) => m.id);

                    // We update active filters directly here to ensure sync
                    setActiveFilters(currentFilters => {
                        // Optional: Only overwrite if we want to force "All" on context switch.
                        // Given the bug, this is the safest approach to guarantee "Global" logic works.
                        return {
                            ...currentFilters,
                            machine_ids: allNewMachineIds
                        };
                    });

                    return {
                        ...prev,
                        machines: data.machines
                    };
                });
            } catch (error) {
                console.error("Failed to update machines metadata", error);
            }
        };

        if (filtersMetadata.years.length > 0) {
            updateMachines();
        }
    }, [activeFilters.years, selectedSalonIds]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Panel de Administración</p>
                </div>

                <DashboardFilters
                    metadata={filtersMetadata}
                    filters={activeFilters}
                    onChange={setActiveFilters}
                    salons={availableSalons}
                />
            </div>

            {/* Stats Grid */}
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Annual Revenue Card - Double Size */}
                <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                {selectedSalonIds.length === 1
                                    ? "Ingreso Anual del Salón"
                                    : "Ingreso Anual de los Salones"}
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                {isLoading ? "..." : formatCurrency(stats?.ingresos_totales || 0)}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {/* Annual Breakdown */}
                    <div className="border-t border-gray-100 pt-4 mt-2">
                        {!isLoading && stats?.ingresos_por_anio && stats.ingresos_por_anio.length > 0 ? (
                            (() => {
                                // Determine columns dynamically based on data available
                                const allSalonNames = Array.from(new Set(
                                    stats.ingresos_por_anio.flatMap(item => Object.keys(item.salones || {}))
                                )).sort();

                                const isMultiSalon = allSalonNames.length > 1;

                                if (isMultiSalon) {
                                    return (
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 font-semibold bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="py-2 pl-2">Año</th>
                                                    {allSalonNames.map(name => <th key={name} className="py-2 px-2">{name}</th>)}
                                                    <th className="py-2 pr-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {stats.ingresos_por_anio.map((item) => (
                                                    <tr key={item.anio}>
                                                        <td className="py-2 pl-2 font-medium text-gray-900">{item.anio}</td>
                                                        {allSalonNames.map(name => (
                                                            <td key={name} className="py-2 px-2 text-gray-600">
                                                                {item.salones[name] ? formatCurrency(item.salones[name]) : '-'}
                                                            </td>
                                                        ))}
                                                        <td className="py-2 pr-2 text-right font-bold text-emerald-600">
                                                            {formatCurrency(item.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    );
                                } else {
                                    // Single list view
                                    return (
                                        <div className="space-y-3">
                                            {stats.ingresos_por_anio.map((item) => (
                                                <div key={item.anio} className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-gray-700">{item.anio}</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(item.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                            })()
                        ) : (
                            !isLoading && <p className="text-sm text-gray-400 text-center py-2">No hay datos para desglose anual</p>
                        )}
                    </div>
                </div>

                {/* Salones Operativos */}
                <StatCard
                    title="Salones Operativos"
                    value={isLoading ? "..." : (stats?.salones_operativos || 0)}
                    icon={MapPin}
                    trend="up"
                    trendValue="Activos"
                    color="bg-amber-500"
                />

                {/* Maquinas en Uso */}
                <StatCard
                    title="Máquinas en Uso"
                    value={isLoading ? "..." : (stats?.maquinas_activas || 0)}
                    icon={Activity}
                    trend="up"
                    trendValue="Total"
                    color="bg-purple-500"
                />
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 gap-8">
                <RevenueEvolutionChart
                    data={revenueEvolution}
                />
                <SalonDistributionChart data={revenueBySalon} />
            </div>

            {/* Top Machines Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Top 10 Máquinas (Neto)</h3>
                <TopMachinesTable machines={topMachines} />
            </div>
        </div>
    );
}

