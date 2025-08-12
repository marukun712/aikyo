import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomCreateWithoutFurnitureInputSchema } from './RoomCreateWithoutFurnitureInputSchema';
import { RoomUncheckedCreateWithoutFurnitureInputSchema } from './RoomUncheckedCreateWithoutFurnitureInputSchema';
import { RoomCreateOrConnectWithoutFurnitureInputSchema } from './RoomCreateOrConnectWithoutFurnitureInputSchema';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';

export const RoomCreateNestedOneWithoutFurnitureInputSchema: z.ZodType<Prisma.RoomCreateNestedOneWithoutFurnitureInput> = z.object({
  create: z.union([ z.lazy(() => RoomCreateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedCreateWithoutFurnitureInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RoomCreateOrConnectWithoutFurnitureInputSchema).optional(),
  connect: z.lazy(() => RoomWhereUniqueInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomCreateNestedOneWithoutFurnitureInput>;

export default RoomCreateNestedOneWithoutFurnitureInputSchema;
