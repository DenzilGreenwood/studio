module.exports = {
  version: "1.0",
  envs: {
    dev: {
      firebase: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-firebase-project-id"
      }
    },
    prod: {
      firebase: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-firebase-project-id"
      }
    }
  }
};
