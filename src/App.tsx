import { useAppStore } from "@/stores/app";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/base/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/base/select";

function App() {
  const { language, setLanguage } = useAppStore();
  const { t } = useTranslation();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button>Click me</Button>
      <br />
      <div className="flex items-center space-x-4">
        {" "}
        <Select value={language} onValueChange={(value) => setLanguage(value)}>
          {" "}
          <SelectTrigger className="w-[180px]">
            {" "}
            <SelectValue placeholder="選擇語系" />{" "}
          </SelectTrigger>{" "}
          <SelectContent>
            {" "}
            <SelectGroup>
              {" "}
              <SelectLabel>語系</SelectLabel>{" "}
              <SelectItem value="zh-Hans">簡體中文</SelectItem>{" "}
              <SelectItem value="en">English</SelectItem>{" "}
              <SelectItem value="ko-KR">한국어</SelectItem>{" "}
              <SelectItem value="ja-JP">日本語</SelectItem>{" "}
            </SelectGroup>{" "}
          </SelectContent>{" "}
        </Select>{" "}
      </div>
      <br />
      <h1>{t("hello")}</h1>
    </div>
  );
}

export default App;
