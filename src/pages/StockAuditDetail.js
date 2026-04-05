import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { MdSave, MdCheckCircle, MdArrowBack } from "react-icons/md";
import api from "../services/api";
import { useApp, ACTIONS } from "../context/AppContext";
import Card from "../components/Card";
import Button from "../components/Button";

/* -------------------------------------------------------------------------- */
/* Styled UI                                   */
/* -------------------------------------------------------------------------- */

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${({ isOpen }) => (isOpen ? "#FEF3C7" : "#DCFCE7")};
  color: ${({ isOpen }) => (isOpen ? "#92400E" : "#166534")};
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
    padding: 8px;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 16px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  background: ${({ theme }) => theme.colors.bgHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    display: none;
  }
`;

const Tr = styled.tr`
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 12px;
  }
`;

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
    width: 100%;

    &:before {
      content: attr(data-label);
      font-weight: 700;
      font-size: 11px;
      color: ${({ theme }) => theme.colors.textMuted};
      text-transform: uppercase;
    }

    &:last-child { border-bottom: none; }
  }
`;

const Input = styled.input`
  width: 100px;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  text-align: center;
  font-size: 16px; // Evita zoom no mobile
  font-weight: 600;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: 768px) {
    width: 80px;
  }
`;

const ActionFooter = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    
    button { width: 100%; }
  }
`;

/* -------------------------------------------------------------------------- */
/* Component                                   */
/* -------------------------------------------------------------------------- */

export default function StockAuditDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { state, dispatch } = useApp();

    const [audit, setAudit] = useState(null);
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);
    const isCounter = state.user?.role === "STOCK_COUNTER";

    async function loadAudit() {
        try {
            const data = await api.get(`/stock-audits/${id}`);
            setAudit(data);
            setItems(data.items);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        loadAudit();
    }, [id]);

    function handleChange(itemId, value) {
        // Se o valor for vazio, mantemos null para o placeholder aparecer
        const counted = value === "" ? null : Number(value);

        const updated = items.map(item => {
            if (item.id === itemId) {
                // Diferença calculada: $Diferença = Contado - Sistema$
                const difference = counted !== null ? counted - item.systemQuantity : 0;
                return {
                    ...item,
                    countedQuantity: counted,
                    difference
                };
            }
            return item;
        });
        setItems(updated);
    }

    const saveItems = async () => {
        setSaving(true);
        try {
            const payload = items.map(item => ({
                id: item.id,
                countedQuantity: Number(item.countedQuantity || 0),
                systemQuantity: Number(item.systemQuantity || 0)
            }));
            await api.patch(`/stock-audits/${id}/items`, payload);
            await loadAudit();
        } catch (error) {
            console.error("ERRO SAVE ITEMS:", error);
        }
        setSaving(false);
    };

    async function finishAudit() {
        if (!window.confirm("Deseja finalizar a auditoria? O estoque do sistema será atualizado.")) return;
        try {
            await api.patch(`/stock-audits/${id}/finish`);
            const response = await api.get("/products");
            dispatch({ type: ACTIONS.SET_PRODUCTS, payload: response });
            navigate("/stock-audits");
        } catch (error) {
            console.error(error);
        }
    }

    if (!audit) return <div style={{ padding: 40, textAlign: "center" }}>Carregando auditoria...</div>;

    const isOpen = audit.status === "OPEN";

    return (
        <>
            <PageHeader>
                <TitleSection>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Button variant="secondary" size="sm" onClick={() => navigate("/stock-audits")}>
                            <MdArrowBack />
                        </Button>
                        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Executar Auditoria</h1>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center" }}>
                        <StatusBadge isOpen={isOpen}>
                            {isOpen ? "Em Andamento" : "Finalizada"}
                        </StatusBadge>
                        <span style={{ fontSize: 13, color: "#64748B" }}>
                            Iniciada em: {new Date(audit.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </TitleSection>
            </PageHeader>

            <Card padding="0">
                <TableWrapper>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Produto</Th>
                                <Th>Sistema</Th>
                                <Th>Contado</Th>
                                <Th>Diferença</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <Tr key={item.id}>
                                    <Td data-label="Produto">
                                        <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                                    </Td>

                                    <Td data-label="Sistema">
                                        <span style={{ color: "#64748B" }}>{item.systemQuantity}</span>
                                    </Td>

                                    <Td data-label="Contado">
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            // 🛡️ Se for null ou undefined, vira "" para o placeholder "0" aparecer
                                            value={item.countedQuantity ?? ""}
                                            placeholder="0"
                                            disabled={!isOpen}
                                            onChange={(e) => handleChange(item.id, e.target.value)}
                                        />
                                    </Td>

                                    <Td data-label="Diferença">
                                        <div style={{
                                            fontWeight: "800",
                                            color: item.difference === 0 ? "#16a34a" : "#dc2626",
                                            background: item.difference === 0 ? "#f0fdf4" : "#fef2f2",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            minWidth: "40px",
                                            textAlign: "center"
                                        }}>
                                            {item.difference > 0 ? `+${item.difference}` : item.difference || 0}
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </tbody>
                    </Table>
                </TableWrapper>
            </Card>

            {isOpen && (
                <ActionFooter>
                    <Button onClick={saveItems} disabled={saving} style={{ flex: 1 }}>
                        <MdSave /> {saving ? "Salvando..." : "Salvar Progresso"}
                    </Button>

                    <Button onClick={finishAudit} variant="success" style={{ flex: 1 }}>
                        <MdCheckCircle /> Finalizar Auditoria
                    </Button>
                </ActionFooter>
            )}
        </>
    );
}