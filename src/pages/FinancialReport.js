import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MdTrendingUp, MdTrendingDown, MdLocalBar, MdCardGiftcard } from 'react-icons/md';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  input[type="date"] {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.bgInput};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    outline: none;
    transition: ${({ theme }) => theme.transition};

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryLight};
    }
  }

  button {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    border: none;
    border-radius: ${({ theme }) => theme.radii.md};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    cursor: pointer;
    transition: ${({ theme }) => theme.transition};

    &:hover {
      background: ${({ theme }) => theme.colors.primaryDark};
    }
  }
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${({ color }) => color};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ bg }) => bg};
  color: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const MetricTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin: 0;
`;

const MetricValue = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin: 0;
`;

const ChartContainer = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  height: 400px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin: 0;
`;

const FinancialReport = () => {
    const [dateFrom, setDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    
    const [dateTo, setDateTo] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [summary, setSummary] = useState({
        salesCogs: 0,
        internalConsumption: 0,
        operationalConsumption: 0,
        beverageOperationalConsumption: 0,
        cleaningConsumption: 0,
        disposablesConsumption: 0,
        otherOperationalConsumption: 0,
        bonuses: 0,
        losses: 0,
        purchasesByClassification: {}
    });

    const [chartData, setChartData] = useState([]);

    const loadData = async () => {
        try {
            const res = await api.get('/reports/financial-summary', {
                params: { dateFrom, dateTo }
            });
            setSummary(res.summary);
            setChartData(res.chartData);
        } catch (error) {
            console.error("Erro ao buscar relatório", error);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const metrics = [
        {
            title: "CMV de Vendas",
            value: summary.salesCogs,
            icon: <MdTrendingUp />,
            color: "#059669",
            bg: "rgba(5, 150, 105, 0.12)"
        },
        {
            title: "Consumo Interno",
            value: summary.internalConsumption,
            icon: <MdLocalBar />,
            color: "#3B82F6",
            bg: "rgba(59, 130, 246, 0.12)"
        },
        {
            title: "Cortesias e promoções de bebidas",
            value: summary.beverageOperationalConsumption,
            icon: <MdLocalBar />,
            color: "#F59E0B",
            bg: "rgba(245, 158, 11, 0.12)"
        },
        {
            title: "Consumo de limpeza",
            value: summary.cleaningConsumption,
            icon: <MdTrendingDown />,
            color: "#0EA5E9",
            bg: "rgba(14, 165, 233, 0.12)"
        },
        {
            title: "Consumo de descartáveis",
            value: summary.disposablesConsumption,
            icon: <MdTrendingDown />,
            color: "#EC4899",
            bg: "rgba(236, 72, 153, 0.12)"
        },
        {
            title: "Outros consumos operacionais",
            value: summary.otherOperationalConsumption,
            icon: <MdTrendingDown />,
            color: "#64748B",
            bg: "rgba(100, 116, 139, 0.12)"
        },
        {
            title: "Bonificações (Ganhos)",
            value: summary.bonuses,
            icon: <MdCardGiftcard />,
            color: "#8B5CF6",
            bg: "rgba(139, 92, 246, 0.12)"
        },
        {
            title: "Perdas / Sobras",
            value: summary.losses,
            icon: <MdTrendingDown />,
            color: "#DC2626",
            bg: "rgba(220, 38, 38, 0.12)"
        }
    ];

    return (
        <PageContainer>
            <Header>
                <Title>Relatório Financeiro</Title>
                <FilterGroup>
                    <input 
                        type="date" 
                        value={dateFrom} 
                        onChange={(e) => setDateFrom(e.target.value)} 
                        max={dateTo}
                    />
                    <span style={{ color: '#9CA3AF' }}>até</span>
                    <input 
                        type="date" 
                        value={dateTo} 
                        onChange={(e) => setDateTo(e.target.value)} 
                        min={dateFrom}
                    />
                    <button onClick={loadData}>Filtrar</button>
                </FilterGroup>
            </Header>

            <CardsGrid>
                {metrics.map((metric, idx) => (
                    <MetricCard key={idx} color={metric.color}>
                        <MetricHeader>
                            <MetricTitle>{metric.title}</MetricTitle>
                            <MetricIcon bg={metric.bg} color={metric.color}>
                                {metric.icon}
                            </MetricIcon>
                        </MetricHeader>
                        <MetricValue>{formatCurrency(metric.value)}</MetricValue>
                    </MetricCard>
                ))}
            </CardsGrid>

            <ChartContainer style={{ height: 'auto' }}>
                <ChartTitle>Compras concluídas por classificação</ChartTitle>
                <CardsGrid>
                    {[
                        ['CMV_BEVERAGES', 'Bebidas / CMV'],
                        ['CLEANING', 'Limpeza'],
                        ['DISPOSABLES', 'Descartáveis'],
                        ['OPERATING', 'Outros operacionais']
                    ].map(([key, label]) => (
                        <div key={key}>
                            <MetricTitle>{label}</MetricTitle>
                            <MetricValue style={{ fontSize: '1.5rem' }}>
                                {formatCurrency(summary.purchasesByClassification?.[key])}
                            </MetricValue>
                        </div>
                    ))}
                </CardsGrid>
            </ChartContainer>

            <ChartContainer>
                <ChartTitle>Evolução Diária</ChartTitle>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6B7280', fontSize: 12 }} 
                            tickFormatter={(val) => {
                                const parts = val.split('-');
                                return `${parts[2]}/${parts[1]}`;
                            }}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            tickFormatter={(val) => `R$ ${val}`} 
                        />
                        <RechartsTooltip 
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(label) => {
                                const parts = label.split('-');
                                return `${parts[2]}/${parts[1]}/${parts[0]}`;
                            }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar name="CMV Vendas" dataKey="salesCogs" fill="#059669" radius={[4, 4, 0, 0]} />
                        <Bar name="Consumo Interno" dataKey="internalConsumption" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar name="Cortesias / Promoções" dataKey="beverageOperationalConsumption" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        <Bar name="Limpeza" dataKey="cleaningConsumption" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                        <Bar name="Descartáveis" dataKey="disposablesConsumption" fill="#EC4899" radius={[4, 4, 0, 0]} />
                        <Bar name="Outros operacionais" dataKey="otherOperationalConsumption" fill="#64748B" radius={[4, 4, 0, 0]} />
                        <Bar name="Bonificações" dataKey="bonuses" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        <Bar name="Perdas" dataKey="losses" fill="#DC2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>

        </PageContainer>
    );
};

export default FinancialReport;
