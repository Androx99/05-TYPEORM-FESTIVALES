import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Festival } from "../../festival/entities/festival.entity";

@Entity({ name: "ACTUACION" })
export class Actuacion {
  @PrimaryGeneratedColumn({ name: "ID" })
  id!: number;

  @Column({ name: "NOMBRE", type: "varchar", length: 120 })
  nombre!: string;

  @Column({ name: "DURACION_MINUTOS", type: "integer" })
  duracionMinutos!: number;

  @ManyToOne(() => Festival, (festival) => festival.actuaciones, { nullable: false })

  @JoinColumn({ name: "ID_FESTIVAL" })

  festival!: Festival;
}