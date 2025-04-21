"use client";
import { Suspense } from "react";
import Script from "next/script";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import Alert from "react-bootstrap/Alert";
import Loading from "@/components/loading";
import GoogleAnalytics from "@/components/analytics";
import Header from "@/components/header";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import "./styles/main.scss";

export default function RootLayout({ children }) {
  const routes = [
    { title: "Home", path: "/", subRoutes: [] },
    { title: "APE", path: "/ape", subRoutes: [] },
    { title: "Help", path: "/help", subRoutes: [] },
  ];
  const queryClient = new QueryClient({});

  return (
    <html lang="en">
      <head>
        <title>APE</title>
        <meta name="keywords" content="ape" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <GoogleAnalytics id="tba" />
        <Script src="https://cbiit.github.io/nci-softwaresolutions-elements/components/include-html.js"></Script>
      </head>
      <body className="d-flex flex-column vh-100">
        <Header />
        <main className="position-relative d-flex flex-column flex-grow-1 align-items-stretch">
          <Navbar routes={routes} />
          <ErrorBoundary
            fallback={<Alert variant="warning">Error loading Form</Alert>}
          >
            <Suspense fallback={<Loading />}>
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
      </body>
    </html>
  );
}
