import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Box = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: 24px 32px;
  border-radius: ${({ theme }) => theme.radii.lg};
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const Text = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const LoadingOverlay = ({ text = 'Carregando...' }) => {
    return (
        <Overlay>
            <Box>
                <Spinner />
                <Text>{text}</Text>
            </Box>
        </Overlay>
    );
};

export default LoadingOverlay;