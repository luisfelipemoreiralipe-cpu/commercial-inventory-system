import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Select from '../components/Select';

export default function Users() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const loadUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res || []);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);

            // 🔥 tratamento de permissão
            if (err.response?.status === 403) {
                alert('Você não tem permissão para visualizar usuários');
            }

            // 🔥 fallback para não quebrar UI
            setUsers([]);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div>
            <h1>Usuários</h1>

            <Button onClick={() => setShowCreateModal(true)}>
                + Criar Usuário
            </Button>

            {/* MODAL CRIAR */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Criar Usuário"
            >
                <CreateUserForm
                    onClose={() => setShowCreateModal(false)}
                    onCreated={loadUsers}
                />
            </Modal>

            {/* MODAL EDITAR */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Usuário"
            >
                {selectedUser && (
                    <EditUserForm
                        user={selectedUser}
                        onClose={() => setShowEditModal(false)}
                        onUpdated={loadUsers}
                    />
                )}
            </Modal>

            {/* LISTA */}
            <div style={{ marginTop: 20 }}>
                {users.map(user => (
                    <div
                        key={user.id}
                        style={{
                            padding: 12,
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span>{user.nome}</span>
                        <span>{user.email}</span>
                        <span>{user.role}</span>

                        <Button
                            onClick={() => {
                                setSelectedUser(user);
                                setShowEditModal(true);
                            }}
                        >
                            Editar
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ========================= */
/* CREATE USER */
/* ========================= */

function CreateUserForm({ onClose, onCreated }) {
    const [form, setForm] = useState({
        nome: '',
        email: '',
        senha: '',
        role: 'STOCK_COUNTER'
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {
            await api.post('/users', {
                ...form,
                establishmentIds: [
                    localStorage.getItem('establishmentId')
                ]
            });

            onCreated(); // atualiza lista
            onClose();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar usuário');
        }
    };

    return (
        <div style={containerStyle}>
            <div style={formStyle}>
                <input
                    name="nome"
                    placeholder="Nome do usuário"
                    onChange={handleChange}
                    style={inputStyle}
                />

                <input
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    style={inputStyle}
                />

                <input
                    name="senha"
                    type="password"
                    placeholder="Senha"
                    onChange={handleChange}
                    style={inputStyle}
                />

                <Select
                    value={form.role}
                    onChange={(value) =>
                        setForm({
                            ...form,
                            role: value
                        })
                    }
                    options={[
                        { label: 'Administrador', value: 'ADMIN' },
                        { label: 'Operador de Estoque', value: 'STOCK_COUNTER' }
                    ]}
                />
            </div>

            <div style={footerStyle}>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Criar usuário</Button>
            </div>
        </div>
    );
}

/* ========================= */
/* EDIT USER */
/* ========================= */

function EditUserForm({ user, onClose, onUpdated }) {
    const [form, setForm] = useState({
        nome: user.nome,
        email: user.email,
        role: user.role
    });

    const handleSubmit = async () => {
        try {
            await api.put(`/users/${user.id}`, form);

            onUpdated(); // atualiza lista
            onClose();
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar usuário');
        }
    };

    return (
        <div style={containerStyle}>
            <div style={formStyle}>
                <input
                    value={form.nome}
                    onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                    }
                    style={inputStyle}
                />

                <input
                    value={form.email}
                    onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                    }
                    style={inputStyle}
                />

                <Select
                    value={form.role}
                    onChange={(value) =>
                        setForm({ ...form, role: value })
                    }
                    options={[
                        { label: 'Administrador', value: 'ADMIN' },
                        { label: 'Operador de Estoque', value: 'STOCK_COUNTER' }
                    ]}
                />
            </div>

            <div style={footerStyle}>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit}>Salvar</Button>
            </div>
        </div>
    );
}

/* ========================= */
/* STYLES */
/* ========================= */

const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
};

const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10
};

const inputStyle = {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    fontSize: 14
};