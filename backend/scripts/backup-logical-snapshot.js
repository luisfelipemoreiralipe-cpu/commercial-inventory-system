const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../src/utils/prisma');

const outputPath = process.argv[2];

if (!outputPath) {
    console.error('Uso: node scripts/backup-logical-snapshot.js <arquivo.json>');
    process.exitCode = 1;
} else {
    createSnapshot(outputPath)
        .catch(error => {
            console.error(error.message);
            process.exitCode = 1;
        })
        .finally(() => prisma.$disconnect());
}

const quoteIdentifier = value => `"${String(value).replace(/"/g, '""')}"`;

const jsonReplacer = (_key, value) => {
    if (typeof value === 'bigint') return { $type: 'bigint', value: value.toString() };
    if (Buffer.isBuffer(value)) return { $type: 'buffer', value: value.toString('base64') };
    if (value && value.constructor?.name === 'Decimal') {
        return { $type: 'decimal', value: value.toString() };
    }
    return value;
};

async function createSnapshot(target) {
    const absoluteTarget = path.resolve(target);
    fs.mkdirSync(path.dirname(absoluteTarget), { recursive: true });

    const snapshot = await prisma.$transaction(async tx => {
        await tx.$executeRawUnsafe('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');

        const server = await tx.$queryRawUnsafe(`
            SELECT current_database() AS database_name,
                   current_schema() AS schema_name,
                   version() AS server_version,
                   transaction_timestamp() AS snapshot_time
        `);

        const tables = await tx.$queryRawUnsafe(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        const columns = await tx.$queryRawUnsafe(`
            SELECT table_name, column_name, ordinal_position, data_type,
                   udt_name, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);

        const constraints = await tx.$queryRawUnsafe(`
            SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
                   kcu.column_name, ccu.table_name AS foreign_table_name,
                   ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage ccu
              ON tc.constraint_name = ccu.constraint_name
             AND tc.table_schema = ccu.table_schema
            WHERE tc.table_schema = 'public'
            ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
        `);

        const data = {};
        const counts = {};

        for (const { table_name: tableName } of tables) {
            const safeTable = quoteIdentifier(tableName);
            const rows = await tx.$queryRawUnsafe(`SELECT * FROM ${safeTable}`);
            data[tableName] = rows;
            counts[tableName] = rows.length;
        }

        return {
            format: 'commercial-logical-snapshot-v1',
            readOnlyTransaction: true,
            server: server[0],
            counts,
            schema: { columns, constraints },
            data
        };
    }, { maxWait: 15000, timeout: 120000 });

    const json = JSON.stringify(snapshot, jsonReplacer, 2);
    fs.writeFileSync(absoluteTarget, json, { encoding: 'utf8', flag: 'wx' });

    const hash = crypto.createHash('sha256').update(json).digest('hex');
    const manifest = {
        file: path.basename(absoluteTarget),
        bytes: Buffer.byteLength(json),
        sha256: hash,
        tables: Object.keys(snapshot.data).length,
        rows: Object.values(snapshot.counts).reduce((sum, count) => sum + count, 0),
        createdAt: new Date().toISOString(),
        database: snapshot.server.database_name,
        schema: snapshot.server.schema_name,
        serverVersion: snapshot.server.server_version
    };

    fs.writeFileSync(`${absoluteTarget}.manifest.json`, JSON.stringify(manifest, null, 2), {
        encoding: 'utf8',
        flag: 'wx'
    });

    console.log(JSON.stringify(manifest, null, 2));
}
