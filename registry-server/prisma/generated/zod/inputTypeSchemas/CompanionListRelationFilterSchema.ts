import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionWhereInputSchema } from './CompanionWhereInputSchema';

export const CompanionListRelationFilterSchema: z.ZodType<Prisma.CompanionListRelationFilter> = z.object({
  every: z.lazy(() => CompanionWhereInputSchema).optional(),
  some: z.lazy(() => CompanionWhereInputSchema).optional(),
  none: z.lazy(() => CompanionWhereInputSchema).optional()
}).strict() as z.ZodType<Prisma.CompanionListRelationFilter>;

export default CompanionListRelationFilterSchema;
