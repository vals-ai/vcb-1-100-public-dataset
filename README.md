# VCB-1-100 Public Sample

This repository holds a sample task from the VCB-1-100 benchmark.

VCB-1-100 measures how well a coding agent maintains a web app over many change requests. Each task starts from a working app. The agent then gets a series of iterations. Each iteration asks for a new feature or a change. Tests check the new behavior and also check that earlier behavior still works.

## Contents

```
data/zeeter/
  base_prompt.md        Original app specification
  task.yaml             Task definition and iteration list
  tests.yaml            Workflows that the evaluator runs
  prompts/
    iteration_1.md ...  Change request for each iteration (6 in total)
  app/                  Starting app (React frontend, Supabase migration, seed script)
```
