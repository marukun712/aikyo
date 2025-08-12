import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureWhereUniqueInputSchema } from './FurnitureWhereUniqueInputSchema';
import { FurnitureCreateWithoutRoomInputSchema } from './FurnitureCreateWithoutRoomInputSchema';
import { FurnitureUncheckedCreateWithoutRoomInputSchema } from './FurnitureUncheckedCreateWithoutRoomInputSchema';

export const FurnitureCreateOrConnectWithoutRoomInputSchema: z.ZodType<Prisma.FurnitureCreateOrConnectWithoutRoomInput> = z.object({
  where: z.lazy(() => FurnitureWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => FurnitureCreateWithoutRoomInputSchema),z.lazy(() => FurnitureUncheckedCreateWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.FurnitureCreateOrConnectWithoutRoomInput>;

export default FurnitureCreateOrConnectWithoutRoomInputSchema;
