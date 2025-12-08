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
};
