export type FileUploadStatus = 'ACTIVE' | 'DELETED';

export interface FileUpload {
  id: string;
  bucket: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  status: FileUploadStatus;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type FilesSortField = 'createdAt' | 'originalName' | 'size';
export type FilesSortOrder = 'asc' | 'desc';
export type FilesSort = `${FilesSortField}:${FilesSortOrder}`;

export interface FilesListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: FilesSort;
}

export interface FilesListResponse {
  items: FileUpload[];
  total: number;
  page: number;
  limit: number;
}

export interface PresignedUrlResponse {
  url: string;
  expiresAt: string;
}
