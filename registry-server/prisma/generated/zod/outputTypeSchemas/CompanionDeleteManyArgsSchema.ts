import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionWhereInputSchema } from '../inputTypeSchemas/CompanionWhereInputSchema'

export const CompanionDeleteManyArgsSchema: z.ZodType<Prisma.CompanionDeleteManyArgs> = z.object({
  where: CompanionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() as z.ZodType<Prisma.CompanionDeleteManyArgs>;

export default CompanionDeleteManyArgsSchema;
