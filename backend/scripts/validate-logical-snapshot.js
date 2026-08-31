const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const inputPath = process.argv[2];

if (!inputPath) {
    console.error('Uso: node scripts/validate-logical-snapshot.js <arquivo.json>');
    process.exitCode = 1;
} else {
    validate(inputPath);
}

function validate(target) {
    const absoluteTarget = path.resolve(target);
    const content = fs.readFileSync(absoluteTarget, 'utf8');
    const manifest = JSON.parse(fs.readFileSync(`${absoluteTarget}.manifest.json`, 'utf8'));
    const snapshot = JSON.parse(content);
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    if (snapshot.format !== 'commercial-logical-snapshot-v1') throw new Error('Formato inválido.');
    if (!snapshot.readOnlyTransaction) throw new Error('Snapshot sem marca de transação somente leitura.');
    if (hash !== manifest.sha256) throw new Error('SHA-256 divergente.');
    if (Buffer.byteLength(content) !== manifest.bytes) throw new Error('Tamanho divergente.');

    const tableNames = Object.keys(snapshot.data);
    let rows = 0;
    for (const tableName of tableNames) {
        const actual = snapshot.data[tableName].length;
        if (actual !== snapshot.counts[tableName]) {
            throw new Error(`Contagem divergente na tabela ${tableName}.`);
        }
        rows += actual;
    }

    if (tableNames.length !== manifest.tables || rows !== manifest.rows) {
        throw new Error('Totais do manifesto divergentes.');
    }

    console.log(JSON.stringify({
        valid: true,
        sha256: hash,
        bytes: manifest.bytes,
        tables: tableNames.length,
        rows
    }, null, 2));
}
