import { BrowserRouter } from "react-router-dom";
import { AuthGate } from "./AuthGate";

export function App() {
  const basename = window.location.pathname.startsWith("/sws-fleet") ? "/sws-fleet" : undefined;
  return (
    <BrowserRouter basename={basename}>
      <AuthGate />
    </BrowserRouter>
  );
}
