export type ControllerPlatform = "xbox" | "playstation";
export type TrickDifficulty =
  "beginner" | "intermediate" | "advanced" | "expert";
export type SkaterStance = "regular" | "goofy";

export type ControlButton =
  | "left-trigger"
  | "right-trigger"
  | "left-bumper"
  | "right-bumper"
  | "face-top"
  | "face-right"
  | "face-bottom"
  | "face-left"
  | "dpad-up"
  | "dpad-right"
  | "dpad-down"
  | "dpad-left";

export type StickPoint = { x: number; y: number };
export type StickPathPreset = {
  id: string;
  slug: string;
  name: string;
  points: StickPoint[];
};

export type NormalizedControlInput =
  | {
      type: "button";
      control: ControlButton;
      action: "press" | "hold" | "release";
      join?: "and" | "or";
    }
  | {
      type: "stick";
      stick: "left" | "right";
      action:
        "flick" | "scoop" | "scoop-then-flick" | "rotate" | "hold" | "release";
      join?: "and" | "or";
      pathId?: string;
      path: { points: StickPoint[]; closed?: boolean };
    };

export type ControlStep = { inputs: NormalizedControlInput[] };
export type ControlVariant = {
  context?: string;
  stanceBehavior: "mirror" | "fixed";
  steps: ControlStep[];
};
export type TrickControls = {
  version: 2;
  authoredStance: SkaterStance;
  variants: ControlVariant[];
};

export type ControlInput =
  | StickControl
  | TriggerControl
  | BumperControl
  | FaceButtonControl
  | DPadControl;

export type StickControl = {
  type: "stick";
  stick: "left" | "right";
  action: "hold" | "flick" | "scoop" | "rotate" | "release";
  movement: string;
  path?: string[];
};

export type TriggerControl = {
  type: "trigger";
  side: "left" | "right";
  action: "hold" | "press" | "release";
};

export type BumperControl = {
  type: "bumper";
  side: "left" | "right";
  action: "hold" | "press" | "release";
};

export type FaceButtonControl = {
  type: "face-button";
  position: "top" | "right" | "bottom" | "left";
  action: "hold" | "press" | "release";
};

export type DPadControl = {
  type: "d-pad";
  direction: "up" | "right" | "down" | "left";
  action: "hold" | "press" | "release";
};

export type TrickCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  pageEyebrow?: string;
  pageHeading?: string;
  popularHeading?: string;
  heroImageUrl?: string;
  accentColor: string;
  gradientStartColor: string;
  gradientMiddleColor: string;
  gradientEndColor: string;
  parentId?: string;
  sortOrder: number;
};

export type Trick = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryId: string;
  description: string;
  difficulty?: TrickDifficulty;
  context?: string;
  aliases: string[];
  controls: TrickControls;
  videoUrl?: string;
  guideVideoUrl?: string;
  posterUrl?: string;
  originalPosterUrl?: string;
  controlsImageUrl: string;
  controlsReferenceUrl: string;
  viewCount: number;
  favouriteCount: number;
  sortOrder: number;
};
