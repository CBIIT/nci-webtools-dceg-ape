import Link from "next/link";
import { Container, Row, Col } from "react-bootstrap";

export default function Home() {
  return (
    <>
      <div className="bg-black flex-grow-1">
        <Container>
          <Row>
            <Col md={6}>
              <div
                className="d-flex h-100 align-items-center"
                style={{ minHeight: "300px" }}
              >
                <div>
                  <h1 className="fs-1 text-light fw-light mb-3">APE</h1>
                  <hr className="border-white" />
                  <p className="lead text-light">
                    Anatomically Predictive Extension
                  </p>

                  <Link className="link-secondary" href="/ape">
                    Analyze
                  </Link>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <video autoPlay loop muted className="w-100">
                <source src="/assets/background.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Col>
          </Row>
        </Container>
      </div>
      <div className="bg-light py-5 flex-grow-1">
        <Container>
          <Row>
            <Col>
              <p>
                This tool is designed to assist researchers and clinicians in
                analyzing CT scans by providing a user-friendly interface for
                extending partial-body scans.
              </p>
              <p>
                User uploaded CT Scans are first processed by{" "}
                <a href="https://totalsegmentator.com/" target="_blank">
                  TotalSegmentator
                </a>{" "}
                to identify segments of anatomical structures. APE then extends
                these scans by referencing similar anatomical structures.
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}
