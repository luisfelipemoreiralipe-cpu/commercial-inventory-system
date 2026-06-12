import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import {
    MdLocalBar,
    MdCardGiftcard,
    MdLocalOffer,
    MdScience,
    MdBrokenImage,
    MdFilterList,
    MdAdd,
    MdReceiptLong
} from 'react-icons/md';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { Input } from '../components/FormFields';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Config ───────────────────────────────────────────────────────────────────
const ENTRY_TYPES = {
    DOUBLE_DRINK: {
        label: 'Drink em Dobro',
        icon: <MdLocalBar />,
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        description: 'Promoção onde o cliente paga 1 e leva 2'
    },
    COURTESY: {
        label: 'Cortesia',
        icon: <MdCardGiftcard />,
        color: '#EC4899',
        bgColor: 'rgba(236, 72, 153, 0.1)',
        description: 'Oferta gratuita para clientes VIP, influenciadores'
    },
    PROMO: {
        label: 'Promoção',
        icon: <MdLocalOffer />,
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        description: 'Happy hour, combos, descontos'
    },
    TASTING: {
        label: 'Degustação',
        icon: <MdScience />,
        color: '#06B6D4',
        bgColor: 'rgba(6, 182, 212, 0.1)',
        description: 'Teste de novos produtos'
    },
    OPERATIONAL_LOSS: {
        label: 'Perda Operacional',
        icon: <MdBrokenImage />,
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        description: 'Derramou, quebrou, descartou'
    }
};

// ─── Styled ───────────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: 4px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const KpiCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ $accent }) => $accent || 'transparent'};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  }
`;

const KpiIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  svg {
    font-size: 1.2rem;
    color: ${({ $color }) => $color};
  }
`;

const KpiLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const KpiValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ $color }) => $color || 'inherit'};
`;

const KpiSub = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

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

const TableWrap = styled.div`overflow-x: auto;`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px;
  }
`;

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

  @media (max-width: 768px) {
    display: none;
  }
`;

const Td = styled.td`
  padding: 13px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    width: 100%;

    &:before {
      content: attr(data-label);
      font-weight: 700;
      font-size: 11px;
      color: ${({ theme }) => theme.colors.textMuted};
      text-transform: uppercase;
    }

    &:last-child {
      border-bottom: none;
    }
  }
`;

const Tr = styled.tr`
  transition: ${({ theme }) => theme.transition};
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:last-child td { border-bottom: none; }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    background: ${({ theme }) => theme.colors.bgCard};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  }
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};

  svg { font-size: 0.9rem; }
`;

// Modal form
const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
`;

const TypeOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 2px solid ${({ $active, $color, theme }) =>
        $active ? $color : theme.colors.border};
  background: ${({ $active, $bg, theme }) =>
        $active ? $bg : theme.colors.bgCard};
  color: ${({ $active, $color, theme }) =>
        $active ? $color : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  font-size: 0.8rem;

  svg { font-size: 1.4rem; }

  &:hover {
    border-color: ${({ $color }) => $color};
    background: ${({ $bg }) => $bg};
    transform: translateY(-1px);
  }
`;

const NoteInput = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: 10px 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: ${({ theme }) => theme.transition};

  &:focus { border-color: ${({ theme }) => theme.colors.borderFocus}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const ResultBox = styled.div`
  padding: 12px;
  background: ${({ theme }) => theme.colors.bgHover};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function Entries() {
    const { state, fetchAllData } = useApp();

    // Filters
    const [filterType, setFilterType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [formType, setFormType] = useState('DOUBLE_DRINK');
    const [formProductId, setFormProductId] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [entries, setEntries] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loadingEntries, setLoadingEntries] = useState(true);

    const ENTRY_REASONS = useMemo(() =>
        Object.keys(ENTRY_TYPES), []);

    // ─── Fetch entries ──────────────────────────────────────────────────────
    const fetchEntries = useCallback(async () => {
        setLoadingEntries(true);
        try {
            let url = '/entries?';
            const params = new URLSearchParams();
            if (filterType) params.append('entryType', filterType);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            url += params.toString();

            const res = await api.get(url);
            const data = res.data || res || [];
            setEntries(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erro ao buscar lançamentos:", err);
        } finally {
            setLoadingEntries(false);
        }
    }, [filterType, dateFrom, dateTo]);

    const fetchSummary = useCallback(async () => {
        try {
            let url = '/entries/summary?';
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            url += params.toString();

            const res = await api.get(url);
            setSummary(res.data || res || null);
        } catch (err) {
            console.error("Erro ao buscar resumo:", err);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        fetchEntries();
        fetchSummary();
    }, [fetchEntries, fetchSummary]);

    // ─── Filtered from state (fallback + real-time) ─────────────────────────
    const entriesFromState = useMemo(() => {
        if (!state.stockMovements?.length) return [];

        let list = state.stockMovements.filter(m =>
            ENTRY_REASONS.includes(m.reason)
        );

        if (filterType) list = list.filter(m => m.reason === filterType);
        if (dateFrom) list = list.filter(m => new Date(m.createdAt) >= new Date(dateFrom));
        if (dateTo) list = list.filter(m => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59'));

        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [state.stockMovements, filterType, dateFrom, dateTo, ENTRY_REASONS]);

    // Use API entries if loaded, fallback to state
    const displayEntries = entries.length > 0 ? entries : entriesFromState;

    // ─── KPI from state (always real-time) ──────────────────────────────────
    const kpis = useMemo(() => {
        let movements = state.stockMovements || [];

        if (dateFrom) movements = movements.filter(m => new Date(m.createdAt) >= new Date(dateFrom));
        if (dateTo) movements = movements.filter(m => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59'));

        const result = {};
        for (const key of ENTRY_REASONS) {
            const filtered = movements.filter(m => m.reason === key);
            result[key] = {
                count: filtered.length,
                totalCost: filtered.reduce((sum, m) => sum + Number(m.totalCost || 0), 0)
            };
        }

        const totalCost = Object.values(result).reduce((sum, v) => sum + v.totalCost, 0);

        return { ...result, totalCost };
    }, [state.stockMovements, dateFrom, dateTo, ENTRY_REASONS]);

    // ─── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!formProductId) return toast.error("Selecione um produto");
        if (!formQuantity || Number(formQuantity) <= 0) return toast.error("Informe uma quantidade válida");

        const selectedProduct = state.products.find(p => p.id === formProductId);
        const pack = selectedProduct?.type === 'PRODUCTION' ? 1 : Number(selectedProduct?.packQuantity || 1);
        const moveQty = Number(formQuantity) * pack;

        setSubmitting(true);
        try {
            await api.post('/entries', {
                productId: formProductId,
                quantity: moveQty,
                entryType: formType,
                notes: formNotes || undefined
            });
            toast.success("Lançamento registrado com sucesso!");
            setShowModal(false);
            setFormProductId('');
            setFormQuantity('');
            setFormNotes('');
            await fetchAllData();
            await fetchEntries();
            await fetchSummary();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProduct = state.products.find(p => p.id === formProductId);
    const hasFilters = filterType || dateFrom || dateTo;

    return (
        <>
            <PageHeader>
                <div>
                    <PageTitle>Lançamentos</PageTitle>
                    <PageSubtitle>
                        Registre e acompanhe cortesias, drinks em dobro, promoções e perdas operacionais
                    </PageSubtitle>
                </div>
                <Button onClick={() => setShowModal(true)} size="md">
                    <MdAdd /> Novo Lançamento
                </Button>
            </PageHeader>

            {/* ─── KPI Cards ─────────────────────────────────────────────────────── */}
            <KpiGrid>
                {Object.entries(ENTRY_TYPES).map(([key, config]) => (
                    <KpiCard key={key} $accent={config.color}>
                        <KpiIcon $color={config.color}>
                            {config.icon}
                            <KpiLabel>{config.label}</KpiLabel>
                        </KpiIcon>
                        <KpiValue $color={config.color}>
                            {formatCurrency(kpis[key]?.totalCost || 0)}
                        </KpiValue>
                        <KpiSub>
                            {kpis[key]?.count || 0} lançamento(s) no período
                        </KpiSub>
                    </KpiCard>
                ))}

                <KpiCard $accent="#1E293B">
                    <KpiIcon $color="#1E293B">
                        <MdReceiptLong />
                        <KpiLabel>Total Geral</KpiLabel>
                    </KpiIcon>
                    <KpiValue $color="#1E293B">
                        {formatCurrency(kpis.totalCost || 0)}
                    </KpiValue>
                    <KpiSub>
                        custo total de lançamentos
                    </KpiSub>
                </KpiCard>
            </KpiGrid>

            {/* ─── Filters ───────────────────────────────────────────────────────── */}
            <FiltersBar>
                <MdFilterList style={{ color: '#0066CC', flexShrink: 0 }} />

                <FilterGroup>
                    Tipo:
                    <Select value={filterType} onChange={setFilterType}
                        options={[
                            { value: "", label: "Todos" },
                            ...Object.entries(ENTRY_TYPES).map(([key, cfg]) => ({
                                value: key,
                                label: cfg.label
                            }))
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

                {hasFilters && (
                    <ClearBtn onClick={() => { setFilterType(''); setDateFrom(''); setDateTo(''); }}>
                        Limpar
                    </ClearBtn>
                )}
            </FiltersBar>

            {/* ─── Table ─────────────────────────────────────────────────────────── */}
            <Card padding="0">
                {displayEntries.length === 0 ? (
                    <EmptyState
                        icon={<MdReceiptLong />}
                        title="Nenhum lançamento encontrado"
                        subtitle="Os lançamentos de cortesia, promoções e drink em dobro aparecerão aqui."
                    />
                ) : (
                    <TableWrap>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Data / Hora</Th>
                                    <Th>Produto</Th>
                                    <Th>Tipo</Th>
                                    <Th>Quantidade</Th>
                                    <Th>Custo</Th>
                                    <Th>Referência</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayEntries.map((m) => {
                                    const config = ENTRY_TYPES[m.reason] || {
                                        label: m.reason,
                                        icon: <MdReceiptLong />,
                                        color: '#64748B',
                                        bgColor: 'rgba(100,116,139,0.1)'
                                    };

                                    const product = state.products?.find(p => p.id === m.productId);
                                    const pack = Number(product?.packQuantity || 1);
                                    const pUnit = product?.purchaseUnit || 'un';
                                    const bUnit = product?.unit || 'ml';
                                    const qty = Math.abs(Number(m.quantity || 0));
                                    const qtyInUnits = (qty / pack).toFixed(2);

                                    return (
                                        <Tr key={m.id}>
                                            <Td data-label="Data / Hora" style={{ whiteSpace: 'nowrap', color: '#6B7280', fontSize: '0.8rem' }}>
                                                {new Date(m.createdAt).toLocaleDateString('pt-BR')}{' '}
                                                {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </Td>
                                            <Td data-label="Produto">
                                                <strong>{m.productName}</strong>
                                            </Td>
                                            <Td data-label="Tipo">
                                                <TypeBadge $color={config.color} $bg={config.bgColor}>
                                                    {config.icon} {config.label}
                                                </TypeBadge>
                                            </Td>
                                            <Td data-label="Quantidade">
                                                <span style={{ fontWeight: 600, color: '#DC2626' }}>
                                                    -{qtyInUnits} {pUnit}
                                                </span>
                                                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94A3B8' }}>
                                                    ({qty.toFixed(0)} {bUnit})
                                                </span>
                                            </Td>
                                            <Td data-label="Custo">
                                                <span style={{ fontWeight: 700, color: '#DC2626' }}>
                                                    {formatCurrency(Number(m.totalCost || 0))}
                                                </span>
                                            </Td>
                                            <Td data-label="Referência" style={{ color: '#4B5563', fontSize: '0.8rem' }}>
                                                {m.reference}
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </TableWrap>
                )}
            </Card>

            {/* ─── Modal Novo Lançamento ──────────────────────────────────────────── */}
            {showModal && (
                <Modal
                    isOpen={true}
                    title="Novo Lançamento"
                    onClose={() => setShowModal(false)}
                    maxWidth="600px"
                >
                    <FormGrid>
                        {/* Tipo */}
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px', display: 'block', color: '#64748b' }}>
                                Tipo de Lançamento
                            </label>
                            <TypeSelector>
                                {Object.entries(ENTRY_TYPES).map(([key, cfg]) => (
                                    <TypeOption
                                        key={key}
                                        $active={formType === key}
                                        $color={cfg.color}
                                        $bg={cfg.bgColor}
                                        onClick={() => setFormType(key)}
                                        type="button"
                                    >
                                        {cfg.icon}
                                        {cfg.label}
                                    </TypeOption>
                                ))}
                            </TypeSelector>
                            {formType && (
                                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '8px' }}>
                                    {ENTRY_TYPES[formType]?.description}
                                </p>
                            )}
                        </div>

                        {/* Produto */}
                        <Select
                            label="Produto"
                            value={formProductId}
                            onChange={(val) => setFormProductId(val)}
                            options={[
                                { value: '', label: 'Selecione um produto...' },
                                ...(state.products || [])
                                    .filter(p => p.isActive !== false)
                                    .map((p) => {
                                        const pack = Number(p.packQuantity || 1);
                                        const inUnits = (Number(p.quantity || 0) / pack).toFixed(2);
                                        return {
                                            value: p.id,
                                            label: `${p.name} (Estoque: ${inUnits} ${p.purchaseUnit || 'un'})`,
                                        };
                                    })
                            ]}
                        />

                        {/* Quantidade */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Input
                                label={`Quantidade (em ${selectedProduct?.purchaseUnit || 'unidades'})`}
                                type="number"
                                inputMode="decimal"
                                placeholder="0"
                                value={formQuantity}
                                onChange={(e) => setFormQuantity(e.target.value)}
                            />
                            {selectedProduct && formQuantity !== '' && (
                                <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '4px' }}>
                                    Total base: <strong>{(Number(formQuantity) * (selectedProduct.packQuantity || 1)).toFixed(0)} {selectedProduct.unit || 'ml'}</strong>
                                </span>
                            )}
                        </div>

                        {/* Preview */}
                        {selectedProduct && formQuantity && Number(formQuantity) > 0 && (() => {
                            const pack = selectedProduct.type === 'PRODUCTION' ? 1 : Number(selectedProduct.packQuantity || 1);
                            const moveAmount = Number(formQuantity) * pack;
                            const prevQty = Number(selectedProduct.quantity || 0);
                            const newQty = prevQty - moveAmount;
                            const inUnits = (newQty / pack).toFixed(2);

                            return (
                                <ResultBox>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span>Estoque atual:</span>
                                        <strong>{(prevQty / pack).toFixed(2)} {selectedProduct.purchaseUnit}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Após lançamento:</span>
                                        <strong style={{
                                            color: newQty < 0 ? "#DC2626" : "#059669",
                                            fontSize: '16px'
                                        }}>
                                            {inUnits} {selectedProduct.purchaseUnit}
                                        </strong>
                                    </div>
                                </ResultBox>
                            );
                        })()}

                        {/* Observação */}
                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#64748b' }}>
                                Observação (opcional)
                            </label>
                            <NoteInput
                                placeholder="Ex: Cliente VIP mesa 12, Promoção sexta-feira..."
                                value={formNotes}
                                onChange={(e) => setFormNotes(e.target.value)}
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            fullWidth
                            onClick={handleSubmit}
                            disabled={submitting || !formProductId || !formQuantity}
                            size="lg"
                        >
                            {submitting ? "Registrando..." : "Confirmar Lançamento"}
                        </Button>
                    </FormGrid>
                </Modal>
            )}
        </>
    );
}
