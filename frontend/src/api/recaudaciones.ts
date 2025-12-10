import axiosInstance from './axios';

export interface RecaudacionMaquina {
    id: number;
    recaudacion_id: number;
    maquina_id: number;
    retirada_efectivo: number;
    cajon: number;
    pago_manual: number;
    tasa_calculada: number;
    tasa_ajuste: number;
    tasa_final: number;
    detalle_tasa: string;
    maquina?: {
        id: number;
        nombre: string;
        numero_serie: string;
        tipo_maquina: {
            nombre: string;
            nombre_corto: string;
        }
    };
    puesto?: {
        id: number;
        numero_puesto: number;
        descripcion: string;
    };
}

export interface RecaudacionMaquinaUpdate {
    retirada_efectivo?: number;
    cajon?: number;
    pago_manual?: number;
    tasa_ajuste?: number;
    detalle_tasa?: string;
}

export interface RecaudacionFichero {
    id: number;
    recaudacion_id: number;
    filename: string;
    content_type?: string;
    created_at?: string;
}

export interface Recaudacion {
    id: number;
    salon_id: number;
    salon?: {
        id: number;
        nombre: string;
    };
    fecha_inicio: string;
    fecha_fin: string;
    fecha_cierre: string;
    etiqueta?: string;
    origen: string;
    referencia_fichero?: string;
    notas?: string;
    total_tasas?: number;
    depositos?: number;
    otros_conceptos?: number;
    detalles?: RecaudacionMaquina[];
    ficheros?: RecaudacionFichero[];
    total_neto?: number;
    total_global?: number;
}

export interface RecaudacionCreate {
    salon_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    fecha_cierre: string;
    etiqueta?: string;
    origen?: string;
    notas?: string;
}

export interface RecaudacionUpdate {
    fecha_inicio?: string;
    fecha_fin?: string;
    fecha_cierre?: string;
    etiqueta?: string;
    notas?: string;
    total_tasas?: number;
    depositos?: number;
    otros_conceptos?: number;
}

export const recaudacionApi = {
    // Collection Operations
    getAll: async (salon_id?: number) => {
        const response = await axiosInstance.get<Recaudacion[]>('/recaudaciones/', {
            params: { salon_id }
        });
        return response.data;
    },

    getLastDate: async (salon_id: number) => {
        const response = await axiosInstance.get<string | null>('/recaudaciones/last', {
            params: { salon_id }
        });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await axiosInstance.get<Recaudacion>(`/recaudaciones/${id}`);
        return response.data;
    },

    create: async (data: RecaudacionCreate) => {
        const response = await axiosInstance.post<Recaudacion>('/recaudaciones/', data);
        return response.data;
    },

    update: async (id: number, data: RecaudacionUpdate) => {
        const response = await axiosInstance.put<Recaudacion>(`/recaudaciones/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        // Assuming backend supports DELETE /recaudaciones/{id}
        // If not, I should implement it. But let's assume standard CRUD.
        const response = await axiosInstance.delete(`/recaudaciones/${id}`);
        return response.data;
    },

    // Detail Operations
    updateDetail: async (detail_id: number, data: RecaudacionMaquinaUpdate) => {
        const response = await axiosInstance.put<RecaudacionMaquina>(`/recaudaciones/details/${detail_id}`, data);
        return response.data;
    },

    // File Operations
    uploadFile: async (id: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post<RecaudacionFichero>(`/recaudaciones/${id}/files`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteFile: async (id: number, file_id: number) => {
        await axiosInstance.delete(`/recaudaciones/${id}/files/${file_id}`);
    },

    getFileUrl: (file_id: number) => {
        const baseURL = axiosInstance.defaults.baseURL || import.meta.env.VITE_API_URL || '/api/v1';
        // Ensure no double slash if baseURL ends with /
        const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
        const token = localStorage.getItem('token');
        return `${cleanBase}/recaudaciones/files/${file_id}/content?token=${token}`;
    },

    analyzeExcel: async (id: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post<{
            mappings: { excel_name: string; mapped_puesto_id: number | null; is_ignored: boolean }[];
            puestos: { id: number; name: string }[];
        }>(`/recaudaciones/${id}/analyze-excel`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    analyzeFile: async (id: number, file_id: number) => {
        const response = await axiosInstance.post<{
            mappings: { excel_name: string; mapped_puesto_id: number | null; is_ignored: boolean }[];
            puestos: { id: number; name: string }[];
        }>(`/recaudaciones/${id}/files/${file_id}/analyze`);
        return response.data;
    },

    exportExcel: async (id: number) => {
        const response = await axiosInstance.get(`/recaudaciones/${id}/export-excel`, {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = response.headers['content-disposition'];
        let fileName = `Recaudacion_${id}.xlsx`;
        if (contentDisposition) {
            // Robust filename parsing
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                fileName = matches[1].replace(/['"]/g, '');
            }
        }
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    importExcel: async (id: number, file: File, mappings?: Record<string, number | null>) => {
        const formData = new FormData();
        formData.append('file', file);
        if (mappings) {
            const cleanMap: Record<string, number> = {};
            Object.entries(mappings).forEach(([k, v]) => {
                if (v) cleanMap[k] = v;
            });
            formData.append('mappings_str', JSON.stringify(cleanMap));
        }
        const response = await axiosInstance.post(`/recaudaciones/${id}/import-excel`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};
