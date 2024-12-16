import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./pages/Home/Home";
import Activate from "./pages/Activate/Activate";
import { Authenticate } from "./pages/Authenticate/Authenticate";
import Rooms from "./pages/Rooms/Rooms";
import { useSelector } from "react-redux";
import { useLoadingWithRefresh } from "./hooks/useLoadingWithRefresh";
import Navigation from "./components/shared/Navigation/Navigation";
import Loader from "./components/shared/Loader/Loader";
import Room from "./pages/Room/Room";
function App() {
  const { loading } = useLoadingWithRefresh();
  return loading ? (
    <Loader message="Loading, please wait.." />
  ) : (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route
          path="/"
          element={
            <GuestRoute>
              <Home />
            </GuestRoute>
          }
        />
        <Route
          path="/Authenticate"
          element={
            <GuestRoute>
              <Authenticate />
            </GuestRoute>
          }
        />
        <Route
          path="/Activate"
          element={
            <SemiProtected>
              <Activate />
            </SemiProtected>
          }
        />
        <Route
          path="/Rooms"
          element={
            <Protected>
              <Rooms />
            </Protected>
          }
        />
        <Route
          path="/room/:id"
          element={
            <Protected>
              <Room />
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

const GuestRoute = ({ children }) => {
  const { isAuth } = useSelector((state) => state.auth);
  return isAuth ? <Navigate to="/Rooms" /> : children;
};

const SemiProtected = ({ children }) => {
  const { user, isAuth } = useSelector((state) => state.auth);
  return !isAuth ? (
    <Navigate to="/" />
  ) : isAuth && !user.activated ? (
    children
  ) : (
    <Navigate to="/Rooms" />
  );
};
const Protected = ({ children }) => {
  const { user, isAuth } = useSelector((state) => state.auth);
  return !isAuth ? (
    <Navigate to="/" />
  ) : isAuth && !user.activated ? (
    <Navigate to="/Activate" />
  ) : (
    children
  );
};

export default App;
