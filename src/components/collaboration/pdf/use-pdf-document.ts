import type { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import {
  type PdfAnnotation,
  type PdfReply,
  readPdfAnnotation,
  readPdfReply,
} from "@/lib/pdf-annotations/model";
import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";

export function usePdfDocument({
  collaboration,
  revision,
  canEdit,
  currentUser,
  page,
}: {
  collaboration: ReturnType<typeof useCollaborativeTool>;
  revision: string;
  canEdit: boolean;
  currentUser: { displayName: string; id: string };
  page: number;
}) {
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);

  const [bookmarkedPages, setBookmarkedPages] = useState<Set<number>>(
    new Set(),
  );

  const [replies, setReplies] = useState<PdfReply[]>([]);

  useEffect(() => {
    const document = collaboration.connection?.document;

    if (!document) return;

    const annotationMap = document.getMap<unknown>("pdf-annotations");
    const replyMap = document.getMap<unknown>("pdf-replies");
    const bookmarkMap = document.getMap<unknown>("pdf-bookmarks");
    const refresh = (): void => {
      setAnnotations(
        Array.from(annotationMap.values())
          .map(readPdfAnnotation)
          .filter(
            (annotation): annotation is PdfAnnotation =>
              annotation?.revision === revision,
          )
          .sort((first, second) =>
            first.createdAt.localeCompare(second.createdAt),
          ),
      );
      setReplies(
        Array.from(replyMap.values())
          .map(readPdfReply)
          .filter((reply): reply is PdfReply => reply?.revision === revision)
          .sort((first, second) =>
            first.createdAt.localeCompare(second.createdAt),
          ),
      );
      const pages = new Set<number>();
      bookmarkMap.forEach((value, key) => {
        if (value === true && key.startsWith(`${revision}:`)) {
          const bookmarkedPage = Number(key.slice(revision.length + 1));
          if (Number.isInteger(bookmarkedPage) && bookmarkedPage > 0) {
            pages.add(bookmarkedPage);
          }
        }
      });
      setBookmarkedPages(pages);
    };

    refresh();
    annotationMap.observe(refresh);
    replyMap.observe(refresh);
    bookmarkMap.observe(refresh);
    return () => {
      annotationMap.unobserve(refresh);
      replyMap.unobserve(refresh);
      bookmarkMap.unobserve(refresh);
    };
  }, [collaboration.connection, revision]);

  const transact = useCallback(
    (change: (document: Y.Doc) => void): void => {
      const document = collaboration.connection?.document;
      if (!canEdit || !document) return;
      document.transact(() => change(document), {
        boardprepUserId: currentUser.id,
      });
    },
    [canEdit, collaboration.connection, currentUser.id],
  );

  const toggleBookmark = (): void => {
    transact((document) => {
      const bookmarks = document.getMap<boolean>("pdf-bookmarks");
      const key = `${revision}:${page}`;
      if (bookmarks.get(key)) bookmarks.delete(key);
      else bookmarks.set(key, true);
    });
  };
  return { annotations, bookmarkedPages, replies, transact, toggleBookmark };
}
