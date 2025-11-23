// src/context/ApiConfigContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { SessionTypeParameter } from '../api/generated/api.schemas';

type ApiConfig = {
    apiKey: string;
    terminalCode: string;
    sessionType: SessionTypeParameter;
    locked: boolean;
    save: (apiKey: string, terminalCode: string, sessionType: SessionTypeParameter) => void;
    logout: () => void;
};

const ApiConfigContext = createContext<ApiConfig | undefined>(undefined);

const STORAGE_KEY = 'apiConfig';

const DEFAULT_SESSION_TYPE: SessionTypeParameter =
    Object.values(SessionTypeParameter)[0] as SessionTypeParameter;

export const ApiConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [apiKey, setApiKey] = useState('');
    const [terminalCode, setTerminalCode] = useState('');
    const [sessionType, setSessionType] = useState<SessionTypeParameter>(DEFAULT_SESSION_TYPE);
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
            const data = JSON.parse(raw) as {
                apiKey: string;
                terminalCode: string;
                sessionType?: SessionTypeParameter;
            };
            if (data.apiKey && data.terminalCode) {
                setApiKey(data.apiKey);
                setTerminalCode(data.terminalCode);
                setSessionType(data.sessionType ?? DEFAULT_SESSION_TYPE);
                setLocked(true);
            }
        } catch {
            // игнорируем битые данные
        }
    }, []);

    const save = (
        newApiKey: string,
        newTerminalCode: string,
        newSessionType: SessionTypeParameter,
    ) => {
        setApiKey(newApiKey);
        setTerminalCode(newTerminalCode);
        setSessionType(newSessionType);
        setLocked(true);
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                apiKey: newApiKey,
                terminalCode: newTerminalCode,
                sessionType: newSessionType,
            }),
        );
    };

    const logout = () => {
        setApiKey('');
        setTerminalCode('');
        setSessionType(DEFAULT_SESSION_TYPE);
        setLocked(false);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <ApiConfigContext.Provider
            value={{ apiKey, terminalCode, sessionType, locked, save, logout }}
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
