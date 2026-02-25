import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  white-space: nowrap;

  background: ${({ variant, theme }) => {
        switch (variant) {
            case 'success': return theme.colors.successLight;
            case 'warning': return theme.colors.warningLight;
            case 'danger': return theme.colors.dangerLight;
            case 'info': return theme.colors.infoLight;
            default: return theme.colors.primaryLight;
        }
    }};

  color: ${({ variant, theme }) => {
        switch (variant) {
            case 'success': return theme.colors.success;
            case 'warning': return theme.colors.warning;
            case 'danger': return theme.colors.danger;
            case 'info': return theme.colors.info;
            default: return theme.colors.primary;
        }
    }};
`;

const Badge = ({ children, variant = 'primary' }) => (
    <Wrapper variant={variant}>{children}</Wrapper>
);

export default Badge;
