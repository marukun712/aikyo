import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionCreateWithoutRoomInputSchema } from './CompanionCreateWithoutRoomInputSchema';
import { CompanionUncheckedCreateWithoutRoomInputSchema } from './CompanionUncheckedCreateWithoutRoomInputSchema';
import { CompanionCreateOrConnectWithoutRoomInputSchema } from './CompanionCreateOrConnectWithoutRoomInputSchema';
import { CompanionCreateManyRoomInputEnvelopeSchema } from './CompanionCreateManyRoomInputEnvelopeSchema';
import { CompanionWhereUniqueInputSchema } from './CompanionWhereUniqueInputSchema';

export const CompanionUncheckedCreateNestedManyWithoutRoomInputSchema: z.ZodType<Prisma.CompanionUncheckedCreateNestedManyWithoutRoomInput> = z.object({
  create: z.union([ z.lazy(() => CompanionCreateWithoutRoomInputSchema),z.lazy(() => CompanionCreateWithoutRoomInputSchema).array(),z.lazy(() => CompanionUncheckedCreateWithoutRoomInputSchema),z.lazy(() => CompanionUncheckedCreateWithoutRoomInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => CompanionCreateOrConnectWithoutRoomInputSchema),z.lazy(() => CompanionCreateOrConnectWithoutRoomInputSchema).array() ]).optional(),
  createMany: z.lazy(() => CompanionCreateManyRoomInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
}).strict() as z.ZodType<Prisma.CompanionUncheckedCreateNestedManyWithoutRoomInput>;

export default CompanionUncheckedCreateNestedManyWithoutRoomInputSchema;
