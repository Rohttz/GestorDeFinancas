import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Card } from '@/src/components/Card';
import { Loading } from '@/src/components/Loading';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchRendas, deleteRenda, createRenda, updateRenda } from '@/src/store/slices/rendasSlice';
import { fetchCategorias } from '@/src/store/slices/categoriasSlice';
import { fetchContas } from '@/src/store/slices/contasSlice';
import { Plus, Edit2, Trash2, Calendar, DollarSign, X, CreditCard } from 'lucide-react-native';
import {
  formatDateToDisplay,
  formatCurrencyBR,
  formatCurrencyFromDigits,
  parseCurrencyToNumber,
} from '@/src/utils/format';
import { Renda } from '@/src/types/models';
import { InputMask } from '@/src/components/InputMask';
import { Picker } from '@/src/components/Picker';
import { Button } from '@/src/components/Button';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDialog } from '@/src/contexts/DialogContext';

export type TipoRenda = 'Unica' | 'Mensal';

export type FormValues = {
  descricao: string;
  valor: string;
  tipo: TipoRenda;
  data_recebimento: string;
  dia_recebimento: string;
  categoria_id: string;
  conta_id: string;
};

const schema: yup.ObjectSchema<FormValues> = yup.object({
  descricao: yup.string().required('Descrição é obrigatória'),
  valor: yup.string().required('Valor é obrigatório'),
  tipo: yup
    .mixed<TipoRenda>()
    .oneOf(['Unica', 'Mensal'], 'Tipo inválido')
    .required('Tipo é obrigatório'),
  data_recebimento: yup
    .string()
    .when('tipo', {
      is: 'Unica',
      then: (schema) => schema.required('Data é obrigatória para renda única'),
      otherwise: (schema) => schema.optional(),
    })
    .default(''),
  dia_recebimento: yup
    .string()
    .when('tipo', {
      is: 'Mensal',
      then: (schema) =>
        schema
          .required('Dia do mês é obrigatório para renda mensal')
          .matches(/^(?:[1-9]|[12][0-9]|3[01])$/, 'Dia deve ser entre 1 e 31'),
      otherwise: (schema) => schema.optional(),
    })
    .default(''),
  categoria_id: yup.string().required('Categoria é obrigatória'),
  conta_id: yup.string().required('Conta é obrigatória'),
});

const defaultFormValues: FormValues = {
  descricao: '',
  valor: '',
  tipo: 'Unica',
  data_recebimento: '',
  dia_recebimento: '',
  categoria_id: '',
  conta_id: '',
};

const RendasListScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { confirmDialog, showDialog } = useDialog();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [missingContaDialogVisible, setMissingContaDialogVisible] = useState(false);

  const rendas = useAppSelector((state) => state.rendas.items);
  const loading = useAppSelector((state) => state.rendas.loading);
  const categorias = useAppSelector((state) => state.categorias.items);
  const contas = useAppSelector((state) => state.contas.items);
  const contasLoading = useAppSelector((state) => state.contas.loading);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: defaultFormValues,
    shouldUnregister: true,
  });

  const tipoValue = useWatch({ control, name: 'tipo' }) ?? 'Unica';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchRendas());
    dispatch(fetchCategorias());
    dispatch(fetchContas());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog('Confirmar exclusão', 'Deseja realmente excluir esta renda?', {
      cancelText: 'Cancelar',
      confirmText: 'Excluir',
      destructive: true,
    });

    if (!confirmed) return;

    dispatch(deleteRenda(id));
  };

  const getCategoriaNome = (categoriaId?: string) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nome || 'Sem categoria';
  };

  const getContaNome = (contaId?: string) => {
    const conta = contas.find((c) => c.id === contaId);
    return conta?.nome || 'Sem conta';
  };

  const categoriasReceita = categorias.filter((c) => c.tipo === 'Receita');

  useEffect(() => {
    if (tipoValue === 'Mensal') {
      setValue('data_recebimento', '');
      clearErrors('data_recebimento');
    } else {
      setValue('dia_recebimento', '');
      clearErrors('dia_recebimento');
    }
  }, [tipoValue, setValue, clearErrors]);

  const handleCloseMissingContaDialog = useCallback(() => {
    setMissingContaDialogVisible(false);
  }, []);

  const redirectToContaCadastro = useCallback(() => {
    setMissingContaDialogVisible(false);
    router.push({
      pathname: '/(tabs)/configuracoes',
      params: { section: 'contas', action: `newConta:${Date.now()}` },
    });
  }, [router]);

  const openModal = (renda?: Renda) => {
    if (!renda && !contasLoading && contas.length === 0) {
      setMissingContaDialogVisible(true);
      return;
    }

    if (renda) {
      setEditingId(renda.id!);
      setValue('descricao', renda.descricao ?? '');
      setValue('valor', formatCurrencyBR(renda.valor));
      setValue('tipo', renda.tipo || 'Unica');

      if (renda.data_recebimento) {
        const date = new Date(renda.data_recebimento);
        const formatted = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${
          date.getFullYear()
        }`;
        setValue('data_recebimento', formatted);
      } else {
        setValue('data_recebimento', '');
      }

      if (renda.dia_recebimento) {
        setValue('dia_recebimento', String(renda.dia_recebimento));
      } else {
        setValue('dia_recebimento', '');
      }

      setValue('categoria_id', renda.categoria_id || '');
      setValue('conta_id', renda.conta_id || '');
    } else {
      setEditingId(null);
      reset(defaultFormValues);
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    reset(defaultFormValues);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setLoadingForm(true);
      const valorNumerico = parseCurrencyToNumber(data.valor);

      let isoDate: string | undefined;
      if (data.tipo === 'Unica' && data.data_recebimento) {
        const parts = data.data_recebimento.split('-');
        if (parts.length === 3) {
          const [dia, mes, ano] = parts;
          isoDate = `${ano}-${mes}-${dia}`;
        }
      }

      const payload: any = {
        descricao: data.descricao,
        valor: valorNumerico,
        categoria_id: data.categoria_id,
        conta_id: data.conta_id,
      };

      if (data.tipo === 'Unica') {
        payload.tipo = 'Unica';
        payload.data_recebimento = isoDate;
        payload.dia_recebimento = undefined;
      } else {
        payload.tipo = 'Mensal';
        const diaNumero = data.dia_recebimento ? parseInt(data.dia_recebimento, 10) : undefined;
        payload.dia_recebimento = Number.isNaN(diaNumero) ? undefined : diaNumero;
        payload.data_recebimento = undefined;
      }

      if (editingId) {
        await dispatch(updateRenda({ id: editingId, data: payload })).unwrap();
        showDialog('Sucesso', 'Renda atualizada com sucesso!');
      } else {
        await dispatch(createRenda(payload)).unwrap();
        showDialog('Sucesso', 'Renda cadastrada com sucesso!');
      }

      closeModal();
      dispatch(fetchRendas());
    } catch (error) {
      showDialog('Erro', 'Ocorreu um erro ao salvar a renda.');
    } finally {
      setLoadingForm(false);
    }
  };

  const renderItem = ({ item }: { item: Renda }) => (
    <Card style={styles.card} animated>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.descricao}</Text>
        <Text style={[styles.itemValue, { color: colors.success }]}>{formatCurrencyBR(item.valor)}</Text>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.tipo === 'Mensal'
              ? `Mensal • Dia ${item.dia_recebimento ?? '-'}`
              : `Única • ${formatDateToDisplay(item.data_recebimento)}`}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <DollarSign size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {getCategoriaNome(item.categoria_id)} • {getContaNome(item.conta_id)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => openModal(item)}
        >
          <Edit2 size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.danger + '20' }]}
          onPress={() => handleDelete(item.id!)}
        >
          <Trash2 size={18} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading && rendas.length === 0) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }] }>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rendas</Text>
      </View>

      <FlatList
        data={rendas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }] }>
              Nenhuma renda cadastrada
            </Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => openModal()}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }] }>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }] }>
                {editingId ? 'Editar Renda' : 'Nova Renda'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Controller
                control={control}
                name="descricao"
                render={({ field: { onChange, value } }) => (
                  <InputMask
                    label="Descrição *"
                    value={value}
                    onChangeText={(text) => onChange(text)}
                    placeholder="Ex: Salário, Freelance..."
                    error={errors.descricao?.message as string}
                  />
                )}
              />

              <Controller
                control={control}
                name="valor"
                render={({ field: { onChange, value } }) => (
                  <InputMask
                    label="Valor *"
                    value={value}
                    onChangeText={(text, raw) => {
                      const source = raw || text || '';
                      onChange(formatCurrencyFromDigits(String(source)));
                    }}
                    placeholder="R$ 0,00"
                    keyboardType="numeric"
                    error={errors.valor?.message as string}
                  />
                )}
              />

              <Controller
                control={control}
                name="tipo"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Tipo de Renda *"
                    value={value}
                    items={[
                      { label: 'Renda Única', value: 'Unica' },
                      { label: 'Renda Mensal', value: 'Mensal' },
                    ]}
                    onValueChange={onChange}
                    placeholder="Selecione tipo"
                    error={errors.tipo?.message as string}
                  />
                )}
              />

              {tipoValue === 'Unica' && (
                <Controller
                  control={control}
                  name="data_recebimento"
                  render={({ field: { onChange, value } }) => (
                    <InputMask
                      label="Data de Recebimento *"
                      value={value}
                      onChangeText={(text) => onChange(text)}
                      mask="99-99-9999"
                      placeholder="DD-MM-AAAA"
                      error={errors.data_recebimento?.message as string}
                    />
                  )}
                />
              )}

              {tipoValue === 'Mensal' && (
                <Controller
                  control={control}
                  name="dia_recebimento"
                  render={({ field: { onChange, value } }) => (
                    <InputMask
                      label="Dia do Mês (1-31)"
                      value={value}
                      onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                      placeholder="Ex: 5"
                      keyboardType="numeric"
                      error={errors.dia_recebimento?.message as string}
                    />
                  )}
                />
              )}

              <Controller
                control={control}
                name="categoria_id"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Categoria *"
                    value={value}
                    items={categoriasReceita.map((c) => ({ label: c.nome, value: c.id! }))}
                    onValueChange={onChange}
                    placeholder="Selecione uma categoria"
                    error={errors.categoria_id?.message as string}
                  />
                )}
              />

              <Controller
                control={control}
                name="conta_id"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Conta *"
                    value={value}
                    items={contas.map((c) => ({ label: c.nome, value: c.id! }))}
                    onValueChange={onChange}
                    placeholder="Selecione uma conta"
                    error={errors.conta_id?.message as string}
                  />
                )}
              />

              <View style={styles.modalActions}>
                <Button
                  title={editingId ? 'Atualizar' : 'Cadastrar'}
                  onPress={handleSubmit(onSubmit)}
                  loading={loadingForm}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={missingContaDialogVisible} transparent animationType="fade" onRequestClose={handleCloseMissingContaDialog}>
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContent, { backgroundColor: colors.card, borderColor: colors.border }] }>
            <View style={[styles.dialogIconContainer, { backgroundColor: colors.warning + '20' }] }>
              <CreditCard size={28} color={colors.warning} />
            </View>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Cadastre uma conta</Text>
            <Text style={[styles.dialogMessage, { color: colors.textSecondary }] }>
              Você precisa cadastrar uma conta bancária antes de registrar uma renda.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={[styles.dialogButton, { borderColor: colors.border }]} onPress={handleCloseMissingContaDialog}>
                <Text style={[styles.dialogButtonText, { color: colors.textSecondary }]}>Agora não</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogPrimaryButton, { backgroundColor: colors.primary }]}
                onPress={redirectToContaCadastro}
              >
                <Text style={styles.dialogPrimaryButtonText}>Ir para contas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RendasListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
  },
  card: {
    padding: 16,
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modalActions: {
    marginTop: 12,
    marginBottom: 8,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  dialogIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogPrimaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dialogPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
