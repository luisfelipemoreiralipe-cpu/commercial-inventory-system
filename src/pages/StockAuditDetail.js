import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import api from "../services/api";
import { useApp, ACTIONS } from "../context/AppContext";
import Card from "../components/Card";
import Button from "../components/Button";

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Input = styled.input`
  width: 80px;
  padding: 6px;
`;

export default function StockAuditDetail() {

    const navigate = useNavigate();
    const { id } = useParams();
    const { dispatch } = useApp();

    const [audit, setAudit] = useState(null);
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);

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

        const counted = Number(value);

        const updated = items.map(item => {

            if (item.id === itemId) {

                const difference = counted - item.systemQuantity;

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

            await api.patch(`/stock-audits/${id}/items`, {
                items: payload
            });

            // Atualiza auditoria após salvar
            await loadAudit();

        } catch (error) {

            console.error("ERRO SAVE ITEMS:", error);

        }

        setSaving(false);

    };

    async function finishAudit() {

        try {

            await api.patch(`/stock-audits/${id}/finish`);

            const response = await api.get("/products");

            dispatch({
                type: ACTIONS.SET_PRODUCTS,
                payload: response.data
            });

            alert("Auditoria finalizada com sucesso");

            navigate("/stock-audits");

        } catch (error) {

            console.error(error);

        }

    }

    if (!audit) return <div>Carregando...</div>;

    return (
        <>
            <Header>
                <h1>Auditoria de Estoque</h1>
                <p>
                    <strong>Setor:</strong> {audit.sector?.name}
                </p>

                <p>
                    <strong>Status:</strong>{" "}
                    {audit.status === "OPEN" ? "Auditoria em andamento" : "Auditoria finalizada"}
                </p>
            </Header>

            <Card padding="0">

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

                            <tr key={item.id}>

                                <Td>{item.product.name}</Td>

                                <Td>{item.systemQuantity}</Td>

                                <Td>

                                    <Input
                                        type="number"
                                        value={item.countedQuantity ?? ""}
                                        disabled={audit.status === "CLOSED"}
                                        onChange={(e) =>
                                            handleChange(item.id, e.target.value)
                                        }
                                    />

                                </Td>

                                <Td
                                    style={{
                                        fontWeight: "bold",
                                        color:
                                            item.difference === 0
                                                ? "#16a34a"
                                                : "#dc2626"
                                    }}
                                >
                                    {item.difference || 0}
                                </Td>

                            </tr>

                        ))}

                    </tbody>

                </Table>

            </Card>

            {audit.status === "OPEN" && (

                <div style={{ marginTop: 20 }}>

                    <Button
                        onClick={saveItems}
                        disabled={saving}
                    >
                        {saving ? "Salvando..." : "Salvar Contagem"}
                    </Button>

                    <Button
                        style={{ marginLeft: 10 }}
                        onClick={finishAudit}
                    >
                        Finalizar Auditoria
                    </Button>

                </div>

            )}

        </>
    );

}