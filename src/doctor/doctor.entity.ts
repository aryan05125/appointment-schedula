import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 🔹 Specialization (Cardio, Dental, etc.)
  @Column({ default: 'General' })
  specialization: string;

  // 🔥 NEW: Hospital support (multi-doctor system)
  @Column({ nullable: true })
  hospitalId: number;

  // 🔹 Working Days
  @Column('simple-array')
  workingDays: string[]; // ["Monday","Tuesday",...]

  // 🔹 Consulting Start Time
  @Column()
  startTime: string; // "09:00"

  // 🔹 Consulting End Time
  @Column()
  endTime: string; // "17:00"

  // 🔹 Slot Duration (minutes)
  @Column()
  slotDuration: number; // 15, 30 etc.

  // 🔥 OPTIONAL: Predefined Slots (manual override)
  @Column('simple-array', { nullable: true })
  availableSlots: string[];

  // 🔥 Doctor Leave Dates
  @Column('simple-array', { nullable: true })
  leaveDates: string[];

  // 🔥 Full Day Leave Toggle
  @Column({ default: false })
  isOnLeave: boolean;

  // 🔥 Max Appointments Per Day (IMPORTANT for limit logic)
  @Column({ nullable: true })
  maxAppointmentsPerDay: number;

  // 🔥 Doctor Active / Inactive
  @Column({ default: true })
  isActive: boolean;

  // 🔥 Auto reschedule when leave applied
  @Column({ default: true })
  autoRescheduleOnLeave: boolean;

  // 🔥 Buffer Time between slots
  @Column({ nullable: true })
  bufferTime: number;

  // 🔥 NEW: Priority (for fallback doctor selection)
  @Column({ default: 1 })
  priority: number;

  // 🔥 NEW: Experience (optional for sorting/filter)
  @Column({ nullable: true })
  experience: number; // years

  // 🔥 NEW: Consultation Fees (useful for real system)
  @Column({ nullable: true })
  fees: number;
}