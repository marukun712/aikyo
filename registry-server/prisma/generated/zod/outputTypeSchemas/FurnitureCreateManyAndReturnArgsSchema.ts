import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureCreateManyInputSchema } from '../inputTypeSchemas/FurnitureCreateManyInputSchema'

export const FurnitureCreateManyAndReturnArgsSchema: z.ZodType<Prisma.FurnitureCreateManyAndReturnArgs> = z.object({
  data: z.union([ FurnitureCreateManyInputSchema,FurnitureCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() as z.ZodType<Prisma.FurnitureCreateManyAndReturnArgs>;

export default FurnitureCreateManyAndReturnArgsSchema;
