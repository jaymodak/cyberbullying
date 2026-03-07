import React from 'react';
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Resources from "./pages/Resources";
import Laws from "./pages/Laws";
import Videos from "./pages/Videos";

function App() {
  return (
    <Routes>
      {/* Landing page — no Layout wrapper (has its own nav/footer) */}
      <Route path="/" element={<Landing />} />

      {/* App pages — wrapped in Layout */}
      <Route element={<Layout />}>
        <Route path="/app"       element={<Home />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/laws"      element={<Laws />} />
        <Route path="/videos"    element={<Videos />} />
      </Route>
    </Routes>
  );
}

export default App;