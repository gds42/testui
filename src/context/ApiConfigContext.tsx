// src/context/ApiConfigContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

type ApiConfig = {
    apiKey: string;
    terminalCode: string;
    locked: boolean;
    save: (apiKey: string, terminalCode: string) => void;
    logout: () => void;
};

const ApiConfigContext = createContext<ApiConfig | undefined>(undefined);

const STORAGE_KEY = 'apiConfig';

export const ApiConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState('');
    const [terminalCode, setTerminalCode] = useState('');
    const [locked, setLocked] = useState(false);

    // Обновляем заголовки axios при изменении apiKey
    useEffect(() => {
        if (apiKey) {
            axios.defaults.headers.common['x-api-key'] = apiKey;
        } else {
            delete axios.defaults.headers.common['x-api-key'];
        }
    }, [apiKey]);

    // инициализация из localStorage
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        try {
            const data = JSON.parse(raw) as { apiKey: string; terminalCode: string };
            if (data.apiKey && data.terminalCode) {
                setApiKey(data.apiKey);
                setTerminalCode(data.terminalCode);
                setLocked(true);
            }
        } catch {
            // игнорируем битые данные
        }
    }, []);

    const save = (newApiKey: string, newTerminalCode: string) => {
        setApiKey(newApiKey);
        setTerminalCode(newTerminalCode);
        setLocked(true);
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ apiKey: newApiKey, terminalCode: newTerminalCode }),
        );
    };

    const logout = () => {
        setApiKey('');
        setTerminalCode('');
        setLocked(false);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <ApiConfigContext.Provider
            value={{ apiKey, terminalCode, locked, save, logout }}
        >
            {children}
        </ApiConfigContext.Provider>
    );
};

export const useApiConfig = () => {
    const ctx = useContext(ApiConfigContext);
    if (!ctx) {
        throw new Error('useApiConfig must be used within ApiConfigProvider');
    }
    return ctx;
};
