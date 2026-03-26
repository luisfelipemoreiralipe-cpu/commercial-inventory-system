import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Input, Select } from "./FormFields";
import { formatCurrency } from "../utils/formatCurrency";
import api from "../services/api";

const RecipeModal = ({ product, isOpen, onClose, products }) => {

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [ingredientId, setIngredientId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [cost, setCost] = useState(0);

    useEffect(() => {

        if (!product?.id || !isOpen) return;

        loadRecipe(product.id);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id, isOpen]);

    const loadRecipe = async (productId) => {

        try {

            const recipeData = await api.get(`/recipes/product/${productId}`);

            setRecipe(recipeData);

            await loadCost(recipeData.id);

        } catch (err) {

            // receita ainda não existe
            if (err.message === "Receita não encontrada") {

                setRecipe(null);
                setIngredients([]);
                setCost(0);

            } else {

                console.error(err);
                alert(err.message || "Erro ao carregar ficha técnica.");

            }

        }

    };

    const loadCost = async (recipeId) => {

        try {

            const costData = await api.get(`/recipes/${recipeId}/cost`);

            setIngredients(costData.ingredients || []);
            setCost(costData.totalCost || 0);

        } catch (err) {

            console.error(err);

        }

    };

    const handleAddIngredient = async () => {

        if (!ingredientId || !quantity) return;

        try {

            let currentRecipe = recipe;

            if (!currentRecipe) {

                const newRecipe = await api.post("/recipes", {
                    productId: product.id
                });

                currentRecipe = newRecipe;
                setRecipe(newRecipe);

            } else {
                // 🔥 GARANTE QUE ESTÁ ATUALIZADO
                const freshRecipe = await api.get(`/recipes/product/${product.id}`);
                currentRecipe = freshRecipe;
                setRecipe(freshRecipe);
            }

            // cria recipe apenas quando adicionar primeiro ingrediente
            if (!currentRecipe) {

                const newRecipe = await api.post("/recipes", {
                    productId: product.id
                });

                currentRecipe = newRecipe;
                setRecipe(newRecipe);
            }

            // verifica se ingrediente já existe
            const existingIngredient = ingredients.find(
                (i) => i.productId === ingredientId
            );

            if (existingIngredient) {

                const newQuantity =
                    Number(existingIngredient.quantity) + Number(quantity);

                await api.put(`/recipes/items/${existingIngredient.id}`, {
                    quantity: newQuantity
                });

            } else {

                await api.post("/recipes/items", {
                    recipeId: currentRecipe.id,
                    productId: ingredientId,
                    quantity: Number(quantity)
                });

            }

            setIngredientId("");
            setQuantity("");

            await loadCost(currentRecipe.id);

        } catch (err) {

            console.error(err);
            alert(err.message || "Erro ao adicionar ingrediente.");

        }

    }

    const handleRemove = async (id) => {

        if (!recipe) return;

        try {

            await api.delete(`/recipes/items/${id}`);

            await loadRecipe(product.id);

        } catch (err) {

            console.error(err);
            alert(err.message || "Erro ao remover ingrediente.");

        }

    };

    return (

        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Ficha Técnica — ${product?.name}`}
            footer={<Button onClick={onClose}>Fechar</Button>}
        >

            <div style={{ marginBottom: 20 }}>

                <Select
                    label="Ingrediente"
                    value={ingredientId}
                    onChange={(e) => setIngredientId(e.target.value)}
                >

                    <option value="">Selecionar produto</option>

                    {products
                        .filter(p => p.id !== product?.id)
                        .map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}

                </Select>

                <Input
                    label="Quantidade"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />

                <Button
                    style={{ marginTop: 10 }}
                    onClick={handleAddIngredient}
                >
                    Adicionar Ingrediente
                </Button>

            </div>

            <table style={{ width: "100%" }}>
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Qtd</th>
                        <th>Un</th>
                        <th>Custo</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>

                    {ingredients.map((i) => (

                        <tr key={i.id}>

                            <td>{i.name}</td>
                            <td>{i.quantity}</td>
                            <td>{i.unit}</td>
                            <td>{formatCurrency(i.cost)}</td>

                            <td>

                                <Button
                                    variant="danger"
                                    onClick={() => handleRemove(i.id)}
                                >
                                    Remover
                                </Button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

            <div
                style={{
                    marginTop: 20,
                    fontWeight: 600,
                    fontSize: 18
                }}
            >
                Custo total: {formatCurrency(cost)}
            </div>

        </Modal>

    );

};

export default RecipeModal;