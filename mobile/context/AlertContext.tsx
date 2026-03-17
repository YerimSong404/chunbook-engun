import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppAlertModal } from '../components/AppAlertModal';

export type AlertButton = {
    text: string;
    onPress?: () => void;
    style?: 'cancel' | 'default' | 'destructive';
};

type AlertState = {
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
};

type AlertContextType = {
    showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const defaultState: AlertState = {
    visible: false,
    title: '',
    message: '',
    buttons: [],
};

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AlertState>(defaultState);

    const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
        const defaultButtons: AlertButton[] = buttons?.length
            ? buttons
            : [{ text: '확인', style: 'default' }];
        setState({
            visible: true,
            title,
            message: message ?? '',
            buttons: defaultButtons,
        });
    }, []);

    const close = useCallback(() => {
        setState(defaultState);
    }, []);

    const handlePress = useCallback((button: AlertButton) => {
        close();
        button.onPress?.();
    }, [close]);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <AppAlertModal
                visible={state.visible}
                title={state.title}
                message={state.message}
                buttons={state.buttons}
                onClose={close}
                onPress={handlePress}
            />
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error('useAlert must be used within AlertProvider');
    return ctx;
}
