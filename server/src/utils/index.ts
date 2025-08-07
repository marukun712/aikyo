import { ValidateFunction } from "ajv";

export const createJsonRpcError = (code: string, error: string) => {
  return {
    jsonrpc: "2.0",
    error: {
      code: "-" + code,
      message: error,
    },
  };
};

export const createJsonRpcResult = (result: Record<string, any>) => {
  return {
    jsonrpc: "2.0",
    result,
  };
};

export function validateWithMap(
  map: Map<string, ValidateFunction>,
  title: string,
  data: unknown
): { valid: true } | { valid: false; error: string } {
  const validate = map.get(title);
  if (!validate) {
    return { valid: false, error: `${title}のactionは定義されていません。` };
  }
  const isValid = validate(data);
  if (!isValid) {
    return {
      valid: false,
      error: `不正なパラメータ: ${JSON.stringify(validate.errors, null, 2)}`,
    };
  }
  return { valid: true };
}
