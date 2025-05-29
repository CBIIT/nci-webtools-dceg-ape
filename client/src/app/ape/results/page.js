"use client";

import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import Status from "../../../components/status";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [status, setStatus] = useState(null);
  const [seerData, setSeerData] = useState(null);

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/data/output/${id}/status.json`);
        const data = await res.json();

        setStatus(data.status);
        setSeerData(data.seerData || null);

        if (["COMPLETED", "FAILED"].includes(data.status?.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to fetch job status:", err);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="flex-grow-1 bg-light py-4">
      <Container>
        <h3>Results</h3>
      <div>
        <strong>Job ID:</strong> {id}
      </div>

      <Status status={status} seerData={seerData} />
      </Container>    
    
    </div>
  );
}
