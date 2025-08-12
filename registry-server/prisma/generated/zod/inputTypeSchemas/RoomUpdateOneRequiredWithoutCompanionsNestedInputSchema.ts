import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomCreateWithoutCompanionsInputSchema } from './RoomCreateWithoutCompanionsInputSchema';
import { RoomUncheckedCreateWithoutCompanionsInputSchema } from './RoomUncheckedCreateWithoutCompanionsInputSchema';
import { RoomCreateOrConnectWithoutCompanionsInputSchema } from './RoomCreateOrConnectWithoutCompanionsInputSchema';
import { RoomUpsertWithoutCompanionsInputSchema } from './RoomUpsertWithoutCompanionsInputSchema';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';
import { RoomUpdateToOneWithWhereWithoutCompanionsInputSchema } from './RoomUpdateToOneWithWhereWithoutCompanionsInputSchema';
import { RoomUpdateWithoutCompanionsInputSchema } from './RoomUpdateWithoutCompanionsInputSchema';
import { RoomUncheckedUpdateWithoutCompanionsInputSchema } from './RoomUncheckedUpdateWithoutCompanionsInputSchema';

export const RoomUpdateOneRequiredWithoutCompanionsNestedInputSchema: z.ZodType<Prisma.RoomUpdateOneRequiredWithoutCompanionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => RoomCreateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedCreateWithoutCompanionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RoomCreateOrConnectWithoutCompanionsInputSchema).optional(),
  upsert: z.lazy(() => RoomUpsertWithoutCompanionsInputSchema).optional(),
  connect: z.lazy(() => RoomWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RoomUpdateToOneWithWhereWithoutCompanionsInputSchema),z.lazy(() => RoomUpdateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutCompanionsInputSchema) ]).optional(),
}).strict() as z.ZodType<Prisma.RoomUpdateOneRequiredWithoutCompanionsNestedInput>;

export default RoomUpdateOneRequiredWithoutCompanionsNestedInputSchema;
