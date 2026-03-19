// Auth logic lives in @unified-admin/core — re-exported here for backwards compatibility.
export {
  getCognitoToken,
  clearCognitoToken,
  initiateCognitoLogin,
  handleCognitoCallback,
} from "@unified-admin/core";
