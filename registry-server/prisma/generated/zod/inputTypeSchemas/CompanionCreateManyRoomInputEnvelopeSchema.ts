import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionCreateManyRoomInputSchema } from './CompanionCreateManyRoomInputSchema';

export const CompanionCreateManyRoomInputEnvelopeSchema: z.ZodType<Prisma.CompanionCreateManyRoomInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => CompanionCreateManyRoomInputSchema),z.lazy(() => CompanionCreateManyRoomInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict() as z.ZodType<Prisma.CompanionCreateManyRoomInputEnvelope>;

export default CompanionCreateManyRoomInputEnvelopeSchema;
