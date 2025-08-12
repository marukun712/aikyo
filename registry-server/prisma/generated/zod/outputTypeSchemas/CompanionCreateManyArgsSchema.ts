import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionCreateManyInputSchema } from '../inputTypeSchemas/CompanionCreateManyInputSchema'

export const CompanionCreateManyArgsSchema: z.ZodType<Prisma.CompanionCreateManyArgs> = z.object({
  data: z.union([ CompanionCreateManyInputSchema,CompanionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() as z.ZodType<Prisma.CompanionCreateManyArgs>;

export default CompanionCreateManyArgsSchema;
