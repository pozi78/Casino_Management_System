import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axiosInstance from '../api/axios';

interface Salon {
    id: number;
    nombre: string;
}

interface UsuarioSalon {
    salon_id: number;
    puede_ver: boolean;
    puede_editar: boolean;
    salon: Salon;
}

interface User {
    id: number;
    username: string;
    email: string;
    nombre: string;
    activo: boolean;
    salones_asignados: UsuarioSalon[];
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        if (token) {
            localStorage.setItem('token', token);
            try {
                const response = await axiosInstance.get('/users/me');
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user:", error);
                setToken(null);
                localStorage.removeItem('token');
                setUser(null);
            }
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, [token]);

    const login = (newToken: string) => {
        setLoading(true);
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token, loading, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
