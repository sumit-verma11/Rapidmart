// MongoDB initialization script — runs once on first container boot
db = db.getSiblingDB("rapidmart");

db.createCollection("users");
db.createCollection("products");
db.createCollection("orders");

print("RapidMart database initialized successfully.");
