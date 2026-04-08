const fs = require('fs');
const csv = require('csv-parser');

const inputFile = 'vendas_pdv.csv';
const outputFile = 'vendas_limpas.csv';

let processedCount = 0;

console.log('🚀 Iniciando processo de ETL: transformSales.js');

const writeStream = fs.createWriteStream(outputFile);
writeStream.write('Produto,Quantidade\n');

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    
    // Captura as colunas requeridas (Produto e Qtd)
    const rawProduto = row['Produto'];
    const rawQtd = row['Qtd'];

    if (rawProduto && rawQtd) {
        const produto = rawProduto.trim();
        const quantidade = rawQtd.trim();

        if (produto !== '' && quantidade !== '') {
            writeStream.write(`${produto},${quantidade}\n`);
            processedCount++;
        }
    }
  })
  .on('end', () => {
    writeStream.end();
    console.log(`✅ Sucesso! Processo concluído.`);
    console.log(`📦 Foram processadas ${processedCount} linhas de vendas prontas para a logística.`);
  })
  .on('error', (err) => {
    console.error(`❌ Erro ao ler o arquivo CSV: ${err.message}`);
  });
