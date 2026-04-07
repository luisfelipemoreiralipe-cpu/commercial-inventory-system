import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { 
  MdAdd, 
  MdCheckCircle, 
  MdReceipt, 
  MdRefresh, 
  MdHelpOutline,
  MdArrowForward,
  MdInput,
  MdClose,
  MdPrint
} from 'react-icons/md';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import Card from '../components/Card';
import toast from 'react-hot-toast';

// ─── Styled Components ────────────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const TitleBlock = styled.div`
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
    margin: 0;
  }
  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.9rem;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${({ theme, $variant }) => $variant === 'secondary' ? theme.colors.bgCard : theme.colors.primary};
  color: ${({ theme, $variant }) => $variant === 'secondary' ? theme.colors.text : '#fff'};
  border: 1px solid ${({ theme, $variant }) => $variant === 'secondary' ? theme.colors.border : 'transparent'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
    background: ${({ theme, $variant }) => $variant === 'secondary' ? theme.colors.bgHover : theme.colors.primaryDark};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const EventTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textMuted};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  td {
    padding: 16px;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.text};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  tr:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${({ $status, theme }) => $status === 'OPEN' ? theme.colors.warningLight : theme.colors.successLight};
  color: ${({ $status, theme }) => $status === 'OPEN' ? theme.colors.warning : theme.colors.success};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  width: 100%;
  max-width: 800px;
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadows.xl};
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 { font-size: 1.25rem; margin: 0; }
`;

const ModalBody = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  input, select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
  }
`;

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 100px 40px;
  gap: 12px;
  margin-bottom: 12px;
  align-items: flex-end;
