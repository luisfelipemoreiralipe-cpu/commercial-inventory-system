import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdEdit as MdQty, MdStore, MdWarning } from 'react-icons/md';
import { useApp, ACTIONS } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import toast from "react-hot-toast";
import EmptyState from '../components/EmptyState';
import api from "../services/api";
import RecipeModal from "../components/RecipeModal";
import { Input } from '../components/FormFields';
import Select from "../components/Select";
import { useLocation } from "react-router-dom";
import { MdMenuBook } from "react-icons/md";
import {
    getProductSuppliers,
    addProductSupplier,
    removeProductSupplier
} from "../services/productSupplierService";

// ─── Constants ─────────────────────────────────────────────────────────────────
const UNITS = ['unidade', 'kg', 'g', 'litro', 'ml', 'caixa', 'pacote', 'saco', 'rolo', 'metro', 'pç'];
const EMPTY_FORM = {
    name: '',
    categoryId: '',
    type: 'INVENTORY',
    unit: 'unidade',
    purchaseUnit: '',
    packQuantity: 1,
    unitPrice: '',
    quantity: '',
    minQuantity: '',
    supplierId: '',
};

// ─── Styled ────────────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TitleBlock = styled.div``;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: 4px;
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 14px;
  flex: 1;
  min-width: 240px;
  transition: ${({ theme }) => theme.transition};

  svg {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 18px;
  }

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryLight};
  }
