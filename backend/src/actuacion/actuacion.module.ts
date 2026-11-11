import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Festival } from "../festival/entities/festival.entity";
import { Actuacion } from "./entities/actuacion.entity";
import { ActuacionController } from "./actuacion.controller";
import { ActuacionService } from "./actuacion.service";

@Module({
  imports: [TypeOrmModule.forFeature([Festival, Actuacion])],
  controllers: [ActuacionController],
  providers: [ActuacionService],
})
export class ActuacionModule {}