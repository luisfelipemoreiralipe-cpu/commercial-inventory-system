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
    CARREGAR SETORES
    ========================================
    */
    async function loadSectors() {

        try {

            const sectors = await api.get("/stock-sectors");

            console.log("🏢 SECTORS API:", sectors);

            setSectors(Array.isArray(sectors) ? sectors : []);

        } catch (error) {

            console.error("❌ Erro ao carregar setores:", error);
            setSectors([]);

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
        loadSectors();

    }, []);

    /*
    ========================================
    CRIAR AUDITORIA
    ========================================
    */
    async function createAudit() {

        if (!sectorId) {
            console.warn("⚠️ Nenhum setor selecionado");
            return;
        }

        try {

            console.log("📤 Criando auditoria para setor:", sectorId);

            const res = await api.post("/stock-audits", {
                sectorId
            });

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
                            <Th>Setor</Th>
                            <Th>Status</Th>
                            <Th>Ações</Th>
                        </tr>
                    </thead>

                    <tbody>

                        {(audits || []).length === 0 && (
                            <tr>
                                <Td colSpan="4">Nenhuma auditoria encontrada</Td>
                            </tr>
                        )}

                        {(audits || []).map((audit) => (

                            <tr key={audit.id}>

                                <Td>
                                    {audit.createdAt
                                        ? new Date(audit.createdAt).toLocaleDateString("pt-BR")
                                        : "-"}
                                </Td>

                                <Td>{audit?.sector?.name || "-"}</Td>

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

                <Select
                    label="Selecionar setor"
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                >

                    <option value="">Selecione</option>

                    {(sectors || []).map((s) => (

                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>

                    ))}

                </Select>

            </Modal>
        </>
    );

}