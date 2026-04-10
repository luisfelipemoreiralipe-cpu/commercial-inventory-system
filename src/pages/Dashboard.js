import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { MdCalendarToday } from 'react-icons/md';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import Card from '../components/Card';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer
} from "recharts";

// ─── Styled ────────────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
`;



const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const DateInput = styled.input`
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: 8px 12px;
  outline: none;
  transition: ${({ theme }) => theme.transition};
  &:focus { border-color: ${({ theme }) => theme.colors.borderFocus}; }
  &::-webkit-calendar-picker-indicator { filter: invert(0.8); }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  }
`;



const StatInfo = styled.div``;

const StatLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const StatValue = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const StatSub = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const LowStockTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${({ theme }) => theme.colors.bgHover};
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tr = styled.tr`
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

const StockBar = styled.div`
  width: 100%;
  height: 5px;
  background: ${({ theme }) => theme.colors.bgInput};
  border-radius: 999px;
  overflow: hidden;
  margin-top: 4px;
`;

const StockFill = styled.div`
  height: 100%;
  width: ${({ pct }) => Math.min(pct, 100)}%;
  background: ${({ pct, theme }) =>
    pct < 30 ? theme.colors.danger :
      pct < 60 ? theme.colors.warning :
        theme.colors.success};
  border-radius: 3px;
  transition: width 0.6s ease;
`;

