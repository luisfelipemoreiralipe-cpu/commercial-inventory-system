import React, { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { useApp } from "../context/AppContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
    MdAdd, MdClose, MdCheckCircle, MdCancel, MdPendingActions,
    MdFactory, MdPictureAsPdf, MdSearch, MdRefresh, MdWarning, MdInfo
} from "react-icons/md";

// ─── Animations ─────────────────────────────────────────────────────────────
const fadeIn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const pulse = keyframes`0%,100% { opacity: 1; } 50% { opacity: 0.5; }`;

// ─── Layout ──────────────────────────────────────────────────────────────────
const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.3s ease;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: 12px;
`;

const TitleBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TitleIcon = styled.div`
  width: 44px; height: 44px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 1.4rem;
  box-shadow: 0 4px 14px rgba(99,102,241,0.35);
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;

// ─── KPI Cards ────────────────────────────────────────────────────────────────
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const KpiCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  border-left: 4px solid ${({ $color }) => $color || '#6366f1'};
  display: flex; flex-direction: column; gap: 4px;
`;

const KpiLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
`;

const KpiValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ $color, theme }) => $color || theme.colors.textPrimary};
`;

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const Tabs = styled.div`
  display: flex; gap: 8px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 0;
`;

const Tab = styled.button`
  padding: 10px 20px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  border: none; background: transparent;
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textMuted};
  border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

// ─── Table ────────────────────────────────────────────────────────────────────
const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap; gap: 10px;
`;

const SearchBox = styled.div`
  display: flex; align-items: center; gap: 8px;
  background: ${({ theme }) => theme.colors.bgInput || theme.colors.bgHover};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  input {
    border: none; background: transparent;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 14px; outline: none; width: 180px;
    &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  }
`;

const TableOverflow = styled.div`overflow-x: auto;`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left; padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.06em;
  background: ${({ theme }) => theme.colors.bgHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: 0.15s;
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:last-child td { border-bottom: none; }
`;

// ─── Status Badges ────────────────────────────────────────────────────────────
const statusConfig = {
    PENDING:   { label: 'Pendente',  color: '#f59e0b', bg: '#fef3c7', icon: <MdPendingActions /> },
    COMPLETED: { label: 'Concluída', color: '#10b981', bg: '#d1fae5', icon: <MdCheckCircle /> },
    CANCELLED: { label: 'Cancelada', color: '#ef4444', bg: '#fee2e2', icon: <MdCancel /> },
};

const StatusBadge = styled.span`
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px; font-weight: 700;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
`;

// ─── Action Buttons ───────────────────────────────────────────────────────────
const ActionRow = styled.div`display: flex; gap: 6px; align-items: center;`;

const IconBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px; font-weight: 700;
  border: 1px solid;
  cursor: pointer; transition: all 0.2s;
  border-color: ${({ $variant }) => $variant === 'success' ? '#10b981' : $variant === 'danger' ? '#ef4444' : $variant === 'pdf' ? '#6366f1' : '#e2e8f0'};
  background: ${({ $variant }) => $variant === 'success' ? '#10b981' : $variant === 'danger' ? '#ef4444' : $variant === 'pdf' ? '#6366f1' : 'transparent'};
  color: ${({ $variant }) => ['success','danger','pdf'].includes($variant) ? '#fff' : '#64748b'};
  &:hover { opacity: 0.85; transform: scale(1.03); }
  &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
`;

const PrimaryBtn = styled.button`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; font-size: 14px; font-weight: 700;
  cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  transition: all 0.2s;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = styled.div`
  padding: 60px 20px; text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyIcon = styled.div`font-size: 3rem; margin-bottom: 12px; opacity: 0.35;`;

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = styled.div`
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  animation: ${fadeIn} 0.2s ease;
`;

const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl || '16px'};
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 100%; max-width: 640px; max-height: 90vh;
  display: flex; flex-direction: column;
  overflow: hidden;
`;

const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h2`
  font-size: 18px; font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const CloseBtn = styled.button`
  background: none; border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 22px; cursor: pointer;
  display: flex; align-items: center;
  border-radius: 6px; padding: 4px;
  transition: 0.2s;
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; color: ${({ theme }) => theme.colors.textPrimary}; }
`;

const ModalBody = styled.div`
  padding: 24px; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 20px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex; justify-content: flex-end; gap: 10px;
