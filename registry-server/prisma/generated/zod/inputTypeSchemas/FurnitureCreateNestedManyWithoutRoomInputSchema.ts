import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureCreateWithoutRoomInputSchema } from './FurnitureCreateWithoutRoomInputSchema';
import { FurnitureUncheckedCreateWithoutRoomInputSchema } from './FurnitureUncheckedCreateWithoutRoomInputSchema';
import { FurnitureCreateOrConnectWithoutRoomInputSchema } from './FurnitureCreateOrConnectWithoutRoomInputSchema';
import { FurnitureCreateManyRoomInputEnvelopeSchema } from './FurnitureCreateManyRoomInputEnvelopeSchema';
import { FurnitureWhereUniqueInputSchema } from './FurnitureWhereUniqueInputSchema';

export const FurnitureCreateNestedManyWithoutRoomInputSchema: z.ZodType<Prisma.FurnitureCreateNestedManyWithoutRoomInput> = z.object({
  create: z.union([ z.lazy(() => FurnitureCreateWithoutRoomInputSchema),z.lazy(() => FurnitureCreateWithoutRoomInputSchema).array(),z.lazy(() => FurnitureUncheckedCreateWithoutRoomInputSchema),z.lazy(() => FurnitureUncheckedCreateWithoutRoomInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => FurnitureCreateOrConnectWithoutRoomInputSchema),z.lazy(() => FurnitureCreateOrConnectWithoutRoomInputSchema).array() ]).optional(),
  createMany: z.lazy(() => FurnitureCreateManyRoomInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
}).strict() as z.ZodType<Prisma.FurnitureCreateNestedManyWithoutRoomInput>;

export default FurnitureCreateNestedManyWithoutRoomInputSchema;
