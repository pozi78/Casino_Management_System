import api from './axios';

export interface DashboardStats {
    ingresos_totales: number;
    ingresos_por_anio: {
        anio: number;
        total: number;
        salones: { [key: string]: number };
    }[];
    usuarios_activos: number;
    salones_operativos: number;
    maquinas_activas: number;
}

interface DashboardFilters {
    salon_ids?: number[];
    years?: number[];
    months?: number[];
    machine_ids?: number[];
}

export interface FiltersMetadata {
    years: number[];
    months: { id: number, name: string }[];
    machines: { id: number, name: string, salon_id: number }[];
}

export const statsApi = {
    async getFiltersMetadata(years?: number[], salonIds?: number[]) {
        let url = '/stats/filters-metadata';
        const params = new URLSearchParams();
        if (years && years.length > 0) {
            years.forEach(id => params.append('years', id.toString()));
        }
        if (salonIds && salonIds.length > 0) {
            salonIds.forEach(id => params.append('salon_ids', id.toString()));
        }
        if (params.toString()) url += `?${params.toString()}`;
        const response = await api.get<FiltersMetadata>(url);
        return response.data;
    },

    async getDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
        let url = '/stats/dashboard';
        const params = new URLSearchParams();

        if (filters.salon_ids) filters.salon_ids.forEach(id => params.append('salon_ids', id.toString()));
        if (filters.years) filters.years.forEach(id => params.append('years', id.toString()));
        if (filters.months) filters.months.forEach(id => params.append('months', id.toString()));
        if (filters.machine_ids) filters.machine_ids.forEach(id => params.append('machine_ids', id.toString()));

        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get<DashboardStats>(url);
        return response.data;
    },

    async getRevenueEvolution(filters: DashboardFilters) {
        let url = '/stats/revenue-evolution';
        const params = new URLSearchParams();

        if (filters.salon_ids) filters.salon_ids.forEach(id => params.append('salon_ids', id.toString()));
        if (filters.years) filters.years.forEach(id => params.append('years', id.toString()));
        if (filters.months) filters.months.forEach(id => params.append('months', id.toString()));
        if (filters.machine_ids) filters.machine_ids.forEach(id => params.append('machine_ids', id.toString()));

        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get<any[]>(url);
        return response.data;
    },

    async getRevenueBySalon(filters: DashboardFilters) {
        let url = '/stats/revenue-by-salon';
        const params = new URLSearchParams();

        if (filters.salon_ids) filters.salon_ids.forEach(id => params.append('salon_ids', id.toString()));
        if (filters.years) filters.years.forEach(id => params.append('years', id.toString()));
        if (filters.months) filters.months.forEach(id => params.append('months', id.toString()));
        if (filters.machine_ids) filters.machine_ids.forEach(id => params.append('machine_ids', id.toString()));

        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get<{ name: string, value: number }[]>(url);
        return response.data;
    },

    async getTopMachines(filters: DashboardFilters) {
        let url = '/stats/top-machines';
        const params = new URLSearchParams();

        if (filters.salon_ids) filters.salon_ids.forEach(id => params.append('salon_ids', id.toString()));
        if (filters.years) filters.years.forEach(id => params.append('years', id.toString()));
        if (filters.months) filters.months.forEach(id => params.append('months', id.toString()));
        if (filters.machine_ids) filters.machine_ids.forEach(id => params.append('machine_ids', id.toString()));

        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get<{ name: string, value: number }[]>(url);
        return response.data;
    }
};
