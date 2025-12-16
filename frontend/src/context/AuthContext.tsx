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
    ver_dashboard?: boolean;
    ver_recaudaciones?: boolean;
    editar_recaudaciones?: boolean;
    ver_historico?: boolean;
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

import SessionTimeout from '../components/SessionTimeout';

// Helper to manually parse JWT to avoid external dependencies for just this
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Session Timeout State
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const fetchUser = async () => {
        if (token) {
            localStorage.setItem('token', token);
            try {
                const response = await axiosInstance.get('/users/me');
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user:", error);
                handleLogout(); // Use internal logout to clear everything
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

    // Token Expiration Monitoring
    useEffect(() => {
        if (!token) {
            setShowTimeoutWarning(false);
            return;
        }

        const checkToken = () => {
            const decoded = parseJwt(token);
            if (!decoded || !decoded.exp) return;

            const expTime = decoded.exp * 1000; // to ms
            const currentTime = Date.now();
            const timeRemaining = Math.max(0, Math.floor((expTime - currentTime) / 1000)); // in seconds

            if (timeRemaining <= 0) {
                // Expired
                handleLogout();
            } else if (timeRemaining <= 60) {
                // Less than 1 minute
                setTimeLeft(timeRemaining);
                setShowTimeoutWarning(true);
            } else {
                setShowTimeoutWarning(false);
            }
        };

        // Check immediately
        checkToken();

        // Check every second to update countdown if warning is shown, or every 10s otherwise
        const interval = setInterval(checkToken, 1000);

        return () => clearInterval(interval);
    }, [token]);


    const renewSession = async () => {
        try {
            const response = await axiosInstance.post('/login/renew-token');
            const newToken = response.data.access_token;
            if (newToken) {
                login(newToken); // This will update state and re-trigger effect
                setShowTimeoutWarning(false);
            }
        } catch (error) {
            console.error("Failed to renew session", error);
            handleLogout();
        }
    };

    const login = (newToken: string) => {
        setLoading(true);
        setToken(newToken);
        localStorage.setItem('token', newToken); // Ensure immediate sync
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        setShowTimeoutWarning(false);
        // Optional: Redirect to login handled by axios interceptor or protected route, 
        // but here we just clear state.
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout: handleLogout, isAuthenticated: !!token, loading, refreshUser: fetchUser }}>
            {children}
            {/* Render Timeout Warning globally */}
            <SessionTimeout
                isOpen={showTimeoutWarning}
                timeLeft={timeLeft}
                onExtend={renewSession}
                onLogout={handleLogout}
            />
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
