export type ValidationErrorItem = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;
  readonly validation?: ValidationErrorItem[];
  readonly raw: unknown;

  constructor(
    status: number,
    detail: string,
    options: { validation?: ValidationErrorItem[]; raw?: unknown } = {}
  ) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.validation = options.validation;
    this.raw = options.raw;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isValidation(): boolean {
    return this.status === 422 && this.validation !== undefined;
  }

  /** Errores de validación mapeados a { "campo": "mensaje" } */
  get fieldErrors(): Record<string, string> {
    if (!this.validation) return {};

    const result: Record<string, string> = {};
    for (const item of this.validation) {
      // loc = ["body", "user", "email"] → campo final
      const field = String(item.loc[item.loc.length - 1]);
      result[field] = item.msg;
    }
    return result;
  }
}

export class NetworkError extends Error {
  constructor(message = "No se pudo conectar con el servidor") {
    super(message);
    this.name = "NetworkError";
  }
}