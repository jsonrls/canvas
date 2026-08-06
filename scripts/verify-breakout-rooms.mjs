import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
const bucketName = "boardprep-pdfs";
const createdPaths = [];
const createdUserIds = [];
let createdRoomId = null;

function createUserClient(accessToken) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function createVerifiedUser(label) {
  const email = `qollab-breakout-${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = `Breakout-${crypto.randomUUID()}-A1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: `Breakout ${label}` },
  });

  if (error || !data.user) {
    throw new Error(`Could not create the temporary ${label} user.`);
  }

  createdUserIds.push(data.user.id);
  const transport = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data: sessionData, error: sessionError } =
    await transport.auth.signInWithPassword({ email, password });

  if (sessionError || !sessionData.session) {
    throw new Error(`Could not sign in the temporary ${label} user.`);
  }

  return {
    client: createUserClient(sessionData.session.access_token),
    id: data.user.id,
  };
}

async function cleanup() {
  if (createdPaths.length > 0) {
    await admin.storage.from(bucketName).remove(createdPaths);
  }

  if (createdRoomId) {
    await admin.from("rooms").delete().eq("id", createdRoomId);
  }

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}

try {
  const [owner, editor, viewer, outsider] = await Promise.all([
    createVerifiedUser("owner"),
    createVerifiedUser("editor"),
    createVerifiedUser("viewer"),
    createVerifiedUser("outsider"),
  ]);
  const { data: roomData, error: roomError } = await owner.client.rpc(
    "create_study_room",
    {
      input_is_public: false,
      input_name: "Breakout verification parent",
    },
  );
  const room = roomData?.[0];

  if (roomError || typeof room?.room_id !== "string") {
    throw new Error(`Could not create the parent room: ${roomError?.message}`);
  }

  createdRoomId = room.room_id;
  const { error: membershipError } = await admin.from("room_members").insert([
    { role: "editor", room_id: createdRoomId, user_id: editor.id },
    { role: "viewer", room_id: createdRoomId, user_id: viewer.id },
  ]);

  if (membershipError) {
    throw new Error("Could not prepare breakout verification memberships.");
  }

  const { data: firstData, error: firstError } = await editor.client.rpc(
    "create_breakout_room",
    {
      input_name: "Case group one",
      input_room_id: createdRoomId,
    },
  );
  const { data: secondData, error: secondError } = await owner.client.rpc(
    "create_breakout_room",
    {
      input_name: "Case group two",
      input_room_id: createdRoomId,
    },
  );
  const first = firstData?.[0];
  const second = secondData?.[0];

  if (
    firstError ||
    secondError ||
    !/^[A-Z0-9]{8}$/.test(first?.breakout_room_code ?? "") ||
    !/^[A-Z0-9]{8}$/.test(second?.breakout_room_code ?? "") ||
    first.breakout_room_code === second.breakout_room_code
  ) {
    throw new Error("Breakout creation did not produce unique valid codes.");
  }

  const { data: createdDocuments, error: createdDocumentsError } = await admin
    .from("breakout_documents")
    .select("id, kind")
    .eq("breakout_room_id", first.breakout_room_id)
    .order("kind");

  if (
    createdDocumentsError ||
    createdDocuments?.length !== 3 ||
    createdDocuments.map(({ kind }) => kind).join(",") !==
      "notes,pdf,whiteboard"
  ) {
    throw new Error(
      "Breakout creation did not provision notes, PDF, and whiteboard documents.",
    );
  }

  const { error: viewerCreateError } = await viewer.client.rpc(
    "create_breakout_room",
    {
      input_name: "Viewer must not create",
      input_room_id: createdRoomId,
    },
  );

  if (!viewerCreateError) {
    throw new Error("A viewer created a breakout room.");
  }

  const [
    { data: viewerDirectoryBeforeJoin, error: viewerDirectoryBeforeJoinError },
    { data: facilitatorDirectory, error: facilitatorDirectoryError },
    outsiderDirectory,
  ] = await Promise.all([
    viewer.client.rpc("list_breakout_room_directory", {
      input_room_id: createdRoomId,
    }),
    editor.client.rpc("list_breakout_room_directory", {
      input_room_id: createdRoomId,
    }),
    outsider.client.rpc("list_breakout_room_directory", {
      input_room_id: createdRoomId,
    }),
  ]);

  if (
    viewerDirectoryBeforeJoinError ||
    viewerDirectoryBeforeJoin?.length !== 2 ||
    viewerDirectoryBeforeJoin.some(
      ({ breakout_room_code, is_joined }) =>
        breakout_room_code !== null || is_joined,
    ) ||
    facilitatorDirectoryError ||
    facilitatorDirectory?.length !== 2 ||
    facilitatorDirectory.some(
      ({ breakout_room_code, is_joined }) =>
        !/^[A-Z0-9]{8}$/.test(breakout_room_code ?? "") || !is_joined,
    ) ||
    !outsiderDirectory.error
  ) {
    throw new Error(
      "Breakout directory privacy did not follow parent role and join status.",
    );
  }

  const { data: visibleToViewerBeforeJoin, error: viewerReadBeforeJoinError } =
    await viewer.client
      .from("breakout_rooms")
      .select("id, code")
      .eq("room_id", createdRoomId);
  const { data: visibleToOutsider, error: outsiderReadError } =
    await outsider.client
      .from("breakout_rooms")
      .select("id")
      .eq("room_id", createdRoomId);

  if (
    viewerReadBeforeJoinError ||
    visibleToViewerBeforeJoin.length !== 0 ||
    outsiderReadError ||
    visibleToOutsider.length !== 0
  ) {
    throw new Error("Unjoined viewers could read private breakout rows.");
  }

  const {
    data: viewerDocumentsBeforeJoin,
    error: viewerDocumentsBeforeJoinError,
  } = await viewer.client
    .from("breakout_documents")
    .select("id, kind")
    .eq("breakout_room_id", first.breakout_room_id);

  if (
    viewerDocumentsBeforeJoinError ||
    viewerDocumentsBeforeJoin?.length !== 0
  ) {
    throw new Error("An unjoined viewer read breakout study tools.");
  }

  const [
    { data: firstJoin, error: firstJoinError },
    { data: repeatedJoin, error: repeatedJoinError },
  ] = await Promise.all([
    viewer.client.rpc("join_breakout_room", {
      input_code: first.breakout_room_code,
      input_room_id: createdRoomId,
    }),
    viewer.client.rpc("join_breakout_room", {
      input_code: first.breakout_room_code,
      input_room_id: createdRoomId,
    }),
  ]);

  if (
    firstJoinError ||
    repeatedJoinError ||
    firstJoin?.[0]?.breakout_room_id !== first.breakout_room_id ||
    repeatedJoin?.[0]?.breakout_room_id !== first.breakout_room_id
  ) {
    throw new Error("A viewer could not join a breakout idempotently.");
  }

  const [
    { data: viewerMemberships, error: viewerMembershipsError },
    { data: viewerDirectoryAfterJoin, error: viewerDirectoryAfterJoinError },
    { data: visibleToViewerAfterJoin, error: viewerReadAfterJoinError },
    { data: joinedDocuments, error: joinedDocumentsError },
    { data: unjoinedDocuments, error: unjoinedDocumentsError },
    outsiderDocs,
  ] = await Promise.all([
    viewer.client
      .from("breakout_room_members")
      .select("breakout_room_id")
      .eq("user_id", viewer.id),
    viewer.client.rpc("list_breakout_room_directory", {
      input_room_id: createdRoomId,
    }),
    viewer.client
      .from("breakout_rooms")
      .select("id, code")
      .eq("room_id", createdRoomId),
    viewer.client
      .from("breakout_documents")
      .select("id, kind")
      .eq("breakout_room_id", first.breakout_room_id),
    viewer.client
      .from("breakout_documents")
      .select("id, kind")
      .eq("breakout_room_id", second.breakout_room_id),
    outsider.client
      .from("breakout_documents")
      .select("id")
      .eq("breakout_room_id", first.breakout_room_id),
  ]);
  const joinedDirectoryEntry = viewerDirectoryAfterJoin?.find(
    ({ breakout_room_id }) => breakout_room_id === first.breakout_room_id,
  );
  const unjoinedDirectoryEntry = viewerDirectoryAfterJoin?.find(
    ({ breakout_room_id }) => breakout_room_id === second.breakout_room_id,
  );

  if (
    viewerMembershipsError ||
    viewerMemberships?.length !== 1 ||
    viewerMemberships[0].breakout_room_id !== first.breakout_room_id ||
    viewerDirectoryAfterJoinError ||
    joinedDirectoryEntry?.breakout_room_code !== first.breakout_room_code ||
    !joinedDirectoryEntry?.is_joined ||
    unjoinedDirectoryEntry?.breakout_room_code !== null ||
    unjoinedDirectoryEntry?.is_joined ||
    viewerReadAfterJoinError ||
    visibleToViewerAfterJoin?.length !== 1 ||
    visibleToViewerAfterJoin[0].id !== first.breakout_room_id ||
    joinedDocumentsError ||
    joinedDocuments?.length !== 3 ||
    unjoinedDocumentsError ||
    unjoinedDocuments?.length !== 0 ||
    outsiderDocs.error ||
    outsiderDocs.data?.length !== 0
  ) {
    throw new Error(
      "Persistent breakout membership did not isolate joined and unjoined rooms.",
    );
  }

  const { data: viewerWrites, error: viewerWriteError } = await viewer.client
    .from("breakout_documents")
    .update({ title: "Viewer must not edit" })
    .eq("breakout_room_id", first.breakout_room_id)
    .eq("kind", "notes")
    .select("id");

  if (!viewerWriteError && viewerWrites?.length > 0) {
    throw new Error("A viewer changed a breakout study-tool document.");
  }

  const { error: outsiderToggleError } = await outsider.client.rpc(
    "set_viewer_collaboration",
    {
      input_enabled: true,
      input_room_id: createdRoomId,
    },
  );

  if (!outsiderToggleError) {
    throw new Error("An outsider changed breakout collaboration access.");
  }

  const { data: enabled, error: enableError } = await owner.client.rpc(
    "set_viewer_collaboration",
    {
      input_enabled: true,
      input_room_id: createdRoomId,
    },
  );

  if (enableError || enabled !== true) {
    throw new Error("The owner could not enable viewer collaboration.");
  }

  const { data: collaboratingWrites, error: collaboratingWriteError } =
    await viewer.client
      .from("breakout_documents")
      .update({
        title: "Viewer breakout collaboration verified",
        updated_by: viewer.id,
      })
      .eq("breakout_room_id", first.breakout_room_id)
      .eq("kind", "notes")
      .select("id");
  const { data: unjoinedWrites, error: unjoinedWriteError } =
    await viewer.client
      .from("breakout_documents")
      .update({
        title: "Unjoined viewer must not collaborate",
        updated_by: viewer.id,
      })
      .eq("breakout_room_id", second.breakout_room_id)
      .eq("kind", "notes")
      .select("id");

  if (collaboratingWriteError || collaboratingWrites?.length !== 1) {
    throw new Error("An enabled joined viewer could not edit breakout notes.");
  }

  if (!unjoinedWriteError && unjoinedWrites?.length > 0) {
    throw new Error("An enabled viewer edited an unjoined breakout.");
  }

  const pdf = new Blob(["%PDF-1.7\nBreakout private storage verification"], {
    type: "application/pdf",
  });
  const revision = crypto.randomUUID();
  const pdfPath = `breakouts/${first.breakout_room_id}/${revision}.pdf`;
  const { error: uploadError } = await editor.client.storage
    .from(bucketName)
    .upload(pdfPath, pdf, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    throw new Error(
      `An editor could not upload a breakout PDF: ${uploadError.message}`,
    );
  }

  createdPaths.push(pdfPath);
  const viewerPath = `breakouts/${first.breakout_room_id}/${crypto.randomUUID()}.pdf`;
  const { error: viewerUploadError } = await viewer.client.storage
    .from(bucketName)
    .upload(viewerPath, pdf, { contentType: "application/pdf", upsert: false });

  if (!viewerUploadError) {
    createdPaths.push(viewerPath);
    throw new Error("A viewer uploaded a breakout PDF.");
  }

  const { data: disabled, error: disableError } = await editor.client.rpc(
    "set_viewer_collaboration",
    {
      input_enabled: false,
      input_room_id: createdRoomId,
    },
  );

  if (disableError || disabled !== false) {
    throw new Error("An editor could not disable viewer collaboration.");
  }

  const { data: disabledWrites, error: disabledWriteError } =
    await viewer.client
      .from("breakout_documents")
      .update({ title: "Disabled viewer must not write" })
      .eq("breakout_room_id", first.breakout_room_id)
      .eq("kind", "notes")
      .select("id");

  if (!disabledWriteError && disabledWrites?.length > 0) {
    throw new Error(
      "A viewer kept editing breakout notes after collaboration was disabled.",
    );
  }

  const { data: publishedPdf, error: publishError } = await editor.client
    .from("breakout_documents")
    .update({
      pdf_asset_revision: revision,
      pdf_file_name: "breakout-verification.pdf",
      pdf_file_size: pdf.size,
      pdf_storage_path: pdfPath,
      updated_by: editor.id,
    })
    .eq("breakout_room_id", first.breakout_room_id)
    .eq("kind", "pdf")
    .select("pdf_storage_path");

  if (
    publishError ||
    publishedPdf?.length !== 1 ||
    publishedPdf[0].pdf_storage_path !== pdfPath
  ) {
    throw new Error("An editor could not publish breakout PDF metadata.");
  }

  const [{ data: viewerPdf, error: viewerPdfError }, outsiderPdf] =
    await Promise.all([
      viewer.client.storage
        .from(bucketName)
        .download(pdfPath, {}, { cache: "no-store" }),
      outsider.client.storage.from(bucketName).createSignedUrl(pdfPath, 60),
    ]);

  if (
    viewerPdfError ||
    !viewerPdf ||
    (await viewerPdf.text()) !== (await pdf.text())
  ) {
    throw new Error("A parent-room viewer could not read the breakout PDF.");
  }

  if (!outsiderPdf.error && outsiderPdf.data?.signedUrl) {
    throw new Error("An outsider created a signed URL for a breakout PDF.");
  }

  const { error: directInsertError } = await editor.client
    .from("breakout_rooms")
    .insert({
      code: "DIRECT01",
      created_by: editor.id,
      name: "Direct insert must fail",
      room_id: createdRoomId,
    });

  if (!directInsertError) {
    throw new Error("Authenticated users can bypass breakout creation RPC.");
  }

  console.log(
    "Breakout verification passed: unique codes, persistent idempotent joins, joined-only participant reads, global viewer collaboration, facilitator access, isolated notes/PDF/whiteboard documents, facilitator-only PDF uploads, and private PDF storage.",
  );
} finally {
  await cleanup();
}
