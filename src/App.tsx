import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Day1 from "./pages/Day1";
import Day2 from "./pages/Day2";
import Day3 from "./pages/Day3";
import Day4 from "./pages/Day4";
import Project from "./pages/Project";
import Cheatsheet from "./pages/Cheatsheet";
import Resources from "./pages/Resources";
import ModelEvaluation from "./pages/ModelEvaluation";
import ChatPanel from "./components/ChatPanel";

export default function App() {
  return (
    <BrowserRouter>
      <ChatPanel />
      <div className="layout">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/day/1" element={<Day1 />} />
            <Route path="/day/2" element={<Day2 />} />
            <Route path="/day/3" element={<Day3 />} />
            <Route path="/day/4" element={<Day4 />} />
            <Route path="/project" element={<Project />} />
            <Route path="/model-evaluation" element={<ModelEvaluation />} />
            <Route path="/cheatsheet" element={<Cheatsheet />} />
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
