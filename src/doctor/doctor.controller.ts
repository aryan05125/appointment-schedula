import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { AuthGuard } from '@nestjs/passport';

// 🔥 ADD THESE
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('doctor')
export class DoctorController {
  constructor(private service: DoctorService) {}

  // 🔐 Create Doctor (ONLY ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateDoctorDto) {
    return this.service.create(dto);
  }

  // 🌐 Get All Doctors (PUBLIC)
  @Get()
  findAll(
    @Query('specialization') specialization?: string,
    @Query('hospitalId') hospitalId?: string,
  ) {
    return this.service.findAll({
      specialization,
      hospitalId: hospitalId ? Number(hospitalId) : undefined,
    });
  }

  // 🔐 Doctor Leave (ADMIN ONLY)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post(':id/leave')
  markLeave(
    @Param('id') id: string,
    @Body() body: { date: string },
  ) {
    return this.service.markDoctorLeave(
      Number(id),
      body.date,
    );
  }

  // 🌐 Get Doctor Address (PUBLIC)
  @Get(':id/address')
  getAddress(@Param('id') id: string) {
    return this.service.getDoctorAddress(Number(id));
  }

  // 🌐 Get Single Doctor (PUBLIC)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }
}