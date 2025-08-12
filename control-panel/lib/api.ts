import { hc } from "hono/client";
import { routeType } from "../../registry-server";

const client = hc<routeType>("http://localhost:3000/");

export const addCompanion = async (
  name: string,
  personality: string,
  story: string,
  sample: string,
  icon: string,
  roomId: string
) => {
  try {
    const res = await client.companions.$post({
      json: { name, personality, story, sample, icon, roomId },
    });

    const json = await res.json();

    if ("error" in json) {
      throw new Error(json.error);
    }
  } catch (e) {
    throw new Error(e as string);
  }
};

export const addRoom = async (name: string) => {
  try {
    const res = await client.rooms.$post({
      json: { name },
    });

    const json = await res.json();

    if ("error" in json) {
      throw new Error(json.error);
    }
  } catch (e) {
    throw new Error(e as string);
  }
};

export const getRooms = async () => {
  try {
    const res = await client.rooms.$get({});

    const json = await res.json();

    if ("error" in json) {
      throw new Error(json.error);
    } else {
      return json;
    }
  } catch (e) {
    throw new Error(e as string);
  }
};

export const getRoom = async (id: string) => {
  try {
    const res = await client.rooms[":id"].$get({ param: { id } });

    const json = await res.json();

    if ("error" in json) {
      throw new Error(json.error);
    } else {
      return json;
    }
  } catch (e) {
    throw new Error(e as string);
  }
};
