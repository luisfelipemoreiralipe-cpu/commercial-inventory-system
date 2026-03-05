import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import {
    MdRefresh,
    MdCheckCircle,
    MdDelete,
    MdShoppingCart,
    MdWarning,
} from 'react-icons/md';
import { useApp, ACTIONS } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import api from '../services/api';


// ─── Business Logic helpers ────────────────────────────────────────────────────
/**
 * Calculates suggested replenishment quantity.
 * Suggestion = max(minQuantity * 1.5, minQuantity - current + 1)
 */
const calcSuggested = (p) => {
    const result = (Number(p.minQuantity) * 2) - Number(p.quantity);
    return Math.max(1, result);
};

// ─── Styled ────────────────────────────────────────────────────────────────────
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
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: 4px;
`;

const InfoBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ theme }) => theme.colors.warningLight};
  border: 1px solid ${({ theme }) => theme.colors.warning};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 16px;
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
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
`;

const Td = styled.td`
  padding: 14px 16px;
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

const QtyInput = styled.input`
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: 6px 10px;
  width: 90px;
  outline: none;
  transition: ${({ theme }) => theme.transition};
  &:focus { border-color: ${({ theme }) => theme.colors.borderFocus}; }
`;

const SummaryBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.primaryLight};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SummaryLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SummaryValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const OrderCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  border-top: 3px solid ${({ status, theme }) =>
        status === 'completed' ? theme.colors.success : theme.colors.warning};
`;

const OrderCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const OrderDate = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const OrderItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 6px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
`;

const TotalLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
`;

const TableOverflow = styled.div`
  overflow-x: auto;
`;

// ─── Component ─────────────────────────────────────────────────────────────────


