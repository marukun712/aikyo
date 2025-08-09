import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureSelectSchema } from '../inputTypeSchemas/FurnitureSelectSchema';
import { FurnitureIncludeSchema } from '../inputTypeSchemas/FurnitureIncludeSchema';

export const FurnitureArgsSchema: z.ZodType<Prisma.FurnitureDefaultArgs> = z.object({
  select: z.lazy(() => FurnitureSelectSchema).optional(),
  include: z.lazy(() => FurnitureIncludeSchema).optional(),
}).strict();

export default FurnitureArgsSchema;
