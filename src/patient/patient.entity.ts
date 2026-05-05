import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  // 🔥 LOGIN (unique identifier)
  @Column({ unique: true })
  phone: string;

  // 🔐 PASSWORD (hidden by default)
  @Column({ select: false })
  password: string;

  // 🔹 Basic info
  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  reason: string;

  // 🔥 ROLE (for role-based auth)
  @Column({ default: 'patient' })
  role: string; // 'admin' | 'patient'

  // 🔥 ACTIVE FLAG
  @Column({ default: true })
  isActive: boolean;

  // 🔥 CREATED TIME (audit)
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // 🔥 UPDATED TIME
  @Column({
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}