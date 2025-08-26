import axios, { AxiosHeaders } from "axios";

// 建立 axios instance
const httpClientInstance = axios.create({
  baseURL: "/api",
  timeout: 24 * 60 * 60 * 1000, // 24h
  headers: {
    "Content-Type": "application/json",
    charset: "utf-8",
  },
});

function safeApplyCodec<TIn, TOut>(
  value: TIn,
  fn: (v: TIn) => TOut,
  type: "request" | "response",
  url?: string
) {
  try {
    return fn(value);
  } catch (error) {
    console.warn(
      `路徑${url}${type === "request" ? "請求" : "回應"}資料格式錯誤`,
      error
    );
    return value;
  }
}

// 請求攔截器
httpClientInstance.interceptors.request.use(
  (config) => {
    const { method, data, headers, codec, url } = config;
    const newConfig = { ...config };
    const newHeaders = new AxiosHeaders(headers);
    let newData = { ...data };

    // 使用 zod 進行簡單的請求參數驗證
    if (codec?.request) {
      newData = safeApplyCodec(data, codec.request.encode, "request", url);
    }

    // 根據 HTTP method 自動決定將 data 放置在 params 或 data 字段
    const methodList = ["post", "put", "patch", "delete"];
    const isWrite = methodList.includes((method ?? "").toLowerCase());
    if (isWrite) {
      newConfig.data = newData;
    } else {
      newConfig.params = newData;
    }

    // 添加 JWT token & Language 在 headers 中
    newHeaders.set("x-access-token", "123456");
    newHeaders.set("x-locale", "zh-TW");
    newConfig.headers = newHeaders;

    return newConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器
httpClientInstance.interceptors.response.use(
  (response) => {
    // 使用 zod 進行簡單的回應資料驗證
    const codec = response.config.codec;
    if (codec?.response) {
      return safeApplyCodec(
        response.data,
        codec.response.decode,
        "response",
        response.config.url
      );
    }
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default httpClientInstance;
