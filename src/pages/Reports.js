import React, { useState } from 'react';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import { Input } from '../components/FormFields';
import Button from '../components/Button';
import { useMemo } from 'react';

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

// ─── Component ──────────────────────────────────
const Reports = () => {
    const { state } = useApp();

    const [activeTab, setActiveTab] = useState('consumption');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

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
        if (!state.purchaseOrders?.length) return [];

        let orders = state.purchaseOrders;

        // filtro por data
        if (dateFrom) {
            orders = orders.filter(
                (o) => new Date(o.createdAt) >= new Date(dateFrom)
            );
        }

        if (dateTo) {
            orders = orders.filter(
                (o) => new Date(o.createdAt) <= new Date(dateTo + 'T23:59:59')
            );
        }

        const map = {};

        orders.forEach((order) => {
            const supplier = order.supplierName || 'Sem fornecedor';

            if (!map[supplier]) {
                map[supplier] = {
                    name: supplier,
                    totalQuantity: 0,
                    totalValue: 0
                };
            }

            order.items?.forEach((item) => {
                map[supplier].totalQuantity += Number(item.quantity || 0);
                map[supplier].totalValue += Number(item.totalCost || 0);
            });
        });

        return Object.values(map).map((item) => ({
            ...item,
            avgPrice:
                item.totalQuantity > 0
                    ? item.totalValue / item.totalQuantity
                    : 0
        }));
    }, [state.purchaseOrders, dateFrom, dateTo]);


    const purchaseVsConsumption = useMemo(() => {
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

        // 🟢 CONSUMO
        movements
            .filter((m) => m.type === 'OUT' && m.reason !== 'LOSS')
            .forEach((m) => {
                if (!map[m.productId]) {
                    map[m.productId] = {
                        name: m.productName,
                        consumed: 0,
                        purchased: 0
                    };
                }

                map[m.productId].consumed += Math.abs(Number(m.quantity));
            });

        // 🔵 COMPRA (entrada)
        movements
            .filter((m) => m.type === 'IN')
            .forEach((m) => {
                if (!map[m.productId]) {
                    map[m.productId] = {
                        name: m.productName,
                        consumed: 0,
                        purchased: 0
                    };
                }

                map[m.productId].purchased += Number(m.quantity);
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
            });
    }, [state.stockMovements, dateFrom, dateTo]);

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
                    <Card padding="0">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Produto</Th>
                                    <Th>Comprado</Th>
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
                                            {item.difference}
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
                                    <Th>Quantidade Total</Th>
                                    <Th>Valor Total</Th>
                                    <Th>Preço Médio</Th>
                                </tr>
                            </thead>

                            <tbody>
                                {supplierData.map((item, index) => (
                                    <Tr key={index}>
                                        <Td style={{ fontWeight: 600 }}>{item.name}</Td>

                                        <Td>{item.totalQuantity}</Td>

                                        <Td>R$ {item.totalValue.toFixed(2)}</Td>

                                        <Td>R$ {item.avgPrice.toFixed(2)}</Td>
                                    </Tr>
                                ))}
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

            </Content>
        </>
    );
};

export default Reports;