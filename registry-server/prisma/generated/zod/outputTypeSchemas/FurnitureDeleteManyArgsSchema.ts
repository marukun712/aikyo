import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureWhereInputSchema } from '../inputTypeSchemas/FurnitureWhereInputSchema'

export const FurnitureDeleteManyArgsSchema: z.ZodType<Prisma.FurnitureDeleteManyArgs> = z.object({
  where: FurnitureWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() as z.ZodType<Prisma.FurnitureDeleteManyArgs>;

export default FurnitureDeleteManyArgsSchema;
