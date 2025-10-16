import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Card } from '@/src/components/Card';
import { InputMask } from '@/src/components/InputMask';
import { Picker } from '@/src/components/Picker';
import { Button } from '@/src/components/Button';
import { Loading } from '@/src/components/Loading';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchMetas, createMeta, updateMeta, deleteMeta } from '@/src/store/slices/metasSlice';
import { Plus, Edit2, Trash2, Calendar, Target as TargetIcon, X } from 'lucide-react-native';
import { formatDateToDisplay, formatCurrencyBR } from '@/src/utils/format';
import { Meta } from '@/src/types/models';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  nome: yup.string().required('Nome é obrigatório'),
  valor_alvo: yup.string().required('Valor alvo é obrigatório'),
  valor_atual: yup.string().required('Valor atual é obrigatório'),
  prazo_final: yup.string().required('Prazo final é obrigatório'),
  status: yup.string().required('Status é obrigatório'),
});

type FormData = {
  nome: string;
  valor_alvo: string;
  valor_atual: string;
  prazo_final: string;
  status: string;
};

export default function MetasScreen() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const metas = useAppSelector((state) => state.metas.items);
  const loadingState = useAppSelector((state) => state.metas.loading);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      nome: '',
      valor_alvo: '',
      valor_atual: '',
      prazo_final: '',
      status: 'Em andamento',
    },
  });

  useEffect(() => {
    dispatch(fetchMetas());
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMetas());
    setRefreshing(false);
  };

  const openModal = (meta?: Meta) => {
    if (meta) {
      setEditingId(meta.id!);
      setValue('nome', meta.nome);
      setValue('valor_alvo', String(meta.valor_alvo));
      setValue('valor_atual', String(meta.valor_atual));
      // convert ISO to DD-MM-YYYY for display
      if (meta.prazo_final) {
        const d = new Date(meta.prazo_final);
        const display = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        setValue('prazo_final', display);
      } else {
        setValue('prazo_final', '');
      }
      setValue('status', meta.status);
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

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const valorAlvo = parseFloat(data.valor_alvo.replace(/[^\d,]/g, '').replace(',', '.'));
      const valorAtual = parseFloat(data.valor_atual.replace(/[^\d,]/g, '').replace(',', '.'));

      // convert display DD-MM-YYYY to ISO YYYY-MM-DD
      const dateParts = data.prazo_final.split('-');
      let isoPrazo = data.prazo_final;
      if (dateParts.length === 3) {
        const [d, m, y] = dateParts;
        isoPrazo = `${y}-${m}-${d}`;
      }

      const metaData = {
        nome: data.nome,
        valor_alvo: valorAlvo,
        valor_atual: valorAtual,
        prazo_final: isoPrazo,
        status: data.status as 'Em andamento' | 'Concluída' | 'Atrasada',
      };

      if (editingId) {
        await dispatch(updateMeta({ id: editingId, data: metaData })).unwrap();
        Alert.alert('Sucesso', 'Meta atualizada com sucesso!');
      } else {
        await dispatch(createMeta(metaData)).unwrap();
        Alert.alert('Sucesso', 'Meta cadastrada com sucesso!');
      }
      closeModal();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a meta.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirmar exclusão', 'Deseja realmente excluir esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => dispatch(deleteMeta(id)),
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Concluída') return colors.success;
    if (status === 'Atrasada') return colors.danger;
    return colors.warning;
  };

  const renderItem = ({ item }: { item: Meta }) => {
    const progresso = (Number(item.valor_atual) / Number(item.valor_alvo)) * 100;

    return (
      <Card style={{ marginBottom: 12 }} animated>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.nome}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: getStatusColor(item.status),
                  width: `${Math.min(progresso, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {progresso.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <TargetIcon size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatCurrencyBR(item.valor_atual)} de {formatCurrencyBR(item.valor_alvo)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Prazo: {new Date(item.prazo_final).toLocaleDateString('pt-BR')}
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
  };

  if (loadingState && metas.length === 0) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Metas Financeiras</Text>
      </View>

      <FlatList
        data={metas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma meta cadastrada
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Editar Meta' : 'Nova Meta'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Controller
                control={control}
                name="nome"
                render={({ field: { onChange, value } }) => (
                  <InputMask
                    label="Nome *"
                    value={value}
                    onChangeText={(text) => onChange(text)}
                    placeholder="Ex: Viagem, Reserva de emergência..."
                    error={errors.nome?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="valor_alvo"
                render={({ field: { onChange, value } }) => (
                  <InputMask
                    label="Valor Alvo *"
                    value={value}
                    onChangeText={(text) => onChange(text)}
                    placeholder="R$ 0,00"
                    keyboardType="numeric"
                    error={errors.valor_alvo?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="valor_atual"
                render={({ field: { onChange, value } }) => (
                  <InputMask
                    label="Valor Atual *"
                    value={value}
                    onChangeText={(text) => onChange(text)}
                    placeholder="R$ 0,00"
                    keyboardType="numeric"
                    error={errors.valor_atual?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="prazo_final"
                render={({ field: { onChange, value } }) => (
                  <InputMask
                    label="Prazo Final *"
                    value={value}
                    onChangeText={(text) => onChange(text)}
                    mask="99-99-9999"
                    placeholder="DD-MM-AAAA"
                    error={errors.prazo_final?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="status"
                render={({ field: { onChange, value } }) => (
                  <Picker
                    label="Status *"
                    value={value}
                    items={[
                      { label: 'Em andamento', value: 'Em andamento' },
                      { label: 'Concluída', value: 'Concluída' },
                      { label: 'Atrasada', value: 'Atrasada' },
                    ]}
                    onValueChange={onChange}
                    error={errors.status?.message}
                  />
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
}

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
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
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
});
