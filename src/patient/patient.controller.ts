import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('patient')
export class PatientController {
  constructor(private service: PatientService) {}

  // 🌐 REGISTER PATIENT (PUBLIC)
  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  // 🔐 GET ALL PATIENTS (PROTECTED)
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.service.findAll();
  }
}