`;

// ─── Form Fields ──────────────────────────────────────────────────────────────
const Field = styled.div`display: flex; flex-direction: column; gap: 6px;`;

const Label = styled.label`
  font-size: 13px; font-weight: 700;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StyledSelect = styled.select`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput || theme.colors.bg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
`;

const StyledInput = styled.input`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput || theme.colors.bg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
`;

const StyledTextarea = styled.textarea`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput || theme.colors.bg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px; resize: vertical; min-height: 72px;
  &:focus { outline: none; border-color: #6366f1; }
`;

// ─── Preview Panel ────────────────────────────────────────────────────────────
const PreviewBox = styled.div`
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ $hasIssue }) => $hasIssue ? '#f97316' : '#6366f1'};
  background: ${({ $hasIssue }) => $hasIssue ? 'rgba(249,115,22,0.06)' : 'rgba(99,102,241,0.06)'};
  padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
`;

const PreviewTitle = styled.div`
  font-size: 13px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: ${({ $hasIssue }) => $hasIssue ? '#f97316' : '#6366f1'};
  display: flex; align-items: center; gap: 6px;
`;

const IngredientRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 100px 80px;
  gap: 8px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ $insufficient }) => $insufficient ? '#ef444430' : 'transparent'};
`;

const IngName = styled.span`
  font-size: 13px; font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const IngValue = styled.span`
  font-size: 13px; font-weight: 700;
  color: ${({ $ok }) => $ok === false ? '#ef4444' : $ok === true ? '#10b981' : '#6366f1'};
  text-align: right;
`;

const IngLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: right;
`;

const TotalCostBox = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px;
  background: rgba(99,102,241,0.1); border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 700; font-size: 15px;
`;

const InsufficientAlert = styled.div`
  display: flex; gap: 8px; align-items: flex-start;
  background: #fef3c7; border: 1px solid #f59e0b;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 14px; font-size: 13px; color: #92400e; font-weight: 600;
  animation: ${pulse} 2s ease-in-out infinite;
`;

