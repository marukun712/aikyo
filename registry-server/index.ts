import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { Room, Companion, Furniture } from "./lib/db";

const app = new Hono();

const roomCreateSchema = z.object({
  name: z.string().min(1),
});

const roomUpdateSchema = z.object({
  name: z.string().min(1).optional(),
});

const companionCreateSchema = z.object({
  name: z.string().min(1),
  personality: z.string().min(1),
  story: z.string().min(1),
  sample: z.string().min(1),
  icon: z.string().min(1),
  roomId: z.string(),
});

const companionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  personality: z.string().min(1).optional(),
  story: z.string().min(1).optional(),
  sample: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  roomId: z.string().optional(),
});

const furnitureCreateSchema = z.object({
  label: z.string().min(1),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int(),
  roomId: z.string(),
});

const furnitureUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  z: z.number().int().optional(),
  roomId: z.string().optional(),
});

app.post(
  "/rooms",
  validator("json", (value, c) => {
    const parsed = roomCreateSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: "Invalid Schema." }, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const room = await Room.create(body);
      return c.json(room, 201);
    } catch (e) {
      console.log(e);
      return c.json({ error: "Failed to create room." }, 500);
    }
  }
);

app.put(
  "/rooms/:id",
  validator("json", (value, c) => {
    const parsed = roomUpdateSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: "Invalid Schema" }, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const room = await Room.findByIdAndUpdate(id, body, { new: true });
      if (!room) {
        return c.json({ error: "Not found" }, 404);
      }
      return c.json(room);
    } catch (e) {
      console.log(e);
      return c.json({ error: "Failed to update room." }, 500);
    }
  }
);

app.get("/rooms/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const room = await Room.findById(id)
      .populate("furniture")
      .populate("companions");
    if (!room) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(room);
  } catch (e) {
    console.log(e);
    return c.json({ error: "Failed to fetch room." }, 500);
  }
});

app.post(
  "/companions",
  validator("json", (value, c) => {
    const parsed = companionCreateSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: "Invalid Schema" }, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const companion = await Companion.create(body);
      return c.json(companion, 201);
    } catch (e) {
      console.log(e);
      return c.json({ error: "Failed to create companion." }, 500);
    }
  }
);

app.put(
  "/companions/:id",
  validator("json", (value, c) => {
    const parsed = companionUpdateSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: "Invalid Schema" }, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const companion = await Companion.findByIdAndUpdate(id, body, {
        new: true,
      });
      if (!companion) {
        return c.json({ error: "Not found" }, 404);
      }
      return c.json(companion);
    } catch (e) {
      console.log(e);
      return c.json({ error: "Failed to update companion." }, 500);
    }
  }
);

app.get("/companions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const companion = await Companion.findById(id).populate("roomId");
    if (!companion) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(companion);
  } catch (e) {
    console.log(e);
    return c.json({ error: "Failed to fetch companion." }, 500);
  }
});

app.post(
  "/furniture",
  validator("json", (value, c) => {
    const parsed = furnitureCreateSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: "Invalid Schema" }, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const body = c.req.valid("json");
      const furniture = await Furniture.create(body);
      return c.json(furniture, 201);
    } catch (e) {
      console.log(e);
      return c.json({ error: "Failed to create furniture." }, 500);
    }
  }
);

app.put(
  "/furniture/:id",
  validator("json", (value, c) => {
    const parsed = furnitureUpdateSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: "Invalid Schema" }, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const furniture = await Furniture.findByIdAndUpdate(id, body, {
        new: true,
      });
      if (!furniture) {
        return c.json({ error: "Not found" }, 404);
      }
      return c.json(furniture);
    } catch (e) {
      console.log(e);
      return c.json({ error: "Failed to update furniture." }, 500);
    }
  }
);

app.get("/furniture/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const furniture = await Furniture.findById(id).populate("roomId");
    if (!furniture) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(furniture);
  } catch (e) {
    console.log(e);
    return c.json({ error: "Failed to fetch furniture." }, 500);
  }
});

Bun.serve({ fetch: app.fetch, port: 3000 });
