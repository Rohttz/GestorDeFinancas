import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearAuthError, login } from '@/src/store/slices/authSlice';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)' as never);
    }
  }, [router, user]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro de login', error, [{ text: 'OK', onPress: () => dispatch(clearAuthError()) }]);
    }
  }, [dispatch, error]);

  const handleLogin = () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatórios', 'Informe e-mail e senha para continuar.');
      return;
    }

    dispatch(login({ email, senha, remember }));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>Gestor de Finanças</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Entre para continuar</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Senha</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              secureTextEntry
              placeholder="Digite sua senha"
              placeholderTextColor={colors.textSecondary}
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.rememberRow}>
              <Switch
                value={remember}
                onValueChange={setRemember}
                thumbColor={remember ? colors.primary : colors.border}
                trackColor={{ false: colors.border, true: colors.primary + '70' }}
              />
              <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Lembrar de mim</Text>
            </View>

            <Text style={[styles.link, { color: colors.primary }]} onPress={() => router.push('/recovery' as never)}>
              Esqueci minha senha
            </Text>
          </View>

          <View style={styles.actions}>
            <Button title="Entrar" onPress={handleLogin} loading={loading} />
            <Text style={[styles.registerHint, { color: colors.textSecondary }]}>Ainda não possui conta?</Text>
            <Text style={[styles.link, { color: colors.primary }]} onPress={() => router.push('/register' as never)}>
              Cadastre-se gratuitamente
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  switchRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  registerHint: {
    fontSize: 14,
  },
});
