import api from './axios';

export interface Salon {
    id: number;
    nombre: string;
    direccion?: string;
    activo: boolean;
}

export interface SalonCreate {
    nombre: string;
    direccion?: string;
    activo?: boolean;
}

export interface SalonUpdate {
    nombre?: string;
    direccion?: string;
    activo?: boolean;
}

export const salonesApi = {
    getAll: async () => {
        const response = await api.get<Salon[]>('/salones/');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Salon>(`/salones/${id}`);
        return response.data;
    },

    create: async (data: SalonCreate) => {
        const response = await api.post<Salon>('/salones/', data);
        return response.data;
    },

    update: async (id: number, data: SalonUpdate) => {
        const response = await api.put<Salon>(`/salones/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await api.delete<Salon>(`/salones/${id}`);
        return response.data;
    }
};
