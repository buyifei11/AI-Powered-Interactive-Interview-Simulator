# Future Goal: Video Interview & Attention Detection

> **Status:** Deferred — not in active development. Preserve this spec for when the core MVP (voice interview + auth + feedback) is stable and launched.
> **Note:** Planned architecture only. Endpoint/schema names in this file may differ from current production flow.

---

## Overview

Expand the interview session to support a video mode where the user's camera is active, simulating a real video interview. While the camera is on, an attention detection layer monitors whether the user appears distracted, looks away from the screen, or breaks eye contact — and factors this into the post-session feedback.

---

## Feature Scope

### Video Interview Mode

- User can toggle "Video Mode" on the interview setup screen.
- When active, the browser requests camera permission alongside microphone.
- The user's video feed is displayed in a small picture-in-picture panel (bottom-right of the interview screen).
- The camera feed is **not sent to the server** — processing happens client-side via MediaPipe or a lightweight model.
- An optional "AI interviewer avatar" panel could be shown on the opposite side (future stretch goal).

### Attention Detection

Detect the following signals client-side using the camera feed:

| Signal | Detection method | Feedback impact |
|---|---|---|
| Looking away from screen | Face landmarks — gaze direction estimation | Flag as "distracted" moment in report |
| Eyes closed for >2s | Eye aspect ratio (blink vs. closed) | Flag as low engagement |
| Face not in frame | Face detection — no face found | Flag as absent/distracted |
| Multiple faces | More than one face detected | Flag as potential external assistance |

Detection runs at low frequency (e.g. every 500ms) to minimize CPU/battery impact.

### Post-Session Report Integration

Add a new section to the feedback report:

- **Attention Score:** 1–10 derived from the percentage of time the user was engaged vs. distracted.
- **Distraction Timeline:** Visual timeline showing moments where attention flags were raised (e.g. "00:45 — looked away for 3s").
- **Suggestion:** If attention score is low, include a specific suggestion: "You looked away from the screen multiple times during the interview. Practice maintaining eye contact with the camera."

---

## Implementation Approach

### Client-Side Face Analysis

Use **MediaPipe FaceDetection** or **MediaPipe FaceMesh** (via the `@mediapipe/face_detection` npm package or the MediaPipe Tasks Vision library):

```typescript
// Pseudo-code: attention polling loop
const detector = await FaceDetector.createFromOptions(vision, {
  baseOptions: { modelAssetPath: '/models/face_detection_short_range.tflite' },
  runningMode: 'VIDEO',
})

setInterval(() => {
  const detections = detector.detectForVideo(videoElement, Date.now())
  const hasface = detections.detections.length === 1
  const isLookingAway = estimateGaze(detections) // custom gaze heuristic
  recordAttentionEvent({ timestamp: Date.now(), hasFace, isLookingAway })
}, 500)
```

Attention events are stored in the `interview-store` during the session and sent to the backend with the `/api/feedback` call.

### No Server-Side Video Processing

Video frames are **never uploaded to the server**. All analysis runs in the browser. This avoids:
- Large data transfer costs
- Privacy concerns around storing video
- GDPR compliance complexity

---

## Privacy Considerations

- On the interview setup screen, if video mode is selected, show an explicit consent notice: "Your camera feed is analyzed locally in your browser to detect attention. No video is recorded or uploaded."
- Camera permission must be explicitly granted — if denied, fall back to voice-only mode gracefully.
- No video is stored anywhere (server or client-side).

---

## Prerequisites Before Building This

- [ ] Core MVP is live (voice interview, auth, feedback report)
- [ ] Video mode toggle on interview setup UI
- [ ] MediaPipe or equivalent library evaluated for accuracy/performance on target devices
- [ ] Attention event schema added to `interview_sessions` or a new `attention_events` table
- [ ] `POST /api/feedback` updated to accept and incorporate attention events into the report
