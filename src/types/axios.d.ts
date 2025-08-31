import 'axios'
import type { ZodTypeAny } from 'zod'

declare module 'axios' {
    export interface AxiosRequestConfig {
        codec?: Codec
    }
    export interface InternalAxiosRequestConfig {
        codec?: Codec
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