const EmptyNote = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.successLight};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// ─── Component ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { state, getLowStockProducts } = useApp();

  const now = new Date();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { default: api } = await import('../services/api');
        const res = await api.get('/purchase-suggestions?days=7');
        setSuggestions(res.items || []);
      } catch (err) {
        console.error("Erro ao buscar suggestions no dashboard:", err);
      }
    };
    fetchSuggestions();
  }, []);

  const totalEstimatedPurchase = useMemo(() => {
    return suggestions.reduce((sum, s) => {
      const price = Number(s.bestPrice || 0);
      const qty = Number(s.suggestedQuantity || 0);
      return sum + (price * qty);
    }, 0);
  }, [suggestions]);

  const filteredProducts = useMemo(() => {
    return state.products || [];
  }, [state.products]);

  const filteredMovements = useMemo(() => {
    console.log("MOVEMENTS:", state.stockMovements);
    let list = state.stockMovements || [];

    if (dateFrom) {
      list = list.filter(m => new Date(m.createdAt) >= new Date(dateFrom));
    }

    if (dateTo) {
      list = list.filter(m => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59'));
    }

    console.log("MOVEMENTS:", state.stockMovements);

    return list;
  }, [state.stockMovements, dateFrom, dateTo]);

  const filteredValue = useMemo(
    () => filteredProducts.reduce(
      (sum, p) => sum + Number(p.currentCost || 0) * Number(p.quantity || 0),
      0
    ),
    [filteredProducts]
  );

  const totalConsumption = useMemo(() => {
    if (!filteredMovements?.length) return 0;

    return filteredMovements
      .filter(m => m.type === "OUT" && m.reason !== "LOSS")
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

  }, [filteredMovements]);

  const internalConsumptionValue = useMemo(() => {
    if (!filteredMovements?.length) return 0;

    return filteredMovements
      .filter(m => m.reason === "INTERNAL_USE")
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

  }, [filteredMovements]);

  const internalConsumptionPercent = useMemo(() => {
    if (!totalConsumption) return 0;

    return (internalConsumptionValue / totalConsumption) * 100;

  }, [internalConsumptionValue, totalConsumption]);

  const criticalProducts = useMemo(() => {
    if (!state.products?.length) return 0;

    return state.products.filter(
      (p) => Number(p.quantity || 0) <= Number(p.minQuantity || 0)
    ).length;

  }, [state.products]);

  const mostLossProduct = useMemo(() => {
    if (!filteredMovements?.length) return null;

    const map = {};

    filteredMovements
      .filter(m => m.reason === "LOSS")
      .forEach(m => {
        if (!map[m.productId]) {
          map[m.productId] = {
            name: m.productName,
            value: 0
          };
        }

        map[m.productId].value += Number(m.totalCost || 0);
      });

    const sorted = Object.values(map).sort((a, b) => b.value - a.value);

    return sorted[0] || null;

  }, [filteredMovements]);



  const lowStock = getLowStockProducts();
  const pendingOrders = state.purchaseOrders.filter((o) => o.status === 'pending');
  const lossValue = useMemo(() => {
    if (!filteredMovements?.length) return 0;

    return filteredMovements
      .filter((m) => m.reason === "LOSS")
      .reduce((sum, m) => {
        return sum + Number(m.totalCost || 0);
      }, 0);

  }, [filteredMovements]);
  const mostConsumedProduct = useMemo(() => {
    if (!filteredMovements?.length) return null;

    const map = {};

    filteredMovements
      .filter(m => m.type === "OUT" && m.reason !== "LOSS")
      .forEach(m => {
        if (!map[m.productId]) {
          map[m.productId] = {
            id: m.productId,
            name: m.productName,
            quantity: 0
          };
        }

        map[m.productId].quantity += Math.abs(Number(m.quantity));
      });

    const sorted = Object.values(map).sort(
      (a, b) => b.quantity - a.quantity
    );

    return sorted[0] || null;

  }, [filteredMovements]);

  const topConsumedProducts = useMemo(() => {
    if (!filteredMovements?.length) return [];

    const map = {};

    filteredMovements
      .filter(m => m.type === "OUT" && m.reason !== "LOSS")
      .forEach(m => {
        if (!map[m.productId]) {
          map[m.productId] = {
            name: m.productName,
            quantity: 0
          };
        }

        map[m.productId].quantity += Math.abs(Number(m.quantity));
      });

    const result = Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log("TOP PRODUCTS:", result);

    return result;

  }, [filteredMovements]);



  // 🔥 CONSUMO INTERNO (mantido)
  const mostInternalUse = useMemo(() => {
    if (!filteredMovements?.length) return null;

    const map = {};

    filteredMovements
      .filter(m => m.reason === "INTERNAL_USE")
      .forEach(m => {
        if (!map[m.productId]) {
          map[m.productId] = {
            id: m.productId,
            name: m.productName,
            quantity: 0
          };
        }

        map[m.productId].quantity += Number(m.quantity);
      });

    const sorted = Object.values(map).sort((a, b) => b.quantity - a.quantity);

    return sorted[0] || null;

  }, [filteredMovements]);

  const totalBonus = useMemo(() => {
    if (!filteredMovements?.length) return 0;

    return filteredMovements
      .filter(m => m.reason === "BONUS")
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

  }, [filteredMovements]);

  const totalLoss = useMemo(() => {
    if (!state.stockMovements?.length) return 0;

    return state.stockMovements
      .filter(m => m.reason === "LOSS")
      .reduce((sum, m) => sum + Number(m.totalCost || 0), 0);

  }, [state.stockMovements]);

  const topInternalUseProducts = useMemo(() => {
    if (!filteredMovements?.length) return [];

    const map = {};

    filteredMovements
      .filter(m => m.reason === "INTERNAL_USE")
      .forEach(m => {
        if (!map[m.productId]) {
          map[m.productId] = {
            name: m.productName,
            quantity: 0
          };
        }

        map[m.productId].quantity += Number(m.quantity);
      });

    const result = Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log("INTERNAL USE:", result);

    return result;

  }, [filteredMovements]);


  const marketingInvestmentValue = useMemo(() => {
    if (!filteredMovements?.length) return 0;

    const withdrawals = filteredMovements
      .filter(m => m.reason === "MARKETING_EVENT_OUT")
      .reduce((acc, m) => acc + (Math.abs(Number(m.quantity)) * Number(m.unitCost || 0)), 0);

    const returns = filteredMovements
      .filter(m => m.reason === "MARKETING_EVENT_IN")
      .reduce((acc, m) => acc + (Math.abs(Number(m.quantity)) * Number(m.unitCost || 0)), 0);

    return withdrawals - returns;
  }, [filteredMovements]);

  const internalUseTrend = useMemo(() => {
    if (!filteredMovements?.length) return [];

    const map = {};

    filteredMovements
      .filter(m => m.reason === "INTERNAL_USE")
      .forEach(m => {
        const date = new Date(m.createdAt).toLocaleDateString('pt-BR');

        if (!map[date]) {
          map[date] = {
            date,
            value: 0
          };
        }

        map[date].value += Number(m.totalCost || 0);
      });

    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));

  }, [filteredMovements]);

  return (
    <>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>
          Visão geral do seu estoque em{' '}
          {now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </PageSubtitle>
      </PageHeader>

      {/* Date Range Filter */}
      <FiltersRow>
        <MdCalendarToday color="#6B7280" />
        <FilterLabel>
          De:
          <DateInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </FilterLabel>
        <FilterLabel>
          Até:
          <DateInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </FilterLabel>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Limpar filtro
          </button>
        )}
      </FiltersRow>

      {/* Stat Cards */}
      <StatsGrid>
        <StatCard accent="#0066CC">

          <StatInfo>
            <StatLabel>Total de Produtos</StatLabel>
            <StatValue>{filteredProducts.length}</StatValue>
            <StatSub>no período selecionado</StatSub>
          </StatInfo>
        </StatCard>
        <StatCard accent="#f59e0b">


          <StatInfo>
            <StatLabel>Consumo Interno</StatLabel>

            {mostInternalUse ? (
              <>
                <StatValue style={{ fontSize: '1.1rem' }}>
                  {mostInternalUse.name}
                </StatValue>

                <StatSub>
                  {(() => {
                    const product = state.products?.find(p => p.id === mostInternalUse.id);
                    const pack = Number(product?.packQuantity || 1);
                    const unit = product?.purchaseUnit || 'un';
                    const bUnit = product?.unit || 'ml';
                    const qty = Number(mostInternalUse.quantity);
                    const inUnits = (qty / pack).toFixed(2);
                    return `${inUnits} ${unit} (${qty} ${bUnit})`;
                  })()} consumidos internamente
                </StatSub>
              </>
            ) : (
              <StatSub>Nenhum consumo interno</StatSub>
            )}
          </StatInfo>
        </StatCard>

        <StatCard accent="#7f1d1d">


          <StatInfo>
            <StatLabel>Perda Total</StatLabel>

            <StatValue style={{ fontSize: '1.3rem', color: '#b91c1c' }}>
              {formatCurrency(totalLoss)}
            </StatValue>

            <StatSub>
              prejuízo acumulado
            </StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#6366f1">

          <StatInfo>
            <StatLabel>Consumo Total</StatLabel>

            <StatValue style={{ fontSize: '1.3rem' }}>
              {formatCurrency(totalConsumption)}
            </StatValue>

            <StatSub>
              valor consumido no período
            </StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#10b981">
          <StatInfo>
            <StatLabel>Bonificação Recebida</StatLabel>
            <StatValue style={{ fontSize: '1.3rem', color: '#10b981' }}>
              {formatCurrency(totalBonus)}
            </StatValue>
            <StatSub>
              economia no período
            </StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#ec4899">
          <StatInfo>
            <StatLabel>Investimento Marketing</StatLabel>
            <StatValue style={{ fontSize: '1.3rem', color: '#ec4899' }}>
              {formatCurrency(marketingInvestmentValue)}
            </StatValue>
            <StatSub>
              custo líquido de ações
            </StatSub>
          </StatInfo>
        </StatCard>


        <StatCard accent="#7c3aed">

          <StatInfo>
            <StatLabel>Produto Mais Consumido</StatLabel>

            {mostConsumedProduct ? (
              <>
                <StatValue style={{ fontSize: '1.1rem' }}>
                  {mostConsumedProduct.name}
                </StatValue>
                <StatSub>
                  {(() => {
                    const product = state.products?.find(p => p.id === mostConsumedProduct.id);
                    const pack = Number(product?.packQuantity || 1);
                    const unit = product?.purchaseUnit || 'un';
                    const bUnit = product?.unit || 'ml';
                    const qty = Number(mostConsumedProduct.quantity);
                    const inUnits = (qty / pack).toFixed(2);
                    return `${inUnits} ${unit} (${qty} ${bUnit})`;
                  })()} consumidos no total
                </StatSub>
              </>
            ) : (
              <StatSub>Nenhum consumo registrado</StatSub>
            )}
          </StatInfo>
        </StatCard>
        <StatCard accent="#dc2626">

          <StatInfo>
            <StatLabel>Perda no Período</StatLabel>
            <StatValue style={{ fontSize: '1.3rem', color: '#dc2626' }}>
              {formatCurrency(lossValue)}
            </StatValue>
            <StatSub>valor perdido no estoque</StatSub>
          </StatInfo>
        </StatCard>
        <StatCard accent="#ef4444">

          <StatInfo>
            <StatLabel>Abaixo do Mínimo</StatLabel>
            <StatValue>{lowStock.length}</StatValue>
            <StatSub>Reposição: {formatCurrency(totalEstimatedPurchase)}</StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#b91c1c">

          <StatInfo>
            <StatLabel>Maior Perda</StatLabel>

            {mostLossProduct ? (
              <>
                <StatValue style={{ fontSize: '1.1rem' }}>
                  {mostLossProduct.name}
                </StatValue>

                <StatSub>
                  {formatCurrency(mostLossProduct.value)} perdidos
                </StatSub>
              </>
            ) : (
              <StatSub>Nenhuma perda registrada</StatSub>
            )}
          </StatInfo>
        </StatCard>

        <StatCard accent="#ef4444">

          <StatInfo>
            <StatLabel>Produtos Críticos</StatLabel>

            <StatValue>
              {criticalProducts}
            </StatValue>

            <StatSub>
              {criticalProducts > 0
                ? "requer atenção imediata"
                : "estoque sob controle"}
            </StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#f59e0b">

          <StatInfo>
            <StatLabel>% Consumo Interno</StatLabel>

            <StatValue style={{ fontSize: '1.3rem' }}>
              {internalConsumptionPercent.toFixed(1)}%
            </StatValue>

            <StatSub>
              {internalConsumptionPercent > 10
                ? "alto consumo interno"
                : "nível saudável"}
            </StatSub>
            <StatSub>
              {formatCurrency(internalConsumptionValue)} de {formatCurrency(totalConsumption)}
            </StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#1072b9ff">

          <StatInfo>
            <StatLabel>Valor do Estoque</StatLabel>
            <StatValue style={{ fontSize: '1.3rem' }}>{formatCurrency(filteredValue)}</StatValue>
            <StatSub>valor total dos produtos</StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#f59e0b">

          <StatInfo>
            <StatLabel>Ordens Pendentes</StatLabel>
            <StatValue>{pendingOrders.length}</StatValue>
            <StatSub>aguardando conclusão</StatSub>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      {/* Low Stock Table */}
      <SectionTitle>Produtos Abaixo do Estoque Mínimo</SectionTitle>
      <Card padding="0">
        {lowStock.length === 0 ? (
          <EmptyNote style={{ margin: '16px' }}>
            Todos os produtos estão com estoque adequado!
          </EmptyNote>
        ) : (
          <LowStockTable>
            <Table>
              <thead>
                <tr>
                  <Th>Produto</Th>
                  <Th>Categoria</Th>
                  <Th>Qtd. Atual</Th>
                  <Th>Estoque Mínimo</Th>
                  <Th>Progresso</Th>
                  <Th>Estimativa Reposição</Th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => {
                  const pct = p.minQuantity > 0 ? (p.quantity / p.minQuantity) * 100 : 0;
                  const suggestion = suggestions.find(s => s.productId === p.id);
                  const price = suggestion ? Number(suggestion.bestPrice || p.currentCost || p.unitPrice) : Number(p.currentCost || p.unitPrice);
                  const needs = Math.max(0, Number(p.minQuantity) - Number(p.quantity));
                  
                  return (
                    <Tr key={p.id}>
                      <Td style={{ fontWeight: 600 }}>{p.name}</Td>
                      <Td>{p.category?.name || 'N/A'}</Td>
                      <Td style={{ color: '#ef4444', fontWeight: 600 }}>
                        {p.quantity} {p.unit}
                      </Td>
                      <Td>{p.minQuantity} {p.unit}</Td>
                      <Td style={{ minWidth: 120 }}>
                        <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>{Math.round(pct)}%</span>
                        <StockBar><StockFill pct={pct} /></StockBar>
                      </Td>
                      <Td>
                        {formatCurrency(price * Math.ceil(needs))}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </LowStockTable>
        )}
      </Card>
      <SectionTitle>Top Produtos Consumidos</SectionTitle>

      <Card>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={topConsumedProducts} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const product = state.products?.find(p => p.name === data.name);
                    const pack = Number(product?.packQuantity || 1);
                    const unit = product?.purchaseUnit || 'un';
                    const baseUnit = product?.unit || 'ml';
                    const qty = Number(payload[0].value);
                    const inUnits = (qty / pack).toFixed(2);

                    return (
                      <div style={{ 
                        background: '#fff', 
                        padding: '12px', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                      }}>
                        <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: '#1E293B' }}>{data.name}</p>
                        <p style={{ color: '#F97316', fontWeight: 500, fontSize: '14px' }}>
                          {inUnits} {unit}
                          <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                            ({qty} {baseUnit})
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="quantity" name="Consumo" fill="#F97316" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionTitle>Consumo Interno por Produto</SectionTitle>

      <Card>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={topInternalUseProducts} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const product = state.products?.find(p => p.name === data.name);
                    const pack = Number(product?.packQuantity || 1);
                    const unit = product?.purchaseUnit || 'un';
                    const baseUnit = product?.unit || 'ml';
                    const qty = Number(payload[0].value);
                    const inUnits = (qty / pack).toFixed(2);

                    return (
                      <div style={{ 
                        background: '#fff', 
                        padding: '12px', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                      }}>
                        <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: '#1E293B' }}>{data.name}</p>
                        <p style={{ color: '#F97316', fontWeight: 500, fontSize: '14px' }}>
                          {inUnits} {unit}
                          <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                            ({qty} {baseUnit})
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="quantity" name="Consumo Interno" fill="#F97316" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionTitle>Evolução do Consumo Interno (R$)</SectionTitle>

      <Card>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={internalUseTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(value) => [formatCurrency(value), "Valor"]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Valor Consumido" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
};

export default Dashboard;
