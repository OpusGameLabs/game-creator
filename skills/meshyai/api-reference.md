# Meshy AI — API Reference

Base URL: `https://api.meshy.ai/openapi`

## Text to 3D

**POST** `/v2/text-to-3d` — Create preview or refine task

Preview payload:
```json
{
  "mode": "preview",
  "prompt": "a cartoon knight with sword and shield",
  "ai_model": "latest",
  "topology": "triangle",
  "target_polycount": 10000
}
```

Refine payload:
```json
{
  "mode": "refine",
  "preview_task_id": "<preview-task-id>",
  "enable_pbr": true,
  "texture_prompt": "hand-painted fantasy style"
}
```

**GET** `/v2/text-to-3d/:id` — Retrieve task (poll this)

Response when complete:
```json
{
  "id": "task-uuid",
  "status": "SUCCEEDED",
  "progress": 100,
  "model_urls": {
    "glb": "https://assets.meshy.ai/...",
    "fbx": "https://assets.meshy.ai/...",
    "obj": "https://assets.meshy.ai/...",
    "usdz": "https://assets.meshy.ai/..."
  },
  "texture_urls": [
    { "base_color": "https://..." }
  ],
  "thumbnail_url": "https://..."
}
```

Optional parameters:
- `ai_model`: `meshy-5`, `meshy-6`, `latest` (default: `latest`)
- `model_type`: `standard` or `lowpoly`
- `topology`: `quad` or `triangle` (default: `triangle`)
- `target_polycount`: 100-300,000 (default: 10,000)
- `symmetry_mode`: `off`, `auto`, `on` (default: `auto`)
- `pose_mode`: `a-pose`, `t-pose`, or empty string
- `enable_pbr`: generates metallic, roughness, and normal maps

## Image to 3D

**POST** `/v1/image-to-3d` — Create task

```json
{
  "image_url": "https://example.com/photo.png",
  "ai_model": "latest",
  "enable_pbr": false,
  "should_texture": true,
  "topology": "triangle",
  "target_polycount": 10000
}
```

**GET** `/v1/image-to-3d/:id` — Retrieve task

Supports `image_url` as public URL, base64 data URI (`data:image/png;base64,...`), or multi-image via **POST** `/v1/multi-image-to-3d` (1-4 images from different angles).

## Rigging

**POST** `/v1/rigging` — Create rigging task

```json
{
  "input_task_id": "<text-to-3d or image-to-3d task id>",
  "height_meters": 1.7
}
```

**GET** `/v1/rigging/:id` — Retrieve task

Result includes:
- `rigged_character_glb_url` — rigged GLB ready for Three.js
- `rigged_character_fbx_url` — rigged FBX
- `basic_animations` — walking/running GLB URLs included free

## Animation

**POST** `/v1/animations` — Create animation task

```json
{
  "rig_task_id": "<rigging-task-id>",
  "action_id": 1
}
```

**GET** `/v1/animations/:id` — Retrieve task

Result includes `animation_glb_url`, `animation_fbx_url`.

## Task Statuses

All tasks progress through: `PENDING` -> `IN_PROGRESS` -> `SUCCEEDED` / `FAILED` / `CANCELED`

Poll at 5-second intervals. Tasks typically complete in 30s-5min depending on complexity.

## Asset Retention

Meshy retains generated assets for **3 days** (unlimited for Enterprise). Download promptly.
