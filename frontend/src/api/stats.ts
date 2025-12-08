import api from './axios';

export interface DashboardStats {
    ingresos_totales: number;
    usuarios_activos: number;
    salones_operativos: number;
    maquinas_activas: number;
}

export const statsApi = {
    getDashboardStats: async (salonIds?: number[]): Promise<DashboardStats> => {
        let params = '';
        if (salonIds && salonIds.length > 0) {
            const query = salonIds.map(id => `salon_ids=${id}`).join('&');
            params = `?${query}`;
        }
        const response = await api.get<DashboardStats>(`/stats/dashboard${params}`);
        return response.data;
    }
};
