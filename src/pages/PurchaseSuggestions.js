import React, { useState, useMemo, useEffect } from "react";
import { MdRefresh, MdWarning } from "react-icons/md";

import { useApp, ACTIONS } from "../context/AppContext";
import api from "../services/api";

const PurchaseSuggestions = () => {

    const { state, dispatch, getSupplierById } = useApp();
    const [selectedSuppliers, setSelectedSuppliers] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [adjustedQtys, setAdjustedQtys] = useState({});

    const getAdjusted = (s) => {
        return adjustedQtys[s.productId] ?? s.suggestedQuantity;
    };

    useEffect(() => {

        const fetchSuggestions = async () => {
            try {
                const res = await api.get("/api/purchase-suggestions");
                setSuggestions(res.data.items || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchSuggestions();

    }, []);

    const lowStockProducts = useMemo(() => {
        return state.products.filter(
            p => Number(p.quantity) < Number(p.minQuantity)
        );
    }, [state.products]);

    const totalEstimatedCost = suggestions.reduce((acc, s) => {

        const qty = getAdjusted(s);

        const selectedSupplierId =
            selectedSuppliers[s.productId] ?? s.bestSupplierId;

        const supplier = s.suppliers?.find(
            sup => sup.supplierId === selectedSupplierId
        );

        const price = Number(supplier?.price || 0);

        return acc + qty * price;

    }, 0);

    const handleGenerate = () => {

        if (lowStockProducts.length === 0) return;

        const groupedBySupplier = {};

        lowStockProducts.forEach((p) => {

            const suggestion = suggestions.find(
                s => s.productId === p.id
            );

            const supplierId =
                selectedSuppliers[p.id] ||
                suggestion?.bestSupplierId ||
                p.supplierId;

            if (!groupedBySupplier[supplierId]) {
                groupedBySupplier[supplierId] = [];
            }

            groupedBySupplier[supplierId].push({

                productId: p.id,
                productName: p.name,
                unit: p.unit,
                unitPrice: suggestion?.bestPrice || Number(p.unitPrice),
                suggestedQuantity: suggestion?.suggestedQuantity || 1,
                adjustedQuantity: adjustedQtys[p.id] ?? suggestion?.suggestedQuantity ?? 1,
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

    return (
        <div>

            <h1>Compras Inteligentes</h1>

            <p>
                Produtos abaixo do estoque mínimo: {lowStockProducts.length}
            </p>

            <p>
                Sugestões encontradas: {suggestions.length}
            </p>

            <p>
                Custo estimado: <strong>
                    R$ {totalEstimatedCost.toFixed(2)}
                </strong>
            </p>

            <hr style={{ margin: "20px 0" }} />

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 20
            }}>

                <h3>Lista de Compras Automática</h3>

                <button
                    onClick={handleGenerate}
                    style={{
                        background: "#111827",
                        color: "white",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: 6,
                        cursor: "pointer"
                    }}
                >
                    Gerar Ordens de Compra
                </button>

            </div>

            <table style={{ width: "100%", marginTop: 20 }}>

                <thead>
                    <tr>
                        <th style={{ textAlign: "left" }}>Produto</th>
                        <th>Estoque</th>
                        <th>Mínimo</th>
                        <th>Ajustar</th>
                        <th>Preço</th>
                        <th>Total</th>
                        <th>Economia</th>
                        <th>Fornecedor</th>
                    </tr>
                </thead>

                <tbody>

                    {suggestions.map(s => {

                        const product = state.products.find(
                            p => p.id === s.productId
                        );

                        /* fornecedor selecionado */
                        const supplierId =
                            selectedSuppliers[s.productId] ?? s.bestSupplierId;

                        /* encontrar fornecedor selecionado */
                        const supplier = s.suppliers?.find(
                            sup => sup.supplierId === supplierId
                        );

                        /* preço correto baseado no fornecedor */
                        const price = Number(supplier?.price ?? s.bestPrice ?? 0);

                        /* quantidade ajustada */
                        const qty = getAdjusted(s);

                        /* total do item */
                        const total = qty * price;
                        const highestPrice = Math.max(
                            ...(s.suppliers?.map(sup => Number(sup.price)) || [price])
                        );
                        const savingPerUnit = highestPrice - price;
                        const savingTotal = savingPerUnit * qty;
                        return (

                            <tr key={s.productId}>

                                <td>{s.productName}</td>

                                <td style={{ textAlign: "center" }}>
                                    {product?.quantity}
                                </td>

                                <td style={{ textAlign: "center" }}>
                                    {product?.minQuantity}
                                </td>

                                <td style={{ textAlign: "center" }}>

                                    <input
                                        type="number"
                                        min="0"
                                        value={qty}
                                        onChange={(e) =>
                                            setAdjustedQtys({
                                                ...adjustedQtys,
                                                [s.productId]: Number(e.target.value)
                                            })
                                        }
                                        style={{
                                            width: 60,
                                            padding: 4,
                                            textAlign: "center"
                                        }}
                                    />

                                </td>

                                <td style={{ textAlign: "center" }}>
                                    R$ {price.toFixed(2)}
                                </td>

                                <td style={{ textAlign: "center", fontWeight: 600 }}>
                                    R$ {total.toFixed(2)}
                                </td>
                                <td style={{ textAlign: "center", color: savingTotal > 0 ? "#059669" : "inherit" }}>
                                    {savingTotal > 0
                                        ? `R$ ${savingTotal.toFixed(2)}`
                                        : "-"}
                                </td>

                                <td style={{ textAlign: "center" }}>

                                    <select
                                        value={supplierId}
                                        onChange={(e) =>
                                            setSelectedSuppliers({
                                                ...selectedSuppliers,
                                                [s.productId]: e.target.value
                                            })
                                        }
                                        style={{
                                            padding: 4,
                                            borderRadius: 4
                                        }}
                                    >

                                        {s.suppliers?.map((sup) => (

                                            <option key={sup.supplierId} value={sup.supplierId}>
                                                {sup.supplierName} — R$ {Number(sup.price).toFixed(2)}
                                            </option>

                                        ))}

                                    </select>

                                </td>

                            </tr>

                        );

                    })}

                </tbody>

            </table>

        </div>
    );

};

export default PurchaseSuggestions;