`;

const SearchInput = styled.input`
  background: none;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  width: 100%;
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: ${({ theme }) => theme.colors.bgHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: ${({ theme }) => theme.transition};

  ${({ lowStock }) =>
        lowStock &&
        `
      background: rgba(239,68,68,0.05);
  `}

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const IconBtn = styled.button`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme, color }) => theme.colors[color] || theme.colors.textSecondary};

  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  font-size: 1rem;

  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
    border-color: ${({ theme }) => theme.colors.textMuted};
    color: ${({ theme, color }) => theme.colors[color] || theme.colors.textPrimary};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const FormFull = styled.div`
  grid-column: 1 / -1;
`;

const DateMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
`;

const TableOverflow = styled.div`
  overflow-x: auto;
`;

// ─── Page Component ─────────────────────────────────────────────────────────────
const Products = () => {
    const { state, dispatch } = useApp();
    const location = useLocation();
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStock, setFilterStock] = useState('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null);
    const [qtyModal, setQtyModal] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [qtyValue, setQtyValue] = useState('');
    const [errors, setErrors] = useState({});
    const [supplierModal, setSupplierModal] = useState(null);
    const [productSuppliers, setProductSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [supplierPrice, setSupplierPrice] = useState("");
    const [recipeModal, setRecipeModal] = useState(null);
    const [filterType, setFilterType] = useState("ALL");
    const [form, setForm] = useState(EMPTY_FORM);

    // 🔥 FUNÇÃO FORA (CORRETO)
    const loadProducts = async () => {
        try {
            console.log("📡 [FRONT-DEBUG] Iniciando busca de produtos...");

            const res = await api.get("/products");

            // 🚨 O LOG MAIS IMPORTANTE:
            console.log("📦 [FRONT-DEBUG] Dados recebidos da API:", {
                totalRecebido: res.data?.length || res.length,
                dados: res.data || res
            });

            if (!res || (Array.isArray(res) && res.length === 0)) {
                console.warn("⚠️ [FRONT-DEBUG] Atenção: A API retornou uma lista VAZIA!");
            }

            dispatch({
                type: ACTIONS.SET_PRODUCTS,
                payload: res
            });

        } catch (error) {
            console.error("❌ [FRONT-DEBUG] Erro crítico na requisição:", error);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await api.get("/categories");

            console.log("CATEGORIAS API:", res.data);

            dispatch({
                type: ACTIONS.SET_CATEGORIES,
                payload: res
            });

        } catch (error) {
            console.error("ERRO AO BUSCAR CATEGORIAS:", error);
        }
    };

    // 🔥 USE EFFECT PRODUTOS
    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);


    // Derived
    const totalProducts = state.products.length;




    const lowStockProducts = state.products.filter(
        p => Number(p.quantity) < Number(p.minQuantity)
    ).length;

    const productsWithoutSupplier = state.products.filter(
        p => !p.productSuppliers || p.productSuppliers.length === 0
    ).length;

    const totalStockValue = state.products.reduce((sum, p) => {
        const bestPriceOfProduct = p.productSuppliers && p.productSuppliers.length > 0
            ? Math.min(...p.productSuppliers.map(s => Number(s.price)))
            : Number(p.unitPrice || 0);

        return sum + ((bestPriceOfProduct / (Number(p.packQuantity) || 1)) * Number(p.quantity));
    }, 0);
    const categories = state.categories || [];
    console.log("CATEGORIES:", state.categories);

    const availableSuppliers = state.suppliers.filter((supplier) => {

        return !productSuppliers.some(
            (ps) => ps.id === supplier.id || ps.supplierId === supplier.id
        );

    });



    const filtered = state.products.filter((p) => {

        const matchSearch =
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.name?.toLowerCase().includes(search.toLowerCase());

        const matchType =
            filterType === "ALL"
                ? true
                : p.type === filterType;

        const matchCat =
            !filterCategory || p.categoryId === filterCategory;

        const matchStock =
            filterStock === 'all'
                ? true
                : filterStock === 'low'
                    ? Number(p.quantity) < Number(p.minQuantity)
                    : Number(p.quantity) >= Number(p.minQuantity);

        return matchSearch && matchCat && matchStock && matchType;

    });

    const validate = () => {

        const e = {};

        if (!form.name.trim()) e.name = 'Campo obrigatório';

        if (!form.categoryId) e.categoryId = 'Campo obrigatório';

        if (form.type !== "PRODUCTION") {

            if (form.quantity === "" || isNaN(form.quantity) || Number(form.quantity) < 0) {
                e.quantity = 'Qtd. inválida';
            }

            if (form.minQuantity === "" || isNaN(form.minQuantity) || Number(form.minQuantity) < 0) {
                e.minQuantity = 'Qtd. mínima inválida';
            }

        }

        setErrors(e);

        return Object.keys(e).length === 0;

    };



    const handleOpenSuppliers = async (product) => {

        try {

            const result = await getProductSuppliers(product.id);

            setProductSuppliers(result || []);
            setSupplierModal(product);

        } catch (err) {

            console.error(err);

        }

    };



    const openAdd = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setModalOpen(true);
    };

    const openEdit = (p) => {
        setEditTarget(p);
        setForm({
            name: p.name,
            categoryId: p.categoryId || '',
            unit: p.unit,
            purchaseUnit: p.purchaseUnit || '',
            packQuantity: p.packQuantity || 1,
            unitPrice: p.unitPrice,
            quantity: Number(p.quantity || 0) / Number(p.packQuantity || 1),
            minQuantity: Number(p.minQuantity || 0) / Number(p.packQuantity || 1),
            supplierId: p.supplierId || '',
            type: p.type || 'INVENTORY',
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleAddSupplier = async () => {

        if (!selectedSupplier) return;

        if (!supplierPrice || Number(supplierPrice) <= 0) {
            alert("Informe um preço válido");
            return;
        }

        try {

            await addProductSupplier(
                supplierModal.id,
                selectedSupplier,
                Number(supplierPrice)
            );

            const updated = await getProductSuppliers(
                supplierModal.id
            );

            setProductSuppliers(updated || []);
            await loadProducts();

            setSelectedSupplier("");
            setSupplierPrice("");

        } catch (err) {

            console.error(err);

        }

    };



    const handleSubmit = async () => {


        console.log("FORM COMPLETO:", form);

        if (!validate()) return;

        const payload = {
            name: form.name,
            categoryId: form.categoryId,
            unit: form.unit,
            purchaseUnit: form.purchaseUnit || '',
            packQuantity: Number(form.packQuantity || 1),
            type: form.type || 'INVENTORY',
            unitPrice: Number(form.unitPrice || 0),
            quantity: Number(form.quantity || 0) * Number(form.packQuantity || 1),
            minQuantity: Number(form.minQuantity || 0) * Number(form.packQuantity || 1),
        };

        try {
            if (editTarget) {
                await api.put(`/products/${editTarget.id}`, payload);
            } else {
                await api.post('/products', payload);
            }

            await loadProducts(); // 🔥 ISSO RESOLVE

            setModalOpen(false);

        } catch (error) {

            console.error(error);

        }


    };

    const handleDelete = async () => {

        try {

            await api.delete(`/products/${deleteModal.id}`);

            await loadProducts(); // 🔥 IMPORTANTE

            setDeleteModal(null);

            toast.success("Produto removido com sucesso");

        } catch (err) {

            toast.error(err.message);

        }

    };

    const handleQtyUpdate = async () => {
        if (qtyValue === '' || isNaN(qtyValue) || Number(qtyValue) < 0) return;

        const newRealQuantity = Number(qtyValue) * (Number(qtyModal.packQuantity) || 1);

        try {
            await api.put(`/products/${qtyModal.id}`, {
                ...qtyModal,
                quantity: newRealQuantity
            });

            await dispatch({
                type: ACTIONS.UPDATE_PRODUCT_QUANTITY,
                payload: { id: qtyModal.id, quantity: newRealQuantity },
            });

            toast.success("Estoque atualizado");
            setQtyModal(null);
            setQtyValue('');
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar estoque");
        }
    };
    const handleRemoveSupplier = async (supplierId) => {

        try {

            await removeProductSupplier(
                supplierModal.id,
                supplierId
            );

            const updated = await getProductSuppliers(
                supplierModal.id
            );

            setProductSuppliers(updated || []);
            await loadProducts();

        } catch (err) {

            console.error(err);

        }

    };

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
        error: errors[key],
    });

    return (
        <>
            <PageHeader>
                <TitleBlock>
                    <PageTitle>Produtos</PageTitle>
                    <PageSubtitle>{state.products.length} produto(s) cadastrado(s)</PageSubtitle>
                </TitleBlock>
                <Button onClick={openAdd}>
                    <MdAdd /> Novo Produto
                </Button>
            </PageHeader>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px"
                }}
            >

                <Card>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                        Produtos cadastrados
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {totalProducts}
                    </div>
                </Card>

                <Card>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                        Estoque baixo
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {lowStockProducts}
                    </div>
                </Card>

                <Card>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                        Sem fornecedor
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {productsWithoutSupplier}
                    </div>
                </Card>

                <Card>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                        Valor do estoque
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>
                        {formatCurrency(totalStockValue)}
                    </div>
                </Card>

            </div>
            {/* Filters */}


            {/* FILTRO POR TIPO */}

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>

                <Button
                    variant={filterType === "ALL" ? "primary" : "secondary"}
                    onClick={() => setFilterType("ALL")}
                >
                    Todos
                </Button>

                <Button
                    variant={filterType === "INVENTORY" ? "primary" : "secondary"}
                    onClick={() => setFilterType("INVENTORY")}
                >
                    Insumos
                </Button>

                <Button
                    variant={filterType === "PRODUCTION" ? "primary" : "secondary"}
                    onClick={() => setFilterType("PRODUCTION")}
                >
                    Produção
                </Button>

            </div>

            {/* Filters */}
            <SearchRow>
                <SearchBox>
                    <MdSearch />
                    <SearchInput
                        placeholder="Buscar por nome ou categoria..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </SearchBox>
                <Select 
                    value={filterCategory} 
                    onChange={setFilterCategory}
                    options={[
                        { value: "", label: "Todas as categorias" },
                        ...categories.map((c) => ({ value: c.id, label: c.name }))
                    ]}
                />

                <Select 
                    value={filterStock} 
                    onChange={setFilterStock}
                    options={[
                        { value: "all", label: "Todos os estoques" },
                        { value: "low", label: "Abaixo do mínimo" },
                        { value: "ok", label: "Estoque adequado" }
                    ]}
                />
            </SearchRow>

            {/* Table */}
            <Card padding="0">
                {filtered.length === 0 ? (
                    <EmptyState
                        title="Nenhum produto encontrado"
                        subtitle="Adicione produtos ou ajuste os filtros acima."
                    />
                ) : (
                    <TableOverflow>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Nome</Th>
                                    <Th>Categoria</Th>
                                    <Th>Unidade</Th>
                                    <Th>Custo Atual</Th>
                                    <Th>Qtd.</Th>
                                    <Th>Mín.</Th>
                                    <Th>Fornec</Th>
                                    <Th>Melhor Preço</Th>
                                    <Th>Valor Total</Th>
                                    <Th>Status</Th>
                                    <Th>Ações</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => {
                                    const isLow = Number(p.quantity) < Number(p.minQuantity);
                                    const bestPrice =
                                        p.productSuppliers && p.productSuppliers.length > 0
                                            ? Math.min(...p.productSuppliers.map(s => Number(s.price)))
                                            : 0;

                                    return (
                                        <Tr key={p.id} lowStock={isLow}>
                                            <Td>
                                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                <DateMeta>
                                                    Criado em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                                                </DateMeta>
                                            </Td>
                                            <Td>{p.category?.name || 'N/A'}</Td>
                                            <Td>{p.unit}</Td>
                                            <Td>{bestPrice || p.unitPrice ? formatCurrency(bestPrice || Number(p.unitPrice)) : "-"}</Td>
                                            <Td style={{ color: isLow ? '#413232ff' : 'inherit', fontWeight: isLow ? 700 : 400 }}>
                                                {p.quantity} {p.unit} ({(Number(p.quantity) / (Number(p.packQuantity) || 1)).toFixed(2)} {p.purchaseUnit || 'un'})
                                            </Td>
                                            <Td>
                                                {p.minQuantity} {p.unit} ({(Number(p.minQuantity) / (Number(p.packQuantity) || 1)).toFixed(2)} {p.purchaseUnit || 'un'})
                                            </Td>
                                            <Td>
                                                {p.suppliers?.length ? (
                                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                                        {p.suppliers[0]?.name}
                                                        {p.suppliers.length > 1 && (
                                                            <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px' }}>
                                                                (+{p.suppliers.length - 1})
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="warning">
                                                        <MdWarning style={{ marginRight: 4 }} />
                                                        Sem fornecedor
                                                    </Badge>
                                                )}
                                            </Td>
                                            <Td>
                                                {p.productSuppliers && p.productSuppliers.length > 0
                                                    ? formatCurrency(bestPrice)
                                                    : "-"}
                                            </Td>
                                            <Td>
                                                {formatCurrency(
                                                    ((bestPrice || Number(p.unitPrice) || 0) / (Number(p.packQuantity) || 1)) * Number(p.quantity)
                                                )}
                                            </Td>
                                            <Td>
                                                {isLow ? (
                                                    <Badge variant="danger">Baixo</Badge>
                                                ) : (
                                                    <Badge variant="success">OK</Badge>
                                                )}
                                            </Td>
                                            <Td>
                                                <ActionRow>
                                                    <IconBtn
                                                        title="Ficha Técnica"
                                                        onClick={() => setRecipeModal(p)}
                                                    >
                                                        <MdMenuBook />
                                                    </IconBtn>

                                                    <IconBtn
                                                        title="Fornecedores"
                                                        onClick={() => handleOpenSuppliers(p)}
                                                    >
                                                        <MdStore />
                                                    </IconBtn>
                                                    <IconBtn
                                                        title="Editar quantidade"
                                                        color="warning"
                                                        onClick={() => { 
                                                            setQtyModal(p); 
                                                            setQtyValue(String(Number(p.quantity) / (Number(p.packQuantity) || 1))); 
                                                        }}
                                                    >
                                                        <MdQty />
                                                    </IconBtn>
                                                    <IconBtn title="Editar produto" onClick={() => openEdit(p)}>
                                                        <MdEdit />
                                                    </IconBtn>
                                                    <IconBtn color="danger" title="Deletar produto" onClick={() => setDeleteModal(p)}>
                                                        <MdDelete />
                                                    </IconBtn>
                                                </ActionRow>
                                            </Td>
                                        </Tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </TableOverflow>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editTarget ? 'Editar Produto' : 'Novo Produto'}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSubmit();
                            }}
                        >
                            {editTarget ? 'Salvar' : 'Criar Produto'}
                        </Button>
                    </>
                }
            >
                <FormGrid>

                    <FormFull>
                        <Input
                            label="Nome do Produto *"
                            placeholder="Ex: Farinha de Trigo"
                            {...field('name')}
                        />
                    </FormFull>


                    {/* TIPO DE PRODUTO */}
                    <Select
                        label="Tipo de Produto *"
                        value={form.type}
                        onChange={(val) =>
                            setForm((f) => ({ ...f, type: val }))
                        }
                        options={[
                            { value: "INVENTORY", label: "Estoque" },
                            { value: "PRODUCTION", label: "Produção" }
                        ]}
                    />

                    <Select 
                        label="Categoria *" 
                        value={form.categoryId}
                        onChange={(val) => setForm((f) => ({ ...f, categoryId: val }))}
                        options={[
                            { value: "", label: "-- Selecione uma categoria --" },
                            ...categories.map((c) => ({ value: c.id, label: c.name }))
                        ]}
                    />

                    <FormFull>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                            gap: '16px',
                            padding: '16px',
                            background: 'rgba(0,0,0,0.02)',
                            borderRadius: '8px',
                            border: '1px dashed #cbd5e1'
                        }}>
                            <Select 
                                label="Unidade Base (Consumo/Ficha) *" 
                                value={form.unit}
                                onChange={(val) => setForm((f) => ({ ...f, unit: val }))}
                                options={UNITS.map((u) => ({ value: u, label: u }))}
                            />

                            <Input
                                label="Unidade de Compra"
                                placeholder="Ex: Garrafa, Caixa, Unidade"
                                {...field('purchaseUnit')}
                            />

                            <div>
                                <Input
                                    label="Quantidade na Embalagem"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Ex: 750"
                                    {...field('packQuantity')}
                                />
                                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                    Quantos ml/g/un vêm dentro da unidade de compra?
                                </span>
                            </div>
                        </div>
                    </FormFull>

                    {form.type !== 'PRODUCTION' && (
                        <>
                            <Input
                                label="Qtd. em Estoque"
                                type="number"
                                min="0"
                                placeholder="0"
                                {...field('quantity')}
                            />

                            <Input
                                label="Qtd. Mínima"
                                type="number"
                                min="0"
                                placeholder="0"
                                {...field('minQuantity')}
                            />

                            <FormFull>
                                <Select 
                                    label="Fornecedor Vinculado" 
                                    value={form.supplierId}
                                    onChange={(val) => setForm((f) => ({ ...f, supplierId: val }))}
                                    options={[
                                        { value: "", label: "-- Selecione um fornecedor --" },
                                        ...state.suppliers.map((s) => ({ value: s.id, label: s.name }))
                                    ]}
                                />
                            </FormFull>
                        </>
                    )}

                </FormGrid>
            </Modal>

            {/* Update Quantity Modal */}
            <Modal
                isOpen={!!qtyModal}
                onClose={() => setQtyModal(null)}
                title={`Atualizar Quantidade — ${qtyModal?.name}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setQtyModal(null)}>Cancelar</Button>
                        <Button onClick={handleQtyUpdate}>Atualizar</Button>
                    </>
                }
            >
                <Input
                    label={`Nova Quantidade (${qtyModal?.unit})`}
                    type="number"
                    min="0"
                    value={qtyValue}
                    onChange={(e) => setQtyValue(e.target.value)}
                    placeholder="Digite a nova quantidade"
                />
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title="Confirmar Exclusão"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete}>Deletar</Button>
                    </>
                }
            >
                <p style={{ color: '#4B5563', lineHeight: 1.7 }}>
                    Tem certeza que deseja deletar o produto <strong style={{ color: '#111827' }}>{deleteModal?.name}</strong>?
                    Essa ação não pode ser desfeita.
                </p>
            </Modal>
            {/* Suppliers Modal */}

            <Modal
                isOpen={!!supplierModal}
                onClose={() => setSupplierModal(null)}
                title={`Fornecedores — ${supplierModal?.name}`}
                footer={
                    <Button onClick={() => setSupplierModal(null)}>
                        Fechar
                    </Button>
                }
            >

                {productSuppliers.length === 0 ?

                    <p>Nenhum fornecedor vinculado</p>

                    :

                    <ul style={{ listStyle: "none", padding: 0 }}>

                        {productSuppliers.map((s) => (

                            <li
                                key={s.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 10
                                }}
                            >

                                <span style={{ fontWeight: 500 }}>
                                    {s.name} — {formatCurrency(s.price)}
                                </span>

                                <Button
                                    variant="danger"
                                    onClick={() => handleRemoveSupplier(s.id)}
                                >
                                    Remover
                                </Button>

                            </li>

                        ))}
                    </ul>
                }

                <hr style={{ margin: "20px 0" }} />

                <Select
                    label="Adicionar fornecedor"
                    value={selectedSupplier}
                    onChange={(val) => setSelectedSupplier(val)}
                    options={[
                        { value: "", label: "Selecionar fornecedor" },
                        ...availableSuppliers.map((s) => ({ value: s.id, label: s.name }))
                    ]}
                />

                <Input
                    label="Preço do fornecedor"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={supplierPrice}
                    onChange={(e) => setSupplierPrice(e.target.value)}
                />

                <Button
                    style={{ marginTop: 10 }}
                    onClick={handleAddSupplier}
                    disabled={!selectedSupplier || !supplierPrice}
                >

                    Adicionar fornecedor

                </Button>

            </Modal>
            <RecipeModal
                product={recipeModal}
                isOpen={!!recipeModal}
                onClose={() => setRecipeModal(null)}
                products={state.products || []}
            />
        </>
    );
};

export default Products;