const PurchaseOrders = () => {
    const { state, dispatch, getSupplierById } = useApp();
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await api.get('/api/purchase-suggestions');
                setSuggestions(res.data.items);
                console.log("purchase suggestions:", res.data);
            } catch (err) {
                console.error('Erro ao buscar sugestões', err);
            }
        };

        fetchSuggestions();
    }, []);

    // Pending purchase list (low-stock products)
    const lowStockProducts = useMemo(
        () => state.products.filter((p) => Number(p.quantity) < Number(p.minQuantity)),
        [state.products]
    );

    // Local adjusted quantities (productId -> qty)
    const [adjustedQtys, setAdjustedQtys] = useState(() => {
        const init = {};
        lowStockProducts.forEach((p) => { init[p.id] = calcSuggested(p); });
        return init;
    });

    const [confirmComplete, setConfirmComplete] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Recalc when low stock changes
    const getAdjusted = (p) => adjustedQtys[p.id] ?? calcSuggested(p);

    const totalEstimated = useMemo(
        () => lowStockProducts.reduce((sum, p) => sum + getAdjusted(p) * Number(p.unitPrice), 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lowStockProducts, adjustedQtys]
    );
    const totalSaving = useMemo(() => {
        return suggestions.reduce((sum, s) => {
            if (!s.saving) return sum;
            return sum + (s.saving * s.suggestedQuantity);
        }, 0);
    }, [suggestions]);

    const handleGenerate = () => {
        if (lowStockProducts.length === 0) return;
        const items = lowStockProducts.map((p) => ({
            productId: p.id,
            productName: p.name,
            unit: p.unit,
            unitPrice: Number(p.unitPrice),
            suggestedQuantity: calcSuggested(p),
            adjustedQuantity: getAdjusted(p),
            supplierId: p.supplierId || null,
        }));
        dispatch({ type: ACTIONS.ADD_PURCHASE_ORDER, payload: { items } });
    };

    const handleComplete = () => {
        dispatch({ type: ACTIONS.COMPLETE_PURCHASE_ORDER, payload: confirmComplete });
        setConfirmComplete(null);
    };

    const handleDelete = () => {
        dispatch({ type: ACTIONS.DELETE_PURCHASE_ORDER, payload: deleteTarget });
        setDeleteTarget(null);
    };

    const pendingOrders = state.purchaseOrders.filter((o) => o.status === 'pending');
    const completedOrders = state.purchaseOrders.filter((o) => o.status === 'completed');

    return (
        <>
            <PageHeader>
                <div>
                    <PageTitle>Ordens de Compra</PageTitle>
                    <PageSubtitle>Gerencie e acompanhe suas ordens de reposição</PageSubtitle>
                </div>
            </PageHeader>

            {/* ── Auto Purchase List ─────────────────────────────────────────── */}
            <SectionTitle>🛒 Lista de Compras Automática</SectionTitle>
            {console.log("suggestions state:", suggestions)}
            {lowStockProducts.length === 0 ? (
                <InfoBanner>
                    ✅ Todos os produtos estão com estoque acima do mínimo. Nenhuma reposição necessária.
                </InfoBanner>
            ) : (
                <>
                    <InfoBanner>
                        <MdWarning />
                        {lowStockProducts.length} produto(s) abaixo do estoque mínimo. Ajuste as quantidades e gere a ordem.
                    </InfoBanner>

                    <SummaryBar>
                        <div>
                            <SummaryLabel>Custo Total Estimado</SummaryLabel>
                            <br />
                            <SummaryValue>{formatCurrency(totalEstimated)}</SummaryValue>
                        </div>
                        <SummaryLabel>
                            Economia possível: {formatCurrency(totalSaving)}
                        </SummaryLabel>
                        <Button onClick={handleGenerate}>
                            <MdRefresh /> Gerar Ordem de Compra
                        </Button>
                    </SummaryBar>

                    <Card padding="0">
                        <TableOverflow>
                            <Table>
                                <thead>
                                    <tr>
                                        <Th>Produto</Th>
                                        <Th>Estoque Atual</Th>
                                        <Th>Mínimo</Th>
                                        <Th>Qtd. Sugerida</Th>
                                        <Th>Qtd. Ajustada</Th>
                                        <Th>Custo Est.</Th>
                                        <Th>Melhor preço</Th>
                                        <Th>Economia</Th>
                                        <Th>Fornecedor</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockProducts.map((p) => {
                                        const suggestion = suggestions.find(
                                            (s) => s.productId === p.id
                                        );
                                        console.log("suggestion for product", p.name, suggestion);
                                        const adj = getAdjusted(p);
                                        const supplier = p.supplierId ? getSupplierById(p.supplierId) : null;
                                        return (
                                            <Tr key={p.id}>
                                                <Td><strong>{p.name}</strong></Td>
                                                <Td style={{ color: '#ef4444', fontWeight: 700 }}>
                                                    {p.quantity} {p.unit}
                                                </Td>
                                                <Td>{p.minQuantity} {p.unit}</Td>
                                                <Td>{suggestion?.suggestedQuantity ?? calcSuggested(p)} {p.unit}</Td>
                                                <Td>
                                                    <QtyInput
                                                        type="number"
                                                        min="1"
                                                        value={adj}
                                                        onChange={(e) =>
                                                            setAdjustedQtys((prev) => ({
                                                                ...prev,
                                                                [p.id]: Math.max(1, Number(e.target.value)),
                                                            }))
                                                        }
                                                    />
                                                </Td>
                                                <Td style={{ color: '#0066CC', fontWeight: 600 }}>
                                                    {formatCurrency(adj * Number(p.unitPrice))}
                                                </Td>
                                                <Td>
                                                    {suggestion?.bestPrice
                                                        ? formatCurrency(suggestion.bestPrice)
                                                        : '—'}
                                                </Td>
                                                <Td>
                                                    {suggestion?.saving > 0
                                                        ? formatCurrency(suggestion.saving)
                                                        : '—'}
                                                </Td>
                                                <Td>
                                                    {suggestion?.bestSupplierName ? (
                                                        <Badge variant="info">{suggestion.bestSupplierName}</Badge>
                                                    ) : supplier ? (
                                                        <Badge variant="info">{supplier.name}</Badge>
                                                    ) : (
                                                        <span style={{ color: '#555a72', fontSize: '0.75rem' }}>—</span>
                                                    )}
                                                </Td>
                                            </Tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </TableOverflow>
                    </Card>
                </>
            )}

            {/* ── Pending Orders ──────────────────────────────────────────────── */}
            {pendingOrders.length > 0 && (
                <>
                    <SectionTitle style={{ marginTop: '2rem' }}>⏳ Ordens Pendentes ({pendingOrders.length})</SectionTitle>
                    <OrdersGrid>
                        {pendingOrders.map((order) => {
                            const total = order.items.reduce(
                                (s, i) => s + i.adjustedQuantity * i.unitPrice,
                                0
                            );
                            return (
                                <OrderCard key={order.id} status="pending">
                                    <OrderCardHead>
                                        <div>
                                            <strong style={{ color: '#111827' }}>Ordem #{order.id.slice(-6).toUpperCase()}</strong>
                                            <OrderDate>
                                                Criada em: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                            </OrderDate>
                                        </div>
                                        <Badge variant="warning">Pendente</Badge>
                                    </OrderCardHead>

                                    <OrderItemsList>
                                        {order.items.map((item) => {
                                            const supplier = item.supplierId ? getSupplierById(item.supplierId) : null;
                                            return (
                                                <OrderItem key={item.productId}>
                                                    <span>
                                                        {item.productName}{' '}
                                                        <span style={{ color: '#6B7280' }}>
                                                            ×{item.adjustedQuantity} {item.unit}
                                                        </span>
                                                    </span>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                        <span style={{ color: '#0066CC', fontWeight: 600 }}>
                                                            {formatCurrency(item.adjustedQuantity * item.unitPrice)}
                                                        </span>
                                                        {supplier && (
                                                            <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>{supplier.name}</span>
                                                        )}
                                                    </div>
                                                </OrderItem>
                                            );
                                        })}
                                    </OrderItemsList>

                                    <TotalLine>
                                        <span>Total</span>
                                        <span style={{ color: '#0066CC' }}>{formatCurrency(total)}</span>
                                    </TotalLine>

                                    <ActionRow>
                                        <Button
                                            variant="success"
                                            size="sm"
                                            fullWidth
                                            onClick={() => setConfirmComplete(order.id)}
                                        >
                                            <MdCheckCircle /> Marcar como Concluída
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setDeleteTarget(order.id)}
                                            title="Excluir ordem"
                                        >
                                            <MdDelete />
                                        </Button>
                                    </ActionRow>
                                </OrderCard>
                            );
                        })}
                    </OrdersGrid>
                </>
            )}

            {/* ── Completed Orders ─────────────────────────────────────────────── */}
            {completedOrders.length > 0 && (
                <>
                    <SectionTitle style={{ marginTop: '2rem' }}>✅ Ordens Concluídas ({completedOrders.length})</SectionTitle>
                    <OrdersGrid>
                        {completedOrders.map((order) => {
                            const total = order.items.reduce(
                                (s, i) => s + i.adjustedQuantity * i.unitPrice,
                                0
                            );
                            return (
                                <OrderCard key={order.id} status="completed">
                                    <OrderCardHead>
                                        <div>
                                            <strong style={{ color: '#f0f2ff' }}>Ordem #{order.id.slice(-6).toUpperCase()}</strong>
                                            <OrderDate>
                                                Concluída em: {new Date(order.completedAt).toLocaleDateString('pt-BR')}
                                            </OrderDate>
                                        </div>
                                        <Badge variant="success">Concluída</Badge>
                                    </OrderCardHead>

                                    <OrderItemsList>
                                        {order.items.map((item) => (
                                            <OrderItem key={item.productId}>
                                                <span>
                                                    {item.productName}{' '}
                                                    <span style={{ color: '#6B7280' }}>×{item.adjustedQuantity} {item.unit}</span>
                                                </span>
                                                <span style={{ color: '#10b981', fontWeight: 600 }}>
                                                    {formatCurrency(item.adjustedQuantity * item.unitPrice)}
                                                </span>
                                            </OrderItem>
                                        ))}
                                    </OrderItemsList>

                                    <TotalLine>
                                        <span>Total</span>
                                        <span style={{ color: '#10b981' }}>{formatCurrency(total)}</span>
                                    </TotalLine>

                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setDeleteTarget(order.id)}
                                    >
                                        <MdDelete /> Remover Histórico
                                    </Button>
                                </OrderCard>
                            );
                        })}
                    </OrdersGrid>
                </>
            )}

            {state.purchaseOrders.length === 0 && lowStockProducts.length === 0 && (
                <EmptyState
                    icon={<MdShoppingCart />}
                    title="Nenhuma ordem de compra"
                    subtitle="Quando produtos atingirem o estoque mínimo, uma lista será gerada aqui."
                />
            )}

            {/* Complete Confirm Modal */}
            <Modal
                isOpen={!!confirmComplete}
                onClose={() => setConfirmComplete(null)}
                title="Confirmar Conclusão"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmComplete(null)}>Cancelar</Button>
                        <Button variant="success" onClick={handleComplete}>
                            <MdCheckCircle /> Confirmar
                        </Button>
                    </>
                }
            >
                <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
                    Ao confirmar, as quantidades dos produtos serão{' '}
                    <strong style={{ color: '#10b981' }}>automaticamente atualizadas</strong> com base nas
                    quantidades ajustadas desta ordem.
                </p>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Excluir Ordem"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete}>Excluir</Button>
                    </>
                }
            >
                <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
                    Tem certeza que deseja excluir esta ordem? Esta ação não pode ser desfeita.
                </p>
            </Modal>
        </>
    );
};

export default PurchaseOrders;
