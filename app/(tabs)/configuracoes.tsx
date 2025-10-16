import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Card } from '@/src/components/Card';
import { InputMask } from '@/src/components/InputMask';
import { Picker } from '@/src/components/Picker';
import { Button } from '@/src/components/Button';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
  fetchCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '@/src/store/slices/categoriasSlice';
import {
  fetchContas,
  createConta,
  updateConta,
  deleteConta,
} from '@/src/store/slices/contasSlice';
import {
  fetchUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '@/src/store/slices/usuariosSlice';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Tag,
  CreditCard,
  User,
  X,
} from 'lucide-react-native';
import { formatCurrencyBR } from '@/src/utils/format';
import { useForm, Controller } from 'react-hook-form';
import { logout } from '@/src/store/slices/authSlice';

type ConfigSection = 'categorias' | 'contas' | 'usuarios' | null;

export default function ConfiguracoesScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ConfigSection>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categorias = useAppSelector((state) => state.categorias.items);
  const contas = useAppSelector((state) => state.contas.items);
  const usuarios = useAppSelector((state) => state.usuarios.items);
  const { user: authUser, initializing: authInitializing } = useAppSelector((state) => state.auth);

  const { control: categoriaControl, handleSubmit: handleCategoriaSubmit, setValue: setCategoriaValue, reset: resetCategoria } = useForm({
    defaultValues: { nome: '', tipo: 'Receita', cor: '#3B82F6', observacoes: '' },
  });

  const { control: contaControl, handleSubmit: handleContaSubmit, setValue: setContaValue, reset: resetConta } = useForm({
    defaultValues: { nome: '', tipo: '', saldo: '', observacoes: '' },
  });

  const { control: usuarioControl, handleSubmit: handleUsuarioSubmit, setValue: setUsuarioValue, reset: resetUsuario } = useForm({
    defaultValues: { nome: '', email: '', tipo_acesso: 'Colaborador', status: 'Ativo' },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchCategorias());
    dispatch(fetchContas());
    dispatch(fetchUsuarios());
  };

  const resetUIState = useCallback(() => {
    setActiveSection(null);
    setModalVisible(false);
    setEditingId(null);
  }, []);

  const confirmLogout = useCallback(async () => {
    if (Platform.OS === 'web') {
      return window.confirm('Deseja realmente sair da sua conta?');
    }

    return await new Promise<boolean>((resolve) => {
      Alert.alert('Encerrar sessão', 'Deseja realmente sair da sua conta?', [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Sair', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  }, []);

  useEffect(() => {
    if (!authInitializing && !authUser) {
      resetUIState();
      router.replace('/login' as never);
    }
  }, [authInitializing, authUser, resetUIState, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openModal = (section: ConfigSection, item?: any) => {
    setActiveSection(section);
    if (item) {
      setEditingId(item.id);
      if (section === 'categorias') {
        setCategoriaValue('nome', item.nome);
        setCategoriaValue('tipo', item.tipo);
        setCategoriaValue('cor', item.cor || '#3B82F6');
        setCategoriaValue('observacoes', item.observacoes || '');
      } else if (section === 'contas') {
        setContaValue('nome', item.nome);
        setContaValue('tipo', item.tipo);
        setContaValue('saldo', String(item.saldo));
        setContaValue('observacoes', item.observacoes || '');
      } else if (section === 'usuarios') {
        setUsuarioValue('nome', item.nome);
        setUsuarioValue('email', item.email);
        setUsuarioValue('tipo_acesso', item.tipo_acesso);
        setUsuarioValue('status', item.status);
      }
    } else {
      setEditingId(null);
      resetCategoria();
      resetConta();
      resetUsuario();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setActiveSection(null);
  };

  const onSubmitCategoria = async (data: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await dispatch(updateCategoria({ id: editingId, data })).unwrap();
        Alert.alert('Sucesso', 'Categoria atualizada!');
      } else {
        await dispatch(createCategoria(data)).unwrap();
        Alert.alert('Sucesso', 'Categoria cadastrada!');
      }
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitConta = async (data: any) => {
    try {
      setLoading(true);
      const saldoNumerico = parseFloat(data.saldo.replace(/[^\d,]/g, '').replace(',', '.'));
      const contaData = { ...data, saldo: saldoNumerico };
      if (editingId) {
        await dispatch(updateConta({ id: editingId, data: contaData })).unwrap();
        Alert.alert('Sucesso', 'Conta atualizada!');
      } else {
        await dispatch(createConta(contaData)).unwrap();
        Alert.alert('Sucesso', 'Conta cadastrada!');
      }
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitUsuario = async (data: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await dispatch(updateUsuario({ id: editingId, data })).unwrap();
        Alert.alert('Sucesso', 'Usuário atualizado!');
      } else {
        await dispatch(createUsuario(data)).unwrap();
        Alert.alert('Sucesso', 'Usuário cadastrado!');
      }
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    const confirmed = await confirmLogout();
    if (!confirmed) return;

    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível encerrar a sessão. Tente novamente.');
    }
  }, [confirmLogout, dispatch]);

  const handleLogoutPress = useCallback(() => {
    void handleLogout();
  }, [handleLogout]);

  const handleDelete = (section: ConfigSection, id: string) => {
    Alert.alert('Confirmar exclusão', 'Deseja realmente excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          if (section === 'categorias') dispatch(deleteCategoria(id));
          else if (section === 'contas') dispatch(deleteConta(id));
          else if (section === 'usuarios') dispatch(deleteUsuario(id));
        },
      },
    ]);
  };

  const renderCategoriaItem = ({ item }: any) => (
    <Card style={{ marginBottom: 8 }}>
      <View style={styles.listItem}>
        <View style={[styles.colorDot, { backgroundColor: item.cor }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.nome}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{item.tipo}</Text>
        </View>
        <TouchableOpacity onPress={() => openModal('categorias', item)} style={styles.iconButton}>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete('categorias', item.id)} style={styles.iconButton}>
          <Trash2 size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderContaItem = ({ item }: any) => (
    <Card style={{ marginBottom: 8 }}>
      <View style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.nome}</Text>
            <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}> 
              {item.tipo} • {formatCurrencyBR(item.saldo)}
            </Text>
        </View>
        <TouchableOpacity onPress={() => openModal('contas', item)} style={styles.iconButton}>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete('contas', item.id)} style={styles.iconButton}>
          <Trash2 size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderUsuarioItem = ({ item }: any) => (
    <Card style={{ marginBottom: 8 }}>
      <View style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.nome}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
            {item.email} • {item.tipo_acesso}
          </Text>
        </View>
        <TouchableOpacity onPress={() => openModal('usuarios', item)} style={styles.iconButton}>
          <Edit2 size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete('usuarios', item.id)} style={styles.iconButton}>
          <Trash2 size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderSection = () => {
    if (!activeSection) {
      return (
        <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {authUser && (
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.userCard}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {authUser.nome}
                    {authUser.sobrenome ? ` ${authUser.sobrenome}` : ''}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{authUser.email}</Text>
                </View>
                <Button title="Sair" variant="danger" onPress={handleLogoutPress} />
              </View>
            </Card>
          )}

          <TouchableOpacity onPress={() => setActiveSection('categorias')}>
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.menuItem}>
                <Tag size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Categorias</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                    {categorias.length} cadastradas
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveSection('contas')}>
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.menuItem}>
                <CreditCard size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Contas</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                    {contas.length} cadastradas
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveSection('usuarios')}>
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.menuItem}>
                <User size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Usuários</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                    {usuarios.length} cadastrados
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setActiveSection(null)}>
            <Text style={[styles.backButton, { color: colors.primary }]}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal(activeSection)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <FlatList<any>
          data={
            activeSection === 'categorias'
              ? categorias
              : activeSection === 'contas'
              ? contas
              : usuarios
          }
          renderItem={
            activeSection === 'categorias'
              ? renderCategoriaItem
              : activeSection === 'contas'
              ? renderContaItem
              : renderUsuarioItem
          }
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
      </View>

      {renderSection()}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Editar' : 'Novo'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {activeSection === 'categorias' && (
                <>
                  <Controller
                    control={categoriaControl}
                    name="nome"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Nome *" value={value} onChangeText={(text) => onChange(text)} placeholder="Nome da categoria" />
                    )}
                  />
                  <Controller
                    control={categoriaControl}
                    name="tipo"
                    render={({ field: { onChange, value } }) => (
                      <Picker label="Tipo *" value={value} items={[{ label: 'Receita', value: 'Receita' }, { label: 'Despesa', value: 'Despesa' }]} onValueChange={onChange} />
                    )}
                  />
                  <Controller
                    control={categoriaControl}
                    name="cor"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Cor" value={value} onChangeText={(text) => onChange(text)} placeholder="#3B82F6" />
                    )}
                  />
                  <Controller
                    control={categoriaControl}
                    name="observacoes"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Observações" value={value} onChangeText={(text) => onChange(text)} placeholder="Observações" />
                    )}
                  />
                  <Button title={editingId ? 'Atualizar' : 'Cadastrar'} onPress={handleCategoriaSubmit(onSubmitCategoria)} loading={loading} />
                </>
              )}

              {activeSection === 'contas' && (
                <>
                  <Controller
                    control={contaControl}
                    name="nome"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Nome *" value={value} onChangeText={(text) => onChange(text)} placeholder="Nome da conta" />
                    )}
                  />
                  <Controller
                    control={contaControl}
                    name="tipo"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Tipo *" value={value} onChangeText={(text) => onChange(text)} placeholder="Corrente, Poupança..." />
                    )}
                  />
                  <Controller
                    control={contaControl}
                    name="saldo"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Saldo *" value={value} onChangeText={(text) => onChange(text)} placeholder="R$ 0,00" keyboardType="numeric" />
                    )}
                  />
                  <Controller
                    control={contaControl}
                    name="observacoes"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Observações" value={value} onChangeText={(text) => onChange(text)} placeholder="Observações" />
                    )}
                  />
                  <Button title={editingId ? 'Atualizar' : 'Cadastrar'} onPress={handleContaSubmit(onSubmitConta)} loading={loading} />
                </>
              )}

              {activeSection === 'usuarios' && (
                <>
                  <Controller
                    control={usuarioControl}
                    name="nome"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="Nome *" value={value} onChangeText={(text) => onChange(text)} placeholder="Nome completo" />
                    )}
                  />
                  <Controller
                    control={usuarioControl}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <InputMask label="E-mail *" value={value} onChangeText={(text) => onChange(text)} placeholder="email@exemplo.com" keyboardType="email-address" />
                    )}
                  />
                  <Controller
                    control={usuarioControl}
                    name="tipo_acesso"
                    render={({ field: { onChange, value } }) => (
                      <Picker label="Tipo de Acesso *" value={value} items={[{ label: 'Administrador', value: 'Administrador' }, { label: 'Colaborador', value: 'Colaborador' }]} onValueChange={onChange} />
                    )}
                  />
                  <Controller
                    control={usuarioControl}
                    name="status"
                    render={({ field: { onChange, value } }) => (
                      <Picker label="Status *" value={value} items={[{ label: 'Ativo', value: 'Ativo' }, { label: 'Inativo', value: 'Inativo' }]} onValueChange={onChange} />
                    )}
                  />
                  <Button title={editingId ? 'Atualizar' : 'Cadastrar'} onPress={handleUsuarioSubmit(onSubmitUsuario)} loading={loading} />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  scrollView: { flex: 1, padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { fontSize: 16, fontWeight: '600' },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backButton: { fontSize: 16, fontWeight: '600' },
  addButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemSubtitle: { fontSize: 12, marginTop: 2 },
  iconButton: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalScroll: { paddingHorizontal: 16, paddingBottom: 20 },
});
