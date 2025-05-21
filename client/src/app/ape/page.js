"use client";
import { Container, Card, Row, Col, Form, Button, ProgressBar, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, useIsMutating } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { useRouter, usePathname } from "next/navigation";
import { submit, upload } from "@/services/queries";
import * as dicomParser from "dicom-parser";


export default function ApePage() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm();


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
    console.log(formData);
    setFormError(null);
    const id = uuidv4();

    try {
      // do not upload files in parallel (minimize memory usage & time per upload)
      let filesUploaded = 0;
      for (const file of formData.files) {
        const fileData = new FormData();
        fileData.append("files", file);
        fileData.append("id", id);
        // await axios.post(`/api/submit/${id}`, fileData);
        await upload(id, fileData);
        filesUploaded++;
        setProgress(Math.round((filesUploaded * 100) / formData.files.length));
        setProgressLabel(`Uploaded ${filesUploaded} of ${formData.files.length} files`);
      }
      await submitForm.mutateAsync({ params: { id, ...formData } });
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
    try {
      const arrayBuffer = await firstFile.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      // ✅ Log all tags and their values
    console.log("🔍 DICOM Metadata:");
    for (const tag in dataSet.elements) {
      const element = dataSet.elements[tag];
      const value = dataSet.string(tag);
      console.log(`${tag} → ${value}`);
    }

      const sex = dataSet.string('x00100040'); // PatientSex
      const ageStr = dataSet.string('x00101010'); // e.g., "034Y"
      const heightStr = dataSet.string('x00101020'); // in meters
      const weightStr = dataSet.string('x00101030'); // in kg

      if (sex) setValue("sex", ["M", "F"].includes(sex) ? sex : "NA");
      if (ageStr) setValue("age", parseInt(ageStr));
      if (heightStr) setValue("height", parseFloat(heightStr) * 100); // meters to cm
      if (weightStr) setValue("weight", parseFloat(weightStr));
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
                <Form.Group controlId="files" className="my-3">
                  <Form.Label>CT Images (DICOM / Nifti)</Form.Label>
                  <Form.Control
                    {...register("files", { required: true })}
                    type="file"
                    multiple
                    accept=".dcm,.nii,nii.gz"
                    isInvalid={errors?.files}
                    // disabled={formState.status}
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted d-block">Upload a Nifti file or several DICOM files</Form.Text>
                  <Form.Control.Feedback className="d-block" type="invalid">
                    {errors?.files && errors.files.message}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId="email" className="my-3">
                  <Form.Label className="fw-bold">Email</Form.Label>
                  <Form.Control
                    {...register("email", {
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
