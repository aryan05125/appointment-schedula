import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  // 🔥 RELATION: Doctor
  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column()
  doctorId: number;

  // 🔥 RELATION: Patient
  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  patientId: number;

  // 🔹 Appointment Date
  @Column()
  date: string;

  // 🔹 Time Slot
  @Column()
  timeSlot: string;

  // 🔥 Status
  @Column({ default: 'confirmed' })
  status: string; // confirmed | cancelled | rescheduled

  // 🔥 Previous tracking
  @Column({ nullable: true })
  previousDate: string;

  @Column({ nullable: true })
  previousTimeSlot: string;

  // 🔥 Reason
  @Column({ nullable: true })
  reason: string;

  // 🔥 Who cancelled
  @Column({ nullable: true })
  cancelledBy: string;

  // 🔥 Active flag
  @Column({ default: true })
  isActive: boolean;

  // 🔹 Created
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // 🔥 Updated
  @Column({
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}