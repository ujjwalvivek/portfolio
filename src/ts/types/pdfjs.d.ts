// The part of pdf.js (pdfjs-dist 6.5.438, vendored at /vendor/pdfjs@6.5.438/pdf.min.mjs by scripts/vendor.mjs) that the PDF
// viewer uses. Hand-written from the package's own types, trimmed to what src/ts/features/pdf-viewer.ts calls.

export interface PageViewport {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly rotation: number;
  readonly rawDims: { pageWidth: number; pageHeight: number };
  clone(params?: { scale?: number; rotation?: number; dontFlip?: boolean }): PageViewport;
  convertToViewportPoint(x: number, y: number): [number, number];
}

export interface RenderTask {
  readonly promise: Promise<void>;
  cancel(): void;
}

export interface RefProxy {
  num: number;
  gen: number;
}

export interface LinkAnnotation {
  subtype: string;
  rect: number[];
  url?: string;
  unsafeUrl?: string;
  dest?: string | unknown[];
}

export interface PDFPageProxy {
  readonly pageNumber: number;
  readonly view: number[];
  readonly rotate: number;
  getViewport(params: { scale: number; rotation?: number; dontFlip?: boolean }): PageViewport;
  render(params: { canvas: HTMLCanvasElement; viewport: PageViewport; transform?: number[]; background?: string }): RenderTask;
  getAnnotations(params?: { intent?: string }): Promise<LinkAnnotation[]>;
  streamTextContent(params?: { includeMarkedContent?: boolean }): ReadableStream;
  cleanup(resetStats?: boolean): boolean;
}

export interface PDFDocumentProxy {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
  getPageIndex(ref: RefProxy): Promise<number>;
  getDestination(id: string): Promise<unknown[] | null>;
  getData(): Promise<Uint8Array>;
  destroy(): Promise<void>;
}

export interface PDFDocumentLoadingTask {
  readonly promise: Promise<PDFDocumentProxy>;
  onProgress: ((p: { loaded: number; total: number }) => void) | null;
  onPassword: ((update: (password: string) => void, reason: number) => void) | null;
  destroy(): Promise<void>;
}

export interface DocumentInitParameters {
  url: string;
  disableWorkerRendering?: boolean;
  enableXfa?: boolean;
  useWasm?: boolean;
  verbosity?: number;
}

export interface TextLayer {
  render(): Promise<void>;
  cancel(): void;
}

export interface PdfJs {
  readonly version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: DocumentInitParameters): PDFDocumentLoadingTask;
  TextLayer: {
    new (params: { textContentSource: ReadableStream; container: HTMLElement; viewport: PageViewport }): TextLayer;
    cleanup(): void;
  };
}
