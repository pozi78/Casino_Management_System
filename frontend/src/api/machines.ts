import axiosInstance from './axios';

// --- Interfaces ---

export interface GrupoMaquina {
    id: number;
    nombre: string;
    cantidad_puestos: number;
    descripcion?: string;
}

export interface GrupoMaquinaCreate {
    nombre: string;
    cantidad_puestos?: number;
    descripcion?: string;
}

export interface GrupoMaquinaUpdate {
    nombre?: string;
    cantidad_puestos?: number;
    descripcion?: string;
}

export interface TipoMaquina {
    id: number;
    nombre: string;
    tasa_semanal_orientativa: number;
    tasa_por_puesto: boolean;
    es_multipuesto: boolean;
    descripcion?: string;
    activo: boolean;
}

export interface TipoMaquinaCreate {
    nombre: string;
    tasa_semanal_orientativa: number;
    tasa_por_puesto?: boolean;
    es_multipuesto?: boolean;
    descripcion?: string;
    activo?: boolean;
}

export interface Maquina {
    id: number;
    salon_id: number;
    tipo_maquina_id: number;
    grupo_id?: number;

    nombre: string;
    nombre_referencia_uorsa?: string;
    numero_serie?: string;

    es_multipuesto: boolean;
    numero_puesto?: number;
    tasa_semanal_override?: number;

    activo: boolean;
    observaciones?: string;
    fecha_alta?: string;
    fecha_baja?: string;
}

export interface MaquinaCreate {
    salon_id: number;
    tipo_maquina_id: number;
    grupo_id?: number;
    nombre: string;
    nombre_referencia_uorsa?: string;
    numero_serie?: string;
    es_multipuesto?: boolean;
    numero_puesto?: number;
    tasa_semanal_override?: number;
    activo?: boolean;
    observaciones?: string;
}

export interface MaquinaUpdate {
    salon_id?: number;
    tipo_maquina_id?: number;
    grupo_id?: number;
    nombre?: string;
    nombre_referencia_uorsa?: string;
    numero_serie?: string;
    es_multipuesto?: boolean;
    numero_puesto?: number;
    tasa_semanal_override?: number;
    activo?: boolean;
    observaciones?: string;
    fecha_baja?: string;
}

// --- API Client ---

export const machinesApi = {
    // Machine Groups
    getGroups: async (): Promise<GrupoMaquina[]> => {
        const response = await axiosInstance.get('/maquinas/groups');
        return response.data;
    },

    createGroup: async (data: GrupoMaquinaCreate): Promise<GrupoMaquina> => {
        const response = await axiosInstance.post('/maquinas/groups', data);
        return response.data;
    },

    updateGroup: async (id: number, data: GrupoMaquinaUpdate): Promise<GrupoMaquina> => {
        const response = await axiosInstance.put(`/maquinas/groups/${id}`, data);
        return response.data;
    },

    deleteGroup: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/maquinas/groups/${id}`);
    },

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
