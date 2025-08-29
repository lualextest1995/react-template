import React, { useState } from 'react'

export const UsersPage: React.FC = () => {
    const [users] = useState([
        { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
        { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'User' },
    ])

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUsers, setSelectedUsers] = useState<number[]>([])

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleUserSelection = (userId: number) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        )
    }

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">用戶管理</h1>
            <p className="text-muted-foreground">管理系統用戶，測試搜尋和選擇狀態保持</p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">搜尋用戶</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜尋姓名或電子郵件..."
                        className="w-full max-w-md px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3">選擇</th>
                                <th className="text-left p-3">姓名</th>
                                <th className="text-left p-3">電子郵件</th>
                                <th className="text-left p-3">角色</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t hover:bg-muted/20">
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3 text-muted-foreground">{user.email}</td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${
                                                user.role === 'Admin'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedUsers.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800">已選擇 {selectedUsers.length} 個用戶</p>
                    </div>
                )}
            </div>
        </div>
    )
}
