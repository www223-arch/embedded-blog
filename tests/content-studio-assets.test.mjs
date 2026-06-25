import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ContentStoreError } from "../tools/content-studio/server/content-store.mjs";
import { createAssetStore } from "../tools/content-studio/server/asset-store.mjs";

test("asset store uploads and lists images with normalized names", async () => {
  const tempRoot = await createTempRoot();
  try {
    const store = createAssetStore(tempRoot);
    const first = await store.upload("docs", "asset-check", {
      fileName: "Circuit Diagram.PNG",
      dataBase64: Buffer.from("fake-png").toString("base64")
    });
    const second = await store.upload("docs", "asset-check", {
      fileName: "Circuit Diagram.PNG",
      dataBase64: Buffer.from("fake-png-2").toString("base64")
    });

    assert.equal(first.asset.kind, "images");
    assert.equal(first.asset.url, "/images/docs/asset-check/circuit-diagram.png");
    assert.equal(second.asset.url, "/images/docs/asset-check/circuit-diagram-2.png");

    const saved = await readFile(path.join(tempRoot, "public/images/docs/asset-check/circuit-diagram.png"), "utf8");
    assert.equal(saved, "fake-png");

    const listed = await store.list("docs", "asset-check");
    assert.equal(listed.length, 2);
    assert.ok(listed.every((asset) => asset.kind === "images"));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("asset store routes videos to public videos", async () => {
  const tempRoot = await createTempRoot();
  try {
    const store = createAssetStore(tempRoot);
    const result = await store.upload("projects", "asset-check", {
      fileName: "Offline Recovery Demo.mp4",
      dataBase64: Buffer.from("fake-video").toString("base64")
    });

    assert.equal(result.asset.kind, "videos");
    assert.equal(result.asset.url, "/videos/projects/asset-check/offline-recovery-demo.mp4");
    const saved = await readFile(path.join(tempRoot, "public/videos/projects/asset-check/offline-recovery-demo.mp4"), "utf8");
    assert.equal(saved, "fake-video");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("asset store rejects unsupported extensions", async () => {
  const tempRoot = await createTempRoot();
  try {
    const store = createAssetStore(tempRoot);
    await assert.rejects(
      () =>
        store.upload("docs", "asset-check", {
          fileName: "notes.exe",
          dataBase64: Buffer.from("nope").toString("base64")
        }),
      (error) => error instanceof ContentStoreError && error.code === "UNSUPPORTED_ASSET_TYPE" && error.status === 400
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

async function createTempRoot() {
  return mkdtemp(path.join(tmpdir(), "content-studio-assets-"));
}
