# Drawing Tasks - Automatic Student Data Population

## Overview
When a teacher creates a new drawing task, student data automatically appears in the task interface. This document explains how this works.

---

## How It Works

### 1. **Task Creation** 
When a teacher creates a new drawing task via the "New submission" button:

**Endpoint:** `POST /api/drawing-tasks`

```typescript
// Creates task with only basic info
{
  taskName: "Test-4",
  taskDate: "2026-06-19",
  batchId: "supper302",      // ← Key: Batch is selected
  batchName: "supper302",
  createdBy: teacherId
}
```

**Location:** [src/app/api/drawing-tasks/route.ts](src/app/api/drawing-tasks/route.ts#L36-L55)

---

### 2. **Task Details Load**
When the task details page is loaded:

**Endpoint:** `GET /api/drawing-tasks/{taskId}`

Returns:
```json
{
  "task": {
    "id": "...",
    "taskName": "Test-4",
    "taskDate": "2026-06-19",
    "batchId": "supper302",     // ← Batch ID stored with task
    "batchName": "supper302",
    ...
  }
}
```

**Location:** [src/app/api/drawing-tasks/[id]/route.ts](src/app/api/drawing-tasks/[id]/route.ts)

---

### 3. **Students Auto-Load from Batch**
The UI component then automatically fetches students for that batch:

**Endpoint:** `GET /api/teacher/batches/{batchId}/students`

```typescript
// Returns all students in that batch
{
  "students": [
    { 
      "id": "...",
      "studentId": "...",
      "name": "Kshitij hapase",
      "email": "...",
      "phone": "..."
    },
    { 
      "id": "...",
      "studentId": "...",
      "name": "suraj chavhan",
      "email": "...",
      "phone": "..."
    },
    ...
  ]
}
```

**Location:** [src/app/api/teacher/batches/[id]/students/route.ts](src/app/api/teacher/batches/[id]/students/route.ts)

---

### 4. **Where Student Data Comes From**

The students come from the **Batch model**, which has an embedded `students` array:

```typescript
// In Batch model
students: [
  {
    _id: ObjectId,
    studentId: "...",
    studentName: "Kshitij hapase",
    studentEmail: "...",
    phone: "..."
  },
  {
    _id: ObjectId,
    studentId: "...",
    studentName: "suraj chavhan",
    studentEmail: "...",
    phone: "..."
  },
  ...
]
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  Teacher Creates Task (Selects Batch)               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │ POST /api/drawing-  │
        │       tasks         │
        └────────────┬────────┘
                     │
         Creates task with batchId
                     │
                     ▼
        ┌─────────────────────┐
        │ Task loaded in UI    │
        └────────────┬────────┘
                     │
      GET /api/drawing-tasks/{id}
                     │
                     ▼
        ┌──────────────────────────┐
        │ Got taskId + batchId      │
        └────────────┬─────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │ Auto-fetch students for batch │
        └────────────┬─────────────────┘
                     │
        GET /api/teacher/batches/
                {batchId}/students
                     │
                     ▼
        ┌──────────────────────────────┐
        │ Student list shown in table   │
        │ (from batch.students array)   │
        └──────────────────────────────┘
```

---

## UI Implementation

**File:** [src/pages/shared/DrawingTests.tsx](src/pages/shared/DrawingTests.tsx)

### Key Functions:

1. **loadTaskInfo()** (Line ~217)
   - Fetches task details including batchId

2. **loadStudentsForBatch()** (Line ~264)  
   - Automatically called after task loads
   - Fetches students from that batch
   - Populates the dropdown/table

```typescript
async function loadTaskInfo() {
  // Gets taskId and batchId
  const res = await fetch(`/api/drawing-tasks/${taskId}`, ...);
  setTaskInfo(taskData);
  
  // ← Automatically loads students for this batch
  await loadStudentsForBatch(taskData.batchId);
}

async function loadStudentsForBatch(batchId: string) {
  // Gets all students in batch
  const res = await fetch(
    `/api/teacher/batches/${batchId}/students`, 
    ...
  );
  setBatchStudents(students);
}
```

---

## Summary

✅ **Why students automatically appear:**
1. When creating a task, teacher selects a **batch**
2. Task is saved with **batchId**
3. When task loads, **batchId** is retrieved
4. UI automatically fetches **all students in that batch**
5. Students list populates from the **Batch.students array**

**Key:** The batch already contains all enrolled students, so no separate query needed!

---

## Related Collections

| Collection | Field | Purpose |
|-----------|-------|---------|
| `batches` | `students[]` | Embedded array of enrolled students |
| `drawingtasks` | `batchId` | Reference to batch (to get students) |
| `drawings` | `studentId` | Individual student submissions |

---

## Notes

- Students list is **automatically synced** from batch enrollment
- When students are added/removed from batch, they appear/disappear from drawing tasks  
- No manual sync needed - batch is the **single source of truth**
