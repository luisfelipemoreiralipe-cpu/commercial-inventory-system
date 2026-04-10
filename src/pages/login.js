import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useApp } from "../context/AppContext";
import logo from "../assets/logobds.png"

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
  width: 420px;
`;
const Logo = styled.img`
  width: 120px;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
  display: block;
`;
const Title = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes["2xl"]};
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Input = styled.input`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.borderFocus};
  }
`;

const Button = styled.button`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const RegisterLink = styled.span`
  color: ${({ theme }) => theme.colors.info};
  cursor: pointer;
`;

const Footer = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export default function Login() {

  const navigate = useNavigate();
  const { switchEstablishment } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {

    e.preventDefault();

    try {

      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password
      });

      const { token, establishments } = response;

      localStorage.setItem("token", token);

      if (establishments.length === 1) {
        await switchEstablishment(establishments[0].id);
        navigate("/");
      } else {

        localStorage.setItem(
          "establishments",
          JSON.stringify(establishments)
        );

        navigate("/select-establishment");

      }

    } catch (err) {

      alert(err.message);

    } finally {

      setLoading(false);

    }

  }


  return (

    <Wrapper>

      <Card>

        <Logo src={logo} alt="BDS Logo" />

        <Title>Entrar</Title>

        <Form onSubmit={handleLogin}>

          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            placeholder="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>

        </Form>

        <Footer>
          Não tem conta?{" "}
          <RegisterLink onClick={() => navigate("/register")}>
            Criar conta
          </RegisterLink>
        </Footer>

      </Card>

    </Wrapper>

  );

}