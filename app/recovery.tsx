import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { KeyRound, RefreshCw, CheckCircle2, AlertTriangle, LogIn } from 'lucide-react-native';

export default function RecoveryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { loading, error, resetRequest } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [senha, setSenha] = useState('');
  const [codeDialogVisible, setCodeDialogVisible] = useState(false);
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setErrorDialogVisible(true);
  }, []);

  const closeErrorDialog = useCallback(() => {
    setErrorDialogVisible(false);
    setErrorMessage('');
    dispatch(clearAuthError());
  }, [dispatch]);

  const showSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);
      setSuccessDialogVisible(true);

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      successTimeoutRef.current = setTimeout(() => {
        setSuccessDialogVisible(false);
        setSuccessMessage('');
        router.replace('/login' as never);
        successTimeoutRef.current = null;
      }, 2000);
    },
    [router],
  );

  const handleCloseSuccess = useCallback(() => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }

    setSuccessDialogVisible(false);
    setSuccessMessage('');
    router.replace('/login' as never);
  }, [router]);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setErrorDialogVisible(true);
    }
  }, [error]);

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

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, []);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      showError('Digite o e-mail cadastrado para gerar o código.');
      return;
    }

    try {
      await dispatch(requestPasswordReset({ email })).unwrap();
    } catch {
      // erro já exibido via estado global
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !code.trim() || !senha.trim()) {
      showError('Preencha e-mail, código e nova senha.');
      return;
    }

    try {
      await dispatch(confirmPasswordReset({ email, code, senha })).unwrap();
      dispatch(clearAuthError());
      showSuccess('Senha redefinida com sucesso. Você será redirecionado em instantes.');
      setSenha('');
      setCode('');
    } catch (err) {
      const message = typeof err === 'string' ? err : 'Não foi possível redefinir a senha. Tente novamente.';
      showError(message);
      dispatch(clearAuthError());
    }
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
            <View style={[styles.codeIcon, { backgroundColor: withOpacity(colors.primary, 0.12) }]}> 
              <KeyRound size={28} color={colors.primary} />
            </View>
            <Text style={[styles.codeTitle, { color: colors.text }]}>Código gerado com sucesso</Text>
            <Text style={[styles.codeMessage, { color: colors.textSecondary }]}>Use o código abaixo para redefinir sua senha. Ele já foi preenchido automaticamente no campo "Código recebido".</Text>
            <View style={[styles.codeBadge, { backgroundColor: withOpacity(colors.primary, 0.08), borderColor: withOpacity(colors.primary, 0.3) }]}> 
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

      <Modal
        visible={errorDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={closeErrorDialog}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.alertIcon, { backgroundColor: withOpacity(colors.danger, 0.12) }]}> 
              <AlertTriangle size={28} color={colors.danger} />
            </View>
            <Text style={[styles.alertTitle, { color: colors.text }]}>Não foi possível continuar</Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {errorMessage || 'Não conseguimos concluir sua solicitação. Tente novamente em instantes.'}
            </Text>
            <TouchableOpacity
              style={[styles.alertPrimaryButton, { backgroundColor: colors.danger }]}
              onPress={closeErrorDialog}
              activeOpacity={0.7}
            >
              <Text style={styles.alertPrimaryText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={successDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSuccess}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <View style={[styles.alertIcon, { backgroundColor: withOpacity(colors.success, 0.12) }]}> 
              <CheckCircle2 size={28} color={colors.success} />
            </View>
            <Text style={[styles.alertTitle, { color: colors.text }]}>Senha redefinida</Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {successMessage || 'Tudo certo! Redirecionando você para o login.'}
            </Text>
            <TouchableOpacity
              style={[styles.alertPrimaryButton, { backgroundColor: colors.primary }]}
              onPress={handleCloseSuccess}
              activeOpacity={0.7}
            >
              <LogIn size={18} color="#FFFFFF" />
              <Text style={styles.alertPrimaryText}>Ir para o login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function withOpacity(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    let hex = color.slice(1);

    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }

    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);

  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
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
  alertCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  alertPrimaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  alertPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
