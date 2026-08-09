const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");

let mongod;
let app;
let Station;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();

  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = "test-secret";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.ADMIN_EMAIL = "admin@metro.com";
  process.env.ADMIN_PASSWORD = "Admin@1234";

  await mongoose.connect(process.env.MONGO_URI);

  app = require("../app");
  Station = require("../models/stationModel");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Station.deleteMany({});
});

describe("GET /health", () => {
  it("returns 200 with a JSON status", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v1/stations", () => {
  it("returns 200 with all stations, sorted by line then order", async () => {
    await Station.insertMany([
      { name: "Giza", line: "Orange", order: 2 },
      { name: "El-Mounib", line: "Orange", order: 1 },
      { name: "Helwan", line: "Red", order: 1 },
    ]);

    const res = await request(app).get("/api/v1/stations");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].name).toBe("El-Mounib");
    expect(res.body.data[1].name).toBe("Giza");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns a JWT for valid admin credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@metro.com", password: "Admin@1234" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it("returns 401 for invalid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@metro.com", password: "wrong-password" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 422 when email/password are missing", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});

    expect(res.statusCode).toBe(422);
  });
});

describe("POST /api/v1/stations/:stationId/announcements", () => {
  it("returns 401 when posting without a token", async () => {
    const station = await Station.create({
      name: "Helwan",
      line: "Red",
      order: 1,
    });

    const res = await request(app)
      .post(`/api/v1/stations/${station._id}/announcements`)
      .send({ text: "Train delayed by 5 minutes" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("creates an announcement with a valid admin token", async () => {
    const station = await Station.create({
      name: "Helwan",
      line: "Red",
      order: 1,
    });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@metro.com", password: "Admin@1234" });

    const token = loginRes.body.token;

    const res = await request(app)
      .post(`/api/v1/stations/${station._id}/announcements`)
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "Train delayed by 5 minutes" });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.text).toBe("Train delayed by 5 minutes");
  });
});

describe("GET unknown route", () => {
  it("returns 404 for a route that doesn't exist", async () => {
    const res = await request(app).get("/unknown");

    expect(res.statusCode).toBe(404);
  });
});
