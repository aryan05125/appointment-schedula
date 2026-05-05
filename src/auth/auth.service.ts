import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Patient } from '../patient/patient.entity';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  
  @Injectable()
  export class AuthService {
    constructor(
      @InjectRepository(Patient)
      private patientRepo: Repository<Patient>,
      private jwtService: JwtService,
    ) {}
  
    // 🔐 REGISTER
    async register(phone: string, password: string, name: string) {
      if (!phone || !password || !name) {
        throw new BadRequestException('phone, password and name required');
      }
  
      // 🔥 check duplicate
      const existing = await this.patientRepo.findOne({
        where: { phone },
      });
  
      if (existing) {
        throw new BadRequestException('User already exists');
      }
  
      const hash = await bcrypt.hash(password, 10);
  
      const patient = this.patientRepo.create({
        phone,
        password: hash,
        name, // ✅ FIXED
        role: 'patient',
      });
  
      return this.patientRepo.save(patient);
    }
  
    // 🔐 LOGIN
    async login(phone: string, password: string) {
      const patient = await this.patientRepo.findOne({
        where: { phone },
        select: ['id', 'phone', 'password', 'role', 'name'],
      });
  
      if (!patient) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const isMatch = await bcrypt.compare(password, patient.password);
  
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const payload = {
        sub: patient.id,
        phone: patient.phone,
        role: patient.role,
      };
  
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: patient.id,
          phone: patient.phone,
          name: patient.name,
          role: patient.role,
        },
      };
    }
  }