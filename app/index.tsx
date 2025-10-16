import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { Loading } from '@/src/components/Loading';
import { useAppSelector } from '@/src/store/hooks';

export default function Index() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { user, initializing } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (initializing) return;

    if (user) {
      router.replace('/(tabs)' as never);
    } else {
      router.replace('/login' as never);
    }
  }, [initializing, navigationState?.key, router, user]);

  return <Loading />;
}
