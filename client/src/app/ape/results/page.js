"use client";

import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useSearchParams } from "next/navigation";
import Status from "../../../components/status";
import { getStatus } from "@/services/queries";
import { useQuery } from "@tanstack/react-query";


export default function ResultsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const {
    data: status,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["status", id],
    queryFn: () => getStatus(id),
    enabled: !!id,
    refetchInterval: (queryData) => {
      // Only keep polling if the job is still in progress
      const s = queryData?.status;
      if (s === "COMPLETED" || s === "FAILED") return false;
      return 3000; // poll every 3 seconds
    },
  });

  return (
    <div className="flex-grow-1 bg-light py-4">
      <Container>
        <h3>Results</h3>
      <div>
        <strong>Job ID:</strong> {id}
      </div>

      {isLoading && <div>Checking job status...</div>}
      {isError && <div>Error fetching job status.</div>}
      {!isLoading && !isError && <Status status={status} />}
      </Container>    
    
    </div>
  );
}
