import request from "supertest";
import app from "../app.js";

let adminToken;
let userToken;

describe("AUTH API TESTING", () => {
  // ==== LOGIN DULU UNTUK DAPAT TOKEN =====
  beforeAll(async () => {
    // login admin
    const adminRes = await request(app).post("/api/v1/auth/login").send({
      email: "ghaisanikarin@gmail.com",
      password: "password",
    });
    adminToken = adminRes.body.data?.token;

    // login user biasa
    const userRes = await request(app).post("/api/v1/auth/login").send({
      email: "karina@gmail.com",
      password: "password",
    });
    userToken = userRes.body.data?.token;
  });

  // TC_AUTH_01 — Login valid
  test("TC_AUTH_01 - Login dengan kredensial valid", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "ghaisanikarin@gmail.com",
      password: "password",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data.token");
  });

  // TC_AUTH_02 — Password salah
  test("TC_AUTH_02 - Login dengan password salah", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "ghaisanikarin@gmail.com",
      password: "salah",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  // TC_AUTH_03 — Email tidak terdaftar
  test("TC_AUTH_03 - Login dengan email tidak terdaftar", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "tidakada@gmail.com",
      password: "password123",
    });

    expect([401, 404]).toContain(res.status);
  });

  // TC_AUTH_04 — Register User valid
  test("TC_AUTH_04 - Register user valid", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "rangga@gmail.com",
      password: "password",
      name: "rangga",
      phoneNumber: "086752553678",
      age: 22,
    });

    expect(res.status).toBe(201);
    expect(res.body.message.toLowerCase()).toContain("successfully");
  });

  // TC_AUTH_05 — Register email duplikat
  test("TC_AUTH_05 - Register email duplikat", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "ghaisanikarin@gmail.com",
      password: "password",
      name: "karina ghaisani",
      phoneNumber: "086752553678",
      age: 22,
    });

    expect(res.status).toBe(400);
    expect(res.body.message.toLowerCase()).toContain("email already exists");
  });

  // TC_AUTH_06 — Register data tidak lengkap
  test("TC_AUTH_06 - Register data tidak lengkap", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "ghaisanikari@mail.com",
      password: "password",
      name: "karina ghaisani",
      age: 22,
    });

    expect(res.status).toBe(400);
  });

  // TC_AUTH_07 — Akses users dengan token valid dan role admin
  test("TC_AUTH_07 - Akses users dengan token valid dan role admin", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data.users");
  });

  // TC_AUTH_8 — Akses users dengan token valid dan role user
  test("TC_AUTH_08 - Akses users dengan token valid dan role user", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  // TC_AUTH_09 — Akses users tanpa token
  test("TC_AUTH_09 - Akses users tanpa token", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
  });
});
