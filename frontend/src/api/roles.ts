import api from './axios';

export interface Role {
    id: number;
    nombre: string;
    codigo: string;
}

export const rolesApi = {
    getAll: async (): Promise<Role[]> => {
        const response = await api.get<Role[]>('/roles/');
        return response.data;
    }
};
