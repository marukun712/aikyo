import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureCreateManyRoomInputSchema } from './FurnitureCreateManyRoomInputSchema';

export const FurnitureCreateManyRoomInputEnvelopeSchema: z.ZodType<Prisma.FurnitureCreateManyRoomInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => FurnitureCreateManyRoomInputSchema),z.lazy(() => FurnitureCreateManyRoomInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict() as z.ZodType<Prisma.FurnitureCreateManyRoomInputEnvelope>;

export default FurnitureCreateManyRoomInputEnvelopeSchema;
