import { useMutation } from '@tanstack/react-query'
import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/apis/global/user'
import { useUserStore } from '@/stores/user'

type FormData = {
    email: string
    password: string
}

export const LoginPage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({ email: '', password: '' })
    const [error, setError] = useState<string>('')
    const navigate = useNavigate()
    const setUser = useUserStore((s) => s.setUser)

    const { mutateAsync, isPending } = useMutation({
        mutationFn: (data: FormData) => login(data),
        // onSuccess: (data) => {
        //     setUser(data.user)
        //     navigate('/', { replace: true })
        // },
        // onError: (err) => {
        //     setError(getErrorMessage(err))
        // },
        onSettled: () => {
            setUser({
                id: '1',
                username: 'admin',
                name: '管理員',
            })
            navigate('/', { replace: true })
            console.log('登入請求已完成')
        },
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (error) {
            setError('')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // 最小必要驗證
        if (!formData.email || !formData.password) {
            setError('請填寫所有必填欄位')
            return
        }
        setError('')
        // 交給 react-query
        await mutateAsync(formData)
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">歡迎回來</h1>
                <p className="text-gray-600">請登入您的帳號</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                    <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        帳號
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="text"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isPending}
                        aria-invalid={!!error}
                        aria-describedby={error ? 'login-error' : undefined}
                        placeholder="請輸入帳號"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        密碼
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isPending}
                        aria-invalid={!!error}
                        aria-describedby={error ? 'login-error' : undefined}
                        placeholder="請輸入密碼"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                {error && (
                    <div
                        id="login-error"
                        className="bg-red-50 border border-red-200 rounded-md p-3"
                    >
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {isPending ? '登入中...' : '登入'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    測試帳號：<code className="bg-gray-100 px-1 rounded">admin</code> / 密碼：
                    <code className="bg-gray-100 px-1 rounded">password</code>
                </p>
            </div>
        </div>
    )
}
