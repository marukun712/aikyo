import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { cors } from "hono/cors";
import { prisma } from "./lib/db";

const app = new Hono();

app.use("*", cors());

const roomCreateSchema = z.object({ name: z.string().min(1) });
const roomUpdateSchema = z.object({ name: z.string().min(1).optional() });
const companionCreateSchema = z.object({
  name: z.string().min(1),
  personality: z.string().min(1),
  story: z.string().min(1),
  sample: z.string().min(1),
  icon: z.string().min(1),
  roomId: z.string(),
});
const companionUpdateSchema = companionCreateSchema.partial();
const furnitureCreateSchema = z.object({
  label: z.string().min(1),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int(),
  roomId: z.string(),
});
const furnitureUpdateSchema = furnitureCreateSchema.partial();
const companionMoveSchema = z.object({ roomId: z.string().min(1) });

const route = app
  .get("/rooms", async (c) => {
    try {
      const rooms = await prisma.room.findMany({
        include: { furniture: true, companions: true },
      });
      return c.json(rooms);
    } catch {
      return c.json({ error: "Failed to fetch rooms." }, 500);
    }
  })
  .post(
    "/rooms",
    validator("json", (v, c) => {
      const p = roomCreateSchema.safeParse(v);
      if (!p.success) return c.json({ error: "Invalid Schema." }, 400);
      return p.data;
    }),
    async (c) => {
      try {
        const room = await prisma.room.create({ data: c.req.valid("json") });
        return c.json(room, 201);
      } catch {
        return c.json({ error: "Failed to create room." }, 500);
      }
    }
  )
  .put(
    "/rooms/:id",
    validator("json", (v, c) => {
      const p = roomUpdateSchema.safeParse(v);
      if (!p.success) return c.json({ error: "Invalid Schema" }, 400);
      return p.data;
    }),
    async (c) => {
      try {
        const room = await prisma.room.update({
          where: { id: c.req.param("id") },
          data: c.req.valid("json"),
        });
        return c.json(room);
      } catch {
        return c.json({ error: "Failed to update room." }, 500);
      }
    }
  )
  .get("/rooms/:id", async (c) => {
    try {
      const room = await prisma.room.findUnique({
        where: { id: c.req.param("id") },
        include: { furniture: true, companions: true },
      });
      if (!room) return c.json({ error: "Not found" }, 404);
      return c.json(room);
    } catch {
      return c.json({ error: "Failed to fetch room." }, 500);
    }
  })
  .get("/rooms/:id/companions", async (c) => {
    try {
      const companions = await prisma.companion.findMany({
        where: { roomId: c.req.param("id") },
      });
      return c.json(companions);
    } catch {
      return c.json({ error: "Failed to fetch companions." }, 500);
    }
  })
  .get("/rooms/:id/furniture", async (c) => {
    try {
      const furniture = await prisma.furniture.findMany({
        where: { roomId: c.req.param("id") },
      });
      return c.json(furniture);
    } catch {
      return c.json({ error: "Failed to fetch furniture." }, 500);
    }
  })
  .post(
    "/companions",
    validator("json", (v, c) => {
      const p = companionCreateSchema.safeParse(v);
      if (!p.success) return c.json({ error: "Invalid Schema" }, 400);
      return p.data;
    }),
    async (c) => {
      try {
        const companion = await prisma.companion.create({
          data: c.req.valid("json"),
        });
        return c.json(companion, 201);
      } catch {
        return c.json({ error: "Failed to create companion." }, 500);
      }
    }
  )
  .put(
    "/companions/:id",
    validator("json", (v, c) => {
      const p = companionUpdateSchema.safeParse(v);
      if (!p.success) return c.json({ error: "Invalid Schema" }, 400);
      return p.data;
    }),
    async (c) => {
      try {
        const companion = await prisma.companion.update({
          where: { id: c.req.param("id") },
          data: c.req.valid("json"),
        });
        return c.json(companion);
      } catch {
        return c.json({ error: "Failed to update companion." }, 500);
      }
    }
  )
  .get("/companions/:id", async (c) => {
    try {
      const companion = await prisma.companion.findUnique({
        where: { id: c.req.param("id") },
      });
      if (!companion) return c.json({ error: "Not found" }, 404);
      return c.json(companion);
    } catch {
      return c.json({ error: "Failed to fetch companion." }, 500);
    }
  })
  .delete("/companions/:id", async (c) => {
    try {
      await prisma.companion.delete({ where: { id: c.req.param("id") } });
      return c.json({ message: "Companion deleted successfully" });
    } catch {
      return c.json({ error: "Failed to delete companion." }, 500);
    }
  })
  .put(
    "/companions/:id/move",
    validator("json", (v, c) => {
      const p = companionMoveSchema.safeParse(v);
      if (!p.success) return c.json({ error: "Invalid Schema" }, 400);
      return p.data;
    }),
    async (c) => {
      try {
        const companion = await prisma.companion.update({
          where: { id: c.req.param("id") },
          data: { roomId: c.req.valid("json").roomId },
        });
        return c.json({ message: "Companion moved successfully", companion });
      } catch {
        return c.json({ error: "Failed to move companion." }, 500);
      }
    }
  )
  .post(
    "/furniture",
    validator("json", (v, c) => {
      const p = furnitureCreateSchema.safeParse(v);
      if (!p.success) return c.json({ error: "Invalid Schema" }, 400);
      return p.data;
    }),
    async (c) => {
      try {
        const furniture = await prisma.furniture.create({
          data: c.req.valid("json"),
        });
        return c.json(furniture, 201);
      } catch {
        return c.json({ error: "Failed to create furniture." }, 500);
      }
    }
  )
  .put(
    "/furniture/:id",
    validator("json", (v, c) => {
      const p = furnitureUpdateSchema.safeParse(v);
      if (!p.success) return c.json({ error: "Invalid Schema" }, 400);
      return p.data;
    }),
    async (c) => {
      try {
        const furniture = await prisma.furniture.update({
          where: { id: c.req.param("id") },
          data: c.req.valid("json"),
        });
        return c.json(furniture);
      } catch {
        return c.json({ error: "Failed to update furniture." }, 500);
      }
    }
  )
  .get("/furniture/:id", async (c) => {
    try {
      const furniture = await prisma.furniture.findUnique({
        where: { id: c.req.param("id") },
      });
      if (!furniture) return c.json({ error: "Not found" }, 404);
      return c.json(furniture);
    } catch {
      return c.json({ error: "Failed to fetch furniture." }, 500);
    }
  })
  .delete("/furniture/:id", async (c) => {
    try {
      await prisma.furniture.delete({ where: { id: c.req.param("id") } });
      return c.json({ message: "Furniture deleted successfully" });
    } catch {
      return c.json({ error: "Failed to delete furniture." }, 500);
    }
  });

export type routeType = typeof route;

Bun.serve({ fetch: app.fetch, port: 3000 });
console.log("server started and listening on http://localhost:3000");
