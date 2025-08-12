import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionCreateManyInputSchema } from '../inputTypeSchemas/CompanionCreateManyInputSchema'

export const CompanionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.CompanionCreateManyAndReturnArgs> = z.object({
  data: z.union([ CompanionCreateManyInputSchema,CompanionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() as z.ZodType<Prisma.CompanionCreateManyAndReturnArgs>;

export default CompanionCreateManyAndReturnArgsSchema;
