import { BadRequestException } from "@nestjs/common";
import { ValidationError } from "class-validator";

interface ValidationErrorDetail {
  field: string;
  message: string;
}

function flattenValidationErrors(errors: ValidationError[], parentPath = ""): ValidationErrorDetail[] {
  return errors.flatMap(validationError => {
    const field = parentPath ? `${parentPath}.${validationError.property}` : validationError.property;
    const details = Object.values(validationError.constraints ?? {}).map(message => ({
      field,
      message,
    }));

    return [...details, ...flattenValidationErrors(validationError.children ?? [], field)];
  });
}

export function createValidationException(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    message: "Validation failed.",
    details: flattenValidationErrors(errors),
  });
}
