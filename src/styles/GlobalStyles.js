import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Fonts loaded via <link> in public/index.html (Inter + Pacifico) */

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.base};
    background-color: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.textPrimary};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Scrollbar */
  ::-webkit-scrollbar        { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track  { background: ${({ theme }) => theme.colors.bgHover}; }
  ::-webkit-scrollbar-thumb  {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.primary};
  }

  a       { text-decoration: none; color: inherit; }
  button  { cursor: pointer; border: none; background: none; font-family: inherit; }
  input, select, textarea { font-family: inherit; }
  ul, ol  { list-style: none; }
  img, svg { display: block; max-width: 100%; }
`;

export default GlobalStyles;
