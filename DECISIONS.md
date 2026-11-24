# Decisions

- Use OpenCode V2 native compaction with `keep.tokens` set to 15000 and a 15% buffer.
- Enable background compaction as an experimental latency optimization.
- Install DCP as the active context-pruning plugin; do not run DCP and Sleev concurrently because Sleev is its stated successor and alternative proxy.
- Keep Supermemory as the persistent memory layer.
- Use ralphctl as the resumable generator-evaluator harness.
- Keep OmO separate from the OpenCode plugin list; it is a separate runtime and command.
- Map systematic-debugging to diagnosing-bugs, test-driven-development to tdd, and architecture-design to improve-codebase-architecture.
- No exact security-review skill was published in the verified catalogs; use secure-workflow-guide only as a documented security-oriented substitute.
