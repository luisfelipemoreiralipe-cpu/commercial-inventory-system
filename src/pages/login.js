import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../services/api';

// ─── Styled ─────────────────────────────────────────────

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bg};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: 40px;
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

// ─── Component ──────────────────────────────────────────

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        setError('');

        try {

            const response = await api.post('/auth/login', {
                email,
                password
            });

            // salva token
            localStorage.setItem('token', response.token);

            // redireciona
            window.location.href = '/dashboard';

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Wrapper>

            <Card>

                <Title>Login</Title>

                <form onSubmit={handleLogin}>

                    {error && <ErrorMsg>{error}</ErrorMsg>}

                    <Input
                        type="email"
                        placeholder="Seu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Input
                        type="password"
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button type="submit">
                        Entrar
                    </Button>

                </form>

            </Card>

        </Wrapper>
    );
};

export default Login;