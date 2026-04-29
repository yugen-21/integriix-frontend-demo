import DailyBrief from "./Components/DailyBrief";
import UnderConstruction from "./Components/UnderConstruction";
import menuItems from "./menu.json";

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
  ...unavailableRoutes,
];

export default routes;
