import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureCreateManyInputSchema } from '../inputTypeSchemas/FurnitureCreateManyInputSchema'

export const FurnitureCreateManyArgsSchema: z.ZodType<Prisma.FurnitureCreateManyArgs> = z.object({
  data: z.union([ FurnitureCreateManyInputSchema,FurnitureCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() as z.ZodType<Prisma.FurnitureCreateManyArgs>;

export default FurnitureCreateManyArgsSchema;
