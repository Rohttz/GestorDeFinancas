import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { clearAuthError, register } from '@/src/store/slices/authSlice';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)' as never);
    }
  }, [router, user]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro ao cadastrar', error, [{ text: 'OK', onPress: () => dispatch(clearAuthError()) }]);
    }
  }, [dispatch, error]);

  const handleRegister = () => {
    if (!nome.trim() || !sobrenome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todas as informações para continuar.');
      return;
    }

    if (senha.trim() !== confirmacao.trim()) {
      Alert.alert('Senhas diferentes', 'A confirmação precisa ser igual à senha.');
      return;
    }

    dispatch(register({ nome, sobrenome, email, senha }));
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
            <Text style={[styles.title, { color: colors.primary }]}>Crie sua conta</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Organize suas finanças em poucos minutos</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Seu nome"
                placeholderTextColor={colors.textSecondary}
                value={nome}
                onChangeText={setNome}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Sobrenome</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="Seu sobrenome"
                placeholderTextColor={colors.textSecondary}
                value={sobrenome}
                onChangeText={setSobrenome}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Senha</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Crie uma senha segura"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirme a senha</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Repita a senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={confirmacao}
              onChangeText={setConfirmacao}
            />
          </View>

          <View style={styles.actions}>
            <Button title="Criar conta" onPress={handleRegister} loading={loading} />
            <Text style={[styles.loginHint, { color: colors.textSecondary }]}>Já possui uma conta?</Text>
            <Text style={[styles.link, { color: colors.primary }]} onPress={() => router.replace('/login' as never)}>
              Faça login
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
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
  actions: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  loginHint: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
  },
});
