const os = require("node:os");

// tsx calls os.userInfo() when Windows does not expose process.geteuid().
// Some restricted Windows environments fail that system lookup, so give its
// temp-directory naming code a harmless test-only username.
os.userInfo = () => ({ username: "nexora-tests" });
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

require("tsx/cjs/api").register();
require("./src/modules/invitations/invitation.service.test.ts");
