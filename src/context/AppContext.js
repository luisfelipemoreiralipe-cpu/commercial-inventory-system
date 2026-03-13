import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';

// ─── Initial State ───────────────────────────────────────────────────────────
const initialState = {
    categories: [],
    products: [],
    suppliers: [],
    purchaseOrders: [],
    stockMovements: [],
    auditLogs: [],
    loading: true,
    error: null,
};

// ─── Action Types ────────────────────────────────────────────────────────────
export const ACTIONS = {
    ADD_PRODUCT: 'ADD_PRODUCT',
    UPDATE_PRODUCT: 'UPDATE_PRODUCT',
    DELETE_PRODUCT: 'DELETE_PRODUCT',
    UPDATE_PRODUCT_QUANTITY: 'UPDATE_PRODUCT_QUANTITY',
    ADD_SUPPLIER: 'ADD_SUPPLIER',
    UPDATE_SUPPLIER: 'UPDATE_SUPPLIER',
    DELETE_SUPPLIER: 'DELETE_SUPPLIER',
    ADD_PURCHASE_ORDER: 'ADD_PURCHASE_ORDER',
    UPDATE_PURCHASE_ORDER: 'UPDATE_PURCHASE_ORDER',
    COMPLETE_PURCHASE_ORDER: 'COMPLETE_PURCHASE_ORDER',
    DELETE_PURCHASE_ORDER: 'DELETE_PURCHASE_ORDER',
};

