import { HOUSE_SPOTS, SPOT_LABELS, type HouseSpot } from "@/components/room/CatHouse";
import { ANIM_LABELS, SPOT_ACTIVITY, type CatAnimState } from "@/lib/cat-animation";
import { QUALITY_PROFILES, type QualityLevel, type QualityProfile } from "@/lib/quality";

export type RoomObjectAsset = {
  id: HouseSpot;
  label: string;
  position: readonly [number, number, number];
  activity: CatAnimState;
};

export type RoomAssetManifest = {
  version: string;
  updatedAt: string;
  room: {
    id: string;
    name: string;
    dimensions: [number, number, number];
    cameraHome: [number, number, number];
    palette: {
      background: string;
      floor: string;
      wallBack: string;
      wallSide: string;
      rug: string;
    };
  };
  catModel: {
    id: string;
    format: "procedural-3d" | "gltf";
    defaultFurColor: string;
    parts: ("kepala" | "badan" | "ekor")[];
    animations: { state: CatAnimState; label: string }[];
  };
  objects: RoomObjectAsset[];
  qualityProfiles: Record<QualityLevel, QualityProfile>;
};

export function getRoomAssetManifest(quality?: QualityLevel): RoomAssetManifest & { selectedProfile?: QualityProfile } {
  const objects = (Object.keys(HOUSE_SPOTS) as HouseSpot[]).map((spot) => ({
    id: spot,
    label: SPOT_LABELS[spot],
    position: HOUSE_SPOTS[spot],
    activity: SPOT_ACTIVITY[spot],
  }));

  const animations = (Object.keys(ANIM_LABELS) as CatAnimState[]).map((state) => ({
    state,
    label: ANIM_LABELS[state],
  }));

  return {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    room: {
      id: "default-cozy-room",
      name: "Ruang Hangat Mochi",
      dimensions: [8, 4, 8],
      cameraHome: [3.5, 3, 5],
      palette: {
        background: "#fff6ef",
        floor: "#e3c9a8",
        wallBack: "#fde7e1",
        wallSide: "#fbeee0",
        rug: "#f7c6c7",
      },
    },
    catModel: {
      id: "mochi-procedural-v1",
      format: "procedural-3d",
      defaultFurColor: "#f4b673",
      parts: ["kepala", "badan", "ekor"],
      animations,
    },
    objects,
    qualityProfiles: QUALITY_PROFILES,
    ...(quality && QUALITY_PROFILES[quality] ? { selectedProfile: QUALITY_PROFILES[quality] } : {}),
  };
}
