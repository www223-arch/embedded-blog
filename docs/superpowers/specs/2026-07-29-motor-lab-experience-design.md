# Motor Lab Project Experience Design

## Purpose

Replace the FOC project's decorative signal-orbit backdrop with a tactile motor
lab experience inspired by Lunar's object-led storytelling. The visitor should
first manipulate a motor, then illuminate the active experiment, and finally
move into a readable engineering chronicle without leaving the site's existing
cosmic interface.

This is not a universal project template. It is one visual preset attached to a
shared project narrative shell. Other projects may use the ordinary reader, the
existing signal-orbit preset, or future custom presets with entirely different
objects and interaction rules.

## Product Principles

- The engineering object is the protagonist; space is the environment.
- Interaction explains project state instead of decorating a document.
- The first meaningful action is direct manipulation: drag the motor to inspect
  it, then activate the current experiment.
- Readable DOM content remains complete and canonical. WebGL never owns project
  text, navigation, evidence, or route state.
- The experience remains inside the existing project-detail page, header,
  background, return flow, and visual language.
- The dedicated scene is optional. Missing content, reduced motion, narrow
  screens, or WebGL failure always produce a useful project reader.

## Experience Sequence

### 1. Observation Mode

The first viewport is sparse. It contains the project title, short summary,
current focus, an explicit `点亮当前实验` command, and one low-poly motor
assembly. The visitor can drag the assembly horizontally and vertically. A
short instruction disappears after the first manipulation.

The motor is built from purposeful parts: housing, stator coils, rotor, shaft,
encoder disc, and three phase paths. Hovering or clicking a part highlights it
and updates a compact DOM readout. There is no free camera flight, zoom, or
scroll hijacking.

### 2. Diagnostic Mode

Activating the current experiment smoothly pushes the camera closer. The
housing becomes translucent, the encoder ring and active phase paths illuminate,
and a spatial speed trace appears around the shaft. A DOM diagnostic panel names
the current problem, the working hypothesis, and the next validation step.

The visitor can leave diagnostic mode at any time. The same command is available
by keyboard and exposes `aria-pressed` state. Diagnostic state belongs to the
mounted project page and is discarded when the route changes.

### 3. Engineering Chronicle

Native page scroll leads from the lab viewport into project chapters. The motor
remains a restrained sticky reference on supported desktop screens. Active
chapters change the scene emphasis:

| Chapter | Scene emphasis |
| --- | --- |
| Stepper bring-up | Complete assembly and first reproducible rotation |
| Frequency-domain SOP | Phase paths and response trace |
| Speed ripple and encoder calibration | Encoder disc, ripple trace, diagnostic state |
| Open question | Uncertain encoder samples and violet hypothesis marker |
| FOC library and future control | Clean interface rings and outward phase paths |

Chapter text is unframed or lightly surfaced rather than stacked as large dark
cards. The rail remains a compact navigation aid. Evidence stays in the existing
accessible dialog.

## Preset Architecture

`ProjectItem.visualPreset` accepts `motor-lab` in addition to existing presets.
The immersive shell remains shared. A small scene loader maps the preset to a
scene module and returns a common controller:

```ts
export type ImmersiveSceneController = {
  setActiveChapter(index: number): void;
  setDiagnosticMode?(active: boolean): void;
  dispose(): void;
};
```

`signal` continues to load the current orbit scene. `motor-lab` dynamically
loads its own scene and interaction code. Unsupported or future preset values
are rejected by content validation rather than silently loading the wrong scene.

The shell may render preset-specific DOM controls, but scene modules never parse
Markdown. This lets future projects add bespoke scenes without duplicating
content rendering, evidence handling, navigation, or accessibility behavior.

## Motor Scene

The motor uses Three.js primitives and shared materials instead of a downloaded
model. This keeps the prototype editable, deterministic, and small while still
reading as a real engineered assembly.

- One cylinder-based housing with a cutaway/translucent diagnostic state.
- Twelve copper stator coils arranged around the rotor.
- One rotor stack, shaft, front bearing, rear encoder disc, and index mark.
- Three colored phase paths with restrained emissive response.
- One procedural speed trace whose ripple increases in diagnostic mode.
- Soft key, rim, and fill lights; no bloom or post-processing pipeline.
- One seeded star layer and subtle lab grid to connect to the existing site.

The canvas owns pointer interaction only while dragging or selecting the motor.
Wheel input continues to scroll the page. Pointer movement below the drag
threshold is treated as part selection; larger movement rotates the assembly.

## Content Contract

The FOC Markdown remains the primary maintenance surface. It opts into the new
scene with:

```yaml
presentation: immersive
visualPreset: motor-lab
currentFocus: 速度波动优化与编码器校准
```

Existing narrative blocks continue to define the chronology. No Three.js code,
coordinates, or camera values enter Markdown. The first implementation derives
scene emphasis from chapter order and status. A future project-specific data
file may add richer hotspots only when real project material warrants it.

## Performance, Failure, and Accessibility

- Load Three.js and the motor scene only on the `motor-lab` route.
- Use one canvas and cap device pixel ratio at `1.5`.
- Pause rendering while the document is hidden and dispose all resources on
  route cleanup.
- Do not allocate geometry, materials, vectors, or colors per frame.
- Below `760px` and under `prefers-reduced-motion`, render a static project cover
  and complete DOM chronicle without the interactive canvas.
- If WebGL creation fails, mark the host unsupported and keep all controls and
  content usable; diagnostic controls update DOM even without a scene.
- The canvas is not a keyboard destination. Part selection is supplemental;
  current experiment and chapter navigation remain semantic DOM controls.

## Acceptance Criteria

- The FOC first viewport visibly centers a motor assembly, not orbital artwork.
- Drag rotates the motor smoothly without blocking native scroll.
- Clicking `点亮当前实验` enters and exits a visibly different diagnostic state.
- Encoder, rotor, and phase components are visually distinct and selectable.
- Chapter scrolling updates both the DOM rail and motor emphasis.
- Existing `signal` and standard project experiences still render.
- Mobile, reduced-motion, and WebGL-failure paths remain fully readable.
- Leaving and re-entering the project never creates a second canvas or listener.
- Focused tests, content tests, TypeScript, production build, and desktop/mobile
  browser checks pass before delivery.
