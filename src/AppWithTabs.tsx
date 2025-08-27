import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TabSystemApp } from "./components/layout/TabSystemApp";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TabSystemApp />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
