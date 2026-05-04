import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from '../appointment/appointment.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private repo: Repository<Doctor>,

    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  // ✅ CREATE DOCTOR
  async create(dto: any) {
    const slots = this.generateSlots(
      dto.startTime,
      dto.endTime,
      dto.slotDuration,
      dto.bufferTime || 0,
    );

    const doctor = this.repo.create({
      ...dto,
      availableSlots: slots,
    });

    return this.repo.save(doctor);
  }

  // ✅ GET ALL DOCTORS
  async findAll(filters?: {
    specialization?: string;
    hospitalId?: number;
  }) {
    const query: any = {
      isActive: true,
    };

    if (filters?.specialization) {
      query.specialization = filters.specialization;
    }

    if (filters?.hospitalId) {
      query.hospitalId = filters.hospitalId;
    }

    return this.repo.find({
      where: query,
      order: {
        priority: 'ASC',
      },
    });
  }

  // 🔥 GET DOCTORS BY SPECIALIZATION
  async findBySpecialization(specialization: string) {
    return this.repo.find({
      where: {
        specialization,
        isActive: true,
      },
      order: {
        priority: 'ASC',
      },
    });
  }

  // ✅ GET SINGLE DOCTOR
  async findOne(id: number) {
    const doctor = await this.repo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  // 🔥 NEW: GET DOCTOR ADDRESS
  async getDoctorAddress(id: number) {
    const doctor = await this.findOne(id);

    return {
      name: doctor.name,
      clinicName: doctor.clinicName,
      addressLine: doctor.addressLine,
      city: doctor.city,
      state: doctor.state,
      pincode: doctor.pincode,
    };
  }

  // 🔥 MARK DOCTOR LEAVE
  async markDoctorLeave(id: number, date: string) {
    const doctor = await this.findOne(id);

    const leaveDates = doctor.leaveDates || [];

    if (!leaveDates.includes(date)) {
      leaveDates.push(date);
    }

    doctor.leaveDates = leaveDates;

    await this.repo.save(doctor);

    await this.handleAppointmentsOnLeave(doctor, date);

    return {
      message: 'Doctor leave marked and appointments handled',
    };
  }

  // 🔥 FULL LEAVE
  async toggleFullLeave(id: number, status: boolean) {
    const doctor = await this.findOne(id);

    doctor.isOnLeave = status;
    await this.repo.save(doctor);

    if (status) {
      const today = new Date().toISOString().split('T')[0];
      await this.handleAppointmentsOnLeave(doctor, today);
    }

    return { message: 'Doctor leave updated' };
  }

  // 🔥 HANDLE APPOINTMENTS
  private async handleAppointmentsOnLeave(
    doctor: Doctor,
    date: string,
  ) {
    const appointments = await this.appointmentRepo.find({
      where: {
        doctorId: doctor.id,
        date,
        status: 'confirmed',
      },
    });

    for (const appt of appointments) {
      const fallbackDoctor = await this.findFallbackDoctor(
        doctor,
        date,
        appt.timeSlot,
      );

      if (fallbackDoctor) {
        appt.doctorId = fallbackDoctor.id;
        appt.status = 'rescheduled';
      } else {
        const nextDate = this.getNextDate(date);
        appt.date = nextDate;
        appt.status = 'rescheduled';
      }

      await this.appointmentRepo.save(appt);
    }
  }

  // 🔥 FIND FALLBACK DOCTOR
  private async findFallbackDoctor(
    doctor: Doctor,
    date: string,
    slot: string,
  ) {
    const doctors = await this.repo.find({
      where: {
        hospitalId: doctor.hospitalId,
        specialization: doctor.specialization,
        isActive: true,
        id: Not(doctor.id),
      },
      order: {
        priority: 'ASC',
      },
    });

    for (const d of doctors) {
      const available = await this.getAvailableSlots(d.id, date);

      if (available.slots.includes(slot)) {
        return d;
      }
    }

    return null;
  }

  // 🔥 AVAILABLE SLOTS
  async getAvailableSlots(id: number, date: string) {
    const doctor = await this.findOne(id);

    if (!doctor.isActive) {
      return { message: 'Doctor inactive', slots: [] };
    }

    if (doctor.isOnLeave) {
      return { message: 'Doctor on leave', slots: [] };
    }

    if (doctor.leaveDates?.includes(date)) {
      return { message: 'Doctor on leave for this date', slots: [] };
    }

    const dayName = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (!doctor.workingDays.includes(dayName)) {
      return { message: 'Doctor not working', slots: [] };
    }

    const allSlots = doctor.availableSlots || [];

    const booked = await this.appointmentRepo.find({
      where: {
        doctorId: id,
        date,
        status: 'confirmed',
      },
    });

    const bookedSlots = booked.map((b) => b.timeSlot);

    let freeSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot),
    );

    if (
      doctor.maxAppointmentsPerDay &&
      booked.length >= doctor.maxAppointmentsPerDay
    ) {
      freeSlots = [];
    }

    return {
      message: 'Available slots',
      slots: freeSlots,
    };
  }

  // 🔥 SLOT GENERATOR
  private generateSlots(
    startTime: string,
    endTime: string,
    duration: number,
    buffer: number,
  ): string[] {
    const slots: string[] = [];

    let [hour, minute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    while (
      hour < endHour ||
      (hour === endHour && minute < endMinute)
    ) {
      const formatted = `${String(hour).padStart(2, '0')}:${String(
        minute,
      ).padStart(2, '0')}`;

      slots.push(formatted);

      minute += duration + buffer;

      if (minute >= 60) {
        hour += Math.floor(minute / 60);
        minute = minute % 60;
      }
    }

    return slots;
  }

  // 🔥 NEXT DATE
  private getNextDate(date: string): string {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
}