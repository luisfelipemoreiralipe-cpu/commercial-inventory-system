const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const migrationName = '20260429224355_add_transfer_costs';
const expectedOldChecksum = '79662c72361b3c9f78c9a3d5efbfbecaacf89ac5156baabfbbc77bca0e62eefd';
const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', migrationName, 'migration.sql');

async function main() {
    const sql = fs.readFileSync(migrationPath);
    const replacementChecksum = crypto.createHash('sha256').update(sql).digest('hex');

    await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw`
            SELECT id, migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
            FROM "_prisma_migrations"
            WHERE migration_name = ${migrationName}
            FOR UPDATE
        `;

        if (rows.length !== 1) {
            throw new Error(`Esperado exatamente um registro para ${migrationName}; encontrado: ${rows.length}.`);
        }

        const row = rows[0];
        if (row.checksum !== expectedOldChecksum) {
            throw new Error(`Checksum atual divergente. Esperado ${expectedOldChecksum}; encontrado ${row.checksum}.`);
        }
        if (!row.finished_at || row.rolled_back_at || Number(row.applied_steps_count) !== 1) {
            throw new Error('A migração histórica não está marcada como concluída e íntegra.');
        }

        const updated = await tx.$executeRaw`
            UPDATE "_prisma_migrations"
            SET checksum = ${replacementChecksum}
            WHERE id = ${row.id}
              AND checksum = ${expectedOldChecksum}
        `;

        if (updated !== 1) throw new Error('O registro mudou durante o reparo; operação cancelada.');
    });

    console.log(JSON.stringify({ migrationName, oldChecksum: expectedOldChecksum, replacementChecksum, repaired: true }, null, 2));
}

main()
    .catch(error => { console.error(error); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
