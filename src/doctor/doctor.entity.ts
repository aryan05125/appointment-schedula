import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 'General' })
  specialization: string;

  @Column("simple-array")
  workingDays: string[]; // ["Monday","Tuesday",...]

  @Column()
  startTime: string; // "09:00"

  @Column()
  endTime: string; // "17:00"

  @Column()
  slotDuration: number; // minutes
}