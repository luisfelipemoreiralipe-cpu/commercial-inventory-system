import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 480px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
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
`;

const Name = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`;

export default function SelectEstablishment() {

    const navigate = useNavigate();

    const { switchEstablishment } = useApp();

    const [establishments, setEstablishments] = useState([]);
    const [loadingId, setLoadingId] = useState(null);

    useEffect(() => {

        const stored = localStorage.getItem("establishments");

        if (stored) {
            setEstablishments(JSON.parse(stored));
        }

    }, []);

    async function handleSelect(establishmentId) {

        try {

            setLoadingId(establishmentId);

            // usa o AppContext (fluxo correto)
            await switchEstablishment(establishmentId);

            navigate("/");

        } catch (err) {

            console.error(err);

            alert(
                err.message ||
                "Erro ao trocar estabelecimento"
            );

        } finally {

            setLoadingId(null);

        }

    }

    return (

        <Wrapper>

            <Card>

                <Title>Escolha o Estabelecimento</Title>

                <List>

                    {establishments.map((est) => (

                        <Item key={est.id}>

                            <Name>{est.nome_fantasia || est.name}</Name>

                            <Button
                                onClick={() => handleSelect(est.id)}
                                disabled={loadingId === est.id}
                            >
                                {loadingId === est.id ? "Entrando..." : "Entrar"}
                            </Button>

                        </Item>

                    ))}

                </List>

            </Card>

        </Wrapper>

    );

}
