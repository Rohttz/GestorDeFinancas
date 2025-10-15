import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Card } from '@/src/components/Card';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchRendas } from '@/src/store/slices/rendasSlice';
import { fetchDespesas } from '@/src/store/slices/despesasSlice';
import { fetchCategorias } from '@/src/store/slices/categoriasSlice';
import { fetchMetas } from '@/src/store/slices/metasSlice';
import { PieChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Target, DollarSign, Moon, Sun } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'ano'>('mes');

  const rendas = useAppSelector((state) => state.rendas.items);
  const despesas = useAppSelector((state) => state.despesas.items);
  const categorias = useAppSelector((state) => state.categorias.items);
  const metas = useAppSelector((state) => state.metas.items);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchRendas());
    dispatch(fetchDespesas());
    dispatch(fetchCategorias());
    dispatch(fetchMetas());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterByPeriod = (date: string) => {
    const itemDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (periodo === 'semana') return diffDays <= 7;
    if (periodo === 'mes') return diffDays <= 30;
    if (periodo === 'ano') return diffDays <= 365;
    return true;
  };

  const rendasFiltradas = rendas.filter((r) => filterByPeriod(r.data_recebimento));
  const despesasFiltradas = despesas.filter((d) => filterByPeriod(d.data_pagamento));

  const totalReceitas = rendasFiltradas.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalDespesas = despesasFiltradas.reduce((sum, d) => sum + Number(d.valor), 0);
  const saldo = totalReceitas - totalDespesas;

  const metasConcluidas = metas.filter((m) => m.status === 'Concluída').length;
  const metasProgresso = metas.length > 0 ? (metasConcluidas / metas.length) * 100 : 0;

  const despesasPorCategoria = categorias
    .filter((c) => c.tipo === 'Despesa')
    .map((cat) => {
      const total = despesasFiltradas
        .filter((d) => d.categoria_id === cat.id)
        .reduce((sum, d) => sum + Number(d.valor), 0);
      return {
        name: cat.nome,
        value: total,
        color: cat.cor || colors.primary,
        legendFontColor: colors.text,
        legendFontSize: 12,
      };
    })
    .filter((item) => item.value > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard Financeiro</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          {isDark ? <Sun size={24} color={colors.text} /> : <Moon size={24} color={colors.text} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.periodContainer}>
          {(['semana', 'mes', 'ano'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                {
                  backgroundColor: periodo === p ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setPeriodo(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: periodo === p ? '#FFFFFF' : colors.text },
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cardsRow}>
          <Card style={styles.summaryCard} animated>
            <TrendingUp size={24} color={colors.success} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              R$ {totalReceitas.toFixed(2)}
            </Text>
          </Card>

          <Card style={styles.summaryCard} animated>
            <TrendingDown size={24} color={colors.danger} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Despesas</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              R$ {totalDespesas.toFixed(2)}
            </Text>
          </Card>
        </View>

        <Card animated>
          <DollarSign size={24} color={saldo >= 0 ? colors.success : colors.danger} />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Saldo</Text>
          <Text
            style={[
              styles.summaryValueLarge,
              { color: saldo >= 0 ? colors.success : colors.danger },
            ]}
          >
            R$ {saldo.toFixed(2)}
          </Text>
        </Card>

        <Card animated>
          <Target size={24} color={colors.primary} />
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            Metas Concluídas
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {metasConcluidas} de {metas.length} ({metasProgresso.toFixed(0)}%)
          </Text>
        </Card>

        {despesasPorCategoria.length > 0 && (
          <Card animated>
            <Text style={[styles.chartTitle, { color: colors.text }]}>
              Despesas por Categoria
            </Text>
            <PieChart
              data={despesasPorCategoria}
              width={Dimensions.get('window').width - 64}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryValueLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});
