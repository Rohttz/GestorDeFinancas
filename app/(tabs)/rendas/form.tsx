import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { InputMask } from '@/src/components/InputMask';
import { Picker } from '@/src/components/Picker';
import { Button } from '@/src/components/Button';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { createRenda, updateRenda, fetchRendas } from '@/src/store/slices/rendasSlice';
import { fetchCategorias } from '@/src/store/slices/categoriasSlice';
import { fetchContas } from '@/src/store/slices/contasSlice';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  descricao: yup.string().required('Descrição é obrigatória'),
  valor: yup.string().required('Valor é obrigatório'),
  data_recebimento: yup.string().required('Data é obrigatória'),
  categoria_id: yup.string().required('Categoria é obrigatória'),
  conta_id: yup.string().required('Conta é obrigatória'),
});

type FormData = {
  descricao: string;
  valor: string;
  data_recebimento: string;
  categoria_id: string;
  conta_id: string;
};

export default function RendaFormScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const rendas = useAppSelector((state) => state.rendas.items);
  const categorias = useAppSelector((state) => state.categorias.items);
  const contas = useAppSelector((state) => state.contas.items);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      descricao: '',
      valor: '',
      data_recebimento: '',
      categoria_id: '',
      conta_id: '',
    },
  });

  useEffect(() => {
    dispatch(fetchCategorias());
    dispatch(fetchContas());
    dispatch(fetchRendas());
  }, []);

  useEffect(() => {
    if (id && rendas.length > 0) {
      const renda = rendas.find((r) => r.id === id);
      if (renda) {
        setValue('descricao', renda.descricao);
        setValue('valor', String(renda.valor));
        setValue('data_recebimento', renda.data_recebimento);
        setValue('categoria_id', renda.categoria_id || '');
        setValue('conta_id', renda.conta_id || '');
      }
    }
  }, [id, rendas]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const valorNumerico = parseFloat(data.valor.replace(/[^\d,]/g, '').replace(',', '.'));

      const rendaData = {
        descricao: data.descricao,
        valor: valorNumerico,
        data_recebimento: data.data_recebimento,
        categoria_id: data.categoria_id,
        conta_id: data.conta_id,
      };

      if (id) {
        await dispatch(updateRenda({ id: id as string, data: rendaData })).unwrap();
        Alert.alert('Sucesso', 'Renda atualizada com sucesso!');
      } else {
        await dispatch(createRenda(rendaData)).unwrap();
        Alert.alert('Sucesso', 'Renda cadastrada com sucesso!');
      }
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a renda.');
    } finally {
      setLoading(false);
    }
  };

  const categoriasReceita = categorias.filter((c) => c.tipo === 'Receita');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Controller
          control={control}
          name="descricao"
          render={({ field: { onChange, value } }) => (
            <InputMask
              label="Descrição *"
              value={value}
              onChangeText={(text) => onChange(text)}
              placeholder="Ex: Salário, Freelance..."
              error={errors.descricao?.message}
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
              onChangeText={(text) => onChange(text)}
              placeholder="R$ 0,00"
              keyboardType="numeric"
              error={errors.valor?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="data_recebimento"
          render={({ field: { onChange, value } }) => (
            <InputMask
              label="Data de Recebimento *"
              value={value}
              onChangeText={(text) => onChange(text)}
              mask="9999-99-99"
              placeholder="AAAA-MM-DD"
              error={errors.data_recebimento?.message}
            />
          )}
        />

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
              error={errors.categoria_id?.message}
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
              error={errors.conta_id?.message}
            />
          )}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={id ? 'Atualizar' : 'Cadastrar'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
