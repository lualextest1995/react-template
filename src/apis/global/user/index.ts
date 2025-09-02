// apis/user.ts
import z from 'zod'
import http from '@/utils/request'

/** ---------- 共同的 ApiResponse union ---------- */
const DetailsSchema = z.object({
    trace_id: z.string(),
})

const SuccessResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        details: DetailsSchema,
        data: dataSchema,
    })

const ErrorResponse = () =>
    z.object({
        code: z.string(),
        details: DetailsSchema,
        message: z.string(),
    })

export const ApiResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.union([SuccessResponse(dataSchema), ErrorResponse()])

/** ---------- initialToken ---------- */
// data schema
const InitialTokenResponseDataFrontendSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
})
const InitialTokenResponseDataBackendSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
})

// union schema
const InitialTokenResponseFrontendSchema = ApiResponse(InitialTokenResponseDataFrontendSchema)
const InitialTokenResponseBackendSchema = ApiResponse(InitialTokenResponseDataBackendSchema)

// key map（只針對 data 內的鍵，有遞迴效果）
const tokenKeyMapInitial = {
    access_token: 'accessToken',
    refresh_token: 'refreshToken',
} as const

export type InitialTokenResponse = z.infer<typeof InitialTokenResponseFrontendSchema>

export function initialToken() {
    return http.request<InitialTokenResponse>({
        url: `/authorization/initialToken`,
        method: 'get',
        codec: {
            response: {
                // 後端回來先以 backendSchema 驗證
                backendSchema: InitialTokenResponseBackendSchema,
                // 再映射鍵、最後以 frontendSchema 驗證
                frontendSchema: InitialTokenResponseFrontendSchema,
            },
            dataKeyMap: tokenKeyMapInitial,
        },
    })
}

/** ---------- refreshToken ---------- */
// data schema
const RefreshTokenResponseDataFrontendSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
})
const RefreshTokenResponseDataBackendSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
})

// union schema
const RefreshTokenResponseFrontendSchema = ApiResponse(RefreshTokenResponseDataFrontendSchema)
const RefreshTokenResponseBackendSchema = ApiResponse(RefreshTokenResponseDataBackendSchema)

// key map（只針對 data 內的鍵，有遞迴效果）
const tokenKeyMap = {
    access_token: 'accessToken',
    refresh_token: 'refreshToken',
} as const

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseFrontendSchema>

export function refreshToken() {
    return http.request<RefreshTokenResponse>({
        url: `/authorization/refreshToken`,
        method: 'get',
        codec: {
            response: {
                // 後端回來先以 backendSchema 驗證
                backendSchema: RefreshTokenResponseBackendSchema,
                // 再映射鍵、最後以 frontendSchema 驗證
                frontendSchema: RefreshTokenResponseFrontendSchema,
            },
            dataKeyMap: tokenKeyMap,
        },
    })
}

/** ---------- login ---------- */
// request data schema（keys 相同，無需 keyMap）
const LoginRequestFrontendSchema = z.object({
    email: z.string(),
    password: z.string(),
})
const LoginRequestBackendSchema = z.object({
    email: z.string(),
    password: z.string(),
})

// response data/union schema（沿用 token）
const LoginResponseDataFrontendSchema = RefreshTokenResponseDataFrontendSchema
const LoginResponseDataBackendSchema = RefreshTokenResponseDataBackendSchema

const LoginResponseFrontendSchema = ApiResponse(LoginResponseDataFrontendSchema)
const LoginResponseBackendSchema = ApiResponse(LoginResponseDataBackendSchema)

export type LoginRequest = z.infer<typeof LoginRequestFrontendSchema>
export type LoginResponse = z.infer<typeof LoginResponseFrontendSchema>

export function login(data: LoginRequest) {
    return http.request<LoginResponse>({
        url: `/player/login`,
        method: 'post',
        data,
        codec: {
            request: {
                frontendSchema: LoginRequestFrontendSchema,
                backendSchema: LoginRequestBackendSchema,
            },
            response: {
                backendSchema: LoginResponseBackendSchema,
                frontendSchema: LoginResponseFrontendSchema,
            },
            dataKeyMap: tokenKeyMap, // 只影響 response 裡 data 的鍵（access_token⇄accessToken）
        },
    })
}

/** ---------- logout ---------- */
// 回傳 data 是 string，無鍵轉需求
const LogoutResponseDataFrontendSchema = z.string()
const LogoutResponseDataBackendSchema = z.string()

const LogoutResponseFrontendSchema = ApiResponse(LogoutResponseDataFrontendSchema)
const LogoutResponseBackendSchema = ApiResponse(LogoutResponseDataBackendSchema)

export type LogoutResponse = z.infer<typeof LogoutResponseFrontendSchema>

export function logout() {
    return http.request<LogoutResponse>({
        url: `/player/logout`,
        method: 'post',
        codec: {
            response: {
                backendSchema: LogoutResponseBackendSchema,
                frontendSchema: LogoutResponseFrontendSchema,
            },
            // 沒有 key 差異就不傳 dataKeyMap
        },
    })
}
