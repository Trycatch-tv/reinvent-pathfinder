// @pathfinder/shared — utilidades compartidas del monorepo.

/**
 * Normaliza un identificador o código de sesión eliminando espacios y convirtiendo a mayúsculas.
 */
export function normalizeSessionId(id: string): string {
  return id.trim().toUpperCase();
}
