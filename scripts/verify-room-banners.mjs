import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const BUCKET = "room-banners";
const MAX_BYTES = 700 * 1024;
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
const createdRoomIds = [];
const createdStoragePaths = [];
const createdUserIds = [];

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
  const email = `qollab-banner-${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = `Banner-${crypto.randomUUID()}-A1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: `Banner Verification ${label}` },
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

async function createRoomAs(user) {
  const { data, error } = await user.client.rpc("create_study_room", {
    input_is_public: false,
    input_name: "Room icon verification",
  });
  const room = data?.[0];

  if (error || !room?.room_id || !room.room_slug) {
    throw new Error(`Could not create the icon test room: ${error?.message}`);
  }

  createdRoomIds.push(room.room_id);
  return { id: room.room_id, slug: room.room_slug };
}

async function cleanup() {
  if (createdStoragePaths.length > 0) {
    await admin.storage.from(BUCKET).remove(createdStoragePaths);
  }

  if (createdRoomIds.length > 0) {
    await admin.from("rooms").delete().in("id", createdRoomIds);
  }

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}

try {
  const { data: bucket, error: bucketError } =
    await admin.storage.getBucket(BUCKET);

  if (
    bucketError ||
    !bucket ||
    bucket.public ||
    bucket.file_size_limit !== MAX_BYTES ||
    bucket.allowed_mime_types?.length !== 1 ||
    bucket.allowed_mime_types[0] !== "image/jpeg"
  ) {
    throw new Error(
      "The private room-icon asset bucket is missing or unrestricted.",
    );
  }

  const [owner, member, outsider] = await Promise.all([
    createVerifiedUser("owner"),
    createVerifiedUser("member"),
    createVerifiedUser("outsider"),
  ]);
  const room = await createRoomAs(owner);
  const { error: addMemberError } = await owner.client.rpc(
    "add_room_member_by_email",
    {
      input_email: member.email,
      input_role: "viewer",
      input_room_id: room.id,
    },
  );

  if (addMemberError) {
    throw new Error("Could not add the room-icon test member.");
  }

  const bannerPath = `${room.id}/${crypto.randomUUID()}.jpg`;
  const banner = new Blob(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9])],
    { type: "image/jpeg" },
  );
  const { error: uploadError } = await owner.client.storage
    .from(BUCKET)
    .upload(bannerPath, banner, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `The owner could not upload a room icon: ${uploadError.message}`,
    );
  }

  createdStoragePaths.push(bannerPath);
  const { data: updatedRoom, error: roomUpdateError } = await owner.client
    .from("rooms")
    .update({ banner_storage_path: bannerPath })
    .eq("id", room.id)
    .select("banner_storage_path")
    .single();

  if (roomUpdateError || updatedRoom?.banner_storage_path !== bannerPath) {
    throw new Error("The owner could not attach the uploaded room icon.");
  }

  const { error: invalidPathError } = await owner.client
    .from("rooms")
    .update({ banner_storage_path: `${room.id}/not-versioned.jpg` })
    .eq("id", room.id);

  if (!invalidPathError) {
    throw new Error("The database accepted an invalid room icon path.");
  }

  const { data: memberUrl, error: memberReadError } =
    await member.client.storage.from(BUCKET).createSignedUrl(bannerPath, 60);
  const { data: privateOutsiderUrl, error: privateOutsiderReadError } =
    await outsider.client.storage.from(BUCKET).createSignedUrl(bannerPath, 60);

  if (memberReadError || !memberUrl?.signedUrl) {
    throw new Error("A private-room member could not read the room icon.");
  }

  if (!privateOutsiderReadError || privateOutsiderUrl?.signedUrl) {
    throw new Error("A private room icon was exposed to an outsider.");
  }

  const memberPath = `${room.id}/${crypto.randomUUID()}.jpg`;
  const { error: memberUploadError } = await member.client.storage
    .from(BUCKET)
    .upload(memberPath, banner, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (!memberUploadError) {
    createdStoragePaths.push(memberPath);
    throw new Error("A non-owner uploaded a room icon.");
  }

  const { data: memberUpdates, error: memberUpdateError } = await member.client
    .from("rooms")
    .update({ banner_storage_path: null })
    .eq("id", room.id)
    .select("id");

  if (!memberUpdateError && memberUpdates.length > 0) {
    throw new Error("A non-owner changed the active room icon.");
  }

  const { error: makePublicError } = await owner.client
    .from("rooms")
    .update({ is_public: true })
    .eq("id", room.id);
  const { data: publicUrl, error: publicReadError } =
    await outsider.client.storage.from(BUCKET).createSignedUrl(bannerPath, 60);

  if (makePublicError || publicReadError || !publicUrl?.signedUrl) {
    throw new Error("A signed-in visitor could not read a public room icon.");
  }

  const { error: removeError } = await owner.client.storage
    .from(BUCKET)
    .remove([bannerPath]);

  if (removeError) {
    throw new Error("The room owner could not remove their icon.");
  }

  createdStoragePaths.splice(createdStoragePaths.indexOf(bannerPath), 1);
  const { data: remainingObjects, error: listError } = await admin.storage
    .from(BUCKET)
    .list(room.id, { search: bannerPath.split("/")[1] });

  if (listError || remainingObjects.length !== 0) {
    throw new Error("The removed room icon still exists in Storage.");
  }

  process.stdout.write(
    "Room icon verification passed: constrained private bucket, versioned paths, owner-only writes, member/private access, public discovery, and owner deletion.\n",
  );
} finally {
  await cleanup();
}
