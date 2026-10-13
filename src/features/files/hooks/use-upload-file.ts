'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TokenManager } from '@/features/auth/services/token-manager';
import { API_ROUTES } from '@/constants';
import { ApiError, apiClient, queryKeys } from '@/lib';
import type { ApiErrorEnvelope, ApiResponse } from '@/types';
import type { FileUpload } from '@/features/files/types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/features/files/constants';

type UploadHandlers = {
  onProgress?: (percent: number) => void;
  onXhrCreated?: (xhr: XMLHttpRequest) => void;
};

function parseJsonBody<T>(xhr: XMLHttpRequest): T | undefined {
  try {
    return JSON.parse(xhr.responseText) as T;
  } catch {
    return undefined;
  }
}

function parseXhrError(xhr: XMLHttpRequest): ApiError {
  const body = parseJsonBody<ApiErrorEnvelope>(xhr);
  const error = body?.error;

  if (error) {
    return new ApiError(
      xhr.status,
      error.message || error.code || `Upload failed with status ${xhr.status}`,
      error.code,
      error.details,
    );
  }

  return new ApiError(xhr.status, xhr.statusText || `Upload failed with status ${xhr.status}`);
}

function preCheckFile(file: File): void {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(413, `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit`, 'FILE_TOO_LARGE');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ApiError(415, `MIME type ${file.type || 'unknown'} is not allowed`, 'UNSUPPORTED_MEDIA_TYPE');
  }
}

function sendUploadRequest(file: File, token: string | null, handlers: UploadHandlers): Promise<FileUpload> {
  return new Promise<FileUpload>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    handlers.onXhrCreated?.(xhr);

    xhr.open('POST', `${apiClient.getBaseUrl()}${API_ROUTES.files.upload}`);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        handlers.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body = parseJsonBody<ApiResponse<FileUpload>>(xhr);

        if (body?.data) {
          resolve(body.data);
        } else {
          reject(new ApiError(xhr.status, 'Unexpected upload response'));
        }
        return;
      }

      reject(parseXhrError(xhr));
    };

    xhr.onerror = () => reject(new ApiError(xhr.status, 'Network error during upload'));
    xhr.onabort = () => reject(new ApiError(xhr.status, 'Upload cancelled'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

async function uploadFile(file: File, handlers: UploadHandlers): Promise<FileUpload> {
  preCheckFile(file);

  try {
    return await sendUploadRequest(file, TokenManager.getAccessToken(), handlers);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const newToken = await apiClient.refreshAccessToken();

      if (newToken) {
        return sendUploadRequest(file, newToken, handlers);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    throw error;
  }
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) =>
      uploadFile(file, {
        onProgress: setProgress,
        onXhrCreated: (xhr) => {
          xhrRef.current = xhr;
        },
      }),
    onMutate: () => {
      setProgress(0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });

  const cancel = useCallback(() => {
    xhrRef.current?.abort();
  }, []);

  return { ...mutation, progress, cancel };
}
