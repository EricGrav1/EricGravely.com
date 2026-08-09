import { useLayoutEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/home";
import About from "@/pages/about";
import Bio from "@/pages/bio";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import ThankYou from "@/pages/thank-you";
import Coaching from "@/pages/coaching";
import Assessment from "@/pages/assessment";
import Unsubscribe from "@/pages/unsubscribe";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function ScrollRestoration() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1);

    if (hash) {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(decodeURIComponent(hash))?.scrollIntoView();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/bio" component={Bio} />
      <Route path="/products" component={Products} />
      <Route path="/products/:slug" component={ProductDetail} />
      <Route path="/thank-you" component={ThankYou} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ScrollRestoration />
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
