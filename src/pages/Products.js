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
import { Input, Select } from '../components/FormFields';
import { useLocation } from "react-router-dom";
import { MdMenuBook } from "react-icons/md";
import {
    getProductSuppliers,
    addProductSupplier,
    removeProductSupplier
} from "../services/productSupplierService";

// ─── Constants ─────────────────────────────────────────────────────────────────
const UNITS = ['unidade', 'kg', 'litro', 'caixa', 'pacote', 'saco', 'rolo', 'metro', 'pç'];
const EMPTY_FORM = {
    name: '',
    categoryId: '',
    type: 'INVENTORY',
    unit: 'unidade',
    unitPrice: '',
    quantity: '',
    minQuantity: '',
    supplierId: '',
    sectorId: '',
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

const FilterSelect = styled.select`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: 10px 12px;
  outline: none;
  cursor: pointer;
  transition: ${({ theme }) => theme.transition};
  &:hover {
    border-color: ${({ theme }) => theme.colors.textMuted};
  }
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  option {
    background: ${({ theme }) => theme.colors.bgCard};
  }
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
    const [sectors, setSectors] = useState([]);
    const [filterType, setFilterType] = useState("ALL");
    const [form, setForm] = useState({
        name: '',
        unit: '',
        categoryId: '',
        sectorId: ''
    });

    // 🔥 FUNÇÃO FORA (CORRETO)
    const loadProducts = async () => {
        try {

            const res = await api.get("/products");

            dispatch({
                type: ACTIONS.SET_PRODUCTS,
                payload: res.data
            });

        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
        }
    };

    // 🔥 USE EFFECT PRODUTOS
    useEffect(() => {
        loadProducts();
    }, []);

    // 🔥 USE EFFECT SETORES (se ainda estiver usando)
    useEffect(() => {
        const loadSectors = async () => {
            try {
                const res = await api.get('/stock-sectors');
                setSectors(res.data);
            } catch (err) {
                console.error("Erro ao carregar setores:", err);
            }
        };

        loadSectors();
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
        return sum + (Number(p.unitPrice) * Number(p.quantity));
    }, 0);
    const categories = state.categories || [];

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
                : filterType === "PRODUCTION"
                    ? !!p.Recipe
                    : !p.Recipe;

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

            setProductSuppliers(result.data || []);
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
            unitPrice: p.unitPrice,
            quantity: p.quantity,
            minQuantity: p.minQuantity,
            supplierId: p.supplierId || '',
            sectorId: p.sectorId || '',
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

            setProductSuppliers(updated.data);

            setSelectedSupplier("");
            setSupplierPrice("");

        } catch (err) {

            console.error(err);

        }

    };



    const handleSubmit = async () => {

        console.log("handleSubmit disparou");

        if (!validate()) return;

        const payload = {
            ...form,
            unitPrice: 0,
            quantity: Number(form.quantity || 0),
            minQuantity: Number(form.minQuantity || 0),
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

        await dispatch({
            type: ACTIONS.UPDATE_PRODUCT_QUANTITY,
            payload: { id: qtyModal.id, quantity: Number(qtyValue) },
        });

        toast.success("Estoque atualizado");

        setQtyModal(null);
        setQtyValue('');

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

            setProductSuppliers(updated.data);

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
                <FilterSelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">Todas as categorias</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </FilterSelect>
                <FilterSelect value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
                    <option value="all">Todos os estoques</option>
                    <option value="low">Abaixo do mínimo</option>
                    <option value="ok">Estoque adequado</option>
                </FilterSelect>
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

                                    <Td>{formatCurrency(bestPrice * p.quantity)}</Td>
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
                                            <Td>{bestPrice ? formatCurrency(bestPrice) : "-"}</Td>
                                            <Td style={{ color: isLow ? '#413232ff' : 'inherit', fontWeight: isLow ? 700 : 400 }}>
                                                {p.quantity}
                                            </Td>
                                            <Td>{p.minQuantity}</Td>

                                            <Td>
                                                {p.suppliers?.length ? (
                                                    <span>{p.suppliers.length}</span>
                                                ) : (
                                                    <Badge variant="warning">
                                                        <MdWarning style={{ marginRight: 4 }} />
                                                        Sem fornecedor
                                                    </Badge>
                                                )}
                                            </Td>

                                            <Td>
                                                {p.productSuppliers && p.productSuppliers.length > 0
                                                    ? formatCurrency(
                                                        Math.min(...p.productSuppliers.map(s => Number(s.price)))
                                                    )
                                                    : "-"}
                                            </Td>

                                            <Td>{formatCurrency(p.unitPrice * p.quantity)}</Td>
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
                                                        onClick={() => { setQtyModal(p); setQtyValue(String(p.quantity)); }}
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

                        <Button onClick={handleSubmit}>
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
                    <Select label="Tipo de Produto *" {...field('type')}>
                        <option value="INVENTORY">Insumo / Estoque</option>
                        <option value="PRODUCTION">Produto de Produção</option>
                    </Select>

                    <Select label="Categoria *" {...field('categoryId')}>
                        <option value="">-- Selecione uma categoria --</option>

                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </Select>

                    <Select label="Unidade de Compra" {...field('unit')}>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </Select>

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
                                <Select label="Fornecedor Vinculado" {...field('supplierId')}>
                                    <option value="">-- Selecione um fornecedor --</option>

                                    {state.suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </Select>
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
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                >

                    <option value="">Selecionar fornecedor</option>

                    {availableSuppliers.map((s) => (

                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>

                    ))}

                </Select>

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
