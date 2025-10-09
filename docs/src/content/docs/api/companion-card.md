---
title: Companion Card
description: Detailed specifications for CompanionCard type
---
`CompanionCard` is a type that defines the configuration for an AI companion. It consolidates metadata, roles, tools, and event conditions into a single structure.

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

Contains metadata information about the companion.

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

| Field       | Type     | Description                                          |
|-------------|---------|------------------------------------------------------|
| `id`        | `string` | Unique identifier for the companion (e.g., "companion_aya") |
| `name`      | `string` | Visible name to display (e.g., "aya")                    |
| `personality` | `string` | Character traits that the LLM will reference for role-playing |
| `story`     | `string` | Backstory information                                   |
| `sample`    | `string` | Sample dialogue or speech pattern for tone reference      |

**Example Usage:**

```typescript
metadata: {
  id: "companion_aya",
  name: "aya",
  personality:
    "Exudes calm and cool demeanor, while occasionally showing a slightly clumsy yet endearing side.",
  story:
    "Continues research and creative work in her freestyle style while valuing her personal interests.",
  sample:
    "'When I get talking about things I love, I just lose myself... though it's a little embarrassing.'",
}
```

### role

```typescript
role: string
```

A string describing the companion's role.

**Example Usage:**

```typescript
role: "You actively engage with other companions and users."
```

### actions

```typescript
actions: Record<string, Tool>
```

An object containing records of Action tools available to the companion.

**Example Usage:**

```typescript
actions: {
  speakTool,
  lightControlAction
}
```

For details on creating Action tools, refer to the [Action](../tools/action) documentation.

### knowledge

```typescript
knowledge: Record<string, Tool>
```

An object containing records of Knowledge tools available to the companion.

**Example Usage:**

```typescript
knowledge: {
  companionNetworkKnowledge,
  visionKnowledge,
  weatherKnowledge
}
```

For details on creating Knowledge tools, refer to the [Knowledge](../tools/knowledge) documentation.

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

JSON schema defining the parameters that the LLM should evaluate.

**Example Usage:**

```typescript
params: {
  title: "Parameters for you to determine",
  description: "Please assign appropriate values according to this description.",
  type: "object",
  properties: {
    already_replied: {
      description: "Whether this person has already been spoken to before",
      type: "boolean",
    },
    need_response: {
      description: "Indicates whether a response is required",
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

An array of conditions expressed using CEL expressions along with tool execution configurations.

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

| Field       | Type     | Description                                          |
|-------------|---------|------------------------------------------------------|
| `expression` | `string` | CEL expression (e.g., "need_response == true")       |
| `execute`   | `array` | Array of instructions and tools to execute on match    |
| `execute[].instruction` | `string` | Instruction text for the LLM                         |
| `execute[].tool` | `Tool` | Tool to be used                                       |

**Example Usage:**

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
