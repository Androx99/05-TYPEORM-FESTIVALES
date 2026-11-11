import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Festival } from "../festival/entities/festival.entity";
import { Actuacion } from "./entities/actuacion.entity";

export interface CreateActuacionDto {
  nombre: string;
  duracionMinutos: number;
  idFestival: number;
}

export interface UpdateActuacionDto {
  nombre?: string;
  duracionMinutos?: number;
  idFestival?: number;
}

@Injectable()
export class ActuacionService {
  constructor(
    @InjectRepository(Actuacion)
    private readonly actuacionRepository: Repository<Actuacion>,
    @InjectRepository(Festival)
    private readonly festivalRepository: Repository<Festival>,
  ) {}

  // Listar todos los festivales disponibles
  findAllFestivales() {
    return this.festivalRepository.find({ order: { id: "ASC" } });
  }

  // 1. Añadir un registro con su clave foránea asociada
  async create(dto: CreateActuacionDto) {
    const festival = await this.festivalRepository.findOneBy({ id: dto.idFestival });
    if (!festival) {
      throw new NotFoundException(`Festival con ID ${dto.idFestival} no encontrado`);
    }

    const nuevaActuacion = this.actuacionRepository.create({
      nombre: dto.nombre,
      duracionMinutos: dto.duracionMinutos,
      festival: festival,
    });

    return this.actuacionRepository.save(nuevaActuacion);
  }

  // 2. Listar registros
  findAll() {
    return this.actuacionRepository
      .createQueryBuilder("registro")
      .innerJoinAndSelect("registro.festival", "principal")
      .orderBy("registro.id", "ASC")
      .getMany();
  }

  // Obtener un registro por ID
  async findOne(id: number) {
    const registro = await this.actuacionRepository
      .createQueryBuilder("registro")
      .innerJoinAndSelect("registro.festival", "principal")
      .where("registro.id = :id", { id })
      .getOne();

    if (!registro) {
      throw new NotFoundException(`Actuación con ID ${id} no encontrada`);
    }

    return registro;
  }

  // 3. Eliminar el registro elegido
  async remove(id: number) {
    const registro = await this.findOne(id);
    await this.actuacionRepository.remove(registro);
    return { mensaje: `Actuación con ID ${id} eliminada correctamente` };
  }

  // 4 y 5. Modificar un campo conservando el ID y/o modificar la clave foránea
  async update(id: number, dto: UpdateActuacionDto) {
    const registro = await this.findOne(id);

    // Modificar campos simples conservando el identificador (Punto 4)
    if (dto.nombre !== undefined) {
      registro.nombre = dto.nombre;
    }
    if (dto.duracionMinutos !== undefined) {
      registro.duracionMinutos = dto.duracionMinutos;
    }

    // Modificar la clave foránea / asociación por ID (Punto 5)
    if (dto.idFestival !== undefined) {
      const nuevoFestival = await this.festivalRepository.findOneBy({ id: dto.idFestival });
      if (!nuevoFestival) {
        throw new NotFoundException(`Festival con ID ${dto.idFestival} no encontrado`);
      }
      registro.festival = nuevoFestival;
    }

    return this.actuacionRepository.save(registro);
  }

  // 6. Consultar con INNER JOIN / LEFT JOIN y WHERE
  findByFestival(principalId: number) {
    return this.actuacionRepository
      .createQueryBuilder("registro")
      .innerJoinAndSelect("registro.festival", "principal")
      .where("principal.id = :principalId", { principalId })
      .orderBy("registro.id", "ASC")
      .getMany();
  }

  searchByName(text: string) {
    return this.actuacionRepository
      .createQueryBuilder("registro")
      .innerJoinAndSelect("registro.festival", "principal")
      .where("registro.nombre ILIKE :pattern", { pattern: `%${text}%` })
      .orderBy("registro.id", "ASC")
      .getMany();
  }

  findByFestivalAndMinimum(principalId: number, minimum: number) {
    return this.actuacionRepository
      .createQueryBuilder("registro")
      .innerJoinAndSelect("registro.festival", "principal")
      .where("principal.id = :principalId", { principalId })
      .andWhere("registro.duracionMinutos >= :minimum", { minimum })
      .orderBy("registro.duracionMinutos", "DESC")
      .getMany();
  }

  countByFestival() {
    return this.festivalRepository
      .createQueryBuilder("principal")
      .leftJoin("principal.actuaciones", "registro")
      .select("principal.id", "id")
      .addSelect("principal.nombre", "nombre")
      .addSelect("COUNT(registro.id)", "total")
      .groupBy("principal.id")
      .addGroupBy("principal.nombre")
      .orderBy("principal.id", "ASC")
      .getRawMany();
  }
}