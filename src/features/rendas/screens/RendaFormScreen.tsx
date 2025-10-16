import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { InputMask } from '@/src/components/InputMask';
import { formatCurrencyBR, formatCurrencyFromDigits, parseCurrencyToNumber } from '@/src/utils/format';
import { Picker } from '@/src/components/Picker';
import { Button } from '@/src/components/Button';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { createRenda, updateRenda, fetchRendas } from '@/src/store/slices/rendasSlice';
import { fetchCategorias } from '@/src/store/slices/categoriasSlice';
import { fetchContas } from '@/src/store/slices/contasSlice';
import { useForm, Controller, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDialog } from '@/src/contexts/DialogContext';

const schema = yup.object({
  descricao: yup.string().required('Descrição é obrigatória'),
  valor: yup.string().required('Valor é obrigatório'),
  tipo: yup.string().oneOf(['Unica', 'Mensal']).required('Tipo é obrigatório'),
  data_recebimento: yup
    .string()
    .when('tipo', {
      is: 'Unica',
      then: (schema) => schema.required('Data é obrigatória para renda única'),
      otherwise: (schema) => schema.notRequired(),
    }),
  dia_recebimento: yup
    .string()
    .when('tipo', {
      is: 'Mensal',
      then: (schema) =>
        schema
          .required('Dia do mês é obrigatório para renda mensal')
          .test('valid-day', 'Dia deve ser entre 1 e 31', (value) => {
            if (!value) return false;
            const day = Number(value);
            return Number.isInteger(day) && day >= 1 && day <= 31;
          }),
      otherwise: (schema) => schema.notRequired(),
    }),
  categoria_id: yup.string().required('Categoria é obrigatória'),
  conta_id: yup.string().required('Conta é obrigatória'),
});

type FormData = {
  descricao: string;
  valor: string;
  tipo: 'Unica' | 'Mensal';
  data_recebimento: string;
  dia_recebimento: string;
  categoria_id: string;
  conta_id: string;
};

const RendaFormScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const { showDialog, confirmDialog } = useDialog();

  const rendas = useAppSelector((state) => state.rendas.items);
  const categorias = useAppSelector((state) => state.categorias.items);
  const contas = useAppSelector((state) => state.contas.items);
  const contasLoading = useAppSelector((state) => state.contas.loading);
  const contasLength = contas.length;
  const hasPromptedForConta = useRef(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as Resolver<FormData>,
    defaultValues: {
      descricao: '',
      valor: '',
      tipo: 'Unica',
      data_recebimento: '',
      dia_recebimento: '',
      categoria_id: '',
      conta_id: '',
    },
  });

  const redirectToContaCadastro = useCallback(() => {
    router.push({
      pathname: '/(tabs)/configuracoes',
      params: { section: 'contas', action: `newConta:${Date.now()}` },
    });
  }, [router]);

  const showContaPrompt = useCallback(async () => {
    const goToAccounts = await confirmDialog(
      'Cadastre uma conta',
      'Você precisa cadastrar uma conta bancária antes de registrar uma renda. Deseja ir agora para o cadastro de contas?',
      {
        cancelText: 'Agora não',
        confirmText: 'Ir para contas',
      },
    );

    if (goToAccounts) {
      redirectToContaCadastro();
    }
  }, [confirmDialog, redirectToContaCadastro]);

  useEffect(() => {
    dispatch(fetchCategorias());
    dispatch(fetchContas());
    dispatch(fetchRendas());
  }, [dispatch]);

  useEffect(() => {
    if (!id || rendas.length === 0) return;

    const renda = rendas.find((r) => r.id === id);
    if (!renda) return;

    setValue('descricao', renda.descricao);
    setValue('valor', formatCurrencyBR(renda.valor));
    setValue('tipo', (renda.tipo as 'Unica' | 'Mensal') || 'Unica');

    if (renda.data_recebimento) {
      const d = new Date(renda.data_recebimento);
      const display = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      setValue('data_recebimento', display);
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
  }, [id, rendas, setValue]);

  useEffect(() => {
    if (id) return;
    if (contasLoading) return;
    if (hasPromptedForConta.current) return;
    if (contasLength === 0) {
      hasPromptedForConta.current = true;
      void showContaPrompt();
    }
  }, [contasLength, contasLoading, id, showContaPrompt]);

  const onSubmit = useCallback(
    async (formData: FormData) => {
      if (!id && !contasLoading && contasLength === 0) {
        await showContaPrompt();
        return;
      }

      try {
        setLoading(true);
        const valorNumerico = parseCurrencyToNumber(formData.valor);

        let isoDate: string | undefined;
        if (formData.tipo === 'Unica' && formData.data_recebimento) {
          const dateParts = formData.data_recebimento.split('-');
          if (dateParts.length === 3) {
            const [d, m, y] = dateParts;
            isoDate = `${y}-${m}-${d}`;
          }
        }

        const rendaData: any = {
          descricao: formData.descricao,
          valor: valorNumerico,
          categoria_id: formData.categoria_id,
          conta_id: formData.conta_id,
        };

        if (formData.tipo === 'Unica') {
          rendaData.tipo = 'Unica';
          if (isoDate) {
            rendaData.data_recebimento = isoDate;
          }
        } else {
          rendaData.tipo = 'Mensal';
          const dia = formData.dia_recebimento ? parseInt(formData.dia_recebimento, 10) : undefined;
          if (dia) {
            rendaData.dia_recebimento = dia;
          }
        }

        if (id) {
          await dispatch(updateRenda({ id, data: rendaData })).unwrap();
          await showDialog('Sucesso', 'Renda atualizada com sucesso!');
        } else {
          await dispatch(createRenda(rendaData)).unwrap();
          await showDialog('Sucesso', 'Renda cadastrada com sucesso!');
        }

        router.back();
      } catch (error) {
        console.error(error);
        await showDialog('Erro', 'Ocorreu um erro ao salvar a renda.');
      } finally {
        setLoading(false);
      }
    },
    [contasLength, contasLoading, dispatch, id, router, showContaPrompt, showDialog],
  );

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
              onChangeText={onChange}
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
                const formatted = formatCurrencyFromDigits(String(source));
                onChange(formatted);
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
                value={value || ''}
                onChangeText={onChange}
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
              error={
                (errors.conta_id?.message as string) ||
                (!id && contasLength === 0 ? 'Cadastre uma conta antes de registrar rendas.' : undefined)
              }
            />
          )}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={id ? 'Atualizar' : 'Cadastrar'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={!id && contasLength === 0}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default RendaFormScreen;

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
