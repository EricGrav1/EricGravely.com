import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/home";
import About from "@/pages/about";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import ThankYou from "@/pages/thank-you";
import Coaching from "@/pages/coaching";
import Assessment from "@/pages/assessment";
import Unsubscribe from "@/pages/unsubscribe";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
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
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
