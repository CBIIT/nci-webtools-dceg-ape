"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import clsx from "clsx";
import NavDropdown from "react-bootstrap/NavDropdown";

function pathsMatch(path1, path2) {
  // remove trailing slash
  path1 = path1.replace(/\/$/, "");
  path2 = path2.replace(/\/$/, "");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return [path2, basePath + path2].includes(path1);
}

export default function AppNavbar({ routes = [] }) {
  const pathName = usePathname();

  return (
    <Navbar className="bg-black bg-md-transparent" variant="dark" expand="md">
      <Container className="position-relative">
        <Navbar.Brand
          as={Link}
          href="/"
          className="d-flex d-md-none text-light"
        >
          <h1 className="h5 fw-normal">
            APE
            <span className="fw-semibold small text-secondary">
              Anatomically Predictive Extension
            </span>
          </h1>
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="navbar-nav"
          className="px-0 py-3 text-uppercase outline-0 border-0 shadow-0"
        >
          <i className="bi bi-list me-1"></i>
          Menu
        </Navbar.Toggle>
        <Navbar.Collapse
          id="navbar-nav"
          className="align-items-stretch w-100 position-absolute position-md-relative z-3 mt-5 mt-md-0 top-0 start-0 mt-5 border-light border-md-black"
        >
          <Nav className="me-auto">
            {routes.map((route, i) =>
              route.dropdown ? (
                <NavDropdown
                  title={route.title}
                  id={`nav-dropdown-${route.path}`}
                  key={route.path + i}
                >
                  {route.dropdown.map((subRoute) => (
                    <NavDropdown.Item
                      key={subRoute.path}
                      href={subRoute.path}
                      className={clsx(
                        pathsMatch(pathName, subRoute.path) && "active"
                      )}
                    >
                      {subRoute.title}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              ) : (
                <Link
                  className={clsx(
                    "nav-link",
                    pathsMatch(pathName, route.path) && "active"
                  )}
                  key={route.path}
                  href={route.path}
                >
                  {route.title}
                </Link>
              )
            )}
          </Nav>
          {/* <NavbarSearch /> */}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
