import SiteSearch from "./site-search.jsx";
import Image from "next/image.js";

export default function Header() {
  return (
    <header>
      <include-html src="https://cbiit.github.io/nci-softwaresolutions-elements/banners/government-shutdown.html"></include-html>
      <div className="container my-2 my-md-4 mb-1 d-flex flex-wrap justify-content-between align-items-baseline">
        <a
          className="d-inline-block"
          rel="noopener noreferrer"
          href="https://www.cancer.gov/"
        >
          <Image
            src={`/assets/nci-dceg-logo.svg`}
            height="60"
            alt="National Cancer Institute Logo"
            className="mw-100"
            width={675}
            unoptimized
          />
        </a>
        <SiteSearch className="my-2" />
      </div>
      <div className="d-none d-md-block bg-primary-dark text-white py-1">
        <div className="container">
          <h1 className="h5 fw-normal">APE</h1>
        </div>
      </div>
    </header>
  );
}
