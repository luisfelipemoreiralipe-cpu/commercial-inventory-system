import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { MdAdd, MdSearch, MdChevronRight } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState"; // Assumindo que você tem esse componente

/* -------------------------------------------------------------------------- */
/* Styled UI                                   */
/* -------------------------------------------------------------------------- */

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
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
  letter-spacing: 0.05em;
  background: ${({ theme }) => theme.colors.bgHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    display: none;
  }
`;

const Tr = styled.tr`
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  }
`;

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    width: 100%;

    &:before {
      content: attr(data-label);
      font-weight: 700;
      font-size: 11px;
      color: ${({ theme }) => theme.colors.textMuted};
      text-transform: uppercase;
    }

    &:last-child {
      border-bottom: none;
      padding-top: 15px;
      justify-content: stretch;
    }
  }
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  background: ${({ theme, status }) =>
        status === "OPEN" ? "#FEF3C7" : "#DCFCE7"};

  color: ${({ theme, status }) =>
        status === "OPEN" ? "#92400E" : "#166534"};
`;

/* -------------------------------------------------------------------------- */
/* Component                                   */
/* -------------------------------------------------------------------------- */

export default function StockAudits() {
    const navigate = useNavigate();
    const [audits, setAudits] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);

    async function loadAudits() {
        try {
            const data = await api.get("/stock-audits");
            setAudits(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("❌ Erro ao carregar auditorias:", error);
            setAudits([]);
        }
    }

    useEffect(() => {
        loadAudits();
    }, []);

    async function createAudit() {
        try {
            const res = await api.post("/stock-audits");
            const auditId = res?.id;
            setModalOpen(false);

            if (auditId) {
                navigate(`/stock-audits/${auditId}`);
            }
        } catch (error) {
            console.error("❌ Erro ao criar auditoria:", error);
        }
    }

    return (
        <>
            <PageHeader>
                <div>
                    <Title>Auditorias de Estoque</Title>
                    <p style={{ color: "#64748B", fontSize: "14px", marginTop: "4px" }}>
                        Acompanhe e realize conferências de estoque periódicas
                    </p>
                </div>

                <Button
                    onClick={() => setModalOpen(true)}
                    style={{ width: window.innerWidth < 768 ? "100%" : "auto" }}
                >
                    <MdAdd size={20} />
                    Nova Auditoria
                </Button>
            </PageHeader>

            <Card padding="0">
                <TableWrapper>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Data de Início</Th>
                                <Th>Status</Th>
                                <Th>Ações</Th>
                            </tr>
                        </thead>

                        <tbody>
                            {audits.length === 0 ? (
                                <tr>
                                    <Td colSpan="3" style={{ textAlign: "center", padding: "40px" }}>
                                        <div style={{ color: "#94A3B8" }}>
                                            <MdSearch size={40} style={{ marginBottom: "8px" }} />
                                            <p>Nenhuma auditoria encontrada</p>
                                        </div>
                                    </Td>
                                </tr>
                            ) : (
                                audits.map((audit) => (
                                    <Tr key={audit.id}>
                                        <Td data-label="Data de Início">
                                            <div style={{ fontWeight: 600 }}>
                                                {audit.createdAt
                                                    ? new Date(audit.createdAt).toLocaleDateString("pt-BR", {
                                                        day: "2-digit",
                                                        month: "long",
                                                        year: "numeric"
                                                    })
                                                    : "-"}
                                            </div>
                                        </Td>

                                        <Td data-label="Status">
                                            <StatusBadge status={audit.status}>
                                                {audit.status === "OPEN" ? "Em Aberto" : "Concluída"}
                                            </StatusBadge>
                                        </Td>

                                        <Td>
                                            <Button
                                                variant="secondary"
                                                onClick={() => navigate(`/stock-audits/${audit.id}`)}
                                                style={{ width: "100%", justifyContent: "center" }}
                                            >
                                                Abrir Auditoria
                                                <MdChevronRight size={18} />
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </TableWrapper>
            </Card>

            {/* MODAL CRIAR AUDITORIA */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Nova Auditoria"
                style={{ maxWidth: "450px" }}
                footer={
                    <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                        <Button
                            variant="secondary"
                            onClick={() => setModalOpen(false)}
                            style={{ flex: 1 }}
                        >
                            Cancelar
                        </Button>

                        <Button onClick={createAudit} style={{ flex: 1 }}>
                            Confirmar
                        </Button>
                    </div>
                }
            >
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                    <div style={{
                        width: "60px",
                        height: "60px",
                        background: "#F1F5F9",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px"
                    }}>
                        <MdAdd size={30} color="#64748B" />
                    </div>
                    <h3 style={{ marginBottom: "8px", color: "#1E293B" }}>Iniciar Nova Conferência?</h3>
                    <p style={{ color: "#64748B", fontSize: "14px", lineHeight: "1.5" }}>
                        Uma nova lista de auditoria será gerada com base no seu estoque atual para conferência manual.
                    </p>
                </div>
            </Modal>
        </>
    );
}