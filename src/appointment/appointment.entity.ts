import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column()
  patientId: number;

  // 🔥 Date of appointment
  @Column()
  date: string;

  // 🔥 Token system (queue)
  @Column()
  tokenNumber: number;

  // 🔥 Reporting time (calculated)
  @Column()
  reportingTime: string;

  // 🔥 NEW: Status handling (important for future)
  @Column({ default: 'confirmed' })
  status: string; 
  // values: confirmed | cancelled | rescheduled

  // 🔥 OPTIONAL (strong for real-world + future features)
  @Column({ nullable: true })
  reason: string; // patient reason (optional)

  // 🔥 OPTIONAL (audit / debugging / real system)
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}