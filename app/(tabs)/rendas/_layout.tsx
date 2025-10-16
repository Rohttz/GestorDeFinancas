import { Stack } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';

export default function RendasLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Rendas',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: 'Formulário de Renda',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
