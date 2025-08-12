import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionScalarWhereInputSchema } from './CompanionScalarWhereInputSchema';
import { CompanionUpdateManyMutationInputSchema } from './CompanionUpdateManyMutationInputSchema';
import { CompanionUncheckedUpdateManyWithoutRoomInputSchema } from './CompanionUncheckedUpdateManyWithoutRoomInputSchema';

export const CompanionUpdateManyWithWhereWithoutRoomInputSchema: z.ZodType<Prisma.CompanionUpdateManyWithWhereWithoutRoomInput> = z.object({
  where: z.lazy(() => CompanionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => CompanionUpdateManyMutationInputSchema),z.lazy(() => CompanionUncheckedUpdateManyWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.CompanionUpdateManyWithWhereWithoutRoomInput>;

export default CompanionUpdateManyWithWhereWithoutRoomInputSchema;
