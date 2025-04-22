import { Container, Row, Col } from "react-bootstrap";
export default function about() {
  return (
    <div className="flex-grow-1 bg-light py-4">
      <Container fluid="xl">
        <Row>
          <Col>
            <article>
              <h1 className="fs-1 fw-light">About APE </h1>
              <hr />
            </article>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
