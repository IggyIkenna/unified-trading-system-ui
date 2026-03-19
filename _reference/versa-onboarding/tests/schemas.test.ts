import { describe, it, expect } from "vitest";
import {
  userAccessSchema,
  clientSchema,
  groupSchema,
  presentationSchema,
  userRoleSchema,
} from "@/lib/schemas";

describe("userAccessSchema", () => {
  it("parses valid user access data", () => {
    const data = {
      groupIds: ["g1", "g2"],
      presentationIds: ["p1"],
      clientId: "c1",
    };
    expect(userAccessSchema.parse(data)).toEqual(data);
  });

  it("allows all fields to be missing", () => {
    expect(userAccessSchema.parse({})).toEqual({});
  });

  it("rejects invalid groupIds type", () => {
    expect(() => userAccessSchema.parse({ groupIds: "not-array" })).toThrow();
  });
});

describe("clientSchema", () => {
  it("parses client with presentationIds", () => {
    expect(clientSchema.parse({ presentationIds: ["p1"] })).toEqual({
      presentationIds: ["p1"],
    });
  });

  it("allows empty object", () => {
    expect(clientSchema.parse({})).toEqual({});
  });
});

describe("groupSchema", () => {
  it("parses folder group", () => {
    const data = { isFolderGroup: true, folderName: "q1-2026" };
    expect(groupSchema.parse(data)).toEqual(data);
  });

  it("parses regular group with presentationIds", () => {
    const data = { presentationIds: ["p1", "p2"] };
    expect(groupSchema.parse(data)).toEqual(data);
  });
});

describe("presentationSchema", () => {
  it("parses valid presentation", () => {
    const data = { title: "Q1 Report", gcsPath: "presentations/q1.html" };
    expect(presentationSchema.parse(data)).toEqual(data);
  });

  it("rejects missing title", () => {
    expect(() =>
      presentationSchema.parse({ gcsPath: "presentations/q1.html" }),
    ).toThrow();
  });

  it("rejects missing gcsPath", () => {
    expect(() => presentationSchema.parse({ title: "Q1 Report" })).toThrow();
  });
});

describe("userRoleSchema", () => {
  it("parses admin role", () => {
    expect(userRoleSchema.parse({ role: "admin" })).toEqual({ role: "admin" });
  });

  it("allows missing role", () => {
    expect(userRoleSchema.parse({})).toEqual({});
  });
});