// ─── Cancel Confirm Modal ─────────────────────────────────────────────────────
const ConfirmBox = styled.div`
  padding: 24px; text-align: center;
  display: flex; flex-direction: column; gap: 16px;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

const formatDate = (d) =>
    d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const formatQty = (v, unit) => `${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unit || ''}`;

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
function generateProductionPDF({ preview, order, establishment, notes }) {
    const now = new Date().toLocaleString('pt-BR');
    const title = order
        ? `Ficha de Produção #${order.id.slice(0, 8).toUpperCase()}`
        : 'Prévia de Produção';

    const ingredientsRows = preview.ingredients.map(ing => `
        <tr>
            <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0;">${ing.name}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:right;">
                <strong>${Number(ing.quantityPerUnit).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</strong> ${ing.unit}
            </td>
            <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:right; color:${ing.sufficient ? '#10b981' : '#ef4444'}">
                <strong>${Number(ing.quantityNeeded).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</strong> ${ing.unit}
            </td>
            <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:right; color:${ing.sufficient ? '#10b981' : '#ef4444'}">
                <strong>${Number(ing.quantityAvailable).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</strong> ${ing.unit}
            </td>
            <td style="padding:10px 12px; border-bottom:1px solid #f0f0f0; text-align:center;">
                <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:${ing.sufficient ? '#d1fae5' : '#fee2e2'};color:${ing.sufficient ? '#065f46' : '#991b1b'}">
                    ${ing.sufficient ? '✓ OK' : '⚠ Insuficiente'}
                </span>
            </td>
        </tr>
    `).join('');

    const alertBanner = !preview.canProduce ? `
        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;gap:10px;align-items:center">
            <span style="font-size:20px">⚠️</span>
            <span style="font-weight:700;color:#92400e">Atenção: Estoque insuficiente para um ou mais ingredientes!</span>
        </div>
    ` : '';

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 32px; font-size: 14px; }
  @media print { body { padding: 16px; } }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
  .brand { font-size: 26px; font-weight: 900; color: #6366f1; }
  .brand span { color: #8b5cf6; }
  .doc-title { font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
  .doc-meta { font-size: 12px; color: #64748b; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .info-card { background: #f8fafc; border-radius: 10px; padding: 14px 16px; border-left: 4px solid #6366f1; }
  .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
  .info-value { font-size: 16px; font-weight: 800; color: #1e293b; }
  .section-title { font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: #6366f1; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  thead { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
  thead th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
  thead th:not(:first-child) { text-align: right; }
  tbody tr:hover { background: #f8fafc; }
  .cost-row { background: linear-gradient(135deg, #6366f110, #8b5cf610); border-radius: 10px; padding: 16px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
  .cost-label { font-size: 14px; font-weight: 700; color: #6366f1; }
  .cost-value { font-size: 22px; font-weight: 900; color: #6366f1; }
  .notes-box { background: #f8fafc; border-radius: 10px; padding: 16px; border: 1px dashed #e2e8f0; margin-top: 20px; }
  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
  .status-badge { display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand">BDS<span>·</span>Controle</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px">${establishment || 'Produção'}</div>
  </div>
  <div style="text-align:right">
    <div class="doc-title">${title}</div>
    <div class="doc-meta">Gerado em: ${now}</div>
    ${order ? `<div class="doc-meta">Status: <span class="status-badge" style="background:${order.status === 'COMPLETED' ? '#d1fae5' : order.status === 'CANCELLED' ? '#fee2e2' : '#fef3c7'};color:${order.status === 'COMPLETED' ? '#065f46' : order.status === 'CANCELLED' ? '#991b1b' : '#92400e'}">${statusConfig[order.status]?.label || order.status}</span></div>` : ''}
  </div>
</div>

<div class="info-grid">
  <div class="info-card">
    <div class="info-label">Produto a Produzir</div>
    <div class="info-value">${preview.productName}</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:2px">Unidade: ${preview.productUnit}</div>
  </div>
  <div class="info-card" style="border-left-color:#10b981">
    <div class="info-label">Quantidade Produzida</div>
    <div class="info-value" style="color:#10b981">${Number(preview.quantity).toLocaleString('pt-BR', {maximumFractionDigits: 3})} ${preview.productUnit}</div>
  </div>
  <div class="info-card" style="border-left-color:#f59e0b">
    <div class="info-label">Custo Total Estimado</div>
    <div class="info-value" style="color:#f59e0b">${formatCurrency(preview.estimatedTotalCost)}</div>
  </div>
</div>

${alertBanner}

<div class="section-title">📋 Insumos Necessários</div>

<table>
  <thead>
    <tr>
      <th>Ingrediente</th>
      <th style="text-align:right">Qtd p/ unidade</th>
      <th style="text-align:right">Total necessário</th>
      <th style="text-align:right">Estoque disponível</th>
      <th style="text-align:center">Status</th>
    </tr>
  </thead>
  <tbody>
    ${ingredientsRows}
  </tbody>
</table>

<div class="cost-row">
  <div class="cost-label">💰 Custo Total Estimado da Produção</div>
  <div class="cost-value">${formatCurrency(preview.estimatedTotalCost)}</div>
</div>

${notes ? `
<div class="notes-box">
  <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#6366f1;margin-bottom:6px">📝 Observações</div>
  <div style="color:#374151">${notes}</div>
</div>
` : ''}

<div class="footer">
  <span>Sistema BDS · Controle de Produção</span>
  <span>Documento gerado em ${now}</span>
</div>

</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Production() {
    const { state } = useApp();
    const { products = [], establishment } = state;

    const productionProducts = products.filter(p => p.type === 'PRODUCTION' && p.isActive !== false);

    const [tab, setTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [search, setSearch] = useState('');

    // Modal nova produção
    const [showModal, setShowModal] = useState(false);
    const [modalProductId, setModalProductId] = useState('');
    const [modalQty, setModalQty] = useState('');
    const [modalNotes, setModalNotes] = useState('');
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Confirm modals
    const [completeTarget, setCompleteTarget] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Preview debounce ref
    const previewTimer = useRef(null);

    // ─── Data ──────────────────────────────────────────────────────────────────
    const loadOrders = useCallback(async () => {
        setLoadingOrders(true);
        try {
            const res = await api.get('/productions');
            setOrders(Array.isArray(res?.orders) ? res.orders : []);
        } catch {
            toast.error('Erro ao carregar ordens de produção');
        } finally {
            setLoadingOrders(false);
        }
    }, []);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    // ─── Preview on qty/product change ────────────────────────────────────────
    useEffect(() => {
        if (!modalProductId || !modalQty || Number(modalQty) <= 0) {
            setPreview(null);
            return;
        }
        clearTimeout(previewTimer.current);
        previewTimer.current = setTimeout(async () => {
            setLoadingPreview(true);
            try {
                const res = await api.get(`/productions/preview?productId=${modalProductId}&quantity=${modalQty}`);
                setPreview(res);
            } catch (e) {
                setPreview(null);
                toast.error(e.message || 'Erro ao calcular ingredientes');
            } finally {
                setLoadingPreview(false);
            }
        }, 600);
        return () => clearTimeout(previewTimer.current);
    }, [modalProductId, modalQty]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const openModal = () => {
        setModalProductId('');
        setModalQty('');
        setModalNotes('');
        setPreview(null);
        setShowModal(true);
    };

    const handleCreate = async () => {
        if (!modalProductId || !modalQty) return toast.error('Preencha produto e quantidade');
        setSubmitting(true);
        try {
            await api.post('/productions', {
                productId: modalProductId,
                quantity: Number(modalQty),
                notes: modalNotes
            });
            toast.success('Ordem de produção criada!');
            setShowModal(false);
            loadOrders();
        } catch (e) {
            toast.error(e.message || 'Erro ao criar ordem');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async () => {
        if (!completeTarget) return;
        setProcessing(true);
        try {
            await api.patch(`/productions/${completeTarget.id}/complete`);
            toast.success('Produção concluída! Estoque atualizado.');
            setCompleteTarget(null);
            loadOrders();
        } catch (e) {
            toast.error(e.message || 'Erro ao concluir produção');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setProcessing(true);
        try {
            await api.patch(`/productions/${cancelTarget.id}/cancel`);
            toast.success('Ordem cancelada');
            setCancelTarget(null);
            loadOrders();
        } catch (e) {
            toast.error(e.message || 'Erro ao cancelar ordem');
        } finally {
            setProcessing(false);
        }
    };

    // ─── KPIs ─────────────────────────────────────────────────────────────────
    const kpiPending = orders.filter(o => o.status === 'PENDING').length;
    const kpiCompleted = orders.filter(o => o.status === 'COMPLETED').length;
    const kpiTotal = orders.length;

    // ─── Filtered ─────────────────────────────────────────────────────────────
    const tabOrders = tab === 'orders'
        ? orders
        : orders.filter(o => o.status === tab);

    const filtered = tabOrders.filter(o =>
        o.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.includes(search)
    );

    return (
        <Container>
            {/* ── Header ───────────────────────────────────────────────────── */}
            <PageHeader>
                <TitleBlock>
                    <TitleIcon><MdFactory /></TitleIcon>
                    <div>
                        <PageTitle>Produção</PageTitle>
                        <PageSubtitle>Gerencie ordens de produção e fichas técnicas</PageSubtitle>
                    </div>
                </TitleBlock>
                <PrimaryBtn onClick={openModal} id="btn-nova-producao">
                    <MdAdd /> Nova Produção
                </PrimaryBtn>
            </PageHeader>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <KpiGrid>
                <KpiCard $color="#6366f1">
                    <KpiLabel>Total de Ordens</KpiLabel>
                    <KpiValue>{kpiTotal}</KpiValue>
                </KpiCard>
                <KpiCard $color="#f59e0b">
                    <KpiLabel>Pendentes</KpiLabel>
                    <KpiValue $color="#f59e0b">{kpiPending}</KpiValue>
                </KpiCard>
                <KpiCard $color="#10b981">
                    <KpiLabel>Concluídas</KpiLabel>
                    <KpiValue $color="#10b981">{kpiCompleted}</KpiValue>
                </KpiCard>
                <KpiCard $color="#64748b">
                    <KpiLabel>Produtos de Produção</KpiLabel>
                    <KpiValue>{productionProducts.length}</KpiValue>
                </KpiCard>
            </KpiGrid>

            {/* ── Tabs ─────────────────────────────────────────────────────── */}
            <Tabs>
                {[
                    { key: 'orders', label: 'Todas' },
                    { key: 'PENDING', label: `Pendentes (${kpiPending})` },
                    { key: 'COMPLETED', label: 'Concluídas' },
                    { key: 'CANCELLED', label: 'Canceladas' },
                ].map(t => (
                    <Tab key={t.key} $active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</Tab>
                ))}
            </Tabs>

            {/* ── Table ────────────────────────────────────────────────────── */}
            <Card>
                <TableHeader>
                    <SearchBox>
                        <MdSearch />
                        <input
                            placeholder="Buscar por produto..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            id="input-search-producao"
                        />
                    </SearchBox>
                    <IconBtn $variant="default" onClick={loadOrders} title="Recarregar" id="btn-refresh-producao">
                        <MdRefresh />
                    </IconBtn>
                </TableHeader>

                <TableOverflow>
                    <Table>
                        <thead>
                            <tr>
                                <Th>ID</Th>
                                <Th>Produto</Th>
                                <Th>Quantidade</Th>
                                <Th>Status</Th>
                                <Th>Criado por</Th>
                                <Th>Data</Th>
                                <Th>Ações</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingOrders ? (
                                <tr>
                                    <Td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                                        Carregando...
                                    </Td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <Td colSpan={7}>
                                        <EmptyState>
                                            <EmptyIcon><MdFactory /></EmptyIcon>
                                            <p style={{ fontWeight: 700, marginBottom: 4 }}>Nenhuma ordem encontrada</p>
                                            <p>Clique em "Nova Produção" para começar</p>
                                        </EmptyState>
                                    </Td>
                                </tr>
                            ) : filtered.map(order => {
                                const s = statusConfig[order.status] || {};
                                return (
                                    <Tr key={order.id}>
                                        <Td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                                            #{order.id.slice(0, 8).toUpperCase()}
                                        </Td>
                                        <Td>
                                            <span style={{ fontWeight: 700 }}>{order.product?.name}</span>
                                        </Td>
                                        <Td style={{ fontWeight: 700 }}>
                                            {formatQty(order.quantity, order.product?.unit)}
                                        </Td>
                                        <Td>
                                            <StatusBadge $color={s.color} $bg={s.bg}>
                                                {s.icon} {s.label}
                                            </StatusBadge>
                                        </Td>
                                        <Td>{order.user?.name || '-'}</Td>
                                        <Td style={{ color: '#94a3b8', fontSize: 12 }}>
                                            {formatDate(order.createdAt)}
                                        </Td>
                                        <Td>
                                            <ActionRow>
                                                {/* PDF sempre disponível */}
                                                <IconBtn
                                                    $variant="pdf"
                                                    title="Exportar PDF"
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(
                                                                `/productions/preview?productId=${order.productId}&quantity=${order.quantity}`
                                                            );
                                                            generateProductionPDF({
                                                                preview: res,
                                                                order,
                                                                establishment: establishment?.name,
                                                                notes: order.notes
                                                            });
                                                        } catch (e) {
                                                            toast.error('Erro ao gerar PDF');
                                                        }
                                                    }}
                                                >
                                                    <MdPictureAsPdf /> PDF
                                                </IconBtn>

                                                {order.status === 'PENDING' && (
                                                    <>
                                                        <IconBtn
                                                            $variant="success"
                                                            onClick={() => setCompleteTarget(order)}
                                                        >
                                                            <MdCheckCircle /> Concluir
                                                        </IconBtn>
                                                        <IconBtn
                                                            $variant="danger"
                                                            onClick={() => setCancelTarget(order)}
                                                        >
                                                            <MdCancel />
                                                        </IconBtn>
                                                    </>
                                                )}
                                            </ActionRow>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </TableOverflow>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════
                MODAL — NOVA PRODUÇÃO
            ════════════════════════════════════════════════════════════════ */}
            {showModal && (
                <Overlay onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <ModalBox>
                        <ModalHead>
                            <ModalTitle>🏭 Nova Ordem de Produção</ModalTitle>
                            <CloseBtn onClick={() => setShowModal(false)}><MdClose /></CloseBtn>
                        </ModalHead>

                        <ModalBody>
                            {/* Produto */}
                            <Field>
                                <Label>Produto a Produzir *</Label>
                                <StyledSelect
                                    id="select-produto-producao"
                                    value={modalProductId}
                                    onChange={e => { setModalProductId(e.target.value); setPreview(null); }}
                                >
                                    <option value="">-- Selecione um produto de produção --</option>
                                    {productionProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                    ))}
                                </StyledSelect>
                                {productionProducts.length === 0 && (
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#f59e0b', background: '#fef3c720', padding: '8px 12px', borderRadius: 8 }}>
                                        <MdInfo /> Nenhum produto do tipo "Produção" encontrado. Cadastre produtos com tipo "Produção" na tela de Produtos.
                                    </div>
                                )}
                            </Field>

                            {/* Quantidade */}
                            <Field>
                                <Label>
                                    Quantidade a Produzir *
                                    {modalProductId && ` (${productionProducts.find(p => p.id === modalProductId)?.unit || ''})`}
                                </Label>
                                <StyledInput
                                    id="input-quantidade-producao"
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    placeholder="Ex: 10"
                                    value={modalQty}
                                    onChange={e => setModalQty(e.target.value)}
                                />
                            </Field>

                            {/* Preview de ingredientes */}
                            {loadingPreview && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '8px 0' }}>
                                    ⏳ Calculando ingredientes...
                                </div>
                            )}

                            {preview && !loadingPreview && (
                                <PreviewBox $hasIssue={!preview.canProduce}>
                                    <PreviewTitle $hasIssue={!preview.canProduce}>
                                        {preview.canProduce ? <MdCheckCircle /> : <MdWarning />}
                                        Insumos Necessários para {Number(preview.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {preview.productUnit}
                                    </PreviewTitle>

                                    {!preview.canProduce && (
                                        <InsufficientAlert>
                                            <MdWarning style={{ flexShrink: 0, fontSize: 18 }} />
                                            <span>Estoque insuficiente para um ou mais ingredientes. Você pode criar a ordem, mas não conseguirá concluir a produção.</span>
                                        </InsufficientAlert>
                                    )}

                                    {/* Header da tabela de ingredientes */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px', gap: 8, padding: '4px 12px' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Ingrediente</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', textAlign: 'right' }}>Por unid.</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', textAlign: 'right' }}>Necessário</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', textAlign: 'right' }}>Disponível</span>
                                    </div>

                                    {preview.ingredients.map(ing => (
                                        <IngredientRow key={ing.productId} $insufficient={!ing.sufficient}>
                                            <IngName>{ing.name}</IngName>
                                            <IngLabel style={{ textAlign: 'right' }}>
                                                {Number(ing.quantityPerUnit).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unit}
                                            </IngLabel>
                                            <IngValue $ok={ing.sufficient}>
                                                {Number(ing.quantityNeeded).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unit}
                                            </IngValue>
                                            <IngValue $ok={ing.sufficient}>
                                                {Number(ing.quantityAvailable).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {ing.unit}
                                                {!ing.sufficient && <span style={{ fontSize: 10 }}> ⚠</span>}
                                            </IngValue>
                                        </IngredientRow>
                                    ))}

                                    <TotalCostBox>
                                        <span style={{ color: '#6366f1' }}>💰 Custo Estimado</span>
                                        <span style={{ color: '#6366f1', fontSize: 18 }}>{formatCurrency(preview.estimatedTotalCost)}</span>
                                    </TotalCostBox>

                                    {/* Botão PDF da prévia */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <IconBtn
                                            $variant="pdf"
                                            onClick={() => generateProductionPDF({
                                                preview,
                                                order: null,
                                                establishment: establishment?.name,
                                                notes: modalNotes
                                            })}
                                            id="btn-pdf-preview"
                                        >
                                            <MdPictureAsPdf /> Exportar Prévia em PDF
                                        </IconBtn>
                                    </div>
                                </PreviewBox>
                            )}

                            {/* Observações */}
                            <Field>
                                <Label>Observações (opcional)</Label>
                                <StyledTextarea
                                    id="textarea-notas-producao"
                                    placeholder="Ex: Lote especial para evento de sábado"
                                    value={modalNotes}
                                    onChange={e => setModalNotes(e.target.value)}
                                />
                            </Field>
                        </ModalBody>

                        <ModalFooter>
                            <IconBtn $variant="default" onClick={() => setShowModal(false)}>
                                Cancelar
                            </IconBtn>
                            <PrimaryBtn
                                id="btn-confirmar-producao"
                                onClick={handleCreate}
                                disabled={submitting || !modalProductId || !modalQty}
                            >
                                {submitting ? <><Spinner /> Criando...</> : <><MdAdd /> Criar Ordem</>}
                            </PrimaryBtn>
                        </ModalFooter>
                    </ModalBox>
                </Overlay>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                MODAL — CONFIRMAR CONCLUSÃO
            ════════════════════════════════════════════════════════════════ */}
            {completeTarget && (
                <Overlay onClick={e => e.target === e.currentTarget && !processing && setCompleteTarget(null)}>
                    <ModalBox style={{ maxWidth: 440 }}>
                        <ModalHead>
                            <ModalTitle>✅ Confirmar Produção</ModalTitle>
                            <CloseBtn onClick={() => !processing && setCompleteTarget(null)}><MdClose /></CloseBtn>
                        </ModalHead>
                        <ConfirmBox>
                            <div style={{ fontSize: 48 }}>🏭</div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                                    Confirmar conclusão da produção?
                                </p>
                                <p style={{ color: '#64748b', fontSize: 14 }}>
                                    Serão dadas baixas nos insumos e entrada de{' '}
                                    <strong>{formatQty(completeTarget.quantity, completeTarget.product?.unit)}</strong> de{' '}
                                    <strong>{completeTarget.product?.name}</strong> no estoque.
                                </p>
                                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 10, fontWeight: 600 }}>
                                    ⚠ Esta ação não pode ser desfeita.
                                </p>
                            </div>
                        </ConfirmBox>
                        <ModalFooter>
                            <IconBtn $variant="default" onClick={() => !processing && setCompleteTarget(null)} disabled={processing}>
                                Cancelar
                            </IconBtn>
                            <IconBtn $variant="success" onClick={handleComplete} disabled={processing} id="btn-confirmar-conclusao">
                                {processing ? <><Spinner /> Processando...</> : <><MdCheckCircle /> Confirmar Produção</>}
                            </IconBtn>
                        </ModalFooter>
                    </ModalBox>
                </Overlay>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                MODAL — CONFIRMAR CANCELAMENTO
            ════════════════════════════════════════════════════════════════ */}
            {cancelTarget && (
                <Overlay onClick={e => e.target === e.currentTarget && !processing && setCancelTarget(null)}>
                    <ModalBox style={{ maxWidth: 420 }}>
                        <ModalHead>
                            <ModalTitle>❌ Cancelar Ordem</ModalTitle>
                            <CloseBtn onClick={() => !processing && setCancelTarget(null)}><MdClose /></CloseBtn>
                        </ModalHead>
                        <ConfirmBox>
                            <div style={{ fontSize: 48 }}>🗑</div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                                    Cancelar esta ordem de produção?
                                </p>
                                <p style={{ color: '#64748b', fontSize: 14 }}>
                                    A ordem <strong>#{cancelTarget.id.slice(0, 8).toUpperCase()}</strong> será cancelada.
                                    Nenhum estoque será alterado.
                                </p>
                            </div>
                        </ConfirmBox>
                        <ModalFooter>
                            <IconBtn $variant="default" onClick={() => !processing && setCancelTarget(null)} disabled={processing}>
                                Voltar
                            </IconBtn>
                            <IconBtn $variant="danger" onClick={handleCancel} disabled={processing} id="btn-confirmar-cancelamento">
                                {processing ? <><Spinner /> Cancelando...</> : <><MdCancel /> Cancelar Ordem</>}
                            </IconBtn>
                        </ModalFooter>
                    </ModalBox>
                </Overlay>
            )}
        </Container>
    );
}
