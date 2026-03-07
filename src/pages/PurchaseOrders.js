import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import {
    MdRefresh,
    MdCheckCircle,
    MdDelete,
    MdShoppingCart,
    MdWarning
} from "react-icons/md";
import Modal from '../components/Modal';

import { useApp, ACTIONS } from "../context/AppContext";
import { formatCurrency } from "../utils/formatCurrency";

import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";

import api from "../services/api";





/* -------------------------------------------------------------------------- */
/*                                Styled UI                                   */
/* -------------------------------------------------------------------------- */

const StatsGrid = styled.div`
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:${({ theme }) => theme.spacing.md};
margin-bottom:${({ theme }) => theme.spacing.xl};
`;



const StatCard = styled(Card)`
display:flex;
flex-direction:column;
gap:4px;
padding:20px;
`;

const StatLabel = styled.span`
font-size:${({ theme }) => theme.fontSizes.sm};
color:${({ theme }) => theme.colors.textMuted};
`;

const StatValue = styled.span`
font-size:${({ theme }) => theme.fontSizes["2xl"]};
font-weight:${({ theme }) => theme.fontWeights.semibold};
color:${({ theme }) => theme.colors.textPrimary};
`;

const PageHeader = styled.div`
display:flex;
justify-content:space-between;
align-items:flex-start;
margin-bottom:${({ theme }) => theme.spacing.xl};
`;

const PageTitle = styled.h1`
font-size:${({ theme }) => theme.fontSizes["3xl"]};
font-weight:${({ theme }) => theme.fontWeights.bold};
`;

const PageSubtitle = styled.p`
color:${({ theme }) => theme.colors.textSecondary};
font-size:${({ theme }) => theme.fontSizes.sm};
margin-top:4px;
`;

const SectionTitle = styled.h2`
font-size:${({ theme }) => theme.fontSizes.xl};
font-weight:${({ theme }) => theme.fontWeights.semibold};
margin-bottom:${({ theme }) => theme.spacing.md};
`;

const InfoBanner = styled.div`
display:flex;
align-items:center;
gap:10px;
background:${({ theme }) => theme.colors.warningLight};
border:1px solid ${({ theme }) => theme.colors.warning};
border-radius:${({ theme }) => theme.radii.md};
padding:12px 16px;
color:${({ theme }) => theme.colors.warning};
font-size:${({ theme }) => theme.fontSizes.sm};
margin-bottom:${({ theme }) => theme.spacing.xl};
`;

const SummaryBar = styled.div`
display:flex;
justify-content:flex-end;
margin-bottom:${({ theme }) => theme.spacing.lg};
`;

const TableOverflow = styled.div`
overflow-x:auto;
`;

const Table = styled.table`
width:100%;
border-collapse:collapse;
`;

const Th = styled.th`
text-align:left;
padding:14px 16px;
font-size:${({ theme }) => theme.fontSizes.xs};
font-weight:${({ theme }) => theme.fontWeights.semibold};
color:${({ theme }) => theme.colors.textMuted};
text-transform:uppercase;
letter-spacing:0.05em;
background:${({ theme }) => theme.colors.bgHover};
border-bottom:1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
padding:14px 16px;
font-size:${({ theme }) => theme.fontSizes.sm};
border-bottom:1px solid ${({ theme }) => theme.colors.border};
`;

const Tr = styled.tr`
&:hover{
background:${({ theme }) => theme.colors.bgHover};
}
`;

const QtyInput = styled.input`
width:80px;
padding:6px;
border:1px solid ${({ theme }) => theme.colors.border};
border-radius:${({ theme }) => theme.radii.sm};
`;

const StatusBadge = styled.span`
padding:4px 10px;
border-radius:999px;
font-size:12px;
font-weight:600;

background:${({ status, theme }) =>
        status === "pending"
            ? theme.colors.warningLight
            : theme.colors.successLight};

color:${({ status, theme }) =>
        status === "pending"
            ? theme.colors.warning
            : theme.colors.success};
`;

