import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict() as z.ZodType<Prisma.StringFieldUpdateOperationsInput>;

export default StringFieldUpdateOperationsInputSchema;
