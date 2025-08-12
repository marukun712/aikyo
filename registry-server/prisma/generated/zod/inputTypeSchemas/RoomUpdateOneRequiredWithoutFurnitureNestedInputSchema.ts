import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomCreateWithoutFurnitureInputSchema } from './RoomCreateWithoutFurnitureInputSchema';
import { RoomUncheckedCreateWithoutFurnitureInputSchema } from './RoomUncheckedCreateWithoutFurnitureInputSchema';
import { RoomCreateOrConnectWithoutFurnitureInputSchema } from './RoomCreateOrConnectWithoutFurnitureInputSchema';
import { RoomUpsertWithoutFurnitureInputSchema } from './RoomUpsertWithoutFurnitureInputSchema';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';
import { RoomUpdateToOneWithWhereWithoutFurnitureInputSchema } from './RoomUpdateToOneWithWhereWithoutFurnitureInputSchema';
import { RoomUpdateWithoutFurnitureInputSchema } from './RoomUpdateWithoutFurnitureInputSchema';
import { RoomUncheckedUpdateWithoutFurnitureInputSchema } from './RoomUncheckedUpdateWithoutFurnitureInputSchema';

export const RoomUpdateOneRequiredWithoutFurnitureNestedInputSchema: z.ZodType<Prisma.RoomUpdateOneRequiredWithoutFurnitureNestedInput> = z.object({
  create: z.union([ z.lazy(() => RoomCreateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedCreateWithoutFurnitureInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RoomCreateOrConnectWithoutFurnitureInputSchema).optional(),
  upsert: z.lazy(() => RoomUpsertWithoutFurnitureInputSchema).optional(),
  connect: z.lazy(() => RoomWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RoomUpdateToOneWithWhereWithoutFurnitureInputSchema),z.lazy(() => RoomUpdateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutFurnitureInputSchema) ]).optional(),
}).strict() as z.ZodType<Prisma.RoomUpdateOneRequiredWithoutFurnitureNestedInput>;

export default RoomUpdateOneRequiredWithoutFurnitureNestedInputSchema;
