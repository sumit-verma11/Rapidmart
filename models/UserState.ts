import mongoose, { Schema } from "mongoose";

// Stores raw Zustand cart + wishlist snapshots per user.
// Uses Mixed (plain JSON) so it mirrors the client store exactly.
const UserStateSchema = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cart:      { type: Schema.Types.Mixed, default: [] },
    wishlist:  { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.UserState ||
  mongoose.model("UserState", UserStateSchema);
