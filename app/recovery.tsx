import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
import { KeyRound, RefreshCw } from 'lucide-react-native';

export default function RecoveryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { loading, error, resetRequest } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [senha, setSenha] = useState('');
  const [codeDialogVisible, setCodeDialogVisible] = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert('Não foi possível continuar', error, [{ text: 'OK', onPress: () => dispatch(clearAuthError()) }]);
    }
  }, [dispatch, error]);

  useEffect(() => {
    if (resetRequest?.code) {
      setCode(resetRequest.code);
      setCodeDialogVisible(true);
    }
  }, [resetRequest]);

  useEffect(() => {
    if (!resetRequest) {
      setCodeDialogVisible(false);
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

      <Modal
        visible={codeDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCodeDialogVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.codeIcon, { backgroundColor: colors.primary + '15' }]}> 
              <KeyRound size={28} color={colors.primary} />
            </View>
            <Text style={[styles.codeTitle, { color: colors.text }]}>Código gerado com sucesso</Text>
            <Text style={[styles.codeMessage, { color: colors.textSecondary }]}>Use o código abaixo para redefinir sua senha. Ele já foi preenchido automaticamente no campo "Código recebido".</Text>
            <View style={[styles.codeBadge, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}> 
              <Text style={[styles.codeText, { color: colors.primary }]}>{resetRequest?.code ?? '-----'}</Text>
            </View>
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={[styles.codeSecondaryButton, { borderColor: colors.border }]}
                onPress={() => setCodeDialogVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.codeSecondaryText, { color: colors.textSecondary }]}>Continuar depois</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.codePrimaryButton, { backgroundColor: colors.primary }]}
                onPress={() => setCodeDialogVisible(false)}
                activeOpacity={0.7}
              >
                <RefreshCw size={18} color="#FFFFFF" />
                <Text style={styles.codePrimaryText}>Inserir agora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  codeCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  codeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  codeMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  codeBadge: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  codeSecondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  codePrimaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  codePrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
