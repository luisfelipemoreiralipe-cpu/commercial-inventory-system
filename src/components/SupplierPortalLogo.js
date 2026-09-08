import React from 'react';
import styled from 'styled-components';
import logo from '../assets/logobds.png';

const Logo = styled.img`
  display: block;
  width: 160px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  margin-bottom: 12px;
`;

export default function SupplierPortalLogo() {
  return <Logo src={logo} alt="BDS" />;
}
