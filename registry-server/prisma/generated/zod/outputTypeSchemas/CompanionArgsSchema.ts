import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { CompanionSelectSchema } from '../inputTypeSchemas/CompanionSelectSchema';
import { CompanionIncludeSchema } from '../inputTypeSchemas/CompanionIncludeSchema';

export const CompanionArgsSchema: z.ZodType<Prisma.CompanionDefaultArgs> = z.object({
  select: z.lazy(() => CompanionSelectSchema).optional(),
  include: z.lazy(() => CompanionIncludeSchema).optional(),
}).strict();

export default CompanionArgsSchema;