const ActionRow = styled.div`
display:flex;
gap:6px;
`;

/* -------------------------------------------------------------------------- */
/*                               Business logic                               */
/* -------------------------------------------------------------------------- */



const calcSuggested = (p) => {
    const result = (Number(p.minQuantity) * 2) - Number(p.quantity);
    return Math.max(1, result);
};

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

const PurchaseOrders = () => {

    const { state, dispatch, getSupplierById } = useApp();

    const [suggestions, setSuggestions] = useState([]);
    const [adjustedQtys, setAdjustedQtys] = useState({});
    const [selectedSuppliers, setSelectedSuppliers] = useState({});

    useEffect(() => {

        const fetchSuggestions = async () => {
            try {
                const res = await api.get("/api/purchase-suggestions");
                console.log(res.data.data.items);
                setSuggestions(res.data.data.items || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchSuggestions();

    }, []);

    /* -------------------------------------------------------------------------- */



    const [selectedOrder, setSelectedOrder] = useState(null);

    const lowStockProducts = useMemo(() => {
        return state.products.filter(
            p => Number(p.quantity) < Number(p.minQuantity)
        );
    }, [state.products]);

    const getAdjusted = (p) => adjustedQtys[p.id] ?? calcSuggested(p);

    const totalEstimated = useMemo(() => {

        return lowStockProducts.reduce((sum, p) => {

            const suggestion = suggestions.find(
                s => s.productId === p.id
            );

            const price = suggestion?.bestPrice || Number(p.unitPrice);

            return sum + getAdjusted(p) * price;

        }, 0);

    }, [lowStockProducts, adjustedQtys, suggestions]);

    const totalSaving = useMemo(() => {

        return suggestions.reduce((sum, s) => {
            if (!s.saving) return sum;
            return sum + (s.saving * s.suggestedQuantity);
        }, 0);

    }, [suggestions]);

    /* -------------------------------------------------------------------------- */



    const handleGenerate = () => {

        if (lowStockProducts.length === 0) return;

        const groupedBySupplier = {};

        lowStockProducts.forEach((p) => {

            const suggestion = suggestions.find(
                s => s.productId === p.id
            );

            const supplierId =
                suggestion?.bestSupplierId ||
                p.supplierId ||
                "unknown";

            if (!groupedBySupplier[supplierId]) {
                groupedBySupplier[supplierId] = [];
            }

            groupedBySupplier[supplierId].push({

                productId: p.id,
                productName: p.name,
                unit: p.unit,
                unitPrice: suggestion?.bestPrice || Number(p.unitPrice),
                suggestedQuantity: suggestion?.suggestedQuantity || calcSuggested(p),
                adjustedQuantity: getAdjusted(p),
                supplierId

            });

        });

        Object.entries(groupedBySupplier).forEach(([supplierId, items]) => {

            dispatch({
                type: ACTIONS.ADD_PURCHASE_ORDER,
                payload: {
                    supplierId,
                    supplierName: getSupplierById(supplierId)?.name || "Fornecedor",
                    items
                }
            });

        });

    };

    /* -------------------------------------------------------------------------- */

    const pendingOrders = state.purchaseOrders.filter(
        o => o.status === "pending"
    );

    const completedOrders = state.purchaseOrders.filter(
        o => o.status === "completed"
    );

    /* -------------------------------------------------------------------------- */
    /*                                   UI                                       */
    /* -------------------------------------------------------------------------- */

    return (
        <>

            <PageHeader>
                <div>
                    <PageTitle>Ordens de Compra</PageTitle>
                    <PageSubtitle>
                        Gerencie e acompanhe suas ordens de reposição
                    </PageSubtitle>
                </div>
            </PageHeader>

            <StatsGrid>

                <StatCard>
                    <StatLabel>Produtos críticos</StatLabel>
                    <StatValue>{lowStockProducts.length}</StatValue>
                </StatCard>

                <StatCard>
                    <StatLabel>Custo estimado</StatLabel>
                    <StatValue>{formatCurrency(totalEstimated)}</StatValue>
                </StatCard>

                <StatCard>
                    <StatLabel>Economia possível</StatLabel>
                    <StatValue>{formatCurrency(totalSaving)}</StatValue>
                </StatCard>

            </StatsGrid>

            <SectionTitle>Lista de Compras Automática</SectionTitle>

            {lowStockProducts.length === 0 ? (

                <InfoBanner>
                    <MdWarning />
                    Todos os produtos estão com estoque adequado.
                </InfoBanner>

            ) : (

                <>

                    <SummaryBar>

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
                                        <Th>Estoque</Th>
                                        <Th>Mínimo</Th>
                                        <Th>Sugerido</Th>
                                        <Th>Ajustar</Th>
                                        <Th>Custo</Th>
                                        <Th>Melhor preço</Th>
                                        <Th>Economia</Th>
                                        <Th>Fornecedor</Th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {lowStockProducts.map((p) => {

                                        const suggestion = suggestions.find(
                                            s => s.productId === p.id
                                        );
                                        const price = suggestion?.bestPrice || p.unitPrice;

                                        const adj = getAdjusted(p);
                                        const selectedSupplierId =
                                            selectedSuppliers[p.id] ||
                                            suggestion?.bestSupplierId ||
                                            p.supplierId;


                                        return (

                                            <Tr key={p.id}>

                                                <Td>{p.name}</Td>

                                                <Td
                                                    style={{
                                                        color: p.quantity < p.minQuantity ? "#ef4444" : "inherit",
                                                        fontWeight: p.quantity < p.minQuantity ? 600 : 400
                                                    }}
                                                >
                                                    {p.quantity} {p.unit}
                                                </Td>

                                                <Td>{p.minQuantity}</Td>

                                                <Td>
                                                    {suggestion?.suggestedQuantity ?? calcSuggested(p)}
                                                </Td>

                                                <Td>

                                                    <QtyInput
                                                        type="number"
                                                        min="1"
                                                        value={adj}
                                                        onChange={(e) => {

                                                            setAdjustedQtys(prev => ({
                                                                ...prev,
                                                                [p.id]: Number(e.target.value)
                                                            }));

                                                        }}
                                                    />

                                                </Td>

                                                <Td>
                                                    {formatCurrency(adj * price)}
                                                </Td>

                                                <Td>
                                                    {suggestion?.bestPrice
                                                        ? formatCurrency(suggestion.bestPrice)
                                                        : "—"}
                                                </Td>

                                                <Td>
                                                    {suggestion?.saving > 0
                                                        ? formatCurrency(suggestion.saving)
                                                        : "—"}
                                                </Td>

                                                <Td>

                                                    {suggestion?.suppliers?.length ? (

                                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>

                                                            {suggestion.suppliers.map(s => {

                                                                const supplier = getSupplierById(s.supplierId);

                                                                return (

                                                                    <span
                                                                        key={s.supplierId}
                                                                        style={{
                                                                            fontSize: "12px",
                                                                            fontWeight:
                                                                                s.supplierId === suggestion.bestSupplierId ? 600 : 400,
                                                                            color:
                                                                                s.supplierId === suggestion.bestSupplierId
                                                                                    ? "#059669"
                                                                                    : "#64748B"
                                                                        }}
                                                                    >
                                                                        {s.supplierName || supplier?.name || "Fornecedor"} — {formatCurrency(s.price)}
                                                                    </span>

                                                                );

                                                            })}

                                                        </div>

                                                    ) : (

                                                        suggestion?.bestSupplierName ||
                                                        getSupplierById(p.supplierId)?.name ||
                                                        "—"

                                                    )}

                                                </Td>

                                            </Tr>

                                        )

                                    })}

                                </tbody>

                            </Table>

                        </TableOverflow>

                    </Card>

                </>

            )}

            {pendingOrders.length > 0 && (

                <>

                    <SectionTitle>Ordens Pendentes</SectionTitle>

                    <Card padding="0">

                        <TableOverflow>

                            <Table>

                                <thead>

                                    <tr>

                                        <Th>Pedido</Th>
                                        <Th>Fornecedor</Th>
                                        <Th>Itens</Th>
                                        <Th>Total</Th>
                                        <Th>Status</Th>
                                        <Th>Ações</Th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {pendingOrders.map(order => {

                                        const total = order.items.reduce(
                                            (s, i) => s + i.adjustedQuantity * i.unitPrice,
                                            0
                                        );

                                        return (

                                            <Tr
                                                key={order.id}
                                                onClick={() => setSelectedOrder(order)}
                                                style={{ cursor: "pointer" }}
                                            >

                                                <Td>#{order.id.slice(-4)}</Td>

                                                <Td>{order.supplierName}</Td>

                                                <Td>{order.items.length}</Td>

                                                <Td>{formatCurrency(total)}</Td>

                                                <Td>
                                                    <StatusBadge status="pending">
                                                        Pendente
                                                    </StatusBadge>
                                                </Td>

                                                <Td>

                                                    <ActionRow>

                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => dispatch({
                                                                type: ACTIONS.COMPLETE_PURCHASE_ORDER,
                                                                payload: order.id
                                                            })}
                                                        >
                                                            <MdCheckCircle />
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => dispatch({
                                                                type: ACTIONS.DELETE_PURCHASE_ORDER,
                                                                payload: order.id
                                                            })}
                                                        >
                                                            <MdDelete />
                                                        </Button>

                                                    </ActionRow>

                                                </Td>

                                            </Tr>

                                        )

                                    })}

                                </tbody>

                            </Table>

                        </TableOverflow>

                    </Card>

                </>

            )}

            {state.purchaseOrders.length === 0 && (

                <EmptyState
                    icon={<MdShoppingCart />}
                    title="Nenhuma ordem de compra"
                    subtitle="Quando produtos atingirem o mínimo, aparecerão aqui."
                />

            )}


            {/* ───── Modal de Detalhes do Pedido ───── */}

            <Modal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Pedido #${selectedOrder?.id.slice(-4).toUpperCase()}`}
            >

                {selectedOrder && (

                    <div>

                        <p style={{ marginBottom: 12 }}>
                            <strong>Fornecedor:</strong>{" "}
                            {getSupplierById(selectedOrder.supplierId)?.name || selectedOrder.supplierName || "Fornecedor"}
                        </p>

                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginTop: 10
                            }}
                        >

                            <thead>

                                <tr
                                    style={{
                                        textAlign: "left",
                                        borderBottom: "1px solid #E5E7EB"
                                    }}
                                >

                                    <th style={{ padding: "8px" }}>Produto</th>
                                    <th style={{ padding: "8px" }}>Quantidade</th>
                                    <th style={{ padding: "8px" }}>Preço</th>
                                    <th style={{ padding: "8px" }}>Total</th>

                                </tr>

                            </thead>

                            <tbody>

                                {selectedOrder.items?.map(item => (

                                    <tr
                                        key={item.productId}
                                        style={{
                                            borderBottom: "1px solid #F1F5F9"
                                        }}
                                    >

                                        <td style={{ padding: "8px" }}>
                                            {item.productName}
                                        </td>

                                        <td style={{ padding: "8px" }}>
                                            {item.adjustedQuantity} {item.unit}
                                        </td>

                                        <td style={{ padding: "8px" }}>
                                            {formatCurrency(item.unitPrice)}
                                        </td>

                                        <td style={{ padding: "8px", fontWeight: 600 }}>
                                            {formatCurrency(item.unitPrice * item.adjustedQuantity)}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </Modal>

        </>
    );

};

export default PurchaseOrders;