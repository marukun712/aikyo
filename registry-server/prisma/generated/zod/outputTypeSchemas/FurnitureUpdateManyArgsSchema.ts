import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureUpdateManyMutationInputSchema } from '../inputTypeSchemas/FurnitureUpdateManyMutationInputSchema'
import { FurnitureUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/FurnitureUncheckedUpdateManyInputSchema'
import { FurnitureWhereInputSchema } from '../inputTypeSchemas/FurnitureWhereInputSchema'

export const FurnitureUpdateManyArgsSchema: z.ZodType<Prisma.FurnitureUpdateManyArgs> = z.object({
  data: z.union([ FurnitureUpdateManyMutationInputSchema,FurnitureUncheckedUpdateManyInputSchema ]),
  where: FurnitureWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() as z.ZodType<Prisma.FurnitureUpdateManyArgs>;

export default FurnitureUpdateManyArgsSchema;
