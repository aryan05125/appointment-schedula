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

  // 🔥 Hospital support (multi-doctor system)
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

  // 🔥 Max Appointments Per Day
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

  // 🔥 Priority (for fallback doctor selection)
  @Column({ default: 1 })
  priority: number;

  // 🔥 Experience (optional)
  @Column({ nullable: true })
  experience: number;

  // 🔥 Consultation Fees
  @Column({ nullable: true })
  fees: number;

  // ===============================
  // 🔥 NEW: DOCTOR ADDRESS DETAILS
  // ===============================

  // Clinic / Hospital Name
  @Column({ nullable: true })
  clinicName: string;

  // Full Address Line
  @Column({ nullable: true })
  addressLine: string;

  // City
  @Column({ nullable: true })
  city: string;

  // State
  @Column({ nullable: true })
  state: string;

  // Pincode
  @Column({ nullable: true })
  pincode: string;
}