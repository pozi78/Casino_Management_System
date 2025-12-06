import {
    DollarSign,
    Users,
    MapPin,
    Activity,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
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

export default function Dashboard() {
    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Bienvenido al panel de administración de Atlantic & Mistery.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Ingresos Totales"
                    value="€124,500"
                    icon={DollarSign}
                    trend="up"
                    trendValue="+12.5%"
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Usuarios Activos"
                    value="1,234"
                    icon={Users}
                    trend="up"
                    trendValue="+3.2%"
                    color="bg-blue-500"
                />
                <StatCard
                    title="Salones Operativos"
                    value="45"
                    icon={MapPin}
                    trend="up"
                    trendValue="+2"
                    color="bg-amber-500"
                />
                <StatCard
                    title="Máquinas en Uso"
                    value="89%"
                    icon={Activity}
                    trend="down"
                    trendValue="-1.5%"
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
