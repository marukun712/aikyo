import { Schema, model, connect } from "mongoose";

if (!process.env.MONGO_URL) {
  throw new Error("MongoDBのURLを設定してください。");
}

const roomSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "rooms",
  }
);

roomSchema.virtual("furniture", {
  ref: "Furniture",
  localField: "_id",
  foreignField: "roomId",
});

roomSchema.virtual("companions", {
  ref: "Companion",
  localField: "_id",
  foreignField: "roomId",
});

roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

const companionSchema = new Schema(
  {
    name: { type: String, required: true },
    personality: { type: String, required: true },
    story: { type: String, required: true },
    sample: { type: String, required: true },
    icon: { type: String, required: true },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "companions",
  }
);

const furnitureSchema = new Schema(
  {
    label: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "furniture",
  }
);

const Room = model("Room", roomSchema);
const Companion = model("Companion", companionSchema);
const Furniture = model("Furniture", furnitureSchema);

await connect(process.env.MONGO_URL);

export { Room, Companion, Furniture };
