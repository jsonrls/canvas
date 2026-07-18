import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = "boardprep-pdfs";
const maximumSize = 15 * 1024 * 1024;

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
const createdUserIds = [];
const createdRoomIds = [];
const createdPaths = [];

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
  const email = `boardprep-phase3-${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = `Phase3-${crypto.randomUUID()}-A1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: `Phase 3 ${label}` },
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
    email,
    id: data.user.id,
  };
}

async function cleanup() {
  if (createdPaths.length > 0) {
    await admin.storage.from(bucketName).remove(createdPaths);
  }

  if (createdRoomIds.length > 0) {
    await admin.from("rooms").delete().in("id", createdRoomIds);
  }

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}

try {
  const [owner, viewer, outsider] = await Promise.all([
    createVerifiedUser("owner"),
    createVerifiedUser("viewer"),
    createVerifiedUser("outsider"),
  ]);
  const { data: createdRooms, error: roomError } = await owner.client.rpc(
    "create_study_room",
    {
      input_is_public: false,
      input_name: "Phase 3 storage verification",
    },
  );
  const room = createdRooms?.[0];

  if (
    roomError ||
    typeof room?.room_id !== "string" ||
    typeof room.room_slug !== "string"
  ) {
    throw new Error("Could not create the Phase 3 verification room.");
  }

  createdRoomIds.push(room.room_id);
  const { data: documents, error: documentsError } = await admin
    .from("documents")
    .select("kind")
    .eq("room_id", room.room_id);

  if (
    documentsError ||
    documents?.length !== 3 ||
    !["notes", "pdf", "whiteboard"].every((kind) =>
      documents.some((document) => document.kind === kind),
    )
  ) {
    throw new Error("Room creation did not provision all Phase 3 documents.");
  }

  const { data: bucket, error: bucketError } =
    await admin.storage.getBucket(bucketName);

  if (
    bucketError ||
    !bucket ||
    bucket.public !== false ||
    bucket.file_size_limit !== maximumSize ||
    bucket.allowed_mime_types?.length !== 1 ||
    bucket.allowed_mime_types[0] !== "application/pdf"
  ) {
    throw new Error("The hosted PDF bucket restrictions are incorrect.");
  }

  const { error: addViewerError } = await owner.client.rpc(
    "add_room_member_by_email",
    {
      input_email: viewer.email,
      input_role: "viewer",
      input_room_id: room.room_id,
    },
  );

  if (addViewerError) {
    throw new Error("The temporary viewer could not join the private room.");
  }

  const firstRevision = crypto.randomUUID();
  const firstPath = `${room.room_id}/${firstRevision}.pdf`;
  const pdf = new Blob(["%PDF-1.7\nPhase 3 private storage verification"], {
    type: "application/pdf",
  });
  const { error: uploadError } = await owner.client.storage
    .from(bucketName)
    .upload(firstPath, pdf, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    throw new Error(
      `An owner could not upload a private PDF: ${uploadError.message}`,
    );
  }

  createdPaths.push(firstPath);
  const viewerPath = `${room.room_id}/${crypto.randomUUID()}.pdf`;
  const { error: viewerUploadError } = await viewer.client.storage
    .from(bucketName)
    .upload(viewerPath, pdf, { contentType: "application/pdf", upsert: false });

  if (!viewerUploadError) {
    createdPaths.push(viewerPath);
    throw new Error("A viewer uploaded a room PDF.");
  }

  const { data: published, error: publishError } = await owner.client
    .from("documents")
    .update({
      pdf_asset_revision: firstRevision,
      pdf_file_name: "verification.pdf",
      pdf_file_size: pdf.size,
      pdf_storage_path: firstPath,
      updated_by: owner.id,
    })
    .eq("room_id", room.room_id)
    .eq("kind", "pdf")
    .select("pdf_storage_path");

  if (
    publishError ||
    published?.length !== 1 ||
    published[0].pdf_storage_path !== firstPath
  ) {
    throw new Error("An owner could not publish PDF metadata.");
  }

  const [{ data: viewerSigned, error: viewerSignedError }, outsiderSigned] =
    await Promise.all([
      viewer.client.storage.from(bucketName).createSignedUrl(firstPath, 60),
      outsider.client.storage.from(bucketName).createSignedUrl(firstPath, 60),
    ]);

  if (viewerSignedError || !viewerSigned?.signedUrl) {
    throw new Error("A room viewer could not create a signed PDF read URL.");
  }

  if (!outsiderSigned.error && outsiderSigned.data?.signedUrl) {
    throw new Error("An outsider created a signed URL for a private room PDF.");
  }

  const { data: downloaded, error: downloadError } = await viewer.client.storage
    .from(bucketName)
    .download(firstPath, {}, { cache: "no-store" });

  if (
    downloadError ||
    !downloaded ||
    (await downloaded.text()) !== (await pdf.text())
  ) {
    throw new Error("A room viewer could not read the private PDF.");
  }

  const { data: viewerWrites, error: viewerWriteError } = await viewer.client
    .from("documents")
    .update({ pdf_file_name: "viewer-write.pdf" })
    .eq("room_id", room.room_id)
    .eq("kind", "pdf")
    .select("id");

  if (!viewerWriteError && viewerWrites.length > 0) {
    throw new Error("A viewer changed the shared PDF metadata.");
  }

  const secondRevision = crypto.randomUUID();
  const secondPath = `${room.room_id}/${secondRevision}.pdf`;
  const { error: secondUploadError } = await owner.client.storage
    .from(bucketName)
    .upload(secondPath, pdf, { contentType: "application/pdf", upsert: false });

  if (secondUploadError) {
    throw new Error("An owner could not upload a replacement PDF.");
  }

  createdPaths.push(secondPath);
  const { error: replaceError } = await owner.client
    .from("documents")
    .update({
      pdf_asset_revision: secondRevision,
      pdf_storage_path: secondPath,
      updated_by: owner.id,
    })
    .eq("room_id", room.room_id)
    .eq("kind", "pdf")
    .eq("pdf_storage_path", firstPath);
  const { error: removeError } = await owner.client.storage
    .from(bucketName)
    .remove([firstPath]);
  const { data: oldAssetExists } = await admin.storage
    .from(bucketName)
    .exists(firstPath);

  if (replaceError || removeError || oldAssetExists) {
    throw new Error("Private PDF replacement did not remove the old asset.");
  }

  createdPaths.splice(createdPaths.indexOf(firstPath), 1);
  process.stdout.write(
    "Phase 3 Storage verification passed: three room documents, private bucket limits, owner upload/replace, viewer denial, member signed reads, outsider denial, and old-asset cleanup.\n",
  );
} finally {
  await cleanup();
}
