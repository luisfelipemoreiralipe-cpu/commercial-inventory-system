import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import styled from "styled-components";
import api from "../services/api";
import Badge from "../components/Badge";
import Select from "../components/Select";
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

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderFocus};
  }
`;

const SummarySection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl || '32px'};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  font-size: 1.2em;
`;

const GroupCard = styled.div`
  background: ${({ theme }) => theme.colors.bgHover};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.bgCard};
  }
`;

const GroupName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const GroupMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const GroupMetaItem = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const ExpandIcon = styled.span`
  transition: transform 0.2s ease;
  transform: ${({ $expanded }) => $expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  font-size: 0.8em;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const GroupBody = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
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
    const [processingId, setProcessingId] = useState(null);

    // Summary state
    const [summaryData, setSummaryData] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [expandedGroups, setExpandedGroups] = useState({});

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

    // Summary helpers
    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    async function loadSummary() {
        try {
            setSummaryLoading(true);
            const res = await api.get(`/stock-transfers/summary?startDate=${startDate}&endDate=${endDate}`);
            setSummaryData(res);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar resumo de transferências");
        } finally {
            setSummaryLoading(false);
        }
    }

    useEffect(() => {

        if (tab === "sent") {
            loadSentTransfers();
        }

        if (tab === "received") {
            loadReceivedTransfers();
        }

        if (tab === "summary") {
            loadSummary();
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

                <Tab
                    $active={tab === "summary"}
                    onClick={() => {
                        setTab("summary");
                    }}
                >
                    📊 Resumo
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

                {tab === "summary" && (
                    <>
                        <FilterRow>
                            <FilterField>
                                <FilterLabel>Data Início</FilterLabel>
                                <FilterInput
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </FilterField>

                            <FilterField>
                                <FilterLabel>Data Fim</FilterLabel>
                                <FilterInput
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </FilterField>

                            <Button
                                onClick={loadSummary}
                                disabled={summaryLoading}
                                variant="primary"
                                size="sm"
                            >
                                {summaryLoading ? "Carregando..." : "Filtrar"}
                            </Button>
                        </FilterRow>

                        {summaryLoading && (
                            <EmptyState>Carregando dados...</EmptyState>
                        )}

                        {!summaryLoading && summaryData && (
                            <>
                                <KpiGrid>
                                    <KpiCard>
                                        <KpiTitle>Total Enviado (Qtd)</KpiTitle>
                                        <KpiValue>{summaryData.sent?.totalQuantity?.toFixed(1) || 0}</KpiValue>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {summaryData.sent?.transferCount || 0} transferência(s)
                                        </span>
                                    </KpiCard>

                                    <KpiCard>
                                        <KpiTitle>Total Enviado (Valor)</KpiTitle>
                                        <KpiValue style={{ color: '#ef4444' }}>
                                            {formatCurrency(summaryData.sent?.totalValue)}
                                        </KpiValue>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Saída de valor</span>
                                    </KpiCard>

                                    <KpiCard>
                                        <KpiTitle>Total Recebido (Qtd)</KpiTitle>
                                        <KpiValue>{summaryData.received?.totalQuantity?.toFixed(1) || 0}</KpiValue>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            {summaryData.received?.transferCount || 0} transferência(s)
                                        </span>
                                    </KpiCard>

                                    <KpiCard>
                                        <KpiTitle>Total Recebido (Valor)</KpiTitle>
                                        <KpiValue style={{ color: '#22c55e' }}>
                                            {formatCurrency(summaryData.received?.totalValue)}
                                        </KpiValue>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Entrada de valor</span>
                                    </KpiCard>
                                </KpiGrid>

                                {/* ENVIADAS POR ESTABELECIMENTO */}
                                <SummarySection>
                                    <SectionTitle>
                                        <SectionIcon>📤</SectionIcon>
                                        Enviadas por Destino
                                    </SectionTitle>

                                    {(!summaryData.sent?.byEstablishment || summaryData.sent.byEstablishment.length === 0) && (
                                        <EmptyState>Nenhuma transferência enviada no período</EmptyState>
                                    )}

                                    {summaryData.sent?.byEstablishment?.map((group) => (
                                        <GroupCard key={`sent-${group.establishmentId}`}>
                                            <GroupHeader onClick={() => toggleGroup(`sent-${group.establishmentId}`)}>
                                                <GroupName>🏪 {group.establishmentName}</GroupName>
                                                <GroupMeta>
                                                    <GroupMetaItem>
                                                        Qtd: <strong>{group.totalQuantity.toFixed(1)}</strong>
                                                    </GroupMetaItem>
                                                    <GroupMetaItem>
                                                        Valor: <strong>{formatCurrency(group.totalValue)}</strong>
                                                    </GroupMetaItem>
                                                    <ExpandIcon $expanded={expandedGroups[`sent-${group.establishmentId}`]}>
                                                        ▼
                                                    </ExpandIcon>
                                                </GroupMeta>
                                            </GroupHeader>

                                            {expandedGroups[`sent-${group.establishmentId}`] && (
                                                <GroupBody>
                                                    <Table>
                                                        <thead>
                                                            <tr>
                                                                <Th>Produto</Th>
                                                                <Th>Quantidade</Th>
                                                                <Th>Custo Unit.</Th>
                                                                <Th>Valor Total</Th>
                                                                <Th>Data</Th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {group.products.map((p, idx) => (
                                                                <Tr key={idx}>
                                                                    <Td>{p.productName}</Td>
                                                                    <Td>{p.quantity.toFixed(1)} {p.unit}</Td>
                                                                    <Td>{formatCurrency(p.unitCost)}</Td>
                                                                    <Td>{formatCurrency(p.totalCost)}</Td>
                                                                    <Td>{new Date(p.date).toLocaleDateString('pt-BR')}</Td>
                                                                </Tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </GroupBody>
                                            )}
                                        </GroupCard>
                                    ))}
                                </SummarySection>

                                {/* RECEBIDAS POR ESTABELECIMENTO */}
                                <SummarySection>
                                    <SectionTitle>
                                        <SectionIcon>📥</SectionIcon>
                                        Recebidas por Origem
                                    </SectionTitle>

                                    {(!summaryData.received?.byEstablishment || summaryData.received.byEstablishment.length === 0) && (
                                        <EmptyState>Nenhuma transferência recebida no período</EmptyState>
                                    )}

                                    {summaryData.received?.byEstablishment?.map((group) => (
                                        <GroupCard key={`recv-${group.establishmentId}`}>
                                            <GroupHeader onClick={() => toggleGroup(`recv-${group.establishmentId}`)}>
                                                <GroupName>🏪 {group.establishmentName}</GroupName>
                                                <GroupMeta>
                                                    <GroupMetaItem>
                                                        Qtd: <strong>{group.totalQuantity.toFixed(1)}</strong>
                                                    </GroupMetaItem>
                                                    <GroupMetaItem>
                                                        Valor: <strong>{formatCurrency(group.totalValue)}</strong>
                                                    </GroupMetaItem>
                                                    <ExpandIcon $expanded={expandedGroups[`recv-${group.establishmentId}`]}>
                                                        ▼
                                                    </ExpandIcon>
                                                </GroupMeta>
                                            </GroupHeader>

                                            {expandedGroups[`recv-${group.establishmentId}`] && (
                                                <GroupBody>
                                                    <Table>
                                                        <thead>
                                                            <tr>
                                                                <Th>Produto</Th>
                                                                <Th>Quantidade</Th>
                                                                <Th>Custo Unit.</Th>
                                                                <Th>Valor Total</Th>
                                                                <Th>Data</Th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {group.products.map((p, idx) => (
                                                                <Tr key={idx}>
                                                                    <Td>{p.productName}</Td>
                                                                    <Td>{p.quantity.toFixed(1)} {p.unit}</Td>
                                                                    <Td>{formatCurrency(p.unitCost)}</Td>
                                                                    <Td>{formatCurrency(p.totalCost)}</Td>
                                                                    <Td>{new Date(p.date).toLocaleDateString('pt-BR')}</Td>
                                                                </Tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </GroupBody>
                                            )}
                                        </GroupCard>
                                    ))}
                                </SummarySection>
                            </>
                        )}

                        {!summaryLoading && !summaryData && (
                            <EmptyState>Selecione um período e clique em "Filtrar" para ver o resumo</EmptyState>
                        )}
                    </>
                )}

            </Card>


        </Container>

    );

}