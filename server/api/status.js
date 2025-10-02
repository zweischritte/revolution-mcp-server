import { getBootstrap } from "../dist/bootstrap.js";

export default async function handler(req, res) {
  try {
    const { config, state } = await getBootstrap();
    res.status(200).json({
      knowledgeBasePath: config.knowledgeBasePath,
      documentCount: state.catalog.length,
      memoryKeyCount: state.memoryKeys.size
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
