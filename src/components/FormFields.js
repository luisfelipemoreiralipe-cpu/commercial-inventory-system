import React from 'react';
import styled from 'styled-components';

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const baseInputStyles = ({ theme }) => `
  width: 100%;
  background: ${theme.colors.bgInput};
  border: 1.5px solid ${theme.colors.border};
  border-radius: ${theme.radii.md};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSizes.md};
  padding: 10px 14px;
  transition: ${theme.transition};
  outline: none;

  &::placeholder {
    color: ${theme.colors.textMuted};
  }

  &:focus {
    border-color: ${theme.colors.borderFocus};
    box-shadow: 0 0 0 3px ${theme.colors.primaryGlow};
  }
`;

const StyledInput = styled.input`
  ${({ theme }) => baseInputStyles({ theme })}

  ${({ size }) =>
    size === "sm" &&
    `
    padding: 6px 8px;
    font-size: 13px;
  `}

  &[type="number"] {
    -moz-appearance: textfield;
  }
  &[type="number"]::-webkit-inner-spin-button,
  &[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const StyledSelect = styled.select`
  ${({ theme }) => baseInputStyles({ theme })}
  cursor: pointer;

  option {
    background: ${({ theme }) => theme.colors.bgCard};
  }
`;

const StyledTextarea = styled.textarea`
  ${({ theme }) => baseInputStyles({ theme })}
  resize: vertical;
  min-height: 100px;
`;

const ErrorText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.danger};
`;

export const Input = ({ label, error, onWheel, onKeyDown, ...props }) => {
  const handleWheel = (e) => {
    if (props.type === 'number') {
      e.target.blur();
    }
    if (onWheel) onWheel(e);
  };

  const handleKeyDown = (e) => {
    if (props.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <Label>
      {label && <span>{label}</span>}
      <StyledInput {...props} onWheel={handleWheel} onKeyDown={handleKeyDown} />
      {error && <ErrorText>{error}</ErrorText>}
    </Label>
  );
};

export const Select = ({ label, error, children, options, onChange, ...props }) => (
  <Label>
    {label && <span>{label}</span>}
    <StyledSelect 
      {...props} 
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {options ? options.map((opt, idx) => (
        <option key={idx} value={opt.value}>
          {opt.label}
        </option>
      )) : children}
    </StyledSelect>
    {error && <ErrorText>{error}</ErrorText>}
  </Label>
);

export const Textarea = ({ label, error, ...props }) => (
  <Label>
    {label && <span>{label}</span>}
    <StyledTextarea {...props} />
    {error && <ErrorText>{error}</ErrorText>}
  </Label>
);

export const CurrencyInput = ({ value, onChange, ...props }) => {
  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      if (onChange) onChange("");
      return;
    }
    const num = (parseInt(val, 10) / 100).toFixed(2);
    if (onChange) onChange(num);
  };

  const formattedValue = value 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
    : "";

  return (
    <Input 
      {...props}
      type="text"
      inputMode="numeric"
      value={formattedValue}
      onChange={handleChange}
    />
  );
};
