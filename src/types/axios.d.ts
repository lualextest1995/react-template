import 'axios'
import type { ZodTypeAny } from 'zod'

declare module 'axios' {
    export interface AxiosRequestConfig {
        codec?: Codec
        isCodec?: boolean
    }
    export interface InternalAxiosRequestConfig {
        codec?: Codec
        isCodec?: boolean
    }
}

interface Codec {
    request?: {
        frontendSchema: ZodTypeAny
        backendSchema: ZodTypeAny
    }
    response?: {
        frontendSchema: ZodTypeAny
        backendSchema: ZodTypeAny
    }
    dataKeyMap?: Record<string, string>
}
