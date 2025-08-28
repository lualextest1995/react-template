import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useRouteStore } from "@/stores/route";
import { requireAuth } from "@/utils/auth";
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
        layout: Layout,
        component: Test,
        loader: requireAuth,
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

  // 創建路由配置
  const router = React.useMemo(() => {
    return createBrowserRouter(
      routes.map((route) => {
        const Component = route.component;
        const RouteLayout = route.layout;
        
        return {
          path: route.path,
          loader: route.loader,
          element: <RouteLayout />,
          children: [
            {
              index: route.path === "/",
              path: route.path === "/" ? undefined : "",
              element: <Component />,
            },
          ],
        };
      })
    );
  }, [routes]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
