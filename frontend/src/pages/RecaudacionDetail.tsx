import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
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

    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    // Measure header height for sticky table header
    useLayoutEffect(() => {
        const updateHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        // Add a small delay to ensure rendering is complete
        const timeoutId = setTimeout(updateHeight, 100);

        return () => {
            window.removeEventListener('resize', updateHeight);
            clearTimeout(timeoutId);
        };
    }, [recaudacion]);


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

    const handleGlobalUpdate = async (field: keyof Recaudacion, value: string | number) => {
        if (!recaudacion) return;

        // Optimistic update
        const numValue = Number(value);
        setRecaudacion(prev => prev ? { ...prev, [field]: numValue } : null);

        try {
            await recaudacionApi.update(recaudacion.id, {
                [field]: numValue
            });
        } catch (err) {
            console.error('Error updating global field:', err);
            // Revert? For now, we trust. 
            // In a production app, we should revert on error or show toast.
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;
    if (error || !recaudacion) return <div className="p-8 text-center text-red-600">{error || "No encontrado"}</div>;

    // Date Helpers
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase();
    };

    const getDaysDifference = (start: string, end: string) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Calculate Totals for Summary and Header
    const totalRecaudacion = recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0), 0) || 0;
    const pagosManuales = recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.pago_manual) || 0), 0) || 0;
    const totalAjustes = recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_ajuste) || 0), 0) || 0;
    const totalTasas = Number(recaudacion.total_tasas) || 0;
    const tasasEstimadas = recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_calculada) || 0), 0) || 0;
    const tasaDiff = totalTasas - tasasEstimadas;

    const subtotal = totalRecaudacion - pagosManuales + totalAjustes - totalTasas;
    const depositos = Number(recaudacion.depositos) || 0;
    const otrosConceptos = Number(recaudacion.otros_conceptos) || 0;

    const totalFinal = subtotal + depositos + otrosConceptos;
    const splitTotal = totalFinal / 2;

    const getColorClass = (val: number) => val > 0 ? 'text-emerald-600' : (val < 0 ? 'text-red-600' : 'text-gray-900');
    const getFadedColorClass = (val: number) => val > 0 ? 'text-emerald-400' : (val < 0 ? 'text-red-400' : 'text-gray-400');


    return (
        <div className="space-y-6">
            <div ref={headerRef} className="sticky top-0 z-50 bg-gray-100 py-4 border-b border-gray-200 -mx-8 -mt-8 px-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/recaudaciones')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-gray-900 uppercase">
                            RECAUDACIÓN DEL {formatDate(recaudacion.fecha_inicio)} AL {formatDate(recaudacion.fecha_fin)}
                            {recaudacion.etiqueta && <span className="ml-2 text-gray-500 font-normal normal-case">({recaudacion.etiqueta})</span>}
                        </h1>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-gray-500 font-medium uppercase">
                                {getDaysDifference(recaudacion.fecha_inicio, recaudacion.fecha_fin)} DÍAS
                            </p>
                            <div className="flex gap-4">
                                <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">{recaudacion.salon?.nombre || 'SALON'} (50%):</span>
                                    <span className={`text-sm font-bold ${getColorClass(splitTotal)}`}>{formatCurrency(splitTotal)}</span>
                                </div>
                                <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">UORSA (50%):</span>
                                    <span className={`text-sm font-bold ${getColorClass(splitTotal)}`}>{formatCurrency(splitTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {savingId && <span className="text-sm text-gray-500 animate-pulse">Guardando...</span>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 md:overflow-visible overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider shadow-sm transition-all">MÁQUINA</th>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider shadow-sm transition-all">RETIRADA EFECTIVO</th>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider shadow-sm transition-all">CAJÓN</th>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider shadow-sm transition-all">PAGO MANUAL</th>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider shadow-sm transition-all">AJUSTE</th>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider font-bold shadow-sm transition-all">TOTAL BRUTO</th>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider shadow-sm transition-all">TASA ESTIMADA</th>
                            <th style={{ top: headerHeight }} className="sticky z-40 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider font-bold shadow-sm transition-all">TOTAL NETO</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recaudacion.detalles?.map((detail, idx) => {
                            const retiro = Number(detail.retirada_efectivo) || 0;
                            const cajon = Number(detail.cajon) || 0;
                            const manual = Number(detail.pago_manual) || 0;
                            const ajuste = Number(detail.tasa_ajuste) || 0;
                            const tasaEst = Number(detail.tasa_calculada) || 0;

                            const totalBruto = retiro + cajon - manual + ajuste;
                            const totalNeto = totalBruto - tasaEst;

                            const nextRowIdx = idx + 1;
                            const hasNextRow = recaudacion.detalles && nextRowIdx < recaudacion.detalles.length;

                            // Color Helpers as per user request
                            const getPositiveClass = (val: number) => val > 0 ? 'text-emerald-600 font-bold' : (val < 0 ? 'text-red-600 font-bold' : 'text-gray-900');
                            const redClass = "text-red-600 font-bold";
                            const greenClass = "text-emerald-600 font-bold";

                            return (
                                <tr key={detail.id} className="hover:bg-gray-50">
                                    <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 uppercase">
                                        {detail.maquina?.nombre}
                                        <div className="text-xs text-gray-400">
                                            {detail.maquina?.tipo_maquina?.nombre}
                                            {detail.maquina?.numero_serie ? ` - ${detail.maquina.numero_serie}` : ''}
                                        </div>
                                    </td>

                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input-${idx}-retirada`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-retirada` : undefined}
                                            value={retiro}
                                            onChange={(val) => handleCellChange(detail.id, 'retirada_efectivo', val)}
                                            onBlur={(val) => saveCell(detail.id, 'retirada_efectivo', val)}
                                            readOnly={false}
                                            className={greenClass}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input-${idx}-cajon`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-cajon` : undefined}
                                            value={cajon}
                                            onChange={(val) => handleCellChange(detail.id, 'cajon', val)}
                                            onBlur={(val) => saveCell(detail.id, 'cajon', val)}
                                            readOnly={false}
                                            className={greenClass}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input-${idx}-manual`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-manual` : undefined}
                                            value={manual}
                                            onChange={(val) => handleCellChange(detail.id, 'pago_manual', val)}
                                            onBlur={(val) => saveCell(detail.id, 'pago_manual', val)}
                                            readOnly={false}
                                            className={manual > 0 ? redClass : 'text-gray-900'}
                                        />
                                    </td>

                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input-${idx}-ajuste`}
                                            nextFocusId={hasNextRow ? `input-${nextRowIdx}-ajuste` : undefined}
                                            value={ajuste}
                                            onChange={(val) => handleCellChange(detail.id, 'tasa_ajuste', val)}
                                            onBlur={(val) => saveCell(detail.id, 'tasa_ajuste', val)}
                                            readOnly={false}
                                            className={getPositiveClass(ajuste)}
                                        />
                                    </td>

                                    <td className={`px-2 py-1 text-right ${getPositiveClass(totalBruto)}`}>
                                        {formatCurrency(totalBruto)}
                                    </td>

                                    <td className={`px-2 py-1 text-right ${redClass}`}>
                                        {formatCurrency(tasaEst)}
                                    </td>

                                    <td className={`px-2 py-1 text-right ${getPositiveClass(totalNeto)}`}>
                                        {formatCurrency(totalNeto)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <tr>
                            <td className="px-3 py-3 text-gray-900 uppercase">TOTAL</td>

                            {/* Retirada (Green) */}
                            <td className="px-3 py-3 text-right text-emerald-600">
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.retirada_efectivo) || 0), 0))}
                            </td>

                            {/* Cajon (Green) */}
                            <td className="px-3 py-3 text-right text-emerald-600">
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.cajon) || 0), 0))}
                            </td>

                            {/* Manual (Red) */}
                            <td className="px-3 py-3 text-right text-red-600">
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.pago_manual) || 0), 0))}
                            </td>

                            {/* Ajuste (Conditional) */}
                            <td className={`px-3 py-3 text-right ${(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_ajuste) || 0), 0) || 0) > 0 ? 'text-emerald-600' : (recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_ajuste) || 0), 0) || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_ajuste) || 0), 0))}
                            </td>

                            {/* Bruto (Conditional) */}
                            <td className={`px-3 py-3 text-right ${(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0)), 0) || 0) > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0)), 0))}
                            </td>

                            {/* Tasa (Red) */}
                            <td className="px-3 py-3 text-right text-red-600">
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_calculada) || 0), 0))}
                            </td>

                            {/* Neto (Conditional) */}
                            <td className={`px-3 py-3 text-right ${(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0) - (Number(d.tasa_calculada) || 0)), 0) || 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0) - (Number(d.tasa_calculada) || 0)), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Summary Section - Right Aligned Stack with Border */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-end space-y-2 w-full md:w-1/2 lg:w-1/3 ml-auto">
                {(() => {
                    return (
                        <>
                            {/* 1. Total Recaudación */}
                            <div className="flex items-center justify-end w-full">
                                <span className="text-gray-600 font-medium mr-4 uppercase">TOTAL RECAUDACIÓN:</span>
                                <span className={`text-xl font-bold w-32 text-right ${getColorClass(totalRecaudacion)}`}>
                                    {formatCurrency(totalRecaudacion)}
                                </span>
                            </div>

                            {/* 2. Pagos Manuales */}
                            <div className="flex items-center justify-end w-full">
                                <span className="text-gray-600 font-medium mr-4 uppercase">PAGOS MANUALES:</span>
                                <span className={`text-xl font-bold w-32 text-right ${getColorClass(-pagosManuales)}`}>
                                    {formatCurrency(pagosManuales)}
                                </span>
                            </div>

                            {/* 3. Ajustes */}
                            <div className="flex items-center justify-end w-full">
                                <span className="text-gray-600 font-medium mr-4 uppercase">AJUSTES:</span>
                                <span className={`text-xl font-bold w-32 text-right ${getColorClass(totalAjustes)}`}>
                                    {formatCurrency(totalAjustes)}
                                </span>
                            </div>

                            {/* 4. Tasas (Editable) */}
                            <div className="flex items-center justify-end w-full">
                                <div className="flex flex-col items-end mr-4">
                                    <span className="text-gray-600 font-medium uppercase">TASAS:</span>
                                    <span className={`text-xs ${getFadedColorClass(tasaDiff)}`}>
                                        (DIF: {formatCurrency(tasaDiff)})
                                    </span>
                                </div>
                                <div className="w-32">
                                    <MoneyInput
                                        value={totalTasas}
                                        onChange={(val) => handleGlobalUpdate('total_tasas', val)}
                                        readOnly={false}
                                        className={`font-bold ${getColorClass(totalTasas)}`}
                                    />
                                </div>
                            </div>

                            {/* 5. Subtotal (Calculated) */}
                            <div className="flex items-center justify-end w-full border-t border-gray-100 pt-2">
                                <span className="text-gray-800 font-bold mr-4 uppercase">SUBTOTAL:</span>
                                <span className={`text-xl font-bold w-32 text-right ${getColorClass(subtotal)}`}>
                                    {formatCurrency(subtotal)}
                                </span>
                            </div>

                            {/* 6. Depósitos (Editable) */}
                            <div className="flex items-center justify-end w-full">
                                <span className="text-gray-600 font-medium mr-4 uppercase">DEPÓSITOS:</span>
                                <div className="w-32">
                                    <MoneyInput
                                        value={depositos}
                                        onChange={(val) => handleGlobalUpdate('depositos', val)}
                                        readOnly={false}
                                        className={`font-bold ${getColorClass(depositos)}`}
                                    />
                                </div>
                            </div>

                            {/* 7. Otros Conceptos (Editable) */}
                            <div className="flex items-center justify-end w-full">
                                <span className="text-gray-600 font-medium mr-4 uppercase">OTROS CONCEPTOS:</span>
                                <div className="w-32">
                                    <MoneyInput
                                        value={otrosConceptos}
                                        onChange={(val) => handleGlobalUpdate('otros_conceptos', val)}
                                        readOnly={false}
                                        className={`font-bold ${getColorClass(otrosConceptos)}`}
                                    />
                                </div>
                            </div>

                            {/* 8. TOTAL FINAL */}
                            <div className="flex items-center justify-end w-full border-t-2 border-gray-300 pt-2 mt-2 whitespace-nowrap">
                                <span className="text-gray-900 font-black text-lg mr-4 uppercase">TOTAL:</span>
                                <span className={`text-2xl font-black text-right ${getColorClass(totalFinal)}`}>
                                    {formatCurrency(totalFinal)}
                                </span>
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
