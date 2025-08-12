import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';
import { RoomCreateWithoutCompanionsInputSchema } from './RoomCreateWithoutCompanionsInputSchema';
import { RoomUncheckedCreateWithoutCompanionsInputSchema } from './RoomUncheckedCreateWithoutCompanionsInputSchema';

export const RoomCreateOrConnectWithoutCompanionsInputSchema: z.ZodType<Prisma.RoomCreateOrConnectWithoutCompanionsInput> = z.object({
  where: z.lazy(() => RoomWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => RoomCreateWithoutCompanionsInputSchema),z.lazy(() => RoomUncheckedCreateWithoutCompanionsInputSchema) ]),
}).strict() as z.ZodType<Prisma.RoomCreateOrConnectWithoutCompanionsInput>;

export default RoomCreateOrConnectWithoutCompanionsInputSchema;
