import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useApp } from '../context/AppContext';

const Page = styled.div`display:grid;gap:20px;`;
const Header = styled.div`display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;`;
const Title = styled.h1`margin:0;color:${({theme})=>theme.colors.text};font-size:1.8rem;`;
const Hint = styled.p`margin:6px 0 0;color:${({theme})=>theme.colors.textMuted};max-width:760px;`;
const Tabs = styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const Tab = styled.button`border:1px solid ${({theme})=>theme.colors.border};border-radius:10px;padding:10px 14px;cursor:pointer;background:${({$active,theme})=>$active?theme.colors.primary:theme.colors.surface};color:${({$active,theme})=>$active?'white':theme.colors.text};font-weight:700;`;
const Panel = styled.section`background:${({theme})=>theme.colors.surface};border:1px solid ${({theme})=>theme.colors.border};border-radius:14px;padding:20px;box-shadow:${({theme})=>theme.shadows?.sm || '0 2px 8px rgba(0,0,0,.05)'};`;
const Grid = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;`;
const Field = styled.label`display:grid;gap:6px;color:${({theme})=>theme.colors.text};font-size:.88rem;font-weight:600;`;
const Control = styled.input`width:100%;box-sizing:border-box;border:1px solid ${({theme})=>theme.colors.border};border-radius:9px;padding:10px 12px;background:${({theme})=>theme.colors.bg};color:${({theme})=>theme.colors.text};`;
const Select = styled.select`width:100%;box-sizing:border-box;border:1px solid ${({theme})=>theme.colors.border};border-radius:9px;padding:10px 12px;background:${({theme})=>theme.colors.bg};color:${({theme})=>theme.colors.text};`;
const Button = styled.button`border:0;border-radius:9px;padding:11px 16px;background:${({theme})=>theme.colors.primary};color:white;font-weight:700;cursor:pointer;disabled{opacity:.55;cursor:not-allowed;}`;
const ProductList = styled.div`max-height:220px;overflow:auto;display:grid;gap:7px;border:1px solid ${({theme})=>theme.colors.border};border-radius:9px;padding:10px;`;
const ProductRow = styled.label`display:flex;gap:9px;align-items:center;color:${({theme})=>theme.colors.text};font-weight:400;`;
const Cards = styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;`;
const Card = styled.div`border:1px solid ${({theme})=>theme.colors.border};border-radius:12px;padding:14px;background:${({theme})=>theme.colors.bg};span{display:block;color:${({theme})=>theme.colors.textMuted};font-size:.78rem;margin-bottom:6px}strong{color:${({theme})=>theme.colors.text};font-size:1.25rem}`;
const TableWrap = styled.div`overflow:auto;`;
const Table = styled.table`width:100%;border-collapse:collapse;min-width:850px;th,td{text-align:left;padding:11px;border-bottom:1px solid ${({theme})=>theme.colors.border};color:${({theme})=>theme.colors.text};white-space:nowrap}th{font-size:.76rem;text-transform:uppercase;color:${({theme})=>theme.colors.textMuted}}`;

const today = () => new Date().toISOString().slice(0, 10);
const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const qty = value => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

