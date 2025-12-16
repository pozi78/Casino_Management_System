import { Trophy } from 'lucide-react';

interface DataPoint {
    name: string;
    bruto: number;
    tasa: number;
    neto: number;
}

interface Props {
    machines: DataPoint[];
}

export default function TopMachinesTable({ machines = [] }: Props) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Máquina</h3>
                <Trophy className="text-amber-500 w-5 h-5" />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left border-b border-gray-100">
                            <th className="pb-3 font-medium text-gray-500 text-sm">Máquina</th>
                            <th className="pb-3 font-medium text-gray-500 text-sm text-right">Bruto</th>
                            <th className="pb-3 font-medium text-gray-500 text-sm text-right">Tasa</th>
                            <th className="pb-3 font-medium text-gray-900 text-sm text-right">Neto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {machines.map((item, index) => (
                            <tr key={index} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-3 text-sm text-gray-900 group-hover:text-amber-600 transition-colors">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs mr-2 font-medium">
                                        {index + 1}
                                    </span>
                                    {item.name}
                                </td>
                                <td className="py-3 text-sm text-gray-500 text-right">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.bruto)}
                                </td>
                                <td className="py-3 text-sm text-red-500 text-right">
                                    -{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.tasa)}
                                </td>
                                <td className="py-3 text-sm text-gray-900 text-right font-bold">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.neto)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
