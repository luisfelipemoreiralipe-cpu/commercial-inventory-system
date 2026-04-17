import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { MdAdd, MdStore } from "react-icons/md";
import api from "../services/api";

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bgPage};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 480px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Item = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
`;

const Name = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: ${({ theme }) => theme.transition};
  border: none;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CreateSection = styled.div`
  margin-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 20px;
`;

const GhostButton = styled.button`
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  outline: none;
  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
`;

export default function SelectEstablishment() {
    const navigate = useNavigate();
    const { state, switchEstablishment, reloadContext } = useApp();
    
    const establishments = state.establishments?.length 
        ? state.establishments 
        : (() => {
            try { return JSON.parse(localStorage.getItem("establishments") || "[]"); } 
            catch { return []; }
        })();

    const [loadingId, setLoadingId] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);

    async function handleSelect(establishmentId) {
        try {
            setLoadingId(establishmentId);
            await switchEstablishment(establishmentId);
            navigate("/");
        } catch (err) {
            console.error(err);
            alert(err.message || "Erro ao trocar estabelecimento");
        } finally {
            setLoadingId(null);
        }
    }

    async function handleCreate() {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await api.post("/establishments", { name: newName });
            setNewName("");
            setShowCreate(false);
            await reloadContext(); // Atualiza a lista de acessos
        } catch (err) {
            alert(err.response?.data?.message || "Erro ao criar unidade");
        } finally {
            setCreating(false);
        }
    }

    return (
        <Wrapper>
            <Card>
                <Title>Suas Unidades</Title>
                <List>
                    {establishments.map((est) => (
                        <Item key={est.id}>
                            <Name><MdStore size={20} color="#64748B" /> {est.name}</Name>
                            <Button
                                onClick={() => handleSelect(est.id)}
                                disabled={loadingId === est.id}
                            >
                                {loadingId === est.id ? "Entrando..." : "Entrar"}
                            </Button>
                        </Item>
                    ))}
                </List>

                {/* Área de Criação para Admins */}
                <CreateSection>
                    {!showCreate ? (
                        <GhostButton onClick={() => setShowCreate(true)}>
                            <MdAdd size={20} /> Criar Nova Unidade
                        </GhostButton>
                    ) : (
                        <div>
                            <Input 
                                placeholder="Nome da nova unidade" 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                autoFocus
                            />
                            <InputGroup>
                                <Button onClick={handleCreate} disabled={creating} style={{ flex: 1 }}>
                                    {creating ? "Criando..." : "Confirmar"}
                                </Button>
                                <Button 
                                    onClick={() => setShowCreate(false)} 
                                    variant="secondary" 
                                    style={{ background: '#CBD5E1', color: '#334155' }}
                                >
                                    Cancelar
                                </Button>
                            </InputGroup>
                        </div>
                    )}
                </CreateSection>
            </Card>
        </Wrapper>
    );
}
