"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { ControllerInput } from "@/components/tricks/controller-input";
import { ControlSequence } from "@/components/tricks/control-sequence";
import { controlsForStance } from "@/lib/tricks/controls";
import type {
  ControlButton,
  NormalizedControlInput,
  StickPathPreset,
  TrickControls,
} from "@/types/trick";
import styles from "./control-editor.module.scss";

const buttonOptions: Array<[ControlButton, string]> = [
  ["left-trigger", "Left trigger (LT / L2)"],
  ["right-trigger", "Right trigger (RT / R2)"],
  ["left-bumper", "Left bumper (LB / L1)"],
  ["right-bumper", "Right bumper (RB / R1)"],
  ["face-top", "Face top (Y / Triangle)"],
  ["face-right", "Face right (B / Circle)"],
  ["face-bottom", "Face bottom (A / Cross)"],
  ["face-left", "Face left (X / Square)"],
  ["dpad-up", "D-pad up"],
  ["dpad-right", "D-pad right"],
  ["dpad-down", "D-pad down"],
  ["dpad-left", "D-pad left"],
];

const conditionOptions = [
  ["", "No condition"],
  ["In air", "In air"],
  ["From Dark Catch", "From Dark Catch"],
  ["Flip Dark Catch", "Flip Dark Catch"],
  ["While grinding", "While grinding"],
  ["While sliding", "While sliding"],
  ["While manualing", "While manualing"],
  ["Off-board", "Off-board"],
] as const;

const newButton = (): NormalizedControlInput => ({
  type: "button",
  control: "left-trigger",
  action: "press",
});
const newStick = (paths: StickPathPreset[]): NormalizedControlInput => ({
  type: "stick",
  stick: "right",
  action: "scoop",
  pathId: paths[0]?.id,
  path: { points: paths[0]?.points ?? [{ x: 0, y: 0 }] },
});

function copy(controls: TrickControls) {
  return structuredClone(controls);
}

