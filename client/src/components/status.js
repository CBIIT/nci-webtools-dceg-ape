import { Spinner, Alert } from "react-bootstrap";

export default function Status({  status }) {
  console.log("Status component rendered with:", {  status });
  return (
    <div className="shadow border rounded bg-white p-3">
      <div className="mb-2">
        <strong>Status:</strong> {status?.status || "Loading..."}
      </div>

      {status?.status === "SUBMITTED" && <div>Your job has been submitted.</div>}

      {status?.status === "IN_PROGRESS" && (
        <div className="text-center">
          <Spinner variant="primary" animation="border" role="status" aria-hidden="true" />
          <div>Calculating...</div>
        </div>
      )}

      {status?.status === "FAILED" && (
        <Alert variant="danger" className="mt-2">
          <div>
            An error has occurred. Please ensure the input file(s) is in the correct format and/or correct
            parameters were chosen.
          </div>
          <div>
            For further assistance, please contact us at:{" "}
            <a href="mailto:NCIJPSurvWebAdmin@mail.nih.gov">NCIJPSurvWebAdmin@mail.nih.gov</a>
          </div>
        </Alert>
      )}

      {status?.status === "COMPLETED" && (
        <div className="alert alert-success">Job completed successfully.</div>
      )}
    </div>
  );
}
