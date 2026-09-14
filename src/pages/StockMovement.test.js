import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { ThemeProvider } from 'styled-components';
import { theme } from '../styles/theme';
import StockMovement from './StockMovement';
import api from '../services/api';
import toast from 'react-hot-toast';

jest.mock('../services/api', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));
jest.mock('../context/AppContext', () => ({
    useApp: () => ({
        state: { products: [
            { id: 'drink', name: 'Bebida da equipe', type: 'INVENTORY', purchaseClassification: 'CMV_BEVERAGES', quantity: 20, packQuantity: 6, defaultLocationId: 'loc' },
            { id: 'soap', name: 'Detergente', type: 'INVENTORY', purchaseClassification: 'CLEANING', quantity: 20 }
        ] },
        fetchAllData: jest.fn()
    })
}));
jest.mock('../components/Select', () => ({ label, value, onChange, options }) => (
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
        <option value="">Selecione</option>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
));

test('consumo operacional permanece na movimentação e baixa produtos em unidades de estoque', async () => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    api.get.mockResolvedValue([{ id: 'loc', name: 'Bar', isDefault: true }]);
    api.post.mockResolvedValue({ success: true });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const clickButton = text => act(async () => {
        [...container.querySelectorAll('button')].find(button => button.textContent.includes(text)).click();
    });
    try {
        await act(async () => root.render(<ThemeProvider theme={theme}><StockMovement /></ThemeProvider>));
        await clickButton('Consumo Operacional');
        expect(container.textContent).toContain('Saída de produtos consumidos pela equipe');
        expect(container.textContent).not.toContain('Detergente');
        await act(async () => Simulate.change(container.querySelector('select'), { target: { value: 'drink' } }));
        await act(async () => Simulate.change(container.querySelector('input[type="number"]'), { target: { value: '4' } }));
        await clickButton('Confirmar Movimentação');
        expect(api.post).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Estoque insuficiente no sistema');
        await act(async () => Simulate.change(container.querySelector('input[type="number"]'), { target: { value: '2' } }));
        await clickButton('Confirmar Movimentação');
        expect(api.post).toHaveBeenCalledWith('/stock-movements/beverage-operational-use', {
            productId: 'drink', quantity: 12, locationId: 'loc'
        });
        expect(toast.success).toHaveBeenCalledWith('Movimentação realizada com sucesso');
    } finally {
        await act(async () => root.unmount());
        container.remove();
    }
});
