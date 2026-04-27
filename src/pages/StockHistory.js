import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import {
    MdHistory,
    MdArrowUpward,
    MdArrowDownward,
    MdSwapHoriz,
    MdFilterList,
} from 'react-icons/md';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Select from '../components/Select';


// ─── Styled ───────────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;
const PageTitle = styled.h1`font-size:${({ theme }) => theme.fontSizes['3xl']};font-weight:${({ theme }) => theme.fontWeights.bold};`;
const PageSubtitle = styled.p`color:${({ theme }) => theme.colors.textSecondary};font-size:${({ theme }) => theme.fontSizes.sm};margin-top:4px;`;

const FiltersBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const FilterGroup = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;



const DateInput = styled.input`
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: 7px 10px;
  outline: none;
  transition: ${({ theme }) => theme.transition};
  &:focus { border-color: ${({ theme }) => theme.colors.borderFocus}; }
  &::-webkit-calendar-picker-indicator { opacity: 0.6; cursor: pointer; }
`;

const ClearBtn = styled.button`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.dangerLight};
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 5px 10px;
  cursor: pointer;
  transition: ${({ theme }) => theme.transition};
  &:hover { background: ${({ theme }) => theme.colors.danger}; color: #fff; }
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ accent }) => accent || 'transparent'};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SummaryLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const SummaryValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ color }) => color || 'inherit'};
`;

const TableWrap = styled.div`overflow-x: auto;`;

const Table = styled.table`width: 100%; border-collapse: collapse;`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 13px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: ${({ theme }) => theme.transition};
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:last-child td { border-bottom: none; }
`;

const TypeIcon = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 1rem;
  color: ${({ color }) => color};
`;

