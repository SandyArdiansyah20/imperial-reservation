import { BrowserRouter, Routes, Route } from "react-router-dom";
import CustomerApp from "./CustomerApp.jsx";
import StaffApp from "./StaffApp.jsx";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerApp />} />
        <Route path="/staff" element={<StaffApp />} />
      </Routes>
    </BrowserRouter>
  );
}