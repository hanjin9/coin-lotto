import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import MyTickets from "./pages/MyTickets";
import NumberSelection from "./pages/NumberSelection";
import AdminDashboardWithTabs from "./pages/AdminDashboardWithTabs";
import MyPage from "./pages/MyPage";
import LottoPurchase from "./pages/LottoPurchase";
import AnonymousLogin from "./pages/AnonymousLogin";
import { useAuth } from "@/_core/hooks/useAuth";

function Router() {
  const { user, loading } = useAuth();

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* 공개 라우트 */}
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={AnonymousLogin} />

      {/* 보호된 라우트 - 미인증 사용자 자동 리다이렉트 */}
      <Route path={"/tickets"}>
        {user ? <MyTickets /> : <AnonymousLogin />}
      </Route>
      <Route path={"/select"}>
        {user ? <NumberSelection /> : <AnonymousLogin />}
      </Route>
      <Route path={"/purchase"}>
        {user ? <LottoPurchase /> : <AnonymousLogin />}
      </Route>
      <Route path={"/mypage"}>
        {user ? <MyPage /> : <AnonymousLogin />}
      </Route>

      {/* 관리자 전용 라우트 */}
      <Route path={"/admin"}>
        {user && user.role === 'admin' ? <AdminDashboardWithTabs /> : <NotFound />}
      </Route>

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
