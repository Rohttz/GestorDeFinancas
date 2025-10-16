import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { InputMask } from '@/src/components/InputMask';
import { formatCurrencyBR } from '@/src/utils/format';
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
  tipo: yup.string().oneOf(['Unica', 'Mensal']).required('Tipo é obrigatório'),
  // If Unica, data_recebimento required. If Mensal, dia_recebimento required.
  data_recebimento: yup.string().when('tipo', (tipo: any, schema: any) => {
    return tipo === 'Unica' ? schema.required('Data é obrigatória para renda única') : schema.notRequired();
  }),
  dia_recebimento: yup.mixed().when('tipo', (tipo: any, schema: any) => {
    return tipo === 'Mensal'
      ? yup
          .number()
          .typeError('Dia deve ser um número')
          .min(1, 'Dia deve ser entre 1 e 31')
          .max(31, 'Dia deve ser entre 1 e 31')
          .required('Dia do mês é obrigatório para renda mensal')
      : schema.notRequired();
  }),
  categoria_id: yup.string().required('Categoria é obrigatória'),
  conta_id: yup.string().required('Conta é obrigatória'),
});

type FormData = {
  descricao: string;
  valor: string;
  tipo: 'Unica' | 'Mensal';
  data_recebimento?: string;
  dia_recebimento?: number | string;
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
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: {
      descricao: '',
      valor: '',
      tipo: 'Unica',
      data_recebimento: '',
      dia_recebimento: undefined,
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
        setValue('valor', formatCurrencyBR(renda.valor));
        setValue('tipo', renda.tipo || 'Unica');
        // convert ISO (YYYY-MM-DD) to DD-MM-YYYY for display
        if (renda.data_recebimento) {
          const d = new Date(renda.data_recebimento);
          const display = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
          setValue('data_recebimento', display);
        } else {
          setValue('data_recebimento', '');
        }
        if (renda.dia_recebimento) setValue('dia_recebimento', String(renda.dia_recebimento));
        setValue('categoria_id', renda.categoria_id || '');
        setValue('conta_id', renda.conta_id || '');
      }
    }
  }, [id, rendas]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const valorNumerico = parseFloat(data.valor.replace(/[^\d,]/g, '').replace(',', '.'));

      // convert display DD-MM-YYYY to ISO YYYY-MM-DD (only for Unica)
      let isoDate: string | undefined = undefined;
      if (data.tipo === 'Unica' && data.data_recebimento) {
        const dateParts = data.data_recebimento.split('-');
        if (dateParts.length === 3) {
          const [d, m, y] = dateParts;
          isoDate = `${y}-${m}-${d}`;
        }
      }

      const rendaData: any = {
        descricao: data.descricao,
        valor: valorNumerico,
        categoria_id: data.categoria_id,
        conta_id: data.conta_id,
      };

      if (data.tipo === 'Unica') {
        rendaData.tipo = 'Unica';
        if (isoDate) rendaData.data_recebimento = isoDate;
      } else {
        rendaData.tipo = 'Mensal';
        // ensure dia_recebimento is number
        rendaData.dia_recebimento = typeof data.dia_recebimento === 'string' ? parseInt(data.dia_recebimento, 10) : data.dia_recebimento;
      }

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

  const tipoValue = watch('tipo');

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
                // raw may be provided by MaskedTextInput; fallback to entered text
                const source = raw || text || '';
                // keep only digits
                const digits = String(source).replace(/\D/g, '');
                if (!digits) return onChange('');
                const cents = parseInt(digits, 10);
                const num = cents / 100;
                onChange(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num));
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
              onValueChange={(v) => onChange(v)}
              placeholder="Selecione tipo"
              error={errors.tipo?.message as string}
            />
          )}
        />

        {/* Conditional inputs based on selected tipo */}
        {tipoValue === 'Unica' && (
          <Controller
            control={control}
            name="data_recebimento"
            render={({ field: { onChange, value } }) => (
              <InputMask
                label="Data de Recebimento *"
                value={value || ''}
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
                value={value ? String(value) : ''}
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
