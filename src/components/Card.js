import styled from 'styled-components';

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: ${({ padding, theme }) => padding || theme.spacing.lg};
  ${({ fullHeight }) => fullHeight && 'height: 100%;'}
`;

export default Card;
