import { login, logout } from "../services/AuthService";
import db from "../dist/db/models/index.js";
import bcrypt from "bcrypt";

jest.mock("../dist/db/models/index.js");
jest.mock("bcrypt");
describe("Testing AuthService", () => {
  let mockSessionFindOne = jest.fn();
  let mockSessionCreate = jest.fn();
  let mockUserFindOne = jest.fn();
  let mockBcrypt = jest.fn();

  beforeAll(() => {
    db.Session.findOne = mockSessionFindOne;
    db.Session.create = mockSessionCreate;
    db.User.findOne = mockUserFindOne;
    bcrypt.compareSync = mockBcrypt;
  });

  describe("Test logout()", () => {
    test("logout should return 200 code", async () => {
      mockSessionFindOne.mockResolvedValue({
        expiration: "",
        save: () => {},
      });
      expect(await logout("fakeToken")).toStrictEqual({
        code: 200,
        message: "Logged out",
      });
    });
  });
  describe("Test login()", () => {
    test("login should return 401 code with email not exist", async () => {
      mockUserFindOne.mockResolvedValue(null);
      expect(await login("fakeEmail", "fakePassword")).toStrictEqual({
        code: 401,
        message: "Unauthorized",
      });
    });
    test("login should return 401 code with wrong password", async () => {
      mockUserFindOne.mockResolvedValue({
        password: "fakePassword2",
      });
      expect(await login("fakeEmail", "fakePassword")).toStrictEqual({
        code: 401,
        message: "Unauthorized",
      });
    });
    test("login should return 200 code", async () => {
      mockUserFindOne.mockResolvedValue({
        name: "fakeName",
        email: "fakeEmail",
        id: 1,
        password: "fakePassword2131",
      });
      mockBcrypt.mockResolvedValue(true);
      expect(await login("fakeEmail", "fakePassword")).toStrictEqual({
        code: 200,
        message: expect.any(String),
      });
    });
  });
});
