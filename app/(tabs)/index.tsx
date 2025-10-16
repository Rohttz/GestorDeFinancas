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
import { InputMask } from '@/src/components/InputMask';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { fetchRendas } from '@/src/store/slices/rendasSlice';
import { fetchDespesas } from '@/src/store/slices/despesasSlice';
import { fetchCategorias } from '@/src/store/slices/categoriasSlice';
import { fetchMetas } from '@/src/store/slices/metasSlice';
import { PieChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Target, DollarSign, Moon, Sun } from 'lucide-react-native';
import { MotiView } from 'moti';
import { formatCurrencyBR } from '@/src/utils/format';

export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [dataInicial, setDataInicial] = useState<string>(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return `${String(first.getDate()).padStart(2, '0')}-${String(first.getMonth() + 1).padStart(2, '0')}-${first.getFullYear()}`;
  });
  const [dataFinal, setDataFinal] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });

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

  const parseDateString = (s: string): Date | null => {
    if (!s) return null;
    // Support DD-MM-YYYY or YYYY-MM-DD
    const partsDash = s.split('-');
    if (partsDash.length === 3) {
      // detect order by length of first part
      if (partsDash[0].length === 4) {
        // YYYY-MM-DD
        const [y, m, d] = partsDash;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return isNaN(date.getTime()) ? null : date;
      } else {
        // DD-MM-YYYY
        const [d, m, y] = partsDash;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return isNaN(date.getTime()) ? null : date;
      }
    }
    return null;
  };

  const filterByRange = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const itemDate = parseDateString(dateStr) || new Date(dateStr);
    if (!itemDate || isNaN(itemDate.getTime())) return false;
    const start = parseDateString(dataInicial);
    const end = parseDateString(dataFinal);
    if (!start || !end) return true;
    // normalize time to include entire day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return itemDate >= start && itemDate <= end;
  };

  const rendasFiltradas = rendas.filter((r) => filterByRange(r.data_recebimento));
  const despesasFiltradas = despesas.filter((d) => filterByRange(d.data_pagamento));

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
        <View style={[styles.periodContainer]}> 
          <View style={{ flex: 1, marginRight: 8 }}>
            <InputMask
              label="Data inicial"
              value={dataInicial}
              onChangeText={(text) => setDataInicial(text)}
              mask="99-99-9999"
              placeholder="DD-MM-AAAA"
              style={{ width: '100%' }}
            />
          </View>

          <View style={{ flex: 1 }}>
            <InputMask
              label="Data final"
              value={dataFinal}
              onChangeText={(text) => setDataFinal(text)}
              mask="99-99-9999"
              placeholder="DD-MM-AAAA"
              style={{ width: '100%' }}
            />
          </View>
        </View>

        <View style={styles.cardsRow}>
          <Card style={styles.summaryCard} animated>
            <TrendingUp size={24} color={colors.success} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Receitas</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrencyBR(totalReceitas)}
            </Text>
          </Card>

          <Card style={styles.summaryCard} animated>
            <TrendingDown size={24} color={colors.danger} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Despesas</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {formatCurrencyBR(totalDespesas)}
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
            {formatCurrencyBR(saldo)}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
