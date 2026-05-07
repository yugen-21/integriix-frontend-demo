import DailyBrief from "./Components/DailyBrief";
import UnderConstruction from "./Components/UnderConstruction";
import menuItems from "./menu.json";
import PolicyManagement from "./Components/PolicyManagement";
import ReviewerQueue from "./Components/ReviewerQueue";
import OverduePolicies from "./Components/OverduePolicies";
import ComplianceDashboard from "./Components/ComplianceDashboard";
import PolicySearch from "./Components/PolicySearch";

const builtRoutes = [
  { path: "/", element: <DailyBrief /> },
  { path: "/policy-management", element: <PolicyManagement /> },
  { path: "/reviewer-queue", element: <ReviewerQueue /> },
  { path: "/overdue", element: <OverduePolicies /> },
  { path: "/compliance", element: <ComplianceDashboard /> },
  { path: "/search", element: <PolicySearch /> },
];

const builtPaths = new Set(builtRoutes.map((r) => r.path));

const flatMenuItems = menuItems.flatMap((item) => [
  item,
  ...(item.submenu ?? []),
]);

const unavailableRoutes = flatMenuItems
  .filter((item) => !item.url.includes("#") && !builtPaths.has(item.url))
  .map((item) => ({
    path: item.url,
    element: <UnderConstruction sectionName={item.name} />,
  }));

export const routes = [...builtRoutes, ...unavailableRoutes];

export default routes;
