import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Provider } from 'react-redux';
import { store } from '@/src/store';
import { ThemeProvider } from '@/src/contexts/ThemeContext';
import 'react-native-url-polyfill/auto';
import { bootstrapSession } from '@/src/store/slices/authSlice';
import { useAppDispatch } from '@/src/store/hooks';

const BootstrapSession = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return null;
};

export default function RootLayout() {
  useFrameworkReady();

  return (
    <Provider store={store}>
      <ThemeProvider>
        <BootstrapSession />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="recovery" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}