// ─── Reducer Puro ────────────────────────────────────────────────────────────
const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'SET_ALL_DATA':
            return { ...state, ...action.payload, loading: false, error: null };
        case 'UPDATE_LOGS_MOVEMENTS':
            return { ...state, ...action.payload };

        // Products ---------------------------------------------------------------
        case ACTIONS.ADD_PRODUCT:
            return { ...state, products: [...state.products, action.payload] };
        case ACTIONS.UPDATE_PRODUCT:
        case ACTIONS.UPDATE_PRODUCT_QUANTITY:
            return {
                ...state,
                products: state.products.map((x) => {
                    if (x.id !== action.payload.id) return x;

                    return {
                        ...x,
                        quantity: action.payload.quantity
                    };
                }),
            };
        case ACTIONS.DELETE_PRODUCT:
            return {
                ...state,
                products: state.products.filter((x) => x.id !== action.payload),
            };

        // Suppliers --------------------------------------------------------------
        case ACTIONS.ADD_SUPPLIER:
            return { ...state, suppliers: [...state.suppliers, action.payload] };
        case ACTIONS.UPDATE_SUPPLIER:
            return {
                ...state,
                suppliers: state.suppliers.map((x) =>
                    x.id === action.payload.id ? action.payload : x
                ),
            };
        case ACTIONS.DELETE_SUPPLIER:
            return {
                ...state,
                suppliers: state.suppliers.filter((x) => x.id !== action.payload),
            };

        // Purchase Orders --------------------------------------------------------
        case ACTIONS.ADD_PURCHASE_ORDER:
            return { ...state, purchaseOrders: [...state.purchaseOrders, action.payload] };
        case ACTIONS.UPDATE_PURCHASE_ORDER:
            // Local Only: Permite ao front transitar dados na UI antes de efetivamente apagar ou enviar.
            return {
                ...state,
                purchaseOrders: state.purchaseOrders.map((x) =>
                    x.id === action.payload.id ? action.payload : x
                ),
            };
        case ACTIONS.DELETE_PURCHASE_ORDER:
            return {
                ...state,
                purchaseOrders: state.purchaseOrders.filter((x) => x.id !== action.payload),
            };

        default:
            return state;
    }
};

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [state, dispatchRaw] = useReducer(appReducer, initialState);

    // Helper 1: Puxar tabelas secundárias em 2º plano (Movimentação e Logs). 
    // Sem travar a UI (loading state = false);
    const fetchSideEffects = useCallback(async () => {
        try {
            const [movRes, logsRes] = await Promise.all([
                api.get('/stock-movements'),
                api.get('/audit-logs')
            ]);
            dispatchRaw({
                type: 'UPDATE_LOGS_MOVEMENTS',
                payload: {
                    stockMovements: movRes.data,
                    auditLogs: logsRes.data
                }
            });
        } catch (e) {
            console.error("Erro ao carregar auditorias contínuas:", e);
        }
    }, []);

    // Helper 2: Hard-Reload (Reconstruir todo o Context Application puxando pela API)
    const fetchAllData = useCallback(async (showLoading = true) => {
        if (showLoading) dispatchRaw({ type: 'SET_LOADING', payload: true });
        try {
            const [cRes, pRes, sRes, poRes, mRes, lRes] = await Promise.all([
                api.get('/categories'),
                api.get('/products'),
                api.get('/suppliers'),
                api.get('/purchase-orders'),
                api.get('/stock-movements'),
                api.get('/audit-logs'),
            ]);

            dispatchRaw({
                type: 'SET_ALL_DATA',
                payload: {
                    categories: cRes.data.data || cRes.data,
                    products: pRes.data.data || pRes.data,
                    suppliers: sRes.data.data || sRes.data,
                    purchaseOrders: poRes.data.data || poRes.data,
                    stockMovements: mRes.data.data || mRes.data,
                    auditLogs: lRes.data.data || lRes.data,
                },
            });
            console.log("CATEGORIES:", cRes.data);
            console.log("PRODUCTS:", pRes.data);
            console.log("SUPPLIERS:", sRes.data);
        }

        catch (err) {

            console.error("Dispatch API Error:", err);

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Erro inesperado";

            dispatchRaw({ type: 'SET_ERROR', payload: message });

        }
    }, []);

    // Sync / App Mount 
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Dispatch Assíncrono Personalizado — Interceptador Centralizado de Requisições
    const dispatch = useCallback(async (action) => {
        try {
            switch (action.type) {

                // --- Produtos HTTP Map ---
                case ACTIONS.ADD_PRODUCT: {
                    const res = await api.post('/products', action.payload);
                    dispatchRaw({ type: ACTIONS.ADD_PRODUCT, payload: res.data });
                    fetchSideEffects();
                    break;
                }
                case ACTIONS.UPDATE_PRODUCT: {

                    await api.put(`/products/${action.payload.id}`, action.payload);

                    const updated = await api.get(`/products/${action.payload.id}`);

                    dispatchRaw({
                        type: ACTIONS.UPDATE_PRODUCT,
                        payload: updated.data
                    });

                    fetchSideEffects();
                    break;
                }
                case ACTIONS.DELETE_PRODUCT: {
                    await api.delete(`/products/${action.payload}`);
                    dispatchRaw({ type: ACTIONS.DELETE_PRODUCT, payload: action.payload });
                    fetchSideEffects();
                    break;
                }
                case ACTIONS.UPDATE_PRODUCT_QUANTITY: {

                    await api.patch(
                        `/products/${action.payload.id}/quantity`,
                        { quantity: action.payload.quantity }
                    );

                    const updated = await api.get(`/products/${action.payload.id}`);

                    dispatchRaw({
                        type: ACTIONS.UPDATE_PRODUCT,
                        payload: updated.data
                    });

                    fetchSideEffects();
                    break;
                }

                // --- Fornecedores HTTP Map ---
                case ACTIONS.ADD_SUPPLIER: {
                    const res = await api.post('/suppliers', action.payload);
                    dispatchRaw({ type: ACTIONS.ADD_SUPPLIER, payload: res.data });
                    fetchSideEffects();
                    break;
                }
                case ACTIONS.UPDATE_SUPPLIER: {
                    const res = await api.put(`/suppliers/${action.payload.id}`, action.payload);
                    dispatchRaw({ type: ACTIONS.UPDATE_SUPPLIER, payload: res.data });
                    fetchSideEffects();
                    break;
                }
                case ACTIONS.DELETE_SUPPLIER: {
                    await api.delete(`/suppliers/${action.payload}`);
                    dispatchRaw({ type: ACTIONS.DELETE_SUPPLIER, payload: action.payload });
                    fetchSideEffects();
                    break;
                }

                // --- Purchase Orders HTTP Map ---
                case ACTIONS.ADD_PURCHASE_ORDER: {
                    const res = await api.post('/purchase-orders', action.payload);
                    dispatchRaw({ type: ACTIONS.ADD_PURCHASE_ORDER, payload: res.data });
                    fetchSideEffects();
                    break;
                }
                case ACTIONS.COMPLETE_PURCHASE_ORDER: {
                    await api.put(`/purchase-orders/${action.payload}/complete`);
                    // Ordem completada altera entidades diversas dentro do DB (Items, Logs, Ordens e Insumos).
                    // Aciona hard-sync invisível global sem congelar tela de transição
                    fetchAllData(false);
                    break;
                }
                case ACTIONS.DELETE_PURCHASE_ORDER: {
                    await api.delete(`/purchase-orders/${action.payload}`);
                    dispatchRaw({ type: ACTIONS.DELETE_PURCHASE_ORDER, payload: action.payload });
                    fetchSideEffects();
                    break;
                }

                default:
                    dispatchRaw(action); // Operações locais restritas à interface (sem fetch)
            }
        } catch (err) {

            console.error("Dispatch API Error:", err);

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Erro inesperado";

            throw new Error(message);

        }
    }, [fetchAllData, fetchSideEffects]);

    // Selectors ─────────────────────────────────────────────────────────────────
    const getLowStockProducts = useCallback(
        () => state.products.filter((p) => Number(p.quantity) < Number(p.minQuantity)),
        [state.products]
    );

    const getTotalInventoryValue = useCallback(
        () => state.products.reduce((s, p) => s + Number(p.unitPrice) * Number(p.quantity), 0),
        [state.products]
    );

    const getSupplierById = useCallback(
        (id) => state.suppliers.find((s) => s.id === id),
        [state.suppliers]
    );

    const getProductById = useCallback(
        (id) => state.products.find((p) => p.id === id),
        [state.products]
    );

    return (
        <AppContext.Provider value={{
            state,
            dispatch,
            getLowStockProducts,
            getTotalInventoryValue,
            getSupplierById,
            getProductById,
        }}>
            {children}
        </AppContext.Provider>
    );
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useApp = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
    return ctx;
};
