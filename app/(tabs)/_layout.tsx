import { useEffect } from 'react';
import { Tabs, useRootNavigationState, useRouter } from 'expo-router';
import { LayoutDashboard, TrendingUp, TrendingDown, Target, Users } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAppSelector } from '@/src/store/hooks';
import { Loading } from '@/src/components/Loading';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { user, initializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (initializing) return;
    if (!user) {
      router.replace('/login' as never);
    }
  }, [initializing, navigationState?.key, router, user]);

  if (initializing || !navigationState?.key || !user) {
    return <Loading />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rendas"
        options={{
          title: 'Rendas',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="despesas"
        options={{
          title: 'Despesas',
          tabBarIcon: ({ color, size }) => <TrendingDown size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
