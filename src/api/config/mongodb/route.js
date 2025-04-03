const { Session, connectDB } = require('./connection');

async function handler({ action, sessionId, driver_phone } = {}) {
  // Ensure database connection
  await connectDB();

  if (action === "createSession") {
    try {
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await Session.create({
        session_id: sessionId,
        driver_phone
      });
      return { success: true, sessionId };
    } catch (error) {
      return { error: "Failed to create session" };
    }
  }

  if (action === "getSession") {
    try {
      const session = await Session.findOne({
        session_id: sessionId,
        expires_at: { $gt: new Date() }
      });
      return { success: true, session };
    } catch (error) {
      return { error: "Failed to get session" };
    }
  }

  if (action === "validateSession") {
    try {
      const session = await Session.findOne({
        session_id: sessionId,
        expires_at: { $gt: new Date() }
      });
      return { success: true, isValid: !!session };
    } catch (error) {
      return { error: "Failed to validate session" };
    }
  }

  return {
    success: true,
    message: "MongoDB configuration completed successfully"
  };
}

module.exports = handler;