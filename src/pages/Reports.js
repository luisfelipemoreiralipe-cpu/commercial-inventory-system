import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import { Input } from '../components/FormFields';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../services/api';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from 'recharts';

// ─── Styled ─────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  

  ${({ status, theme }) => {
        if (status === 'ok') {
            return `
        background: ${theme.colors.successLight};
        color: ${theme.colors.success};
      `;
        }

        if (status === 'excesso') {
            return `
        background: ${theme.colors.warningLight};
        color: ${theme.colors.warning};
      `;
        }

        if (status === 'falta') {
            return `
        background: ${theme.colors.dangerLight};
        color: ${theme.colors.danger};
      `;
        }
    }}
`;
const TypeBadge = styled.span`
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  ${({ type, theme }) => {
        if (type === 'IN') {
            return `
        background: ${theme.colors.successLight};
        color: ${theme.colors.success};
      `;
        }

        if (type === 'OUT') {
            return `
        background: ${theme.colors.dangerLight};
        color: ${theme.colors.danger};
      `;
        }

        return `
      background: ${theme.colors.bgHover};
      color: ${theme.colors.textSecondary};
    `;
    }}
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

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const Content = styled.div``;

const SupplierLink = styled.span`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;

// ─── Component ──────────────────────────────────
const Reports = () => {
    const { state } = useApp();

    const [activeTab, setActiveTab] = useState('consumption');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
    const [supplierModalLoading, setSupplierModalLoading] = useState(false);
    const [supplierModalData, setSupplierModalData] = useState([]);

    const [bonusTrend, setBonusTrend] = useState([]);
    const [bonusTrendLoading, setBonusTrendLoading] = useState(false);

    useEffect(() => {
        const fetchBonusTrend = async () => {
            setBonusTrendLoading(true);
            try {
                let url = '/reports/bonus-trend';
                const params = new URLSearchParams();
                if (dateFrom) params.append('dateFrom', dateFrom);
                if (dateTo) params.append('dateTo', dateTo);
                if (params.toString()) url += `?${params.toString()}`;

                const res = await api.get(url);
                console.log("Dados da Tendência Mensal (Bruto):", res);

                // Smart Unwrap handle: se 'res' já for a lista, usa direto.
                const monthlyData = Array.isArray(res) ? res : (res?.data || []);
                console.log("Dados da Tendência Mensal (Array Processado):", monthlyData);
                
                setBonusTrend(monthlyData);
            } catch (err) {
                console.error("Erro ao carregar tendência de bônus:", err);
            } finally {
                setBonusTrendLoading(false);
            }
        };

        fetchBonusTrend();
    }, [dateFrom, dateTo]);

    const handleOpenSupplierDetails = async (supplierItem) => {
        setSelectedSupplierDetails(supplierItem);
        setIsSupplierModalOpen(true);
        setSupplierModalLoading(true);
        setSupplierModalData([]);

        try {
            // Tenta obter o supplierId: primeiro do próprio item, depois busca por nome
            const supplierId = supplierItem.supplierId 
                || state.suppliers?.find(s => s.name === supplierItem.name)?.id;
            
            // Monta URL — funciona com ou sem supplierId
            let url = `/stock-movements?type=IN&reason=BONUS&page=1&limit=100`;
            if (supplierId) url += `&supplierId=${supplierId}`;
            if (dateFrom) url += `&dateFrom=${dateFrom}`;
            if (dateTo) url += `&dateTo=${dateTo}`;

            const res = await api.get(url);
            console.log("Dados do Raio-X (Resposta Completa):", res);

            // Simplifica extração: res pode ser o array direto ou estar em res.data
            const rawData = Array.isArray(res) ? res : (res.data || []);
            console.log("Dados do Raio-X (Array Processado):", rawData);
            
            setSupplierModalData(Array.isArray(rawData) ? rawData : []);
        } catch (err) {
            console.error("Erro ao carregar detalhes do Raio-X:", err);
        } finally {
            setSupplierModalLoading(false);
        }
    };

    const consumptionData = useMemo(() => {
        if (!state.stockMovements?.length) return [];

        let movements = state.stockMovements;
        const consumptionMap = {};
        movements
            .filter((m) => m.type === 'OUT' && m.reason !== 'LOSS')
            .forEach((m) => {
                if (!consumptionMap[m.productId]) {
                    consumptionMap[m.productId] = 0;
                }

                consumptionMap[m.productId] += Math.abs(Number(m.quantity || 0));
            });



        // filtro por data
        if (dateFrom) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59')
            );
        }



        // agrupar por produto
        const map = {};

        movements
            .filter((m) => m.type === 'OUT' && m.reason !== 'LOSS')
            .forEach((m) => {
                if (!map[m.productId]) {
                    map[m.productId] = {
                        name: m.productName,
                        quantity: 0,
                        totalCost: 0,
                        lastDate: m.createdAt
                    };
                }

                map[m.productId].quantity += Math.abs(Number(m.quantity));
                map[m.productId].totalCost += Number(m.totalCost || 0);

                if (new Date(m.createdAt) > new Date(map[m.productId].lastDate)) {
                    map[m.productId].lastDate = m.createdAt;
                }
            });

        return Object.values(map).sort((a, b) => b.quantity - a.quantity);
    }, [state.stockMovements, dateFrom, dateTo]);

    const historyData = useMemo(() => {
        if (!state.stockMovements?.length) return [];

        let movements = state.stockMovements;

        // filtro por data
        if (dateFrom) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59')
            );
        }

        return movements
            .map((m) => ({
                id: m.id,
                date: m.createdAt,
                product: m.productName,
                type: m.type,
                reason: m.reason,
                quantity: m.quantity,
                cost: m.totalCost || 0
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [state.stockMovements, dateFrom, dateTo]);

    const supplierData = useMemo(() => {
        if (!state.purchaseOrders?.length && !state.stockMovements?.length) return [];

        let orders = (state.purchaseOrders || []).filter(o => o.status === 'completed');
        let movements = state.stockMovements || [];

        // 1. FILTRAR POR DATA DE COMPETÊNCIA (completedAt para compras, createdAt para bônus)
        if (dateFrom) {
            orders = orders.filter((o) => new Date(o.completedAt || o.createdAt) >= new Date(dateFrom));
            movements = movements.filter((m) => new Date(m.createdAt) >= new Date(dateFrom));
        }

        if (dateTo) {
            orders = orders.filter((o) => new Date(o.completedAt || o.createdAt) <= new Date(dateTo + 'T23:59:59'));
            movements = movements.filter((m) => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59'));
        }

        const map = {};

        // 2. FORNECEDOR QUE MAIS COMPRAMOS (Baseado nas Ordens)
        orders.forEach((order) => {
            const orderSupplierId = order.items?.[0]?.supplierId;
            const mappedSupplier = state.suppliers?.find(sup => sup.id === orderSupplierId);
            const supplier = order.supplierName || mappedSupplier?.name || 'Sem fornecedor';

            if (!map[supplier]) {
                map[supplier] = {
                    name: supplier,
                    purchaseQuantity: 0,
                    purchaseValue: 0,
                    bonusQuantity: 0,
                    bonusValue: 0,
                    orderCount: 0
                };
            }

            map[supplier].orderCount += 1;

            order.items?.forEach((item) => {
                map[supplier].purchaseQuantity += Number(item.adjustedQuantity || 0);
                map[supplier].purchaseValue += Number(item.adjustedQuantity || 0) * Number(item.unitPrice || 0);
            });
        });

        // 3. FORNECEDOR QUE MAIS BONIFICA (Aceita novo formato type=IN+reason=BONUS E legado type=BONUS)
        movements
            .filter(m => (m.type === 'IN' && m.reason === 'BONUS') || m.type === 'BONUS')
            .forEach(m => {
                const product = state.products?.find(p => p.id === m.productId);
                
                // Busca o fornecedor diretamente do movimento (incluído pelo Backend)
                let supplierName = 'Diversos/Sem Fornecedor';
                if (m.supplier?.name) {
                    supplierName = m.supplier.name;
                } else if (map['Sem fornecedor']) {
                    supplierName = 'Sem fornecedor';
                }

                // Match name if possible (heuristic based on existing orders)
                const existingSupplierKey = Object.keys(map).find(k => map[k].name === supplierName) || supplierName;

                if (!map[existingSupplierKey]) {
                    map[existingSupplierKey] = {
                        name: existingSupplierKey,
                        purchaseQuantity: 0,
                        purchaseValue: 0,
                        bonusQuantity: 0,
                        bonusValue: 0,
                        orderCount: 0
                    };
                }

                map[existingSupplierKey].bonusQuantity += Number(m.quantity || 0);
                // A economia gerada baseia-se no custo atual salvo em currentCost ou no próprio movimento
                const costVal = Number(m.totalCost || (Number(m.quantity) * Number(product?.currentCost || 0)));
                map[existingSupplierKey].bonusValue += costVal;
            });

        return Object.values(map)
            .map((item) => ({
                ...item,
                avgPrice: item.purchaseQuantity > 0 ? (item.purchaseValue / item.purchaseQuantity) : 0,
                totalValue: item.purchaseValue // compatibility alias for UI
            }))
            .sort((a, b) => b.purchaseValue - a.purchaseValue); // Ranking por Valor de Compra
    }, [state.purchaseOrders, state.stockMovements, state.products, dateFrom, dateTo]);


    const purchaseVsConsumption = useMemo(() => {
        if (!state.stockMovements?.length && !state.purchaseOrders?.length) return [];

        let movements = state.stockMovements || [];
        let orders = (state.purchaseOrders || []).filter(o => o.status === 'completed');

        // filtro por data para movimentos
        if (dateFrom) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) >= new Date(dateFrom)
            );
            orders = orders.filter(
                (o) => new Date(o.completedAt || o.createdAt) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59')
            );
            orders = orders.filter(
                (o) => new Date(o.completedAt || o.createdAt) <= new Date(dateTo + 'T23:59:59')
            );
        }

        const map = {};

        // 🟢 CONSUMO (Saídas gerais e CSV, ignora perdas)
        movements
            .filter((m) => m.type === 'OUT' && m.reason !== 'LOSS')
            .forEach((m) => {
                if (!map[m.productId]) {
                    map[m.productId] = { name: m.productName, consumed: 0, purchased: 0, bonus: 0 };
                }
                map[m.productId].consumed += Math.abs(Number(m.quantity));
            });

        // 🔵 COMPRA (Vindo direto das Ordens de Compra Concluídas)
        orders.forEach((order) => {
            order.items?.forEach(item => {
                if (!map[item.productId]) {
                    map[item.productId] = { name: item.productName, consumed: 0, purchased: 0, bonus: 0 };
                }
                map[item.productId].purchased += Number(item.adjustedQuantity || 0);
            });
        });

        // 🟡 BONIFICAÇÕES (Entradas tipo BONUS)
        movements
            .filter((m) => m.type === 'IN' && m.reason === 'BONUS')
            .forEach((m) => {
                if (!map[m.productId]) {
                    map[m.productId] = { name: m.productName, consumed: 0, purchased: 0, bonus: 0 };
                }
                map[m.productId].bonus += Number(m.quantity || 0);
                map[m.productId].purchased += Number(m.quantity || 0); // soma no total de recebidos
            });

        return Object.values(map)
            .map((item) => {
                const diff = item.purchased - item.consumed;

                let status = 'ok';

                if (diff > item.consumed * 0.3) {
                    status = 'excesso';
                } else if (diff < 0) {
                    status = 'falta';
                }

                return {
                    ...item,
                    difference: diff,
                    status
                };
            })
            .sort((a, b) => b.purchased - a.purchased);
    }, [state.stockMovements, state.purchaseOrders, dateFrom, dateTo]);

    const purchaseInsight = useMemo(() => {
        if (!purchaseVsConsumption.length) return null;

        let totalPurchased = 0;
        let totalConsumed = 0;

        purchaseVsConsumption.forEach((item) => {
            totalPurchased += item.purchased;
            totalConsumed += item.consumed;
        });

        if (!totalConsumed) return null;

        const diffPercent = ((totalPurchased - totalConsumed) / totalConsumed) * 100;

        return diffPercent;
    }, [purchaseVsConsumption]);

    const lossData = useMemo(() => {
        if (!state.stockMovements?.length) return [];

        let movements = state.stockMovements;

        // filtro por data
        if (dateFrom) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            movements = movements.filter(
                (m) => new Date(m.createdAt) <= new Date(dateTo + 'T23:59:59')
            );
        }

        const map = {};
        const consumptionMap = {};

        // 🔵 CONSUMO (base para %)
        movements
            .filter((m) => m.type === 'OUT' && m.reason !== 'LOSS')
            .forEach((m) => {
                if (!consumptionMap[m.productId]) {
                    consumptionMap[m.productId] = 0;
                }

                consumptionMap[m.productId] += Math.abs(Number(m.quantity || 0));
            });

        // 🔴 PERDAS
        movements
            .filter((m) => m.type === 'OUT' && m.reason === 'LOSS')
            .forEach((m) => {
                if (!map[m.productId]) {
                    map[m.productId] = {
                        productId: m.productId, // IMPORTANTE
                        name: m.productName,
                        quantity: 0,
                        value: 0
                    };
                }

                map[m.productId].quantity += Math.abs(Number(m.quantity || 0));
                map[m.productId].value += Number(m.totalCost || 0);
            });

        return Object.values(map)
            .map((item) => {
                const totalConsumed = consumptionMap[item.productId] || 0;

                return {
                    ...item,
                    percent:
                        totalConsumed > 0
                            ? (item.quantity / totalConsumed) * 100
                            : 0
                };
            })
            .sort((a, b) => b.value - a.value);
    }, [state.stockMovements, dateFrom, dateTo]);


    return (
        <>
            <PageHeader>
                <PageTitle>Relatórios</PageTitle>
                <PageSubtitle>
                    Análise detalhada de compras e consumo
                </PageSubtitle>
            </PageHeader>

            {/* Filtros */}
            <FiltersRow>
                <Input
                    label="De"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                />

                <Input
                    label="Até"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                    }}
                >
                    Limpar
                </Button>
            </FiltersRow>

            {/* Tabs */}
            {purchaseInsight !== null && (
                <Card
                    style={{
                        marginBottom: 16,
                        background:
                            purchaseInsight > 0
                                ? 'rgba(217,119,6,0.12)' // warning
                                : 'rgba(220,38,38,0.12)', // danger
                        color:
                            purchaseInsight > 0
                                ? '#D97706'
                                : '#DC2626'
                    }}
                >
                    <strong>
                        {purchaseInsight > 0
                            ? `Você está comprando ${purchaseInsight.toFixed(1)}% a mais do que consome`
                            : `Seu consumo está maior que as compras (${Math.abs(purchaseInsight).toFixed(1)}%)`}
                    </strong>
                </Card>
            )}
            <Tabs>
                <Button
                    variant={activeTab === 'consumption' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('consumption')}
                >
                    Consumo
                </Button>

                <Button
                    variant={activeTab === 'purchase' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('purchase')}
                >
                    Compra vs Consumo
                </Button>

                <Button
                    variant={activeTab === 'history' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('history')}
                >
                    Histórico
                </Button>

                <Button
                    variant={activeTab === 'supplier' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('supplier')}
                >
                    Fornecedores
                </Button>

                <Button
                    variant={activeTab === 'loss' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('loss')}
                >
                    Perdas
                </Button>

                <Button
                    variant={activeTab === 'metrics' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('metrics')}
                >
                    Métricas
                </Button>
            </Tabs>

            {/* Conteúdo */}
            <Content>

                {/* CONSUMO */}
                {activeTab === 'consumption' && (
                    <Card padding="0">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Produto</Th>
                                    <Th>Quantidade Consumida</Th>
                                    <Th>Custo Total</Th>
                                    <Th>Último Consumo</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {consumptionData.map((item, index) => (
                                    <Tr key={index}>
                                        <Td style={{ fontWeight: 600 }}>{item.name}</Td>
                                        <Td>{item.quantity}</Td>
                                        <Td>R$ {item.totalCost.toFixed(2)}</Td>
                                        <Td>
                                            {new Date(item.lastDate).toLocaleDateString('pt-BR')}
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                )}

                {/* COMPRA VS CONSUMO */}
                {activeTab === 'purchase' && (
                    <>
                    <Card style={{ marginBottom: 16 }}>
                        <div style={{ width: "100%", height: 300 }}>
                            {purchaseVsConsumption.length > 0 ? (
                                <ResponsiveContainer>
                                    <BarChart data={purchaseVsConsumption} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{fill: '#F3F4F6'}}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                         />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="purchased" name="Compras (Ordens + Bônus)" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="consumed" name="Consumo (Saídas)" fill="#DC2626" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>
                                    Nenhum dado encontrado no período.
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card padding="0">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Produto</Th>
                                    <Th>Comprado (Ordens + Bônus)</Th>
                                    <Th>Consumido</Th>
                                    <Th>Diferença</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {purchaseVsConsumption.map((item, index) => (
                                    <Tr key={index}>
                                        <Td style={{ fontWeight: 600 }}>{item.name}</Td>

                                        <Td>{item.purchased}</Td>

                                        <Td>{item.consumed}</Td>

                                        <Td
                                            style={{
                                                color:
                                                    item.difference < 0
                                                        ? '#DC2626'
                                                        : item.difference > 0
                                                            ? '#D97706'
                                                            : '#059669',
                                                fontWeight: 600
                                            }}
                                        >
                                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                                        </Td>

                                        <Td>
                                            <StatusBadge status={item.status}>
                                                {item.status === 'ok' && 'OK'}
                                                {item.status === 'excesso' && 'Excesso'}
                                                {item.status === 'falta' && 'Falta'}
                                            </StatusBadge>
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                    </>
                )}

                {/* HISTÓRICO */}
                {activeTab === 'history' && (
                    <Card padding="0">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Data</Th>
                                    <Th>Produto</Th>
                                    <Th>Tipo</Th>
                                    <Th>Motivo</Th>
                                    <Th>Quantidade</Th>
                                    <Th>Custo</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {historyData.map((item) => (
                                    <Tr key={item.id}>
                                        <Td>
                                            {new Date(item.date).toLocaleDateString('pt-BR')}
                                        </Td>

                                        <Td style={{ fontWeight: 600 }}>{item.product}</Td>

                                        <Td>
                                            <TypeBadge type={item.type}>
                                                {item.type}
                                            </TypeBadge>
                                        </Td>

                                        <Td>{item.reason}</Td>

                                        <Td
                                            style={{
                                                color:
                                                    item.type === 'OUT'
                                                        ? '#DC2626'
                                                        : '#059669',
                                                fontWeight: 600
                                            }}
                                        >
                                            {item.quantity}
                                        </Td>

                                        <Td>
                                            R$ {Number(item.cost).toFixed(2)}
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                )}

                {/* FORNECEDORES */}
                {activeTab === 'supplier' && (
                    <Card padding="0">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Fornecedor</Th>
                                    <Th>Ordens Recebidas</Th>
                                    <Th>Qtd Comprada</Th>
                                    <Th>Valor Investido</Th>
                                    <Th>Média por Ordem</Th>
                                    <Th>Qtd. Bonificada</Th>
                                    <Th>Ganha em Bonificação</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {supplierData.map((item, index) => {
                                    const avgOrder = item.orderCount > 0 ? (item.purchaseValue / item.orderCount) : 0;
                                    return (
                                    <Tr key={index}>
                                        <Td>
                                            <SupplierLink onClick={() => handleOpenSupplierDetails(item)}>
                                                {item.name}
                                            </SupplierLink>
                                        </Td>
                                        <Td>{item.orderCount}</Td>
                                        <Td>{item.purchaseQuantity}</Td>
                                        <Td>R$ {item.purchaseValue.toFixed(2)}</Td>
                                        <Td>R$ {avgOrder.toFixed(2)}</Td>
                                        <Td style={{ color: '#10B981', fontWeight: 600 }}>{item.bonusQuantity}</Td>
                                        <Td style={{ color: '#10B981', fontWeight: 600 }}>R$ {item.bonusValue.toFixed(2)}</Td>
                                    </Tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Card>
                )}
                {activeTab === 'loss' && (
                    <Card padding="0">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Produto</Th>
                                    <Th>Quantidade Perdida</Th>
                                    <Th>Valor Perdido</Th>
                                    <Th>% Perda</Th>

                                </tr>
                            </thead>

                            <tbody>
                                {lossData.map((item, index) => (
                                    <Tr key={index}>
                                        <Td style={{ fontWeight: 600 }}>{item.name}</Td>

                                        <Td style={{ color: '#DC2626', fontWeight: 600 }}>
                                            {item.quantity}
                                        </Td>

                                        <Td style={{ color: '#DC2626', fontWeight: 600 }}>
                                            R$ {item.value.toFixed(2)}
                                        </Td>
                                        <Td style={{ color: '#DC2626', fontWeight: 600 }}>
                                            {item.percent.toFixed(1)}%
                                        </Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                )}

                {activeTab === 'metrics' && (
                    <Card padding="24px">
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                                Evolução Mensal de Bonificações
                            </h3>
                            <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
                                Acompanhe o lucro bruto injetado via bonificações no seu estoque (Histórico {dateFrom || dateTo ? 'filtrado' : 'últimos 6 meses'}).
                            </p>
                        </div>

                        <div style={{ height: 400, width: '100%', minHeight: 300 }}>
                            {bonusTrendLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B' }}>
                                    Carregando dados evolutivos...
                                </div>
                            ) : bonusTrend.length === 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748B', background: '#F8FAFC', borderRadius: 12 }}>
                                    Nenhum dado de bonificação encontrado para este período.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={bonusTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis 
                                            dataKey="month" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748B', fontSize: 12 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                            tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: '#F1F5F9', radius: 4 }}
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: 'none', 
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                padding: '12px',
                                                background: '#FFF'
                                            }}
                                            formatter={(value) => [formatCurrency(value), 'Bonificação Total']}
                                            labelStyle={{ fontWeight: 600, color: '#1E293B', marginBottom: 4 }}
                                        />
                                        <Bar 
                                            dataKey="total" 
                                            fill="#10B981" 
                                            radius={[6, 6, 0, 0]} 
                                            barSize={32} 
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                )}


            </Content>

            <Modal 
                isOpen={isSupplierModalOpen} 
                onClose={() => setIsSupplierModalOpen(false)}
                title={`Detalhamento de Bônus: ${selectedSupplierDetails?.name}`}
            >
                <div style={{ marginBottom: 16 }}>
                    <strong>Total Geral Ganho:</strong> <span style={{ color: '#10B981' }}>{formatCurrency(selectedSupplierDetails?.bonusValue || 0)}</span>
                </div>
                
                {supplierModalLoading ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#64748B' }}>
                        Carregando detalhes...
                    </div>
                ) : (
                    <Card padding="0">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Data</Th>
                                    <Th>Produto</Th>
                                    <Th>Quantidade</Th>
                                    <Th>Valor Total</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplierModalData.map((item, index) => (
                                    <Tr key={index}>
                                        <Td>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Td>
                                        <Td>{item.productName}</Td>
                                        <Td>{item.quantity}</Td>
                                        <Td style={{ color: '#10B981', fontWeight: 600 }}>{formatCurrency(item.totalCost)}</Td>
                                    </Tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                )}
            </Modal>
        </>
    );
};

export default Reports;