`;

const RemoveBtn = styled.button`
  background: ${({ theme }) => theme.colors.dangerLight};
  color: ${({ theme }) => theme.colors.danger};
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.danger}; color: #fff; }
`;

const SummaryBox = styled.div`
  background: ${({ theme }) => theme.colors.bg};
  padding: 16px;
  border-radius: 12px;
  margin-top: 24px;
  border: 1px dashed ${({ theme }) => theme.colors.border};

  h4 { margin: 0 0 12px 0; font-size: 0.9rem; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  span:last-child { 
    font-weight: 700; 
    color: ${({ $highlight, theme }) => $highlight ? theme.colors.primary : theme.colors.text};
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketingEvents() {
  const { state } = useApp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [report, setReport] = useState(null);

  // Form States (Novo Evento)
  const [eventName, setEventName] = useState('');
  const [eventItems, setEventItems] = useState([{ productId: '', units: 1 }]);

  // Form States (Check-in)
  const [returnItems, setReturnItems] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, [state.establishment]);

  const fetchEvents = async () => {
    try {
      const { default: api } = await import('../services/api');
      const res = await api.get('/consumption-events');
      
      const eventData = res.events || res.data?.events || [];
      setEvents(eventData);
    } catch (err) {
      console.error("❌ ERRO AO BUSCAR EVENTOS:", err);
      toast.error('Erro ao buscar eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName || eventItems.some(i => !i.productId)) {
        return toast.error('Preencha o nome e selecione os produtos');
    }

    try {
      const { default: api } = await import('../services/api');
      await api.post('/consumption-events/checkout', { name: eventName, items: eventItems });
      toast.success('Evento de consumo aberto com sucesso!');
      setShowNewModal(false);
      setEventName('');
      setEventItems([{ productId: '', units: 1 }]);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar evento');
    }
  };

  const handleOpenCheckIn = async (event) => {
    setSelectedEvent(event);
    try {
        const { default: api } = await import('../services/api');
        const res = await api.get(`/consumption-events/${event.id}/report`);
        
        // Suporta tanto res.report (API simplificada) quanto res.data.report (Axios puro)
        const rep = res.report || res.data?.report;
        
        if (!rep) throw new Error("Relatório não encontrado na resposta");

        setReport(rep);
        setReturnItems(rep.items.map(item => ({
            productId: item.productId,
            name: item.name,
            units: 0,
            looseQty: 0
        })));
        setShowCheckInModal(true);
    } catch (err) {
        console.error("❌ ERRO AO ABRIR RELATÓRIO:", err);
        toast.error('Erro ao carregar dados do evento');
    }
  };

  const handleExportPDF = () => {
    if (!report || !selectedEvent) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('Ordem de Separação - Controle de Compras BDS', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    // Dados do Evento
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Evento: ${selectedEvent.name}`, 14, 42);
    doc.text(`Data do Evento: ${new Date(selectedEvent.createdAt).toLocaleDateString('pt-BR')}`, 14, 50);

    // Tabela de Itens
    const tableData = report.items.map(item => [
      item.name,
      (item.withdrawn / (productsOptions.find(p => p.name === item.name)?.packQuantity || 1)).toFixed(1),
      item.purchaseUnit,
      item.returned > 0 ? `${(item.returned / (productsOptions.find(p => p.name === item.name)?.packQuantity || 1)).toFixed(1)} ${item.purchaseUnit}` : '-'
    ]);

    autoTable(doc, {
      startY: 60,
      head: [['Produto', 'Qtd. Solicitada', 'Unidade', 'Retorno (Sobras)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: [30, 41, 59], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    // Rodapé de Assinaturas
    const finalY = (doc).lastAutoTable.finalY + 30;
    doc.text('_________________________________', 14, finalY);
    doc.text('Assinatura do Estoquista', 14, finalY + 7);

    doc.text('_________________________________', pageWidth - 80, finalY);
    doc.text('Assinatura do Solicitante', pageWidth - 80, finalY + 7);

    doc.save(`evento-${selectedEvent.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const handleCloseEvent = async () => {
    try {
      const { default: api } = await import('../services/api');
      await api.post('/consumption-events/checkin', { 
        eventId: selectedEvent.id, 
        items: returnItems 
      });
      toast.success('Evento encerrado e sobras registradas!');
      setShowCheckInModal(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao encerrar evento');
    }
  };

  // Helper para renderizar nomes de produtos com estoque atual e packQuantity
  const productsOptions = state.products?.filter(p => p.isActive && p.type === 'INVENTORY') || [];

  return (
    <>
      <PageHeader>
        <TitleBlock>
          <h1>Eventos de Consumo</h1>
          <p>Gestão de retiradas de marketing, degustações e eventos internos.</p>
        </TitleBlock>
        <ActionButton onClick={() => setShowNewModal(true)}>
          <MdAdd size={20} />
          Novo Evento
        </ActionButton>
      </PageHeader>

      <Grid>
        <Card title="Histórico de Eventos">
          <EventTable>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data</th>
                <th>Status</th>
                <th>Itens</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{event.name}</div>
                  </td>
                  <td>{new Date(event.createdAt).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge $status={event.status}>
                      {event.status === 'OPEN' ? 'Em andamento' : 'Encerrado'}
                    </StatusBadge>
                  </td>
                  <td>{event._count.items} produtos</td>
                  <td>
                    {event.status === 'OPEN' ? (
                      <ActionButton 
                        $variant="secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenCheckIn(event)}
                      >
                        <MdCheckCircle size={14} />
                        Check-in
                      </ActionButton>
                    ) : (
                      <ActionButton 
                        $variant="secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenCheckIn(event)} // Abre apenas para ver o relatório
                      >
                        <MdReceipt size={14} />
                        Relatório
                      </ActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </EventTable>
        </Card>

        <div>
          <Card title="Resumo Rápido">
             <MdHelpOutline size={48} color="#94a3b8" style={{ display: 'block', margin: '20px auto' }} />
             <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
               Selecione um evento finalizado para visualizar o custo detalhado da ação.
             </p>
          </Card>
        </div>
      </Grid>

      {/* MODAL NOVO EVENTO */}
      {showNewModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <h2>Nova Requisição de Consumo</h2>
              <button 
                onClick={() => setShowNewModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}
              >
                <MdClose />
              </button>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <label>Nome do Evento / Ação</label>
                <input 
                  placeholder="Ex: Resenha Marketing 06/04" 
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                />
              </FormGroup>

              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '12px' }}>
                Itens p/ Retirada (Unidades Inteiras)
              </label>

              {eventItems.map((item, idx) => (
                <ItemRow key={idx}>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <select 
                      value={item.productId}
                      onChange={e => {
                        const newItems = [...eventItems];
                        newItems[idx].productId = e.target.value;
                        setEventItems(newItems);
                      }}
                    >
                      <option value="">Selecione um produto...</option>
                      {productsOptions.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.purchaseUnit})</option>
                      ))}
                    </select>
                  </FormGroup>
                  <FormGroup style={{ marginBottom: 0 }}>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.units}
                      onChange={e => {
                        const newItems = [...eventItems];
                        newItems[idx].units = Number(e.target.value);
                        setEventItems(newItems);
                      }}
                    />
                  </FormGroup>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', paddingBottom: '12px' }}>
                    {(() => {
                        const p = productsOptions.find(opt => opt.id === item.productId);
                        return p ? `${(p.packQuantity * item.units).toFixed(0)} ${p.unit}` : '-';
                    })()}
                  </div>
                  <RemoveBtn onClick={() => setEventItems(eventItems.filter((_, i) => i !== idx))}>
                    &times;
                  </RemoveBtn>
                </ItemRow>
              ))}

              <ActionButton 
                $variant="secondary" 
                style={{ width: '100%', marginTop: '12px', borderStyle: 'dashed' }}
                onClick={() => setEventItems([...eventItems, { productId: '', units: 1 }])}
              >
                <MdAdd /> Adicionar Item
              </ActionButton>
            </ModalBody>
            <ModalFooter>
              <ActionButton $variant="secondary" onClick={() => setShowNewModal(false)}>Cancelar</ActionButton>
              <ActionButton onClick={handleCreateEvent}>
                <MdCheckCircle /> Criar Requisição
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* MODAL CHECK-IN / RELATÓRIO */}
      {showCheckInModal && report && (
        <ModalOverlay>
          <ModalContent style={{ maxWidth: '900px' }}>
            <ModalHeader>
              <h2>{report.status === 'OPEN' ? 'Check-in de Sobras' : 'Relatório da Ação'}</h2>
              <div style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                {selectedEvent?.name}
              </div>
            </ModalHeader>
            <ModalBody>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <Card style={{ padding: '16px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total Retirado</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{formatCurrency(report.totalWithdrawn)}</div>
                </Card>
                <Card style={{ padding: '16px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Total Devolvido</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{formatCurrency(report.totalReturned)}</div>
                </Card>
                <Card style={{ padding: '16px', background: '#eff6ff', border: '1px solid #3b82f6' }}>
                  <div style={{ fontSize: '0.75rem', color: '#3b82f6', textTransform: 'uppercase' }}>Custo Real da Ação</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af' }}>{formatCurrency(report.realCost)}</div>
                </Card>
              </div>

              <EventTable>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Retirado</th>
                    <th>{report.status === 'OPEN' ? 'Retornar (Unidades)' : 'Retornado'}</th>
                    <th>{report.status === 'OPEN' ? 'Retornar (Avulso)' : 'Sobras'}</th>
                    <th>Custo Real</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                            {(item.withdrawn / (productsOptions.find(p => p.name === item.name)?.packQuantity || 1)).toFixed(2)} 
                        </span> {item.purchaseUnit} ({item.withdrawn} {item.unit})
                      </td>
                      <td>
                        {report.status === 'OPEN' ? (
                          <input 
                            type="number"
                            style={{ width: '80px', padding: '6px' }}
                            value={returnItems[idx]?.units || 0}
                            onChange={e => {
                                const newReturns = [...returnItems];
                                newReturns[idx].units = Number(e.target.value);
                                setReturnItems(newReturns);
                            }}
                          />
                        ) : (
                          `${(item.returned / (productsOptions.find(p => p.name === item.name)?.packQuantity || 1)).toFixed(1)} ${item.purchaseUnit}`
                        )}
                      </td>
                      <td>
                         {report.status === 'OPEN' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <input 
                                type="number"
                                style={{ width: '80px', padding: '6px' }}
                                value={returnItems[idx]?.looseQty || 0}
                                onChange={e => {
                                    const newReturns = [...returnItems];
                                    newReturns[idx].looseQty = Number(e.target.value);
                                    setReturnItems(newReturns);
                                }}
                            /> {item.unit}
                          </div>
                        ) : (
                          `${item.returned} ${item.unit}`
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(item.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </EventTable>
            </ModalBody>
            <ModalFooter>
              <ActionButton $variant="secondary" onClick={handleExportPDF} style={{ marginRight: 'auto' }}>
                <MdPrint /> Exportar PDF
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => setShowCheckInModal(false)}>Fechar</ActionButton>
              {report.status === 'OPEN' && (
                <ActionButton onClick={handleCloseEvent}>
                  <MdArrowForward /> Finalizar Ação e Devolver Estoque
                </ActionButton>
              )}
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}
