import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomWhereInputSchema } from '../inputTypeSchemas/RoomWhereInputSchema'

export const RoomDeleteManyArgsSchema: z.ZodType<Prisma.RoomDeleteManyArgs> = z.object({
  where: RoomWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() as z.ZodType<Prisma.RoomDeleteManyArgs>;

export default RoomDeleteManyArgsSchema;
