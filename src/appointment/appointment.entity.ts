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