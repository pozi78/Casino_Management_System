import { useAuth } from '../context/AuthContext';

export type PermissionType =
    | 'puede_ver'
    | 'puede_editar'
    | 'ver_dashboard'
    | 'ver_recaudaciones'
    | 'editar_recaudaciones'
    | 'ver_historico';

export const usePermission = () => {
    const { user } = useAuth();

    const checkPermission = (salonId: number, permission: PermissionType): boolean => {
        if (!user || !user.salones_asignados) return false;

        // Find the specific assignment for this salon
        const assignment = user.salones_asignados.find(ua => ua.salon_id === salonId);

        if (!assignment) return false;

        // Return the value of the specific permission flag
        // Use type assertion or lookup safely
        return !!assignment[permission];
    };

    const canViewSalon = (salonId: number) => checkPermission(salonId, 'puede_ver');
    const canEditSalon = (salonId: number) => checkPermission(salonId, 'puede_editar');
    const canViewDashboard = (salonId: number) => checkPermission(salonId, 'ver_dashboard');
    const canViewRecaudaciones = (salonId: number) => checkPermission(salonId, 'ver_recaudaciones');
    const canEditRecaudaciones = (salonId: number) => checkPermission(salonId, 'editar_recaudaciones');
    const canViewHistorico = (salonId: number) => checkPermission(salonId, 'ver_historico');

    return {
        checkPermission,
        canViewSalon,
        canEditSalon,
        canViewDashboard,
        canViewRecaudaciones,
        canEditRecaudaciones,
        canViewHistorico
    };
};
