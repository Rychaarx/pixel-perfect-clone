import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Suggestions from "./pages/Suggestions";
import Agenda from "./pages/Agenda";
import Feedback from "./pages/Feedback";
import ProfileSelect from "./pages/ProfileSelect";
import TitleDetails from "./pages/TitleDetails";
import Admin from "./pages/Admin";
import BuscaPage from "./pages/BuscaPage";
import ListaPage from "./pages/ListaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/sugestoes" element={<Suggestions />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/login" element={<Login />} />
            <Route path="/perfis" element={<ProfileSelect />} />
            <Route path="/titulo/:id" element={<TitleDetails />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/buscar" element={<BuscaPage />} />
            <Route path="/lista" element={<ListaPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
