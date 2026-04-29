import Base from "./layout/base";
import routes from "./routes";
import UnderConstruction from "./Components/UnderConstruction";

function App() {
  const activeRoute = routes.find(
    (route) => route.path === window.location.pathname,
  );

  return (
    <Base>
      {activeRoute?.element ?? (
        <UnderConstruction sectionName="This page" />
      )}
    </Base>
  );
}

export default App;
