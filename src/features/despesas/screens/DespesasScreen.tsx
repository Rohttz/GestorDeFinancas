import React, { useEffect, useState } from 'react';
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
import { Plus, Edit2, Trash2, Calendar, DollarSign, X } from 'lucide-react-native';
import {
  formatDateToDisplay,
  formatCurrencyBR,
  formatCurrencyFromDigits,
  parseCurrencyToNumber,
} from '@/src/utils/format';
import { Despesa } from '@/src/types/models';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDialog } from '@/src/contexts/DialogContext';

const schema = yup.object({
  descricao: yup.string().required('Descrição é obrigatória'),
  valor: yup.string().required('Valor é obrigatório'),
  tipo: yup.string().oneOf(['Unica', 'Mensal']).required('Tipo é obrigatório'),
  data_pagamento: yup.string().when('tipo', (tipo: any, validation: any) => {
    return tipo === 'Unica' ? validation.required('Data é obrigatória para despesa única') : validation.notRequired();
  }),
  dia_pagamento: yup.mixed().when('tipo', (tipo: any, validation: any) => {
    return tipo === 'Mensal'
      ? yup
          .number()
          .typeError('Dia deve ser um número')
          .min(1, 'Dia deve ser entre 1 e 31')
          .max(31, 'Dia deve ser entre 1 e 31')
          .required('Dia do mês é obrigatório para despesa mensal')
      : validation.notRequired();
  }),
  categoria_id: yup.string().required('Categoria é obrigatória'),
  conta_id: yup.string().required('Conta é obrigatória'),
  pago: yup.boolean().required(),
});

const DespesasScreen = () => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { confirmDialog, showDialog } = useDialog();

  const despesas = useAppSelector((state) => state.despesas.items);
  const loadingState = useAppSelector((state) => state.despesas.loading);
  const categorias = useAppSelector((state) => state.categorias.items);
  const contas = useAppSelector((state) => state.contas.items);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: {
      descricao: '',
      valor: '',
      tipo: 'Unica',
      data_pagamento: '',
      dia_pagamento: undefined,
      categoria_id: '',
      conta_id: '',
      pago: false,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchDespesas());
    dispatch(fetchCategorias());
    dispatch(fetchContas());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openModal = (despesa?: Despesa) => {
    if (despesa) {
      setEditingId(despesa.id!);
      setValue('descricao', despesa.descricao);
      setValue('valor', formatCurrencyBR(despesa.valor));
      if (despesa.data_pagamento) {
        const d = new Date(despesa.data_pagamento);
        const display = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        setValue('data_pagamento', display);
      } else {
        setValue('data_pagamento', '');
      }
      setValue('tipo', despesa.tipo || 'Unica');
      if (despesa.dia_pagamento) setValue('dia_pagamento', String(despesa.dia_pagamento));
      setValue('categoria_id', despesa.categoria_id || '');
      setValue('conta_id', despesa.conta_id || '');
      setValue('pago', despesa.pago);
    } else {
      setEditingId(null);
      reset();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const valorNumerico = parseCurrencyToNumber(data.valor);

      let isoDate: string | undefined;
      if (data.tipo === 'Unica' && data.data_pagamento) {
        const dateParts = data.data_pagamento.split('-');
        if (dateParts.length === 3) {
          const [d, m, y] = dateParts;
          isoDate = `${y}-${m}-${d}`;
        }
      }

      const despesaData: any = {
        descricao: data.descricao,
        valor: valorNumerico,
        categoria_id: data.categoria_id,
        conta_id: data.conta_id,
        pago: data.pago,
      };

      if (data.tipo === 'Unica') {
        despesaData.tipo = 'Unica';
        if (isoDate) despesaData.data_pagamento = isoDate;
      } else {
        despesaData.tipo = 'Mensal';
        despesaData.dia_pagamento =
          typeof data.dia_pagamento === 'string' ? parseInt(data.dia_pagamento, 10) : data.dia_pagamento;
      }

      if (editingId) {
        await dispatch(updateDespesa({ id: editingId, data: despesaData })).unwrap();
        showDialog('Sucesso', 'Despesa atualizada com sucesso!');
      } else {
        await dispatch(createDespesa(despesaData)).unwrap();
        showDialog('Sucesso', 'Despesa cadastrada com sucesso!');
      }
      closeModal();
    } catch (error) {
      showDialog('Erro', 'Ocorreu um erro ao salvar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog('Confirmar exclusão', 'Deseja realmente excluir esta despesa?', {
      cancelText: 'Cancelar',
      confirmText: 'Excluir',
      destructive: true,
    });

    if (!confirmed) return;

    dispatch(deleteDespesa(id));
  };

  const getCategoriaNome = (categoriaId?: string) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nome || 'Sem categoria';
  };

  const getContaNome = (contaId?: string) => {
    const conta = contas.find((c) => c.id === contaId);
    return conta?.nome || 'Sem conta';
  };

  const renderItem = ({ item }: { item: Despesa }) => (
    <Card style={{ marginBottom: 12 }} animated>
      <View style={styles.itemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.descricao}</Text>
          <Text
            style={[styles.statusText, { color: item.pago ? colors.success : colors.warning }]}
          >
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

  const categoriasDespesa = categorias.filter((c) => c.tipo === 'Despesa');

  if (loadingState && despesas.length === 0) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => openModal()}
        >
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
                    onValueChange={(v) => onChange(v)}
                    placeholder="Selecione tipo"
                    error={errors.tipo?.message as string}
                  />
                )}
              />

              {watch('tipo') === 'Unica' && (
                <Controller
                  control={control}
                  name="data_pagamento"
                  render={({ field: { onChange, value } }) => (
                    <InputMask
                      label="Data de Pagamento *"
                      value={value || ''}
                      onChangeText={(text) => onChange(text)}
                      mask="99-99-9999"
                      placeholder="DD-MM-AAAA"
                      error={errors.data_pagamento?.message as string}
                    />
                  )}
                />
              )}

              {watch('tipo') === 'Mensal' && (
                <Controller
                  control={control}
                  name="dia_pagamento"
                  render={({ field: { onChange, value } }) => (
                    <InputMask
                      label="Dia do Mês (1-31)"
                      value={value ? String(value) : ''}
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

              <Button
                title={editingId ? 'Atualizar' : 'Cadastrar'}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
              />
            </ScrollView>
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
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  itemValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
