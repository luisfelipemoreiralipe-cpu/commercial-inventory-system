import React, { useState, useMemo, useEffect } from "react";
import { MdRefresh, MdWarning } from "react-icons/md";
import Card from "../components/Card";

import { useApp, ACTIONS } from "../context/AppContext";
import api from "../services/api";
import styled from "styled-components";
import Select from "../components/Select";
import toast from "react-hot-toast";



const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 32px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Tab = styled.button`
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;

  background: ${({ active }) =>
        active ? "#111827" : "#ffffff"};

  color: ${({ active }) =>
        active ? "#fff" : "#111827"};

  border: 1px solid #e5e7eb;

  transition: 0.2s;

  &:hover {
    background: ${({ active }) =>
        active ? "#1f2937" : "#f3f4f6"};
  }
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #111827;
`;

const PageSubtitle = styled.p`
  color: #6b7280;
  font-size: 14px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 600;
`;

const TableCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${({ theme }) => theme.colors.bgHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
   white-space: nowrap;
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

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

const SupplierRow = styled.tr`
  background: ${({ theme }) => theme.colors.bgHover};
`;

const SupplierHeader = styled.td`
  padding: 14px 16px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;


const PurchaseSuggestions = () => {
    const [generatedSuggestions, setGeneratedSuggestions] = useState({});
    const { state, dispatch, getSupplierById } = useApp();
    const [selectedSuppliers, setSelectedSuppliers] = useState({});
    const [suggestions, setSuggestions] = useState([]);
    const [adjustedQtys, setAdjustedQtys] = useState({});
    const [targetDays, setTargetDays] = useState(7);
    const [ignoredProducts, setIgnoredProducts] = useState({});
    const [viewMode, setViewMode] = useState("active"); // active | ignored

    const getAdjusted = (s) => {
        return adjustedQtys[s.productId] ?? s.suggestedQuantity;
    };


    useEffect(() => {

        const savedSuppliers = localStorage.getItem("purchase_selected_suppliers");

        if (savedSuppliers && savedSuppliers !== "{}") {
            setSelectedSuppliers(JSON.parse(savedSuppliers));
        }

        const saved = localStorage.getItem("purchase_adjusted_qtys");

        if (saved && saved !== "{}") {
            setAdjustedQtys(JSON.parse(saved));
        }

        const fetchSuggestions = async () => {
            try {
                const res = await api.get(
                    `/api/purchase-suggestions?days=${targetDays}`
                );
                setSuggestions(res.data.items || []);
            } catch (err) {
                console.error(err);
            }
        };

        fetchSuggestions();

    }, [targetDays]);

    const lowStockProducts = useMemo(() => {
        return state.products.filter(
            p => Number(p.quantity) < Number(p.minQuantity)
        );
    }, [state.products]);



    const newSuggestions = useMemo(() => {
        return suggestions.filter(s =>
            !s.hasOpenOrder &&
            !ignoredProducts[s.productId]
        );
    }, [suggestions, ignoredProducts]);

    const ignoredSuggestions = useMemo(() => {
        return suggestions.filter(s => ignoredProducts[s.productId]);
    }, [suggestions, ignoredProducts]);

    const coverageStats = useMemo(() => {

        let critical = 0;
        let warning = 0;
        let ok = 0;

        newSuggestions.forEach(s => {

            const consumption = Number(s.consumptionLast7Days || 0);
            const qty = Number(getAdjusted(s) ?? s.suggestedQuantity ?? 0);

            if (consumption <= 0) return;

            const coverage = qty / consumption;

            if (coverage < 1) {
                critical++;
            } else if (coverage < 1.3) {
                warning++;
            } else {
                ok++;
            }

        });

        return {
            critical,
            warning,
            ok
        };

    }, [suggestions, adjustedQtys]);
    console.log("STATS:", coverageStats);

    const productsMap = useMemo(() => {


        const map = {};

        state.products.forEach((p) => {
            map[p.id] = p;
        });


        return map;



    }, [state.products]);





    const openOrderSuggestions = useMemo(() => {
        return suggestions.filter(s => s.hasOpenOrder);
    }, [suggestions]);

    // 👇 ADICIONE ESTE BLOCO AQUI
    const groupedNewSuggestions = useMemo(() => {

        const groups = {};

        newSuggestions.forEach((s) => {

            const supplierId =
                selectedSuppliers[s.productId] ?? s.bestSupplierId;

            if (!groups[supplierId]) {
                groups[supplierId] = [];
            }

            groups[supplierId].push(s);

        });

        return groups;

    }, [newSuggestions, selectedSuppliers]);

    const groupedIgnoredSuggestions = useMemo(() => {

        const groups = {};

        ignoredSuggestions.forEach((s) => {

            const supplierId =
                selectedSuppliers[s.productId] ?? s.bestSupplierId;

            if (!groups[supplierId]) {
                groups[supplierId] = [];
            }

            groups[supplierId].push(s);

        });


        return groups;

    }, [ignoredSuggestions, selectedSuppliers]);

    // 👇 continua normal
    const totalEstimatedCost = (newSuggestions || []).reduce((acc, s) => {

        const qty = getAdjusted(s);

        const selectedSupplierId =
            selectedSuppliers[s.productId] ?? s.bestSupplierId;

        const supplier = s.suppliers?.find(
            sup => sup.supplierId === selectedSupplierId
        );

        const price = Number(supplier?.price || 0);

        return acc + qty * price;

    }, 0);

    const totalEstimatedSaving = (newSuggestions || []).reduce((acc, s) => {

        const qty = getAdjusted(s);



        const selectedSupplierId =
            selectedSuppliers[s.productId] ?? s.bestSupplierId;

        const supplier = s.suppliers?.find(
            sup => sup.supplierId === selectedSupplierId
        );

        const price = Number(supplier?.price || 0);

        const highestPrice = Math.max(
            ...(s.suppliers?.map(sup => Number(sup.price)) || [price])
        );

        const saving = (highestPrice - price) * qty;

        return acc + saving;

    }, 0);

    const handleGenerate = async () => {

        try {

            // 🔥 1. DEFINIR newSuggestions PRIMEIRO (ESSENCIAL)
            const newSuggestions = suggestions.filter(s =>
                !s.hasOpenOrder &&
                !ignoredProducts[s.productId]
            );

            if (newSuggestions.length === 0) {
                alert("Nenhuma sugestão para gerar pedido.");
                return;
            }

            const groupedBySupplier = {};

            newSuggestions.forEach((s) => {

                const p = state.products.find(
                    prod => prod.id === s.productId
                );

                const supplierId =
                    selectedSuppliers[s.productId] ||
                    s.bestSupplierId ||
                    p?.supplierId;

                const supplier = s.suppliers?.find(
                    sup => sup.supplierId === supplierId
                );

                const price = Number(supplier?.price || 0);

                if (!groupedBySupplier[supplierId]) {
                    groupedBySupplier[supplierId] = [];
                }

                groupedBySupplier[supplierId].push({
                    productId: s.productId,
                    productName: s.productName,
                    unitPrice: price,
                    adjustedQuantity: Number(getAdjusted(s)),
                    supplierId
                });

            });

            // 🔥 2. CRIAR ORDENS
            for (const items of Object.values(groupedBySupplier)) {

                await api.post("/api/purchase-orders", {
                    items
                });

            }

            // 🔥 3. LIMPAR STORAGE
            localStorage.removeItem("purchase_adjusted_qtys");
            localStorage.removeItem("purchase_selected_suppliers");

            // 🔥 4. LIMPAR STATE
            setAdjustedQtys({});
            setSelectedSuppliers({});
            setSuggestions([]);

            // 🔥 5. BUSCAR NOVAS SUGESTÕES
            const res = await api.get(`/api/purchase-suggestions?days=${targetDays}`);
            const freshSuggestions = res.data.items || [];

            setSuggestions(freshSuggestions);

            // 🔥 6. MARCAR GERADOS (USA OS ANTIGOS)
            const generated = {};
            newSuggestions.forEach((s) => {
                generated[s.productId] = true;
            });

            setGeneratedSuggestions(generated);

        } catch (err) {
            console.error(err);

            const status = err.response?.status;
            const message = err.response?.data?.error;

            if (status === 403 || message?.includes('Acesso negado')) {
                toast.error('Você não tem permissão para gerar pedidos');
            } else if (status === 401) {
                toast.error('Sessão expirada, faça login novamente');
            } else {
                toast.error('Erro ao gerar pedidos');
            }
        }
    };

    const groupedSuggestions = useMemo(() => {

        const groups = {};

        (suggestions || []).forEach((s) => {

            const supplierId =
                selectedSuppliers[s.productId] ?? s.bestSupplierId;

            if (!groups[supplierId]) {
                groups[supplierId] = [];
            }

            groups[supplierId].push(s);

        });

        return groups;

    }, [suggestions, selectedSuppliers]);

    // 👇 COLOCA EXATAMENTE AQUI
    const currentGroupedSuggestions =
        viewMode === "active"
            ? groupedNewSuggestions
            : groupedIgnoredSuggestions;

    return (
        <div>

            <PageHeader>

                <PageTitle>
                    Compras Inteligentes
                </PageTitle>

                <PageSubtitle>
                    Sugestões automáticas de compra baseadas no estoque mínimo
                </PageSubtitle>

            </PageHeader>

            <StatsGrid>
                <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16
                }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Situação do estoque
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>
                        🔴 {coverageStats.critical} crítico
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                        🟡 {coverageStats.warning} atenção
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                        🟢 {coverageStats.ok} ok
                    </div>
                </div>

                <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16
                }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Produtos abaixo do mínimo
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {lowStockProducts.length}
                    </div>
                </div>

                <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16
                }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Pendentes
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {newSuggestions.length}
                    </div>
                </div>

                <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16
                }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Custo estimado
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        R$ {totalEstimatedCost.toFixed(2)}
                    </div>
                </div>
                <div style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16
                }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Economia estimada
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 600, color: "#059669" }}>
                        R$ {totalEstimatedSaving.toFixed(2)}
                    </div>
                </div>
            </StatsGrid>

            <hr style={{ margin: "20px 0" }} />

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10
            }}>

                <h3 style={{ margin: 0 }}>Lista de Compras</h3>

                <button
                    onClick={handleGenerate}
                    disabled={!newSuggestions.length}
                    style={{
                        background: "#111827",
                        color: "white",
                        border: "none",
                        padding: "10px 16px",
                        borderRadius: 6,
                        cursor: !newSuggestions.length ? "not-allowed" : "pointer"
                    }}
                >
                    Gerar Ordens de Compra
                </button>

            </div>

            <div style={{ marginTop: 15, marginBottom: 10 }}>

                <label style={{ fontWeight: 500 }}>
                    Dias de estoque desejado:
                </label>

                <input
                    type="number"
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    style={{
                        marginLeft: 10,
                        width: 60,
                        padding: 4
                    }}
                />

            </div>
            <Tabs>

                <Tab
                    active={viewMode === "active"}
                    onClick={() => setViewMode("active")}
                >
                    Compras
                </Tab>

                <Tab
                    active={viewMode === "ignored"}
                    onClick={() => setViewMode("ignored")}
                >
                    Ignorados
                </Tab>

            </Tabs>

            <table>

                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Estoque</th>
                        <th>Mínimo</th>
                        <th>Ajustar</th>
                        <th>Preço</th>
                        <th>Total</th>
                        <th>Economia</th>
                        <th>Fornecedor</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>

                    {Object.entries(currentGroupedSuggestions).map(([supplierId, items]) => {

                        const supplierName =
                            getSupplierById(supplierId)?.name || "Fornecedor";
                        const supplierTotal = items.reduce((acc, s) => {


                            const qty = getAdjusted(s);

                            const selectedSupplierId =
                                selectedSuppliers[s.productId] ?? s.bestSupplierId;

                            const supplier = s.suppliers?.find(
                                sup => sup.supplierId === selectedSupplierId
                            );

                            const price = Number(supplier?.price || 0);

                            return acc + qty * price;

                        }, 0);

                        return (

                            <React.Fragment key={supplierId}>

                                <SupplierRow>
                                    <SupplierHeader colSpan="9">

                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}>

                                            <strong>{supplierName}</strong>

                                            <div style={{ display: "flex", gap: 15, fontSize: 12, color: "#6b7280" }}>

                                                <span>
                                                    {items.length} produtos
                                                </span>

                                                <span style={{ fontWeight: 600 }}>
                                                    Total: R$ {supplierTotal.toFixed(2)}
                                                </span>

                                            </div>

                                        </div>

                                    </SupplierHeader>
                                </SupplierRow>

                                {items.map(s => {

                                    const selectedSupplierId =
                                        selectedSuppliers[s.productId] ?? s.bestSupplierId;

                                    const supplier = s.suppliers?.find(
                                        sup => sup.supplierId === selectedSupplierId
                                    );

                                    const price = Number(supplier?.price || 0);

                                    const product = productsMap[s.productId];
                                    const consumption = Number(s.consumptionLast7Days || 0);
                                    const qty = Number(getAdjusted(s)); // 🔥 PRIMEIRO



                                    const total = qty * price;

                                    const prices = s.suppliers?.map(sup => Number(sup.price)) || [];

                                    const highestPrice =
                                        prices.length > 0
                                            ? Math.max(...prices)
                                            : price;
                                    const savingTotal = (highestPrice - price) * qty;

                                    let coverage = null;

                                    if (consumption > 0) {
                                        coverage = qty / consumption;
                                    }
                                    let coverageLabel = null;
                                    let coverageColor = "#6b7280";

                                    if (coverage !== null) {
                                        if (coverage < 1) {
                                            coverageLabel = "crítico";
                                            coverageColor = "#dc2626"; // vermelho
                                        } else if (coverage < 1.3) {
                                            coverageLabel = "atenção";
                                            coverageColor = "#d97706"; // amarelo
                                        } else {
                                            coverageLabel = "ok";
                                            coverageColor = "#059669"; // verde
                                        }
                                    }

                                    return (

                                        <Tr key={s.productId}>

                                            <Td>
                                                {s.productName}

                                                {coverage && (
                                                    <div style={{ fontSize: 11, color: coverageColor }}>
                                                        {coverage < 1 ? "🔴" : coverage < 1.3 ? "🟡" : "🟢"}{" "}
                                                        cobre ~{coverage.toFixed(1)} eventos
                                                    </div>
                                                )}
                                            </Td>

                                            <Td style={{ textAlign: "center" }}>
                                                {product?.quantity}
                                            </Td>

                                            <Td style={{ textAlign: "center" }}>
                                                {product?.minQuantity}
                                            </Td>

                                            <Td style={{ textAlign: "center" }}>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={getAdjusted(s)}
                                                    onChange={(e) => {
                                                        const updated = {
                                                            ...adjustedQtys,
                                                            [s.productId]: Number(e.target.value)
                                                        };

                                                        setAdjustedQtys(updated);

                                                        localStorage.setItem(
                                                            "purchase_adjusted_qtys",
                                                            JSON.stringify(updated)
                                                        );
                                                    }}
                                                    style={{
                                                        width: 60,
                                                        padding: 4,
                                                        textAlign: "center"
                                                    }}
                                                />

                                            </Td>

                                            <Td style={{ textAlign: "center" }}>
                                                R$ {price.toFixed(2)}
                                            </Td>

                                            <Td style={{ textAlign: "center", fontWeight: 600 }}>
                                                R$ {total.toFixed(2)}
                                            </Td>

                                            <Td style={{
                                                textAlign: "center",
                                                color: savingTotal > 0 ? "#059669" : "#6b7280"
                                            }}>
                                                {savingTotal > 0
                                                    ? `R$ ${savingTotal.toFixed(2)}`
                                                    : "R$ 0.00"}
                                            </Td>

                                            <Td style={{ textAlign: "center" }}>

                                                <Select
                                                    value={selectedSuppliers[s.productId] ?? s.bestSupplierId ?? ""}
                                                    onChange={(value) => {
                                                        const updated = {
                                                            ...selectedSuppliers,
                                                            [s.productId]: value
                                                        };

                                                        setSelectedSuppliers(updated);

                                                        localStorage.setItem(
                                                            "purchase_selected_suppliers",
                                                            JSON.stringify(updated)
                                                        );
                                                    }}
                                                    options={s.suppliers?.map((sup) => ({
                                                        value: sup.supplierId,
                                                        label:
                                                            sup.supplierId === s.bestSupplierId
                                                                ? `⭐ ${sup.supplierName} — R$ ${Number(sup.price).toFixed(2)}`
                                                                : `${sup.supplierName} — R$ ${Number(sup.price).toFixed(2)}`
                                                    })) || []}
                                                />

                                            </Td>
                                            <Td style={{ textAlign: "center" }}>
                                                {s.hasOpenOrder ? (
                                                    <span style={{
                                                        background: "#e0f2fe",
                                                        color: "#0369a1",
                                                        padding: "4px 8px",
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        fontWeight: 500
                                                    }}>
                                                        Pedido gerado
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        background: "#f3f4f6",
                                                        color: "#6b7280",
                                                        padding: "4px 8px",
                                                        borderRadius: 6,
                                                        fontSize: 12
                                                    }}>
                                                        Sugestão
                                                    </span>
                                                )}
                                                {viewMode === "active" ? (
                                                    <button
                                                        onClick={() =>
                                                            setIgnoredProducts(prev => ({
                                                                ...prev,
                                                                [s.productId]: true
                                                            }))
                                                        }
                                                    >
                                                        Ignorar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            setIgnoredProducts(prev => {
                                                                const copy = { ...prev };
                                                                delete copy[s.productId];
                                                                return copy;
                                                            })
                                                        }
                                                    >
                                                        Reativar
                                                    </button>
                                                )}

                                            </Td>
                                        </Tr>

                                    );

                                })}

                            </React.Fragment>

                        );

                    })}

                </tbody>

            </table>

        </div>
    );

};

export default PurchaseSuggestions;