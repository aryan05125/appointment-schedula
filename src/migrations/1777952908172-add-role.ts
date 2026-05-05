import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRole1777952908172 implements MigrationInterface {
    name = 'AddRole1777952908172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient" ADD "role" character varying NOT NULL DEFAULT 'patient'`);
        await queryRunner.query(`ALTER TABLE "patient" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "patient" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP COLUMN "role"`);
    }

}
