import { ClassicFlow } from '../flow'

/**
 * Classic preset. Uses `ClassicFlow` for managing connections by user
 */
export function setup() {
  return () => new ClassicFlow()
}
