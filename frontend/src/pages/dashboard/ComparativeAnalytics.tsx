import { useState, useCallback, memo, useMemo } from 'react';
import {
    PieChart, Pie, Cell, LabelList,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import { PieChart as PieIcon, BarChart2, Layout, Target, Info } from 'lucide-react';

interface ComparativeData {
    name: string;
    drop: number;
    pm: number;
    win: number;
    neto: number;
    tasas: number;
    depositos: number;
    otros_conceptos: number;
    machines: number;
    avg_per_machine: number;
}

interface Props {
    data: {
        summary: ComparativeData[];
        monthly: { [key: string]: { name: string, value: number }[] };
    };
    isLoading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

const METRICS_CONFIG = [
    { key: 'drop', label: 'DROP', color: '#3b82f6', formula: 'Total recaudado: Retiradas + Cajón.' },
    { key: 'pm', label: 'P. MANUALES', color: '#f59e0b', formula: 'Total de pagos manuales realizados a clientes.' },
    { key: 'win', label: 'WIN', color: '#047857', formula: 'Resultado bruto: (Retirada + Cajón - P. Manual + Ajustes) * % Salón.' },
    { key: 'tasas', label: 'TASAS', color: '#ef4444', formula: 'Tasas Globales de la liquidación.' },
    { key: 'depositos', label: 'DEPÓSITOS', color: '#f97316', formula: 'Total de depósitos realizados en el periodo.' },
    { key: 'otros_conceptos', label: 'OTROS', color: '#6366f1', formula: 'Total de otros conceptos (ajustes).' },
    { key: 'neto', label: 'NETO', color: '#10b981', formula: 'Beneficio Neto final para el salón.' },
    { key: 'machines', label: 'PUESTOS', color: '#6b7280', formula: 'Número total de puestos/máquinas.' },
    { key: 'avg_per_machine', label: 'EFICIENCIA', color: '#8b5cf6', formula: 'Rentabilidad neta media por puesto.' }
];

type ChartType = 'pie' | 'bar' | 'radar' | 'scatter';


interface CustomTickProps {
    payload: { value: string };
    x: number;
    y: number;
    cx: number;
    cy: number;
    setAxisTooltip: (val: { x: number, y: number, text: string } | null) => void;
    [key: string]: any;
}

const CustomRadarTick = memo(({ payload, x, y, cx, cy, setAxisTooltip, verticalAnchor, ...rest }: CustomTickProps) => {
    return (
        <g
            onMouseEnter={() => {
                const metric = METRICS_CONFIG.find(m => m.label === payload.value);
                if (metric) {
                    setAxisTooltip({
                        x: x > cx ? x + 10 : x - 210,
                        y: y - 10,
                        text: metric.formula
                    });
                }
            }}
            onMouseLeave={() => setAxisTooltip(null)}
            className="cursor-help"
        >
            <text
                {...rest}
                x={x}
                y={y}
                pointerEvents="none"
            >
                <tspan dy={4}>{payload.value}</tspan>
                <tspan fill="#9ca3af" fontSize={10} dx={4}>ⓘ</tspan>
            </text>
            {/* Expanded hit area */}
            <rect
                x={x > cx ? x - 10 : x - 90}
                y={y - 15}
                width={100}
                height={30}
                fill="rgba(0,0,0,0)"
                cursor="help"
            />
        </g>
    );
});

const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' €';
};

const getMonthName = (m: string) => {
    const names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return names[parseInt(m) - 1] || m;
};

const getValueColor = (value: number) => {
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-900';
};

const ComparativeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg">
                {label && <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 border-b pb-1">{label}</p>}
                <div className="space-y-1">
                    {payload.map((item: any, index: number) => {
                        // Extract raw value if available (for Radar)
                        const rawValue = item.payload && item.payload[`${item.name}_raw`] !== undefined
                            ? item.payload[`${item.name}_raw`]
                            : item.value;

                        const isPuestos = label === 'PUESTOS';
                        const formattedValue = isPuestos ? Math.round(rawValue).toLocaleString('es-ES') : formatCurrency(rawValue);

                        return (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-medium" style={{ color: item.color || '#4b5563' }}>
                                    {item.name}:
                                </span>
                                <span className="text-[10px] font-bold" style={{ color: item.color || (isPuestos ? '#111827' : rawValue > 0 ? '#059669' : rawValue < 0 ? '#dc2626' : '#111827') }}>
                                    {formattedValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Add metric explanation if in Radar view */}
                {label && (
                    <div className="mt-2 pt-2 border-t border-gray-100 italic text-[9px] text-gray-400 max-w-[200px]">
                        {label === 'DROP' && 'Total recaudado: Retiradas + Cajón.'}
                        {label === 'P. MANUALES' && 'Total de pagos manuales realizados a clientes.'}
                        {label === 'WIN' && 'Resultado bruto: (Retirada + Cajón - P. Manual + Ajustes) * % Salón.'}
                        {label === 'TASAS' && 'Tasas Globales de la liquidación.'}
                        {label === 'DEPÓSITOS' && 'Total de depósitos realizados en el periodo.'}
                        {label === 'OTROS' && 'Total de otros conceptos (ajustes).'}
                        {label === 'NETO' && 'Beneficio Neto final para el salón.'}
                        {label === 'PUESTOS' && 'Número total de puestos/máquinas.'}
                        {label === 'EFICIENCIA' && 'Rentabilidad neta media por puesto.'}
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const MemoizedRadarChartSection = memo(({ radarData, summary, setAxisTooltip }: { radarData: any[], summary: ComparativeData[], setAxisTooltip: (val: any) => void }) => {
    const renderRadarTick = useCallback((props: any) => {
        return <CustomRadarTick {...props} setAxisTooltip={setAxisTooltip} />;
    }, [setAxisTooltip]);

    return (
        <div className="flex-1 min-h-[400px] w-full relative">
            <div className="absolute inset-0">
                <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={renderRadarTick}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        {summary.slice(0, 4).map((d, i) => (
                            <Radar
                                key={d.name}
                                name={d.name}
                                dataKey={d.name}
                                stroke={COLORS[i % COLORS.length]}
                                fill={COLORS[i % COLORS.length]}
                                fillOpacity={0.3}
                            />
                        ))}
                        <Tooltip content={<ComparativeTooltip />} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
});

export default function ComparativeAnalytics({ data, isLoading }: Props) {
    const [chartType, setChartType] = useState<ChartType>('pie');
    const [axisTooltip, setAxisTooltip] = useState<{ x: number, y: number, text: string } | null>(null);

    // Stable handler for tooltip updates
    const handleSetAxisTooltip = useCallback((val: { x: number, y: number, text: string } | null) => {
        setAxisTooltip(val);
    }, []);

    // Normalization for Radar Chart
    // This hook must be called unconditionally at the top level
    const radarData = useMemo(() => {
        const summary = data?.summary;
        if (!summary || summary.length === 0) return [];

        const metrics = [
            { key: 'drop', label: 'DROP' },
            { key: 'pm', label: 'P. MANUALES' },
            { key: 'win', label: 'WIN' },
            { key: 'tasas', label: 'TASAS' },
            { key: 'depositos', label: 'DEPÓSITOS' },
            { key: 'otros_conceptos', label: 'OTROS' },
            { key: 'neto', label: 'NETO' },
            { key: 'machines', label: 'PUESTOS' },
            { key: 'avg_per_machine', label: 'EFICIENCIA' }
        ];

        // Find maximums for each dimension to normalize (0-100 scale)
        const maxes = {
            drop: Math.max(...summary.map(d => Math.abs(d.drop))) || 1,
            pm: Math.max(...summary.map(d => Math.abs(d.pm))) || 1,
            win: Math.max(...summary.map(d => Math.abs(d.win))) || 1,
            tasas: Math.max(...summary.map(d => Math.abs(d.tasas))) || 1,
            depositos: Math.max(...summary.map(d => Math.abs(d.depositos))) || 1,
            otros_conceptos: Math.max(...summary.map(d => Math.abs(d.otros_conceptos))) || 1,
            neto: Math.max(...summary.map(d => Math.abs(d.neto))) || 1,
            machines: Math.max(...summary.map(d => d.machines)) || 1,
            avg_per_machine: Math.max(...summary.map(d => Math.abs(d.avg_per_machine))) || 1
        };

        return metrics.map(m => {
            const row: any = { subject: m.label };
            summary.slice(0, 4).forEach(s => {
                let val = s[m.key as keyof ComparativeData] as number;
                if (m.key === 'depositos') val = Math.abs(val);

                const max = (maxes as any)[m.key];
                // For the Radar polygon, we clamp negative values to 0 
                row[s.name] = (Math.max(0, val) / max) * 100;
                row[`${s.name}_raw`] = val;
            });
            return row;
        });
    }, [data?.summary]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[500px] flex flex-col items-center justify-center text-gray-400">
                <p>Cargando comparativas...</p>
            </div>
        );
    }

    if (!data || !data.summary || data.summary.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[500px] flex flex-col items-center justify-center text-gray-400">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 self-start w-full">Analítica Comparativa</h3>
                <p>No hay datos disponibles para comparar</p>
            </div>
        );
    }

    const { summary, monthly } = data;



    const renderChart = () => {
        switch (chartType) {
            case 'pie':
                return (
                    <div className="flex flex-col lg:flex-row h-full gap-8">
                        {/* Summary Column */}
                        <div className="lg:w-1/3 flex flex-col">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 px-2">Distribución Total</h4>
                            <div className="h-[300px] w-full relative">
                                <div className="absolute inset-0">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                                        <PieChart>
                                            <Pie
                                                data={summary.map((s: ComparativeData) => ({ ...s, sliceValue: Math.max(0, s.neto) }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="sliceValue"
                                                nameKey="name"
                                            >
                                                {summary.map((_entry: ComparativeData, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                                <LabelList
                                                    dataKey="neto"
                                                    position="outside"
                                                    content={(props: any) => {
                                                        const { x, y, value, cx } = props;
                                                        const isRight = x > cx;
                                                        return (
                                                            <text
                                                                x={x}
                                                                y={y}
                                                                dy={-4}
                                                                textAnchor={isRight ? "start" : "end"}
                                                                className={`text-[10px] font-bold`}
                                                                fill={value > 0 ? "#059669" : value < 0 ? "#dc2626" : "#111827"}
                                                            >
                                                                {formatCurrency(value)}
                                                            </text>
                                                        );
                                                    }}
                                                />
                                            </Pie>
                                            <Tooltip content={<ComparativeTooltip />} />
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Breakdown Column */}
                        {Object.keys(monthly).length > 0 && (
                            <div className="lg:w-2/3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 px-2">Distribución Mensual</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {Object.keys(monthly).sort((a, b) => parseInt(a) - parseInt(b)).map(monthKey => (
                                        <div key={monthKey} className="flex flex-col items-center bg-gray-50/50 rounded-xl p-2 border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1">{getMonthName(monthKey)}</span>
                                            <div className="h-24 w-full relative">
                                                <div className="absolute inset-0">
                                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={monthly[monthKey].map((v: { name: string, value: number }) => ({ ...v, sliceValue: Math.max(0, v.value) }))}
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius={35}
                                                                dataKey="sliceValue"
                                                                stroke="none"
                                                            >
                                                                {monthly[monthKey].map((entry: { name: string, value: number }, index: number) => {
                                                                    // Use same color as summary for consistency
                                                                    const summaryIndex = summary.findIndex(s => s.name === entry.name);
                                                                    return <Cell key={`m-cell-${index}`} fill={COLORS[summaryIndex === -1 ? index % COLORS.length : summaryIndex % COLORS.length]} />;
                                                                })}
                                                            </Pie>
                                                            <Tooltip content={<ComparativeTooltip />} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'bar':
                return (
                    <div className="flex flex-col h-full uppercase-titles">
                        {/* Custom Legend for Bar Chart */}
                        <div className="flex flex-wrap justify-end gap-x-6 gap-y-2 mb-4 px-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                            {METRICS_CONFIG.slice(0, 7).map((item) => (
                                <div key={item.key} className="flex items-center gap-2 group relative">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</span>
                                        <span className="text-[11px] font-extrabold" style={{ color: item.color }}>
                                            {formatCurrency(Math.abs(summary.reduce((acc, s) => acc + (Number(s[item.key as keyof ComparativeData]) || 0), 0)))}
                                        </span>
                                    </div>
                                    <Info size={12} className="text-gray-300 hover:text-gray-400 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-normal leading-tight">
                                        {item.formula}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 min-h-[400px] w-full relative">
                            <div className="absolute inset-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                                    <BarChart
                                        data={summary.map(s => ({
                                            ...s,
                                            depositos: Math.abs(s.depositos)
                                        }))}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        barGap={0}
                                        barCategoryGap="5%"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k €`;
                                                return `${v.toLocaleString('es-ES')} €`;
                                            }}
                                            tick={{ fill: '#6b7280' }}
                                        />
                                        <Tooltip content={<ComparativeTooltip />} />
                                        <Bar dataKey="drop" name="DROP" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                            <LabelList dataKey="drop" position="top" formatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k€`;
                                                return `${Math.round(v).toLocaleString('es-ES')}€`;
                                            }} style={{ fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="pm" name="Pagos Manuales" fill="#f59e0b" radius={[4, 4, 4, 4]}>
                                            <LabelList dataKey="pm" position="top" formatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k€`;
                                                return `${Math.round(v).toLocaleString('es-ES')}€`;
                                            }} style={{ fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="win" name="WIN" fill="#047857" radius={[4, 4, 4, 4]}>
                                            <LabelList dataKey="win" position="top" formatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k€`;
                                                return `${Math.round(v).toLocaleString('es-ES')}€`;
                                            }} style={{ fill: '#047857', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="tasas" name="TASAS" fill="#ef4444" radius={[4, 4, 4, 4]}>
                                            <LabelList dataKey="tasas" position="top" formatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k€`;
                                                return `${Math.round(v).toLocaleString('es-ES')}€`;
                                            }} style={{ fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="depositos" name="Depósitos" fill="#f97316" radius={[4, 4, 4, 4]}>
                                            <LabelList dataKey="depositos" position="top" formatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k€`;
                                                return `${Math.round(v).toLocaleString('es-ES')}€`;
                                            }} style={{ fill: '#f97316', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="otros_conceptos" name="Otros" fill="#6366f1" radius={[4, 4, 4, 4]}>
                                            <LabelList dataKey="otros_conceptos" position="top" formatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k€`;
                                                return `${Math.round(v).toLocaleString('es-ES')}€`;
                                            }} style={{ fill: '#6366f1', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                        <Bar dataKey="neto" name="NETO" fill="#10b981" radius={[4, 4, 4, 4]}>
                                            <LabelList dataKey="neto" position="top" formatter={(v: number) => {
                                                if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k€`;
                                                return `${Math.round(v).toLocaleString('es-ES')}€`;
                                            }} style={{ fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            case 'radar':
                return (
                    <div className="flex flex-col h-full w-full uppercase-titles relative">
                        {axisTooltip && (
                            <div
                                className="absolute z-50 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl pointer-events-none normal-case font-normal leading-tight max-w-[200px]"
                                style={{ left: axisTooltip.x, top: axisTooltip.y }}
                            >
                                {axisTooltip.text}
                            </div>
                        )}
                        <div className="flex flex-wrap justify-end gap-x-6 gap-y-2 mb-4 px-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                            {METRICS_CONFIG.map((item) => (
                                <div key={item.key} className="flex items-center gap-2 group relative">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{item.label}</span>
                                        <span className="text-[11px] font-extrabold" style={{ color: item.color }}>
                                            {item.key === 'machines'
                                                ? Math.round(summary.reduce((acc, s) => acc + (Number(s[item.key as keyof ComparativeData]) || 0), 0)).toLocaleString('es-ES')
                                                : formatCurrency(Math.abs(summary.reduce((acc, s) => acc + (Number(s[item.key as keyof ComparativeData]) || 0), 0)))}
                                        </span>
                                    </div>
                                    <Info size={12} className="text-gray-300 hover:text-gray-400 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-normal leading-tight">
                                        {item.formula}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <MemoizedRadarChartSection
                            radarData={radarData}
                            summary={summary}
                            setAxisTooltip={handleSetAxisTooltip}
                        />
                    </div>
                );
            case 'scatter':
                return (
                    <div className="h-[400px] w-full relative">
                        <div className="absolute inset-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={300}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis type="number" dataKey="machines" name="Puestos" unit=" puestos" axisLine={false} tickLine={false} label={{ value: 'Nº Puestos', position: 'insideBottom', offset: -10 }} />
                                    <YAxis
                                        type="number"
                                        dataKey="neto"
                                        name="NETO"
                                        unit=" €"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v: number) => `${v.toLocaleString('es-ES')} €`}
                                        label={{ value: 'NETO', angle: -90, position: 'insideLeft' }}
                                    />
                                    <ZAxis type="number" dataKey="avg_per_machine" range={[100, 1000]} name="Eficiencia" />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ComparativeTooltip />} />
                                    <Legend />
                                    {summary.map((entry: ComparativeData, index: number) => (
                                        <Scatter
                                            key={entry.name}
                                            name={entry.name}
                                            data={[entry]}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[500px] h-auto flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Analítica Comparativa</h3>
                    <p className="text-sm text-gray-500 mt-1">Comparativa de rendimiento entre salones</p>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 self-start">
                    <button
                        onClick={() => setChartType('pie')}
                        className={`p-2 rounded-lg transition-all ${chartType === 'pie' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Distribución (Pie)"
                    >
                        <PieIcon size={20} />
                    </button>
                    <button
                        onClick={() => setChartType('bar')}
                        className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Barras (Comparativa)"
                    >
                        <BarChart2 size={20} />
                    </button>
                    <button
                        onClick={() => setChartType('radar')}
                        className={`p-2 rounded-lg transition-all ${chartType === 'radar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Radar (Perfil)"
                    >
                        <Layout size={20} />
                    </button>
                    <button
                        onClick={() => setChartType('scatter')}
                        className={`p-2 rounded-lg transition-all ${chartType === 'scatter' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Dispersión (Eficiencia)"
                    >
                        <Target size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-[350px] w-full">
                {renderChart()}
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 border-t border-gray-50 pt-6">
                <div className="text-center group relative border-r border-gray-50">
                    <div className="flex items-center justify-center gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Salón Top Ingresos</p>
                        <div className="relative">
                            <Info size={12} className="text-gray-300 hover:text-gray-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-normal leading-tight">
                                Salón con el mayor volumen de recaudación bruta (Ingresos) en el periodo y filtros seleccionados.
                            </div>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mt-1 truncate px-2">{summary[0]?.name || '-'}</p>
                </div>

                <div className="text-center group relative border-r border-gray-50">
                    <div className="flex items-center justify-center gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Salón Más Eficiente</p>
                        <div className="relative">
                            <Info size={12} className="text-gray-300 hover:text-gray-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-normal leading-tight">
                                Salón con la mayor recaudación neta media por puesto (Beneficio Neto dividido entre el número de puestos).
                            </div>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 mt-1 truncate px-2">
                        {[...summary].sort((a: ComparativeData, b: ComparativeData) => b.avg_per_machine - a.avg_per_machine)[0]?.name || '-'}
                    </p>
                </div>

                <div className="text-center group relative border-r border-gray-50">
                    <div className="flex items-center justify-center gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Media de Puestos</p>
                        <div className="relative">
                            <Info size={12} className="text-gray-300 hover:text-gray-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-normal leading-tight">
                                Promedio aritmético de puestos por salón entre todos los salones incluidos en la comparativa actual.
                            </div>
                        </div>
                    </div>
                    <p className={`text-sm font-bold mt-1 ${getValueColor(Math.round(summary.reduce((acc, d) => acc + d.machines, 0) / summary.length) || 0)}`}>
                        {Math.round(summary.reduce((acc, d) => acc + d.machines, 0) / summary.length) || 0}
                    </p>
                </div>

                <div className="text-center group relative border-r border-gray-50">
                    <div className="flex items-center justify-center gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">WIN Total</p>
                        <div className="relative">
                            <Info size={12} className="text-gray-300 hover:text-gray-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-normal leading-tight">
                                Suma del Bruto (WIN) de todos los salones en el periodo seleccionado.
                            </div>
                        </div>
                    </div>
                    <p className={`text-sm font-bold mt-1 ${getValueColor(summary.reduce((acc, d) => acc + d.win, 0))}`}>
                        {formatCurrency(summary.reduce((acc, d) => acc + d.win, 0))}
                    </p>
                </div>

                <div className="text-center group relative">
                    <div className="flex items-center justify-center gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">NETO Total</p>
                        <div className="relative">
                            <Info size={12} className="text-gray-300 hover:text-gray-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case font-normal leading-tight">
                                Suma del Neto de todos los salones (incluyendo depósitos, otros conceptos y tasas globales).
                            </div>
                        </div>
                    </div>
                    <p className={`text-sm font-bold mt-1 ${getValueColor(summary.reduce((acc, d) => acc + d.neto, 0))}`}>
                        {formatCurrency(summary.reduce((acc, d) => acc + d.neto, 0))}
                    </p>
                </div>
            </div>
        </div>
    );
}
