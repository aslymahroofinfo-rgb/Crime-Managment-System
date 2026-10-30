const path = require('path');
const fs = require('fs');

/**
 * Centralized Storage Architecture for Evidence & Uploads
 * 
 * Supports:
 * - Local development: default fallback to backend/uploads
 * - Production cloud hosting (e.g. Render Persistent Disk): configurable via UPLOAD_DIR (e.g. /var/data/uploads)
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '../uploads');

/**
 * Initializes upload directory on server startup
 */
const ensureUploadDir = () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  } catch (err) {
    console.error(`[Storage] Failed to initialize UPLOAD_DIR at ${UPLOAD_DIR}:`, err.message);
  }
};

/**
 * Resolves an evidence filename securely within UPLOAD_DIR
 * Enforces strict path containment against directory traversal attacks (../)
 * 
 * @param {string} fileName
 * @returns {string|null} Canonical absolute path if valid and contained, otherwise null
 */
const resolveEvidencePath = (fileName) => {
  if (!fileName || typeof fileName !== 'string') return null;
  const safeName = path.basename(fileName.replace(/\\/g, '/')).trim();
  if (!safeName) return null;

  const targetPath = path.resolve(UPLOAD_DIR, safeName);
  if (targetPath.startsWith(UPLOAD_DIR + path.sep)) {
    return targetPath;
  }
  return null;
};

/**
 * Safely unlinks a list of evidence files from UPLOAD_DIR
 * 
 * @param {string[]} fileList
 * @returns {number} count of deleted files
 */
const cleanupEvidenceFiles = (fileList) => {
  let deletedCount = 0;
  if (!Array.isArray(fileList)) return deletedCount;

  fileList.forEach((fileName) => {
    try {
      const targetPath = resolveEvidencePath(fileName);
      if (targetPath && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        deletedCount++;
      }
    } catch (err) {
      console.warn(`[Evidence Cleanup] Failed to delete file ${fileName}:`, err.message);
    }
  });

  return deletedCount;
};

module.exports = {
  UPLOAD_DIR,
  ensureUploadDir,
  resolveEvidencePath,
  cleanupEvidenceFiles
};
