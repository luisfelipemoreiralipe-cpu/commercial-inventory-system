import React from 'react';
import styled from 'styled-components';
import { MdInbox } from 'react-icons/md';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing['2xl']};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

const IconBox = styled.div`
  font-size: 3.5rem;
  opacity: 0.4;
  line-height: 1;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  max-width: 300px;
`;

const EmptyState = ({
    title = 'Nenhum item encontrado',
    subtitle = 'Comece adicionando um novo item.',
    icon,
}) => (
    <Wrapper>
        <IconBox>{icon || <MdInbox />}</IconBox>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Wrapper>
);

export default EmptyState;
