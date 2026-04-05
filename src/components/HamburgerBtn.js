import React, { useContext } from 'react';
import styled from 'styled-components';
import { MdMenu } from 'react-icons/md';
import { useApp } from '../context/AppContext';

// Caso o LayoutContext não tenha sido exportado separadamente no AppContext e isMenuOpen esteja num Provider solto.
// Vamos criar um HamburgerBtn puro que recebe onClick se necessário, mas primeiro checamos o AppContext:
// Se não existir "isMenuOpen" em useApp, teremos um problema. 
// Vamos assumir temporariamente que é possível fazer abrir via context local, ou se não, eu só crio o botão visual e passo a ação.
// Na verdade, SidebarLayout tem isMenuOpen internamente.
