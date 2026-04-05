import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: white;
  pointer-events: auto;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
`;

const Message = styled.p`
  marginTop: 16px;
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  margin-top: 16px;
`;

const LoadingOverlay = () => {
    return (
        <Overlay>
            <Spinner />
            <Message>Processando informações...</Message>
        </Overlay>
    );
};

export default LoadingOverlay;
