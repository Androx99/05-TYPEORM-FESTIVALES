import { Controller, Get, Header, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ActuacionModule } from './actuacion/actuacion.module';

@Controller("salud")
class SaludController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async comprobarConexion() {
    const [row] = await this.dataSource.query(
      "SELECT current_database() AS base, current_timestamp AS hora",
    );
    return { estado: "ok", base: row.base, hora: row.hora };
  }

  @Get("vista")
  @Header("Content-Type", "text/html; charset=utf-8")
  async vistaVisual() {
    const [row] = await this.dataSource.query(
      "SELECT current_database() AS base",
    );
    return `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Backend conectado</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3f5ed;color:#183a32;font:16px system-ui,sans-serif}
main{background:white;padding:32px;border-radius:16px;max-width:560px;margin:20px;box-shadow:0 10px 35px #183a3218}
.ok{color:#17633e;font-weight:800}.tag{color:#47705f;font-size:13px;font-weight:700;letter-spacing:.08em}
</style>
<main><p class="tag">BACKEND · NESTJS + TYPEORM</p><h1 class="ok">✓ Backend conectado</h1>
<p>NestJS está en ejecución y ha consultado PostgreSQL.</p>
<p>Base de datos: <strong>${row.base}</strong></p>
<p>La ruta JSON para probar desde Git Bash es <code>/salud</code>.</p></main>
</html>`;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "repaso-typescript",
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === "true",
    }),
    ActuacionModule,
  ],
  controllers: [SaludController],
})
export class AppModule {}
