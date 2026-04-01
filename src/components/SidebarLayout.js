import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { NavLink, Outlet } from 'react-router-dom';
import {
  MdDashboard,
  MdInventory2,
  MdPeople,
  MdShoppingCart,
  MdHistory,
  MdEventNote,
  MdMenu,
  MdClose,
  MdLightbulb,
  MdChecklist,
  MdCompareArrows,
  Mdinventory,
} from 'react-icons/md';
import { useApp } from '../context/AppContext';

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

// ─── Layout shells ────────────────────────────────────────────────────────────
const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  width: ${({ collapsed }) => (collapsed ? '68px' : '252px')};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bgSidebar};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0;
  z-index: 200;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0; right: -1px;
    width: 1px;
    height: 100%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      ${({ theme }) => theme.colors.primary}30 35%,
      ${({ theme }) => theme.colors.primary}30 65%,
      transparent 100%
    );
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ collapsed }) => (collapsed ? 'center' : 'space-between')};
  padding: ${({ collapsed }) => (collapsed ? '18px 0' : '18px 16px')};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  min-height: 68px;
  gap: 10px;
`;

const LogoBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
`;

/* Pacifico script wordmark with blue shimmer */
const BrandWordmark = styled.span`
  font-family: 'Pacifico', cursive;
  font-size: 1.4rem;
  font-weight: 400;
  white-space: nowrap;
  line-height: 1;
  background: linear-gradient(
    90deg,
    #003d99 0%,
    #0066CC 35%,
    #1a8fff 60%,
    #0066CC 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 4s linear infinite;
`;

const EstabSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgHover};
  cursor: pointer;
  font-size: 12px;
  transition: 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 60px;
  left: 80px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: 6px;
  z-index: 999;
`;

const DropdownItem = styled.div`
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

/* Collapsed state: round blue circle with "C" */
const LogoCircle = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  box-shadow: ${({ theme }) => theme.shadows.glow};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Pacifico', cursive;
  font-size: 1rem;
  color: #fff;
  flex-shrink: 0;
  padding-right: 2px;
`;

const CollapseBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const NavSection = styled.div`
  padding: ${({ collapsed }) => (collapsed === 'true' ? '8px 0 2px' : '8px 16px 2px')};
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${({ collapsed }) => (collapsed === 'true' ? '11px 0' : '11px 14px')};
  justify-content: ${({ collapsed }) => (collapsed === 'true' ? 'center' : 'flex-start')};
  margin: 0 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: ${({ theme }) => theme.transition};
  white-space: nowrap;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

&.active {
  background: ${({ theme }) => theme.colors.bgHover};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  &::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 0 3px 3px 0;
  }
}
`;

const NavIcon = styled.span`
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const NavLabel = styled.span`
  flex: 1;
  overflow: hidden;
`;

const AlertDot = styled.span`
  background: ${({ theme }) => theme.colors.danger};
  color: #fff;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  padding: 1px 6px;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
`;

const SidebarFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
  white-space: nowrap;
`;

const FooterBrand = styled.span`
  font-family: 'Pacifico', cursive;
  font-size: 0.6rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Main = styled.main`
  flex: 1;
  margin-left: ${({ collapsed }) => (collapsed ? '68px' : '252px')};
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
`;

const PageWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1400px;
`;

// ─── Navigation items (grouped) ───────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: <MdDashboard /> },
      { to: '/products', label: 'Produtos', icon: <MdInventory2 />, badge: true },
      { to: '/suppliers', label: 'Fornecedores', icon: <MdPeople /> },
      { to: '/purchase-orders', label: 'Ordens de Compra', icon: <MdShoppingCart /> },
      { to: '/purchase-suggestions', label: 'Sugestões de Compra', icon: <MdLightbulb /> },
      { to: '/stock-audits', label: 'Auditoria de estoque', icon: <MdLightbulb /> },
      { to: '/stock-transfers', label: 'Transferencia de estoque', icon: <MdCompareArrows /> },
      { to: '/stock-movement/', label: 'movimentação de estoque', icon: <MdCompareArrows /> },
      { to: '/stock-audits/history', label: 'historico de auditorias', icon: <MdChecklist /> },

      { to: '/users/', label: 'usuarios', icon: <MdPeople /> },


    ],
  },
  {
    label: 'Relatórios',
    items: [
      { to: '/stock-history', label: 'Histórico de Estoque', icon: <MdHistory /> },
      { to: '/activity-log', label: 'Reg. de Atividades', icon: <MdEventNote /> },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const SidebarLayout = ({ children }) => {

  const { state, switchEstablishment, getLowStockProducts } = useApp();

  const [collapsed, setCollapsed] = useState(false);

  const lowStockCount = getLowStockProducts().length;

  // 🔥 função de troca
  const handleSwitch = async (establishmentId) => {
    try {
      await switchEstablishment(establishmentId);
    } catch (err) {
      alert(err.message);
    }
  };

  console.log("STATE:", state);

  return (
    <Layout>
      <Sidebar collapsed={collapsed}>
        {/* Header */}
        <SidebarHeader collapsed={collapsed}>
          {!collapsed && (
            <LogoBlock>
              <BrandWordmark>Commercial</BrandWordmark>

              {/* 🔽 SELECT DE ESTABELECIMENTO */}
              {!state.loading && state.establishments && (
                <select
                  value={state.establishment?.id || ""}
                  onChange={(e) => handleSwitch(e.target.value)}
                  style={{
                    fontSize: "11px",
                    marginLeft: "8px",
                    padding: "2px",
                    borderRadius: "4px"
                  }}
                >
                  {state.establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nome_fantasia}
                    </option>
                  ))}
                </select>
              )}

            </LogoBlock>
          )}

          {collapsed && <LogoCircle>C</LogoCircle>}

          {!collapsed && (
            <CollapseBtn onClick={() => setCollapsed(true)} title="Recolher">
              <MdClose />
            </CollapseBtn>
          )}
        </SidebarHeader>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <CollapseBtn onClick={() => setCollapsed(false)} title="Expandir">
              <MdMenu />
            </CollapseBtn>
          </div>
        )}

        {/* Nav groups */}
        <Nav>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <NavSection collapsed={collapsed.toString()}>
                  {group.label}
                </NavSection>
              )}
              {group.items.map(({ to, label, icon, badge }) => (
                <StyledNavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  collapsed={collapsed.toString()}
                  title={collapsed ? label : undefined}
                >
                  <NavIcon>{icon}</NavIcon>
                  {!collapsed && <NavLabel>{label}</NavLabel>}
                  {!collapsed && badge && lowStockCount > 0 && (
                    <AlertDot>{lowStockCount}</AlertDot>
                  )}
                </StyledNavLink>
              ))}
            </div>
          ))}
        </Nav>

        {!collapsed && (
          <SidebarFooter>
            <FooterBrand>Commercial · v1.0</FooterBrand>
          </SidebarFooter>
        )}
      </Sidebar>

      <Main collapsed={collapsed}>
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </Main>
    </Layout>
  );
};
export default SidebarLayout;
