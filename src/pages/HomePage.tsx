import type React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/base/button'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/base/select'
import { useAppStore } from '@/stores/app'

export const HomePage: React.FC = () => {
    const [count, setCount] = useState(0)
    const [text, setText] = useState('')
    const { language, setLanguage } = useAppStore()
    const { t } = useTranslation()

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">首頁</h1>
            <p className="text-muted-foreground">這是首頁內容，測試 Keep-Alive 功能</p>

            <div className="flex items-center space-x-4">
                {' '}
                <Select value={language} onValueChange={(value) => setLanguage(value)}>
                    {' '}
                    <SelectTrigger className="w-[180px]">
                        {' '}
                        <SelectValue placeholder="選擇語系" />{' '}
                    </SelectTrigger>{' '}
                    <SelectContent>
                        {' '}
                        <SelectGroup>
                            {' '}
                            <SelectLabel>語系</SelectLabel>{' '}
                            <SelectItem value="zh-Hans">簡體中文</SelectItem>{' '}
                            <SelectItem value="en">English</SelectItem>{' '}
                            <SelectItem value="ko-KR">한국어</SelectItem>{' '}
                            <SelectItem value="ja-JP">日本語</SelectItem>{' '}
                        </SelectGroup>{' '}
                    </SelectContent>{' '}
                </Select>{' '}
            </div>
            <br />
            <h1>{t('hello')}</h1>

            <div className="space-y-4">
                <div>
                    <p className="block text-sm font-medium mb-2">計數器: {count}</p>
                    <Button onClick={() => setCount((c) => c + 1)}>增加</Button>
                </div>

                <div>
                    <p className="block text-sm font-medium mb-2">文字輸入（測試狀態保持）</p>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="輸入一些文字..."
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>
        </div>
    )
}
