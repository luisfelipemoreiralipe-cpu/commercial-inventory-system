import React from "react";
import styled, { keyframes } from "styled-components";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useLoading } from "../context/LoadingContext";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999; /* Altíssimo z-index */
  cursor: wait;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #fff;
`;

const RotatingIcon = styled(AiOutlineLoading3Quarters)`
  font-size: 3rem;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 1px;
`;

const LoadingOverlay = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <Overlay>
            <SpinnerWrapper>
                <RotatingIcon />
                <LoadingText>Aguarde...</LoadingText>
            </SpinnerWrapper>
        </Overlay>
    );
};

export default LoadingOverlay;