export default function CommercialAgreements() {
  const { state } = useApp();
  const { suppliers = [], products = [] } = state;
  const [tab, setTab] = useState('summary');
  const [agreements, setAgreements] = useState([]);
  const [summary, setSummary] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name:'', brand:'', supplierId:'', buyQuantity:10, bonusQuantity:1, startsAt:today(), endsAt:'', productIds:[] });
  const [receipt, setReceipt] = useState({ agreementId:'', invoiceNumber:'', invoiceSeries:'', invoiceDate:today(), additionalCredits:'', productId:'', locationId:'', quantity:'', fiscalUnitPrice:'', commercialReferencePrice:'' });

  const load = useCallback(async () => {
    const [agreementData, summaryData, locationData] = await Promise.all([
      api.get('/commercial-agreements'), api.get('/commercial-agreements/summary'), api.get('/stock-locations')
    ]);
    setAgreements(Array.isArray(agreementData) ? agreementData : []);
    setSummary(Array.isArray(summaryData) ? summaryData : []);
    setLocations(Array.isArray(locationData) ? locationData : []);
  }, []);
  useEffect(() => { load().catch(()=>{}); }, [load]);

  const selectedAgreement = useMemo(() => agreements.find(a => a.id === receipt.agreementId), [agreements, receipt.agreementId]);
  const eligibleReceiptProducts = selectedAgreement?.products?.filter(p => p.canBeReceivedAsBonus) || [];
  const totalBenefit = summary.reduce((sum,row)=>sum+Number(row.totalBenefit||0),0);
  const totalPending = summary.reduce((sum,row)=>sum+Number(row.pendingBonusQuantity||0),0);

  const toggleProduct = productId => setForm(current => ({...current, productIds: current.productIds.includes(productId) ? current.productIds.filter(id=>id!==productId) : [...current.productIds, productId]}));
  const createAgreement = async event => {
    event.preventDefault();
    await api.post('/commercial-agreements', {...form, productIds: form.productIds.map(productId=>({productId}))});
    toast.success('Acordo comercial criado.');
    setForm({ name:'', brand:'', supplierId:'', buyQuantity:10, bonusQuantity:1, startsAt:today(), endsAt:'', productIds:[] });
    await load(); setTab('summary');
  };
  const receiveBonus = async event => {
    event.preventDefault();
    await api.post('/commercial-agreements/bonus-receipts', {
      ...receipt,
      additionalCredits:Number(receipt.additionalCredits||0),
      items:[{productId:receipt.productId,locationId:receipt.locationId,quantity:Number(receipt.quantity),fiscalUnitPrice:Number(receipt.fiscalUnitPrice),commercialReferencePrice:Number(receipt.commercialReferencePrice)}]
    });
    toast.success('Bonificacao recebida e estoque atualizado.');
    setReceipt({ agreementId:'', invoiceNumber:'', invoiceSeries:'', invoiceDate:today(), additionalCredits:'', productId:'', locationId:'', quantity:'', fiscalUnitPrice:'', commercialReferencePrice:'' });
    await load(); setTab('summary');
  };

  return <Page>
    <Header><div><Title>Acordos e bonificacoes</Title><Hint>A bonificacao e calculada individualmente em cada nota fiscal, sem acumular quantidades entre notas. O valor fiscal fica separado do beneficio comercial real.</Hint></div>
      <Tabs>{[['summary','Resumo'],['agreement','Novo acordo'],['receipt','Receber bonificacao']].map(([id,label])=><Tab key={id} $active={tab===id} onClick={()=>setTab(id)}>{label}</Tab>)}</Tabs>
    </Header>
    {tab === 'summary' && <><Cards><Card><span>Beneficio comercial total</span><strong>{money(totalBenefit)}</strong></Card><Card><span>Bonificacoes pendentes</span><strong>{qty(totalPending)}</strong></Card><Card><span>Acordos cadastrados</span><strong>{agreements.length}</strong></Card></Cards><Panel><TableWrap><Table><thead><tr><th>Acordo</th><th>Fornecedor</th><th>Ganho</th><th>Recebido</th><th>Pendente</th><th>Valor fiscal</th><th>Beneficio real</th></tr></thead><tbody>{summary.map(row=><tr key={row.agreementId}><td>{row.name}</td><td>{row.supplierName}</td><td>{qty(row.earnedBonusQuantity)}</td><td>{qty(row.receivedBonusQuantity)}</td><td>{qty(row.pendingBonusQuantity)}</td><td>{money(row.fiscalValue)}</td><td><strong>{money(row.totalBenefit)}</strong></td></tr>)}{!summary.length&&<tr><td colSpan="7">Nenhum acordo cadastrado.</td></tr>}</tbody></Table></TableWrap></Panel></>}
    {tab === 'agreement' && <Panel><form onSubmit={createAgreement}><Grid><Field>Nome do acordo<Control required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field>Marca<Control value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></Field><Field>Fornecedor<Select required value={form.supplierId} onChange={e=>setForm({...form,supplierId:e.target.value})}><option value="">Selecione</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field>Quantidade comprada<Control required min="0.001" step="0.001" type="number" value={form.buyQuantity} onChange={e=>setForm({...form,buyQuantity:e.target.value})}/></Field><Field>Quantidade bonificada<Control required min="0.001" step="0.001" type="number" value={form.bonusQuantity} onChange={e=>setForm({...form,bonusQuantity:e.target.value})}/></Field><Field>Inicio<Control required type="date" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})}/></Field><Field>Fim (opcional)<Control type="date" value={form.endsAt} onChange={e=>setForm({...form,endsAt:e.target.value})}/></Field></Grid><Field style={{margin:'16px 0'}}>Produtos elegiveis<ProductList>{products.filter(p=>p.isActive!==false).map(p=><ProductRow key={p.id}><input type="checkbox" checked={form.productIds.includes(p.id)} onChange={()=>toggleProduct(p.id)}/>{p.name}</ProductRow>)}</ProductList></Field><Button disabled={!form.productIds.length}>Salvar acordo</Button></form></Panel>}
    {tab === 'receipt' && <Panel><form onSubmit={receiveBonus}><Grid><Field>Acordo<Select required value={receipt.agreementId} onChange={e=>setReceipt({...receipt,agreementId:e.target.value,productId:''})}><option value="">Selecione</option>{agreements.filter(a=>a.status==='ACTIVE').map(a=><option key={a.id} value={a.id}>{a.name} - {a.supplier?.name}</option>)}</Select></Field><Field>Numero da nota<Control required value={receipt.invoiceNumber} onChange={e=>setReceipt({...receipt,invoiceNumber:e.target.value})}/></Field><Field>Serie<Control value={receipt.invoiceSeries} onChange={e=>setReceipt({...receipt,invoiceSeries:e.target.value})}/></Field><Field>Data da nota<Control required type="date" value={receipt.invoiceDate} onChange={e=>setReceipt({...receipt,invoiceDate:e.target.value})}/></Field><Field>Produto bonificado<Select required value={receipt.productId} onChange={e=>setReceipt({...receipt,productId:e.target.value})}><option value="">Selecione</option>{eligibleReceiptProducts.map(row=><option key={row.productId} value={row.productId}>{row.product.name}</option>)}</Select></Field><Field>Local de entrada<Select required value={receipt.locationId} onChange={e=>setReceipt({...receipt,locationId:e.target.value})}><option value="">Selecione</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field><Field>Quantidade recebida<Control required min="0.001" step="0.001" type="number" value={receipt.quantity} onChange={e=>setReceipt({...receipt,quantity:e.target.value})}/></Field><Field>Preco unitario fiscal<Control required min="0" step="0.01" type="number" value={receipt.fiscalUnitPrice} onChange={e=>setReceipt({...receipt,fiscalUnitPrice:e.target.value})}/></Field><Field>Valor comercial unitario<Control required min="0" step="0.01" type="number" value={receipt.commercialReferencePrice} onChange={e=>setReceipt({...receipt,commercialReferencePrice:e.target.value})}/></Field><Field>Credito adicional<Control min="0" step="0.01" type="number" value={receipt.additionalCredits} onChange={e=>setReceipt({...receipt,additionalCredits:e.target.value})}/></Field></Grid><Hint style={{margin:'14px 0'}}>Valor fiscal: {money(Number(receipt.quantity||0)*Number(receipt.fiscalUnitPrice||0))}. Beneficio comercial: {money(Number(receipt.quantity||0)*Number(receipt.commercialReferencePrice||0)+Number(receipt.additionalCredits||0))}.</Hint><Button>Confirmar recebimento</Button></form></Panel>}
  </Page>;
}
