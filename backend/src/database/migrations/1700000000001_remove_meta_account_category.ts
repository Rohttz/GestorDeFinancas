import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class RemoveMetaAccountCategory1700000000001 implements MigrationInterface {
  name = 'RemoveMetaAccountCategory1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('metas');
    if (!table) {
      return;
    }

    const accountFk = table.foreignKeys.find((fk) => fk.columnNames.includes('accountId'));
    if (accountFk) {
      await queryRunner.dropForeignKey('metas', accountFk);
    }

    const categoryFk = table.foreignKeys.find((fk) => fk.columnNames.includes('categoryId'));
    if (categoryFk) {
      await queryRunner.dropForeignKey('metas', categoryFk);
    }

    if (table.findColumnByName('accountId')) {
      await queryRunner.dropColumn('metas', 'accountId');
    }

    if (table.findColumnByName('categoryId')) {
      await queryRunner.dropColumn('metas', 'categoryId');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const accountColumn = new TableColumn({
      name: 'accountId',
      type: 'uuid',
    });
    const categoryColumn = new TableColumn({
      name: 'categoryId',
      type: 'uuid',
    });

    const table = await queryRunner.getTable('metas');
    if (!table?.findColumnByName('accountId')) {
      await queryRunner.addColumn('metas', accountColumn);
    }
    if (!table?.findColumnByName('categoryId')) {
      await queryRunner.addColumn('metas', categoryColumn);
    }

    await queryRunner.createForeignKeys('metas', [
      new TableForeignKey({
        columnNames: ['accountId'],
        referencedTableName: 'contas',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedTableName: 'categorias',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
  }
}
