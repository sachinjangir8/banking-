import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    // Fetch full profile
                    fetchProfile(token);
                }
            } catch (err) {
                logout();
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async (token) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await axios.get(`${apiUrl}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profile = response.data.profile;
            setUser({ token, ...profile, isAdmin: profile.is_admin });
        } catch (error) {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.post(`${apiUrl}/auth/login`, { email, password });
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser({ token, ...userData });
        return true;
    };

    const register = async (userData) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await axios.post(`${apiUrl}/auth/register`, userData);
        return await login(userData.email, userData.password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
