import api from './axios';

export interface User {
    id: number;
    email: string;
    username: string;
    nombre?: string;
    activo: boolean;
    // New fields
    telefono?: string;
    telegram_user?: string;
    cargo?: string;
    departamento?: string;
    codigo_empleado?: string;

    dni?: string;
    direccion_postal?: string;
    notas?: string;
    ultimo_acceso?: string;
}

export interface UserCreate {
    email: string;
    username: string;
    password: string;
    nombre?: string;
    activo?: boolean;

    // Mandatory
    telefono: string;
    telegram_user: string;
    cargo: string;
    departamento: string;
    codigo_empleado: string;

    // Optional
    dni?: string;
    direccion_postal?: string;
    notas?: string;
}

export interface UserUpdate {
    email?: string;
    username?: string;
    password?: string;
    nombre?: string;
    activo?: boolean;

    telefono?: string;
    telegram_user?: string;
    cargo?: string;
    departamento?: string;
    codigo_empleado?: string;

    dni?: string;
    direccion_postal?: string;
    notas?: string;
}

export const usersApi = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get<User[]>('/users/');
        return response.data;
    },

    getById: async (id: number): Promise<User> => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: UserCreate): Promise<User> => {
        const response = await api.post<User>('/users/', data);
        return response.data;
    },

    update: async (id: number, data: UserUpdate): Promise<User> => {
        const response = await api.put<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<User> => {
        const response = await api.delete<User>(`/users/${id}`);
        return response.data;
    }
};