const QtyDelta = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ $positive, theme }) => $positive ? theme.colors.success : theme.colors.danger};
`;

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    entry: { label: 'Entrada', variant: 'success', icon: <MdArrowUpward />, color: '#059669', positive: true },
    exit: { label: 'Saída', variant: 'danger', icon: <MdArrowDownward />, color: '#DC2626', positive: false },
    adjustment: { label: 'Ajuste', variant: 'info', icon: <MdSwapHoriz />, color: '#2563EB', positive: null },
};

// ─── Component ────────────────────────────────────────────────────────────────
const StockHistory = () => {
    const { state } = useApp();

    const [filterProduct, setFilterProduct] = useState('');
    const [filterType, setFilterType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');


    // 🔥 1. FUNÇÃO PRIMEIRO
    const getMovementType = (m) => {
        const type = m.type?.toUpperCase();

        if (type === "BONUS" || type === "IN") return "entry";

        if (type === "OUT") return "exit";

        if (type === "TRANSFER") {
            return m.newQuantity > m.previousQuantity ? "entry" : "exit";
        }

        return "adjustment";
    };

    // 🔥 2. FILTERED DEPOIS
    const filtered = useMemo(() => {
        return state.stockMovements.filter((m) => {
            if (filterProduct && m.productId !== filterProduct) return false;

            if (filterType && getMovementType(m) !== filterType) return false;

            if (dateFrom && new Date(m.createdAt) < new Date(dateFrom)) return false;

            if (dateTo && new Date(m.createdAt) > new Date(dateTo + 'T23:59:59')) return false;

            return true;
        });
    }, [state.stockMovements, filterProduct, filterType, dateFrom, dateTo]);

    // 🔥 3. TOTALS POR ÚLTIMO
    const totals = useMemo(() => ({
        entry: filtered
            .filter((m) => getMovementType(m) === "entry")
            .reduce((acc, m) => acc + (m.newQuantity - m.previousQuantity), 0),

        exit: filtered
            .filter((m) => getMovementType(m) === "exit")
            .reduce((acc, m) => acc + Math.abs(m.newQuantity - m.previousQuantity), 0),

    }), [filtered]);

    // 🔥 KPI BONIFICAÇÃO
    const totalBonus = useMemo(() => {
        return filtered.reduce((acc, m) => {
            if (m.reference?.toUpperCase().includes("BONIFICA")) {
                const delta = m.newQuantity - m.previousQuantity;

                console.log("BONUS:", m.productName, delta);

                return acc + delta;
            }

            return acc;
        }, 0);
    }, [filtered]);

    // 🔥 KPI CONSUMO
    const totalConsumption = useMemo(() => {
        return filtered
            .filter((m) => m.type?.toUpperCase() === "OUT")
            .reduce((acc, m) => acc + Math.abs(m.newQuantity - m.previousQuantity), 0);
    }, [filtered]);



    const hasFilters = filterProduct || filterType || dateFrom || dateTo;

    const clearFilters = () => {
        setFilterProduct('');
        setFilterType('');
        setDateFrom('');
        setDateTo('');
    };

    // Unique products
    const movementProducts = useMemo(() => {
        const seen = new Map();
        state.stockMovements.forEach((m) => {
            if (!seen.has(m.productId)) seen.set(m.productId, m.productName);
        });
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [state.stockMovements]);

    return (
        <>
            <PageHeader>
                <div>
                    <PageTitle>Histórico de Estoque</PageTitle>
                    <PageSubtitle>
                        {state.stockMovements.length} movimento(s) registrado(s) no total
                    </PageSubtitle>
                </div>
            </PageHeader>

            {/* Filters */}
            <FiltersBar>
                <MdFilterList style={{ color: '#0066CC', flexShrink: 0 }} />

                <FilterGroup>
                    Produto:
                    <Select value={filterProduct} onChange={setFilterProduct}
                        options={[
                            { value: "", label: "Todos" },
                            ...movementProducts.map(p => ({ value: p.id, label: p.name }))
                        ]}
                    />
                </FilterGroup>

                <FilterGroup>
                    Tipo:
                    <Select value={filterType} onChange={setFilterType}
                        options={[
                            { value: "", label: "Todos" },
                            { value: "entry", label: "Entrada" },
                            { value: "exit", label: "Saída" }
                        ]}
                    />
                </FilterGroup>

                <FilterGroup>
                    De:
                    <DateInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </FilterGroup>

                <FilterGroup>
                    Até:
                    <DateInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </FilterGroup>

                {hasFilters && <ClearBtn onClick={clearFilters}>Limpar</ClearBtn>}
            </FiltersBar>

            {/* Summary */}
            <SummaryRow>
                <SummaryCard accent="#0066CC">
                    <SummaryLabel>Total filtrado</SummaryLabel>
                    <SummaryValue color="#111827">{filtered.length}</SummaryValue>
                </SummaryCard>
                <SummaryCard accent="#059669">
                    <SummaryLabel>Entradas</SummaryLabel>
                    <SummaryValue color="#059669">{totals.entry}</SummaryValue>
                </SummaryCard>
                <SummaryCard accent="#DC2626">
                    <SummaryLabel>Saídas</SummaryLabel>
                    <SummaryValue color="#DC2626">{totals.exit}</SummaryValue>
                </SummaryCard>
                <SummaryCard accent="#7C3AED">
                    <SummaryLabel>Bonificação</SummaryLabel>
                    <SummaryValue>{totalBonus}</SummaryValue>
                </SummaryCard>

                <SummaryCard accent="#DC2626">
                    <SummaryLabel>Consumo Interno</SummaryLabel>
                    <SummaryValue>{totalConsumption}</SummaryValue>
                </SummaryCard>

            </SummaryRow>

            {/* Table */}
            <Card padding="0">
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={<MdHistory />}
                        title="Nenhum movimento encontrado"
                        subtitle="Os movimentos de estoque aparecerão aqui à medida que forem registrados."
                    />
                ) : (
                    <TableWrap>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Data / Hora</Th>
                                    <Th>Produto</Th>
                                    <Th>Tipo</Th>
                                    <Th>Qtd. Movimentada</Th>
                                    <Th>Estoque Anterior</Th>
                                    <Th>Estoque Novo</Th>
                                    <Th>Referência</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m) => {
                                    const movementType = getMovementType(m);
                                    const cfg = TYPE_CONFIG[movementType];
                                    const isPositive = Number(m.newQuantity) > Number(m.previousQuantity);

                                    const product = state.products?.find(p => p.id === m.productId);
                                    const pack = Number(product?.packQuantity || 1);
                                    const pUnit = product?.purchaseUnit || 'un';
                                    const bUnit = product?.unit || 'ml';

                                    const deltaRaw = Number(m.newQuantity) - Number(m.previousQuantity);
                                    const deltaConv = deltaRaw / pack;
                                    const prevConv = Number(m.previousQuantity) / pack;
                                    const newConv = Number(m.newQuantity) / pack;

                                    return (
                                        <Tr key={m.id}>
                                            <Td style={{ whiteSpace: 'nowrap', color: '#6B7280', fontSize: '0.8rem' }}>
                                                {new Date(m.createdAt).toLocaleDateString('pt-BR')}{' '}
                                                {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </Td>
                                            <Td><strong>{m.productName}</strong></Td>
                                            <Td>
                                                <Badge variant={cfg.variant}>
                                                    <TypeIcon color={cfg.color}>{cfg.icon}</TypeIcon>
                                                    {cfg.label}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <QtyDelta $positive={isPositive}>
                                                    {isPositive ? '+' : ''}{deltaConv.toFixed(2)} {pUnit}
                                                </QtyDelta>
                                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#6B7280' }}>
                                                    ({isPositive ? '+' : ''}{deltaRaw.toFixed(0)} {bUnit})
                                                </span>
                                            </Td>
                                            <Td>
                                                <span style={{ color: '#4B5563', fontWeight: 500 }}>
                                                    {prevConv.toFixed(2)} {pUnit}
                                                </span>
                                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94A3B8' }}>
                                                    ({Number(m.previousQuantity).toFixed(0)} {bUnit})
                                                </span>
                                            </Td>
                                            <Td>
                                                <span style={{ color: '#111827', fontWeight: 600 }}>
                                                    {newConv.toFixed(2)} {pUnit}
                                                </span>
                                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94A3B8' }}>
                                                    ({Number(m.newQuantity).toFixed(0)} {bUnit})
                                                </span>
                                            </Td>
                                            <Td style={{ color: '#4B5563', fontSize: '0.8rem' }}>{m.reference}</Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </TableWrap>
                )}
            </Card>
        </>
    );
};

export default StockHistory;
