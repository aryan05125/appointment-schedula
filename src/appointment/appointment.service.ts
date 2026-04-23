import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { Doctor } from '../doctor/doctor.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  // 🔹 GET available slots for a given date
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!doctor.workingDays.includes(dayName)) {
      return { message: 'Doctor not available on this day', slots: [] };
    }

    const slots = this.generateSlots(doctor.startTime, doctor.endTime, doctor.slotDuration);

    const booked = await this.repo.find({
      where: { doctorId, date },
    });

    const bookedTimes = booked.map(b => b.time);
    const available = slots.filter(s => !bookedTimes.includes(s));

    return {
      totalSlots: slots.length,
      bookedSlots: booked.length,
      availableSlots: available.length,
      slots: available,
    };
  }

  // 🔹 BOOK appointment
  async book(dto: any) {
    const doctor = await this.doctorRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor) throw new BadRequestException('Doctor not found');

    let date = new Date();
    let checkedDays = 0;

    while (checkedDays < 7) { // ✅ fallback limit
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (!doctor.workingDays.includes(dayName)) {
        date.setDate(date.getDate() + 1);
        checkedDays++;
        continue;
      }

      const formattedDate = date.toISOString().split('T')[0];

      const slots = this.generateSlots(
        doctor.startTime,
        doctor.endTime,
        doctor.slotDuration,
      );

      const booked = await this.repo.find({
        where: { doctorId: doctor.id, date: formattedDate },
      });

      const bookedTimes = booked.map(b => b.time);
      const available = slots.filter(s => !bookedTimes.includes(s));

      if (available.length > 0) {
        dto.date = formattedDate;

        // ✅ if user selected time → validate
        if (dto.time) {
          if (!available.includes(dto.time)) {
            throw new BadRequestException('Selected time not available');
          }
        } else {
          dto.time = available[0]; // auto assign
        }

        const saved = await this.repo.save(dto);

        return {
          message:
            checkedDays === 0
              ? 'Appointment booked for today'
              : `Today full. Booked for next available day: ${dto.date}`,
          data: saved,
        };
      }

      date.setDate(date.getDate() + 1);
      checkedDays++;
    }

    // ❌ fallback message
    throw new BadRequestException(
      'No appointments available in the next 7 days. Please contact clinic.',
    );
  }

  generateSlots(start: string, end: string, duration: number): string[] {
    const slots: string[] = [];

    let [h, m] = start.split(':').map(Number);
    let startDate = new Date();
    startDate.setHours(h, m, 0, 0);

    let [eh, em] = end.split(':').map(Number);
    let endDate = new Date();
    endDate.setHours(eh, em, 0, 0);

    while (startDate < endDate) {
      slots.push(startDate.toTimeString().slice(0, 5));
      startDate.setMinutes(startDate.getMinutes() + duration);
    }

    return slots;
  }
}