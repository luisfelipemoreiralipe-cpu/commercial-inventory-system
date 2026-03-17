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

    useEffect(() => {

        const fetchOrders = async () => {

            try {

                const res = await api.get("/api/purchase-orders");

                console.log("ORDERS RAW:", res);

                const orders = res.data?.data || res.data || [];

                console.log("ORDERS PARSED:", orders);

                dispatch({
                    type: ACTIONS.SET_PURCHASE_ORDERS,
                    payload: orders
                });

            } catch (err) {

                console.error("Erro ao buscar ordens:", err);

            }

        };

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

    /* -------------------------------------------------------------------------- */
    /*                                  HANDLERS                                  */
    /* -------------------------------------------------------------------------- */

    const handleCompleteOrder = async () => {

        if (!selectedOrder) return;

        try {

            const updatedItems = selectedOrder.items.map(item => {

                const qty =
                    receivedQty[item.productId] ?? item.adjustedQuantity;

                const price =
                    receivedPrice[item.productId] ?? item.unitPrice;

                return {
                    ...item,
                    adjustedQuantity: qty,
                    unitPrice: price
                };

            });

            dispatch({
                type: ACTIONS.UPDATE_PURCHASE_ORDER,
                payload: {
                    ...selectedOrder,
                    items: updatedItems
                }
            });

            dispatch({
                type: ACTIONS.COMPLETE_PURCHASE_ORDER,
                payload: selectedOrder.id
            });

            setSelectedOrder(null);

        } catch (err) {

            console.error("Erro ao concluir:", err);

        }

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

            {pendingOrders.length > 0 && (

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

                                {pendingOrders.map(order => {

                                    const total = order.items.reduce(
                                        (s, i) => s + i.adjustedQuantity * i.unitPrice,
                                        0
                                    );

                                    return (

                                        <Tr key={order.id}>

                                            <Td>#{order.id.slice(-4)}</Td>

                                            <Td>
                                                {getSupplierById(order.supplierId)?.name || "Fornecedor"}
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

                    <div>

                        {selectedOrder.items.map(item => {

                            const qty =
                                receivedQty[item.productId] ?? item.adjustedQuantity;

                            const price =
                                receivedPrice[item.productId] ?? item.unitPrice;

                            return (

                                <div key={item.productId}>

                                    {item.productName}

                                </div>

                            )

                        })}

                        <button onClick={handleCompleteOrder}>
                            Concluir Recebimento
                        </button>

                    </div>

                )}

            </Modal>

        </>
    );

};

export default PurchaseOrders;