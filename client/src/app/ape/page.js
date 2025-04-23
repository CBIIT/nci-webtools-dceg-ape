"use client";
import { Container, Card, Row, Col, Form, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";

export default function ApePage() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

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
