import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Room from "./pages/Room";
import Profile from "./pages/Profile";
import History from "./pages/History";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/room/:roomId" element={<Room />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/history" element={<History />} />
    </Routes>
  );
}

export default App
