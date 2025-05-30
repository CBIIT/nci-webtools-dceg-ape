"use client";

import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import Status from "../../../components/status";
import { getStatus } from "@/services/queries";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [status, setStatus] = useState(null);
  const [seerData, setSeerData] = useState(null);

  useEffect(() => {
    if (!id) return;

    const poll = async () => {
      try {
        const data = await getStatus(id); // uses /api/status/:id
        setStatus(data);                 // contains { status: "...", ... }
        setSeerData(data.seerData || null);

        if (["COMPLETED", "FAILED"].includes(data.status)) {
          clearInterval(interval); // stop polling
        }
      } catch (err) {
        console.error("Failed to fetch job status:", err);
        clearInterval(interval);
      }
    };

    const interval = setInterval(poll, 3000); // poll every 3 seconds
    poll(); // trigger once immediately
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
