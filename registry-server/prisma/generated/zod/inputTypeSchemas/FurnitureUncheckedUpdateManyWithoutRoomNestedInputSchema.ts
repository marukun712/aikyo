import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureCreateWithoutRoomInputSchema } from './FurnitureCreateWithoutRoomInputSchema';
import { FurnitureUncheckedCreateWithoutRoomInputSchema } from './FurnitureUncheckedCreateWithoutRoomInputSchema';
import { FurnitureCreateOrConnectWithoutRoomInputSchema } from './FurnitureCreateOrConnectWithoutRoomInputSchema';
import { FurnitureUpsertWithWhereUniqueWithoutRoomInputSchema } from './FurnitureUpsertWithWhereUniqueWithoutRoomInputSchema';
import { FurnitureCreateManyRoomInputEnvelopeSchema } from './FurnitureCreateManyRoomInputEnvelopeSchema';
import { FurnitureWhereUniqueInputSchema } from './FurnitureWhereUniqueInputSchema';
import { FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema } from './FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema';
import { FurnitureUpdateManyWithWhereWithoutRoomInputSchema } from './FurnitureUpdateManyWithWhereWithoutRoomInputSchema';
import { FurnitureScalarWhereInputSchema } from './FurnitureScalarWhereInputSchema';

export const FurnitureUncheckedUpdateManyWithoutRoomNestedInputSchema: z.ZodType<Prisma.FurnitureUncheckedUpdateManyWithoutRoomNestedInput> = z.object({
  create: z.union([ z.lazy(() => FurnitureCreateWithoutRoomInputSchema),z.lazy(() => FurnitureCreateWithoutRoomInputSchema).array(),z.lazy(() => FurnitureUncheckedCreateWithoutRoomInputSchema),z.lazy(() => FurnitureUncheckedCreateWithoutRoomInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => FurnitureCreateOrConnectWithoutRoomInputSchema),z.lazy(() => FurnitureCreateOrConnectWithoutRoomInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => FurnitureUpsertWithWhereUniqueWithoutRoomInputSchema),z.lazy(() => FurnitureUpsertWithWhereUniqueWithoutRoomInputSchema).array() ]).optional(),
  createMany: z.lazy(() => FurnitureCreateManyRoomInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema),z.lazy(() => FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => FurnitureUpdateManyWithWhereWithoutRoomInputSchema),z.lazy(() => FurnitureUpdateManyWithWhereWithoutRoomInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => FurnitureScalarWhereInputSchema),z.lazy(() => FurnitureScalarWhereInputSchema).array() ]).optional(),
}).strict() as z.ZodType<Prisma.FurnitureUncheckedUpdateManyWithoutRoomNestedInput>;

export default FurnitureUncheckedUpdateManyWithoutRoomNestedInputSchema;
