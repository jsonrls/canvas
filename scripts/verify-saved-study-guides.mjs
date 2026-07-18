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
  const email = `boardprep-saved-guides-${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = `SavedGuides-${crypto.randomUUID()}-A1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: `Saved guides ${label}` },
  });

  if (error || !data.user) throw new Error(`Could not create ${label} user.`);
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
    throw new Error(`Could not authenticate ${label} user.`);
  }

  return {
    client: createUserClient(sessionData.session.access_token),
    email,
    id: data.user.id,
  };
}

const studyPack = {
  summary: {
    title: "Saved cardiac output review",
    overview:
      "Cardiac output combines heart rate and stroke volume, while preload and afterload shape stroke volume.",
    keyPoints: [
      "CO equals HR times SV.",
      "Preload reflects filling.",
      "Afterload resists ejection.",
    ],
    openQuestions: [],
  },
  quiz: [
    {
      question: "Which equation defines cardiac output?",
      options: ["CO = HR × SV", "CO = HR + SV", "CO = HR ÷ SV", "CO = SV − HR"],
      answerIndex: 0,
      explanation: "Cardiac output is heart rate multiplied by stroke volume.",
    },
    {
      question: "What does preload describe?",
      options: ["Filling", "Resistance", "Rate", "Pressure"],
      answerIndex: 0,
      explanation: "Preload reflects ventricular filling before contraction.",
    },
    {
      question: "What does afterload describe?",
      options: [
        "Filling",
        "Ejection resistance",
        "Heart rate",
        "Contractility",
      ],
      answerIndex: 1,
      explanation: "Afterload is the resistance the ventricle overcomes.",
    },
  ],
  flashcards: [
    {
      front: "Cardiac output",
      back: "Heart rate multiplied by stroke volume.",
    },
    { front: "Preload", back: "Ventricular filling before contraction." },
    { front: "Afterload", back: "Resistance to ventricular ejection." },
    {
      front: "Frank-Starling",
      back: "Filling can increase force within limits.",
    },
  ],
  recommendations: [
    {
      kind: "review",
      title: "Review the core equation",
      rationale: "The equation links the two main output variables.",
      nextStep: "Complete three short CO calculation problems.",
    },
    {
      kind: "connect",
      title: "Connect filling to output",
      rationale: "Connections make the physiology easier to apply.",
      nextStep: "Explain how preload changes stroke volume.",
    },
  ],
  misconceptions: [],
};

async function cleanup() {
  for (const roomId of createdRoomIds) {
    await admin.from("rooms").delete().eq("id", roomId);
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
  const { data: rooms, error: roomError } = await owner.client.rpc(
    "create_study_room",
    { input_is_public: false, input_name: "Saved guide verification" },
  );
  const room = rooms?.[0];
  if (roomError || !room?.room_id || !room?.room_slug) {
    throw new Error("Could not create the verification room.");
  }
  createdRoomIds.push(room.room_id);

  const { error: addViewerError } = await owner.client.rpc(
    "add_room_member_by_email",
    {
      input_email: viewer.email,
      input_role: "viewer",
      input_room_id: room.room_id,
    },
  );
  if (addViewerError) throw new Error("Could not add the viewer member.");

  const payload = {
    created_by: owner.id,
    generated_at: new Date().toISOString(),
    room_id: room.room_id,
    source_characters: 240,
    study_pack: studyPack,
    title: studyPack.summary.title,
  };
  const { data: inserted, error: insertError } = await owner.client
    .from("saved_study_guides")
    .insert(payload)
    .select(
      "id, title, generated_at, source_characters, created_at, study_pack",
    )
    .single();
  if (insertError || !inserted) {
    throw new Error(
      `Owner could not save a guide: ${insertError?.code ?? "no-data"} ${insertError?.message ?? ""}`,
    );
  }

  const { data: ownerList, error: ownerListError } = await owner.client
    .from("saved_study_guides")
    .select("id, title, generated_at, source_characters, created_at")
    .eq("room_id", room.room_id)
    .eq("created_by", owner.id);
  if (ownerListError || ownerList?.length !== 1) {
    throw new Error("Owner list did not return metadata-only saved guides.");
  }

  const { data: ownerDetail, error: detailError } = await owner.client
    .from("saved_study_guides")
    .select("study_pack, source_characters")
    .eq("id", inserted.id)
    .eq("room_id", room.room_id)
    .single();
  if (detailError || ownerDetail?.source_characters !== 240) {
    throw new Error("Owner could not load the saved guide payload.");
  }

  const { data: viewerRows, error: viewerError } = await viewer.client
    .from("saved_study_guides")
    .select("id")
    .eq("id", inserted.id);
  if (viewerError || viewerRows?.length !== 0) {
    throw new Error(
      "A different room member could read the creator-private guide.",
    );
  }

  const { data: outsiderRows, error: outsiderError } = await outsider.client
    .from("saved_study_guides")
    .select("id")
    .eq("id", inserted.id);
  if (outsiderError || outsiderRows?.length !== 0) {
    throw new Error("An outsider could read a saved guide.");
  }

  const { data: viewerDeleted, error: viewerDeleteError } = await viewer.client
    .from("saved_study_guides")
    .delete()
    .eq("id", inserted.id)
    .select("id");
  if (viewerDeleteError || viewerDeleted?.length !== 0)
    throw new Error("A different member could delete the guide.");

  const { data: ownerDeleted, error: ownerDeleteError } = await owner.client
    .from("saved_study_guides")
    .delete()
    .eq("id", inserted.id)
    .select("id");
  if (ownerDeleteError || ownerDeleted?.length !== 1)
    throw new Error("Owner could not delete the saved guide.");

  console.log(
    "Saved study-guide verification passed: metadata-only lists, creator detail, member/outsider isolation, immutable grants, owner delete, and cleanup lifecycle.",
  );
} finally {
  await cleanup();
}
