import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AlertButton } from '../context/AlertContext';

type Props = {
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
    onClose: () => void;
    onPress: (button: AlertButton) => void;
};

export function AppAlertModal({ visible, title, message, buttons, onClose, onPress }: Props) {
    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>
                <View style={styles.card}>
                            <View style={styles.iconWrap}>
                                <Feather name="info" size={28} color="#8C7D6B" />
                            </View>
                            <Text style={styles.title}>{title}</Text>
                            {message ? <Text style={styles.message}>{message}</Text> : null}
                            <View style={styles.actions}>
                                {buttons.map((btn, i) => {
                                    const isCancel = btn.style === 'cancel';
                                    const isDestructive = btn.style === 'destructive';
                                    return (
                                        <Pressable
                                            key={i}
                                            style={({ pressed }) => [
                                                styles.btn,
                                                isCancel && styles.btnCancel,
                                                isDestructive && styles.btnDestructive,
                                                pressed && styles.btnPressed,
                                            ]}
                                            onPress={() => onPress(btn)}
                                        >
                                            <Text
                                                style={[
                                                    styles.btnText,
                                                    isCancel && styles.btnCancelText,
                                                    isDestructive && styles.btnDestructiveText,
                                                ]}
                                            >
                                                {btn.text}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(44, 39, 36, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        position: 'relative',
    },
    card: {
        backgroundColor: '#FDFBF7',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EBE5D9',
        shadowColor: '#3A3125',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 12,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F0EBE1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C2724',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#7A7265',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#8C7D6B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnCancel: {
        backgroundColor: '#F9F6F0',
        borderWidth: 1,
        borderColor: '#EBE5D9',
    },
    btnDestructive: {
        backgroundColor: '#C45C4A',
    },
    btnPressed: {
        opacity: 0.85,
    },
    btnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    btnCancelText: {
        color: '#7A7265',
    },
    btnDestructiveText: {
        color: '#FFF',
    },
});
