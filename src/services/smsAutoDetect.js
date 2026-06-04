// TODO: implement Android SMS Retriever API when Capacitor/TWA wrapper is added.

/** @returns {boolean} */
export function isSmsAutoDetectSupported() {
  return false;
}

/** @returns {Promise<boolean>} */
export function requestSmsPermission() {
  return Promise.resolve(false);
}
