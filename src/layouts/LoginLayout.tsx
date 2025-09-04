import type React from 'react'
import { Outlet } from 'react-router-dom'

const LoginLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </div>
    )
}

export default LoginLayout
