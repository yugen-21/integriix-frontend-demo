import DailyBrief from "./Components/DailyBrief";
import UnderConstruction from "./Components/UnderConstruction";
import menuItems from "./menu.json";
import PolicyManagement from "./Components/PolicyManagement";

const unavailableRoutes = menuItems
  .filter((item) => item.url !== "/")
  .map((item) => ({
    path: item.url,
    element: <UnderConstruction sectionName={item.name} />,
  }));

export const routes = [
  {
    path: "/",
    element: <DailyBrief />,
  },
  {
    path: "/policy-management",
    element: <PolicyManagement />,
  },
  ...unavailableRoutes,
];

export default routes;
