import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionUpdateManyMutationInputSchema } from '../inputTypeSchemas/CompanionUpdateManyMutationInputSchema'
import { CompanionUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/CompanionUncheckedUpdateManyInputSchema'
import { CompanionWhereInputSchema } from '../inputTypeSchemas/CompanionWhereInputSchema'

export const CompanionUpdateManyArgsSchema: z.ZodType<Prisma.CompanionUpdateManyArgs> = z.object({
  data: z.union([ CompanionUpdateManyMutationInputSchema,CompanionUncheckedUpdateManyInputSchema ]),
  where: CompanionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() as z.ZodType<Prisma.CompanionUpdateManyArgs>;

export default CompanionUpdateManyArgsSchema;
