import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  @Column()
  date: string;

  @Column()
  tokenNumber: number;

  @Column()
  reportingTime: string;

  @Column({ default: 'confirmed' })
  status: string;
}