import z from "zod";
import http from "@/utils/request";

// 後端的資料格式
const BackendUser = z.object({
  userId: z.string(),
  id: z.number(),
  title: z.string(),
  body: z.string(),
});

// 前端期望的資料格式
const FrontendUser = z.object({
  userId1: z.string(),
  id1: z.number(),
  title1: z.string(),
  body1: z.string(),
});

type User = z.infer<typeof FrontendUser>;

const requestCodec = z.codec(BackendUser, FrontendUser, {
  // 將「後端格式」→「前端格式」
  decode: (b) => {
    return {
      userId1: b.userId,
      title1: b.title,
      body1: b.body,
      id1: b.id,
    };
  },
  // 將「前端格式」→「後端格式」
  encode: (f) => {
    return {
      userId: f.userId1,
      title: f.title1,
      body: f.body1,
      id: f.id1,
    };
  },
});

const responseCodec = z.codec(BackendUser, FrontendUser, {
  // 將「後端格式」→「前端格式」
  decode: (b) => {
    return {
      userId1: b.userId,
      title1: b.title,
      body1: b.body,
      id1: b.id,
    };
  },
  // 將「前端格式」→「後端格式」
  encode: (f) => {
    return {
      userId: f.userId1,
      title: f.title1,
      body: f.body1,
      id: f.id1,
    };
  },
});

export function fakeGet() {
  return http.request({
    url: `/posts/1`,
    method: "get",
  });
}

export function fakePost(data: User) {
  return http.request({
    url: `/posts`,
    method: "post",
    data,
    codec: {
      request: requestCodec,
      response: responseCodec,
    },
  });
}

export function refreshToken() {
  return http.request({
    url: `/refreshToken`,
    method: "get",
  });
}
