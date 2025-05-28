// app/results/[id]/page.js
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Status from "@/app/ape/status";


export default function ResultsPage() {
  const { id } = useParams();
  const [status, setStatus] = useState(null);
  const [seerData, setSeerData] = useState(null);

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();
        setStatus(data.status);
        setSeerData(data.seerData || null);

        if (["COMPLETED", "FAILED"].includes(data.status?.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to fetch status:", err);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="container py-4">
      <h3>Job Status</h3>
      <div>
        <strong>Job ID:</strong> {id}
      </div>
      <Status status={status} seerData={seerData} />

      {status?.status === "COMPLETED" && (
        <div className="mt-4">
          <h5>Results:</h5>
          <pre>{JSON.stringify(seerData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
