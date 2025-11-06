"use client";
import { Container, Card, Row, Col, Form, Button, ProgressBar, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, useIsMutating } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { useRouter, usePathname } from "next/navigation";
import { submit, upload } from "@/services/queries";
import * as dicomParser from "dicom-parser";

export default function ApeForm() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const router = useRouter();

  const submitForm = useMutation({
    mutationKey: "submit",
    mutationFn: ({ params }) => submit(params.id, params),
    onSettled: (data, error) => {
      if (error) setFormError(error.response.data.error);
      else if (data) setFormError(null);
    },
  });
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [formError, setFormError] = useState(null);

  function numberInputOnWheelPreventChange(e) {
    // Prevent the input value change
    e.target.blur();
    e.stopPropagation();
    setTimeout(() => {
      e.target.focus();
    }, 0);
  }

  async function onSubmit(formData) {
    console.log("Mock form data: ", formData);
    setFormError(null);
    const id = uuidv4();

    try {
      // Upload files in 5MB chunks
      const CHUNK_SIZE = 5 * 1024 * 1024;
      const totalFiles = formData.files.length;
      let filesUploaded = 0;

      for (const file of formData.files) {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
          const chunk = file.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, file.size));
          const data = new FormData();
          data.append("files", chunk, file.name);
          data.append("id", id);
          data.append("originalFileName", file.name);
          data.append("fileSize", file.size);

          await upload(id, data, i, totalChunks);
        }

        setProgress(Math.round((++filesUploaded * 100) / totalFiles));
        setProgressLabel(`Uploaded ${filesUploaded} of ${totalFiles} files`);
      }

      await submitForm.mutateAsync({ params: { id, ...formData } });

      // Redirect to results page
      router.push(`/ape/results?id=${id}`);
    } catch (error) {
      console.error("Error uploading files:", error);
      setFormError(error.response?.data?.message || error.message || "An unknown error occurred.");
    }
  }

  function onReset(event) {
    event.preventDefault();
    reset();
  }

  async function handleFileChange(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const firstFile = files[0];
    const baseName = firstFile.name.replace(/\.[^/.]+$/, ""); // strip extension
    setValue("jobName", baseName); // set default job name
    try {
      const arrayBuffer = await firstFile.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      // Log all tags and their values
      console.log("DICOM Metadata:");
      for (const tag in dataSet.elements) {
        const element = dataSet.elements[tag];
        const value = dataSet.string(tag);
        console.log(`${tag} → ${value}`);
      }

      const sex = dataSet.string("x00100040"); // PatientSex
      const ageStr = dataSet.string("x00101010"); // e.g., "034Y"
      const heightStr = dataSet.string("x00101020"); // in meters
      const weightStr = dataSet.string("x00101030"); // in kg
      const sliceThicknessStr = dataSet.string("x00180050"); // in mm
      const kvpStr = dataSet.string("x00180060"); // in kVp

      if (sex) setValue("sex", ["M", "F"].includes(sex) ? sex : "NA");
      if (ageStr) setValue("age", parseInt(ageStr));
      if (heightStr) {
        const heightCm = parseFloat(heightStr) * 100;
        if (!isNaN(heightCm)) setValue("height", heightCm);
      }
      if (weightStr) setValue("weight", parseFloat(weightStr));
      if (sliceThicknessStr) setValue("thickness", parseFloat(sliceThicknessStr));
      if (kvpStr) setValue("kvp", parseFloat(kvpStr));
    } catch (err) {
      console.error("Failed to read DICOM metadata", err);
      setFormError("Could not extract metadata from the DICOM file.");
    }
  }

  return (
    <div className="flex-grow-1 bg-light py-4">
      <Container style={{ maxWidth: 500 }}>
        <Row className="justify-content-center">
          <Col sm="auto">
            <Card className="p-3">
              <p>
                Enter patient info here. If info is unknown, approximate values can be used. These values are used for
                filtering the reference library of patients for extension.
              </p>
              <Form onSubmit={handleSubmit(onSubmit)} onReset={onReset} noValidate>
                <Form.Group controlId="files" className="my-3">
                  <Form.Label>CT Images (DICOM / Nifti)</Form.Label>
                  <Form.Control
                    {...register("files", { required: true })}
                    type="file"
                    multiple
                    accept=".dcm,.nii,nii.gz,.txt"
                    isInvalid={errors?.files}
                    // disabled={formState.status}
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted d-block">Upload a Nifti file or several DICOM files</Form.Text>
                  <Form.Control.Feedback className="d-block" type="invalid">
                    {errors?.files && errors.files.message}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="sex" className="my-3">
                  <Form.Label>Sex</Form.Label>
                  <Form.Select {...register("sex")}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="NA">NA</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group controlId="age" className="my-3">
                  <Form.Label className="fw-bold">Age</Form.Label>
                  <Form.Control
                    {...register("age", {
                      valueAsNumber: true,
                      validate: (value) => !isNaN(value) || "Value must be a valid number",
                      min: { value: 0, message: "Value must be at least 0" },
                    })}
                    placeholder="Age"
                    type="number"
                    min="0"
                    onWheel={numberInputOnWheelPreventChange}
                  />
                  <Form.Text className="text-danger">{errors?.age?.message}</Form.Text>
                </Form.Group>
                <Form.Group controlId="height" className="my-3">
                  <Form.Label className="fw-bold">Height (cm)</Form.Label>
                  <Form.Control
                    {...register("height", {
                      valueAsNumber: true,
                      validate: (value) => !isNaN(value) || "Value must be a valid number",
                      min: { value: 0, message: "Value must be at least 0" },
                    })}
                    placeholder="Height"
                    type="number"
                    min="0"
                    onWheel={numberInputOnWheelPreventChange}
                  />
                  <Form.Text className="text-danger">{errors?.height?.message}</Form.Text>
                </Form.Group>
                <Form.Group controlId="weight" className="my-3">
                  <Form.Label className="fw-bold">Weight (kg)</Form.Label>
                  <Form.Control
                    {...register("weight", {
                      valueAsNumber: true,
                      validate: (value) => !isNaN(value) || "Value must be a valid number",
                      min: { value: 0, message: "Value must be at least 0" },
                    })}
                    placeholder="Weight"
                    type="number"
                    min="0"
                    onWheel={numberInputOnWheelPreventChange}
                  />
                  <Form.Text className="text-danger">{errors?.weight?.message}</Form.Text>
                </Form.Group>
                <Form.Group controlId="kvp" className="my-3">
                  <Form.Label className="fw-bold">kVp</Form.Label>
                  <Form.Control
                    {...register("kvp", {
                      valueAsNumber: true,
                      validate: (value) => !isNaN(value) || "Value must be a valid number",
                      min: { value: 0, message: "Value must be at least 0" },
                    })}
                    defaultValue={120}
                    placeholder="kVp"
                    type="number"
                    min="0"
                    onWheel={numberInputOnWheelPreventChange}
                  />
                  <Form.Text className="text-danger">{errors?.kvp?.message}</Form.Text>
                </Form.Group>
                <Form.Group controlId="thickness" className="my-3">
                  <Form.Label className="fw-bold">Slice Thickness (mm)</Form.Label>
                  <Form.Control
                    {...register("thickness", {
                      valueAsNumber: true,
                      validate: (value) => !isNaN(value) || "Value must be a valid number",
                      min: { value: 0, message: "Value must be at least 0" },
                    })}
                    defaultValue={1.25}
                    placeholder="Slice Thickness in mm"
                    type="number"
                    min="0"
                    step={0.01}
                    onWheel={numberInputOnWheelPreventChange}
                  />
                  <Form.Text className="text-danger">{errors?.thickness?.message}</Form.Text>
                </Form.Group>
                <Form.Group controlId="jobName" className="my-3">
                  <Form.Label className="fw-bold">Job Name</Form.Label>
                  <Form.Control
                    {...register("jobName", {
                      required: "Job Name is required",
                      minLength: { value: 3, message: "Job name must be at least 3 characters" },
                    })}
                    placeholder="Will be auto-filled from first file name"
                    type="text"
                  />
                  <Form.Control.Feedback className="d-block" type="invalid">
                    {errors?.jobName?.message}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="email" className="my-3">
                  <Form.Label className="fw-bold">Email</Form.Label>
                  <Form.Control
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Entered value does not match email format",
                      },
                    })}
                    placeholder="Email"
                    type="email"
                  />
                  <Form.Text className="text-muted d-block">Receive a notification when your job is complete</Form.Text>
                  <Form.Control.Feedback className="d-block" type="invalid">
                    {errors?.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                {formError && (
                  <Alert variant="danger">
                    <div>An error occurred during deploy:</div>
                    <pre>{formError}</pre>
                  </Alert>
                )}

                <div className="text-center my-3">
                  {progressLabel}
                  {progress > 0 && (
                    <>
                      <div>Please do not close this page while your upload is in progress.</div>
                      <ProgressBar className="w-100" now={progress} label={`${progress}%`} />
                    </>
                  )}
                </div>
                <div className="text-end">
                  <Button type="reset" variant="outline-danger" className="me-1">
                    Reset
                  </Button>
                  <Button type="submit" variant="primary">
                    Submit
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
