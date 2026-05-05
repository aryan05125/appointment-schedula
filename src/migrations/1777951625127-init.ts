import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1777951625127 implements MigrationInterface {
    name = 'Init1777951625127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "patient" ("id" SERIAL NOT NULL, "phone" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying, "reason" character varying, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_62a22cef7d3cb875be95ffee3af" UNIQUE ("phone"), CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doctor" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "specialization" character varying NOT NULL DEFAULT 'General', "hospitalId" integer, "workingDays" text NOT NULL, "startTime" character varying NOT NULL, "endTime" character varying NOT NULL, "slotDuration" integer NOT NULL, "availableSlots" text, "leaveDates" text, "isOnLeave" boolean NOT NULL DEFAULT false, "maxAppointmentsPerDay" integer, "isActive" boolean NOT NULL DEFAULT true, "autoRescheduleOnLeave" boolean NOT NULL DEFAULT true, "bufferTime" integer, "priority" integer NOT NULL DEFAULT '1', "experience" integer, "fees" integer, "clinicName" character varying, "addressLine" character varying, "city" character varying, "state" character varying, "pincode" character varying, CONSTRAINT "PK_ee6bf6c8de78803212c548fcb94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "appointment" ("id" SERIAL NOT NULL, "doctorId" integer NOT NULL, "patientId" integer NOT NULL, "date" character varying NOT NULL, "timeSlot" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'confirmed', "previousDate" character varying, "previousTimeSlot" character varying, "reason" character varying, "cancelledBy" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e8be1a53027415e709ce8a2db74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2" FOREIGN KEY ("doctorId") REFERENCES "doctor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointment" ADD CONSTRAINT "FK_5ce4c3130796367c93cd817948e" FOREIGN KEY ("patientId") REFERENCES "patient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_5ce4c3130796367c93cd817948e"`);
        await queryRunner.query(`ALTER TABLE "appointment" DROP CONSTRAINT "FK_514bcc3fb1b8140f85bf1cde6e2"`);
        await queryRunner.query(`DROP TABLE "appointment"`);
        await queryRunner.query(`DROP TABLE "doctor"`);
        await queryRunner.query(`DROP TABLE "patient"`);
    }

}
