import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SalonFilterContextType {
    availableSalons: { id: number; nombre: string }[];
    selectedSalonIds: number[];
    toggleSalon: (id: number) => void;
    selectAll: () => void;
    deselectAll: () => void;
    isFiltered: boolean; // true if not all salons are selected
}

const SalonFilterContext = createContext<SalonFilterContextType | undefined>(undefined);

export const SalonFilterProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [selectedSalonIds, setSelectedSalonIds] = useState<number[]>([]);

    // Helper to get simple salon list from user assignment, filtering by visibility permission
    const availableSalons = user?.salones_asignados
        ?.filter(ua => ua.puede_ver)
        .map(ua => ua.salon) || [];

    // Initialize selection when user loads
    useEffect(() => {
        if (availableSalons.length > 0) {
            // Default: Select all
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedSalonIds(availableSalons.map(s => s.id));
        } else {
            setSelectedSalonIds([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // ...



    const toggleSalon = (id: number) => {
        setSelectedSalonIds(prev => {
            if (prev.includes(id)) {
                // Prevent deselecting the last one? Optional, but good UX usually allows it or not.
                // Let's allow empty selection (which might mean "show nothing" or "show all" depending on logic).
                // Usually empty filter means "show nothing".
                return prev.filter(sid => sid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const selectAll = () => {
        setSelectedSalonIds(availableSalons.map(s => s.id));
    };

    const deselectAll = () => {
        setSelectedSalonIds([]);
    };

    const isFiltered = availableSalons.length > 0 && selectedSalonIds.length < availableSalons.length;

    return (
        <SalonFilterContext.Provider value={{
            availableSalons,
            selectedSalonIds,
            toggleSalon,
            selectAll,
            deselectAll,
            isFiltered
        }}>
            {children}
        </SalonFilterContext.Provider>
    );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useSalonFilter = () => {
    const context = useContext(SalonFilterContext);
    if (!context) {
        throw new Error('useSalonFilter must be used within a SalonFilterProvider');
    }
    return context;
};
