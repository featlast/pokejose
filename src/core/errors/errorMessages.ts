import { toAppError } from './AppError';
import { ErrorCode } from './ErrorCode.enum';
import type { UserFacingError } from './UserFacingError.types';

const USER_MESSAGES: Record<ErrorCode, UserFacingError> = {
  [ErrorCode.NETWORK]: {
    title: 'Sin conexión',
    message: 'Revisa tu conexión a internet e inténtalo de nuevo.',
    retryable: true,
  },
  [ErrorCode.TIMEOUT]: {
    title: 'La solicitud tardó demasiado',
    message: 'El servidor no respondió a tiempo. Inténtalo de nuevo.',
    retryable: true,
  },
  [ErrorCode.NOT_FOUND]: {
    title: 'No encontrado',
    message: 'No pudimos encontrar este Pokémon.',
    retryable: false,
  },
  [ErrorCode.SERVER]: {
    title: 'Servicio no disponible',
    message: 'PokéAPI está teniendo problemas. Inténtalo más tarde.',
    retryable: true,
  },
  [ErrorCode.PARSE]: {
    title: 'Respuesta inesperada',
    message: 'Recibimos datos que no pudimos interpretar.',
    retryable: true,
  },
  [ErrorCode.STORAGE]: {
    title: 'Error de almacenamiento',
    message: 'No pudimos acceder a los datos guardados en el dispositivo.',
    retryable: true,
  },
  [ErrorCode.UNKNOWN]: {
    title: 'Algo salió mal',
    message: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    retryable: true,
  },
};

/** Central translation of any error into copy the UI can show. */
export const toUserFacingError = (error: unknown): UserFacingError =>
  USER_MESSAGES[toAppError(error).code];
