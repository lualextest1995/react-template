import React, { useState } from 'react'

export const DashboardPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert(`提交的資料: ${JSON.stringify(formData, null, 2)}`)
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">儀表板</h1>
            <p className="text-muted-foreground">這是儀表板頁面，包含表單狀態測試</p>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium mb-2">姓名</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">電子郵件</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">訊息</label>
                    <textarea
                        value={formData.message}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, message: e.target.value }))
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                    提交
                </button>
            </form>
        </div>
    )
}