export function ControlEditor({
  initialControls,
  referenceUrl,
  stickPaths,
}: {
  initialControls: TrickControls;
  referenceUrl?: string;
  stickPaths: StickPathPreset[];
}) {
  const [controls, setControls] = useState(initialControls);
  const editor = useRef<HTMLElement>(null);

  function mutate(change: (draft: TrickControls) => void) {
    setControls((current) => {
      const draft = copy(current);
      change(draft);
      return draft;
    });
    editor.current?.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function updateInput(
    variantIndex: number,
    stepIndex: number,
    inputIndex: number,
    input: NormalizedControlInput,
  ) {
    mutate((draft) => {
      draft.variants[variantIndex].steps[stepIndex].inputs[inputIndex] = input;
    });
  }

  return (
    <section ref={editor} className={styles.editor}>
      <input type="hidden" name="controls" value={JSON.stringify(controls)} />
      <header>
        <div>
          <span>Normalized controls</span>
          <h2>Control sequence</h2>
          <p>
            Author once, then preview and render the corresponding controls for
            both consoles and stances.
          </p>
        </div>
        <label>
          Recorded stance
          <select
            value={controls.authoredStance}
            onChange={(event) =>
              mutate((draft) => {
                draft.authoredStance = event.target.value as
                  "goofy" | "regular";
              })
            }
          >
            <option value="goofy">Goofy</option>
            <option value="regular">Regular</option>
          </select>
        </label>
      </header>
      <aside className={styles.reference}>
        <div>
          <strong>Control reference</strong>
          <span>
            {referenceUrl
              ? "Use this source while building the normalized sequence below."
              : "No control-reference image has been uploaded yet."}
          </span>
        </div>
        {referenceUrl && (
          <Image
            src={referenceUrl}
            alt="Source controller inputs for this trick"
            width={1600}
            height={320}
            unoptimized
          />
        )}
      </aside>
      {controls.variants.map((variant, variantIndex) => (
        <article key={variantIndex} className={styles.variant}>
          <div className={styles.variantHeader}>
            <label>
              Condition / context
              <select
                value={variant.context ?? ""}
                onChange={(event) =>
                  mutate((draft) => {
                    draft.variants[variantIndex].context =
                      event.target.value || undefined;
                  })
                }
              >
                {variant.context &&
                  !conditionOptions.some(
                    ([value]) => value === variant.context,
                  ) && (
                    <option value={variant.context}>
                      {variant.context} (existing)
                    </option>
                  )}
                {conditionOptions.map(([value, label]) => (
                  <option key={value || "none"} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Opposite stance
              <select
                value={variant.stanceBehavior}
                onChange={(event) =>
                  mutate((draft) => {
                    draft.variants[variantIndex].stanceBehavior = event.target
                      .value as "mirror" | "fixed";
                  })
                }
              >
                <option value="mirror">Mirror path + swap triggers</option>
                <option value="fixed">Keep inputs fixed</option>
              </select>
            </label>
            <button
              type="button"
              className={styles.danger}
              onClick={() =>
                mutate((draft) => {
                  draft.variants.splice(variantIndex, 1);
                })
              }
            >
              Remove variant
            </button>
          </div>
          <div className={styles.steps}>
            {variant.steps.map((step, stepIndex) => (
              <div key={stepIndex} className={styles.step}>
                <div className={styles.stepHeading}>
                  <strong>Step {stepIndex + 1}</strong>
                  <span>
                    {step.inputs.length > 1
                      ? "Inputs happen together"
                      : "Single input"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      mutate((draft) => {
                        draft.variants[variantIndex].steps.splice(stepIndex, 1);
                      })
                    }
                  >
                    Remove step
                  </button>
                </div>
                {step.inputs.map((input, inputIndex) => (
                  <div key={inputIndex} className={styles.inputCard}>
                    <div className={styles.inputFields}>
                      {inputIndex > 0 && (
                        <label className={styles.relationshipField}>
                          Relationship
                          <select
                            value={input.join ?? "and"}
                            onChange={(event) =>
                              updateInput(variantIndex, stepIndex, inputIndex, {
                                ...input,
                                join: event.target.value as "and" | "or",
                              })
                            }
                          >
                            <option value="and">AND — also required</option>
                            <option value="or">OR — alternative input</option>
                          </select>
                        </label>
                      )}
                      <label>
                        Input type
                        <select
                          value={input.type}
                          onChange={(event) =>
                            updateInput(variantIndex, stepIndex, inputIndex, {
                              ...(event.target.value === "stick"
                                ? newStick(stickPaths)
                                : newButton()),
                              join: input.join,
                            })
                          }
                        >
                          <option value="button">Button</option>
                          <option value="stick">Stick movement</option>
                        </select>
                      </label>
                      {input.type === "button" ? (
                        <>
                          <label>
                            Control
                            <select
                              value={input.control}
                              onChange={(event) =>
                                updateInput(
                                  variantIndex,
                                  stepIndex,
                                  inputIndex,
                                  {
                                    ...input,
                                    control: event.target
                                      .value as ControlButton,
                                  },
                                )
                              }
                            >
                              {buttonOptions.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Action
                            <select
                              value={input.action}
                              onChange={(event) =>
                                updateInput(
                                  variantIndex,
                                  stepIndex,
                                  inputIndex,
                                  {
                                    ...input,
                                    action: event.target.value as
                                      "press" | "hold" | "release",
                                  },
                                )
                              }
                            >
                              <option value="press">Press</option>
                              <option value="hold">Hold</option>
                              <option value="release">Release</option>
                            </select>
                          </label>
                        </>
                      ) : (
                        <>
                          <label>
                            Stick
                            <select
                              value={input.stick}
                              onChange={(event) =>
                                updateInput(
                                  variantIndex,
                                  stepIndex,
                                  inputIndex,
                                  {
                                    ...input,
                                    stick: event.target.value as
                                      "left" | "right",
                                  },
                                )
                              }
                            >
                              <option value="right">Right stick</option>
                              <option value="left">Left stick</option>
                            </select>
                          </label>
                          <label>
                            Action
                            <select
                              value={input.action}
                              onChange={(event) =>
                                updateInput(
                                  variantIndex,
                                  stepIndex,
                                  inputIndex,
                                  {
                                    ...input,
                                    action: event.target
                                      .value as typeof input.action,
                                  },
                                )
                              }
                            >
                              <option value="flick">Flick</option>
                              <option value="scoop">Scoop</option>
                              <option value="scoop-then-flick">
                                Scoop then flick
                              </option>
                              <option value="rotate">Rotate</option>
                              <option value="hold">Hold</option>
                              <option value="release">Release</option>
                            </select>
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        className={styles.danger}
                        disabled={step.inputs.length === 1}
                        title={
                          step.inputs.length === 1
                            ? "A step must contain at least one input"
                            : undefined
                        }
                        onClick={() =>
                          mutate((draft) => {
                            draft.variants[variantIndex].steps[
                              stepIndex
                            ].inputs.splice(inputIndex, 1);
                          })
                        }
                      >
                        Remove input
                      </button>
                    </div>
                    {input.type === "stick" && (
                      <div className={styles.pathChoice}>
                        <label>
                          Saved stick path
                          <select
                            value={input.pathId ?? ""}
                            onChange={(event) => {
                              const selected = stickPaths.find(
                                (path) => path.id === event.target.value,
                              );
                              if (selected)
                                updateInput(
                                  variantIndex,
                                  stepIndex,
                                  inputIndex,
                                  {
                                    ...input,
                                    pathId: selected.id,
                                    path: { points: selected.points },
                                  },
                                );
                            }}
                          >
                            {!input.pathId && (
                              <option value="">Legacy custom path</option>
                            )}
                            {stickPaths.length ? (
                              stickPaths.map((path) => (
                                <option key={path.id} value={path.id}>
                                  {path.name}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>
                                No saved paths yet
                              </option>
                            )}
                          </select>
                        </label>
                        <ControllerInput input={input} platform="xbox" />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addInput}
                  onClick={() =>
                    mutate((draft) => {
                      draft.variants[variantIndex].steps[stepIndex].inputs.push(
                        newButton(),
                      );
                    })
                  }
                >
                  + Add simultaneous input
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={styles.addStep}
            onClick={() =>
              mutate((draft) => {
                draft.variants[variantIndex].steps.push({
                  inputs: [newButton()],
                });
              })
            }
          >
            + Add next step
          </button>
        </article>
      ))}
      <button
        type="button"
        className={styles.addVariant}
        onClick={() =>
          mutate((draft) => {
            draft.variants.push({
              stanceBehavior: "mirror",
              steps: [{ inputs: [newButton()] }],
            });
          })
        }
      >
        + Add control variant
      </button>
      {controls.variants.length > 0 && (
        <div className={styles.preview}>
          <h3>Generated previews</h3>
          <p>
            Regular mirrors horizontal stick movement and swaps triggers.
            Console labels and artwork are mapped automatically.
          </p>
          <div>
            {(["goofy", "regular"] as const).flatMap((stance) =>
              (["xbox", "playstation"] as const).map((platform) => (
                <section key={`${stance}-${platform}`}>
                  <strong>
                    {stance} · {platform}
                  </strong>
                  <ControlSequence
                    variants={controlsForStance(controls, stance)}
                    platform={platform}
                  />
                </section>
              )),
            )}
          </div>
        </div>
      )}
    </section>
  );
}
