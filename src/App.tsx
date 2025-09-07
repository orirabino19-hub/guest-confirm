import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RSVP from "./pages/RSVP";
import RSVPSimple from "./pages/RSVPSimple";
import OpenRSVP from "./pages/OpenRSVP";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  console.log('🏁 App component loaded');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rsvp/:phone" element={<RSVPSimple />} />
            <Route path="/rsvp/:eventId/:phone" element={<RSVPSimple />} />
            <Route path="/rsvp/:eventId/name/:guestName" element={<RSVPSimple />} />
            <Route path="/rsvp/:eventId/open" element={<OpenRSVP />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
