import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ActuacionService, CreateActuacionDto, UpdateActuacionDto } from "./actuacion.service";

@Controller("actuaciones")
export class ActuacionController {
  constructor(private readonly actuacionService: ActuacionService) {}

  // Listar festivales para selectores
  @Get("festivales")
  findAllFestivales() {
    return this.actuacionService.findAllFestivales();
  }

  // 1. Añadir un registro
  @Post()
  create(@Body() dto: CreateActuacionDto) {
    return this.actuacionService.create(dto);
  }

  // 2. Listar registros
  @Get()
  findAll() {
    return this.actuacionService.findAll();
  }

  // Obtener un registro por ID
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.actuacionService.findOne(Number(id));
  }

  // 3. Eliminar el registro elegido
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.actuacionService.remove(Number(id));
  }

  // 4 y 5. Modificar un campo conservando ID y/o modificar la clave foránea
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateActuacionDto) {
    return this.actuacionService.update(Number(id), dto);
  }

  // 6. Consultas con INNER JOIN / LEFT JOIN y WHERE
  @Get("festival/:principalId")
  findByFestival(@Param("principalId") principalId: string) {
    return this.actuacionService.findByFestival(Number(principalId));
  }

  @Get("buscar")
  searchByName(@Query("texto") text: string) {
    return this.actuacionService.searchByName(text);
  }

  @Get("festival/:principalId/minimo/:minimum")
  findByFestivalAndMinimum(
    @Param("principalId") principalId: string,
    @Param("minimum") minimum: string,
  ) {
    return this.actuacionService.findByFestivalAndMinimum(Number(principalId), Number(minimum));
  }

  @Get("resumen/festival")
  countByFestival() {
    return this.actuacionService.countByFestival();
  }
}