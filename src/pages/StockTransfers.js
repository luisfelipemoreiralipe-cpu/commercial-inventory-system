import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import styled from "styled-components";
import api from "../services/api";
import Badge from "../components/Badge";
import { Select } from "../components/FormFields";
import toast from "react-hot-toast"
import Button from "../components/Button";


const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const KpiCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};

  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const KpiTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const KpiValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Tab = styled.button`
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  background: ${({ $active, theme }) =>
        $active ? theme.colors.primary : theme.colors.bgCard};

  color: ${({ $active, theme }) =>
        $active ? "#fff" : theme.colors.textPrimary};

  border: 1px solid ${({ theme }) => theme.colors.border};

  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ $active, theme }) =>
        $active ? theme.colors.primaryHover : theme.colors.bgHover};
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;
const TableOverflow = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
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
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tr = styled.tr`
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 400px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;



const Input = styled.input`
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderFocus};
  }
`;

export default function StockTransfers() {

    const { state } = useApp();
    const { products } = state;


    const [tab, setTab] = useState("create");
    const [sentTransfers, setSentTransfers] = useState([]);
    const [receivedTransfers, setReceivedTransfers] = useState([]);
    const [establishments, setEstablishments] = useState([]);
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [destinationId, setDestinationId] = useState("");
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null)
    const topProduct = getTopTransferredProduct();

    // 🔹 Criar transferência


    function getTopTransferredProduct() {

        const map = {};

        sentTransfers.forEach(t => {

            const name = t.product?.name;

            if (!name) return;

            if (!map[name]) {
                map[name] = 0;
            }

            map[name] += Number(t.quantity);

        });

        const sorted = Object.entries(map)
            .sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) return null;

        return {
            name: sorted[0][0],
            quantity: sorted[0][1]
        };

    }

    async function loadSentTransfers() {
        try {

            const res = await api.get("/stock-transfers/sent");

            setSentTransfers(res);

        } catch (err) {

            console.error(err);
            toast.error("Erro ao carregar transferências enviadas");

        }
    }
    async function loadReceivedTransfers() {

        try {

            const res = await api.get("/stock-transfers/received");

            const pendingTransfers = res.filter(
                (t) => t.status === "PENDING"
            );

            setReceivedTransfers(pendingTransfers);

        } catch (err) {

            console.error(err);
            toast.error("Erro ao carregar transferências recebidas");

        }

    }



    async function approveTransfer(id) {

        try {

            await api.patch(`/stock-transfers/${id}/approve`);
            toast.success("Transferência aprovada com sucesso");

            loadReceivedTransfers();
            loadSentTransfers();

        } catch (err) {
            console.error(err);
        }

    }
    async function rejectTransfer(id) {

        try {

            await api.patch(`/stock-transfers/${id}/reject`);

            loadReceivedTransfers();
            loadSentTransfers();

        } catch (err) {
            console.error(err);
        }

    }

    async function handleTransfer() {

        if (!productId || !quantity || !destinationId) {
            toast.error("Preencha todos os campos");
            return;
        }

        const selectedProduct = products.find(p => p.id === productId);
        if (selectedProduct && Number(quantity) > Number(selectedProduct.quantity)) {
            toast.error(`Estoque insuficiente no estabelecimento de origem. Máximo: ${selectedProduct.quantity} ${selectedProduct.unit}`);
            return;
        }

        try {

            setLoading(true);

            await api.post("/stock-transfers", {
                productId,
                quantity: Number(quantity),
                toEstablishmentId: destinationId
            });

            toast.success("Transferência criada com sucesso");

            setProductId("");
            setQuantity("");
            setDestinationId("");

        } catch (err) {

            console.error(err);
            const status = err.response?.status;

            if (status === 403) {
                toast.error("Você não tem permissão para criar transferência");
            } else {
                toast.error(err.response?.data?.message || "Erro ao criar transferência");
            }

        } finally {

            setLoading(false);
            loadSentTransfers();
        }

    }



    // 🔹 Carregar estabelecimentos

    useEffect(() => {

        if (tab === "sent") {
            loadSentTransfers();
        }

        if (tab === "received") {
            loadReceivedTransfers();
        }

    }, [tab]);

    useEffect(() => {

        async function loadContext() {

            try {

                const topProduct = getTopTransferredProduct();

                const res = await api.get("/auth/context");

                const context = res;

                const { establishments = [], establishment } = context;

                const filtered = establishments.filter(
                    (est) => est.id !== establishment?.id
                );

                setEstablishments(filtered);

            } catch (err) {

                console.error(err);

            }

        }

        loadContext();



    }, []);

    return (

        <Container>

            <Header>
                <Title>Transferências de Estoque</Title>
            </Header>

            <Tabs>

                <Tab
                    $active={tab === "create"}
                    onClick={() => setTab("create")}
                >
                    Nova Transferência
                </Tab>

                <Tab
                    $active={tab === "sent"}
                    onClick={() => {
                        setTab("sent");
                        loadSentTransfers();
                    }}
                >
                    Enviadas
                </Tab>

                <Tab
                    $active={tab === "received"}
                    onClick={() => {
                        setTab("received");
                        loadReceivedTransfers();
                    }}
                >
                    Recebidas
                </Tab>

            </Tabs>

            <Card>

                {tab === "sent" && topProduct && (

                    <KpiGrid>

                        <KpiCard>

                            <KpiTitle>Produto mais transferido</KpiTitle>

                            <KpiValue>
                                {topProduct.name}
                            </KpiValue>

                            <span>
                                {topProduct.quantity} transferências
                            </span>

                        </KpiCard>

                    </KpiGrid>

                )}

                {tab === "create" && (

                    <Form>

                        <Field>



                            <Select
                                label="Produto"
                                value={productId}
                                onChange={setProductId}
                                options={[
                                    { value: "", label: "-- Selecione um produto --" },
                                    ...products.map((product) => ({
                                        value: product.id,
                                        label: `${product.name} (Estoque: ${product.quantity || 0} ${product.unit || 'ml'})`,
                                    }))
                                ]}
                            />

                        </Field>


                        <Field>
                            <Label>Quantidade ({products.find(p => p.id === productId)?.unit || 'ml'})</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Quantidade"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                            {(() => {
                                const selectedProduct = products.find(p => p.id === productId);
                                const q = Number(quantity);
                                if (!selectedProduct || q <= 0) return null;
                                
                                const units = (q / (selectedProduct.packQuantity || 1)).toFixed(2);
                                const isExceeded = q > Number(selectedProduct.quantity);
                                
                                return (
                                    <div style={{ fontSize: '0.8rem', color: isExceeded ? '#ef4444' : '#64748b', marginTop: '4px', fontWeight: isExceeded ? 600 : 400 }}>
                                        {isExceeded ? `⚠️ Estoque insuficiente! Máximo: ${selectedProduct.quantity} ${selectedProduct.unit}` : `Equivale a ${units} ${selectedProduct.purchaseUnit || 'un'}(s)`}
                                    </div>
                                );
                            })()}
                        </Field>

                        <Field>

                            <Select
                                label="Destino"
                                value={destinationId}
                                onChange={setDestinationId}
                                options={[
                                    { value: "", label: "-- Selecione um destino --" },
                                    ...establishments.map((est) => ({
                                        value: est.id,
                                        label: est.name,
                                    }))
                                ]}
                            />

                        </Field>

                        {(() => {
                            const selectedProduct = products.find(p => p.id === productId);
                            const q = Number(quantity);
                            const isExceeded = selectedProduct && q > Number(selectedProduct.quantity);
                            
                            return (
                                <Button
                                    onClick={handleTransfer}
                                    disabled={loading || isExceeded}
                                    variant={isExceeded ? "secondary" : "primary"}
                                    style={{ opacity: isExceeded ? 0.6 : 1 }}
                                >
                                    {loading ? "Transferindo..." : isExceeded ? "Estoque Insuficiente" : "Transferir"}
                                </Button>
                            );
                        })()}

                    </Form>
                )}
                {tab === "sent" && (

                    <table style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Destino</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>

                        <tbody>

                            {sentTransfers.length === 0 && (

                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                                        Nenhuma transferência encontrada
                                    </td>
                                </tr>

                            )}

                            {sentTransfers.map((transfer) => (

                                <Tr key={transfer.id}>

                                    <Td>{transfer.product?.name}</Td>

                                    <Td>{transfer.quantity}</Td>

                                    <Td>{transfer.toEstablishment?.name}</Td>

                                    <Td>

                                        {transfer.status === "PENDING" && (
                                            <Badge variant="warning">PENDENTE</Badge>
                                        )}

                                        {transfer.status === "APPROVED" && (
                                            <Badge variant="success">APROVADO</Badge>
                                        )}

                                        {transfer.status === "REJECTED" && (
                                            <Badge variant="danger">REJEITADO</Badge>
                                        )}

                                    </Td>

                                    <Td>
                                        {new Date(transfer.createdAt).toLocaleDateString()}
                                    </Td>

                                </Tr>

                            ))}

                        </tbody>

                    </table>

                )}

                {tab === "received" && (

                    <TableOverflow>

                        <Table>

                            <thead>
                                <tr>
                                    <Th>Produto</Th>
                                    <Th>Quantidade</Th>
                                    <Th>Origem</Th>
                                    <Th>Status</Th>
                                    <Th>Ações</Th>
                                </tr>
                            </thead>

                            <tbody>

                                {receivedTransfers.map((transfer) => (

                                    <Tr key={transfer.id}>

                                        <Td>{transfer.product?.name}</Td>

                                        <Td>{transfer.quantity}</Td>

                                        <Td>{transfer.fromEstablishment?.name}</Td>

                                        <Td>

                                            {transfer.status === "PENDING" && (
                                                <Badge variant="warning">PENDING</Badge>
                                            )}

                                            {transfer.status === "APPROVED" && (
                                                <Badge variant="success">APPROVED</Badge>
                                            )}

                                            {transfer.status === "REJECTED" && (
                                                <Badge variant="danger">REJECTED</Badge>
                                            )}

                                        </Td>

                                        <Td>

                                            {transfer.status === "PENDING" && (

                                                <>
                                                    <div style={{ display: "flex", gap: "8px" }}>

                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => approveTransfer(transfer.id)}
                                                            disabled={processingId === transfer.id}
                                                        >
                                                            {processingId === transfer.id ? "Aprovando..." : "Aprovar"}
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => rejectTransfer(transfer.id)}
                                                        >
                                                            Rejeitar
                                                        </Button>

                                                    </div>
                                                </>

                                            )}

                                        </Td>

                                    </Tr>

                                ))}

                            </tbody>

                        </Table>

                    </TableOverflow>

                )}

            </Card>


        </Container>

    );

}