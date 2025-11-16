import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateBundles1731440000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bundles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'isPromo',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'bundle_cosmetics',
        columns: [
          {
            name: 'bundle_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'cosmetic_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'bundle_cosmetics',
      new TableForeignKey({
        name: 'FK_bundle_cosmetics_bundle',
        columnNames: ['bundle_id'],
        referencedTableName: 'bundles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bundle_cosmetics',
      new TableForeignKey({
        name: 'FK_bundle_cosmetics_cosmetic',
        columnNames: ['cosmetic_id'],
        referencedTableName: 'cosmetics',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'bundle_cosmetics',
      'FK_bundle_cosmetics_bundle',
    );
    await queryRunner.dropForeignKey(
      'bundle_cosmetics',
      'FK_bundle_cosmetics_cosmetic',
    );

    await queryRunner.dropTable('bundle_cosmetics');

    await queryRunner.dropTable('bundles');
  }
}
