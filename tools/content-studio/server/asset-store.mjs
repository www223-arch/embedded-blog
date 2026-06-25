import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { ContentStoreError, assertContentId, assertContentType } from "./content-store.mjs";

const contentDirectories = {
  docs: "docs",
  projects: "projects",
  life: "life"
};

const assetKinds = {
  images: {
    directory: "images",
    maxBytes: 15 * 1024 * 1024,
    extensions: new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg"])
  },
  videos: {
    directory: "videos",
    maxBytes: 30 * 1024 * 1024,
    extensions: new Set([".mp4", ".webm"])
  }
};

export function createAssetStore(rootDir) {
  const projectRoot = path.resolve(rootDir);
  const publicRoot = path.resolve(rootDir, "public");

  return {
    async list(type, id) {
      const safeType = assertContentType(type);
      const safeId = assertContentId(id);
      return listAssets(projectRoot, publicRoot, safeType, safeId);
    },

    async upload(type, id, input) {
      const safeType = assertContentType(type);
      const safeId = assertContentId(id);
      return uploadAsset(projectRoot, publicRoot, safeType, safeId, input);
    }
  };
}

async function listAssets(projectRoot, publicRoot, type, id) {
  const groups = await Promise.all(
    Object.entries(assetKinds).map(async ([kind, config]) => {
      const directory = assetDirectory(publicRoot, kind, type, id);
      const files = await listFiles(directory);
      return Promise.all(files.map((filePath) => toAsset(projectRoot, publicRoot, kind, filePath)));
    })
  );

  return groups
    .flat()
    .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt) || a.name.localeCompare(b.name));
}

async function uploadAsset(projectRoot, publicRoot, type, id, input) {
  const originalName = valueAsString(input?.fileName).trim();
  const extension = path.extname(originalName).toLowerCase();
  const kind = kindForExtension(extension);
  if (!kind) {
    throw new ContentStoreError("UNSUPPORTED_ASSET_TYPE", "只支持 jpg、png、webp、avif、gif、svg、mp4 和 webm。", 400);
  }

  const dataBase64 = valueAsString(input?.dataBase64).trim();
  if (!dataBase64) {
    throw new ContentStoreError("EMPTY_ASSET", "上传文件不能为空。", 400);
  }

  const bytes = Buffer.from(dataBase64, "base64");
  if (!bytes.length) {
    throw new ContentStoreError("EMPTY_ASSET", "上传文件不能为空。", 400);
  }
  if (bytes.byteLength > assetKinds[kind].maxBytes) {
    throw new ContentStoreError("ASSET_TOO_LARGE", kind === "videos" ? "小视频不能超过 30MB。" : "图片或 GIF 不能超过 15MB。", 413);
  }

  const directory = assetDirectory(publicRoot, kind, type, id);
  await mkdir(directory, { recursive: true });
  const fileName = await createUniqueAssetName(directory, originalName, extension);
  const filePath = path.resolve(directory, fileName);
  assertInside(directory, filePath);
  await writeFile(filePath, bytes, { flag: "wx" });

  return {
    asset: await toAsset(projectRoot, publicRoot, kind, filePath),
    assets: await listAssets(projectRoot, publicRoot, type, id)
  };
}

async function listFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => path.resolve(directory, entry.name));
}

async function toAsset(projectRoot, publicRoot, kind, filePath) {
  assertInside(publicRoot, filePath);
  const fileStat = await stat(filePath);
  const relativePublicPath = path.relative(publicRoot, filePath).replace(/\\/g, "/");
  return {
    kind,
    name: path.basename(filePath),
    path: path.relative(projectRoot, filePath).replace(/\\/g, "/"),
    url: `/${relativePublicPath}`,
    size: fileStat.size,
    modifiedAt: fileStat.mtime.toISOString()
  };
}

async function createUniqueAssetName(directory, originalName, extension) {
  const base = sanitizeBaseName(path.basename(originalName, path.extname(originalName)));
  const normalizedExtension = extension === ".jpeg" ? ".jpg" : extension;
  for (let index = 0; index < 100; index += 1) {
    const suffix = index ? `-${index + 1}` : "";
    const fileName = `${base}${suffix}${normalizedExtension}`;
    const filePath = path.resolve(directory, fileName);
    assertInside(directory, filePath);
    try {
      await stat(filePath);
    } catch (error) {
      if (error?.code === "ENOENT") return fileName;
      throw error;
    }
  }
  throw new ContentStoreError("ASSET_NAME_CONFLICT", "同名素材太多，请换一个文件名。", 409);
}

function kindForExtension(extension) {
  for (const [kind, config] of Object.entries(assetKinds)) {
    if (config.extensions.has(extension)) return kind;
  }
  return null;
}

function assetDirectory(publicRoot, kind, type, id) {
  const config = assetKinds[kind];
  if (!config) {
    throw new ContentStoreError("INVALID_ASSET_KIND", "不支持的素材类型。", 400);
  }
  const directory = path.resolve(publicRoot, config.directory, contentDirectories[type], id);
  assertInside(publicRoot, directory);
  return directory;
}

function sanitizeBaseName(value) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.slice(0, 60) || `asset-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

function valueAsString(value) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function assertInside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ContentStoreError("PATH_OUTSIDE_CONTENT_ROOT", "请求路径超出素材目录。", 400);
  }
}
