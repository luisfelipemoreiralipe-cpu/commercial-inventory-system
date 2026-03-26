import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import {
  MdInventory2,
  MdWarning,
  MdAttachMoney,
  MdShoppingCart,
  MdCalendarToday,
} from 'react-icons/md';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import Card from '../components/Card';

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

const StatIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgHover};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
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

  const filteredProducts = useMemo(() => {
    let list = state.products;
    if (dateFrom) list = list.filter((p) => new Date(p.createdAt) >= new Date(dateFrom));
    if (dateTo) list = list.filter((p) => new Date(p.createdAt) <= new Date(dateTo + 'T23:59:59'));
    return list;
  }, [state.products, dateFrom, dateTo]);

  const filteredValue = useMemo(
    () => filteredProducts.reduce((sum, p) => sum + Number(p.unitPrice) * Number(p.quantity), 0),
    [filteredProducts]
  );

  const lowStock = getLowStockProducts();
  const pendingOrders = state.purchaseOrders.filter((o) => o.status === 'pending');

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
          <StatIconBox bg="rgba(0,102,204,0.15)" color="#0066CC">
            <MdInventory2 />
          </StatIconBox>
          <StatInfo>
            <StatLabel>Total de Produtos</StatLabel>
            <StatValue>{filteredProducts.length}</StatValue>
            <StatSub>no período selecionado</StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#ef4444">
          <StatIconBox bg="rgba(239,68,68,0.15)" color="#ef4444">
            <MdWarning />
          </StatIconBox>
          <StatInfo>
            <StatLabel>Abaixo do Mínimo</StatLabel>
            <StatValue>{lowStock.length}</StatValue>
            <StatSub>requerem reposição</StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#1072b9ff">
          <StatIconBox bg="rgba(16,185,129,0.15)" color="#10b981">
            <MdAttachMoney />
          </StatIconBox>
          <StatInfo>
            <StatLabel>Valor do Estoque</StatLabel>
            <StatValue style={{ fontSize: '1.3rem' }}>{formatCurrency(filteredValue)}</StatValue>
            <StatSub>valor total dos produtos</StatSub>
          </StatInfo>
        </StatCard>

        <StatCard accent="#f59e0b">
          <StatIconBox bg="rgba(245,158,11,0.15)" color="#f59e0b">
            <MdShoppingCart />
          </StatIconBox>
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
                  <Th>Valor Total</Th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => {
                  const pct = p.minQuantity > 0 ? (p.quantity / p.minQuantity) * 100 : 0;
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
                      <Td>{formatCurrency(p.unitPrice * p.quantity)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </LowStockTable>
        )}
      </Card>
    </>
  );
};

export default Dashboard;
