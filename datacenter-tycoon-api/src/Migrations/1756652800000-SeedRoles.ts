import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedRoles1756652800000 implements MigrationInterface {
    name = 'SeedRoles1756652800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "rol" ("description", "enable") VALUES 
            ('ADMIN', true),
            ('USER', true)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "rol" WHERE "description" IN ('ADMIN', 'USER')
        `);
    }
}