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

import api from "../services/api";

/* -------------------------------------------------------------------------- */
/*                                Styled UI                                   */
/* -------------------------------------------------------------------------- */

const StatsGrid = styled.div`
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:16px;
margin-bottom:24px;
`;

const PageHeader = styled.div`
display:flex;
justify-content:space-between;
align-items:flex-start;
margin-bottom:24px;
`;

const PageTitle = styled.h1`
font-size:28px;
font-weight:700;
`;

const PageSubtitle = styled.p`
color:#64748B;
font-size:14px;
margin-top:4px;
`;

const SectionTitle = styled.h2`
font-size:18px;
font-weight:600;
margin-bottom:16px;
`;

const Table = styled.table`
width:100%;
border-collapse:collapse;
`;

const Th = styled.th`
text-align:left;
padding:14px 16px;
font-size:12px;
background:#F8FAFC;
border-bottom:1px solid #E5E7EB;
`;

const Td = styled.td`
padding:14px 16px;
border-bottom:1px solid #E5E7EB;
`;

const Tr = styled.tr`
&:hover{
background:#F8FAFC;
}
`;

const StatusBadge = styled.span`
padding:4px 10px;
border-radius:999px;
font-size:12px;
font-weight:600;
background:#FEF3C7;
color:#D97706;
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

                const res = await api.get("/api/purchase-suggestions");

                console.log("SUGGESTIONS RAW:", res);
                console.log("SUGGESTIONS PARSED:", res.data?.data);

                setSuggestions(res.data?.data || []);

            } catch (err) {

                console.error("Erro suggestions:", err);

            }

        };

        fetchSuggestions();

    }, []);

    const fetchOrders = async () => {

        try {

            const res = await api.get("/api/purchase-orders");

            const orders = res.data?.data || res.data || [];

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

            const items = selectedOrder.items.map(item => ({
                id: item.id,
                adjustedQuantity:
                    receivedQty[item.productId] ?? item.adjustedQuantity,
                unitPrice:
                    receivedPrice[item.productId] ?? item.unitPrice
            }));

            await api.put(`/api/purchase-orders/${selectedOrder.id}/complete`, {
                items
            });

            await fetchOrders();

            setSelectedOrder(null);

        } catch (err) {
            console.error(err);
            alert("Erro ao finalizar pedido");
        }

    };

    const handleDownloadPdf = async () => {
        try {
            const token = localStorage.getItem("token");



            const response = await fetch(
                `http://localhost:3333/api/purchase-orders/${selectedOrder.id}/pdf`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const blob = await response.blob();

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

                <button
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
                </button>

                <button
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
                </button>

            </div>
            {filteredOrders.length > 0 && (

                <>

                    <SectionTitle>Ordens Pendentes</SectionTitle>

                    <Card padding="0">

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
            >
                {selectedOrder && (
                    <>
                        {/* 🔍 LOGS PARA DEBUG */}
                        {console.log("ORDER:", selectedOrder)}
                        {console.log("SUPPLIER ID:", selectedOrder?.supplierId)}
                        {console.log("SUPPLIERS:", state.suppliers)}

                        {/* 🔍 BUSCA DO FORNECEDOR */}
                        {(() => {
                            const supplierId = selectedOrder.items[0]?.supplierId;

                            const supplier = state.suppliers.find(
                                s => s.id === supplierId
                            );

                            return (
                                <div>

                                    {/* 🔥 HEADER COM FORNECEDOR + PDF */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 20,
                                        }}
                                    >
                                        <div style={{ color: "#64748B" }}>
                                            Fornecedor:{" "}
                                            <strong>
                                                {supplier?.name || "Fornecedor não encontrado"}
                                            </strong>
                                        </div>

                                        <button
                                            onClick={handleDownloadPdf}
                                            style={{
                                                background: "#111827",
                                                color: "#fff",
                                                border: "none",
                                                padding: "8px 12px",
                                                borderRadius: 6,
                                                cursor: "pointer",
                                                fontSize: 13,
                                                fontWeight: 500,
                                            }}
                                        >
                                            Exportar PDF
                                        </button>
                                    </div>

                                    {/* 🔥 LISTA DE ITENS */}
                                    {selectedOrder.items.map((item) => {
                                        const qty =
                                            receivedQty[item.productId] ?? item.adjustedQuantity;

                                        const price =
                                            receivedPrice[item.productId] ?? item.unitPrice;

                                        const total = qty * price;

                                        return (
                                            <div
                                                key={item.productId}
                                                style={{
                                                    marginBottom: 16,
                                                    padding: 12,
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: 8,
                                                    background: "#fff",
                                                }}
                                            >
                                                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                                    {item.productName}
                                                </div>

                                                <div style={{ display: "flex", gap: 10 }}>
                                                    <input
                                                        type="number"
                                                        value={qty}
                                                        min="0"
                                                        onChange={(e) =>
                                                            setReceivedQty((prev) => ({
                                                                ...prev,
                                                                [item.productId]: Number(e.target.value),
                                                            }))
                                                        }
                                                        style={{
                                                            flex: 1,
                                                            padding: 10,
                                                            borderRadius: 6,
                                                            border: "1px solid #e5e7eb",
                                                        }}
                                                        placeholder="Quantidade"
                                                    />

                                                    <input
                                                        type="number"
                                                        value={price}
                                                        min="0"
                                                        step="0.01"
                                                        onChange={(e) =>
                                                            setReceivedPrice((prev) => ({
                                                                ...prev,
                                                                [item.productId]: Number(e.target.value),
                                                            }))
                                                        }
                                                        style={{
                                                            flex: 1,
                                                            padding: 10,
                                                            borderRadius: 6,
                                                            border: "1px solid #e5e7eb",
                                                        }}
                                                        placeholder="Preço"
                                                    />
                                                </div>

                                                <div
                                                    style={{
                                                        marginTop: 6,
                                                        fontSize: 13,
                                                        color: "#6b7280",
                                                    }}
                                                >
                                                    Total: <strong>R$ {total.toFixed(2)}</strong>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* 🔥 TOTAL GERAL */}
                                    <div
                                        style={{
                                            marginTop: 10,
                                            paddingTop: 10,
                                            borderTop: "1px solid #e5e7eb",
                                            fontWeight: 600,
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <span>Total do Pedido</span>
                                        <span>
                                            R${" "}
                                            {selectedOrder.items
                                                .reduce((acc, item) => {
                                                    const qty =
                                                        receivedQty[item.productId] ??
                                                        item.adjustedQuantity;

                                                    const price =
                                                        receivedPrice[item.productId] ??
                                                        item.unitPrice;

                                                    return acc + qty * price;
                                                }, 0)
                                                .toFixed(2)}
                                        </span>
                                    </div>

                                    {/* 🔥 BOTÃO FINAL */}
                                    <button
                                        onClick={handleCompleteOrder}
                                        style={{
                                            width: "100%",
                                            marginTop: 16,
                                            padding: "12px",
                                            background: "#111827",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Concluir Recebimento
                                    </button>

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