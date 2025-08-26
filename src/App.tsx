import { useAppStore } from "@/stores/app";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/base/button";
import { fakeGet, fakePost } from "@/apis/global/user";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/base/select";

const queryClient = new QueryClient();

function App() {
  const { language, setLanguage } = useAppStore();
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-svh flex-col items-center justify-center">
        <InnerApp />
        <br />
        <div className="flex items-center space-x-4">
          {" "}
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value)}
          >
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
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

function InnerApp() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["fakeGet"],
    queryFn: () => fakeGet(),
  });

  const { mutateAsync } = useMutation({
    mutationFn: () =>
      fakePost({
        userId1: "u123",
        title1: "Post Title",
        body1: "Post Body",
        id1: 1,
      }),
    onSuccess: (data) => {
      console.log("Data posted successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["fakeGet"] });
    },
    onError: (error) => {
      console.error("Error posting data:", error);
    },
  });

  return (
    <>
      <div>Data: {JSON.stringify(data)}</div>
      <Button onClick={() => mutateAsync()}>Click me</Button>
    </>
  );
}

export default App;
