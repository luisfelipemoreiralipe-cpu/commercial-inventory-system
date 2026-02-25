import React from 'react';
import styled from 'styled-components';

// ─── Variants map ────────────────────────────────────────────────────────────
const variantStyles = {
    primary: ({ theme }) => `
    background: ${theme.colors.primary};
    color: #fff;
    box-shadow: ${theme.shadows.button};
    &:hover:not(:disabled) { background: ${theme.colors.primaryHover}; }
  `,
    secondary: ({ theme }) => `
    background: ${theme.colors.bgInput};
    color: ${theme.colors.textPrimary};
    border: 1px solid ${theme.colors.border};
    &:hover:not(:disabled) { background: ${theme.colors.bgHover}; }
  `,
    danger: ({ theme }) => `
    background: ${theme.colors.dangerLight};
    color: ${theme.colors.danger};
    &:hover:not(:disabled) { background: ${theme.colors.danger}; color: #fff; }
  `,
    ghost: ({ theme }) => `
    background: transparent;
    color: ${theme.colors.textSecondary};
    &:hover:not(:disabled) { background: ${theme.colors.bgHover}; color: ${theme.colors.textPrimary}; }
  `,
    success: ({ theme }) => `
    background: ${theme.colors.successLight};
    color: ${theme.colors.success};
    &:hover:not(:disabled) { background: ${theme.colors.success}; color: #fff; }
  `,
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: ${({ size }) =>
        size === 'sm' ? '6px 12px' : size === 'lg' ? '14px 28px' : '10px 20px'};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme, size }) =>
        size === 'sm' ? theme.fontSizes.sm : size === 'lg' ? theme.fontSizes.lg : theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: ${({ theme }) => theme.transition};
  white-space: nowrap;

  ${({ variant = 'primary', theme }) => variantStyles[variant]?.({ theme })}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
`;

const Button = ({ children, variant = 'primary', size, fullWidth, ...rest }) => (
    <StyledButton variant={variant} size={size} fullWidth={fullWidth} {...rest}>
        {children}
    </StyledButton>
);

export default Button;
