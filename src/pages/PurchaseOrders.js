import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import {
    MdCheckCircle,
    MdDelete,
    MdShoppingCart
} from "react-icons/md";

import Modal from '../components/Modal';
import { useApp, ACTIONS } from "../context/AppContext";
import { formatCurrency } from "../utils/formatCurrency";

import Card from "../components/Card";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { Input } from "../components/FormFields";
import toast from "react-hot-toast";

import api from "../services/api";

/* -------------------------------------------------------------------------- */
/*                                Styled UI                                   */
/* -------------------------------------------------------------------------- */

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px;
    background: transparent;
  }
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
  @media (max-width: 768px) {
    display: none;
  }
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  @media (max-width: 768px) {
    display: block;
    padding: 8px 12px;
  }
`;

const Tr = styled.tr`
  transition: ${({ theme }) => theme.transition};
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  @media (max-width: 768px) {
    display: block;
    margin-bottom: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    overflow: hidden;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warning};
  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 4px;
  }
`;

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

const PurchaseOrders = () => {

    const { state, dispatch, getSupplierById } = useApp();

    const [suggestions, setSuggestions] = useState([]);
    const [receivedQty, setReceivedQty] = useState({});
    const [receivedPrice, setReceivedPrice] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [tab, setTab] = useState("PENDING");

    /* -------------------------------------------------------------------------- */
    /*                                   EFFECT                                   */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {

        const fetchSuggestions = async () => {

            try {

                const res = await api.get("/purchase-suggestions");

                console.log("SUGGESTIONS RAW:", res);
                console.log("SUGGESTIONS PARSED:", res.items);

                setSuggestions(res.items || []);

            } catch (err) {

                console.error("Erro suggestions:", err);

            }

        };

        fetchSuggestions();

    }, []);

    const fetchOrders = async () => {

        try {

            const res = await api.get("/purchase-orders");

            const orders = res || [];

            dispatch({
                type: ACTIONS.SET_PURCHASE_ORDERS,
                payload: orders
            });

        } catch (err) {

            console.error("Erro ao buscar ordens:", err);

        }

    };

    useEffect(() => {
        fetchOrders();
    }, []);

    /* -------------------------------------------------------------------------- */
    /*                                   MEMOS                                    */
    /* -------------------------------------------------------------------------- */

    const lowStockProducts = useMemo(() => {

        return state.products.filter(
            p => Number(p.quantity) < Number(p.minQuantity)
        );

    }, [state.products]);

    const totalEstimated = useMemo(() => {

        return lowStockProducts.reduce((sum, p) => {

            const suggestion = suggestions.find(
                s => s.productId === p.id
            );

            const price = suggestion?.bestPrice || Number(p.unitPrice);

            return sum + price;

        }, 0);

    }, [lowStockProducts, suggestions]);

    const pendingOrders = useMemo(() => {

        console.log("STATE PURCHASE ORDERS:", state.purchaseOrders);

        return state.purchaseOrders.filter(
            o => o.status === "pending"
        );

    }, [state.purchaseOrders]);
    const filteredOrders = state.purchaseOrders.filter(
        order => order.status.toUpperCase() === tab
    );

    /* -------------------------------------------------------------------------- */
    /*                                  HANDLERS                                  */
    /* -------------------------------------------------------------------------- */

    const handleCompleteOrder = async () => {
        try {
            // 🛡️ Mapeia os itens garantindo a prioridade dos valores editados (como o preço de 55)
            const items = selectedOrder.items.map(item => ({
                id: item.id, // ID técnico do vínculo item-ordem
                productId: item.productId,

                // Se houve alteração manual na quantidade, usa ela. Senão, mantém a original.
                adjustedQuantity: receivedQty[item.productId] !== undefined
                    ? Number(receivedQty[item.productId])
                    : Number(item.adjustedQuantity),

                // 🔥 Se você digitou 55 no modal, o receivedPrice[id] existirá e será convertido aqui
                unitPrice: receivedPrice[item.productId] !== undefined
                    ? Number(receivedPrice[item.productId])
                    : Number(item.unitPrice)
            }));

            console.log("🚀 Enviando para finalização com valores atualizados:", items);

            // Chamada à API para completar a ordem e atualizar o custo e estoque do produto
            await api.put(`/purchase-orders/${selectedOrder.id}/complete`, {
                items
            });

            toast.success("Recebimento concluído e estoque atualizado!");

            // 🔄 Atualiza a lista de ordens e fecha o modal
            await fetchOrders();
            setSelectedOrder(null);

            // ✨ Limpa os estados temporários para não "sujar" o próximo recebimento
            setReceivedQty({});
            setReceivedPrice({});

        } catch (err) {
            console.error("❌ Erro ao finalizar ordem:", err);
            toast.error(err.response?.data?.error || "Erro ao finalizar pedido");
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/purchase-orders/${selectedOrder.id}/pdf`, {
                responseType: 'blob'
            });

            const blob = response; // Já é o blob se o unwrap for inteligente ou o Axios retornar o data

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `pedido-${selectedOrder.id}.pdf`;

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Erro ao baixar PDF:", err);
            alert("Erro ao baixar PDF");
        }
    };
    const handleSendWhatsApp = (order) => {

        const supplierId = order.items?.[0]?.supplierId;

        const supplier = state.suppliers.find(
            s => s.id === supplierId
        );

        if (!supplier?.phone) {
            alert("Fornecedor sem telefone cadastrado");
            return;
        }

        const total = order.items.reduce(
            (acc, item) =>
                acc + item.adjustedQuantity * item.unitPrice,
            0
        );

        const message = `
Pedido #${order.id.slice(-6)}

Fornecedor: ${supplier.name}
Total: R$ ${total.toFixed(2)}

Segue o pedido em PDF.
    `;

        window.open(
            `https://wa.me/55${supplier.phone}?text=${encodeURIComponent(message)}`,
            "_blank"
        );
    };
    /* -------------------------------------------------------------------------- */
    /*                                   RENDER                                   */
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
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>

                <Button
                    onClick={() => setTab("PENDING")}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: tab === "PENDING" ? "#111827" : "#fff",
                        color: tab === "PENDING" ? "#fff" : "#111827",
                        cursor: "pointer",
                        fontWeight: 500
                    }}
                >
                    Pendentes
                </Button>

                <Button
                    onClick={() => setTab("COMPLETED")}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: tab === "COMPLETED" ? "#111827" : "#fff",
                        color: tab === "COMPLETED" ? "#fff" : "#111827",
                        cursor: "pointer",
                        fontWeight: 500
                    }}
                >
                    Finalizadas
                </Button>

            </div>
            {filteredOrders.length > 0 && (

                <>

                    <SectionTitle>Ordens Pendentes</SectionTitle>

                    <Card padding="0">
                        <TableWrapper>
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

                                    {filteredOrders.map(order => {

                                        const total = order.items.reduce(
                                            (s, i) => s + i.adjustedQuantity * i.unitPrice,
                                            0
                                        );

                                        return (

                                            <Tr key={order.id}>

                                                <Td>#{order.id.slice(-4)}</Td>

                                                <Td>
                                                    {(() => {
                                                        const supplierId = order.items?.[0]?.supplierId;

                                                        const supplier = state.suppliers.find(
                                                            s => s.id === supplierId
                                                        );

                                                        return supplier?.name || "Fornecedor";
                                                    })()}
                                                </Td>

                                                <Td>{order.items.length}</Td>

                                                <Td>{formatCurrency(total)}</Td>

                                                <Td>

                                                    <StatusBadge>
                                                        Pendente
                                                    </StatusBadge>

                                                </Td>

                                                <Td>

                                                    <Button
                                                        size="sm"
                                                        variant="success"
                                                        onClick={() => setSelectedOrder(order)}
                                                    >
                                                        <MdCheckCircle />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() =>
                                                            dispatch({
                                                                type: ACTIONS.DELETE_PURCHASE_ORDER,
                                                                payload: order.id
                                                            })
                                                        }
                                                    >
                                                        <MdDelete />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSendWhatsApp(order)}
                                                    >
                                                        📲
                                                    </Button>

                                                </Td>

                                            </Tr>

                                        )

                                    })}

                                </tbody>

                            </Table>
                        </TableWrapper>
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

            <Modal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`Pedido #${selectedOrder?.id.slice(-4)}`}
                style={{ maxWidth: "95%", borderRadius: 0 }}
            >
                {selectedOrder && (
                    <>
                        {/* 🔍 LOGS PARA DEBUG PRESERVADOS */}
                        {console.log("ORDER:", selectedOrder)}
                        {console.log("SUPPLIER ID:", selectedOrder?.supplierId)}
                        {console.log("SUPPLIERS:", state.suppliers)}

                        {/* 🔍 BUSCA DO FORNECEDOR */}
                        {(() => {
                            const supplierId = selectedOrder.items[0]?.supplierId;
                            const supplier = state.suppliers.find(s => s.id === supplierId);

                            return (
                                <div>
                                    {/* 🔥 HEADER COM FORNECEDOR + PDF */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 20,
                                            flexWrap: "wrap",
                                            gap: "10px"
                                        }}
                                    >
                                        <div style={{ color: "#64748B", fontSize: "14px" }}>
                                            Fornecedor:{" "}
                                            <strong style={{ color: "#111827" }}>
                                                {supplier?.name || "Fornecedor não encontrado"}
                                            </strong>
                                        </div>

                                        <Button
                                            variant="primary"
                                            onClick={handleDownloadPdf}
                                        >
                                            Exportar PDF
                                        </Button>
                                    </div>

                                    {/* 🔥 LISTA DE ITENS AJUSTADA COM LABELS */}
                                    {selectedOrder.items.map((item) => {
                                        const qty = receivedQty[item.productId] ?? item.adjustedQuantity;
                                        const price = receivedPrice[item.productId] ?? item.unitPrice;
                                        const total = qty * price;

                                        return (
                                            <div
                                                key={item.productId}
                                                style={{
                                                    marginBottom: 16,
                                                    padding: "16px 12px",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: 12,
                                                    background: "#F9FAFB",
                                                }}
                                            >
                                                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: "#111827" }}>
                                                    {item.productName}
                                                </div>

                                                {/* Grid de Inputs Responsivo */}
                                                <div style={{
                                                    display: "flex",
                                                    gap: 12,
                                                    flexDirection: window.innerWidth < 640 ? "column" : "row"
                                                }}>

                                                    {/* Campo de Quantidade */}
                                                    <div style={{ flex: 1 }}>
                                                        <Input
                                                            label="Qtd. Recebida"
                                                            type="number"
                                                            inputMode="decimal"
                                                            // 🛡️ Mantemos como string para permitir edição fluida
                                                            value={receivedQty[item.productId] ?? item.adjustedQuantity}
                                                            min="0"
                                                            onChange={(e) =>
                                                                setReceivedQty((prev) => ({
                                                                    ...prev,
                                                                    [item.productId]: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="0"
                                                        />
                                                    </div>

                                                    {/* Campo de Preço */}
                                                    <div style={{ flex: 1 }}>
                                                        <Input
                                                            label="Preço Unitário"
                                                            type="number"
                                                            inputMode="decimal"
                                                            value={price}
                                                            min="0"
                                                            step="0.01"
                                                            onChange={(e) =>
                                                                setReceivedPrice((prev) => ({
                                                                    ...prev,
                                                                    [item.productId]: Number(e.target.value),
                                                                }))
                                                            }
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: 10, fontSize: 13, color: "#4B5563", textAlign: "right", fontWeight: 500 }}>
                                                    Subtotal: <strong style={{ color: "#111827" }}>{formatCurrency(total)}</strong>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* 🔥 TOTAL GERAL */}
                                    <div
                                        style={{
                                            marginTop: 20,
                                            padding: "16px 0",
                                            borderTop: "2px solid #e5e7eb",
                                            fontWeight: 700,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "18px",
                                            color: "#111827"
                                        }}
                                    >
                                        <span>Total do Pedido</span>
                                        <span>
                                            {formatCurrency(
                                                selectedOrder.items.reduce((acc, item) => {
                                                    const qty = receivedQty[item.productId] ?? item.adjustedQuantity;
                                                    const price = receivedPrice[item.productId] ?? item.unitPrice;
                                                    return acc + (qty * price);
                                                }, 0)
                                            )}
                                        </span>
                                    </div>

                                    {/* 🔥 BOTÃO FINAL */}
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        onClick={handleCompleteOrder}
                                        style={{ marginTop: 10, minHeight: 48 }}
                                    >
                                        Concluir Recebimento
                                    </Button>

                                </div>
                            );
                        })()}
                    </>
                )}
            </Modal>

        </>
    );

};

export default PurchaseOrders;