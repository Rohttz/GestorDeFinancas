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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Card } from '@/src/components/Card';
import { InputMask } from '@/src/components/InputMask';
import { Picker } from '@/src/components/Picker';
import { Button } from '@/src/components/Button';
import { Loading } from '@/src/components/Loading';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
  fetchDespesas,
  createDespesa,
  updateDespesa,
  deleteDespesa,
} from '@/src/store/slices/despesasSlice';
import { fetchCategorias } from '@/src/store/slices/categoriasSlice';
import { fetchContas } from '@/src/store/slices/contasSlice';
import { Plus, Edit2, Trash2, Calendar, DollarSign, X, CreditCard } from 'lucide-react-native';
import {
  formatDateToDisplay,
  formatCurrencyBR,
  formatCurrencyFromDigits,
  parseCurrencyToNumber,
} from '@/src/utils/format';
import { Despesa } from '@/src/types/models';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDialog } from '@/src/contexts/DialogContext';

type TipoDespesa = 'Unica' | 'Mensal';

type FormValues = {
  descricao: string;
  valor: string;
  tipo: TipoDespesa;
  data_pagamento: string;
  dia_pagamento: string;
  categoria_id: string;
  conta_id: string;
  pago: boolean;
};

const schema: yup.ObjectSchema<FormValues> = yup.object({
  descricao: yup.string().required('Descrição é obrigatória'),
  valor: yup.string().required('Valor é obrigatório'),
  tipo: yup
    .mixed<TipoDespesa>()
    .oneOf(['Unica', 'Mensal'], 'Tipo inválido')
    .required('Tipo é obrigatório'),
  data_pagamento: yup
    .string()
    .when('tipo', {
      is: 'Unica',
      then: (schema) => schema.required('Data é obrigatória para despesa única'),
      otherwise: (schema) => schema.optional(),
    })
    .default(''),
  dia_pagamento: yup
    .string()
    .when('tipo', {
      is: 'Mensal',
      then: (schema) =>
        schema
          .required('Dia do mês é obrigatório para despesa mensal')
          .matches(/^(?:[1-9]|[12][0-9]|3[01])$/, 'Dia deve ser entre 1 e 31'),
      otherwise: (schema) => schema.optional(),
    })
    .default(''),
  categoria_id: yup.string().required('Categoria é obrigatória'),
  conta_id: yup.string().required('Conta é obrigatória'),
  pago: yup.boolean().required(),
});

const defaultFormValues: FormValues = {
  descricao: '',
  valor: '',
  tipo: 'Unica',
  data_pagamento: '',
  dia_pagamento: '',
  categoria_id: '',
  conta_id: '',
  pago: false,
};

const DespesasScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { confirmDialog, showDialog } = useDialog();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [missingContaDialogVisible, setMissingContaDialogVisible] = useState(false);

  const despesas = useAppSelector((state) => state.despesas.items);
  const loadingDespesas = useAppSelector((state) => state.despesas.loading);
  const categorias = useAppSelector((state) => state.categorias.items);
  const contas = useAppSelector((state) => state.contas.items);
  const contasLoading = useAppSelector((state) => state.contas.loading);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: defaultFormValues,
    shouldUnregister: true,
  });

  const tipoValue = useWatch({ control, name: 'tipo' }) ?? 'Unica';

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchDespesas()),
      dispatch(fetchCategorias()),
      dispatch(fetchContas()),
    ]);
  }, [dispatch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (tipoValue === 'Mensal') {
      setValue('data_pagamento', '');
      clearErrors('data_pagamento');
    } else {
      setValue('dia_pagamento', '');
      clearErrors('dia_pagamento');
    }
  }, [tipoValue, setValue, clearErrors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

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

  const openModal = (despesa?: Despesa) => {
    if (!despesa && !contasLoading && contas.length === 0) {
      setMissingContaDialogVisible(true);
      return;
    }

    if (despesa) {
      setEditingId(despesa.id!);
      setValue('descricao', despesa.descricao ?? '');
      setValue('valor', formatCurrencyBR(despesa.valor));
      setValue('tipo', despesa.tipo || 'Unica');
      setValue('categoria_id', despesa.categoria_id || '');
      setValue('conta_id', despesa.conta_id || '');
      setValue('pago', Boolean(despesa.pago));

      if (despesa.data_pagamento) {
        const date = new Date(despesa.data_pagamento);
        const formatted = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${
          date.getFullYear()
        }`;
        setValue('data_pagamento', formatted);
      } else {
        setValue('data_pagamento', '');
      }

      if (despesa.dia_pagamento) {
        setValue('dia_pagamento', String(despesa.dia_pagamento));
      } else {
        setValue('dia_pagamento', '');
      }
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

      if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        setError('valor', {
          type: 'manual',
          message: 'Informe um valor maior que zero.',
        });
        await showDialog('Valor inválido', 'Informe um valor maior que zero para continuar.');
        return;
      }

      const sanitizeId = (value?: string) => {
        if (!value) return undefined;
        const trimmed = value.trim();
        if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return undefined;
        return trimmed;
      };

      let isoDate: string | undefined;
      if (data.tipo === 'Unica' && data.data_pagamento) {
        const parts = data.data_pagamento.split('-');
        if (parts.length === 3) {
          const [dia, mes, ano] = parts;
          isoDate = `${ano}-${mes}-${dia}`;
        }
      }

      const payload: Partial<Despesa> = {
        descricao: data.descricao,
        valor: valorNumerico,
        categoria_id: sanitizeId(data.categoria_id),
        conta_id: sanitizeId(data.conta_id),
        pago: data.pago,
      };

      if (!payload.conta_id) {
        setError('conta_id', {
          type: 'manual',
          message: 'Selecione uma conta válida.',
        });
        await showDialog('Conta obrigatória', 'Selecione uma conta antes de salvar a despesa.');
        return;
      }

      if (!payload.categoria_id) {
        setError('categoria_id', {
          type: 'manual',
          message: 'Selecione uma categoria válida.',
        });
        await showDialog('Categoria obrigatória', 'Selecione uma categoria antes de salvar a despesa.');
        return;
      }

      if (data.tipo === 'Unica') {
        payload.tipo = 'Unica';
        payload.data_pagamento = isoDate;
        payload.dia_pagamento = undefined;
      } else {
        payload.tipo = 'Mensal';
        const diaNumero = data.dia_pagamento ? parseInt(data.dia_pagamento, 10) : undefined;
        const diaValido = diaNumero && Number.isInteger(diaNumero) && diaNumero >= 1 && diaNumero <= 31;
        if (!diaValido) {
          setError('dia_pagamento', {
            type: 'manual',
            message: 'Informe um dia entre 1 e 31.',
          });
          await showDialog('Dia inválido', 'Informe um dia do mês entre 1 e 31 para despesas mensais.');
          return;
        }
        payload.dia_pagamento = diaNumero;
        payload.data_pagamento = undefined;
      }

      if (editingId) {
        await dispatch(updateDespesa({ id: editingId, data: payload })).unwrap();
        await showDialog('Sucesso', 'Despesa atualizada com sucesso!');
      } else {
        await dispatch(createDespesa(payload as Omit<Despesa, 'id' | 'created_at' | 'user_id'>)).unwrap();
        await showDialog('Sucesso', 'Despesa cadastrada com sucesso!');
      }

      closeModal();
      dispatch(fetchDespesas());
    } catch (error) {
      console.error('Erro ao salvar despesa', error);
      const message = error instanceof Error ? error.message : 'Ocorreu um erro ao salvar a despesa.';
      await showDialog('Erro', message);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = await confirmDialog('Confirmar exclusão', 'Deseja realmente excluir esta despesa?', {
        cancelText: 'Cancelar',
        confirmText: 'Excluir',
        destructive: true,
      });

      if (!confirmed) return;

      try {
        await dispatch(deleteDespesa(id)).unwrap();
        await showDialog('Sucesso', 'Despesa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir despesa', error);
        const message = error instanceof Error ? error.message : 'Ocorreu um erro ao excluir a despesa.';
        await showDialog('Erro', message);
      }
    },
    [confirmDialog, dispatch, showDialog],
  );

  const getCategoriaNome = (categoriaId?: string) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nome || 'Sem categoria';
  };

  const getContaNome = (contaId?: string) => {
    const conta = contas.find((c) => c.id === contaId);
    return conta?.nome || 'Sem conta';
  };

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'Despesa');

  const renderItem = ({ item }: { item: Despesa }) => (
    <Card style={styles.card} animated>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.descricao}</Text>
          <Text style={[styles.statusText, { color: item.pago ? colors.success : colors.warning }]}>
            {item.pago ? 'Pago' : 'Pendente'}
          </Text>
        </View>
        <Text style={[styles.itemValue, { color: colors.danger }]}>{formatCurrencyBR(item.valor)}</Text>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {item.tipo === 'Mensal'
              ? `Mensal • Dia ${item.dia_pagamento ?? '-'}`
              : `Única • ${formatDateToDisplay(item.data_pagamento)}`}
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

  if (loadingDespesas && despesas.length === 0) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }] }>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Despesas</Text>
      </View>

      <FlatList
        data={despesas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma despesa cadastrada</Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => openModal()}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Editar Despesa' : 'Nova Despesa'}
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
                    placeholder="Ex: Aluguel, Conta de luz..."
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
                    label="Tipo de Despesa *"
                    value={value}
                    items={[
                      { label: 'Despesa Única', value: 'Unica' },
                      { label: 'Despesa Mensal', value: 'Mensal' },
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
                  name="data_pagamento"
                  render={({ field: { onChange, value } }) => (
                    <InputMask
                      label="Data de Pagamento *"
                      value={value}
                      onChangeText={onChange}
                      mask="99-99-9999"
                      placeholder="DD-MM-AAAA"
                      error={errors.data_pagamento?.message as string}
                    />
                  )}
                />
              )}

              {tipoValue === 'Mensal' && (
                <Controller
                  control={control}
                  name="dia_pagamento"
                  render={({ field: { onChange, value } }) => (
                    <InputMask
                      label="Dia do Mês (1-31)"
                      value={value}
                      onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                      placeholder="Ex: 5"
                      keyboardType="numeric"
                      error={errors.dia_pagamento?.message as string}
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
                    items={categoriasDespesa.map((c) => ({ label: c.nome, value: c.id! }))}
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

              <Controller
                control={control}
                name="pago"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.switchContainer}>
                    <Text style={[styles.switchLabel, { color: colors.text }]}>Pago</Text>
                    <Switch value={value} onValueChange={onChange} />
                  </View>
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

      <Modal
        visible={missingContaDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMissingContaDialog}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContent, { backgroundColor: colors.card, borderColor: colors.border }] }>
            <View style={[styles.dialogIconContainer, { backgroundColor: colors.warning + '20' }] }>
              <CreditCard size={28} color={colors.warning} />
            </View>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Cadastre uma conta</Text>
            <Text style={[styles.dialogMessage, { color: colors.textSecondary }] }>
              Você precisa cadastrar uma conta bancária antes de registrar uma despesa.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogButton, { borderColor: colors.border }]}
                onPress={handleCloseMissingContaDialog}
              >
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

export default DespesasScreen;

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
  itemHeaderLeft: {
    gap: 4,
    flexShrink: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 18,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
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
