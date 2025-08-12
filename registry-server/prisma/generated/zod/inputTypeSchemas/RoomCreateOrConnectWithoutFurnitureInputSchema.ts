import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';
import { RoomCreateWithoutFurnitureInputSchema } from './RoomCreateWithoutFurnitureInputSchema';
import { RoomUncheckedCreateWithoutFurnitureInputSchema } from './RoomUncheckedCreateWithoutFurnitureInputSchema';

export const RoomCreateOrConnectWithoutFurnitureInputSchema: z.ZodType<Prisma.RoomCreateOrConnectWithoutFurnitureInput> = z.object({
  where: z.lazy(() => RoomWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RoomCreateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedCreateWithoutFurnitureInputSchema) ]),
}).strict() as z.ZodType<Prisma.RoomCreateOrConnectWithoutFurnitureInput>;

export default RoomCreateOrConnectWithoutFurnitureInputSchema;
