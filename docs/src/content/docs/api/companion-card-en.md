---
title: Companion Card
description: Detailed specifications for the CompanionCard type
---
`CompanionCard` is a type that defines the configuration settings for a AI companion. It manages metadata, roles, tools, and event conditions in a unified manner.

## Import Statement

```typescript
import type { CompanionCard } from "@aikyo/server";
```

## Type Definition

```typescript
export const CompanionSchema = z.object({
  metadata: MetadataSchema,
  role: z.string(),
  actions: z.record(z.instanceof(Tool)),
  knowledge: z.record(z.instanceof(Tool)),
  events: z.object({
    params: z.record(z.string(), z.any()),
    conditions: z.array(EventCondition),
  }),
});

export type CompanionCard = z.infer<typeof CompanionSchema>;
```

## Fields

### metadata

```typescript
metadata: Metadata
```

Information about the companion's metadata.

```typescript
export const MetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
});

export type Metadata = z.infer<typeof MetadataSchema>;
```

| Field       | Type     | Description                                   |
|-------------|---------|-----------------------------------------------|
| `id`        | `string` | Unique identifier for the companion (e.g., `"companion_aya"`) |
| `name`      | `string` | Visible name (e.g., `"aya"`)                   |
| `personality` | `string` | Character profile settings that the LLM will use for role-playing references. |
| `story`     | `string` | Backstory information                         |
| `sample`    | `string` | Sample response text (used as a reference for the companion's tone) |

**Usage Example:**

```typescript
metadata: {
  id: "companion_aya",
  name: "aya",
  personality:
    "Maintains a calm and cool demeanor, but occasionally shows a slightly clumsy yet endearing side.",
  story:
    "Continues research and creative work in her own freestyle while valuing her personal interests.",
  sample:
    "When I get talking about things I'm interested in, I just lose myself in the subject... though it's a bit embarrassing to admit."",
}
```

### role

```typescript
role: string
```

A string describing the companion's role.

**Usage Example:**

```typescript
role: "You actively engage with other companions and users."
```

### actions

```typescript
actions: Record<string, Tool>
```

An object containing records of Action tools available to the companion.

**Usage Example:**

```typescript
actions: {
  speakTool,
  lightControlAction
}
```

For details on creating Action tools, see the [Action](../tools/action) documentation.

### knowledge

```typescript
knowledge: Record<string, Tool>
```

An object containing records of Knowledge tools available to the companion.

**Usage Example:**

```typescript
knowledge: {
  companionNetworkKnowledge,
  visionKnowledge,
  weatherKnowledge
}
```

For details on creating Knowledge tools, see the [Knowledge](../tools/knowledge) documentation.

### events

```typescript
events: {
  params: JSONSchema;
  conditions: EventCondition[];
}
```

Configuration for event-driven tool execution.

#### events.params

```typescript
params: JSONSchema
```

JSON schema defining parameters that the LLM should evaluate.

**Usage Example:**

```typescript
params: {
  title: "Parameters for you to determine",
  description: "Please assign appropriate values to each field according to the description.",
  type: "object",
  properties: {
    already_replied: {
      description: "Whether this person has already been spoken to before",
      type: "boolean",
    },
    need_response: {
      description: "Whether a response is required",
      type: "boolean",
    },
  },
  required: ["already_replied", "need_response"],
}
```

#### events.conditions

```typescript
conditions: EventCondition[]
```

An array of conditions expressed in CEL syntax along with tool execution configurations.

```typescript
export const EventCondition = z.object({
  expression: z.string(),
  execute: z.array(
    z.object({
      instruction: z.string(),
      tool: z.instanceof(Tool),
    }),
  ),
});
```

| Field       | Type     | Description                                   |
|-------------|---------|-----------------------------------------------|
| `expression` | `string` | CEL expression (e.g., `"need_response == true"`) |
| `execute`   | `array` | Array of instructions and tools to execute when conditions match |
| `execute[].instruction` | `string` | Instruction text for the LLM                     |
| `execute[].tool` | `Tool`  | Tool to be used                                |

**Usage Example:**

```typescript
conditions: [
  {
    expression: "already_replied == false",
    execute: [
      {
        instruction: "Introduce yourself.",
        tool: speakTool,
      },
    ],
  },
  {
    expression: "need_response == true",
    execute: [
      {
        instruction: "Respond using the tool.",
        tool: speakTool,
      },
    ],
  },
]
```