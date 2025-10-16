import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Button } from '@/src/components/Button';

interface DialogOptions {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

type DialogMode = 'alert' | 'confirm';

type DialogState = {
  visible: boolean;
  mode: DialogMode;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

const initialState: DialogState = {
  visible: false,
  mode: 'alert',
  title: undefined,
  message: '',
  confirmText: undefined,
  cancelText: undefined,
  destructive: false,
};

interface DialogContextValue {
  showDialog: (title: string | undefined, message: string, options?: DialogOptions) => Promise<void>;
  confirmDialog: (title: string | undefined, message: string, options?: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export const DialogProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { colors } = useTheme();
  const [state, setState] = useState<DialogState>(initialState);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState(initialState);
    if (resolver) {
      resolver(result);
    }
  }, []);

  const showDialog = useCallback<DialogContextValue['showDialog']>((title, message, options) => {
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
      setState({
        visible: true,
        mode: 'alert',
        title,
        message,
        confirmText: options?.confirmText ?? 'OK',
        destructive: options?.destructive ?? false,
      });
    });
  }, []);

  const confirmDialog = useCallback<DialogContextValue['confirmDialog']>((title, message, options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({
        visible: true,
        mode: 'confirm',
        title,
        message,
        confirmText: options?.confirmText ?? 'Confirmar',
        cancelText: options?.cancelText ?? 'Cancelar',
        destructive: options?.destructive ?? false,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    close(true);
  }, [close]);

  const handleCancel = useCallback(() => {
    close(false);
  }, [close]);

  const value = useMemo(() => ({ showDialog, confirmDialog }), [showDialog, confirmDialog]);

  const handleRequestClose = useCallback(() => {
    if (state.mode === 'alert') {
      close(true);
    } else {
      close(false);
    }
  }, [close, state.mode]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal visible={state.visible} transparent animationType={Platform.OS === 'ios' ? 'fade' : 'slide'} onRequestClose={handleRequestClose}>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            {state.title && <Text style={[styles.title, { color: colors.text }]}>{state.title}</Text>}
            <Text style={[styles.message, { color: colors.textSecondary }]}>{state.message}</Text>
            <View style={styles.actions}>
              {state.mode === 'confirm' && (
                <Button title={state.cancelText ?? 'Cancelar'} variant="outline" onPress={handleCancel} />
              )}
              <Button
                title={state.confirmText ?? 'OK'}
                variant={state.destructive ? 'danger' : 'primary'}
                onPress={handleConfirm}
              />
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
