// Run: MONGO_URI="your-atlas-uri" node scripts/create-riders.mjs
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Set MONGO_URI env var. Example:\n  MONGO_URI=\"mongodb+srv://...\" node scripts/create-riders.mjs");
  process.exit(1);
}

const riders = [
  { name: "Rider One",  email: "rider1@rapidmart.in", password: "Rider@1234" },
  { name: "Rider Two",  email: "rider2@rapidmart.in", password: "Rider@5678" },
];

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db();
const users = db.collection("users");

for (const r of riders) {
  const existing = await users.findOne({ email: r.email });
  if (existing) {
    console.log(`⚠️  ${r.email} already exists — skipping`);
    continue;
  }
  const passwordHash = await bcrypt.hash(r.password, 12);
  await users.insertOne({
    name:         r.name,
    email:        r.email,
    passwordHash,
    role:         "rider",
    addresses:    [],
    createdAt:    new Date(),
    updatedAt:    new Date(),
  });
  console.log(`✅  Created: ${r.email}  /  ${r.password}`);
}

await client.close();
console.log("\nDone.");
