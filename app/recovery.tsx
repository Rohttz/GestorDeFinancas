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
import {
  clearAuthError,
  confirmPasswordReset,
  requestPasswordReset,
} from '@/src/store/slices/authSlice';

export default function RecoveryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { loading, error, resetRequest } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [senha, setSenha] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert('Não foi possível continuar', error, [{ text: 'OK', onPress: () => dispatch(clearAuthError()) }]);
    }
  }, [dispatch, error]);

  useEffect(() => {
    if (resetRequest) {
      Alert.alert(
        'Código gerado',
        `Um código temporário foi criado: ${resetRequest.code}. Informe-o abaixo para redefinir sua senha.`
      );
    }
  }, [resetRequest]);

  const handleRequestCode = () => {
    if (!email.trim()) {
      Alert.alert('Informe o e-mail', 'Digite o e-mail cadastrado para gerar o código.');
      return;
    }

    dispatch(requestPasswordReset({ email }));
  };

  const handleResetPassword = () => {
    if (!email.trim() || !code.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail, código e nova senha.');
      return;
    }

    dispatch(confirmPasswordReset({ email, code, senha })).unwrap()
      .then(() => {
        Alert.alert('Senha atualizada', 'Sua senha foi redefinida com sucesso.', [
          { text: 'Fazer login', onPress: () => router.replace('/login' as never) },
        ]);
      })
      .catch(() => {
        // Erro já tratado pela slice, nenhuma ação adicional necessária aqui
      });
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
            <Text style={[styles.title, { color: colors.primary }]}>Recuperar acesso</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Vamos gerar um código temporário para que você defina uma nova senha.</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>E-mail cadastrado</Text>
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

          <Button title="Gerar código" onPress={handleRequestCode} loading={loading && !resetRequest} />

          <View style={[styles.divider, { borderColor: colors.border }]} />

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Código recebido</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Informe o código de 5 dígitos"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              maxLength={5}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nova senha</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Crie uma nova senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          </View>

          <Button title="Redefinir senha" onPress={handleResetPassword} loading={loading && !!resetRequest} />

          <Text style={[styles.link, { color: colors.primary }]} onPress={() => router.replace('/login' as never)}>
            Voltar para o login
          </Text>
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
    gap: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
  },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  link: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
