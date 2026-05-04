import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('doctor')
export class DoctorController {
  constructor(
    private service: DoctorService,
  ) {}

  // ✅ Create Doctor
  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  // ✅ Get All Doctors (with filters)
  @Get()
  findAll(
    @Query('specialization') specialization?: string,
    @Query('hospitalId') hospitalId?: number,
  ) {
    return this.service.findAll({
      specialization,
      hospitalId: hospitalId ? Number(hospitalId) : undefined,
    });
  }

  // 🔥 FIXED: Doctor Leave (use DoctorService)
  @Post(':id/leave')
  markLeave(
    @Param('id') id: number,
    @Body() body: { date: string },
  ) {
    return this.service.markDoctorLeave(
      Number(id),
      body.date,
    );
  }

  // 🔥 Get Single Doctor
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(Number(id));
  }
}