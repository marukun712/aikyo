import { hc } from "hono/client";
import { routeType } from "../../registry-server";

const client = hc<routeType>("http://192.168.1.16:3000/");

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

export const updateRoom = async (id: string, name?: string) => {
  try {
    const res = await client.rooms[":id"].$put({
      param: { id },
      json: { name },
    });

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

export const getRoomCompanions = async (id: string) => {
  try {
    const res = await client.rooms[":id"].companions.$get({ param: { id } });

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

export const getRoomFurniture = async (id: string) => {
  try {
    const res = await client.rooms[":id"].furniture.$get({ param: { id } });

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

export const getCompanion = async (id: string) => {
  try {
    const res = await client.companions[":id"].$get({ param: { id } });

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

export const updateCompanion = async (
  id: string,
  updates: {
    name?: string;
    personality?: string;
    story?: string;
    sample?: string;
    icon?: string;
    roomId?: string;
  }
) => {
  try {
    const res = await client.companions[":id"].$put({
      param: { id },
      json: updates,
    });

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

export const deleteCompanion = async (id: string) => {
  try {
    const res = await client.companions[":id"].$delete({ param: { id } });

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

export const moveCompanion = async (id: string, roomId: string) => {
  try {
    const res = await client.companions[":id"].move.$put({
      param: { id },
      json: { roomId },
    });

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

export const addFurniture = async (
  label: string,
  x: number,
  y: number,
  z: number,
  roomId: string
) => {
  try {
    const res = await client.furniture.$post({
      json: { label, x, y, z, roomId },
    });

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

export const getFurniture = async (id: string) => {
  try {
    const res = await client.furniture[":id"].$get({ param: { id } });

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

export const updateFurniture = async (
  id: string,
  updates: {
    label?: string;
    x?: number;
    y?: number;
    z?: number;
    roomId?: string;
  }
) => {
  try {
    const res = await client.furniture[":id"].$put({
      param: { id },
      json: updates,
    });

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

export const deleteFurniture = async (id: string) => {
  try {
    const res = await client.furniture[":id"].$delete({ param: { id } });

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

export const resetFurniture = async (id: string) => {
  try {
    const res = await client.rooms[":id"].reset.$get({ param: { id } });

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
