"use client";
import { Container, Card, Row, Col, Form, Button, ProgressBar } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient, useIsMutating } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import { submit, upload } from "@/services/queries";

export default function ApePage() {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const submitForm = useMutation({
    mutationKey: "submit",
    mutationFn: ({ params }) => submit(params.id, params),
    onSettled: (data, error) => {
      if (error) setError(error.response.data.error);
      else if (data) setError(null);
    },
  });
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

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
    } catch (error) {}
  }

  function onReset(event) {
    event.preventDefault();
    reset();
  }

  return (
    <div className="flex-grow-1 bg-light py-4">
      <Container>
        <Row className="justify-content-center">
          <Col sm="auto">
            <Card className="p-3">
              <p>Enter patient info here. If info is unknown, approximate values can be used.</p>
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
                    placeholder="Age (can be approximate)"
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
                    placeholder="Height (can be approximate)"
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
                    placeholder="Weight (can be approximate)"
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
                  <Form.Control
                    {...register("files", { required: true })}
                    type="file"
                    multiple
                    accept=".dcm"
                    isInvalid={errors?.files}
                    // disabled={formState.status}
                  />
                  <Form.Control.Feedback className="d-block" type="invalid">
                    {errors?.files && errors.files.message}
                  </Form.Control.Feedback>
                </Form.Group>

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
