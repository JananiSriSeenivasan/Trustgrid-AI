import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/Dashboard";
import Assets from "../pages/Assets";
import Vulnerabilities from "../pages/Vulnerabilities";
import RiskAnalysis from "../pages/RiskAnalysis";
import Recommendations from "../pages/Recommendations";
import History from "../pages/History";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "assets",
        element: <Assets />,
      },
      {
        path: "vulnerabilities",
        element: <Vulnerabilities />,
      },
      {
        path: "risk",
        element: <RiskAnalysis />,
      },
      {
        path: "recommendations",
        element: <Recommendations />,
      },
      {
        path: "history",
        element: <History />,
      },
    ],
  },
]);

export default router;
