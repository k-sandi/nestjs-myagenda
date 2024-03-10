import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // expose in global
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
