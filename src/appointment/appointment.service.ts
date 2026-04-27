import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity'; // ✅ ADD THIS

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>, // ✅ ADD THIS
  ) {}

  // 🔹 OPTIONAL (for testing/debug)
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    if (!doctor.workingDays.includes(dayName)) {
      return { message: 'Doctor not available on this day' };
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

  // 🔥 MAIN BOOKING LOGIC (IVR STYLE)
  async book(dto: { doctorId: number; patientId: number }) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
    });

    if (!doctor) throw new BadRequestException('Doctor not found');

    // ✅ NEW VALIDATION (IMPORTANT FIX)
    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new BadRequestException('Patient not found');
    }

    let date = new Date();
    let checkedDays = 0;

    while (checkedDays < 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      // ❌ Skip non-working days
      if (!doctor.workingDays.includes(dayName)) {
        date.setDate(date.getDate() + 1);
        checkedDays++;
        continue;
      }

      const formattedDate = date.toISOString().split('T')[0];

      // 🔒 Check duplicate booking (1 per day)
      const existing = await this.repo.findOne({
        where: {
          doctorId: dto.doctorId,
          patientId: dto.patientId,
          date: formattedDate,
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Patient already booked for this day',
        );
      }

      const totalSlots = this.calculateTotalSlots(
        doctor.startTime,
        doctor.endTime,
        doctor.slotDuration,
      );

      const bookedCount = await this.repo.count({
        where: {
          doctorId: dto.doctorId,
          date: formattedDate,
        },
      });

      // ✅ If slot available
      if (bookedCount < totalSlots) {
        const tokenNumber = bookedCount + 1;

        const reportingTime = this.calculateReportingTime(
          doctor.startTime,
          doctor.slotDuration,
          tokenNumber,
        );

        const appointment = this.repo.create({
          doctorId: dto.doctorId,
          patientId: dto.patientId,
          date: formattedDate,
          tokenNumber,
          reportingTime,
          status: 'confirmed',
        });

        const saved = await this.repo.save(appointment);

        return {
          message:
            checkedDays === 0
              ? `Appointment booked for today. Date: ${formattedDate}, Token: ${tokenNumber}, Reporting Time: ${reportingTime}`
              : `Today appointment is full. Next available appointment booked on ${formattedDate}. Token: ${tokenNumber}, Reporting Time: ${reportingTime}`,

          data: {
            doctorId: saved.doctorId,
            patientId: saved.patientId,
            date: saved.date,
            tokenNumber: saved.tokenNumber,
            reportingTime: saved.reportingTime,
            status: saved.status,
          },
        };
      }

      // ⏭️ Go next day
      date.setDate(date.getDate() + 1);
      checkedDays++;
    }

    throw new BadRequestException(
      'No appointments available in the next 7 days. Please contact clinic.',
    );
  }

  calculateTotalSlots(start: string, end: string, duration: number): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    return Math.floor((endMinutes - startMinutes) / duration);
  }

  calculateReportingTime(
    start: string,
    duration: number,
    tokenNumber: number,
  ): string {
    const [sh, sm] = start.split(':').map(Number);

    const totalMinutes = sh * 60 + sm + (tokenNumber - 1) * duration;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }
}