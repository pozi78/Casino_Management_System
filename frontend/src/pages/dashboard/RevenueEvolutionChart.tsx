import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
    name: string;
    [key: string]: string | number;
}

interface Props {
    data: DataPoint[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function RevenueEvolutionChart({ data }: Props) {

    // Extract keys for bars (years)
    const getKeys = () => {
        if (data.length === 0) return [];
        const allKeys = new Set<string>();
        data.forEach(item => {
            Object.keys(item).forEach(key => {
                if (key !== 'name' && key !== 'total') {
                    allKeys.add(key);
                }
            });
        });
        const sortedKeys = Array.from(allKeys).sort((a, b) => parseInt(a) - parseInt(b));
        console.log("RevenueChart Keys:", sortedKeys);
        return sortedKeys;
    };

    const keys = getKeys();

    // Stable color generation based on year digit
    const getYearColor = (year: string) => {
        const yearInt = parseInt(year);
        // Map 2023 -> Index. Simple modulo logic on the year itself guarantees distinct colors for adjacent years
        // and consistent colors for the same year across re-renders.
        return COLORS[yearInt % COLORS.length];
    };

    // Helper to darken/lighten hex color
    const adjustBrightness = (col: string, amt: number) => {
        col = col.replace(/^#/, '');
        if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2];

        let [r, g, b] = col.match(/.{2}/g)!.map(x => parseInt(x, 16));

        r = Math.max(0, Math.min(255, r + amt));
        g = Math.max(0, Math.min(255, g + amt));
        b = Math.max(0, Math.min(255, b + amt));

        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');

        return `#${rHex}${gHex}${bHex}`;
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[500px] flex flex-col items-center justify-center text-gray-400">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 self-start w-full">Evolución de Ingresos</h3>
                <p>No hay datos disponibles</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px] h-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Evolución de Ingresos</h3>
                    <p className="text-sm text-gray-500 mt-1">Comparativa mensual interanual</p>
                </div>
            </div>

            <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        key={keys.join(',')} // FORCE REMOUNT on keys change to ensure stacking order is recalculated strictly
                        data={data}
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                        }}
                    >
                        <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `€${value.toLocaleString()}`}
                            tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip
                            formatter={(value: number, name: string) => [`€${value.toLocaleString()}`, name]}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {/* Generate Bars for each year key found in data */}
                        {keys.map((key) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={key}
                                stackId="a"
                                fill={getYearColor(key)}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                            />
                        ))}

                        {/* Lines for each year */}
                        {keys.map((key) => (
                            <Line
                                key={`line-${key}`}
                                type="monotone"
                                dataKey={key}
                                name={`Tendencia ${key}`}
                                stroke={adjustBrightness(getYearColor(key), -60)} // Darken by 60
                                strokeWidth={3}
                                dot={{ r: 4, fill: adjustBrightness(getYearColor(key), -60), strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                stackId="a"
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
