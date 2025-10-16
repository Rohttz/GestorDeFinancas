import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  cancelText?: string;
  confirmText?: string;
  destructive?: boolean;
};

const formatMessage = (title?: string, message?: string) => {
  if (!title) return message ?? '';
  if (!message) return title;
  return `${title}\n\n${message}`;
};

export const showDialog = (title: string | undefined, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(formatMessage(title, message));
    }
    return;
  }

  Alert.alert(title ?? '', message);
};

export const confirmDialog = (
  title: string | undefined,
  message: string,
  options: ConfirmOptions = {},
): Promise<boolean> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return Promise.resolve(window.confirm(formatMessage(title, message)));
    }
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    Alert.alert(title ?? '', message, [
      {
        text: options.cancelText ?? 'Cancelar',
        style: 'cancel',
        onPress: () => resolve(false),
      },
      {
        text: options.confirmText ?? 'Confirmar',
        style: options.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
};
