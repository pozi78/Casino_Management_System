import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { recaudacionApi, type Recaudacion, type RecaudacionMaquina } from '../api/recaudaciones';
import { MoneyInput } from '../components/MoneyInput';
import { formatCurrency, getCurrencyClasses } from '../utils/currency';

export default function RecaudacionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [recaudacion, setRecaudacion] = useState<Recaudacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<number | null>(null);

    useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (recId: number) => {
        try {
            const data = await recaudacionApi.getById(recId);
            // Sort details by machine name
            if (data.detalles) {
                data.detalles.sort((a: RecaudacionMaquina, b: RecaudacionMaquina) =>
                    (a.maquina?.nombre || '').toString().localeCompare((b.maquina?.nombre || '').toString())
                );
            }
            setRecaudacion(data);
        } catch (err) {
            setError("Error al cargar la recaudación");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = useCallback((detailId: number, field: keyof RecaudacionMaquina, value: number) => {
        setRecaudacion(prev => {
            if (!prev || !prev.detalles) return prev;
            return {
                ...prev,
                detalles: prev.detalles.map(d => {
                    if (d.id === detailId) {
                        const updated = { ...d, [field]: value };
                        // Auto-calc rate logic matching backend for display
                        if (field === 'tasa_ajuste') {
                            updated.tasa_final = Number(updated.tasa_calculada) + Number(value);
                        }
                        return updated;
                    }
                    return d;
                })
            };
        });
    }, []);

    const saveCell = async (detailId: number, field: keyof RecaudacionMaquina, value: number) => {
        setSavingId(detailId);
        try {
            await recaudacionApi.updateDetail(detailId, { [field]: value });
        } catch (err) {
            console.error("Failed to save cell", err);
        } finally {
            setSavingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;
    if (error || !recaudacion) return <div className="p-8 text-center text-red-600">{error || "No encontrado"}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/recaudaciones')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Recaudación #{recaudacion.id}
                        {recaudacion.etiqueta && <span className="ml-2 text-gray-500 font-normal">({recaudacion.etiqueta})</span>}
                    </h1>
                    <p className="text-gray-500">
                        {new Date(recaudacion.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(recaudacion.fecha_fin).toLocaleDateString('es-ES')}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {savingId && <span className="text-sm text-gray-500 animate-pulse">Guardando...</span>}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Máquina</th>
                            <th className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-32">Tasa Estimada</th>
                            <th className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-32">Retirada Efectivo</th>
                            <th className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-32">Cajón</th>
                            <th className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-32">Pago Manual</th>
                            <th className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-32 font-bold">Total Bruto</th>
                            <th className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider w-24">Ajuste</th>
                            <th className="px-3 py-3 text-center font-medium text-gray-500 uppercase tracking-wider font-bold">Total Neto</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recaudacion.detalles?.map((detail, idx) => {
                            const retiro = Number(detail.retirada_efectivo) || 0;
                            const cajon = Number(detail.cajon) || 0;
                            const manual = Number(detail.pago_manual) || 0;
                            const ajuste = Number(detail.tasa_ajuste) || 0;
                            const tasaEst = Number(detail.tasa_calculada) || 0;

                            const totalBruto = retiro + cajon - manual;
                            const totalNeto = totalBruto + ajuste;

                            const nextRowIdx = idx + 1;
                            const hasNextRow = recaudacion.detalles && nextRowIdx < recaudacion.detalles.length;

                            return (
                                <tr key={detail.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                                        {detail.maquina?.nombre}
                                        <div className="text-xs text-gray-400">
                                            {detail.maquina?.tipo_maquina?.nombre}
                                            {detail.maquina?.numero_serie ? ` - ${detail.maquina.numero_serie}` : ''}
                                        </div>
                                    </td>

                                    <td className={`px-3 py-2 font-medium ${getCurrencyClasses(tasaEst)}`}>
                                        {formatCurrency(tasaEst)}
                                    </td>

                                    <td className="px-3 py-2">
                                        <MoneyInput
                                            id={`input-${idx}-retirada`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-retirada` : undefined}
                                            value={retiro}
                                            onChange={(val) => handleCellChange(detail.id, 'retirada_efectivo', val)}
                                            onBlur={(val) => saveCell(detail.id, 'retirada_efectivo', val)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <MoneyInput
                                            id={`input-${idx}-cajon`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-cajon` : undefined}
                                            value={cajon}
                                            onChange={(val) => handleCellChange(detail.id, 'cajon', val)}
                                            onBlur={(val) => saveCell(detail.id, 'cajon', val)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <MoneyInput
                                            id={`input-${idx}-manual`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-manual` : undefined}
                                            value={manual}
                                            onChange={(val) => handleCellChange(detail.id, 'pago_manual', val)}
                                            onBlur={(val) => saveCell(detail.id, 'pago_manual', val)}
                                        />
                                    </td>

                                    <td className={`px-3 py-2 font-bold ${getCurrencyClasses(totalBruto)}`}>
                                        {formatCurrency(totalBruto)}
                                    </td>

                                    <td className="px-3 py-2">
                                        <MoneyInput
                                            id={`input-${idx}-ajuste`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-ajuste` : undefined}
                                            value={ajuste}
                                            onChange={(val) => handleCellChange(detail.id, 'tasa_ajuste', val)}
                                            onBlur={(val) => saveCell(detail.id, 'tasa_ajuste', val)}
                                        />
                                    </td>

                                    <td className={`px-3 py-2 font-bold ${getCurrencyClasses(totalNeto)}`}>
                                        {formatCurrency(totalNeto)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
