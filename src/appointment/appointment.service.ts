import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Appointment } from './appointment.entity';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  // 🔥 FUTURE LIMIT
  private checkFutureLimit(date: string) {
    const today = new Date();
    const selected = new Date(date);

    const diff =
      (selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    if (diff > 7) {
      throw new BadRequestException(
        'Booking allowed only for next 7 days',
      );
    }
  }

  // 🔥 FIND FALLBACK DOCTOR
  private async findFallbackDoctor(doctor: Doctor, date: string) {
    const fallback = await this.doctorRepo.findOne({
      where: {
        specialization: doctor.specialization,
        hospitalId: doctor.hospitalId,
        id: Not(doctor.id),
        isActive: true,
      },
    });

    if (!fallback) return null;

    // check fallback availability
    if (fallback.isOnLeave || fallback.leaveDates?.includes(date)) {
      return null;
    }

    return fallback;
  }

  // ✅ GET SLOTS
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const dayName = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (!doctor.workingDays.includes(dayName)) {
      return { message: 'Doctor not working', slots: [] };
    }

    if (doctor.isOnLeave || doctor.leaveDates?.includes(date)) {
      return { message: 'Doctor is on leave', slots: [] };
    }

    const allSlots = doctor.availableSlots || [];

    const booked = await this.repo.find({
      where: { doctorId, date, status: 'confirmed' },
    });

    if (
      doctor.maxAppointmentsPerDay &&
      booked.length >= doctor.maxAppointmentsPerDay
    ) {
      return { message: 'Max appointments reached', slots: [] };
    }

    const bookedSlots = booked.map((b) => b.timeSlot);

    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot),
    );

    return {
      totalSlots: allSlots.length,
      bookedSlots: booked.length,
      availableSlots: availableSlots.length,
      slots: availableSlots,
    };
  }

  // 🔥 BOOK WITH FALLBACK SUPPORT
  async book(dto: {
    doctorId: number;
    patientId: number;
    date: string;
    timeSlot?: string;
  }) {
    this.checkFutureLimit(dto.date);

    let doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
    });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId },
    });
    if (!patient) throw new BadRequestException('Patient not found');

    const dayName = new Date(dto.date).toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (!doctor.workingDays.includes(dayName)) {
      throw new BadRequestException('Doctor not working');
    }

    // 🔥 MAIN FIX → FALLBACK LOGIC
    if (doctor.isOnLeave || doctor.leaveDates?.includes(dto.date)) {
      const fallback = await this.findFallbackDoctor(doctor, dto.date);

      if (!fallback) {
        throw new BadRequestException('Doctor on leave');
      }

      doctor = fallback; // 🔥 switch doctor
    }

    // 🔥 AUTO SLOT
    if (!dto.timeSlot) {
      const slotsData = await this.getAvailableSlots(
        doctor.id,
        dto.date,
      );

      if (!slotsData.slots.length) {
        throw new BadRequestException('No slots available');
      }

      dto.timeSlot = slotsData.slots[0];
    }

    if (!doctor.availableSlots.includes(dto.timeSlot)) {
      throw new BadRequestException('Invalid slot');
    }

    // ❌ Slot already booked
    const existing = await this.repo.findOne({
      where: {
        doctorId: doctor.id,
        date: dto.date,
        timeSlot: dto.timeSlot,
        status: 'confirmed',
      },
    });

    if (existing) {
      throw new BadRequestException('Slot already booked');
    }

    // ❌ Same patient conflict
    const sameTime = await this.repo.findOne({
      where: {
        patientId: dto.patientId,
        date: dto.date,
        timeSlot: dto.timeSlot,
        status: 'confirmed',
      },
    });

    if (sameTime) {
      throw new BadRequestException('Same time conflict');
    }

    const appointment = this.repo.create({
      doctorId: doctor.id, // 🔥 important
      patientId: dto.patientId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      status: 'confirmed',
    });

    return {
      message:
        doctor.id === dto.doctorId
          ? 'Appointment booked'
          : 'Booked with fallback doctor',
      data: await this.repo.save(appointment),
    };
  }

  // 🔥 CANCEL
  async cancel(id: number, reason?: string) {
    const appt = await this.repo.findOne({ where: { id } });
    if (!appt) throw new BadRequestException('Appointment not found');

    appt.status = 'cancelled';
    appt.reason = reason || 'Cancelled by patient';
    appt.cancelledBy = 'patient';
    appt.isActive = false;

    return this.repo.save(appt);
  }

  // 🔥 RESCHEDULE
  async reschedule(
    id: number,
    body: { newDate: string; newTimeSlot?: string },
  ) {
    const appt = await this.repo.findOne({ where: { id } });
    if (!appt) throw new BadRequestException('Appointment not found');

    this.checkFutureLimit(body.newDate);

    if (!body.newTimeSlot) {
      const slots = await this.getAvailableSlots(
        appt.doctorId,
        body.newDate,
      );

      if (!slots.slots.length) {
        throw new BadRequestException('No slots available');
      }

      body.newTimeSlot = slots.slots[0];
    }

    appt.previousDate = appt.date;
    appt.previousTimeSlot = appt.timeSlot;

    appt.date = body.newDate;
    appt.timeSlot = body.newTimeSlot;
    appt.status = 'rescheduled';

    return this.repo.save(appt);
  }

  // 🔥 NEXT AVAILABLE
  async getNextAvailableDay(doctorId: number, from: string) {
    let date = new Date(from);

    for (let i = 0; i < 30; i++) {
      const formatted = date.toISOString().split('T')[0];

      const slots = await this.getAvailableSlots(doctorId, formatted);

      if (slots.slots?.length > 0) {
        return { date: formatted, slots: slots.slots };
      }

      date.setDate(date.getDate() + 1);
    }

    throw new BadRequestException('No slots available');
  }
}