import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useRouteStore } from "@/stores/route";
import Layout from "@/layout/TabsLayout";
import Test from "@/pages/testPage";

const queryClient = new QueryClient();

function App() {
  const { routes, addRoute, removeRoute } = useRouteStore();

  // 動態路由測試
  React.useEffect(() => {
    // 3秒後添加測試頁面路由
    const addTimer = setTimeout(() => {
      console.log("添加測試頁面路由");
      addRoute({
        id: "test",
        path: "/test",
        title: "測試頁面",
        component: Test,
      });
    }, 3000);

    // 15秒後刪除測試頁面路由
    const removeTimer = setTimeout(() => {
      console.log("刪除測試頁面路由");
      removeRoute("test");
    }, 15000);

    return () => {
      clearTimeout(addTimer);
      clearTimeout(removeTimer);
    };
  }, [addRoute, removeRoute]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {routes.map((route) => {
              const Component = route.component;
              if (route.path === "/") {
                return <Route key={route.id} index element={<Component />} />;
              }
              return (
                <Route
                  key={route.id}
                  path={route.path.slice(1)} // 移除開頭的 /
                  element={<Component />}
                />
              );
            })}
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
