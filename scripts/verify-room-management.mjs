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
const createdUserIds = [];
const createdRoomIds = [];

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
  const email = `boardprep-room-${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = `Room-${crypto.randomUUID()}-A1!`;
  const displayName = `Room Verification ${label}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: displayName },
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
    displayName,
    email,
    id: data.user.id,
  };
}

async function createRoomAs(user, name, isPublic) {
  const { data, error } = await user.client.rpc("create_study_room", {
    input_is_public: isPublic,
    input_name: name,
  });
  const room = data?.[0];

  if (
    error ||
    typeof room?.room_id !== "string" ||
    typeof room.room_slug !== "string"
  ) {
    throw new Error(
      `Atomic room creation failed: ${error?.message ?? "no row"}`,
    );
  }

  createdRoomIds.push(room.room_id);
  return { id: room.room_id, slug: room.room_slug };
}

async function cleanup() {
  if (createdRoomIds.length > 0) {
    await admin.from("rooms").delete().in("id", createdRoomIds);
  }

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}

try {
  const [owner, member, outsider] = await Promise.all([
    createVerifiedUser("owner"),
    createVerifiedUser("member"),
    createVerifiedUser("outsider"),
  ]);

  const { error: directInsertError } = await owner.client.from("rooms").insert({
    is_public: false,
    name: "Partial room must fail",
    owner_id: owner.id,
    slug: `partial-${Date.now()}`,
  });

  if (!directInsertError) {
    throw new Error("Authenticated users can still create partial room rows.");
  }

  const first = await createRoomAs(owner, "Cardiology Focus", false);
  const second = await createRoomAs(owner, "Cardiology Focus", false);

  if (
    first.slug === second.slug ||
    !/^[a-z0-9-]{1,64}$/.test(first.slug) ||
    !/^[a-z0-9-]{1,64}$/.test(second.slug)
  ) {
    throw new Error("Atomic room creation did not produce unique valid slugs.");
  }

  const [{ data: ownerMemberships }, { data: documents }] = await Promise.all([
    admin
      .from("room_members")
      .select("user_id, role")
      .eq("room_id", first.id)
      .eq("user_id", owner.id),
    admin.from("documents").select("id, kind").eq("room_id", first.id),
  ]);

  if (
    ownerMemberships?.length !== 1 ||
    ownerMemberships[0].role !== "owner" ||
    documents?.length !== 3 ||
    !["notes", "pdf", "whiteboard"].every((kind) =>
      documents.some((document) => document.kind === kind),
    )
  ) {
    throw new Error(
      "Atomic room creation missed its owner or study-tool invariants.",
    );
  }

  const { data: hiddenPrivateRooms, error: hiddenPrivateError } =
    await outsider.client.from("rooms").select("id").eq("slug", first.slug);

  if (hiddenPrivateError || hiddenPrivateRooms.length !== 0) {
    throw new Error("Private room RLS exposed an uninvited room.");
  }

  const { error: privateJoinError } = await outsider.client
    .from("room_members")
    .insert({ role: "editor", room_id: first.id, user_id: outsider.id });

  if (!privateJoinError) {
    throw new Error("An uninvited user joined a private room.");
  }

  const { data: addedMembers, error: addMemberError } = await owner.client.rpc(
    "add_room_member_by_email",
    {
      input_email: member.email.toUpperCase(),
      input_role: "viewer",
      input_room_id: first.id,
    },
  );

  if (
    addMemberError ||
    addedMembers?.[0]?.member_user_id !== member.id ||
    addedMembers[0].member_display_name !== member.displayName ||
    addedMembers[0].member_assigned_role !== "viewer"
  ) {
    throw new Error("The owner could not add an existing account by email.");
  }

  const { error: outsiderAddError } = await outsider.client.rpc(
    "add_room_member_by_email",
    {
      input_email: outsider.email,
      input_role: "editor",
      input_room_id: first.id,
    },
  );

  if (!outsiderAddError) {
    throw new Error("A non-owner added a room collaborator.");
  }

  const { data: visiblePrivateRoom, error: visiblePrivateError } =
    await member.client.from("rooms").select("id").eq("slug", first.slug);

  if (
    visiblePrivateError ||
    visiblePrivateRoom.length !== 1 ||
    visiblePrivateRoom[0].id !== first.id
  ) {
    throw new Error("An invited member could not see the private room.");
  }

  const { data: viewerWrites, error: viewerWriteError } = await member.client
    .from("documents")
    .update({ title: "Viewer must not write" })
    .eq("room_id", first.id)
    .select("id");

  if (!viewerWriteError && viewerWrites.length > 0) {
    throw new Error("A viewer modified room notes.");
  }

  const { error: outsiderToggleError } = await outsider.client.rpc(
    "set_viewer_collaboration",
    {
      input_enabled: true,
      input_room_id: first.id,
    },
  );

  if (!outsiderToggleError) {
    throw new Error("A non-member changed viewer collaboration.");
  }

  const { data: enabled, error: enableError } = await owner.client.rpc(
    "set_viewer_collaboration",
    {
      input_enabled: true,
      input_room_id: first.id,
    },
  );

  if (enableError || enabled !== true) {
    throw new Error("The owner could not enable viewer collaboration.");
  }

  const { data: collaboratingWrites, error: collaboratingWriteError } =
    await member.client
      .from("documents")
      .update({
        title: "Viewer collaboration verified",
        updated_by: member.id,
      })
      .eq("room_id", first.id)
      .eq("kind", "notes")
      .select("id");

  if (collaboratingWriteError || collaboratingWrites.length !== 1) {
    throw new Error("An enabled viewer could not collaborate on room notes.");
  }

  const { data: disabled, error: disableError } = await owner.client.rpc(
    "set_viewer_collaboration",
    {
      input_enabled: false,
      input_room_id: first.id,
    },
  );

  if (disableError || disabled !== false) {
    throw new Error("The owner could not disable viewer collaboration.");
  }

  const { data: disabledWrites, error: disabledWriteError } =
    await member.client
      .from("documents")
      .update({ title: "Disabled viewer must not write" })
      .eq("room_id", first.id)
      .eq("kind", "notes")
      .select("id");

  if (!disabledWriteError && disabledWrites.length > 0) {
    throw new Error("A viewer kept editing after collaboration was disabled.");
  }

  const { data: promoted, error: promoteError } = await owner.client
    .from("room_members")
    .update({ role: "editor" })
    .eq("room_id", first.id)
    .eq("user_id", member.id)
    .select("user_id, role");

  if (promoteError || promoted.length !== 1 || promoted[0].role !== "editor") {
    throw new Error("The owner could not promote a viewer to editor.");
  }

  const { data: editorWrites, error: editorWriteError } = await member.client
    .from("documents")
    .update({ title: "Editor verified", updated_by: member.id })
    .eq("room_id", first.id)
    .eq("kind", "notes")
    .select("id");

  if (editorWriteError || editorWrites.length !== 1) {
    throw new Error("An editor could not update room notes.");
  }

  const { data: ownerDemotion, error: ownerDemotionError } = await owner.client
    .from("room_members")
    .update({ role: "viewer" })
    .eq("room_id", first.id)
    .eq("user_id", owner.id)
    .select("user_id");
  const { data: ownerRemoval, error: ownerRemovalError } = await owner.client
    .from("room_members")
    .delete()
    .eq("room_id", first.id)
    .eq("user_id", owner.id)
    .select("user_id");

  if (
    (!ownerDemotionError && ownerDemotion.length > 0) ||
    (!ownerRemovalError && ownerRemoval.length > 0)
  ) {
    throw new Error("The immutable owner membership was changed or removed.");
  }

  const { data: memberRoomUpdates, error: memberRoomUpdateError } =
    await member.client
      .from("rooms")
      .update({ name: "Unauthorized member rename" })
      .eq("id", first.id)
      .select("id");

  if (!memberRoomUpdateError && memberRoomUpdates.length > 0) {
    throw new Error("A non-owner changed room settings.");
  }

  const { data: publicUpdate, error: publicUpdateError } = await owner.client
    .from("rooms")
    .update({ is_public: true, name: "Cardiology Focus Updated" })
    .eq("id", first.id)
    .select("name, is_public, updated_at");

  if (
    publicUpdateError ||
    publicUpdate.length !== 1 ||
    publicUpdate[0].name !== "Cardiology Focus Updated" ||
    !publicUpdate[0].is_public ||
    typeof publicUpdate[0].updated_at !== "string"
  ) {
    throw new Error("The owner could not update room name and visibility.");
  }

  const { data: discoverable, error: discoverableError } = await outsider.client
    .from("rooms")
    .select("id")
    .eq("id", first.id);

  if (discoverableError || discoverable.length !== 1) {
    throw new Error("A public room was not discoverable to a signed-in user.");
  }

  const { error: escalatedJoinError } = await outsider.client
    .from("room_members")
    .insert({ role: "owner", room_id: first.id, user_id: outsider.id });

  if (!escalatedJoinError) {
    throw new Error("A public joiner escalated to owner.");
  }

  const { data: joined, error: joinError } = await outsider.client.rpc(
    "join_public_room",
    { input_room_id: first.id },
  );

  if (
    joinError ||
    joined.length !== 1 ||
    joined[0].joined_room_id !== first.id ||
    joined[0].joined_role !== "editor"
  ) {
    throw new Error(
      `A signed-in user could not explicitly join a public room: ${joinError?.message ?? JSON.stringify(joined)}.`,
    );
  }

  const { data: left, error: leaveError } = await outsider.client
    .from("room_members")
    .delete()
    .eq("room_id", first.id)
    .eq("user_id", outsider.id)
    .select("user_id");

  if (leaveError || left.length !== 1) {
    throw new Error("A non-owner could not explicitly leave a room.");
  }

  const { error: privateUpdateError } = await owner.client
    .from("rooms")
    .update({ is_public: false })
    .eq("id", first.id);
  const { data: removed, error: removeError } = await owner.client
    .from("room_members")
    .delete()
    .eq("room_id", first.id)
    .eq("user_id", member.id)
    .select("user_id");

  if (privateUpdateError || removeError || removed.length !== 1) {
    throw new Error("The owner could not remove a non-owner collaborator.");
  }

  const { data: hiddenAfterRemoval, error: hiddenAfterRemovalError } =
    await member.client.from("rooms").select("id").eq("id", first.id);

  if (hiddenAfterRemovalError || hiddenAfterRemoval.length !== 0) {
    throw new Error("A removed member retained private-room access.");
  }

  const { data: deletedRooms, error: deleteError } = await owner.client
    .from("rooms")
    .delete()
    .in("id", [first.id, second.id])
    .select("id");

  if (deleteError || deletedRooms.length !== 2) {
    throw new Error("The owner could not delete owned rooms.");
  }

  const [{ count: membershipCount }, { count: documentCount }] =
    await Promise.all([
      admin
        .from("room_members")
        .select("*", { count: "exact", head: true })
        .in("room_id", [first.id, second.id]),
      admin
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("room_id", [first.id, second.id]),
    ]);

  if (membershipCount !== 0 || documentCount !== 0) {
    throw new Error(
      "Room deletion did not cascade to memberships and documents.",
    );
  }

  process.stdout.write(
    "Room management verification passed: atomic creation with three study tools, unique slugs, private/public access, exact-email membership, global viewer collaboration, roles, immutable ownership, join/leave, owner settings, deletion, and cascades.\n",
  );
} finally {
  await cleanup();
}
