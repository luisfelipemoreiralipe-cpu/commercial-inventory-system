import { useEffect, useState } from "react";
import { getProducts, getSupplierComparison } from "../services/productService";

export default function PriceComparison() {

    const [products, setProducts] = useState([]);
    const [productId, setProductId] = useState("");
    const [comparison, setComparison] = useState([]);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        const data = await getProducts();
        setProducts(data);
    }

    async function handleSelect(e) {
        const id = e.target.value;
        setProductId(id);

        const result = await getSupplierComparison(id);
        setComparison(result.suppliers);
    }

    return (
        <div>

            <h1>Comparação de fornecedores</h1>

            <select onChange={handleSelect}>
                <option>Selecione um produto</option>
                {products.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                ))}
            </select>

            <table>
                <thead>
                    <tr>
                        <th>Fornecedor</th>
                        <th>Melhor preço</th>
                    </tr>
                </thead>

                <tbody>
                    {comparison.map((s, i) => (
                        <tr key={i}>
                            <td>{s.supplier}</td>
                            <td>R$ {s.bestPrice}</td>
                        </tr>
                    ))}
                </tbody>

            </table>

        </div>
    );
}