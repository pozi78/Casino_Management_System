import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, Upload, FileSpreadsheet, Paperclip, X, Download, Info, Loader2, Check, RefreshCw } from 'lucide-react';
import { recaudacionApi, type Recaudacion, type RecaudacionMaquina, type RecaudacionFichero } from '../api/recaudaciones';
import { MoneyInput } from '../components/MoneyInput';
import { formatCurrency } from '../utils/currency';
import axios from '../api/axios'; // Import axios for direct call

export default function RecaudacionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [recaudacion, setRecaudacion] = useState<Recaudacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Import State
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [analyzingFileId, setAnalyzingFileId] = useState<number | null>(null); // Track file being re-analyzed
    const [analysisResults, setAnalysisResults] = useState<{
        mappings: { excel_name: string; mapped_puesto_id: number | null, is_ignored: boolean }[];
        puestos: { id: number; name: string }[];
    } | null>(null);
    const [userMappings, setUserMappings] = useState<Record<string, number | null>>({});

    // Import Modal State
    // Initialize mappings from analysis results
    useEffect(() => {
        if (analysisResults?.mappings) {
            const initialMap: Record<string, number | null> = {};
            analysisResults.mappings.forEach(m => {
                if (m.is_ignored) initialMap[m.excel_name] = -1;
                else if (m.mapped_puesto_id) initialMap[m.excel_name] = m.mapped_puesto_id;
            });
            setUserMappings(initialMap);
        }
    }, [analysisResults]);

    // Computed Lists
    const pendingMappings = analysisResults?.mappings.filter(m => {
        const currentVal = userMappings[m.excel_name];
        // Pending if not in userMappings explicitly (undefined) AND not ignored in DB (though DB ignore would be in userMappings via Effect)
        // Actually, pure UI state:
        return currentVal === undefined || currentVal === null;
    }) || [];

    const ignoredMappings = analysisResults?.mappings.filter(m => userMappings[m.excel_name] === -1) || [];

    // ...




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
                // Sort details by machine name then puesto
                if (data.detalles) {
                    data.detalles.sort((a: RecaudacionMaquina, b: RecaudacionMaquina) => {
                        const nameA = (a.maquina?.nombre || '').toString();
                        const nameB = (b.maquina?.nombre || '').toString();
                        const nameComp = nameA.localeCompare(nameB);
                        if (nameComp !== 0) return nameComp;
                        return (a.puesto?.numero_puesto || 0) - (b.puesto?.numero_puesto || 0);
                    });
                }
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
    // Date Helpers
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).toUpperCase();
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

    // Documents Handlers
    // Documents Handlers

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !recaudacion) return;

        setIsUploading(true);
        setUploadError(null);
        try {
            await recaudacionApi.uploadFile(recaudacion.id, e.target.files[0]);
            fetchData(recaudacion.id);
        } catch (err) {
            console.error(err);
            setUploadError("Error al subir fichero");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleFileDelete = async (fileId: number) => {
        if (!recaudacion || !confirm('¿Estás seguro de eliminar este fichero?')) return;
        try {
            await recaudacionApi.deleteFile(recaudacion.id, fileId);
            fetchData(recaudacion.id);
        } catch (err) {
            console.error(err);
            setUploadError("Error al eliminar fichero");
        }
    };

    const handleAnalyzeFile = async (fileId: number) => {
        if (!recaudacion) return;
        setLoading(true);
        try {
            setAnalyzingFileId(fileId);
            setImportFile(null);
            const results = await recaudacionApi.analyzeFile(recaudacion.id, fileId);
            setAnalysisResults(results);
            setImportModalOpen(true);
        } catch (err) {
            console.error(err);
            alert("Error al analizar el archivo.");
            setAnalyzingFileId(null);
        } finally {
            setLoading(false);
        }
    };

    const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !recaudacion) return;

        setImportFile(file);
        setAnalyzingFileId(null);
        setIsUploading(true);
        setUploadError(null);

        try {
            const results = await recaudacionApi.analyzeExcel(recaudacion.id, file);
            setAnalysisResults(results);
            setImportModalOpen(true);
        } catch (err) {
            console.error(err);
            setUploadError("Error al analizar el Excel");
            setImportFile(null);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleConfirmImport = async () => {
        if ((!importFile && !analyzingFileId) || !recaudacion || !analysisResults) return;

        setIsUploading(true);
        try {
            if (analyzingFileId) {
                // Manually call import-excel with file_id
                const formData = new FormData();
                formData.append('mappings_str', JSON.stringify(userMappings));
                formData.append('file_id', String(analyzingFileId));

                // Using axios directly or I should update the API wrapper. 
                await axios.post('/recaudaciones/' + recaudacion.id + '/import-excel', formData);

            } else if (importFile) {
                await recaudacionApi.importExcel(recaudacion.id, importFile, userMappings);
            }

            setImportModalOpen(false);
            setImportFile(null);
            setAnalyzingFileId(null);
            fetchData(recaudacion.id);
            // alert("Importación completada");
        } catch (err) {
            console.error(err);
            alert("Error al importar el archivo.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleExportExcel = async () => {
        if (!recaudacion) return;
        try {
            await recaudacionApi.exportExcel(recaudacion.id);
        } catch (err) {
            console.error(err);
            alert("Error al exportar el Excel");
        }
    };


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
                                    <span className="text-xs font-semibold text-gray-500 uppercase">NETO {recaudacion.salon?.nombre || 'SALON'}:</span>
                                    <span className={"text-sm font-bold " + getColorClass(splitTotal)}>{formatCurrency(splitTotal)}</span>
                                </div>
                                <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">NETO UORSA:</span>
                                    <span className={"text-sm font-bold " + getColorClass(splitTotal)}>{formatCurrency(splitTotal)}</span>
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
                                        {detail.puesto && <span className="text-gray-600"> - {detail.puesto.descripcion}</span>}
                                        <div className="text-xs text-gray-400">
                                            {detail.maquina?.tipo_maquina?.nombre}
                                            {detail.maquina?.numero_serie && ` - ${detail.maquina.numero_serie}`}
                                        </div>
                                    </td>

                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input - ${idx} -retirada`}
                                            nextFocusId={hasNextRow ? `input - ${nextRowIdx} -retirada` : undefined}
                                            value={retiro}
                                            onChange={(val) => handleCellChange(detail.id, 'retirada_efectivo', val)}
                                            onBlur={(val) => saveCell(detail.id, 'retirada_efectivo', val)}
                                            readOnly={false}
                                            className={greenClass}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input - ${idx} -cajon`}
                                            nextFocusId={hasNextRow ? `input - ${nextRowIdx} -cajon` : undefined}
                                            value={cajon}
                                            onChange={(val) => handleCellChange(detail.id, 'cajon', val)}
                                            onBlur={(val) => saveCell(detail.id, 'cajon', val)}
                                            readOnly={false}
                                            className={greenClass}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input - ${idx} -manual`}
                                            nextFocusId={hasNextRow ? `input - ${nextRowIdx} -manual` : undefined}
                                            value={manual}
                                            onChange={(val) => handleCellChange(detail.id, 'pago_manual', val)}
                                            onBlur={(val) => saveCell(detail.id, 'pago_manual', val)}
                                            readOnly={false}
                                            className={manual > 0 ? redClass : 'text-gray-900'}
                                        />
                                    </td>

                                    <td className="px-2 py-1">
                                        <MoneyInput
                                            id={`input - ${idx} -ajuste`}
                                            nextFocusId={hasNextRow ? `input - ${nextRowIdx} -ajuste` : undefined}
                                            value={ajuste}
                                            onChange={(val) => handleCellChange(detail.id, 'tasa_ajuste', val)}
                                            onBlur={(val) => saveCell(detail.id, 'tasa_ajuste', val)}
                                            readOnly={false}
                                            className={getPositiveClass(ajuste)}
                                        />
                                    </td>

                                    <td className={`px - 2 py - 1 text - right ${getPositiveClass(totalBruto)} `}>
                                        {formatCurrency(totalBruto)}
                                    </td>

                                    <td className={`px - 2 py - 1 text - right ${redClass} `}>
                                        {formatCurrency(tasaEst)}
                                    </td>

                                    <td className={`px - 2 py - 1 text - right ${getPositiveClass(totalNeto)} `}>
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
                            <td className={`px - 3 py - 3 text - right ${(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_ajuste) || 0), 0) || 0) > 0 ? 'text-emerald-600' : (recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_ajuste) || 0), 0) || 0) < 0 ? 'text-red-600' : 'text-gray-900'} `}>
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_ajuste) || 0), 0))}
                            </td>

                            {/* Bruto (Conditional) */}
                            <td className={`px - 3 py - 3 text - right ${(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0)), 0) || 0) > 0 ? 'text-emerald-600' : 'text-gray-900'} `}>
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0)), 0))}
                            </td>

                            {/* Tasa (Red) */}
                            <td className="px-3 py-3 text-right text-red-600">
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + (Number(d.tasa_calculada) || 0), 0))}
                            </td>

                            {/* Neto (Conditional) */}
                            <td className={`px - 3 py - 3 text - right ${(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0) - (Number(d.tasa_calculada) || 0)), 0) || 0) > 0 ? 'text-emerald-600' : 'text-red-600'} `}>
                                {formatCurrency(recaudacion.detalles?.reduce((acc, d) => acc + ((Number(d.retirada_efectivo) || 0) + (Number(d.cajon) || 0) - (Number(d.pago_manual) || 0) + (Number(d.tasa_ajuste) || 0) - (Number(d.tasa_calculada) || 0)), 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Split Layout: Documents & Summary */}
            <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">

                {/* Documents Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1 w-full">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Paperclip size={20} /> DOCUMENTOS
                    </h2>

                    {/* List */}
                    <div className="space-y-2 mb-4">
                        {recaudacion.ficheros?.map(f => (
                            <div key={f.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:bg-blue-50 transition-colors">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileText size={16} className="text-gray-500 flex-shrink-0" />
                                    <a href={recaudacionApi.getFileUrl(f.id)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate font-medium">
                                        {f.filename}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleAnalyzeFile(f.id)} className="text-blue-500 hover:text-blue-700 p-1" title="Remapear">
                                        <RefreshCw size={16} />
                                    </button>
                                    <a href={recaudacionApi.getFileUrl(f.id)} download className="text-gray-400 hover:text-gray-700 p-1">
                                        <Download size={16} />
                                    </a>
                                    <button onClick={() => handleFileDelete(f.id)} className="text-red-400 hover:text-red-700 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!recaudacion.ficheros || recaudacion.ficheros.length === 0) && (
                            <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-200 text-gray-400 italic">
                                No hay documentos adjuntos
                            </div>
                        )}
                    </div>

                    {/* Upload Buttons Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-600 transition-colors group">
                            <Upload size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">{isUploading ? 'Subiendo...' : 'Adjuntar Documento'}</span>
                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </label>

                        <label className="flex items-center justify-center gap-2 w-full p-4 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100 text-emerald-700 transition-colors group shadow-sm">
                            <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col items-center leading-tight">
                                <span className="text-xs font-semibold uppercase">Importar Excel</span>
                                <span className="text-[10px] opacity-75">de Recaudación</span>
                            </div>
                            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelFileSelect} disabled={isUploading} />
                        </label>

                        <button
                            onClick={handleExportExcel}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 w-full p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 text-blue-700 transition-colors group shadow-sm"
                        >
                            <Download size={20} className="group-hover:scale-110 transition-transform" />
                            <div className="flex flex-col items-center leading-tight">
                                <span className="text-xs font-semibold uppercase">Exportar Excel</span>
                                <span className="text-[10px] opacity-75">Descargar Datos</span>
                            </div>
                        </button>
                    </div>
                    {uploadError && <p className="text-xs text-red-600 mt-2 text-center font-bold bg-red-50 p-2 rounded">{uploadError}</p>}
                </div>

                {/* Summary Section-Right Aligned Stack with Border */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-end space-y-2 w-full lg:w-1/3 shrink-0">
                    {(() => {
                        return (
                            <>
                                {/* 1. Total Recaudación */}
                                <div className="flex items-center justify-end w-full">
                                    <span className="text-gray-600 font-medium mr-4 uppercase">TOTAL RECAUDACIÓN:</span>
                                    <span className={`text - xl font - bold w - 32 text - right ${getColorClass(totalRecaudacion)} `}>
                                        {formatCurrency(totalRecaudacion)}
                                    </span>
                                </div>

                                {/* 2. Pagos Manuales */}
                                <div className="flex items-center justify-end w-full">
                                    <span className="text-gray-600 font-medium mr-4 uppercase">PAGOS MANUALES:</span>
                                    <span className={`text - xl font - bold w - 32 text - right ${getColorClass(-pagosManuales)} `}>
                                        {formatCurrency(pagosManuales)}
                                    </span>
                                </div>

                                {/* 3. Ajustes */}
                                <div className="flex items-center justify-end w-full">
                                    <span className="text-gray-600 font-medium mr-4 uppercase">AJUSTES:</span>
                                    <span className={`text - xl font - bold w - 32 text - right ${getColorClass(totalAjustes)} `}>
                                        {formatCurrency(totalAjustes)}
                                    </span>
                                </div>

                                {/* 4. Tasas (Editable) */}
                                <div className="flex items-center justify-end w-full">
                                    <div className="flex flex-col items-end mr-4">
                                        <span className="text-gray-600 font-medium uppercase">TASAS:</span>
                                        <span className={`text - xs ${getFadedColorClass(tasaDiff)} `}>
                                            (DIF: {formatCurrency(tasaDiff)})
                                        </span>
                                    </div>
                                    <div className="w-32">
                                        <MoneyInput
                                            value={totalTasas}
                                            onChange={(val) => handleGlobalUpdate('total_tasas', val)}
                                            readOnly={false}
                                            className="font-bold text-red-600"
                                        />
                                    </div>
                                </div>

                                {/* 5. Subtotal (Calculated) */}
                                <div className="flex items-center justify-end w-full border-t border-gray-100 pt-2">
                                    <span className="text-gray-800 font-bold mr-4 uppercase">SUBTOTAL:</span>
                                    <span className={`text - xl font - bold w - 32 text - right ${getColorClass(subtotal)} `}>
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
                                            className={`font - bold ${getColorClass(depositos)} `}
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
                                            className={`font - bold ${getColorClass(otrosConceptos)} `}
                                        />
                                    </div>
                                </div>

                                {/* 8. TOTAL FINAL */}
                                <div className="flex items-center justify-end w-full border-t-2 border-gray-300 pt-2 mt-2 whitespace-nowrap">
                                    <span className="text-gray-900 font-black text-lg mr-4 uppercase">TOTAL:</span>
                                    <span className={`text - 2xl font - black text - right ${getColorClass(totalFinal)} `}>
                                        {formatCurrency(totalFinal)}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
            {/* Import Modal */}
            {/* Import Modal */}
            {importModalOpen && analysisResults && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Mapeo de Máquinas</h3>
                            <button onClick={() => setImportModalOpen(false)}><X className="w-6 h-6 text-gray-500" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-8">

                            {/* Section 1: Pending (Reverse Mapping) */}
                            {pendingMappings.length > 0 && (
                                <div>
                                    <div className="mb-4 bg-orange-50 p-4 rounded-lg flex items-start gap-3">
                                        <Info className="w-5 h-5 text-orange-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-orange-800 font-bold">Nombres Pendientes ({pendingMappings.length})</p>
                                            <p className="text-xs text-orange-700 mt-1">Estos nombres del Excel no tienen puesto asignado. Asígnalos o ignóralos.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pendingMappings.map(m => (
                                            <div key={m.excel_name} className="p-3 border border-orange-200 bg-white rounded-lg shadow-sm flex items-center gap-3">
                                                <div className="flex-1 font-medium text-gray-700 truncate" title={m.excel_name}>
                                                    {m.excel_name}
                                                </div>
                                                <select
                                                    className="w-48 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value=""
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setUserMappings(prev => ({ ...prev, [m.excel_name]: val }));
                                                    }}
                                                >
                                                    <option value="">Asignar a...</option>
                                                    {analysisResults.puestos.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => setUserMappings(prev => ({ ...prev, [m.excel_name]: -1 }))}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded"
                                                    title="Ignorar siempre"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section 2: Mapped Puestos */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Asignaciones Activas</h4>
                                <div className="space-y-1">
                                    {analysisResults.puestos.map((puesto) => {
                                        // Find which excel name is mapped to this puesto
                                        const assignedExcelName = Object.entries(userMappings).find(([k, v]) => v === puesto.id)?.[0];

                                        return (
                                            <div key={puesto.id} className={`flex items - center gap - 4 p - 2 rounded ${assignedExcelName ? 'bg-indigo-50' : 'bg-gray-50/50'} `}>
                                                <div className="flex-1 text-sm font-medium text-gray-700">{puesto.name}</div>
                                                <div className="w-1/2 flex items-center gap-2">
                                                    {assignedExcelName ? (
                                                        <>
                                                            <span className="flex-1 text-sm bg-white border px-2 py-1 rounded text-indigo-700 font-medium truncate" title={assignedExcelName}>
                                                                {assignedExcelName}
                                                            </span>
                                                            <button
                                                                onClick={() => setUserMappings(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[assignedExcelName];
                                                                    return next;
                                                                })}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic px-2">Sin asignar</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 3: Ignored */}
                            {ignoredMappings.length > 0 && (
                                <div className="border-t pt-4">
                                    <details>
                                        <summary className="cursor-pointer text-sm text-gray-500 font-medium hover:text-gray-700 select-none">
                                            Ver Ignorados ({ignoredMappings.length})
                                        </summary>
                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {ignoredMappings.map(m => (
                                                <div key={m.excel_name} className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs text-gray-500">
                                                    <span className="truncate mr-2" title={m.excel_name}>{m.excel_name}</span>
                                                    <button
                                                        onClick={() => setUserMappings(prev => {
                                                            const next = { ...prev };
                                                            delete next[m.excel_name]; // Remove from mapping (makes it pending)
                                                            return next;
                                                        })}
                                                        className="hover:text-green-600 font-bold"
                                                        title="Restaurar"
                                                    >
                                                        Restaurar
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                </div>
                            )}

                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                            <button
                                onClick={() => setImportModalOpen(false)}
                                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={isUploading}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                Confirmar e Importar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
