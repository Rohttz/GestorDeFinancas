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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Rendas',
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: 'Formulário de Renda',
        }}
      />
    </Stack>
  );
}
