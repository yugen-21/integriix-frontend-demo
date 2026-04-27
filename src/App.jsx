import Base from "./layout/base";
import routes from "./routes";

function App() {
  const activeRoute = routes.find(
    (route) => route.path === window.location.pathname,
  );

  return <Base>{activeRoute?.element ?? null}</Base>;
}

export default App;
