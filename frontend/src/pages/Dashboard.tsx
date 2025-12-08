import {
    DollarSign,
    Users,
    MapPin,
    Activity,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

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

// ... (StatCard component remains)

export default function Dashboard() {
    const { selectedSalonIds } = useSalonFilter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                // Pass selectedSalonIds. If empty or all logic depends on how context works.
                // In SalonFilterContext: "isFiltered" can tell us.
                // Backend expects list of IDs.
                if (selectedSalonIds.length === 0) {
                    setStats({
                        ingresos_totales: 0,
                        usuarios_activos: 0,
                        salones_operativos: 0,
                        maquinas_activas: 0
                    });
                    setIsLoading(false);
                    return;
                }
                const data = await statsApi.getDashboardStats(selectedSalonIds);
                setStats(data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [selectedSalonIds]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Bienvenido al panel de administración de Atlantic & Mistery.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Ingresos Totales (50%)"
                    value={isLoading ? "..." : formatCurrency(stats?.ingresos_totales || 0)}
                    icon={DollarSign}
                    trend="up"
                    trendValue="Acumulado" // Placeholder for now
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Usuarios Activos"
                    value={isLoading ? "..." : (stats?.usuarios_activos || 0)}
                    icon={Users}
                    trend="up"
                    trendValue="Total"
                    color="bg-blue-500"
                />
                <StatCard
                    title="Salones Operativos"
                    value={isLoading ? "..." : (stats?.salones_operativos || 0)}
                    icon={MapPin}
                    trend="up"
                    trendValue="Activos"
                    color="bg-amber-500"
                />
                <StatCard
                    title="Máquinas en Uso"
                    value={isLoading ? "..." : (stats?.maquinas_activas || 0)}
                    icon={Activity}
                    trend="up"
                    trendValue="Total"
                    color="bg-purple-500"
                />
            </div>

            {/* Recent Activity / Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-96 flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp size={48} className="mb-4 opacity-20" />
                    <p>Gráfico de Recaudación (Próximamente)</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-96 flex flex-col items-center justify-center text-gray-400">
                    <Activity size={48} className="mb-4 opacity-20" />
                    <p>Actividad de Máquinas en Tiempo Real</p>
                </div>
            </div>
        </div>
    );
}
