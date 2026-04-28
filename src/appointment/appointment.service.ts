import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  private clinicHolidays: string[] = ['2026-05-01', '2026-05-10'];

  // 🔥 HANDLE DOCTOR LEAVE + RESCHEDULE
  async handleDoctorLeave(doctorId: number, leaveDate: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    doctor.leaveDates = doctor.leaveDates
      ? [...doctor.leaveDates, leaveDate]
      : [leaveDate];

    await this.doctorRepo.save(doctor);

    const appointments = await this.repo.find({
      where: { doctorId, date: leaveDate },
    });

    let rescheduled = 0;

    for (const appt of appointments) {
      let newDate = new Date(leaveDate);
      newDate.setDate(newDate.getDate() + 1);

      let found = false;
      let attempts = 0;

      while (!found && attempts < 30) {
        const check = await this.checkDayAvailability(
          doctorId,
          newDate,
          false,
          doctor,
        );

        if (check.available) {
          const formattedDate = check.date;

          const totalSlots = this.calculateTotalSlots(
            doctor.startTime,
            doctor.endTime,
            doctor.slotDuration,
          );

          const bookedCount = await this.repo.count({
            where: { doctorId, date: formattedDate },
          });

          if (bookedCount < totalSlots) {
            const token = bookedCount + 1;

            const reportingTime = this.calculateReportingTime(
              doctor.startTime,
              doctor.slotDuration,
              token,
            );

            appt.date = formattedDate;
            appt.tokenNumber = token;
            appt.reportingTime = reportingTime;
            appt.status = 'rescheduled';

            await this.repo.save(appt);

            rescheduled++;
            found = true;
            break;
          }
        }

        newDate.setDate(newDate.getDate() + 1);
        attempts++;
      }

      if (!found) {
        appt.status = 'cancelled';
        await this.repo.save(appt);
      }
    }

    return {
      message: 'Doctor leave applied & appointments handled',
      total: appointments.length,
      rescheduled,
      cancelled: appointments.length - rescheduled,
    };
  }

  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    if (this.clinicHolidays.includes(date)) {
      return { message: 'Clinic is closed on this date' };
    }

    if (!doctor.workingDays.includes(dayName)) {
      return { message: 'Doctor not available on this day' };
    }

    if (doctor.isOnLeave || doctor.leaveDates?.includes(date)) {
      return { message: 'Doctor is on leave on this date' };
    }

    const totalSlots = this.calculateTotalSlots(
      doctor.startTime,
      doctor.endTime,
      doctor.slotDuration,
    );

    const bookedCount = await this.repo.count({
      where: { doctorId, date },
    });

    return {
      totalSlots,
      bookedSlots: bookedCount,
      availableSlots: totalSlots - bookedCount,
    };
  }

  async getNextAvailableDay(doctorId: number, from: string) {
    let date = new Date(from);
    let checkedDays = 0;

    while (checkedDays < 30) {
      const result = await this.checkDayAvailability(doctorId, date);

      if (result.available) {
        return {
          date: result.date,
          message: `Next available slot is on ${result.date}`,
        };
      }

      date.setDate(date.getDate() + 1);
      checkedDays++;
    }

    throw new BadRequestException('No available slots in next 30 days');
  }

  async book(dto: {
    doctorId: number;
    patientId: number;
    preferredDate?: string;
  }) {
    const doctor = await this.doctorRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const patient = await this.patientRepo.findOne({ where: { id: dto.patientId } });
    if (!patient) throw new BadRequestException('Patient not found');

    let date = dto.preferredDate ? new Date(dto.preferredDate) : new Date();

    let checkedDays = 0;
    let reason = '';

    while (checkedDays < 30) {
      const check = await this.checkDayAvailability(
        dto.doctorId,
        date,
        checkedDays === 0,
        doctor,
      );

      if (!check.available) {
        reason = check.reason || '';
        date.setDate(date.getDate() + 1);
        checkedDays++;
        continue;
      }

      const formattedDate = check.date;

      const existingSameDay = await this.repo.findOne({
        where: {
          patientId: dto.patientId,
          date: formattedDate,
        },
      });

      if (existingSameDay) {
        throw new BadRequestException(
          'Patient already has an appointment for this day',
        );
      }

      const bookedCount = await this.repo.count({
        where: { doctorId: doctor.id, date: formattedDate },
      });

      const token = bookedCount + 1;

      const reportingTime = this.calculateReportingTime(
        doctor.startTime,
        doctor.slotDuration,
        token,
      );

      const sameTime = await this.repo.findOne({
        where: {
          patientId: dto.patientId,
          date: formattedDate,
          reportingTime,
        },
      });

      if (sameTime) {
        throw new BadRequestException(
          'Patient already has an appointment at this time with another doctor',
        );
      }

      const appointment = this.repo.create({
        doctorId: dto.doctorId,
        patientId: dto.patientId,
        date: formattedDate,
        tokenNumber: token,
        reportingTime,
        status: 'confirmed',
      });

      const saved = await this.repo.save(appointment);

      return {
        message:
          checkedDays === 0
            ? `Appointment confirmed for today`
            : `${reason} Next available slot booked on ${formattedDate}`,
        data: saved,
      };
    }

    throw new BadRequestException(
      'No appointments available in next 30 days',
    );
  }

  async checkDayAvailability(
    doctorId: number,
    dateObj: Date,
    isToday = false,
    doctor?: Doctor,
  ) {
    const date = dateObj.toISOString().split('T')[0];
    const dayName = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
    });

    if (!doctor) {
      const foundDoctor = await this.doctorRepo.findOne({
        where: { id: doctorId },
      });

      if (!foundDoctor) {
        return { available: false, reason: 'Doctor not found', date };
      }

      doctor = foundDoctor;
    }

    if (this.clinicHolidays.includes(date)) {
      return { available: false, reason: 'Clinic is closed.', date };
    }

    if (!doctor.workingDays.includes(dayName)) {
      return { available: false, reason: 'Doctor not working.', date };
    }

    if (doctor.isOnLeave || doctor.leaveDates?.includes(date)) {
      return { available: false, reason: 'Doctor is on leave.', date };
    }

    if (isToday && this.isConsultingOver(new Date(), doctor.endTime)) {
      return { available: false, reason: 'Consultation over.', date };
    }

    const totalSlots = this.calculateTotalSlots(
      doctor.startTime,
      doctor.endTime,
      doctor.slotDuration,
    );

    const bookedCount = await this.repo.count({
      where: { doctorId, date },
    });

    if (bookedCount >= totalSlots) {
      return { available: false, reason: 'Slots full.', date };
    }

    return { available: true, date };
  }

  isConsultingOver(current: Date, endTime: string): boolean {
    const [h, m] = endTime.split(':').map(Number);
    const end = new Date();
    end.setHours(h, m, 0, 0);
    return current > end;
  }

  calculateTotalSlots(start: string, end: string, duration: number): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.floor((eh * 60 + em - (sh * 60 + sm)) / duration);
  }

  calculateReportingTime(start: string, duration: number, token: number): string {
    const [sh, sm] = start.split(':').map(Number);
    const total = sh * 60 + sm + (token - 1) * duration;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}