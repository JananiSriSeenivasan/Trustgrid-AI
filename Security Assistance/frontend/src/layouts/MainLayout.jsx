import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import AIChatDrawer from "../components/chat/AIChatDrawer";
import { useTheme } from "../context/ThemeContext";

function MainLayout() {
  const { theme } = useTheme();

  return (
    <div
      className={`w-full h-screen flex overflow-hidden transition-colors ${
        theme === "dark"
          ? "bg-[#0b1120] text-slate-200"
          : "bg-[#f5f7fa] text-slate-900"
      }`}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main application */}
      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        <Header />

        <main
          className={`flex-1 min-h-0 overflow-y-auto ${
            theme === "dark"
              ? "bg-[#0b1120]"
          : "bg-[#f5f7fa]"
          }`}
        >
          <div className="w-full max-w-[1800px] mx-auto p-5 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <AIChatDrawer />
    </div>
  );
}

export default MainLayout;
