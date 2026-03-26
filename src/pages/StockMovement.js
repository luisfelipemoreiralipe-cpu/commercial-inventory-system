import React, { useState } from "react";
import styled from "styled-components";
import { useApp } from "../context/AppContext";
import Card from "../components/Card";
import Button from "../components/Button";
import api from "../services/api";
import toast from "react-hot-toast";


const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TitleBlock = styled.div``;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: 4px;
`;

const FormBox = styled(Card)`
  padding: 20px;
  max-width: 500px;
`;

const Field = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: block;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export default function StockMovement() {
    const { state } = useApp();

    const [mode, setMode] = useState("BONUS");
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [loading, setLoading] = useState(false);
    const { fetchAllData } = useApp();

    const selectedProduct = state.products.find(
        (p) => p.id === productId
    );

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

        if (mode === "INTERNAL_USE") {
            if (selectedProduct.type === "INVENTORY") {
                if (Number(quantity) > Number(selectedProduct.quantity)) {
                    toast.error("Estoque insuficiente");
                    return;
                }
            }
        }

        setLoading(true); // 🔥 COMEÇA LOADING

        try {
            if (mode === "BONUS") {
                await api.post("/stock-movements/bonus", {
                    productId,
                    quantity: Number(quantity),
                    reason: "BONUS",
                });
                await fetchAllData();

            } else {
                await api.post("/stock-movements/internal-use", {
                    productId,
                    quantity: Number(quantity),
                });
            }

            toast.success("Movimentação realizada com sucesso");

            // 🔥 RESET INTELIGENTE
            setQuantity("");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao movimentar estoque");
        } finally {
            setLoading(false); // 🔥 SEMPRE EXECUTA
        }
    };

    return (
        <>
            <PageHeader>
                <TitleBlock>
                    <PageTitle>Movimentação de Estoque</PageTitle>

                    <PageSubtitle>
                        {mode === "BONUS"
                            ? "Adicionar produtos ao estoque (bonificação)"
                            : "Remover produtos do estoque (consumo interno)"}
                    </PageSubtitle>
                </TitleBlock>
            </PageHeader>

            {/* BOTÕES */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <Button
                    variant={mode === "BONUS" ? "primary" : "secondary"}
                    onClick={() => setMode("BONUS")}
                >
                    Bonificação
                </Button>

                <Button
                    variant={mode === "INTERNAL_USE" ? "primary" : "secondary"}
                    onClick={() => setMode("INTERNAL_USE")}
                >
                    Consumo Interno
                </Button>
            </div>

            <FormBox>
                {/* PRODUTO */}
                <Field>
                    <Label>Produto</Label>

                    <Select
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                    >
                        <option value="">Selecione um produto</option>

                        {state.products
                            .filter((p) =>
                                mode === "BONUS"
                                    ? p.type === "INVENTORY"
                                    : true
                            )
                            .map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Estoque: {p.quantity})
                                </option>
                            ))}
                    </Select>
                </Field>

                {/* QUANTIDADE */}
                <Field>
                    <Label>Quantidade</Label>

                    <Input
                        type="number"
                        min="0"
                        placeholder="Digite a quantidade"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                </Field>

                {/* RESULTADO */}
                {selectedProduct && quantity !== "" && (
                    <div style={{ marginTop: 10, fontSize: 14 }}>
                        <p>Estoque atual: {selectedProduct.quantity}</p>

                        <p>
                            Após movimentação:{" "}
                            <strong
                                style={{
                                    color:
                                        mode === "INTERNAL_USE" && resultingStock < 0
                                            ? "#DC2626"
                                            : "#059669",
                                }}
                            >
                                {resultingStock}
                            </strong>
                        </p>
                    </div>
                )}
                <div style={{ marginTop: 20 }}>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Processando..." : "Confirmar movimentação"}
                    </Button>
                </div>
            </FormBox>
        </>
    );
}