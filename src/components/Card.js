import styled from "styled-components";

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: ${({ padding, theme }) => padding || theme.spacing.lg};

  transition: ${({ theme }) => theme.transition};

  ${({ fullHeight }) => fullHeight && "height: 100%;"}

  &:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }
`;

export default Card;