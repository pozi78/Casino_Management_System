import axiosInstance from './axios';

// --- Interfaces ---

export interface TipoMaquina {
    id: number;
    nombre: string;
    codigo: string;
    tasa_semanal_base: number;
    tasa_por_puesto: boolean;
    descripcion?: string;
    activo: boolean;
}

export interface TipoMaquinaCreate {
    nombre: string;
    codigo: string;
    tasa_semanal_base: number;
    tasa_por_puesto?: boolean;
    descripcion?: string;
    activo?: boolean;
}

export interface Maquina {
    id: number;
    salon_id: number;
    tipo_maquina_id: number;
    codigo_interno: string;
    numero_serie?: string;
    maquina_padre_id?: number;
    numero_puesto?: number;
    tasa_semanal_override?: number;
    activo: boolean;
    fecha_alta?: string;
    fecha_baja?: string;
}

export interface MaquinaCreate {
    salon_id: number;
    tipo_maquina_id: number;
    codigo_interno: string;
    numero_serie?: string;
    maquina_padre_id?: number;
    numero_puesto?: number;
    tasa_semanal_override?: number;
    activo?: boolean;
    fecha_alta?: string;
    fecha_baja?: string;
}

export interface MaquinaUpdate {
    salon_id?: number;
    tipo_maquina_id?: number;
    codigo_interno?: string;
    numero_serie?: string;
    maquina_padre_id?: number;
    numero_puesto?: number;
    tasa_semanal_override?: number;
    activo?: boolean;
    fecha_alta?: string;
    fecha_baja?: string;
}

// --- API Client ---

export const machinesApi = {
    // Machine Types
    getTypes: async (): Promise<TipoMaquina[]> => {
        const response = await axiosInstance.get('/maquinas/types');
        return response.data;
    },

    createType: async (data: TipoMaquinaCreate): Promise<TipoMaquina> => {
        const response = await axiosInstance.post('/maquinas/types', data);
        return response.data;
    },

    // Machines
    getAll: async (salonId?: number): Promise<Maquina[]> => {
        const params = salonId ? { salon_id: salonId } : {};
        const response = await axiosInstance.get('/maquinas', { params });
        return response.data;
    },

    create: async (data: MaquinaCreate): Promise<Maquina> => {
        const response = await axiosInstance.post('/maquinas', data);
        return response.data;
    },

    update: async (id: number, data: MaquinaUpdate): Promise<Maquina> => {
        const response = await axiosInstance.put(`/maquinas/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<Maquina> => {
        const response = await axiosInstance.delete(`/maquinas/${id}`);
        return response.data;
    },
};
