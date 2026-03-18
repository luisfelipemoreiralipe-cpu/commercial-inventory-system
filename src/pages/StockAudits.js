import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { Select } from "../components/FormFields";

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes["3xl"]};
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

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: ${({ theme, status }) =>
        status === "OPEN"
            ? theme.colors.warningLight
            : theme.colors.successLight};

  color: ${({ theme, status }) =>
        status === "OPEN" ? theme.colors.warning : theme.colors.success};
`;

export default function StockAudits() {

    const navigate = useNavigate();

    const [audits, setAudits] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [sectorId, setSectorId] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    /*
    ========================================
    CARREGAR AUDITORIAS
    ========================================
    */
    async function loadAudits() {

        try {

            const audits = await api.get("/stock-audits");

            console.log("📦 AUDITS API:", audits);

            setAudits(Array.isArray(audits) ? audits : []);

        } catch (error) {

            console.error("❌ Erro ao carregar auditorias:", error);
            setAudits([]);

        }

    }

    /*
    ========================================
    LOAD INICIAL
    ========================================
    */
    useEffect(() => {

        console.log("🚀 Carregando auditorias e setores");

        loadAudits();

    }, []);

    /*
    ========================================
    CRIAR AUDITORIA
    ========================================
    */
    async function createAudit() {
        try {

            console.log("📤 Criando auditoria");

            const res = await api.post("/stock-audits");

            console.log("📤 RESPONSE CREATE AUDIT:", res);

            const auditId =
                res?.data?.id ||
                res?.data?.data?.id ||
                res?.id;

            console.log("📌 AUDIT ID:", auditId);

            setModalOpen(false);

            if (auditId) {
                navigate(`/stock-audits/${auditId}`);
            } else {
                console.warn("⚠️ ID da auditoria não encontrado");
            }

        } catch (error) {

            console.error("❌ Erro ao criar auditoria:", error);

        }

    }

    return (
        <>
            <PageHeader>
                <Title>Auditorias de Estoque</Title>

                <Button onClick={() => setModalOpen(true)}>
                    <MdAdd />
                    Nova Auditoria
                </Button>
            </PageHeader>

            <Card padding="0">
                <Table>

                    <thead>
                        <tr>
                            <Th>Data</Th>
                            <Th>Status</Th>
                            <Th>Ações</Th>
                        </tr>
                    </thead>

                    <tbody>

                        {(audits || []).length === 0 && (
                            <tr>
                                <Td colSpan="3">Nenhuma auditoria encontrada</Td>
                            </tr>
                        )}

                        {(audits || []).map((audit) => (

                            <tr key={audit.id}>

                                <Td>
                                    {audit.createdAt
                                        ? new Date(audit.createdAt).toLocaleDateString("pt-BR")
                                        : "-"}
                                </Td>



                                <Td>
                                    <StatusBadge status={audit.status}>
                                        {audit.status}
                                    </StatusBadge>
                                </Td>

                                <Td>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {

                                            console.log("🔍 Abrindo auditoria:", audit);

                                            navigate(`/stock-audits/${audit.id}`);

                                        }}
                                    >
                                        Abrir
                                    </Button>
                                </Td>

                            </tr>

                        ))}

                    </tbody>

                </Table>
            </Card>

            {/* MODAL CRIAR AUDITORIA */}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Criar Auditoria"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <Button onClick={createAudit}>
                            Criar Auditoria
                        </Button>
                    </>
                }
            >
                <p>Deseja iniciar uma auditoria de estoque?</p>
            </Modal>
        </>
    );

}