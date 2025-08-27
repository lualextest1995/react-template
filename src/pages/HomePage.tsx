import React, { useState } from "react";

export const HomePage: React.FC = () => {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">首頁</h1>
      <p className="text-muted-foreground">
        這是首頁內容，測試 Keep-Alive 功能
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            計數器: {count}
          </label>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            增加
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            文字輸入（測試狀態保持）
          </label>
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
  );
};
