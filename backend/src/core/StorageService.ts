export interface FileUploadOptions {
  folder?: string;
  contentType?: string;
}

export interface StoredFile {
  url: string;
  key: string;
}

export interface StorageService {
  upload(buffer: Buffer, fileName: string, opts?: FileUploadOptions): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
