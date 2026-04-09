import React, { useState } from "react";
import styled from "styled-components";
import { useApp } from "../context/AppContext";
import Card from "../components/Card";
import Button from "../components/Button";
import api from "../services/api";
import toast from "react-hot-toast";
import { Input, Select } from "../components/FormFields";
import { MdAddCircle, MdRemoveCircle, MdUploadFile } from "react-icons/md";

/* -------------------------------------------------------------------------- */
/* Styled UI                                   */
/* -------------------------------------------------------------------------- */

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: 4px;
`;

const FormContainer = styled.div`
  max-width: 600px; // Aumentado levemente para melhor leitura
  width: 100%;
`;

const ButtonGroup = styled.div`
  display: flex; 
  gap: 10px; 
  margin-bottom: 24px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    button { width: 100%; }
  }
`;

const ResultBox = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.bgHover};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
`;

/* -------------------------------------------------------------------------- */
/* Component                                   */
/* -------------------------------------------------------------------------- */

export default function StockMovement() {
    const { state, fetchAllData } = useApp();

    const [mode, setMode] = useState("BONUS");
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [loadingImport, setLoadingImport] = useState(false);

    const selectedProduct = state.products.find((p) => p.id === productId);
    const parsedQuantity = Number(quantity || 0);

    const resultingStock = selectedProduct
        ? mode === "BONUS"
            ? Number(selectedProduct.quantity) + parsedQuantity
            : Number(selectedProduct.quantity) - parsedQuantity
        : 0;

    const handleSubmit = async () => {
        if (!productId) {
            toast.error("Selecione um produto");
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            toast.error("Informe uma quantidade válida");
            return;
        }

        if (mode === "INTERNAL_USE" && selectedProduct?.type === "INVENTORY") {
            if (Number(quantity) > Number(selectedProduct.quantity)) {
                toast.error("Estoque insuficiente no sistema");
                return;
            }
        }

        setLoading(true);
        try {
            const pack = Number(selectedProduct?.packQuantity || 1);
            const moveQty = Number(quantity) * pack;

            if (mode === "BONUS") {
                await api.post("/stock-movements/bonus", {
                    productId: String(productId),
                    quantity: moveQty,
                    reason: "BONUS",
                });
            } else if (mode === "INTERNAL_USE") {
                await api.post("/stock-movements/internal-use", {
                    productId: String(productId),
                    quantity: moveQty,
                });
            }

            toast.success("Movimentação realizada com sucesso");
            setQuantity("");
            await fetchAllData();

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Erro ao movimentar estoque");
        } finally {
            setLoading(false);
        }
    };

    const handleImportCSV = async () => {
        if (!file) {
            toast.error("Selecione um arquivo .csv");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoadingImport(true);
        try {
            await api.post("/sales/import", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("CSV importado com sucesso");
            setFile(null);
            await new Promise((resolve) => setTimeout(resolve, 500));
            await fetchAllData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao importar CSV");
        } finally {
            setLoadingImport(false);
        }
    };

    return (
        <FormContainer>
            <PageHeader>
                <div>
                    <PageTitle>Movimentação</PageTitle>
                    <PageSubtitle>
                        {mode === "BONUS" ? "Entrada de bonificação" :
                            mode === "INTERNAL_USE" ? "Saída para uso interno" : "Importação de vendas"}
                    </PageSubtitle>
                </div>
            </PageHeader>

            <ButtonGroup>
                <Button
                    variant={mode === "BONUS" ? "primary" : "secondary"}
                    onClick={() => { setMode("BONUS"); setProductId(""); }}
                >
                    <MdAddCircle /> Bonificação
                </Button>

                <Button
                    variant={mode === "INTERNAL_USE" ? "primary" : "secondary"}
                    onClick={() => { setMode("INTERNAL_USE"); setProductId(""); }}
                >
                    <MdRemoveCircle /> Consumo Interno
                </Button>

                <Button
                    variant={mode === "CSV_IMPORT" ? "primary" : "secondary"}
                    onClick={() => setMode("CSV_IMPORT")}
                >
                    <MdUploadFile /> Importar CSV
                </Button>
            </ButtonGroup>

            {mode !== "CSV_IMPORT" ? (
                <Card>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Select
                            label="Produto para Movimentar"
                            value={productId}
                            // 👈 CORREÇÃO 1: Garante que o React pegue o ID do evento correto
                            onChange={(e) => setProductId(e?.target ? e.target.value : e)}
                            options={[
                                // 👈 CORREÇÃO 2: Força uma linha vazia para o React não se enganar com o primeiro item
                                { value: "", label: "Selecione um produto..." },
                                ...(state.products || [])
                                    .filter((p) => mode === "BONUS" ? p.type === "INVENTORY" : true)
                                    .map((p) => {
                                        const pack = Number(p.packQuantity || 1);
                                        const inUnits = (Number(p.quantity || 0) / pack).toFixed(2);
                                        return {
                                            value: p.id,
                                            label: `${p.name} (Atual: ${inUnits} ${p.purchaseUnit || 'un'})`,
                                        };
                                    })
                            ]}
                        />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Input
                                label="Quantidade"
                                type="number"
                                inputMode="decimal"
                                placeholder="0"
                                value={quantity ?? ""}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                            {selectedProduct && quantity !== "" && (
                                <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '4px' }}>
                                    Total a sugerir: <strong>{(Number(quantity) * (selectedProduct.packQuantity || 1)).toFixed(0)} {selectedProduct.unit || 'ml'}</strong>
                                </span>
                            )}
                        </div>

                        {selectedProduct && quantity !== "" && (() => {
                            const pack = Number(selectedProduct.packQuantity || 1);
                            const moveAmount = Number(quantity) * pack;
                            const prevQty = Number(selectedProduct.quantity || 0);
                            const newQty = mode === "BONUS" ? prevQty + moveAmount : prevQty - moveAmount;

                            const inUnits = (newQty / pack).toFixed(2);

                            return (
                                <ResultBox>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span>Estoque atual:</span>
                                        <strong>{(prevQty / pack).toFixed(2)} {selectedProduct.purchaseUnit}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Após movimentação:</span>
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

                        <Button
                            fullWidth
                            onClick={handleSubmit}
                            disabled={loading || !productId}
                            size="lg"
                        >
                            {loading ? "Processando..." : "Confirmar Movimentação"}
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card title="Importação de Vendas">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Input
                            label="Arquivo CSV"
                            type="file"
                            accept=".csv"
                            onChange={(e) => setFile(e.target.files[0])}
                        />

                        {file && (
                            <p style={{ fontSize: '13px', color: '#64748B' }}>
                                📄 Selecionado: <strong>{file.name}</strong>
                            </p>
                        )}

                        <Button
                            fullWidth
                            variant="primary"
                            onClick={handleImportCSV}
                            disabled={loadingImport || !file}
                            size="lg"
                        >
                            {loadingImport ? "Importando..." : "Iniciar Importação"}
                        </Button>
                    </div>
                </Card>
            )}
        </FormContainer>
    );
}