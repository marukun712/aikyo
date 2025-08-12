import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionWhereUniqueInputSchema } from './CompanionWhereUniqueInputSchema';
import { CompanionCreateWithoutRoomInputSchema } from './CompanionCreateWithoutRoomInputSchema';
import { CompanionUncheckedCreateWithoutRoomInputSchema } from './CompanionUncheckedCreateWithoutRoomInputSchema';

export const CompanionCreateOrConnectWithoutRoomInputSchema: z.ZodType<Prisma.CompanionCreateOrConnectWithoutRoomInput> = z.object({
  where: z.lazy(() => CompanionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => CompanionCreateWithoutRoomInputSchema),z.lazy(() => CompanionUncheckedCreateWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.CompanionCreateOrConnectWithoutRoomInput>;

export default CompanionCreateOrConnectWithoutRoomInputSchema;
