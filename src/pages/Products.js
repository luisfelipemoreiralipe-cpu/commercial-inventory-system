import React, { useState } from 'react';
import styled from 'styled-components';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdEdit as MdQty } from 'react-icons/md';
import { useApp, ACTIONS } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Input, Select } from '../components/FormFields';

// ─── Constants ─────────────────────────────────────────────────────────────────
const UNITS = ['unidade', 'kg', 'litro', 'caixa', 'pacote', 'saco', 'rolo', 'metro', 'pç'];
const EMPTY_FORM = {
    name: '',
    categoryId: '',
    unit: 'unidade',
    unitPrice: '',
    quantity: '',
    minQuantity: '',
    supplierId: '',
};

// ─── Styled ────────────────────────────────────────────────────────────────────
const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
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
  gap: 8px;
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 14px;
  flex: 1;
  min-width: 200px;
  transition: ${({ theme }) => theme.transition};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.borderFocus};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryGlow};
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
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: 9px 12px;
  outline: none;
  cursor: pointer;
  transition: ${({ theme }) => theme.transition};
  &:focus { border-color: ${({ theme }) => theme.colors.borderFocus}; }
  option { background: ${({ theme }) => theme.colors.bgCard}; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  background: ${({ lowStock, theme }) => lowStock ? 'rgba(239,68,68,0.05)' : 'transparent'};
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:last-child td { border-bottom: none; }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const IconBtn = styled.button`
  background: ${({ theme }) => theme.colors.bgInput};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme, color }) => theme.colors[color] || theme.colors.textSecondary};
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme, color }) =>
        color === 'danger' ? theme.colors.dangerLight :
            color === 'warning' ? theme.colors.warningLight :
                theme.colors.bgHover};
    color: ${({ theme, color }) => theme.colors[color] || theme.colors.textPrimary};
    border-color: ${({ theme, color }) => theme.colors[color] || theme.colors.border};
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

    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStock, setFilterStock] = useState('all');

    const [modalOpen, setModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null);
    const [qtyModal, setQtyModal] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [qtyValue, setQtyValue] = useState('');
    const [errors, setErrors] = useState({});

    // Derived
    const categories = state.categories || [];

    const filtered = state.products.filter((p) => {
        const matchSearch =
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.name?.toLowerCase().includes(search.toLowerCase());
        const matchCat = !filterCategory || p.categoryId === filterCategory;
        const matchStock =
            filterStock === 'all' ? true :
                filterStock === 'low' ? Number(p.quantity) < Number(p.minQuantity) :
                    Number(p.quantity) >= Number(p.minQuantity);
        return matchSearch && matchCat && matchStock;
    });

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Campo obrigatório';
        if (!form.categoryId) e.categoryId = 'Campo obrigatório';
        if (!form.unitPrice || isNaN(form.unitPrice) || Number(form.unitPrice) < 0) e.unitPrice = 'Preço inválido';
        if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) < 0) e.quantity = 'Qtd. inválida';
        if (!form.minQuantity || isNaN(form.minQuantity) || Number(form.minQuantity) < 0) e.minQuantity = 'Qtd. mínima inválida';
        setErrors(e);
        return Object.keys(e).length === 0;
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
        });
        setErrors({});
        setModalOpen(true);
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const payload = {
            ...form,
            unitPrice: Number(form.unitPrice),
            quantity: Number(form.quantity),
            minQuantity: Number(form.minQuantity),
        };
        if (editTarget) {
            dispatch({ type: ACTIONS.UPDATE_PRODUCT, payload: { ...payload, id: editTarget.id } });
        } else {
            dispatch({ type: ACTIONS.ADD_PRODUCT, payload });
        }
        setModalOpen(false);
    };

    const handleDelete = () => {
        dispatch({ type: ACTIONS.DELETE_PRODUCT, payload: deleteModal.id });
        setDeleteModal(null);
    };

    const handleQtyUpdate = () => {
        if (qtyValue === '' || isNaN(qtyValue) || Number(qtyValue) < 0) return;
        dispatch({
            type: ACTIONS.UPDATE_PRODUCT_QUANTITY,
            payload: { id: qtyModal.id, quantity: Number(qtyValue) },
        });
        setQtyModal(null);
        setQtyValue('');
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

            {/* Filters */}
            <SearchRow>
                <SearchBox>
                    <MdSearch color="#1937cdff" />
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
                                    <Th>Preço Unit.</Th>
                                    <Th>Qtd.</Th>
                                    <Th>Mín.</Th>
                                    <Th>Valor Total</Th>
                                    <Th>Status</Th>
                                    <Th>Ações</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => {
                                    const isLow = Number(p.quantity) < Number(p.minQuantity);
                                    return (
                                        <Tr key={p.id} lowStock={isLow}>
                                            <Td>
                                                <strong>{p.name}</strong>
                                                <DateMeta>
                                                    Criado: {new Date(p.createdAt).toLocaleDateString('pt-BR')}<br />
                                                    Atualizado: {new Date(p.updatedAt).toLocaleDateString('pt-BR')}
                                                </DateMeta>
                                            </Td>
                                            <Td>{p.category?.name || 'N/A'}</Td>
                                            <Td>{p.unit}</Td>
                                            <Td>{formatCurrency(p.unitPrice)}</Td>
                                            <Td style={{ color: isLow ? '#ef4444' : 'inherit', fontWeight: isLow ? 700 : 400 }}>
                                                {p.quantity}
                                            </Td>
                                            <Td>{p.minQuantity}</Td>
                                            <Td>{formatCurrency(p.unitPrice * p.quantity)}</Td>
                                            <Td>
                                                {isLow ? (
                                                    <Badge variant="danger">⚠ Baixo</Badge>
                                                ) : (
                                                    <Badge variant="success">✓ OK</Badge>
                                                )}
                                            </Td>
                                            <Td>
                                                <ActionRow>
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
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>{editTarget ? 'Salvar' : 'Criar Produto'}</Button>
                    </>
                }
            >
                <FormGrid>
                    <FormFull>
                        <Input label="Nome do Produto *" placeholder="Ex: Farinha de Trigo" {...field('name')} />
                    </FormFull>
                    <Select label="Categoria *" {...field('categoryId')}>
                        <option value="">-- Selecione uma categoria --</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                    <Select label="Unidade de Compra" {...field('unit')}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </Select>
                    <Input label="Preço Unitário (R$) *" type="number" min="0" step="0.01" placeholder="0,00" {...field('unitPrice')} />
                    <Input label="Qtd. em Estoque *" type="number" min="0" placeholder="0" {...field('quantity')} />
                    <Input label="Qtd. Mínima *" type="number" min="0" placeholder="0" {...field('minQuantity')} />
                    <FormFull>
                        <Select label="Fornecedor Vinculado" {...field('supplierId')}>
                            <option value="">-- Selecione um fornecedor --</option>
                            {state.suppliers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </Select>
                    </FormFull>
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
        </>
    );
};

export default Products;
