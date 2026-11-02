import {
  createStudyRequestScope,
  runStudyRequest,
  type StudyRequest,
} from "@/lib/ai/study-request";
import {
  AssetRefreshResponse,
  UploadFinishResponse,
  UploadStartResponse,
} from "@/components/collaboration/pdf/types";
import { useToast } from "@/components/ui/toast";
import { isRoomPdfAsset, readError } from "@/lib/pdf-annotations/study-tool";
import { validatePdfUpload } from "@/lib/pdf-assets/validation";
import type { RoomPdfAsset } from "@/lib/rooms/repository";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function usePdfAsset({
  pdfApiPath,
  roomId,
  initialAsset,
  canManageAsset,
  setPage,
  setNumPages,
  setSelectedId,
}: {
  pdfApiPath: string | undefined;
  roomId: string;
  initialAsset: RoomPdfAsset | null;
  canManageAsset: boolean;
  setPage: Dispatch<SetStateAction<number>>;
  setNumPages: Dispatch<SetStateAction<number>>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
}) {
  const router = useRouter();

  const { success } = useToast();

  const apiPath = pdfApiPath ?? `/api/rooms/${roomId}/pdf`;

  const [asset, setAsset] = useState(initialAsset);
  const assetRef = useRef(initialAsset);
  const uploadPendingRef = useRef(false);

  const [fileMessage, setFileMessage] = useState("");

  const [isRefreshingAsset, setIsRefreshingAsset] = useState(
    Boolean(initialAsset),
  );

  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRecoveryRevisionRef = useRef<string | null>(null);

  const [requests] = useState(createStudyRequestScope);

  const refreshPdfAsset = useCallback(
    async (request: StudyRequest): Promise<RoomPdfAsset | null> => {
      const response = await fetch(apiPath, {
        cache: "no-store",
        credentials: "same-origin",
        signal: request.signal,
      });
      const payload = (await response.json()) as AssetRefreshResponse;
      request.signal.throwIfAborted();

      if (!response.ok) {
        throw new Error(
          readError(payload, "The shared PDF access could not be refreshed."),
        );
      }

      if (payload.asset === null) {
        return null;
      }

      if (!isRoomPdfAsset(payload.asset)) {
        throw new Error("The refreshed PDF response was invalid.");
      }

      return payload.asset;
    },
    [apiPath],
  );

  const runRefresh = useCallback(
    (request: StudyRequest): Promise<void> =>
      runStudyRequest(request, () => refreshPdfAsset(request), {
        success(nextAsset) {
          assetRef.current = nextAsset;
          setAsset(nextAsset);
          setFileMessage("");
        },
        error(error) {
          assetRef.current = null;
          setAsset(null);
          setFileMessage(
            error instanceof Error
              ? error.message
              : "The shared PDF access could not be refreshed.",
          );
        },
        settled() {
          setIsRefreshingAsset(false);
        },
      }),
    [refreshPdfAsset],
  );

  const initialRevision = initialAsset?.revision;
  useEffect(() => {
    requests.activate();
    loadRecoveryRevisionRef.current = null;
    const request = requests.start();
    queueMicrotask(() => {
      if (!request?.isCurrent()) return;
      uploadPendingRef.current = false;
      setIsUploading(false);
      setIsRefreshingAsset(Boolean(initialRevision));
      void runRefresh(request);
    });
    return () => requests.dispose();
  }, [requests, runRefresh, initialRevision]);

  const handlePdfLoadError = useCallback((): void => {
    if (
      !requests.isActive() ||
      uploadPendingRef.current ||
      assetRef.current !== asset
    )
      return;
    if (
      !asset ||
      isRefreshingAsset ||
      loadRecoveryRevisionRef.current === asset.revision
    ) {
      setFileMessage("This PDF could not be rendered.");
      return;
    }
    const request = requests.start();
    if (!request) return;
    loadRecoveryRevisionRef.current = asset.revision;
    setIsRefreshingAsset(true);
    setFileMessage("Refreshing secure PDF access…");
    void runRefresh(request);
  }, [asset, isRefreshingAsset, requests, runRefresh]);

  const uploadPdf = async (file: File): Promise<void> => {
    if (!canManageAsset) return;

    const request = requests.start();
    if (!request) return;
    uploadPendingRef.current = true;
    setIsRefreshingAsset(false);
    setIsUploading(true);
    setFileMessage("");

    await runStudyRequest(
      request,
      async () => {
        const validated = await validatePdfUpload(file);
        request.signal.throwIfAborted();
        const startResponse = await fetch(apiPath, {
          body: JSON.stringify({
            fileName: validated.fileName,
            mimeType: file.type,
            size: validated.size,
          }),
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: request.signal,
        });
        const start = (await startResponse.json()) as UploadStartResponse;
        request.signal.throwIfAborted();

        if (
          !startResponse.ok ||
          typeof start.signedUrl !== "string" ||
          typeof start.revision !== "string" ||
          typeof start.fileName !== "string"
        ) {
          throw new Error(
            readError(start, "The secure upload could not start."),
          );
        }

        const uploadBody = new FormData();
        uploadBody.append("cacheControl", "3600");
        uploadBody.append("", file);
        const storageResponse = await fetch(start.signedUrl, {
          body: uploadBody,
          headers: { "x-upsert": "false" },
          method: "PUT",
          signal: request.signal,
        });

        request.signal.throwIfAborted();
        if (!storageResponse.ok) {
          throw new Error("The PDF could not be uploaded to private storage.");
        }

        const finishResponse = await fetch(apiPath, {
          body: JSON.stringify({
            fileName: start.fileName,
            revision: start.revision,
            size: validated.size,
          }),
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          method: "PUT",
          signal: request.signal,
        });
        const finish = (await finishResponse.json()) as UploadFinishResponse;
        request.signal.throwIfAborted();

        if (!finishResponse.ok || !isRoomPdfAsset(finish.asset)) {
          throw new Error(
            readError(finish, "The uploaded PDF could not be published."),
          );
        }

        return finish.asset;
      },
      {
        success(nextAsset) {
          assetRef.current = nextAsset;
          setAsset(nextAsset);
          loadRecoveryRevisionRef.current = null;
          setPage(1);
          setNumPages(0);
          setSelectedId(null);
          setFileMessage("");
          success(`${nextAsset.fileName} is now shared with the room.`);
          router.refresh();
        },
        error(error) {
          setFileMessage(
            error instanceof Error
              ? error.message
              : "The PDF could not be uploaded.",
          );
        },
        settled() {
          uploadPendingRef.current = false;
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      },
    );
  };

  return {
    asset,
    fileMessage,
    isRefreshingAsset,
    isUploading,
    fileInputRef,
    handlePdfLoadError,
    uploadPdf,
  };
}
