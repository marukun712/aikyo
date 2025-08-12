import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomCreateWithoutCompanionsInputSchema } from './RoomCreateWithoutCompanionsInputSchema';
import { RoomUncheckedCreateWithoutCompanionsInputSchema } from './RoomUncheckedCreateWithoutCompanionsInputSchema';
import { RoomCreateOrConnectWithoutCompanionsInputSchema } from './RoomCreateOrConnectWithoutCompanionsInputSchema';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';

export const RoomCreateNestedOneWithoutCompanionsInputSchema: z.ZodType<Prisma.RoomCreateNestedOneWithoutCompanionsInput> = z.object({
  create: z.union([ z.lazy(() => RoomCreateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedCreateWithoutCompanionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => RoomCreateOrConnectWithoutCompanionsInputSchema).optional(),
  connect: z.lazy(() => RoomWhereUniqueInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomCreateNestedOneWithoutCompanionsInput>;

export default RoomCreateNestedOneWithoutCompanionsInputSchema;
