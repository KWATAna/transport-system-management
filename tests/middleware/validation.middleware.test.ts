import { z } from "zod";
import { validateBody, validateQuery } from "../../src/api/middleware/validation.middleware";

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("validation middleware", () => {
  describe("validateBody", () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.coerce.number().int().positive(),
    });

    it("parses and assigns valid body, then calls next", async () => {
      const req: any = { body: { name: "John", age: "30" } };
      const res = createMockRes();
      const next = jest.fn();

      await validateBody(schema)(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ name: "John", age: 30 });
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 400 on validation error", async () => {
      const req: any = { body: { name: "", age: "abc" } };
      const res = createMockRes();
      const next = jest.fn();

      await validateBody(schema)(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Validation failed",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateQuery", () => {
    const schema = z.object({
      limit: z.coerce.number().int().positive().max(100).default(50),
      offset: z.coerce.number().int().min(0).default(0),
      status: z.enum(["pending", "completed"]).optional(),
    });

    it("parses and merges valid query params", async () => {
      const req: any = { query: { limit: "10", status: "pending" } };
      const res = createMockRes();
      const next = jest.fn();

      await validateQuery(schema)(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.limit).toBe(10);
      expect(req.query.offset).toBe(0);
      expect(req.query.status).toBe("pending");
    });

    it("returns 400 on invalid query params", async () => {
      const req: any = { query: { limit: "abc" } };
      const res = createMockRes();
      const next = jest.fn();

      await validateQuery(schema)(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Validation failed",
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
