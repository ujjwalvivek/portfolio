---
title: "Markdown Playground"
date: "2025-07-06"
slug: "log_0001_md_showcase"
summary: "This wasn't supposed to be a post. It was just a sandbox. But it works, so I'm keeping it."
tags: ["debug", "engine", "components", "infra"]
---

```terminalblock
[ SYSTEM DIAGNOSTIC MODE ]  
Testing complete. Everything renders. Mostly.  
You are now inside the markdown engine.
```

---

## Diagnostic Log

This post started as a markdown stress test.  
What you're seeing isn't a blog. It's **evidence**.  
That the engine boots. That the markdown renders.  
That chaos compiles. Again mostly. 

---

## Basic Rendering

**Bold**, *italic*, ***both***, `inline code`, ~~strikethrough~~

- Lists  
- [x] Tasks  
- > Quotes  
- --- Horizontal rules

---

## Code Rendering

### JavaScript

```js
const hello = () => console.log("hello, markdown engine");
```

### TypeScript

```ts
type User = { id: string; email: string };
```

### Python

```python
async def ping(): return "pong"
```

### SQL

```sql
SELECT * FROM logs WHERE status = 'booted';
```

---

## 📊 Tables

| Feature            | Status | Owner  |
|--------------------|--------|--------|
| Markdown Engine    | ✅     | System |
| Blur Layer         | ⚠️     | CSS    |
| Terminal Footer    | 🔄     | You    |

---

## 🧠 Math

Inline: $E=mc^2$

Block:

$$
\mathcal{F}(f) = \int_{-\infty}^\infty f(x)e^{-i\omega x}dx
$$

---

## 🖼 Media & Embeds

![Sample Image](https://images.unsplash.com/photo-1635830510445-7c0edf90c468?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWFya2Rvd258ZW58MHx8MHx8fDA%3D)

---

## ✨ Custom Components

```bash
# deploy
npm run logs:flush && firebase deploy
```

:::note
Every component is just a thought with syntax.
:::

:::warning
Some parts might break. Good. Let them.
:::


> Testing is just building out loud.


---

## Closing Log

This post was never meant to be seen.  
But now that the system renders, I'm logging it.  
Because sometimes a "test" turns out to be the first real thing you ship.

```terminalblock
> commit -m "engine booted"  
[ PUSHING... ✅ ]
```
---